/**
 * Single Source of Truth for CrawlPay Admin Telemetry & Metrics.
 * Reconciles database rows, on-chain transactions, and verified customer payments.
 * Zero duplicate calculations, zero fabrication, strict token precision.
 */

import { db, PaymentRecord, JobRecord, SavedReportRecord, isDemoRecord } from './db';
import { identityService, OnchainIdentityStatus } from './identityService';
import { CONFIG } from '../config';
import { formatUsd, formatTokenAmount, maskAddress, maskTxHash } from '../utils/currency';

export interface AdminMetricsSummary {
  revenueUsd: string;
  revenueUsdRaw: number;
  customerPaymentsCount: number;
  gasRefuelsCelo: string;
  gasRefuelsCount: number;
  totalAudits: number;
  completedAudits: number;
  failedAudits: number;
  runningAudits: number;
  successRate: string;
  productionJobsCount: number;
  sandboxJobsCount: number;
  reportsCount: number;
  blocklistCount: number;
  onchainStatus: OnchainIdentityStatus | null;
  agentWallet: string;
  lastSyncIso: string;
}

export interface EnrichedAdminPayment extends PaymentRecord {
  isCustomerPayment: boolean;
  isGasRefuel: boolean;
  formattedAmount: string;
  maskedWallet: string;
  maskedTx: string;
  celoscanUrl: string;
  job?: {
    id: string;
    url: string;
    depth: 'quick' | 'full';
    status: string;
    report_id?: string;
  } | null;
}

export interface EnrichedAdminJob extends JobRecord {
  durationFormatted: string;
  startedAtFormatted: string;
  maskedWallet: string;
  hasReport: boolean;
}

export class AdminService {
  /**
   * Retrieves full unified admin telemetry from the single authoritative source
   */
  public async getOverview(includeTest: boolean = false): Promise<{
    metrics: AdminMetricsSummary;
    recentJobs: EnrichedAdminJob[];
    recentPayments: EnrichedAdminPayment[];
    allPayments?: EnrichedAdminPayment[];
  }> {
    // 1. Sync any new onchain transactions from Celo Blockscout asynchronously
    db.syncOnchainTransactions().catch((err: any) => {
      console.warn('[AdminService] Onchain sync notice:', err?.message);
    });

    // 2. Load all raw records concurrently
    const [allPayments, allJobs, allReports, blocklist, onchainStatus] = await Promise.all([
      db.listPayments(includeTest),
      db.listJobs(true),
      db.listReportsForWallet(),
      db.listBlocklist(),
      identityService.getStatus().catch(() => null),
    ]);

    // 3. Classify and reconcile payments
    // A payment is a REAL customer payment ONLY if:
    // - status is 'confirmed'
    // - token is USDT / USD₮ (or cUSD)
    // - not a test/sandbox mock payment (unless includeTest is true)
    let totalUsdRevenue = 0;
    let customerPaymentsCount = 0;
    let totalGasRefuelsCelo = 0;
    let gasRefuelsCount = 0;

    const classifiedPayments: EnrichedAdminPayment[] = [];
    const jobByPaymentId = new Map(allJobs.filter((j) => j.payment_id).map((j) => [j.payment_id, j]));
    const jobByTxHash = new Map(
      allJobs
        .filter((j) => j.payment_id || j.id.startsWith('job_chain_'))
        .map((j) => [j.id.replace('job_chain_', ''), j])
    );

    for (const p of allPayments) {
      if (p.status !== 'confirmed') continue;

      const isTestPayment = Boolean(p.is_test || isDemoRecord(p));
      if (isTestPayment && !includeTest) {
        continue;
      }

      const tokenUpper = (p.token || 'USDT').toUpperCase();
      const numAmount = parseFloat(p.amount) || 0;

      // Classify as customer audit payment vs operational gas transfer
      const isUsdtStable = tokenUpper === 'USDT' || tokenUpper === 'USD₮' || tokenUpper === 'CUSD';
      const isCustomerPayment = isUsdtStable;

      if (isCustomerPayment) {
        totalUsdRevenue += numAmount;
        customerPaymentsCount++;
      } else if (tokenUpper === 'CELO') {
        if (numAmount > 0 || p.type === 'gas_refuel') {
          totalGasRefuelsCelo += numAmount;
          gasRefuelsCount++;
        }
      }

      // Link corresponding job
      const hashKey = p.tx_hash ? p.tx_hash.toLowerCase().slice(2, 10) : '';
      const linkedJob = (p.id ? jobByPaymentId.get(p.id) : null) || (hashKey ? jobByTxHash.get(hashKey) : null);

      classifiedPayments.push({
        ...p,
        isCustomerPayment,
        isGasRefuel: tokenUpper === 'CELO' && (numAmount > 0 || p.type === 'gas_refuel'),
        formattedAmount: isUsdtStable ? formatUsd(numAmount) : formatTokenAmount(numAmount, tokenUpper),
        maskedWallet: maskAddress(p.wallet),
        maskedTx: maskTxHash(p.tx_hash),
        celoscanUrl: p.tx_hash ? `https://celoscan.io/tx/${p.tx_hash}` : '',
        job: linkedJob
          ? {
              id: linkedJob.id,
              url: linkedJob.url,
              depth: linkedJob.depth,
              status: linkedJob.status,
              report_id: linkedJob.report_id,
            }
          : null,
      });
    }

    // 4. Classify and reconcile jobs
    const productionJobs = allJobs.filter((j) => !j.is_test && !isDemoRecord(j));
    const sandboxJobs = allJobs.filter((j) => Boolean(j.is_test || isDemoRecord(j)));
    const activeJobs = includeTest ? allJobs : productionJobs;

    const completedAudits = activeJobs.filter((j) => j.status === 'done').length;
    const failedAudits = activeJobs.filter((j) => j.status === 'failed').length;
    const runningAudits = activeJobs.filter((j) => j.status === 'running' || j.status === 'queued').length;
    const totalAudits = activeJobs.length;

    const successRate = totalAudits > 0 ? ((completedAudits / totalAudits) * 100).toFixed(1) : '100.0';

    const enrichedRecentJobs: EnrichedAdminJob[] = activeJobs.slice(0, 15).map((j) => ({
      ...j,
      durationFormatted: j.duration_ms ? `${(j.duration_ms / 1000).toFixed(1)}s` : '—',
      startedAtFormatted: new Date(j.started_at).toLocaleString(),
      maskedWallet: maskAddress(j.wallet),
      hasReport: Boolean(j.report_id),
    }));

    // 5. Reports count
    const productionReports = allReports.filter((r) => !r.id.includes('test') && !r.id.includes('sandbox') && !isDemoRecord(r));
    const reportsCount = includeTest ? allReports.length : productionReports.length;

    const metrics: AdminMetricsSummary = {
      revenueUsd: totalUsdRevenue.toFixed(2),
      revenueUsdRaw: totalUsdRevenue,
      customerPaymentsCount,
      gasRefuelsCelo: totalGasRefuelsCelo.toFixed(4),
      gasRefuelsCount,
      totalAudits,
      completedAudits,
      failedAudits,
      runningAudits,
      successRate: `${successRate}%`,
      productionJobsCount: productionJobs.length,
      sandboxJobsCount: sandboxJobs.length,
      reportsCount,
      blocklistCount: blocklist.length,
      onchainStatus,
      agentWallet: CONFIG.AGENT_WALLET_ADDRESS,
      lastSyncIso: new Date().toISOString(),
    };

    return {
      metrics,
      recentJobs: enrichedRecentJobs,
      recentPayments: classifiedPayments.slice(0, 15),
      allPayments: classifiedPayments,
    };
  }

