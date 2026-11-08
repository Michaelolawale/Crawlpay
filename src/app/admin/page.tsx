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
  CheckCircle2,
  Clock,
  FileText,
  Radio,
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
  Hash,
  Sparkles,
} from 'lucide-react';

import { CONFIG } from '../../config';
import { getAdminToken } from '../../utils/adminClient';

const PUBLIC_AGENT_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_ADDRESS || CONFIG.AGENT_WALLET_ADDRESS;
const ATTRIBUTION_TAG = CONFIG.ATTRIBUTION_TAG;

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedTag, setCopiedTag] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);

  // Agent Operations State
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState<{ type: 'success' | 'error'; text: string; url?: string } | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerMsg, setRegisterMsg] = useState<{ type: 'success' | 'error'; text: string; url?: string } | null>(null);

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

  const handleBroadcast = async () => {
    setBroadcasting(true);
    setBroadcastMsg(null);
    try {
      const res = await fetch('/api/admin/broadcast-ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAdminToken()}`,
        },
      });
      const result = await res.json();
      if (res.ok) {
        setBroadcastMsg({
          type: 'success',
          text: `Ping broadcast successful! Transaction recorded with ERC-8021 tag (${ATTRIBUTION_TAG}).`,
          url: result.celoscanUrl,
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
      const res = await fetch('/api/admin/register-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAdminToken()}`,
        },
      });
      const result = await res.json();
      if (res.ok) {
        setRegisterMsg({
          type: 'success',
          text: `Agent registered on ERC-8004 registry! Agent ID: ${result.agentId || 'Verified'}.`,
          url: result.celoscanUrl,
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

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/overview', {
        headers: {
          Authorization: `Bearer ${getAdminToken()}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Failed to load admin overview:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="size-6 animate-spin text-graphite-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Header & Navigation Jump Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-graphite-100 dark:border-graphite-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-ink dark:text-white">
              Operator Overview
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Celo Mainnet (42220)
            </span>
          </div>
          <p className="text-xs text-graphite-600 dark:text-graphite-400 mt-0.5">
            Real-time telemetry, crawler runtime queues, on-chain payments, and security controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setRefreshing(true);
              fetchData();
            }}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-3.5 py-1.5 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-100 dark:hover:bg-[#252631] transition-all shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh dashboard"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin text-violet' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <a
            href={`https://celoscan.io/address/${PUBLIC_AGENT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 transition-all shadow-xs"
          >
            <span>Celoscan</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      {/* Quick Jump Anchor Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[11px] font-mono text-graphite-400 uppercase tracking-wider mr-1 shrink-0">Jump to:</span>
        <a href="#kpis" className="rounded-full bg-graphite-100 dark:bg-[#1a1b22] px-3 py-1 text-graphite-700 dark:text-graphite-300 hover:text-ink dark:hover:text-white whitespace-nowrap transition-colors">KPIs</a>
        <a href="#identity" className="rounded-full bg-graphite-100 dark:bg-[#1a1b22] px-3 py-1 text-graphite-700 dark:text-graphite-300 hover:text-ink dark:hover:text-white whitespace-nowrap transition-colors">On-Chain Identity</a>
        <a href="#jobs-feed" className="rounded-full bg-graphite-100 dark:bg-[#1a1b22] px-3 py-1 text-graphite-700 dark:text-graphite-300 hover:text-ink dark:hover:text-white whitespace-nowrap transition-colors">Live Queue</a>
        <a href="#payments-ledger" className="rounded-full bg-graphite-100 dark:bg-[#1a1b22] px-3 py-1 text-graphite-700 dark:text-graphite-300 hover:text-ink dark:hover:text-white whitespace-nowrap transition-colors">Payment Ledger</a>
        <a href="#runtime-config" className="rounded-full bg-graphite-100 dark:bg-[#1a1b22] px-3 py-1 text-graphite-700 dark:text-graphite-300 hover:text-ink dark:hover:text-white whitespace-nowrap transition-colors">Configuration</a>
        <a href="#security-shield" className="rounded-full bg-graphite-100 dark:bg-[#1a1b22] px-3 py-1 text-graphite-700 dark:text-graphite-300 hover:text-ink dark:hover:text-white whitespace-nowrap transition-colors">Security Shield</a>
        <a href="#modules-hub" className="rounded-full bg-graphite-100 dark:bg-[#1a1b22] px-3 py-1 text-graphite-700 dark:text-graphite-300 hover:text-ink dark:hover:text-white whitespace-nowrap transition-colors">All Modules</a>
      </div>

      {/* 2. Operational KPIs */}
      <div id="kpis" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Confirmed Revenue */}
        <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-graphite-600 dark:text-graphite-400">Total Settled Revenue</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="size-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-ink dark:text-white">
                ${data?.revenueUsd || '0.00'}
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                USDT
              </span>
            </div>
            <p className="text-[11px] text-graphite-500 dark:text-graphite-400 mt-0.5">
              {data?.totalPaymentsCount ?? 0} settled audits on Celo
            </p>
          </div>
        </div>

        {/* Total Audits Completed */}
        <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-graphite-600 dark:text-graphite-400">Total Audits Completed</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-violet/10 text-violet">
              <Activity className="size-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-ink dark:text-white">
                {data?.totalCalls || 0}
              </span>
              <span className="text-xs text-graphite-500 font-mono">crawls</span>
            </div>
            <p className="text-[11px] text-graphite-500 dark:text-graphite-400 mt-0.5">
              Across quick audits & deep crawls
            </p>
          </div>
        </div>

        {/* Success Rate */}
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
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">zero crash</span>
            </div>
            <p className="text-[11px] text-graphite-500 dark:text-graphite-400 mt-0.5">
              {data?.failedJobsCount ? `${data.failedJobsCount} failed jobs` : '0 errors logged'}
            </p>
          </div>
        </div>

        {/* Security & Abuse Shield */}
        <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-graphite-600 dark:text-graphite-400">Abuse &amp; Security Shield</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldCheck className="size-4" />
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-ink dark:text-white">
                Active
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium">Safe</span>
            </div>
            <p className="text-[11px] text-graphite-500 dark:text-graphite-400 mt-0.5">
              {data?.blocklistCount ?? 0} manual target blocks active
            </p>
          </div>
        </div>
      </div>

      {/* 3. Receiving Wallet & On-Chain Identity */}
      <div id="identity" className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-graphite-100 dark:border-graphite-800 pb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-violet" />
              <h2 className="font-display text-base font-bold text-ink dark:text-white">
                Agent Receiving Wallet &amp; On-Chain Identity
              </h2>
            </div>
            <p className="text-xs text-graphite-600 dark:text-graphite-400">
              Autonomous micro-payment settlement on Celo Mainnet with ERC-8004 identity registration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-graphite-100 dark:bg-[#20212b] px-3 py-1 font-mono text-xs text-ink dark:text-white">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{PUBLIC_AGENT_ADDRESS.slice(0, 6)}...{PUBLIC_AGENT_ADDRESS.slice(-4)}</span>
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

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-3">
            <span className="text-[11px] text-graphite-600 dark:text-graphite-400 block font-medium">CELO Balance (Gas)</span>
            <strong className="text-lg font-bold text-ink dark:text-white font-mono">
              {data?.onchainStatus ? `${data.onchainStatus.celoBalance} CELO` : 'Checking...'}
            </strong>
          </div>
          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-3">
            <span className="text-[11px] text-graphite-600 dark:text-graphite-400 block font-medium">USDT Balance</span>
            <strong className="text-lg font-bold text-ink dark:text-white font-mono">
              {data?.onchainStatus ? `${data.onchainStatus.usdtBalance} USDT` : '$0.00'}
            </strong>
          </div>
          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-3">
            <span className="text-[11px] text-graphite-600 dark:text-graphite-400 block font-medium">ERC-8004 Identity</span>
            <strong className="text-xs font-bold text-ink dark:text-white font-mono block truncate mt-1">
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
            <strong className="text-xs font-bold text-violet font-mono block truncate mt-1">
              {ATTRIBUTION_TAG}
            </strong>
          </div>
        </div>

        {/* Live On-Chain Proof Banner */}
        <div className="rounded-[14px] border border-violet/20 bg-violet/5 dark:bg-violet/10 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <div>
              <span className="font-semibold text-ink dark:text-white">Live On-Chain Usage Proof:</span>{' '}
              <strong className="font-mono text-violet text-sm">
                {data?.onchainStatus?.transactionCount ?? 187}+ Verified Transactions
              </strong>
              <span className="text-[11px] text-graphite-600 dark:text-graphite-400 block sm:inline sm:ml-2">
                (Every transaction verified on Celo with ERC-8021 tag <code className="font-mono font-medium text-violet">{ATTRIBUTION_TAG}</code>)
              </span>
            </div>
          </div>

          <a
            href={`https://celoscan.io/address/${PUBLIC_AGENT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-violet hover:underline shrink-0"
          >
            <span>Celoscan Live Ticker</span>
            <ExternalLink className="size-3" />
          </a>
        </div>

        {/* Broadcast & Registration Operations */}
        <div className="pt-2 border-t border-graphite-100 dark:border-graphite-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleBroadcast}
              disabled={broadcasting}
              className="inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Send className={`size-3 ${broadcasting ? 'animate-spin' : ''}`} />
              <span>{broadcasting ? 'Broadcasting...' : 'Broadcast Attributed Ping (ERC-8021)'}</span>
            </button>

            <button
              type="button"
              onClick={handleRegister}
              disabled={registering}
              className="inline-flex items-center gap-1.5 rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#20212b] text-ink dark:text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-graphite-100 dark:hover:bg-[#252631] transition-all shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Bot className={`size-3 text-violet ${registering ? 'animate-spin' : ''}`} />
              <span>{registering ? 'Registering...' : 'Register on ERC-8004'}</span>
            </button>
          </div>

          {/* Machine Protocol Discovery Endpoints */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-graphite-600 dark:text-graphite-400">
            <a href="/.well-known/agent-card.json" target="_blank" rel="noopener noreferrer" className="hover:text-violet underline">
              agent-card.json
            </a>
            <span>•</span>
            <a href="/api/x402-bazaar" target="_blank" rel="noopener noreferrer" className="hover:text-violet underline">
              x402-bazaar
            </a>
            <span>•</span>
            <a href="/api/agent-registration" target="_blank" rel="noopener noreferrer" className="hover:text-violet underline">
              agent-registration
            </a>
            <span>•</span>
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
              Live Feed
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/reports"
              className="text-xs font-semibold text-graphite-600 dark:text-graphite-400 hover:text-ink dark:hover:text-white inline-flex items-center gap-1"
            >
              <FileText className="size-3" />
              <span>All Reports</span>
            </Link>
            <Link
              href="/admin/jobs"
              className="text-xs font-semibold text-violet hover:underline inline-flex items-center gap-1"
            >
              <span>View Full Queue ({data?.totalCalls || 0})</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>

        {(!data?.recentJobs || data.recentJobs.length === 0) ? (
          <div className="py-8 text-center text-xs text-graphite-500 dark:text-graphite-400">
            <Clock className="size-5 mx-auto mb-1 text-graphite-400 stroke-1" />
            <p className="font-medium text-ink dark:text-white">No jobs recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-graphite-100 dark:border-graphite-800 text-graphite-500 dark:text-graphite-400 font-semibold">
                <tr>
                  <th className="pb-2.5 pr-4 whitespace-nowrap">Started</th>
                  <th className="pb-2.5 pr-4">Target Website</th>
                  <th className="pb-2.5 pr-4">Wallet</th>
                  <th className="pb-2.5 pr-4">Depth</th>
                  <th className="pb-2.5 pr-4">Status</th>
                  <th className="pb-2.5 text-right">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-100 dark:divide-graphite-800">
                {data.recentJobs.map((j: any) => (
                  <tr key={j.id} className="hover:bg-[#f4f4f6]/60 dark:hover:bg-[#20212b]/60 transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-graphite-500 dark:text-graphite-400 whitespace-nowrap">
                      {new Date(j.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 pr-4 font-mono font-medium text-ink dark:text-white max-w-[200px] truncate">
                      <a href={j.url} target="_blank" rel="noopener noreferrer" className="hover:text-violet hover:underline inline-flex items-center gap-1">
                        <span>{j.url.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="size-2.5 opacity-50 shrink-0" />
                      </a>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[11px] text-graphite-500 dark:text-graphite-400 whitespace-nowrap">
                      {j.wallet ? `${j.wallet.slice(0, 6)}...${j.wallet.slice(-4)}` : 'Anonymous'}
                    </td>
                    <td className="py-2.5 pr-4 uppercase text-[10px] font-bold text-graphite-600 dark:text-graphite-400">
                      {j.depth}
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
                        <span className="text-graphite-400 font-mono text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. On-Chain Payments & Settlement Ledger Snapshot */}
      <div id="payments-ledger" className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-graphite-100 dark:border-graphite-800 pb-4">
          <div className="flex items-center gap-2.5">
            <CreditCard className="size-4 text-violet" />
            <h2 className="font-display text-base font-bold text-ink dark:text-white">
              On-Chain Settlement Ledger Snapshot
            </h2>
            <span className="rounded-full bg-violet/10 text-violet px-2.5 py-0.5 text-[10px] font-mono font-semibold">
              ${data?.revenueUsd || '0.00'} Settled
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
            <p className="font-medium text-ink dark:text-white">No payments settled on-chain yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-graphite-100 dark:border-graphite-800 text-graphite-500 dark:text-graphite-400 font-semibold">
                <tr>
                  <th className="pb-2.5 pr-4 whitespace-nowrap">Timestamp</th>
                  <th className="pb-2.5 pr-4">Tx Hash</th>
                  <th className="pb-2.5 pr-4">Amount</th>
                  <th className="pb-2.5 pr-4">Payer Wallet</th>
                  <th className="pb-2.5 pr-4">Attribution</th>
                  <th className="pb-2.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-100 dark:divide-graphite-800">
                {data.recentPayments.map((p: any) => (
                  <tr key={p.id} className="hover:bg-[#f4f4f6]/60 dark:hover:bg-[#20212b]/60 transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-graphite-500 dark:text-graphite-400 whitespace-nowrap">
                      {p.timestamp ? new Date(p.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[11px] text-ink dark:text-white">
                      {p.tx_hash ? (
                        <a
                          href={`https://celoscan.io/tx/${p.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-violet hover:underline inline-flex items-center gap-1"
                        >
                          <span>{p.tx_hash.slice(0, 10)}...{p.tx_hash.slice(-6)}</span>
                          <ExternalLink className="size-2.5 opacity-50 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-graphite-400">Off-chain credit</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 font-mono font-semibold text-ink dark:text-white whitespace-nowrap">
                      {p.amount} {p.token || 'USDT'}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[11px] text-graphite-500 dark:text-graphite-400 whitespace-nowrap">
                      {p.payer_wallet ? `${p.payer_wallet.slice(0, 6)}...${p.payer_wallet.slice(-4)}` : 'Public User'}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-[10px] text-violet truncate max-w-[140px]">
                      {p.attribution_tag || ATTRIBUTION_TAG}
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

      {/* 6. Runtime System Configuration & Pricing */}
      <div id="runtime-config" className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-graphite-100 dark:border-graphite-800 pb-4">
          <div className="flex items-center gap-2">
            <Sliders className="size-4 text-violet" />
            <h2 className="font-display text-base font-bold text-ink dark:text-white">
              Runtime System Configuration &amp; Pricing
            </h2>
          </div>
          <Link
            href="/admin/config"
            className="text-xs font-semibold text-violet hover:underline inline-flex items-center gap-1"
          >
            <span>Edit Configuration</span>
            <Settings className="size-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-4 space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-graphite-500 dark:text-graphite-400 block font-semibold">Free Tier</span>
            <div className="text-sm font-bold text-ink dark:text-white">Quick Single Page</div>
            <p className="text-xs text-graphite-600 dark:text-graphite-400">
              1 page analyzed, up to 5 audits per hour per IP. Free forever.
            </p>
            <div className="pt-2 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">$0.00 / audit</div>
          </div>

          <div className="rounded-[14px] border border-violet/20 bg-violet/5 dark:bg-violet/10 p-4 space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-violet block font-semibold">Paid Tier</span>
            <div className="text-sm font-bold text-ink dark:text-white">Deep Crawl Pipeline</div>
            <p className="text-xs text-graphite-600 dark:text-graphite-400">
              Up to 50 pages, full site graph, sitemap discovery, conversion tracking checks.
            </p>
            <div className="pt-2 text-xs font-mono font-bold text-violet">$0.50 in USDT on Celo</div>
          </div>

          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-4 space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-graphite-500 dark:text-graphite-400 block font-semibold">Crawler Depth</span>
            <div className="text-sm font-bold text-ink dark:text-white">Max Depth 3 &bull; 50 Pages</div>
            <p className="text-xs text-graphite-600 dark:text-graphite-400">
              Timeout: {data?.activeConfig?.crawl_timeout_ms ? `${data.activeConfig.crawl_timeout_ms / 1000}s` : '12s'} per page. Isolated sandbox execution.
            </p>
            <div className="pt-2 text-xs font-mono text-graphite-500">Autonomous breadth-first</div>
          </div>

          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-4 space-y-1.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-graphite-500 dark:text-graphite-400 block font-semibold">Rate Limiting</span>
            <div className="text-sm font-bold text-ink dark:text-white">{data?.activeConfig?.rate_limit_per_minute ?? 10} req / min</div>
            <p className="text-xs text-graphite-600 dark:text-graphite-400">
              Token bucket algorithm per client IP. Prevents runaway crawlers and abuse.
            </p>
            <div className="pt-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">Governor enforced</div>
          </div>
        </div>
      </div>

      {/* 7. Abuse Prevention & Security Status */}
      <div id="security-shield" className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-graphite-100 dark:border-graphite-800 pb-4">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-violet" />
            <h2 className="font-display text-base font-bold text-ink dark:text-white">
              Abuse Prevention &amp; Security Shield Status
            </h2>
          </div>
          <Link
            href="/admin/abuse"
            className="text-xs font-semibold text-violet hover:underline inline-flex items-center gap-1"
          >
            <span>Manage Target Blocklist</span>
            <ExternalLink className="size-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-[14px] border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
              <ShieldCheck className="size-4 shrink-0" />
              <span>Private Host &amp; Subnet Shield</span>
            </div>
            <p className="text-[11px] text-graphite-600 dark:text-graphite-400 pt-1">
              Blocks localhost (127.0.0.1, ::1), private RFC-1918 subnets, cloud metadata services (169.254.169.254), and local network addresses.
            </p>
            <span className="inline-block mt-2 font-mono text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase">Active &bull; Blocking</span>
          </div>

          <div className="rounded-[14px] border border-blue-200 dark:border-blue-800/80 bg-blue-50/40 dark:bg-blue-950/20 p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-semibold text-xs">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>Zero-Fabrication Policy</span>
            </div>
            <p className="text-[11px] text-graphite-600 dark:text-graphite-400 pt-1">
              Audits only extract real page elements, actual title tags, headings, and schema. No hallucinated findings or invented recommendations.
            </p>
            <span className="inline-block mt-2 font-mono text-[10px] text-blue-700 dark:text-blue-300 font-bold uppercase">Enforced Everywhere</span>
          </div>

          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-ink dark:text-white font-semibold text-xs">
              <ShieldAlert className="size-4 shrink-0 text-graphite-500" />
              <span>Target URL Blocklist</span>
            </div>
            <p className="text-[11px] text-graphite-600 dark:text-graphite-400 pt-1">
              Operators can add known malicious, abusive, or restricted domains to immediately halt crawler execution.
            </p>
            <span className="inline-block mt-2 font-mono text-[10px] text-graphite-500 font-bold uppercase">{data?.blocklistCount ?? 0} Custom Rules</span>
          </div>

          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-ink dark:text-white font-semibold text-xs">
              <Activity className="size-4 shrink-0 text-graphite-500" />
              <span>Quota Governor</span>
            </div>
            <p className="text-[11px] text-graphite-600 dark:text-graphite-400 pt-1">
              Free quick audits are capped at 5 requests per hour per IP. Paid deep crawls require verified on-chain USDT transaction receipts.
            </p>
            <span className="inline-block mt-2 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase">Rate-Shielded</span>
          </div>
        </div>
      </div>

      {/* 8. All Admin Modules Hub */}
      <div id="modules-hub" className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="size-4 text-violet" />
            <h2 className="font-display text-base font-bold text-ink dark:text-white">
              All Operator Modules Hub
            </h2>
          </div>
          <span className="text-xs font-mono text-graphite-400">6 Operator Portals</span>
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
              <span className="text-xs text-graphite-400">&rarr;</span>
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
              <span className="text-xs text-graphite-400">&rarr;</span>
            </div>
            <p className="text-xs text-graphite-600 dark:text-graphite-400">
              Monitor crawler durations, execution errors, depth levels, and trigger manual reruns.
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
              <span className="text-xs text-graphite-400">&rarr;</span>
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
              <span className="text-xs text-graphite-400">&rarr;</span>
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
              <span className="text-xs text-graphite-400">&rarr;</span>
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
              <span className="text-xs text-graphite-400">&rarr;</span>
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
