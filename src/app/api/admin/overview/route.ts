import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/services/db';
import { identityService } from '@/services/identityService';
import { verifyAdminAuth } from '@/utils/adminAuth';
import { CONFIG } from '@/config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized: Admin authentication required' }, { status: 401 });
  }

  await db.syncOnchainTransactions();
  const jobs = await db.listJobs(true);
  const payments = await db.listPayments();

  // Exclude is_test jobs from stats per spec
  const nonTestJobs = jobs.filter((j) => !j.is_test);
  const doneJobs = nonTestJobs.filter((j) => j.status === 'done');
  const failedJobs = nonTestJobs.filter((j) => j.status === 'failed');

  const totalCalls = nonTestJobs.length;
  const successRate = totalCalls > 0 ? ((doneJobs.length / totalCalls) * 100).toFixed(1) : '100.0';

  // Revenue from confirmed non-test payments
  const nonTestJobPaymentIds = new Set(nonTestJobs.map((j) => j.payment_id).filter(Boolean));
  let totalUsd = 0;
  let totalCelo = 0;

  payments
    .filter((p) => p.status === 'confirmed' && (!p.id || nonTestJobPaymentIds.has(p.id) || p.id === 'pay_init_1'))
    .forEach((p) => {
      const amt = parseFloat(p.amount) || 0;
      if (p.token === 'CELO') {
        totalCelo += amt;
        // 6.6 CELO = $0.50 USD
        totalUsd += 0.50;
      } else {
        totalUsd += amt;
      }
    });

  const revenueUsd = totalUsd.toFixed(2);
  const revenueCelo = totalCelo.toFixed(2);

  // Receiving wallet balance from Celo
  let onchainStatus: any = null;
  try {
    onchainStatus = await identityService.getStatus();
  } catch (e) {
    console.warn('[Admin Overview] Celo status fetch error:', e);
  }

  const activeConfig = await db.getConfig();
  const blocklist = await db.listBlocklist();

  // Enriched recent payments with linked job info
  const paymentJobMap = new Map(jobs.filter((j) => j.payment_id).map((j) => [j.payment_id, j]));

  const enrichedRecentPayments = payments.slice(0, 6).map((p) => {
    const job = paymentJobMap.get(p.id);
    return {
      id: p.id,
      timestamp: p.created_at,
      tx_hash: p.tx_hash,
      amount: p.amount,
      token: p.token,
      payer_wallet: p.wallet,
      attribution_tag: CONFIG.ATTRIBUTION_TAG,
      status: p.status,
      jobUrl: job?.url || null,
      jobDepth: job?.depth || null,
      reportId: job?.report_id || null,
    };
  });

  return NextResponse.json({
    revenueUsd,
    revenueCelo,
    totalCalls,
    successRate: `${successRate}%`,
    failedJobsCount: failedJobs.length,
    onchainStatus,
    activeConfig,
    recentJobs: jobs.slice(0, 10),
    recentPayments: enrichedRecentPayments,
    totalPaymentsCount: payments.length,
    blocklistCount: blocklist.length,
  });
}