  /**
   * Retrieves the full ledger of payments with explicit categorization
   */
  public async getPayments(includeTest: boolean = false): Promise<{
    payments: EnrichedAdminPayment[];
    totalUsd: string;
    totalCelo: string;
    customerCount: number;
    gasRefuelCount: number;
  }> {
    const overview = await this.getOverview(includeTest);
    const payments = overview.allPayments || overview.recentPayments;

    return {
      payments,
      totalUsd: overview.metrics.revenueUsd,
      totalCelo: overview.metrics.gasRefuelsCelo,
      customerCount: overview.metrics.customerPaymentsCount,
      gasRefuelCount: overview.metrics.gasRefuelsCount,
    };
  }

  /**
   * Retrieves all jobs with strict filtering
   */
  public async getJobs(options?: {
    includeTest?: boolean;
    status?: string;
    search?: string;
    limit?: number;
  }): Promise<{
    jobs: EnrichedAdminJob[];
    totalCount: number;
    productionCount: number;
    sandboxCount: number;
    doneCount: number;
    failedCount: number;
  }> {
    const allJobs = await db.listJobs(true);

    const productionJobs = allJobs.filter((j) => !j.is_test && !isDemoRecord(j));
    const sandboxJobs = allJobs.filter((j) => Boolean(j.is_test || isDemoRecord(j)));

    let filtered = options?.includeTest ? allJobs : productionJobs;

    if (options?.status && options.status !== 'all') {
      filtered = filtered.filter((j) => j.status === options.status);
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      filtered = filtered.filter(
        (j) =>
          j.url.toLowerCase().includes(q) ||
          (j.wallet && j.wallet.toLowerCase().includes(q)) ||
          j.id.toLowerCase().includes(q)
      );
    }

    const enriched: EnrichedAdminJob[] = filtered.slice(0, options?.limit || 100).map((j) => ({
      ...j,
      durationFormatted: j.duration_ms ? `${(j.duration_ms / 1000).toFixed(1)}s` : '—',
      startedAtFormatted: new Date(j.started_at).toLocaleString(),
      maskedWallet: maskAddress(j.wallet),
      hasReport: Boolean(j.report_id),
    }));

    return {
      jobs: enriched,
      totalCount: filtered.length,
      productionCount: productionJobs.length,
      sandboxCount: sandboxJobs.length,
      doneCount: filtered.filter((j) => j.status === 'done').length,
      failedCount: filtered.filter((j) => j.status === 'failed').length,
    };
  }
}

export const adminService = new AdminService();
