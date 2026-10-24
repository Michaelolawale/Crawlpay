'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Activity,
  CheckCircle2,
  AlertCircle,
  Wallet,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { CONFIG } from '@/config';

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const authKey = sessionStorage.getItem('crawlpay_admin_auth') || '';
      const res = await fetch('/api/admin/overview', {
        headers: { Authorization: `Bearer ${authKey}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.warn('Overview fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            System Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time operations, revenue metrics, and receiving wallet balance on Celo Mainnet.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin text-primary' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Metrics Cards Grid (is_test excluded) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-2 backdrop-blur-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Settled Revenue</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">
            ${data ? data.revenueUsd : '0.00'}{' '}
            <span className="text-xs font-normal text-muted-foreground">USD equiv</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {data?.revenueCelo && Number(data.revenueCelo) > 0
              ? `${data.revenueCelo} CELO collected on-chain`
              : 'Verified non-test settlements on Celo'}
          </p>
        </div>

        {/* Total Audit Calls */}
        <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-2 backdrop-blur-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Production Audits</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <Activity className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">
            {data ? data.totalCalls : 0}
          </div>
          <p className="text-[11px] text-muted-foreground">Excludes sandbox test jobs</p>
        </div>

        {/* Success Rate */}
        <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-2 backdrop-blur-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Success Rate</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {data ? data.successRate : '100.0%'}
          </div>
          <p className="text-[11px] text-muted-foreground">Deterministic crawl completion rate</p>
        </div>

        {/* Failed Jobs */}
        <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-2 backdrop-blur-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wider">Failed Jobs</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-foreground font-mono">
            {data ? data.failedJobsCount : 0}
          </div>
          <p className="text-[11px] text-muted-foreground">Subject to auto-retry and refund policy</p>
        </div>
      </div>

      {/* Receiving Wallet Status Card */}
      <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Wallet className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-foreground">
                Receiving Agent Wallet (Celo Mainnet)
              </h2>
              <a
                href={`https://celoscan.io/address/${CONFIG.AGENT_WALLET_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>{CONFIG.AGENT_WALLET_ADDRESS}</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Chain ID: 42220</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2">
          <div className="rounded-xl border border-border bg-background p-3">
            <span className="text-[11px] text-muted-foreground block">CELO Balance (Gas)</span>
            <strong className="text-lg font-bold text-foreground font-mono">
              {data?.onchainStatus ? `${data.onchainStatus.celoBalance} CELO` : 'Checking...'}
            </strong>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <span className="text-[11px] text-muted-foreground block">USDT Balance</span>
            <strong className="text-lg font-bold text-foreground font-mono">
              {data?.onchainStatus ? `${data.onchainStatus.usdtBalance} USDT` : '$0.00'}
            </strong>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <span className="text-[11px] text-muted-foreground block">Latest Block</span>
            <strong className="text-lg font-bold text-foreground font-mono">
              {data?.onchainStatus ? `#${data.onchainStatus.blockNumber}` : '—'}
            </strong>
          </div>
          <div className="rounded-xl border border-border bg-background p-3">
            <span className="text-[11px] text-muted-foreground block">Attribution Tag</span>
            <strong className="text-xs font-bold text-primary font-mono block truncate">
              {CONFIG.ATTRIBUTION_TAG}
            </strong>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/payments"
          className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-all space-y-1"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
              Payment Ledger →
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Inspect on-chain payments, attribution tags, and linked audit jobs.
          </p>
        </Link>

        <Link
          href="/admin/jobs"
          className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-all space-y-1"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
              Audit Jobs Queue →
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Monitor crawler durations, execution errors, and trigger manual reruns.
          </p>
        </Link>

        <Link
          href="/admin/sandbox"
          className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-all space-y-1"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
              Testing Sandbox →
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Execute zero-cost pipeline test crawls isolated from stats and ledger.
          </p>
        </Link>
      </div>
    </div>
  );
}
