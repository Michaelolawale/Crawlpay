-- ==============================================================================
-- Crawlpay Production Supabase Schema & Realtime Setup
-- Copy and paste this entire script into your Supabase SQL Editor:
-- (Supabase Dashboard > SQL Editor > New query > Run)
-- ==============================================================================

-- 1. Payments Table: On-chain payments received on Celo Mainnet
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    wallet TEXT NOT NULL,
    amount TEXT NOT NULL,
    token TEXT NOT NULL DEFAULT 'USDT',
    chain_id BIGINT NOT NULL DEFAULT 42220,
    tx_hash TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'confirmed',
    type TEXT NOT NULL DEFAULT 'customer_payment',
    is_test BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure all columns exist if upgrading an existing payments table
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'customer_payment';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_payments_tx_hash ON public.payments(tx_hash);
CREATE INDEX IF NOT EXISTS idx_payments_wallet ON public.payments(wallet);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_is_test ON public.payments(is_test);
CREATE INDEX IF NOT EXISTS idx_payments_type ON public.payments(type);

-- 2. Jobs Table: Audit crawler jobs and execution states
CREATE TABLE IF NOT EXISTS public.jobs (
    id TEXT PRIMARY KEY,
    payment_id TEXT REFERENCES public.payments(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    depth TEXT NOT NULL DEFAULT 'quick',
    status TEXT NOT NULL DEFAULT 'queued',
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    finished_at TIMESTAMPTZ,
    duration_ms BIGINT,
    error TEXT,
    is_test BOOLEAN NOT NULL DEFAULT false,
    report_id TEXT,
    wallet TEXT,
    ip TEXT
);

-- Ensure all columns exist if upgrading an existing jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS ip TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS wallet TEXT;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS report_id TEXT;

CREATE INDEX IF NOT EXISTS idx_jobs_payment_id ON public.jobs(payment_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_test ON public.jobs(is_test);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_started_at ON public.jobs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_wallet ON public.jobs(wallet);
CREATE INDEX IF NOT EXISTS idx_jobs_ip ON public.jobs(ip);

-- 3. Reports Table: Full deterministic audit results & code fixes
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    job_id TEXT,
    target_url TEXT NOT NULL,
    wallet TEXT,
    mode TEXT NOT NULL DEFAULT 'quick',
    report_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reports_wallet ON public.reports(wallet);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_job_id ON public.reports(job_id);

-- 4. Dynamic Config Table: Runtime prices, timeouts, and rate limits
CREATE TABLE IF NOT EXISTS public.config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Blocklist Table: IP, domain, and wallet blocklists
CREATE TABLE IF NOT EXISTS public.blocklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('wallet', 'ip', 'domain')),
    value TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT 'Flagged by administrator',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(type, value)
);

CREATE INDEX IF NOT EXISTS idx_blocklist_type_value ON public.blocklist(type, value);

-- 6. Default Dynamic Configuration Seed
INSERT INTO public.config (key, value) VALUES
    ('quick_price_usd', '0.00'),
    ('full_price_usd', '0.50'),
    ('crawl_timeout_ms', '7000'),
    ('max_pages_full', '50'),
    ('rate_limit_per_minute', '20')
ON CONFLICT (key) DO NOTHING;

-- 7. Row Level Security (RLS) Configuration
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocklist ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies
DROP POLICY IF EXISTS "Public payments read" ON public.payments;
CREATE POLICY "Public payments read" ON public.payments
    FOR SELECT USING (status = 'confirmed');

DROP POLICY IF EXISTS "Public jobs read" ON public.jobs;
CREATE POLICY "Public jobs read" ON public.jobs
    FOR SELECT USING (is_test = false);

DROP POLICY IF EXISTS "Public config read" ON public.config;
CREATE POLICY "Public config read" ON public.config
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public reports read" ON public.reports;
CREATE POLICY "Public reports read" ON public.reports
    FOR SELECT USING (true);

-- NOTE ON BLOCKLIST: The blocklist table has NO public policy, keeping flagged
-- records completely protected against client discovery. Only server-side routes
-- with SUPABASE_SERVICE_ROLE_KEY can read or write to it.

-- 8. Supabase Realtime Publication Setup
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER TABLE public.jobs REPLICA IDENTITY FULL;
ALTER TABLE public.reports REPLICA IDENTITY FULL;
ALTER TABLE public.config REPLICA IDENTITY FULL;
ALTER TABLE public.blocklist REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments, public.jobs, public.reports, public.config, public.blocklist;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; -- Tables already exist in publication
  END;
END $$;
