'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  Activity,
  AlertCircle,
  Wallet,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  CheckCircle2,
  Clock,
  FileText,
  Bot,
  Send,
  Check,
  Copy,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Settings,
  Layers,
  FlaskConical,
  CreditCard,
  Fuel,
  Play,
  Search,
} from 'lucide-react';

import { CONFIG } from '../../config';
import { getAdminToken } from '../../utils/adminClient';
import { formatUsd, formatTokenAmount, maskAddress, maskTxHash } from '../../utils/currency';

const PUBLIC_AGENT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS || CONFIG.AGENT_WALLET_ADDRESS;
const ATTRIBUTION_TAG = CONFIG.ATTRIBUTION_TAG;

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [includeTest, setIncludeTest] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pollInterval, setPollInterval] = useState<number>(8000); // 8s default live polling

  // Copy state
  const [copiedTag, setCopiedTag] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Operations state
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

  useEffect(() => {
    fetchData();
    if (pollInterval <= 0) return;
    const interval = setInterval(() => fetchData(), pollInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollInterval]);

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
          text: `Ping broadcast verified on Celo Mainnet with ERC-8021 tag (${ATTRIBUTION_TAG})!`,
          url: result.celoscanUrl || `https://celoscan.io/tx/${result.txHash}`,
        });
        fetchData();
      } else {
        setBroadcastMsg({
          type: 'error',
          text: result.error || 'Broadcast failed. Ensure the agent wallet has sufficient CELO for gas.',
        });
      }
    } catch {
      setBroadcastMsg({ type: 'error', text: 'Network connection failed during broadcast.' });
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
          text: `Agent registered on ERC-8004 registry! Agent ID: ${result.agentId || 'Verified'}.`,
          url: result.celoscanUrl || `https://celoscan.io/tx/${result.txHash}`,
        });
        fetchData();
      } else {
        setRegisterMsg({
          type: 'error',
          text: result.error || 'Registration failed. Check gas balance or registry connectivity.',
        });
      }
    } catch {
      setRegisterMsg({ type: 'error', text: 'Network connection failed during registration.' });
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="size-6 animate-spin text-graphite-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header & Live Sync Controls */}
      <div className="flex flex-col gap-4 border-b border-graphite-100 dark:border-graphite-800 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-ink dark:text-white">
                Operator Telemetry &amp; Controls
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Celo Mainnet (42220)
              </span>
            </div>
            <p className="text-xs text-graphite-600 dark:text-graphite-400 mt-0.5">
              Authoritative on-chain settlement ledger, crawler runtime queues, and autonomous agent identity.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sandbox Data Toggle */}
            <button
              type="button"
              onClick={() => setIncludeTest(!includeTest)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all cursor-pointer ${
                includeTest
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                  : 'bg-white dark:bg-[#1a1b22] border-graphite-200 dark:border-graphite-700 text-graphite-600 dark:text-graphite-400 hover:text-ink dark:hover:text-white'
              }`}
              title="Toggle sandbox / test data in statistics and queues"
            >
              <FlaskConical className="size-3.5" />
              <span>{includeTest ? 'Sandbox Included' : 'Production Only'}</span>
            </button>

            {/* Manual Refresh */}
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 rounded-full border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-3 py-1 text-xs font-medium text-ink dark:text-white hover:bg-graphite-100 dark:hover:bg-[#252631] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`size-3 ${refreshing ? 'animate-spin text-violet' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Sync Now'}</span>
            </button>

            {/* Polling Interval Selector */}
            <div className="inline-flex items-center rounded-full border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] p-0.5 text-[11px] font-mono shadow-xs">
              <span className="px-2 text-graphite-400 uppercase tracking-wider text-[10px]">Sync:</span>
              <button
                type="button"
                onClick={() => setPollInterval(5000)}
                className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                  pollInterval === 5000 ? 'bg-emerald-500 text-white font-bold' : 'text-graphite-500 hover:text-ink dark:hover:text-white'
                }`}
              >
                5s
              </button>
              <button
                type="button"
                onClick={() => setPollInterval(8000)}
                className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                  pollInterval === 8000 ? 'bg-violet text-white font-bold' : 'text-graphite-500 hover:text-ink dark:hover:text-white'
                }`}
              >
                8s
              </button>
              <button
                type="button"
                onClick={() => setPollInterval(0)}
                className={`px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                  pollInterval === 0 ? 'bg-rose-500 text-white font-bold' : 'text-graphite-500 hover:text-ink dark:hover:text-white'
                }`}
                title="Pause live polling"
              >
                Off
              </button>
            </div>
          </div>
        </div>

        {/* Live Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-graphite-500 dark:text-graphite-400 font-mono pt-1">
          <div className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${pollInterval > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-graphite-400'}`} />
            <span>
              Connection: <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">{pollInterval > 0 ? `Streaming (${pollInterval / 1000}s)` : 'Polling Paused'}</strong>
            </span>
            {lastSyncTime && (
              <>
                <span>&bull;</span>
                <span>Last updated: {lastSyncTime.toLocaleTimeString()}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span>Agent:</span>
            <code className="text-violet font-semibold">{maskAddress(PUBLIC_AGENT_ADDRESS, 4)}</code>
          </div>
        </div>
      </div>

      {/* 2. Core Production KPIs (Single Source of Truth) */}
      <div id="kpis" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Confirmed Customer Revenue */}
        <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-graphite-600 dark:text-graphite-400">Customer Revenue (USDT)</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="size-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-ink dark:text-white">
                {formatUsd(data?.revenueUsdRaw ?? 0)}
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                USDT
              </span>
            </div>
            <p className="text-[11px] text-graphite-500 dark:text-graphite-400 mt-0.5">
              {data?.customerPaymentsCount ?? 0} confirmed paid audit(s) on Celo
            </p>
          </div>
        </div>

        {/* Total Production Audits Completed */}
        <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-graphite-600 dark:text-graphite-400">
              {includeTest ? 'All Audits (Inc. Sandbox)' : 'Production Audits'}
            </span>
            <span className="flex size-8 items-center justify-center rounded-full bg-violet/10 text-violet">
              <Activity className="size-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-ink dark:text-white">
                {data?.totalAudits || 0}
              </span>
              <span className="text-xs text-graphite-500 font-mono">crawls</span>
            </div>
            <p className="text-[11px] text-graphite-500 dark:text-graphite-400 mt-0.5">
              {data?.completedAudits || 0} successful &bull; {data?.failedAudits || 0} failed
            </p>
          </div>
        </div>

        {/* Pipeline Success Rate */}
        <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-graphite-600 dark:text-graphite-400">Pipeline Success Rate</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-ink dark:text-white">
                {data?.successRate || '100%'}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                {data?.failedAudits === 0 ? 'zero fail' : `${data?.failedAudits} err`}
              </span>
            </div>
            <p className="text-[11px] text-graphite-500 dark:text-graphite-400 mt-0.5">
              {data?.runningAudits ? `${data.runningAudits} crawl(s) in progress` : 'Queue idle'}
            </p>
          </div>
        </div>

        {/* Operational Gas Refuels (CELO) */}
        <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-graphite-600 dark:text-graphite-400">Operational Gas Inflow</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Fuel className="size-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-ink dark:text-white font-mono">
                {data?.gasRefuelsCelo || '0.0000'}
              </span>
              <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-semibold">
                CELO
              </span>
            </div>
            <p className="text-[11px] text-graphite-500 dark:text-graphite-400 mt-0.5">
              {data?.gasRefuelsCount || 0} gas refuel transfer(s)
            </p>
          </div>
        </div>
      </div>

      {/* 3. Receiving Wallet & Autonomous Identity (Live Celo RPC) */}
      <div id="identity" className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-graphite-100 dark:border-graphite-800 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-violet" />
              <h2 className="font-display text-base font-bold text-ink dark:text-white">
                Agent Receiving Wallet &amp; Autonomous Identity
              </h2>
            </div>
            <p className="text-xs text-graphite-600 dark:text-graphite-400">
              Autonomous micro-payment settlement on Celo Mainnet with ERC-8004 identity registration and ERC-8021 telemetry.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-graphite-100 dark:bg-[#20212b] px-3 py-1 font-mono text-xs text-ink dark:text-white">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{maskAddress(PUBLIC_AGENT_ADDRESS, 4)}</span>
              <button
                type="button"
                onClick={copyWallet}
                className="ml-1 text-graphite-400 hover:text-ink dark:hover:text-white cursor-pointer"
                title="Copy full wallet address"
              >
                {copiedWallet ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-3">
            <span className="text-[11px] text-graphite-600 dark:text-graphite-400 block font-medium">CELO Balance (Gas)</span>
            <strong className="text-base sm:text-lg font-bold text-ink dark:text-white font-mono block truncate">
              {data?.onchainStatus ? `${data.onchainStatus.celoBalance} CELO` : 'Checking...'}
            </strong>
          </div>
          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-3">
            <span className="text-[11px] text-graphite-600 dark:text-graphite-400 block font-medium">USDT Balance</span>
            <strong className="text-base sm:text-lg font-bold text-ink dark:text-white font-mono block truncate">
              {data?.onchainStatus ? `${data.onchainStatus.usdtBalance} USDT` : '$0.00'}
            </strong>
          </div>
          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-3">
            <span className="text-[11px] text-graphite-600 dark:text-graphite-400 block font-medium">ERC-8004 Identity</span>
            <strong className="text-xs sm:text-sm font-bold text-ink dark:text-white font-mono block truncate mt-1">
              {data?.onchainStatus?.isRegistered
                ? `Registered (#${data.onchainStatus.agentId ?? 'Active'})`
                : 'Standing Identity'}
            </strong>
          </div>
          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-graphite-600 dark:text-graphite-400 block font-medium">Attribution Tag</span>
              <button
                type="button"
                onClick={copyAttribution}
                className="text-violet hover:underline text-[10px] flex items-center gap-0.5 cursor-pointer font-medium"
              >
                {copiedTag ? <Check className="size-2.5 text-emerald-500" /> : <Copy className="size-2.5" />}
                <span>{copiedTag ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <strong className="text-xs sm:text-sm font-bold text-violet font-mono block truncate mt-1">
              {ATTRIBUTION_TAG}
            </strong>
          </div>
        </div>

        {/* Live On-Chain Ticker */}
        <div className="rounded-[14px] border border-violet/20 bg-violet/5 dark:bg-violet/10 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <div>
              <span className="font-semibold text-ink dark:text-white">Live On-Chain Transaction Count:</span>{' '}
              <strong className="font-mono text-violet text-sm">
                {data?.onchainStatus?.transactionCount ?? 0} Transactions
              </strong>
              <span className="text-[11px] text-graphite-600 dark:text-graphite-400 block sm:inline sm:ml-2">
                (Real on-chain count verified via Celo node RPC)
              </span>
            </div>
          </div>

          <a
            href={`https://celoscan.io/address/${PUBLIC_AGENT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-violet hover:underline shrink-0"
          >
            <span>Celoscan Explorer</span>
            <ExternalLink className="size-3" />
          </a>
        </div>

        {/* Autonomous Operations Actions */}
        <div className="pt-2 border-t border-graphite-100 dark:border-graphite-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleBroadcast}
              disabled={broadcasting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-4 py-2 text-xs font-semibold hover:opacity-90 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Send className={`size-3 ${broadcasting ? 'animate-spin' : ''}`} />
              <span>{broadcasting ? 'Broadcasting...' : 'Broadcast Attributed Ping (ERC-8021)'}</span>
            </button>

            <button
              type="button"
              onClick={handleRegister}
              disabled={registering}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#20212b] text-ink dark:text-white px-4 py-2 text-xs font-semibold hover:bg-graphite-100 dark:hover:bg-[#252631] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Bot className={`size-3 text-violet ${registering ? 'animate-spin' : ''}`} />
              <span>{registering ? 'Registering...' : 'Register on ERC-8004'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-graphite-600 dark:text-graphite-400">
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
          </div>
        </div>

        {broadcastMsg && (
          <div
            className={`p-3 rounded-[12px] text-xs flex items-center justify-between border ${
              broadcastMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300'
            }`}
          >
            <span>{broadcastMsg.text}</span>
            {broadcastMsg.url && (
              <a
                href={broadcastMsg.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono underline inline-flex items-center gap-1 font-semibold shrink-0 ml-2"
              >
                <span>Celoscan</span>
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        )}

        {registerMsg && (
          <div
            className={`p-3 rounded-[12px] text-xs flex items-center justify-between border ${
              registerMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300'
            }`}
          >
            <span>{registerMsg.text}</span>
            {registerMsg.url && (
              <a
                href={registerMsg.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono underline inline-flex items-center gap-1 font-semibold shrink-0 ml-2"
              >
                <span>Celoscan</span>
                <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* 4. Live Audit Jobs Queue Feed */}
      <div id="jobs-feed" className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-graphite-100 dark:border-graphite-800 pb-4">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-base font-bold text-ink dark:text-white">
              Live Audit Jobs Queue
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Queue
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/reports"
              className="text-xs font-semibold text-graphite-600 dark:text-graphite-400 hover:text-ink dark:hover:text-white inline-flex items-center gap-1"
            >
              <FileText className="size-3" />
              <span>All Reports ({data?.reportsCount ?? 0})</span>
            </Link>
            <Link
              href="/admin/jobs"
              className="text-xs font-semibold text-violet hover:underline inline-flex items-center gap-1"
            >
              <span>Full Queue ({data?.totalAudits || 0})</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>

        {(!data?.recentJobs || data.recentJobs.length === 0) ? (
          <div className="py-8 text-center text-xs text-graphite-500 dark:text-graphite-400">
            <Clock className="size-5 mx-auto mb-1 text-graphite-400 stroke-1" />
            <p className="font-medium text-ink dark:text-white">No audit jobs recorded yet.</p>
            <p className="text-[11px] text-graphite-400 mt-1">Jobs will appear here automatically upon audit execution.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-b border-graphite-100 dark:border-graphite-800 text-graphite-500 dark:text-graphite-400 font-semibold">
                <tr>
                  <th className="pb-2.5 pr-4 whitespace-nowrap">Time</th>
                  <th className="pb-2.5 pr-4">Target Website</th>
                  <th className="pb-2.5 pr-4">Client Wallet</th>
                  <th className="pb-2.5 pr-4">Mode</th>
                  <th className="pb-2.5 pr-4">Status</th>
                  <th className="pb-2.5 pr-4">Latency</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-100 dark:divide-graphite-800">
                {data.recentJobs.map((j: any) => (
                  <tr key={j.id} className="hover:bg-[#f4f4f6]/60 dark:hover:bg-[#20212b]/60 transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-graphite-500 dark:text-graphite-400 whitespace-nowrap">
                      {new Date(j.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="py-2.5 pr-4 font-mono font-medium text-ink dark:text-white max-w-[220px] truncate">
                      {j.url && j.url.startsWith('http') ? (
                        <a href={j.url} target="_blank" rel="noopener noreferrer" className="hover:text-violet hover:underline inline-flex items-center gap-1">
                          <span>{j.url.replace(/^https?:\/\//, '')}</span>
                          <ExternalLink className="size-2.5 opacity-50 shrink-0" />
                        </a>
                      ) : (
                        <span>{j.url}</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[11px] text-graphite-500 dark:text-graphite-400 whitespace-nowrap">
                      {j.maskedWallet}
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      {j.depth === 'full' ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 font-mono">
                          Deep (50p)
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-graphite-100 dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 px-2 py-0.5 text-[10px] font-medium text-graphite-700 dark:text-graphite-300 font-mono">
                          Quick (1p)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      {j.status === 'done' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3 text-emerald-500" />
                          <span>Done</span>
                        </span>
                      ) : j.status === 'running' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 animate-pulse">
                          <RefreshCw className="size-3 animate-spin text-blue-500" />
                          <span>Running</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                          <AlertCircle className="size-3 text-rose-500" />
                          <span>Failed</span>
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[11px] text-graphite-500 dark:text-graphite-400 whitespace-nowrap">
                      {j.durationFormatted}
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      {j.report_id ? (
                        <Link
                          href={`/admin/reports/${j.report_id}?from=overview`}
                          className="inline-flex items-center gap-1 rounded-[32px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#20212b] px-2.5 py-0.5 text-[11px] font-semibold text-ink dark:text-white hover:text-violet transition-colors"
                        >
                          <FileText className="size-3 text-emerald-600 dark:text-emerald-400" />
                          <span>Report</span>
                        </Link>
                      ) : (
                        <span className="text-graphite-400 font-mono text-[11px]">&mdash;</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Verified On-Chain Payments & Settlement Ledger */}
      <div id="payments-ledger" className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-graphite-100 dark:border-graphite-800 pb-4">
          <div className="flex items-center gap-2.5">
            <CreditCard className="size-4 text-violet" />
            <h2 className="font-display text-base font-bold text-ink dark:text-white">
              On-Chain Settlement Ledger Snapshot
            </h2>
            <span className="rounded-full bg-violet/10 text-violet px-2.5 py-0.5 text-[10px] font-mono font-semibold">
              {formatUsd(data?.revenueUsdRaw ?? 0)} Settled
            </span>
          </div>

          <Link
            href="/admin/payments"
            className="text-xs font-semibold text-violet hover:underline inline-flex items-center gap-1"
          >
            <span>Open Full Ledger</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>

        {(!data?.recentPayments || data.recentPayments.length === 0) ? (
          <div className="py-6 text-center text-xs text-graphite-500 dark:text-graphite-400">
            <CreditCard className="size-5 mx-auto mb-1 text-graphite-400 stroke-1" />
            <p className="font-medium text-ink dark:text-white">No on-chain settlements recorded yet.</p>
            <p className="text-[11px] text-graphite-400 mt-1">Celo Mainnet USDT transactions will automatically sync here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-b border-graphite-100 dark:border-graphite-800 text-graphite-500 dark:text-graphite-400 font-semibold">
                <tr>
                  <th className="pb-2.5 pr-4 whitespace-nowrap">Timestamp</th>
                  <th className="pb-2.5 pr-4">Type</th>
                  <th className="pb-2.5 pr-4">Amount</th>
                  <th className="pb-2.5 pr-4">Payer / Source</th>
                  <th className="pb-2.5 pr-4">Transaction Hash</th>
                  <th className="pb-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-100 dark:divide-graphite-800">
                {data.recentPayments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-[#f4f4f6]/60 dark:hover:bg-[#20212b]/60 transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-graphite-500 dark:text-graphite-400 whitespace-nowrap">
                      {p.created_at ? new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
                    </td>
                    <td className="py-2.5 pr-4 whitespace-nowrap">
                      {p.isCustomerPayment ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Customer Payment
                        </span>
                      ) : p.token === 'CELO' ? (
                        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Gas Refuel
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-graphite-100 dark:bg-graphite-800 px-2 py-0.5 text-[10px] font-bold text-graphite-600 dark:text-graphite-400">
                          System Transfer
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 font-mono font-semibold text-ink dark:text-white whitespace-nowrap">
                      {p.formattedAmount}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[11px] text-graphite-500 dark:text-graphite-400 whitespace-nowrap">
                      {p.maskedWallet}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[11px] whitespace-nowrap">
                      {p.tx_hash ? (
                        <div className="inline-flex items-center gap-1.5">
                          <a
                            href={p.celoscanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-violet hover:underline inline-flex items-center gap-1 text-violet font-semibold"
                            title="View transaction on Celoscan"
                          >
                            <span>{p.maskedTx}</span>
                            <ExternalLink className="size-2.5 opacity-60 shrink-0" />
                          </a>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.tx_hash, `tx_${p.id}`)}
                            className="text-graphite-400 hover:text-ink dark:hover:text-white cursor-pointer"
                            title="Copy Transaction Hash"
                          >
                            {copiedId === `tx_${p.id}` ? <Check className="size-2.5 text-emerald-500" /> : <Copy className="size-2.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-graphite-400">Off-chain entry</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Check className="size-2.5" />
                        <span>Confirmed</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 6. Navigation Hub to Specialized Admin Portals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-graphite-100 dark:border-graphite-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-violet" />
            <h2 className="font-display text-base font-bold text-ink dark:text-white">
              Operator Management Portals
            </h2>
          </div>
          <span className="text-xs font-mono text-graphite-400">6 Specialized Modules</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/payments"
            className="group rounded-[16px] border border-graphite-200 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 hover:border-violet/40 hover:shadow-sm transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-violet" />
                <h3 className="font-semibold text-sm text-ink dark:text-white group-hover:text-violet transition-colors">
                  Payment Ledger
                </h3>
              </div>
              <span className="text-xs text-graphite-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </div>
            <p className="text-xs text-graphite-600 dark:text-graphite-400">
              Inspect on-chain payments, ERC-8021 attribution tags, and linked audit jobs.
            </p>
          </Link>

          <Link
            href="/admin/jobs"
            className="group rounded-[16px] border border-graphite-200 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 hover:border-violet/40 hover:shadow-sm transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-violet" />
                <h3 className="font-semibold text-sm text-ink dark:text-white group-hover:text-violet transition-colors">
                  Audit Jobs Queue
                </h3>
              </div>
              <span className="text-xs text-graphite-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </div>
            <p className="text-xs text-graphite-600 dark:text-graphite-400">
              Monitor crawler latency, execution errors, depth levels, and trigger manual reruns.
            </p>
          </Link>

          <Link
            href="/admin/reports"
            className="group rounded-[16px] border border-graphite-200 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 hover:border-violet/40 hover:shadow-sm transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-violet" />
                <h3 className="font-semibold text-sm text-ink dark:text-white group-hover:text-violet transition-colors">
                  Reports Archive
                </h3>
              </div>
              <span className="text-xs text-graphite-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </div>
            <p className="text-xs text-graphite-600 dark:text-graphite-400">
              Browse all stored audit reports, review SEO/AEO/GEO scores, and audit findings.
            </p>
          </Link>

          <Link
            href="/admin/config"
            className="group rounded-[16px] border border-graphite-200 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 hover:border-violet/40 hover:shadow-sm transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-violet" />
                <h3 className="font-semibold text-sm text-ink dark:text-white group-hover:text-violet transition-colors">
                  System Configuration
                </h3>
              </div>
              <span className="text-xs text-graphite-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </div>
            <p className="text-xs text-graphite-600 dark:text-graphite-400">
              Tune crawl timeouts, max depth, rate limits, and pricing parameters dynamically.
            </p>
          </Link>

          <Link
            href="/admin/abuse"
            className="group rounded-[16px] border border-graphite-200 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 hover:border-violet/40 hover:shadow-sm transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-violet" />
                <h3 className="font-semibold text-sm text-ink dark:text-white group-hover:text-violet transition-colors">
                  Abuse &amp; Security Controls
                </h3>
              </div>
              <span className="text-xs text-graphite-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </div>
            <p className="text-xs text-graphite-600 dark:text-graphite-400">
              Configure blocked domains, review security flags, and govern traffic quotas.
            </p>
          </Link>

          <Link
            href="/admin/sandbox"
            className="group rounded-[16px] border border-graphite-200 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 hover:border-violet/40 hover:shadow-sm transition-all space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="size-4 text-violet" />
                <h3 className="font-semibold text-sm text-ink dark:text-white group-hover:text-violet transition-colors">
                  Testing Sandbox
                </h3>
              </div>
              <span className="text-xs text-graphite-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </div>
            <p className="text-xs text-graphite-600 dark:text-graphite-400">
              Execute zero-cost pipeline test crawls safely isolated from statistics and ledger.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
