'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Activity,
  CheckCircle2,
  Fuel,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  FlaskConical,
  Send,
  Bot,
  FileText,
  CreditCard,
  ArrowUpRight,
  Globe,
  Clock,
  AlertCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';

import { CONFIG } from '../../config';
import { getAdminToken } from '../../utils/adminClient';
import { formatUsd, maskAddress, maskTxHash } from '../../utils/currency';
import { useAdminRealtime, RealtimeStatusBadge } from '../../utils/useAdminRealtime';

const PUBLIC_AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS || CONFIG.AGENT_WALLET_ADDRESS;
const ATTRIBUTION_TAG = CONFIG.ATTRIBUTION_TAG;

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [includeTest, setIncludeTest] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Copy feedback state
  const [copiedTag, setCopiedTag] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Operational action state
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState<{ type: 'success' | 'error'; text: string; url?: string } | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerMsg, setRegisterMsg] = useState<{ type: 'success' | 'error'; text: string; url?: string } | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyAttribution = () => {
    navigator.clipboard.writeText(ATTRIBUTION_TAG);
    setCopiedTag(true);
    setTimeout(() => setCopiedTag(false), 2000);
  };

  const copyWallet = () => {
    navigator.clipboard.writeText(PUBLIC_AGENT_ADDRESS);
    setCopiedWallet(true);
    setTimeout(() => setCopiedWallet(false), 2000);
  };

  const fetchData = useCallback(async (isManual: boolean = false) => {
    if (isManual) setRefreshing(true);
    try {
      const authKey = getAdminToken();
      const res = await fetch(`/api/admin/overview?includeTest=${includeTest}`, {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${authKey}`,
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
        },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastSyncTime(new Date());
      }
    } catch (e) {
      console.warn('Failed to load admin overview:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [includeTest]);

  // Supabase Realtime live sync
  const realtime = useAdminRealtime({
    onRefresh: () => fetchData(false),
    onJobChange: () => fetchData(false),
    onPaymentChange: () => fetchData(false),
    onConfigChange: () => fetchData(false),
  });

  useEffect(() => {
    fetchData();
    // 25s fallback heartbeat
    const interval = setInterval(() => fetchData(), 25000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleBroadcast = async () => {
    setBroadcasting(true);
    setBroadcastMsg(null);
    try {
      let res = await fetch('/api/admin/broadcast-ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAdminToken()}`,
        },
      });
      if (!res.ok && res.status === 404) {
        res = await fetch('/api/agent/broadcast', { method: 'POST' });
      }
      const result = await res.json();
      if (res.ok && (result.success || result.celoscanUrl || result.txHash)) {
        setBroadcastMsg({
          type: 'success',
          text: `Ping broadcasted with ERC-8021 tag (${ATTRIBUTION_TAG})`,
          url: result.celoscanUrl || `https://celoscan.io/tx/${result.txHash}`,
        });
        fetchData();
      } else {
        setBroadcastMsg({
          type: 'error',
          text: result.error || 'Broadcast failed. Check agent wallet gas.',
        });
      }
    } catch {
      setBroadcastMsg({ type: 'error', text: 'Network connection error during broadcast.' });
    } finally {
      setBroadcasting(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    setRegisterMsg(null);
    try {
      let res = await fetch('/api/admin/register-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAdminToken()}`,
        },
      });
      if (!res.ok && res.status === 404) {
        res = await fetch('/api/agent/register', { method: 'POST' });
      }
      const result = await res.json();
      if (res.ok && (result.success || result.celoscanUrl || result.agentId)) {
        setRegisterMsg({
          type: 'success',
          text: `Registered on ERC-8004 (Agent #${result.agentId || 'Active'})`,
          url: result.celoscanUrl || `https://celoscan.io/tx/${result.txHash}`,
        });
        fetchData();
      } else {
        setRegisterMsg({
          type: 'error',
          text: result.error || 'Registration failed. Check gas balance.',
        });
      }
    } catch {
      setRegisterMsg({ type: 'error', text: 'Network error during registration.' });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="size-6 animate-spin text-graphite-400" />
          <p className="text-xs text-graphite-500 font-medium">Loading telemetry...</p>
        </div>
      </div>
    );
  }

  const rawRevenue = data?.revenueUsdRaw ?? 0;
  const gasBalance = data?.onchainStatus?.celoBalance
    ? `${data.onchainStatus.celoBalance} CELO`
    : data?.gasRefuelsCelo
    ? `${data.gasRefuelsCelo} CELO`
    : '0.00 CELO';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Bar: Clean, Minimal & Informative */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-graphite-100 dark:border-graphite-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white">
              Overview
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Celo Mainnet
            </span>
          </div>
          <p className="text-xs text-graphite-500 dark:text-graphite-400 mt-1">
            Realtime settlements, crawler runtime queues, and autonomous agent identity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Supabase Realtime Badge */}
          <RealtimeStatusBadge
            status={realtime.status}
            lastEventTime={realtime.lastEventTime}
            eventCount={realtime.eventCount}
            onReconnect={realtime.reconnect}
          />

          {/* Sandbox Toggle */}
          <button
            type="button"
            onClick={() => setIncludeTest(!includeTest)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
              includeTest
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                : 'bg-white dark:bg-[#16171d] border-graphite-200 dark:border-graphite-800 text-graphite-600 dark:text-graphite-400 hover:text-ink dark:hover:text-white'
            }`}
            title="Toggle sandbox / test data in statistics"
          >
            <FlaskConical className="size-3.5" />
            <span>{includeTest ? 'Sandbox Included' : 'Production'}</span>
          </button>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-full border border-graphite-200 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-3.5 py-1.5 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-50 dark:hover:bg-[#20212b] transition-colors cursor-pointer disabled:opacity-50"
            title="Fetch latest snapshot"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin text-violet' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Executive Metric Cards (4 focused, high-contrast KPIs) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Settled Customer Revenue */}
        <div className="rounded-2xl border border-graphite-200/80 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-xs transition-all hover:border-graphite-300 dark:hover:border-graphite-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-graphite-500 dark:text-graphite-400 uppercase tracking-wider">
              Settled Revenue
            </span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="size-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-white">
                {formatUsd(rawRevenue)}
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                USDT
              </span>
            </div>
            <p className="text-xs text-graphite-500 dark:text-graphite-400 mt-1.5">
              {data?.customerPaymentsCount ?? 0} confirmed paid audit(s)
            </p>
          </div>
        </div>

        {/* Metric 2: Audit Pipeline */}
        <div className="rounded-2xl border border-graphite-200/80 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-xs transition-all hover:border-graphite-300 dark:hover:border-graphite-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-graphite-500 dark:text-graphite-400 uppercase tracking-wider">
              Audit Pipeline
            </span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-violet/10 text-violet">
              <Activity className="size-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-white">
                {data?.totalAudits || 0}
              </span>
              <span className="text-xs text-graphite-400 font-mono">crawls</span>
            </div>
            <p className="text-xs text-graphite-500 dark:text-graphite-400 mt-1.5">
              {data?.completedAudits || 0} completed &bull; {data?.runningAudits ? `${data.runningAudits} running` : 'idle'}
            </p>
          </div>
        </div>

        {/* Metric 3: Success Rate */}
        <div className="rounded-2xl border border-graphite-200/80 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-xs transition-all hover:border-graphite-300 dark:hover:border-graphite-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-graphite-500 dark:text-graphite-400 uppercase tracking-wider">
              Success Rate
            </span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-white">
                {data?.successRate || '100%'}
              </span>
            </div>
            <p className="text-xs text-graphite-500 dark:text-graphite-400 mt-1.5">
              {data?.failedAudits === 0 ? 'Zero failures recorded' : `${data?.failedAudits} failed crawl(s)`}
            </p>
          </div>
        </div>

        {/* Metric 4: Operational Gas Reserve */}
        <div className="rounded-2xl border border-graphite-200/80 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-xs transition-all hover:border-graphite-300 dark:hover:border-graphite-700">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-graphite-500 dark:text-graphite-400 uppercase tracking-wider">
              Gas Reserve
            </span>
            <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Fuel className="size-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink dark:text-white font-mono">
                {gasBalance}
              </span>
            </div>
            <p className="text-xs text-graphite-500 dark:text-graphite-400 mt-1.5">
              {data?.gasRefuelsCount ?? 0} operator gas refuels
            </p>
          </div>
        </div>
      </div>

      {/* 3. Autonomous Agent Identity & Network Panel (Compact & Professional) */}
      <div className="rounded-2xl border border-graphite-200/80 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Identity Metadata Group */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            {/* Wallet Address */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-graphite-400 block">
                Agent Wallet
              </span>
              <div className="flex items-center gap-1.5">
                <code className="text-xs font-mono font-bold text-ink dark:text-white">
                  {maskAddress(PUBLIC_AGENT_ADDRESS, 6)}
                </code>
                <button
                  type="button"
                  onClick={copyWallet}
                  className="text-graphite-400 hover:text-ink dark:hover:text-white cursor-pointer p-0.5"
                  title="Copy full address"
                >
                  {copiedWallet ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                </button>
                <a
                  href={`https://celoscan.io/address/${PUBLIC_AGENT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-graphite-400 hover:text-violet cursor-pointer p-0.5"
                  title="View on Celoscan"
                >
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>

            {/* ERC-8004 Registry */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-graphite-400 block">
                ERC-8004 Identity
              </span>
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono font-semibold text-ink dark:text-white">
                  {data?.onchainStatus?.isRegistered
                    ? `Registered (#${data.onchainStatus.agentId ?? 'Active'})`
                    : 'Standing Identity'}
                </span>
              </div>
            </div>

            {/* ERC-8021 Attribution */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-graphite-400 block">
                Attribution Tag
              </span>
              <div className="flex items-center gap-1.5">
                <code className="text-xs font-mono font-semibold text-violet truncate max-w-[160px]">
                  {ATTRIBUTION_TAG}
                </code>
                <button
                  type="button"
                  onClick={copyAttribution}
                  className="text-graphite-400 hover:text-ink dark:hover:text-white cursor-pointer p-0.5 shrink-0"
                  title="Copy attribution tag"
                >
                  {copiedTag ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                </button>
              </div>
            </div>

            {/* On-Chain Verified Txs */}
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-graphite-400 block">
                Verified Transactions
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono font-bold text-ink dark:text-white">
                  {data?.onchainStatus?.transactionCount ?? 0}
                </span>
                <span className="text-[11px] text-graphite-400 font-mono">on-chain</span>
              </div>
            </div>
          </div>

          {/* Quick Operator Actions */}
          <div className="flex items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-graphite-100 dark:border-graphite-800 shrink-0">
            <button
              type="button"
              onClick={handleBroadcast}
              disabled={broadcasting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#20212b] px-3 py-1.5 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-50 dark:hover:bg-[#262835] transition-colors cursor-pointer disabled:opacity-50"
              title="Broadcast telemetry ping with ERC-8021 attribution"
            >
              <Send className={`size-3 text-violet ${broadcasting ? 'animate-spin' : ''}`} />
              <span>{broadcasting ? 'Broadcasting...' : 'Broadcast Ping'}</span>
            </button>

            <button
              type="button"
              onClick={handleRegister}
              disabled={registering}
              className="inline-flex items-center gap-1.5 rounded-lg border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#20212b] px-3 py-1.5 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-50 dark:hover:bg-[#262835] transition-colors cursor-pointer disabled:opacity-50"
              title="Register on ERC-8004 identity contract"
            >
              <Bot className={`size-3 text-emerald-500 ${registering ? 'animate-spin' : ''}`} />
              <span>{registering ? 'Registering...' : 'Register'}</span>
            </button>
          </div>
        </div>

        {/* Action feedback banners */}
        {broadcastMsg && (
          <div
            className={`mt-3 p-2.5 rounded-lg text-xs flex items-center justify-between border ${
              broadcastMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
            }`}
          >
            <span>{broadcastMsg.text}</span>
            {broadcastMsg.url && (
              <a
                href={broadcastMsg.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline inline-flex items-center gap-1 font-semibold ml-2"
              >
                <span>Celoscan</span>
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        )}

        {registerMsg && (
          <div
            className={`mt-3 p-2.5 rounded-lg text-xs flex items-center justify-between border ${
              registerMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
            }`}
          >
            <span>{registerMsg.text}</span>
            {registerMsg.url && (
              <a
                href={registerMsg.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline inline-flex items-center gap-1 font-semibold ml-2"
              >
                <span>Celoscan</span>
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* 4. Dual Operational Feeds: Jobs & Settlements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Audit Jobs */}
        <div className="rounded-2xl border border-graphite-200/80 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-graphite-100 dark:border-graphite-800">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-violet" />
              <h2 className="font-semibold text-sm text-ink dark:text-white">
                Recent Audit Jobs
              </h2>
            </div>
            <Link
              href="/admin/jobs"
              className="text-xs font-semibold text-violet hover:underline inline-flex items-center gap-1"
            >
              <span>View all ({data?.totalAudits || 0})</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto pt-2">
            {(!data?.recentJobs || data.recentJobs.length === 0) ? (
              <div className="py-10 text-center text-xs text-graphite-400">
                <Clock className="size-5 mx-auto mb-1.5 text-graphite-300 stroke-1" />
                <p className="font-medium text-graphite-600 dark:text-graphite-400">No jobs recorded yet</p>
                <p className="text-[11px] text-graphite-400 mt-0.5">Executed audits will appear here automatically</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-graphite-400 border-b border-graphite-100 dark:border-graphite-800">
                    <th className="pb-2">Target</th>
                    <th className="pb-2">Mode</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-graphite-100/70 dark:divide-graphite-800/70 font-mono">
                  {data.recentJobs.slice(0, 6).map((j: any) => {
                    const cleanUrl = (j.url || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
                    return (
                      <tr key={j.id} className="hover:bg-graphite-50/50 dark:hover:bg-[#1e1f28]/50 transition-colors">
                        <td className="py-2.5 pr-2 max-w-[170px] truncate">
                          {j.url && j.url.startsWith('http') ? (
                            <a
                              href={j.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-ink dark:text-white font-medium hover:text-violet hover:underline truncate block"
                              title={j.url}
                            >
                              {cleanUrl}
                            </a>
                          ) : (
                            <span className="text-ink dark:text-white font-medium truncate block">{cleanUrl || '—'}</span>
                          )}
                          <span className="text-[10px] text-graphite-400 font-normal block font-sans">
                            {j.durationFormatted} &bull; {j.maskedWallet}
                          </span>
                        </td>
                        <td className="py-2.5 pr-2 whitespace-nowrap">
                          {j.depth === 'full' ? (
                            <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                              Deep
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-graphite-100 dark:bg-graphite-800 px-1.5 py-0.5 text-[10px] font-semibold text-graphite-600 dark:text-graphite-300">
                              Quick
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-2 whitespace-nowrap">
                          {j.status === 'done' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-sans">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              <span>Done</span>
                            </span>
                          ) : j.status === 'running' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 font-sans animate-pulse">
                              <span className="size-1.5 rounded-full bg-blue-500" />
                              <span>Running</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 font-sans">
                              <span className="size-1.5 rounded-full bg-rose-500" />
                              <span>Failed</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right whitespace-nowrap font-sans">
                          {j.report_id ? (
                            <Link
                              href={`/admin/reports/${j.report_id}?from=overview`}
                              className="inline-flex items-center gap-1 rounded-md border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#20212b] px-2 py-0.5 text-[11px] font-semibold text-ink dark:text-white hover:border-violet hover:text-violet transition-colors"
                            >
                              <FileText className="size-3 text-emerald-600 dark:text-emerald-400" />
                              <span>View</span>
                            </Link>
                          ) : (
                            <span className="text-graphite-400 text-xs">&mdash;</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Recent Settlements & Gas */}
        <div className="rounded-2xl border border-graphite-200/80 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-3.5 border-b border-graphite-100 dark:border-graphite-800">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-violet" />
              <h2 className="font-semibold text-sm text-ink dark:text-white">
                Recent Settlements
              </h2>
            </div>
            <Link
              href="/admin/payments"
              className="text-xs font-semibold text-violet hover:underline inline-flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="flex-1 overflow-x-auto pt-2">
            {(!data?.recentPayments || data.recentPayments.length === 0) ? (
              <div className="py-10 text-center text-xs text-graphite-400">
                <CreditCard className="size-5 mx-auto mb-1.5 text-graphite-300 stroke-1" />
                <p className="font-medium text-graphite-600 dark:text-graphite-400">No settlements recorded yet</p>
                <p className="text-[11px] text-graphite-400 mt-0.5">On-chain transactions will sync here automatically</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[11px] font-semibold uppercase tracking-wider text-graphite-400 border-b border-graphite-100 dark:border-graphite-800">
                    <th className="pb-2">Amount</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Payer</th>
                    <th className="pb-2 text-right">Tx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-graphite-100/70 dark:divide-graphite-800/70 font-mono">
                  {data.recentPayments.slice(0, 6).map((p: any) => (
                    <tr key={p.id} className="hover:bg-graphite-50/50 dark:hover:bg-[#1e1f28]/50 transition-colors">
                      <td className="py-2.5 pr-2 font-bold text-ink dark:text-white whitespace-nowrap">
                        {p.formattedAmount}
                      </td>
                      <td className="py-2.5 pr-2 whitespace-nowrap">
                        {p.isCustomerPayment ? (
                          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 font-sans">
                            USDT Audit
                          </span>
                        ) : p.token === 'CELO' ? (
                          <span className="inline-flex items-center rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 font-sans">
                            Gas Refuel
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-graphite-100 dark:bg-graphite-800 px-1.5 py-0.5 text-[10px] font-medium text-graphite-600 dark:text-graphite-300 font-sans">
                            Transfer
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-2 text-graphite-500 dark:text-graphite-400 whitespace-nowrap text-[11px]">
                        {p.maskedWallet}
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        {p.tx_hash ? (
                          <div className="inline-flex items-center gap-1 justify-end">
                            <a
                              href={p.celoscanUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet hover:underline text-[11px] font-semibold inline-flex items-center gap-0.5"
                              title="View on Celoscan"
                            >
                              <span>{p.maskedTx}</span>
                              <ExternalLink className="size-2.5 opacity-60" />
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(p.tx_hash, `tx_${p.id}`)}
                              className="text-graphite-400 hover:text-ink dark:hover:text-white cursor-pointer p-0.5"
                              title="Copy transaction hash"
                            >
                              {copiedId === `tx_${p.id}` ? <Check className="size-2.5 text-emerald-500" /> : <Copy className="size-2.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-graphite-400 text-xs font-sans">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 5. Minimal Footer: System Health & Protocols */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 text-[11px] font-mono text-graphite-400 border-t border-graphite-100 dark:border-graphite-800">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Supabase Realtime</span>
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>Celo RPC</span>
          </span>
          <span>&bull;</span>
          <span>ERC-8004 / ERC-8021</span>
        </div>

        <div className="flex items-center gap-3">
          <a href="/.well-known/agent-card.json" target="_blank" rel="noopener noreferrer" className="hover:text-violet underline">
            agent-card.json
          </a>
          <span>&bull;</span>
          <a href="/api/x402-bazaar" target="_blank" rel="noopener noreferrer" className="hover:text-violet underline">
            x402-bazaar
          </a>
          <span>&bull;</span>
          <a href="/api/agent/status" target="_blank" rel="noopener noreferrer" className="hover:text-violet underline">
            agent/status
          </a>
          {lastSyncTime && (
            <>
              <span>&bull;</span>
              <span>Sync {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
