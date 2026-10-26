'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Activity,
  AlertCircle,
  Wallet,
  RefreshCw,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';

import { CONFIG } from '@/config';
import { getAdminToken } from '@/utils/adminClient';

const PUBLIC_AGENT_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_ADDRESS || CONFIG.AGENT_WALLET_ADDRESS;
const ATTRIBUTION_TAG = CONFIG.ATTRIBUTION_TAG;

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const authKey = getAdminToken();
      const res = await fetch('/api/admin/overview', {
        cache: 'no-store',
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
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-graphite-100 dark:border-graphite-800 pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white sm:text-3xl">
            System Overview
          </h1>
          <p className="mt-1 text-sm text-graphite-800 dark:text-graphite-400">
            Real-time operations, revenue metrics, and receiving wallet balance on Celo Mainnet.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchData}
          disabled={refreshing}
          className="inline-flex h-[40px] items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-4 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#20212b] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin text-violet' : 'text-graphite-800 dark:text-graphite-400'}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-graphite-800 dark:text-graphite-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Settled Revenue</span>
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
              <DollarSign className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-ink dark:text-white font-mono">
            ${data ? data.revenueUsd : '0.00'}{' '}
            <span className="text-xs font-normal text-graphite-800 dark:text-graphite-400">USD equiv</span>
          </div>
          <p className="text-[11px] text-graphite-800 dark:text-graphite-400">
            {data?.revenueCelo && Number(data.revenueCelo) > 0
              ? `${data.revenueCelo} CELO collected on-chain`
              : 'Verified non-test settlements on Celo'}
          </p>
        </div>

        {/* Total Audit Calls */}
        <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-graphite-800 dark:text-graphite-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Production Audits</span>
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-violet/10 text-violet border border-violet/20">
              <Activity className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-ink dark:text-white font-mono">
            {data ? data.totalCalls : 0}
          </div>
          <p className="text-[11px] text-graphite-800 dark:text-graphite-400">Excludes sandbox test jobs</p>
        </div>

        {/* Success Rate */}
        <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-graphite-800 dark:text-graphite-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Success Rate</span>
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
            {data ? data.successRate : '100.0%'}
          </div>
          <p className="text-[11px] text-graphite-800 dark:text-graphite-400">Deterministic crawl completion rate</p>
        </div>

        {/* Failed Jobs */}
        <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-graphite-800 dark:text-graphite-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Failed Jobs</span>
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/80">
              <AlertCircle className="size-4" />
            </span>
          </div>
          <div className="text-2xl font-bold text-ink dark:text-white font-mono">
            {data ? data.failedJobsCount : 0}
          </div>
          <p className="text-[11px] text-graphite-800 dark:text-graphite-400">Subject to auto-retry and refund policy</p>
        </div>
      </div>

      {/* Receiving Wallet Status Card */}
      <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-graphite-100 dark:border-graphite-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-[10px] bg-ink dark:bg-white text-white dark:text-ink shadow-sm">
              <Wallet className="size-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-ink dark:text-white">
                Receiving Agent Wallet (Celo Mainnet)
              </h2>
              <a
                href={`https://celoscan.io/address/${PUBLIC_AGENT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-violet hover:underline inline-flex items-center gap-1"
              >
                <span>{PUBLIC_AGENT_ADDRESS}</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Chain ID: 42220</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 pt-2">
          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-3">
            <span className="text-[11px] text-graphite-800 dark:text-graphite-400 block">CELO Balance (Gas)</span>
            <strong className="text-lg font-bold text-ink dark:text-white font-mono">
              {data?.onchainStatus ? `${data.onchainStatus.celoBalance} CELO` : 'Checking...'}
            </strong>
          </div>
          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-3">
            <span className="text-[11px] text-graphite-800 dark:text-graphite-400 block">USDT Balance</span>
            <strong className="text-lg font-bold text-ink dark:text-white font-mono">
              {data?.onchainStatus ? `${data.onchainStatus.usdtBalance} USDT` : '$0.00'}
            </strong>
          </div>
          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-3">
            <span className="text-[11px] text-graphite-800 dark:text-graphite-400 block">Latest Block</span>
            <strong className="text-lg font-bold text-ink dark:text-white font-mono">
              {data?.onchainStatus ? `#${data.onchainStatus.blockNumber}` : '—'}
            </strong>
          </div>
          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-3">
            <span className="text-[11px] text-graphite-800 dark:text-graphite-400 block">Attribution Tag</span>
            <strong className="text-xs font-bold text-violet font-mono block truncate">
              {ATTRIBUTION_TAG}
            </strong>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/admin/payments"
          className="group rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-4 hover:border-ink/20 dark:hover:border-graphite-600 hover:shadow-sm transition-all space-y-1"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs text-ink dark:text-white group-hover:text-violet transition-colors">
              Payment Ledger →
            </h3>
          </div>
          <p className="text-[11px] text-graphite-800 dark:text-graphite-400">
            Inspect on-chain payments, attribution tags, and linked audit jobs.
          </p>
        </Link>

        <Link
          href="/admin/jobs"
          className="group rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-4 hover:border-ink/20 dark:hover:border-graphite-600 hover:shadow-sm transition-all space-y-1"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs text-ink dark:text-white group-hover:text-violet transition-colors">
              Audit Jobs Queue →
            </h3>
          </div>
          <p className="text-[11px] text-graphite-800 dark:text-graphite-400">
            Monitor crawler durations, execution errors, and trigger manual reruns.
          </p>
        </Link>

        <Link
          href="/admin/sandbox"
          className="group rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-4 hover:border-ink/20 dark:hover:border-graphite-600 hover:shadow-sm transition-all space-y-1"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs text-ink dark:text-white group-hover:text-violet transition-colors">
              Testing Sandbox →
            </h3>
          </div>
          <p className="text-[11px] text-graphite-800 dark:text-graphite-400">
            Execute zero-cost pipeline test crawls isolated from stats and ledger.
          </p>
        </Link>
      </div>
    </div>
  );
}


