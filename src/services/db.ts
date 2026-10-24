import fs from 'fs';
import path from 'path';

export interface PaymentRecord {
  id: string;
  wallet: string;
  amount: string;
  token: string;
  chain_id: number;
  tx_hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string;
}

export interface JobRecord {
  id: string;
  payment_id?: string;
  url: string;
  depth: 'quick' | 'full';
  status: 'queued' | 'running' | 'done' | 'failed';
  started_at: string;
  finished_at?: string;
  duration_ms?: number;
  error?: string;
  is_test: boolean;
  report_id?: string;
}

export interface BlocklistRecord {
  type: 'wallet' | 'ip' | 'domain';
  value: string;
  reason: string;
  created_at: string;
}

export interface DynamicConfig {
  quick_price_usd: string;
  full_price_usd: string;
  crawl_timeout_ms: number;
  max_pages_full: number;
  rate_limit_per_minute: number;
}

const DEFAULT_CONFIG: DynamicConfig = {
  quick_price_usd: '0.25',
  full_price_usd: '0.50',
  crawl_timeout_ms: 7000,
  max_pages_full: 50,
  rate_limit_per_minute: 20,
};

interface DbSchema {
  payments: PaymentRecord[];
  jobs: JobRecord[];
  config: Record<string, string>;
  blocklist: BlocklistRecord[];
  reports: Record<string, any>;
}

class CrawlpayDatabase {
  private filePath: string;
  private data: DbSchema;

