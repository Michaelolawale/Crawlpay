'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Layers,
  CircleDollarSign,
  Hash,
  Globe,
  RefreshCw,
  Wallet,
  Sparkles,
  AlertCircle,
  Loader2,
  Check,
  Copy,
  Radio,
  FileCheck2,
} from 'lucide-react';
import { CONFIG } from '@/config';

export interface ActivityFeedItem {
  id: string;
  date: string;
  targetUrl: string;
  mode: 'quick' | 'full';
  amountUsd: string;
  txHash: string;
  celoscanUrl: string;
  attributionTag: string;
  isRealBroadcast?: boolean;
}

export function ActivityTab() {
  const [activities, setActivities] = useState<ActivityFeedItem[]>([]);
  const [agentStatus, setAgentStatus] = useState<any>(null);
  const [blockHeight, setBlockHeight] = useState<number>(31849200);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string; txHash?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const loadActivities = () => {
    try {
      const stored = localStorage.getItem('crawlpay_activity');
      if (stored) {
        const parsed: ActivityFeedItem[] = JSON.parse(stored);
        setActivities(parsed);
      } else {
        setActivities([]);
      }
    } catch (e) {
      console.warn('Failed to load activity logs:', e);
    }
  };

  const fetchStatus = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/agent/status');
      if (res.ok) {
        const data = await res.json();
        setAgentStatus(data);
        if (data.blockNumber) {
          setBlockHeight(data.blockNumber);
        }
      }
    } catch {
      // Fallback
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadActivities();
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(CONFIG.AGENT_WALLET_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegisterIdentity = async () => {
    setActionLoading('register');
    setActionFeedback(null);
    try {
      const res = await fetch('/api/agent/register', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          message: `Successfully registered ERC-8004 Identity! Agent ID #${data.agentId || 'Verified'}.`,
          txHash: data.txHash,
        });
        fetchStatus();
      } else {
        setActionFeedback({
          type: 'error',
          message: data?.error || 'Registration failed. Make sure the wallet has CELO for gas.',
        });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err?.message || 'Failed to call registration endpoint.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleBroadcastPing = async () => {
    setActionLoading('ping');
    setActionFeedback(null);
    try {
      const res = await fetch('/api/agent/broadcast', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionFeedback({
          type: 'success',
          message: `Attributed transaction broadcast and mined on Celo Mainnet!`,
          txHash: data.txHash,
        });
        // Add to activity ledger
        const newItem: ActivityFeedItem = {
          id: `act_${Date.now()}`,
          date: new Date().toISOString(),
          targetUrl: 'Celo Mainnet Health Check (Attributed Ping)',
          mode: 'quick',
          amountUsd: '0.00',
          txHash: data.txHash,
          celoscanUrl: `https://celoscan.io/tx/${data.txHash}`,
          attributionTag: CONFIG.ATTRIBUTION_TAG,
          isRealBroadcast: true,
        };
        const updated = [newItem, ...activities];
        setActivities(updated);
        try {
          localStorage.setItem('crawlpay_activity', JSON.stringify(updated));
        } catch {}
        fetchStatus();
      } else {
        setActionFeedback({
          type: 'error',
          message: data?.error || 'Broadcast failed. Make sure the wallet has at least 0.01 CELO for gas.',
        });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err?.message || 'Failed to broadcast ping.' });
    } finally {
      setActionLoading(null);
    }
  };

  const totalSettledUsd = activities.reduce((acc, curr) => acc + parseFloat(curr.amountUsd || '0'), 0).toFixed(2);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Onchain Activity & Proof of Settlement
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verifiable transactions settled on Celo Mainnet carrying the hackathon attribution tag.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            loadActivities();
            fetchStatus();
          }}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`size-3.5 text-primary ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Action feedback toast / alert */}
      {actionFeedback && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-xs animate-in fade-in ${
            actionFeedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-destructive/30 bg-destructive/10 text-destructive'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-destructive" />
            )}
            <div>
              <p className="font-medium">{actionFeedback.message}</p>
              {actionFeedback.txHash && (
                <a
                  href={`https://celoscan.io/tx/${actionFeedback.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] underline"
                >
                  <span>View on Celoscan: {actionFeedback.txHash}</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            &times;
          </button>
        </div>
      )}

      {/* Proof Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {/* Total Audits */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <Activity className="size-4 text-primary" />
            <span>Total Audits</span>
          </div>
          <span className="font-display text-2xl font-bold text-foreground">{activities.length}</span>
          <p className="mt-1 text-[11px] text-muted-foreground">Executed crawls in session</p>
        </div>

        {/* Total Settlements */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <CircleDollarSign className="size-4 text-emerald-400" />
            <span>Settled Volume</span>
          </div>
          <span className="font-display text-2xl font-bold text-foreground font-mono">
            ${totalSettledUsd} USD₮
          </span>
          <p className="mt-1 text-[11px] text-muted-foreground">Settled on Celo rails</p>
        </div>

        {/* Live Block Number */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <Layers className="size-4 text-primary" />
            <span>Celo Block</span>
          </div>
          <span className="font-display text-2xl font-bold text-foreground font-mono">
            #{blockHeight.toLocaleString()}
          </span>
          <p className="mt-1 text-[11px] text-muted-foreground">Gas: {agentStatus?.gasPriceGwei || '0.500'} Gwei</p>
        </div>

        {/* Attribution Status */}
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <ShieldCheck className="size-4 text-primary" />
            <span>Attribution Tag</span>
          </div>
          <span className="font-mono text-xs font-bold text-primary block truncate">
            {CONFIG.ATTRIBUTION_TAG}
          </span>
          <span className="mt-1.5 inline-flex items-center gap-1 rounded bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 text-[10px] font-semibold border border-emerald-500/30">
            <CheckCircle2 className="size-2.5" />
            Verified ERC-8021
          </span>
        </div>
      </div>

      {/* Mainnet Agent Live Identity & Checklist Panel */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-primary/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/20 text-primary border border-primary/30">
              <Wallet className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-bold text-foreground">
                  Celo Mainnet Agent Hotwallet & ERC-8004 Protocol
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Chain ID 42220
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Public address sending autonomous transactions and receiving x402 audit settlements
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegisterIdentity}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors disabled:opacity-60"
            >
              {actionLoading === 'register' ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileCheck2 className="size-3.5" />
              )}
              <span>Register ERC-8004 Identity</span>
            </button>

            <button
              type="button"
              onClick={handleBroadcastPing}
              disabled={actionLoading !== null}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60"
            >
              {actionLoading === 'ping' ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Radio className="size-3.5" />
              )}
              <span>Broadcast Attributed Tx</span>
            </button>
          </div>
        </div>

        {/* Address and balances detail */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div>
            <span className="text-muted-foreground block text-[11px] mb-1">Agent Wallet:</span>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-foreground font-semibold truncate">{CONFIG.AGENT_WALLET_ADDRESS}</span>
              <button onClick={copyAddress} className="text-primary hover:text-primary/80 shrink-0">
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              </button>
              <a
                href={`https://celoscan.io/address/${CONFIG.AGENT_WALLET_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:text-primary/80 shrink-0"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>

          <div>
            <span className="text-muted-foreground block text-[11px] mb-1">CELO Gas Balance:</span>
            <span className="font-mono font-bold text-foreground text-sm">
              {agentStatus?.celoBalance ? `${agentStatus.celoBalance} CELO` : '0.0000 CELO'}
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[11px] mb-1">Stablecoin Balances:</span>
            <span className="font-mono text-foreground font-semibold">
              {agentStatus?.usdtBalance || '0'} USD₮ · {agentStatus?.cusdBalance || '0'} cUSD
            </span>
          </div>

          <div>
            <span className="text-muted-foreground block text-[11px] mb-1">ERC-8004 Identity NFT:</span>
            {agentStatus?.isRegistered ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                <span>Registered (ID #{agentStatus.agentId || 'Verified'})</span>
              </span>
            ) : (
              <span className="text-amber-400 font-medium">Pending Onchain Mint</span>
            )}
          </div>
        </div>

        {/* Loops Hackathon Attribution Guide */}
        <div className="mt-4 rounded-lg border border-border/80 bg-background/80 p-3 text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400" />
            <span>
              <strong>Loops Hackathon Rule:</strong> Transactions must carry suffix{' '}
              <code className="text-primary font-mono">{CONFIG.ATTRIBUTION_TAG}</code> to be credited on Celo Mainnet.
            </span>
          </div>
          <a
            href="https://www.loops.house/agents-on-open-rails/playground/submit"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
          >
            <span>Loops Submission & Checklist</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      </div>

      {/* Live Activity Feed Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/40 p-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Verified Settlement & Audit Ledger
          </h3>
          <span className="text-xs text-muted-foreground">{activities.length} total events</span>
        </div>
        <div className="overflow-x-auto">
          {activities.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No audits executed in this session yet. Run an audit on the <strong>Audit</strong> tab or click <strong>Broadcast Attributed Tx</strong> to generate onchain activity.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-background/50 font-semibold text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Target Website / Action</th>
                  <th className="py-3 px-4">Depth</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Attribution Tag</th>
                  <th className="py-3 px-4 text-right">Celo Explorer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono text-[11px]">
                {activities.map((item) => (
                  <tr key={item.id} className="hover:bg-accent/30 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground font-sans whitespace-nowrap">
                      {new Date(item.date).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      <span className="truncate max-w-[240px] block">{item.targetUrl}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="rounded bg-secondary border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground font-sans uppercase">
                        {item.mode}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">
                      ${item.amountUsd} USD₮
                    </td>
                    <td className="py-3 px-4 text-primary font-semibold">
                      {item.attributionTag}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <a
                        href={item.celoscanUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <span>
                          {item.txHash && item.txHash.length > 14
                            ? `${item.txHash.slice(0, 8)}...${item.txHash.slice(-6)}`
                            : item.txHash}
                        </span>
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
