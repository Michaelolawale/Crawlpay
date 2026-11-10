import { getSupabaseAdminClient, isSupabaseConfigured } from './supabase';

export interface PaymentRecord {
  id: string;
  wallet: string;
  amount: string;
  token: string;
  chain_id: number;
  tx_hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  is_test?: boolean;
  type?: 'customer_payment' | 'gas_refuel' | 'ping' | 'deployment' | 'agent_sponsored';
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
  wallet?: string;
  ip?: string;
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

export interface SavedReportRecord {
  id: string;
  job_id?: string;
  target_url: string;
  wallet?: string;
  mode: 'quick' | 'full';
  report_data: any;
  created_at: string;
}

const DEFAULT_CONFIG: DynamicConfig = {
  quick_price_usd: '0.00',
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
  private inMemoryData: DbSchema;
  private hasInitializedFromSupabase = false;
  private lastSyncTime = 0;
  private freeAuditTracker: Map<string, number[]> = new Map();

  constructor() {
    this.inMemoryData = {
      payments: [
        {
          id: 'pay_init_1',
          wallet: '0xf06c2b754d07cba299751f0985a48f8013bb6b39',
          amount: '0.50',
          token: 'USDT',
          chain_id: 42220,
          tx_hash: '0x3fc8402348c27474548c645bb2290dbeee4f47aeb38107342b108cbb34a062f5',
          status: 'confirmed',
          is_test: true,
          type: 'customer_payment',
          created_at: '2026-10-25T12:00:00.000Z',
        },
      ],
      jobs: [
        {
          id: 'job_evangel_example',
          payment_id: 'pay_init_1',
          url: 'https://evangelcarriersnetwork.org',
          depth: 'full',
          status: 'done',
          started_at: '2026-10-25T12:00:00.000Z',
          finished_at: '2026-10-25T12:00:03.500Z',
          duration_ms: 3500,
          is_test: true,
          report_id: 'rep_evangel_example',
        },
      ],
      config: {
        quick_price_usd: '0.00',
        full_price_usd: '0.50',
        crawl_timeout_ms: '7000',
        max_pages_full: '50',
        rate_limit_per_minute: '20',
      },
      blocklist: [],
      reports: {},
    };

    // Asynchronously bootstrap cache from Supabase if configured
    if (isSupabaseConfigured()) {
      this.initFromSupabase().catch((err) => {
        console.warn('[DB] Supabase bootstrap background warning:', err?.message);
      });
    }
  }

  /**
   * Warm-up and load all persistent data from Supabase
   */
  public async initFromSupabase(): Promise<void> {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return;

    try {
      const [paymentsRes, jobsRes, configRes, blocklistRes] = await Promise.allSettled([
        supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('jobs').select('*').order('started_at', { ascending: false }).limit(200),
        supabase.from('config').select('*'),
        supabase.from('blocklist').select('*'),
      ]);

      if (paymentsRes.status === 'fulfilled' && paymentsRes.value.data) {
        this.inMemoryData.payments = paymentsRes.value.data as PaymentRecord[];
      }

      if (jobsRes.status === 'fulfilled' && jobsRes.value.data) {
        this.inMemoryData.jobs = (jobsRes.value.data as any[]).map((j) => {
          if (!j.ip && j.wallet && j.wallet.startsWith('ip_')) {
            j.ip = j.wallet.slice(3).replace(/_/g, '.');
          }
          return j as JobRecord;
        });
      }

      if (configRes.status === 'fulfilled' && configRes.value.data) {
        for (const item of configRes.value.data) {
          if (item.key && item.value) {
            this.inMemoryData.config[item.key] = item.value;
          }
        }
      }

      if (blocklistRes.status === 'fulfilled' && blocklistRes.value.data) {
        this.inMemoryData.blocklist = blocklistRes.value.data.map((b: any) => ({
          type: b.type,
          value: b.value,
          reason: b.reason,
          created_at: b.created_at,
        }));
      }

      this.hasInitializedFromSupabase = true;
    } catch (e) {
      console.warn('[DB] Failed initial sync from Supabase:', e);
    }
  }

  /**
   * Syncs real incoming Celo Mainnet transactions to AGENT_WALLET_ADDRESS
   */
  public async syncOnchainTransactions(force = false): Promise<void> {
    const now = Date.now();
    if (!force && now - this.lastSyncTime < 30000) return; // 30s debounce to prevent rate-limiting
    this.lastSyncTime = now;

    try {
      const agent = (process.env.AGENT_WALLET_ADDRESS || '0xf06c2b754d07cba299751f0985a48f8013bb6b39').toLowerCase();
      
      const [existingPayments, existingJobs] = await Promise.all([
        this.listPayments(),
        this.listJobs(true),
      ]);
      const existingTxHashes = new Set(existingPayments.map((p) => p.tx_hash?.toLowerCase()).filter(Boolean));
      const existingJobIds = new Set(existingJobs.map((j) => j.id));

      // 1. Fetch ERC-20 token transfers (USDT micropayments, cUSD, etc.)
      try {
        const tokenRes = await fetch(
          `https://celo.blockscout.com/api?module=account&action=tokentx&address=${agent}&page=1&offset=50&sort=desc`,
          { cache: 'no-store', signal: AbortSignal.timeout(6000) }
        );
        const tokenJson = await tokenRes.json().catch(() => ({}));
        if (tokenJson.status === '1' && Array.isArray(tokenJson.result)) {
          for (const tx of tokenJson.result) {
            if (!tx.hash) continue;
            const cleanHash = tx.hash.toLowerCase();
            if (tx.to && tx.to.toLowerCase() === agent && !existingTxHashes.has(cleanHash)) {
              const symbol = (tx.tokenSymbol || 'USDT').toUpperCase();
              const decimals = Number(tx.tokenDecimal) || (symbol === 'USDT' ? 6 : 18);
              const rawAmount = Number(tx.value) / Math.pow(10, decimals);
              if (rawAmount <= 0) continue;

              const payId = `pay_chain_${cleanHash.slice(2, 10)}`;
              const paymentRecord: PaymentRecord = {
                id: payId,
                wallet: tx.from,
                amount: rawAmount < 0.01 ? rawAmount.toFixed(4) : rawAmount.toFixed(2),
                token: symbol,
                chain_id: 42220,
                tx_hash: tx.hash,
                status: 'confirmed',
                type: 'customer_payment',
                is_test: false,
                created_at: new Date(Number(tx.timeStamp) * 1000).toISOString(),
              };
              await this.addPayment(paymentRecord);
              existingTxHashes.add(cleanHash);
            }
          }
        }
      } catch (errToken: any) {
        console.warn('[DB] Blockscout tokentx notice:', errToken?.message || 'Sync paused');
      }

      // 2. Fetch Native Celo and Attributed Calls (action=txlist)
      // Categorized as operational gas refuels or agent pings (NOT customer revenue)
      try {
        const txListRes = await fetch(
          `https://celo.blockscout.com/api?module=account&action=txlist&address=${agent}&page=1&offset=50&sort=desc`,
          { cache: 'no-store', signal: AbortSignal.timeout(6000) }
        );
        const txListJson = await txListRes.json().catch(() => ({}));
        if (txListJson.status === '1' && Array.isArray(txListJson.result)) {
          for (const tx of txListJson.result) {
            if (!tx.hash || tx.isError !== '0') continue;
            const cleanHash = tx.hash.toLowerCase();

            // Incoming native CELO transfer (gas refuel / wallet funding)
            if (tx.to && tx.to.toLowerCase() === agent && Number(tx.value) > 0 && !existingTxHashes.has(cleanHash)) {
              const valueCelo = Number(tx.value) / 1e18;
              const payId = `pay_gas_${cleanHash.slice(2, 10)}`;
              const paymentRecord: PaymentRecord = {
                id: payId,
                wallet: tx.from,
                amount: valueCelo.toFixed(4),
                token: 'CELO',
                chain_id: 42220,
                tx_hash: tx.hash,
                status: 'confirmed',
                type: 'gas_refuel',
                is_test: false,
                created_at: new Date(Number(tx.timeStamp) * 1000).toISOString(),
              };
              await this.addPayment(paymentRecord);
              existingTxHashes.add(cleanHash);
            }

            // Attributed heartbeat ping / agent free broadcast (--sponsored)
            if (tx.from && tx.from.toLowerCase() === agent && tx.input && tx.input.includes('63656c6f5f373537633261633362373063')) {
              const jobId = `job_ping_${cleanHash.slice(2, 10)}`;
              if (!existingJobIds.has(jobId)) {
                await this.addJob({
                  id: jobId,
                  url: 'Attributed Agent Broadcast (ERC-8021) --sponsored',
                  depth: 'quick',
                  status: 'done',
                  started_at: new Date(Number(tx.timeStamp) * 1000).toISOString(),
                  finished_at: new Date(Number(tx.timeStamp) * 1000).toISOString(),
                  duration_ms: 680,
                  wallet: tx.from,
                  is_test: false,
                });
                existingJobIds.add(jobId);
              }

              if (!existingTxHashes.has(cleanHash)) {
                const payId = `pay_sponsored_${cleanHash.slice(2, 10)}`;
                await this.addPayment({
                  id: payId,
                  wallet: tx.from,
                  amount: '0.00',
                  token: 'CELO',
                  chain_id: 42220,
                  tx_hash: tx.hash,
                  status: 'confirmed',
                  type: 'agent_sponsored',
                  is_test: false,
                  created_at: new Date(Number(tx.timeStamp) * 1000).toISOString(),
                });
                existingTxHashes.add(cleanHash);
              }
            }
          }
        }
      } catch (errTxList: any) {
        console.warn('[DB] Blockscout txlist notice:', errTxList?.message || 'Sync paused');
      }
    } catch (e: any) {
      console.warn('[DB] On-chain sync notice:', e?.message || 'Sync paused');
    }
  }

  // ==========================================
  // --- Payments ---
  // ==========================================
  public async addPayment(payment: PaymentRecord): Promise<void> {
    // Update local cache
    const existingIdx = this.inMemoryData.payments.findIndex(
      (p) => p.id === payment.id || p.tx_hash.toLowerCase() === payment.tx_hash.toLowerCase()
    );
    if (existingIdx >= 0) {
      this.inMemoryData.payments[existingIdx] = payment;
    } else {
      this.inMemoryData.payments.unshift(payment);
    }

    // Persist to Supabase
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        await supabase.from('payments').upsert({
          id: payment.id,
          wallet: payment.wallet.toLowerCase(),
          amount: payment.amount,
          token: payment.token || 'CELO',
          chain_id: payment.chain_id || 42220,
          tx_hash: payment.tx_hash.toLowerCase(),
          status: payment.status || 'confirmed',
          created_at: payment.created_at || new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[DB] Supabase addPayment error:', err);
      }
    }
  }

  public async getPayment(id: string): Promise<PaymentRecord | undefined> {
    const cached = this.inMemoryData.payments.find((p) => p.id === id);
    if (cached) return cached;

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('payments').select('*').eq('id', id).maybeSingle();
        if (!error && data) {
          const rec = data as PaymentRecord;
          this.inMemoryData.payments.unshift(rec);
          return rec;
        }
      } catch { }
    }
    return undefined;
  }

  public async getPaymentByTxHash(txHash: string): Promise<PaymentRecord | undefined> {
    const clean = txHash.toLowerCase().trim();
    const cached = this.inMemoryData.payments.find((p) => p.tx_hash.toLowerCase() === clean);
    if (cached) return cached;

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('payments').select('*').eq('tx_hash', clean).maybeSingle();
        if (!error && data) {
          const rec = data as PaymentRecord;
          this.inMemoryData.payments.unshift(rec);
          return rec;
        }
      } catch { }
    }
    return undefined;
  }

  public async listPayments(): Promise<PaymentRecord[]> {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);
        if (!error && data) {
          const records = data as PaymentRecord[];
          for (const item of records) {
            const idx = this.inMemoryData.payments.findIndex((p) => p.id === item.id);
            if (idx >= 0) {
              this.inMemoryData.payments[idx] = item;
            } else {
              this.inMemoryData.payments.push(item);
            }
          }
        }
      } catch (err) {
        console.warn('[DB] Supabase listPayments fallback:', err);
      }
    }
    return [...this.inMemoryData.payments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  // ==========================================
  // --- Jobs ---
  // ==========================================
  public async addJob(job: JobRecord): Promise<void> {
    const existingIdx = this.inMemoryData.jobs.findIndex((j) => j.id === job.id);
    if (existingIdx >= 0) {
      this.inMemoryData.jobs[existingIdx] = job;
    } else {
      this.inMemoryData.jobs.unshift(job);
    }

    const effectiveWallet = job.wallet || (job.ip ? `ip_${job.ip.replace(/[^a-zA-Z0-9]/g, '_')}` : null);

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        await supabase.from('jobs').upsert({
          id: job.id,
          payment_id: job.payment_id || null,
          url: job.url,
          depth: job.depth,
          status: job.status,
          started_at: job.started_at,
          finished_at: job.finished_at || null,
          duration_ms: job.duration_ms || null,
          error: job.error || null,
          is_test: Boolean(job.is_test),
          report_id: job.report_id || null,
          wallet: effectiveWallet ? effectiveWallet.toLowerCase() : null,
          ip: job.ip || null,
        });
      } catch (err) {
        console.warn('[DB] Supabase addJob error:', err);
      }
    }
  }

  public async updateJob(id: string, updates: Partial<JobRecord>): Promise<JobRecord | undefined> {
    const job = this.inMemoryData.jobs.find((j) => j.id === id);
    if (job) {
      Object.assign(job, updates);
    }

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        const payload: any = { ...updates };
        if (updates.wallet) payload.wallet = updates.wallet.toLowerCase();
        await supabase.from('jobs').update(payload).eq('id', id);
      } catch (err) {
        console.warn('[DB] Supabase updateJob error:', err);
      }
    }

    return job;
  }

  public async getJob(id: string): Promise<JobRecord | undefined> {
    const cached = this.inMemoryData.jobs.find((j) => j.id === id);
    if (cached) return cached;

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('jobs').select('*').eq('id', id).maybeSingle();
        if (!error && data) {
          const rec = data as JobRecord;
          this.inMemoryData.jobs.unshift(rec);
          return rec;
        }
      } catch { }
    }
    return undefined;
  }

  public async listJobs(includeTest: boolean = true): Promise<JobRecord[]> {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        let query = supabase.from('jobs').select('*').order('started_at', { ascending: false }).limit(200);
        if (!includeTest) {
          query = query.eq('is_test', false);
        }
        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          const records = (data as any[]).map((j) => {
            if (!j.ip && j.wallet && j.wallet.startsWith('ip_')) {
              j.ip = j.wallet.slice(3).replace(/_/g, '.');
            }
            return j as JobRecord;
          });
          const map = new Map<string, JobRecord>();
          for (const j of this.inMemoryData.jobs) {
            map.set(j.id, j);
          }
          for (const j of records) {
            map.set(j.id, j);
          }
          this.inMemoryData.jobs = Array.from(map.values());
        }
      } catch (err) {
        console.warn('[DB] Supabase listJobs fallback:', err);
      }
    }

    const filtered = includeTest
      ? this.inMemoryData.jobs
      : this.inMemoryData.jobs.filter((j) => !j.is_test);

    return [...filtered].sort(
      (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );
  }

  public async listJobsForWallet(wallet: string): Promise<JobRecord[]> {
    const clean = wallet.toLowerCase();
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('wallet', clean)
          .order('started_at', { ascending: false })
          .limit(50);
        if (!error && data) {
          return data as JobRecord[];
        }
      } catch { }
    }

    const matchingPaymentIds = new Set(
      this.inMemoryData.payments.filter((p) => p.wallet.toLowerCase() === clean).map((p) => p.id)
    );
    return this.inMemoryData.jobs.filter(
      (j) => (j.wallet && j.wallet.toLowerCase() === clean) || (j.payment_id && matchingPaymentIds.has(j.payment_id))
    );
  }

  // ==========================================
  // --- Reports ---
  // ==========================================
  public async saveReport(
    id: string,
    report: any,
    meta?: { jobId?: string; targetUrl?: string; wallet?: string; mode?: 'quick' | 'full' }
  ): Promise<void> {
    this.inMemoryData.reports[id] = report;

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        await supabase.from('reports').upsert({
          id,
          job_id: meta?.jobId || null,
          target_url: meta?.targetUrl || report.targetUrl || 'unknown',
          wallet: meta?.wallet ? meta.wallet.toLowerCase() : null,
          mode: meta?.mode || (report.pagesChecked > 1 ? 'full' : 'quick'),
          report_data: report,
          created_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[DB] Supabase saveReport error:', err);
      }
    }
  }

  public async getReport(id: string): Promise<any | undefined> {
    if (this.inMemoryData.reports[id]) {
      return this.inMemoryData.reports[id];
    }

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('reports').select('*').eq('id', id).maybeSingle();
        if (!error && data && data.report_data) {
          this.inMemoryData.reports[id] = data.report_data;
          return data.report_data;
        }
      } catch { }
    }
    return undefined;
  }

  public async listReportsForWallet(wallet?: string): Promise<SavedReportRecord[]> {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        let query = supabase.from('reports').select('*').order('created_at', { ascending: false }).limit(50);
        if (wallet) {
          query = query.eq('wallet', wallet.toLowerCase().trim());
        }
        const { data, error } = await query;
        if (!error && data) {
          return data as SavedReportRecord[];
        }
      } catch (err) {
        console.warn('[DB] Supabase listReports error:', err);
      }
    }

    return Object.entries(this.inMemoryData.reports).map(([id, rep]) => ({
      id,
      target_url: rep.targetUrl || '',
      mode: rep.pagesChecked > 1 ? 'full' : 'quick',
      report_data: rep,
      created_at: new Date().toISOString(),
    }));
  }

  // ==========================================
  // --- Dynamic Config ---
  // ==========================================
  public async getConfig(): Promise<DynamicConfig> {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('config').select('*');
        if (!error && data) {
          for (const item of data) {
            if (item.key && item.value) {
              this.inMemoryData.config[item.key] = item.value;
            }
          }
        }
      } catch { }
    }

    return {
      quick_price_usd: this.inMemoryData.config.quick_price_usd || DEFAULT_CONFIG.quick_price_usd,
      full_price_usd: this.inMemoryData.config.full_price_usd || DEFAULT_CONFIG.full_price_usd,
      crawl_timeout_ms: Number(this.inMemoryData.config.crawl_timeout_ms) || DEFAULT_CONFIG.crawl_timeout_ms,
      max_pages_full: Number(this.inMemoryData.config.max_pages_full) || DEFAULT_CONFIG.max_pages_full,
      rate_limit_per_minute:
        Number(this.inMemoryData.config.rate_limit_per_minute) || DEFAULT_CONFIG.rate_limit_per_minute,
    };
  }

  public async updateConfig(newConfig: Partial<DynamicConfig>): Promise<DynamicConfig> {
    for (const [k, v] of Object.entries(newConfig)) {
      if (v !== undefined) {
        this.inMemoryData.config[k] = String(v);
      }
    }

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        const upsertRows = Object.entries(newConfig)
          .filter(([, v]) => v !== undefined)
          .map(([key, val]) => ({
            key,
            value: String(val),
            updated_at: new Date().toISOString(),
          }));
        await supabase.from('config').upsert(upsertRows);
      } catch (err) {
        console.warn('[DB] Supabase updateConfig error:', err);
      }
    }

    return this.getConfig();
  }

  // ==========================================
  // --- Blocklist ---
  // ==========================================
  public async isBlocklisted(type: 'wallet' | 'ip' | 'domain', value: string): Promise<boolean> {
    const clean = value.toLowerCase().trim();
    if (this.inMemoryData.blocklist.some((b) => b.type === type && b.value.toLowerCase().trim() === clean)) {
      return true;
    }

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('blocklist')
          .select('id')
          .eq('type', type)
          .eq('value', clean)
          .maybeSingle();
        if (!error && data) return true;
      } catch { }
    }
    return false;
  }

  public async listBlocklist(): Promise<BlocklistRecord[]> {
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('blocklist').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          const remoteItems = data.map((b: any) => ({
            type: b.type,
            value: b.value,
            reason: b.reason,
            created_at: b.created_at,
          }));
          for (const item of remoteItems) {
            const idx = this.inMemoryData.blocklist.findIndex(
              (b) => b.type === item.type && b.value.toLowerCase() === item.value.toLowerCase()
            );
            if (idx >= 0) {
              this.inMemoryData.blocklist[idx] = item;
            } else {
              this.inMemoryData.blocklist.push(item);
            }
          }
        }
      } catch { }
    }
    return [...this.inMemoryData.blocklist].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public async addBlocklist(entry: BlocklistRecord): Promise<void> {
    const clean = entry.value.toLowerCase().trim();
    if (!this.inMemoryData.blocklist.some((b) => b.type === entry.type && b.value.toLowerCase().trim() === clean)) {
      this.inMemoryData.blocklist.push({ ...entry, value: clean });
    }

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        await supabase.from('blocklist').upsert({
          type: entry.type,
          value: clean,
          reason: entry.reason || 'Flagged by administrator',
          created_at: entry.created_at || new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[DB] Supabase addBlocklist error:', err);
      }
    }
  }

  public async removeBlocklist(type: string, value: string): Promise<void> {
    const clean = value.toLowerCase().trim();
    this.inMemoryData.blocklist = this.inMemoryData.blocklist.filter(
      (b) => !(b.type === type && b.value.toLowerCase().trim() === clean)
    );

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        await supabase.from('blocklist').delete().eq('type', type).eq('value', clean);
      } catch (err) {
        console.warn('[DB] Supabase removeBlocklist error:', err);
      }
    }
  }

  private rateLimitMap = new Map<string, number[]>();

  public checkRateLimit(ip: string, limitPerMinute: number): boolean {
    const now = Date.now();
    const windowStart = now - 60_000;
    const timestamps = (this.rateLimitMap.get(ip) || []).filter((t) => t > windowStart);
    if (timestamps.length >= limitPerMinute) {
      return false;
    }
    timestamps.push(now);
    this.rateLimitMap.set(ip, timestamps);
    return true;
  }

  /**
   * Supabase-backed & in-memory sliding window rate limiter for Free Quick Audits:
   * - Max 5 audits per hour per IP
   * - Daily cap of 20 audits per 24 hours per IP
   * - 10-minute domain cooldown (if domain was crawled within 10 minutes and done, returns cached report id)
   * - DOES NOT count failed audits (status: 'failed') against user quota
   */
  public async checkFreeAuditLimit(
    ip: string,
    targetUrl: string,
    maxPerHour: number = 5,
    cooldownMinutes: number = 10,
    maxPerDay: number = 20
  ): Promise<{
    allowed: boolean;
    code?: 'RATE_LIMIT_EXCEEDED' | 'DOMAIN_COOLDOWN';
    limitType?: 'hourly' | 'daily';
    message?: string;
    retryAfterSec?: number;
    cachedReportId?: string;
    remaining?: number;
    remainingHourly?: number;
    remainingDaily?: number;
    limitHourly?: number;
    limitDaily?: number;
  }> {
    const now = Date.now();
    const oneHourAgo = new Date(now - 3600_000).toISOString();
    const oneDayAgo = new Date(now - 86400_000).toISOString();
    const cooldownAgo = new Date(now - cooldownMinutes * 60_000).toISOString();

    let targetDomain = '';
    try {
      targetDomain = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`).hostname.toLowerCase();
    } catch {}

    const allJobs = await this.listJobs();

    const matchesIp = (j: JobRecord) => {
      if (j.ip && j.ip === ip) return true;
      if (j.wallet && j.wallet.startsWith('ip_')) {
        const clean = j.wallet.slice(3).replace(/_/g, '.');
        return clean === ip;
      }
      return false;
    };

    // 1. Count completed non-failed free audits in the last 24h and last 1h
    const successfulFreeJobsDay = allJobs.filter((j) => {
      return (
        matchesIp(j) &&
        !j.payment_id &&
        j.status === 'done' &&
        (j.finished_at || j.started_at) > oneDayAgo
      );
    });

    const successfulFreeJobsHour = successfulFreeJobsDay.filter((j) => {
      return (j.finished_at || j.started_at) > oneHourAgo;
    });

    // Also get active in-memory rate tracker entries for this IP within 24h
    const trackerTimesDay = (this.freeAuditTracker.get(ip) || []).filter((t) => t > now - 86400_000);
    const trackerTimesHour = trackerTimesDay.filter((t) => t > now - 3600_000);
    this.freeAuditTracker.set(ip, trackerTimesDay);

    const effectiveUsedHour = Math.max(successfulFreeJobsHour.length, trackerTimesHour.length);
    const effectiveUsedDay = Math.max(successfulFreeJobsDay.length, trackerTimesDay.length);

    // 2. DAILY CAP CHECK: Block if daily cap (20) reached
    if (effectiveUsedDay >= maxPerDay) {
      const timestampsDay = [
        ...successfulFreeJobsDay.map((j) => new Date(j.finished_at || j.started_at).getTime()),
        ...trackerTimesDay,
      ].filter((t) => !isNaN(t) && t > now - 86400_000);

      const oldestDayTimestamp = timestampsDay.length > 0 ? Math.min(...timestampsDay) : now - 43200_000;
      const retryAfterSec = Math.max(1, Math.ceil((oldestDayTimestamp + 86400_000 - now) / 1000));

      return {
        allowed: false,
        code: 'RATE_LIMIT_EXCEEDED',
        limitType: 'daily',
        message: `Daily free quick audit cap reached (maximum ${maxPerDay} per day). Upgrade to Deep Crawl on Celo ($0.50 in USDT) or check back tomorrow.`,
        retryAfterSec,
        remaining: 0,
        remainingHourly: Math.max(0, maxPerHour - effectiveUsedHour),
        remainingDaily: 0,
        limitHourly: maxPerHour,
        limitDaily: maxPerDay,
      };
    }

    // 3. HOURLY RATE LIMIT CHECK: Block if hourly limit (5) reached
    if (effectiveUsedHour >= maxPerHour) {
      const timestampsHour = [
        ...successfulFreeJobsHour.map((j) => new Date(j.finished_at || j.started_at).getTime()),
        ...trackerTimesHour,
      ].filter((t) => !isNaN(t) && t > now - 3600_000);

      const oldestHourTimestamp = timestampsHour.length > 0 ? Math.min(...timestampsHour) : now - 1800_000;
      const retryAfterSec = Math.max(1, Math.ceil((oldestHourTimestamp + 3600_000 - now) / 1000));

      return {
        allowed: false,
        code: 'RATE_LIMIT_EXCEEDED',
        limitType: 'hourly',
        message: `Hourly free quick audit limit reached (maximum ${maxPerHour} per hour). Upgrade to Full Deep Crawl on Celo ($0.50 in USDT) or wait for the hourly reset.`,
        retryAfterSec,
        remaining: 0,
        remainingHourly: 0,
        remainingDaily: Math.max(0, maxPerDay - effectiveUsedDay),
        limitHourly: maxPerHour,
        limitDaily: maxPerDay,
      };
    }

    // 4. Check domain cooldown for free audits (if domain was crawled within 10m, return cached report)
    if (targetDomain) {
      const recentSameDomain = allJobs.find((j) => {
        if (j.status !== 'done' || !j.report_id || j.payment_id) return false;
        try {
          const d = new URL(j.url.startsWith('http') ? j.url : `https://${j.url}`).hostname.toLowerCase();
          return d === targetDomain && (j.finished_at || j.started_at) > cooldownAgo;
        } catch {
          return false;
        }
      });

      if (recentSameDomain && recentSameDomain.report_id) {
        trackerTimesDay.push(now);
        this.freeAuditTracker.set(ip, trackerTimesDay);
        const remHour = Math.max(0, maxPerHour - effectiveUsedHour - 1);
        const remDay = Math.max(0, maxPerDay - effectiveUsedDay - 1);
        return {
          allowed: true,
          cachedReportId: recentSameDomain.report_id,
          remaining: Math.min(remHour, remDay),
          remainingHourly: remHour,
          remainingDaily: remDay,
          limitHourly: maxPerHour,
          limitDaily: maxPerDay,
        };
      }
    }

    const remHour = Math.max(0, maxPerHour - effectiveUsedHour);
    const remDay = Math.max(0, maxPerDay - effectiveUsedDay);
    return {
      allowed: true,
      remaining: Math.min(remHour, remDay),
      remainingHourly: remHour,
      remainingDaily: remDay,
      limitHourly: maxPerHour,
      limitDaily: maxPerDay,
    };
  }

  /**
   * Records a free audit attempt for an IP
   */
  public recordFreeAudit(ip: string): void {
    const now = Date.now();
    const current = (this.freeAuditTracker.get(ip) || []).filter((t) => t > now - 86400_000);
    current.push(now);
    this.freeAuditTracker.set(ip, current);
  }

  /**
   * Refunds a free audit slot if the audit failed
   */
  public refundFreeAuditQuota(ip: string): void {
    const current = this.freeAuditTracker.get(ip) || [];
    if (current.length > 0) {
      current.pop();
      this.freeAuditTracker.set(ip, current);
    }
  }

  /**
   * Retrieves remaining free audit quota for an IP
   */
  public async getFreeAuditQuota(
    ip: string,
    maxPerHour: number = 5,
    maxPerDay: number = 20
  ): Promise<{
    remaining: number;
    limit: number;
    remainingHourly: number;
    limitHourly: number;
    remainingDaily: number;
    limitDaily: number;
    limitType?: 'hourly' | 'daily';
    retryAfterSec?: number;
  }> {
    const check = await this.checkFreeAuditLimit(ip, 'https://dummy-check.io', maxPerHour, 10, maxPerDay);
    return {
      remaining: check.allowed ? (check.remaining ?? maxPerHour) : 0,
      limit: maxPerHour,
      remainingHourly: check.remainingHourly ?? (check.allowed ? maxPerHour : 0),
      limitHourly: maxPerHour,
      remainingDaily: check.remainingDaily ?? (check.allowed ? maxPerDay : 0),
      limitDaily: maxPerDay,
      limitType: check.limitType,
      retryAfterSec: check.retryAfterSec,
    };
  }
}

export const db = new CrawlpayDatabase();