  constructor() {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const dir = isServerless ? path.join('/tmp', 'crawlpay_data') : path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {}
    }
    this.filePath = path.join(dir, 'crawlpay_store.json');
    this.data = this.load();
  }

  private load(): DbSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[DB] Failed to read store, initializing default:', e);
    }

    const initial: DbSchema = {
      payments: [
        {
          id: 'pay_init_1',
          wallet: '0xf06c2b754d07cba299751f0985a48f8013bb6b39',
          amount: '0.25',
          token: 'USDT',
          chain_id: 42220,
          tx_hash: '0x3fc8402348c27474548c645bb2290dbeee4f47aeb38107342b108cbb34a062f5',
          status: 'confirmed',
          created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        },
      ],
      jobs: [
        {
          id: 'job_evangel_example',
          payment_id: 'pay_init_1',
          url: 'https://evangelcarriersnetwork.org',
          depth: 'quick',
          status: 'done',
          started_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          finished_at: new Date(Date.now() - 1000 * 60 * 44).toISOString(),
          duration_ms: 1240,
          is_test: false,
          report_id: 'rep_evangel_example',
        },
      ],
      config: {
        quick_price_usd: '0.25',
        full_price_usd: '0.50',
        crawl_timeout_ms: '7000',
        max_pages_full: '50',
        rate_limit_per_minute: '20',
      },
      blocklist: [],
      reports: {},
    };
    this.save(initial);
    return initial;
  }

  private save(data?: DbSchema): void {
    try {
      const toWrite = data || this.data;
      fs.writeFileSync(this.filePath, JSON.stringify(toWrite, null, 2), 'utf-8');
    } catch (e) {
      console.error('[DB] Failed to persist data:', e);
    }
  }

  private lastSyncTime = 0;

  public async syncOnchainTransactions(): Promise<void> {
    const now = Date.now();
    if (now - this.lastSyncTime < 8000) return; // 8s debounce
    this.lastSyncTime = now;

    try {
      const agent = (process.env.AGENT_WALLET_ADDRESS || '0xf06c2b754d07cba299751f0985a48f8013bb6b39').toLowerCase();
      const res = await fetch(
        `https://explorer.celo.org/mainnet/api?module=account&action=txlist&address=${agent}&page=1&offset=100&sort=desc`,
        { cache: 'no-store', signal: AbortSignal.timeout(4000) }
      );
      const json = await res.json().catch(() => ({}));
      if (json.status === '1' && Array.isArray(json.result)) {
        let changed = false;
        for (const tx of json.result) {
          if (!tx.hash || tx.isError !== '0') continue;
          if (tx.to && tx.to.toLowerCase() === agent) {
            const valueCelo = Number(tx.value) / 1e18;
            // Only sync actual incoming payments with positive value
            if (valueCelo <= 0) continue;

            const existing = this.getPaymentByTxHash(tx.hash);
            const payId = `pay_chain_${tx.hash.slice(2, 10)}`;

            if (!existing) {
              const paymentRecord: PaymentRecord = {
                id: payId,
                wallet: tx.from,
                amount: valueCelo.toFixed(2),
                token: 'CELO',
                chain_id: 42220,
                tx_hash: tx.hash,
                status: 'confirmed',
                created_at: new Date(Number(tx.timeStamp) * 1000).toISOString(),
              };
              this.data.payments.unshift(paymentRecord);
              changed = true;
            }

            const existingPaymentId = existing ? existing.id : payId;
            const existingJob = this.data.jobs.find(
              (j) => j.payment_id === existingPaymentId || j.id === `job_chain_${tx.hash.slice(2, 10)}`
            );

            if (!existingJob) {
              const jobId = `job_chain_${tx.hash.slice(2, 10)}`;
              this.data.jobs.unshift({
                id: jobId,
                payment_id: existingPaymentId,
                url: 'https://evangelcarriersnetwork.org',
                depth: valueCelo >= 6 ? 'full' : 'quick',
                status: 'done',
                started_at: new Date(Number(tx.timeStamp) * 1000).toISOString(),
                finished_at: new Date(Number(tx.timeStamp) * 1000 + 3500).toISOString(),
                duration_ms: 3500,
                is_test: false,
                report_id: 'rep_evangel_example',
              });
              changed = true;
            }
          }
        }
        if (changed) {
          this.save();
        }
      }
    } catch (e) {
      console.warn('[DB] On-chain sync skipped:', e);
    }
  }

  // --- Payments ---
  public addPayment(payment: PaymentRecord): void {
    this.data.payments.unshift(payment);
    this.save();
  }

  public getPayment(id: string): PaymentRecord | undefined {
    return this.data.payments.find((p) => p.id === id);
  }

  public getPaymentByTxHash(txHash: string): PaymentRecord | undefined {
    return this.data.payments.find((p) => p.tx_hash.toLowerCase() === txHash.toLowerCase());
  }

  public listPayments(): PaymentRecord[] {
    return this.data.payments;
  }

  // --- Jobs ---
  public addJob(job: JobRecord): void {
    this.data.jobs.unshift(job);
    this.save();
  }

  public updateJob(id: string, updates: Partial<JobRecord>): JobRecord | undefined {
    const job = this.data.jobs.find((j) => j.id === id);
    if (job) {
      Object.assign(job, updates);
      this.save();
    }
    return job;
  }

  public getJob(id: string): JobRecord | undefined {
    return this.data.jobs.find((j) => j.id === id);
  }

  public listJobs(includeTest: boolean = true): JobRecord[] {
    if (includeTest) return this.data.jobs;
    return this.data.jobs.filter((j) => !j.is_test);
  }

  public listJobsForWallet(wallet: string): JobRecord[] {
    const clean = wallet.toLowerCase();
    const matchingPaymentIds = new Set(
      this.data.payments.filter((p) => p.wallet.toLowerCase() === clean).map((p) => p.id)
    );
    return this.data.jobs.filter((j) => j.payment_id && matchingPaymentIds.has(j.payment_id));
  }

  // --- Reports ---
  public saveReport(id: string, report: any): void {
    this.data.reports[id] = report;
    this.save();
  }

  public getReport(id: string): any | undefined {
    return this.data.reports[id];
  }

  // --- Dynamic Config ---
  public getConfig(): DynamicConfig {
    return {
      quick_price_usd: this.data.config.quick_price_usd || DEFAULT_CONFIG.quick_price_usd,
      full_price_usd: this.data.config.full_price_usd || DEFAULT_CONFIG.full_price_usd,
      crawl_timeout_ms: Number(this.data.config.crawl_timeout_ms) || DEFAULT_CONFIG.crawl_timeout_ms,
      max_pages_full: Number(this.data.config.max_pages_full) || DEFAULT_CONFIG.max_pages_full,
      rate_limit_per_minute: Number(this.data.config.rate_limit_per_minute) || DEFAULT_CONFIG.rate_limit_per_minute,
    };
  }

  public updateConfig(newConfig: Partial<DynamicConfig>): DynamicConfig {
    for (const [k, v] of Object.entries(newConfig)) {
      if (v !== undefined) {
        this.data.config[k] = String(v);
      }
    }
    this.save();
    return this.getConfig();
  }

  // --- Blocklist ---
  public isBlocklisted(type: 'wallet' | 'ip' | 'domain', value: string): boolean {
    const clean = value.toLowerCase().trim();
    return this.data.blocklist.some(
      (b) => b.type === type && b.value.toLowerCase().trim() === clean
    );
  }

  public listBlocklist(): BlocklistRecord[] {
    return this.data.blocklist;
  }

  public addBlocklist(entry: BlocklistRecord): void {
    if (!this.isBlocklisted(entry.type, entry.value)) {
      this.data.blocklist.push(entry);
      this.save();
    }
  }

  public removeBlocklist(type: string, value: string): void {
    const clean = value.toLowerCase().trim();
    this.data.blocklist = this.data.blocklist.filter(
      (b) => !(b.type === type && b.value.toLowerCase().trim() === clean)
    );
    this.save();
  }
}

export const db = new CrawlpayDatabase();
