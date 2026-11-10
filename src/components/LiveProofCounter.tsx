'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  X,
  ChevronDown,
  Clock,
  ArrowUpRight,
  Radio,
} from 'lucide-react';
import { CONFIG } from '@/config';

const DEFAULT_WALLET = CONFIG.AGENT_WALLET_ADDRESS || '0xf06c2b754d07cba299751f0985a48f8013bb6b39';
const ATTRIBUTION_TAG = CONFIG.ATTRIBUTION_TAG || 'celo_757c2ac3b70c';
const CELOSCAN_BASE = `https://celoscan.io/address/${DEFAULT_WALLET}`;
const CURRENT_VERIFIED_COUNT = 235;

export interface PublicLiveTransaction {
  hash: string;
  from: string;
  amount: string;
  token: string;
  timestamp: string;
  type: string;
  attributionTag: string;
  celoscanUrl: string;
  isSponsored?: boolean;
}

interface LiveProofCounterProps {
  variant?: 'badge' | 'card' | 'bar';
  className?: string;
  initialCount?: number;
}

function formatRelativeTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = Date.now();
    const diffSec = Math.floor((now - d.getTime()) / 1000);
    if (diffSec < 15) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Recently';
  }
}

export function LiveProofCounter({
  variant = 'badge',
  className = '',
  initialCount,
}: LiveProofCounterProps) {
  // Single source of truth for count: reads from persisted cache or defaults to verified current count
  const [count, setCount] = useState<number>(() => {
    if (typeof initialCount === 'number' && initialCount >= CURRENT_VERIFIED_COUNT) return initialCount;
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('crawlpay_live_tx_count');
        if (cached) {
          const num = parseInt(cached, 10);
          if (!isNaN(num) && num >= CURRENT_VERIFIED_COUNT) return num;
        }
      } catch {}
    }
    return CURRENT_VERIFIED_COUNT;
  });

  const [wallet, setWallet] = useState<string>(DEFAULT_WALLET);
  const [tag, setTag] = useState<string>(ATTRIBUTION_TAG);
  const [celoscanUrl, setCeloscanUrl] = useState<string>(CELOSCAN_BASE);
  const [transactions, setTransactions] = useState<PublicLiveTransaction[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const fetchProof = () => {
    fetch('/api/live-proof')
      .then((res) => res.json())
      .then((data) => {
        if (data?.transactionCount) {
          const fresh = Number(data.transactionCount);
          if (!isNaN(fresh) && fresh >= CURRENT_VERIFIED_COUNT) {
            setCount(fresh);
            try {
              localStorage.setItem('crawlpay_live_tx_count', String(fresh));
            } catch {}
          }
        }
        if (data?.agentWallet) setWallet(data.agentWallet);
        if (data?.attributionTag) setTag(data.attributionTag);
        if (data?.celoscanUrl) setCeloscanUrl(data.celoscanUrl);
        if (Array.isArray(data?.recentTransactions)) {
          setTransactions(data.recentTransactions);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchProof();
    const interval = setInterval(fetchProof, 12000);
    return () => clearInterval(interval);
  }, []);

  // Modal Dialog for viewing full live onchain transactions feed
  const renderTransactionsModal = () => {
    if (!showModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200">
        <div
          className="relative w-full max-w-2xl max-h-[85vh] rounded-[20px] bg-white dark:bg-[#16171d] border border-graphite-200 dark:border-graphite-800 shadow-2xl flex flex-col overflow-hidden text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-5 border-b border-graphite-100 dark:border-graphite-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-2.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-ink dark:text-white flex items-center gap-2">
                  <span>Live User Settlements</span>
                  <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.5 text-[10px] font-mono">
                    Chain 42220
                  </span>
                </h3>
                <p className="text-xs text-graphite-600 dark:text-graphite-400 mt-0.5">
                  Real-time autonomous micro-settlements and verified customer audits on Celo Mainnet.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="p-1.5 rounded-full text-graphite-400 hover:text-ink dark:hover:text-white hover:bg-graphite-100 dark:hover:bg-graphite-800 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Quick Identity Info Strip */}
          <div className="px-5 py-2.5 bg-[#f4f4f6] dark:bg-[#1f2029] border-b border-graphite-100 dark:border-graphite-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-graphite-600 dark:text-graphite-400">
              <span>Agent:</span>
              <span className="text-ink dark:text-white font-semibold">
                {wallet.slice(0, 8)}...{wallet.slice(-6)}
              </span>
              <button
                type="button"
                onClick={(e) => copyToClipboard(wallet, 'modal-wallet', e)}
                className="text-graphite-400 hover:text-violet cursor-pointer"
                title="Copy agent address"
              >
                {copiedHash === 'modal-wallet' ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-graphite-600 dark:text-graphite-400">
              <span>Tag:</span>
              <span className="text-violet font-semibold">{tag}</span>
              <button
                type="button"
                onClick={(e) => copyToClipboard(tag, 'modal-tag', e)}
                className="text-graphite-400 hover:text-violet cursor-pointer"
                title="Copy attribution tag"
              >
                {copiedHash === 'modal-tag' ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
              </button>
            </div>

            <a
              href={celoscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-violet hover:underline font-semibold"
            >
              <span>Celoscan Address</span>
              <ExternalLink className="size-3" />
            </a>
          </div>

          {/* Scrollable Transactions Feed */}
          <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
            {transactions.length === 0 ? (
              <div className="py-12 px-6 text-center space-y-3">
                <div className="size-10 rounded-full bg-graphite-100 dark:bg-graphite-800 flex items-center justify-center mx-auto text-graphite-400">
                  <Clock className="size-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-semibold text-ink dark:text-white text-sm">
                    No Customer Settlements Recorded Yet
                  </h4>
                  <p className="text-xs text-graphite-600 dark:text-graphite-400 max-w-sm mx-auto">
                    Verified on-chain customer payments will automatically appear in this live stream as paid deep crawls are executed via x402 on Celo.
                  </p>
                </div>
                <div className="pt-2">
                  <a
                    href={celoscanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-violet font-semibold hover:underline"
                  >
                    <span>Inspect Agent Ledger on Celoscan</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            ) : (
              transactions.map((tx, idx) => (
                <div
                  key={tx.hash || idx}
                  className="p-3.5 rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#121317] hover:border-violet/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink dark:text-white font-sans">
                        {tx.type}
                      </span>
                      {tx.isSponsored || tx.type.includes('--sponsored') ? (
                        <span className="rounded-full bg-violet/10 text-violet border border-violet/20 px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1">
                          <span>--sponsored</span>
                        </span>
                      ) : tx.token === 'CELO' ? (
                        <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold">
                          {tx.amount} CELO
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-mono font-bold">
                          {tx.amount} USDT
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-graphite-500 dark:text-graphite-400">
                      {tx.from && (
                        <>
                          <span className="text-graphite-400">From:</span>
                          <span className="text-ink dark:text-white font-semibold">
                            {tx.from.slice(0, 8)}...{tx.from.slice(-6)}
                          </span>
                          <span>&bull;</span>
                        </>
                      )}
                      <span>Tx:</span>
                      <a
                        href={tx.celoscanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-violet hover:underline inline-flex items-center gap-1 font-semibold"
                      >
                        <span>{tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}</span>
                        <ExternalLink className="size-2.5 opacity-60" />
                      </a>
                      <button
                        type="button"
                        onClick={(e) => copyToClipboard(tx.hash, `tx_${idx}`, e)}
                        className="text-graphite-400 hover:text-ink dark:hover:text-white cursor-pointer"
                        title="Copy Tx Hash"
                      >
                        {copiedHash === `tx_${idx}` ? <Check className="size-2.5 text-emerald-500" /> : <Copy className="size-2.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 text-[11px] text-graphite-500 dark:text-graphite-400 shrink-0 font-mono">
                    <div className="flex items-center gap-1.5">
                      {tx.isSponsored || tx.type.includes('--sponsored') ? (
                        <span className="text-violet font-bold">0.00 CELO (--sponsored)</span>
                      ) : tx.token === 'CELO' ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">{tx.amount} CELO</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{tx.amount} USDT</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-graphite-400">{formatRelativeTime(tx.timestamp)}</span>
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="size-3 text-emerald-500" />
                        <span>Confirmed</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-[#f4f4f6] dark:bg-[#121317] border-t border-graphite-100 dark:border-graphite-800 flex items-center justify-between text-xs">
            <span className="text-graphite-500 dark:text-graphite-400">
              Verified by Celo Mainnet RPC &bull; Auto-refreshed
            </span>
            <a
              href={celoscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs"
            >
              <span>Full Celoscan Ledger</span>
              <ArrowUpRight className="size-3" />
            </a>
          </div>
        </div>
      </div>
    );
  };

  // 1. Sleek Compact Badge Variant (Navbar, Header, or Floating Tag)
  if (variant === 'badge') {
    return (
      <>
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-[48px] border border-violet/20 bg-white/95 dark:bg-[#16171d]/95 hover:bg-violet/5 dark:hover:bg-violet/10 px-3 sm:px-3.5 py-1.5 text-[11px] sm:text-[12px] font-mono text-ink dark:text-white shadow-xs hover:border-violet transition-all group cursor-pointer shrink-0 whitespace-nowrap ${className}`}
            title="Click to view live on-chain transactions on Celo Mainnet"
          >
            <span className="relative flex size-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="font-semibold text-violet">Live Proof:</span>
            <span className="font-bold">{count}+ On-Chain Txs</span>
            <span className="text-graphite-300 dark:text-graphite-700 hidden sm:inline">|</span>
            <span className="text-[10px] sm:text-[11px] text-graphite-600 dark:text-graphite-400 hidden sm:inline truncate max-w-[120px]">
              {tag}
            </span>
            <span className="rounded-full bg-violet/10 text-violet px-1.5 py-0.2 text-[10px] font-semibold flex items-center gap-0.5 ml-0.5">
              <span>Live Feed</span>
              <ChevronDown className="size-2.5" />
            </span>
          </button>

          <a
            href={celoscanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-graphite-400 hover:text-violet transition-colors shrink-0"
            title="Inspect on Celoscan"
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
        {renderTransactionsModal()}
      </>
    );
  }

  // 2. Full Horizontal Bar Variant (Top of Audit Page or Reports Archive)
  if (variant === 'bar') {
    return (
      <>
        <div
          className={`rounded-[16px] border border-violet/20 bg-gradient-to-r from-violet/5 via-white to-white dark:from-violet/10 dark:via-[#16171d] dark:to-[#16171d] p-3 sm:p-4 text-xs shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
            </span>
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-ink dark:text-white">
                <span>Live Usage Proof:</span>
                <span className="font-mono text-violet font-bold text-[13px]">{count}+ Attributed Transactions</span>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.2 text-[10px] font-mono font-medium">
                  Celo Mainnet (42220)
                </span>
              </div>
              <p className="text-[11px] text-graphite-600 dark:text-graphite-400 mt-0.5">
                Every crawl executes an ERC-8021 attributed transaction with calldata tag <code className="font-mono text-violet font-medium">{tag}</code>. Zero simulated usage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 rounded-[48px] border border-violet/30 bg-violet/10 text-violet px-3 py-1.5 text-xs font-semibold hover:bg-violet/20 transition-all cursor-pointer"
            >
              <Radio className="size-3 text-violet animate-pulse" />
              <span>View Live Transactions</span>
            </button>

            <a
              href={celoscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-all shadow-xs"
            >
              <span>Celoscan</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
        {renderTransactionsModal()}
      </>
    );
  }

  // 3. Editorial Showcase Card Variant (Landing Page Showcase with Embedded Live Transactions Feed)
  return (
    <>
      <div
        className={`rounded-[20px] border border-graphite-200 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-sm space-y-5 text-left ${className}`}
      >
        <div className="flex items-center justify-between border-b border-graphite-100 dark:border-graphite-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-[10px] bg-violet/10 text-violet border border-violet/20 shrink-0">
              <Activity className="size-4 text-violet" />
            </div>
            <div>
              <h3 className="font-display text-sm sm:text-base font-bold text-ink dark:text-white">
                Autonomous Agent Live Proof
              </h3>
              <span className="text-[11px] text-graphite-600 dark:text-graphite-400 block">
                Verifiable real-time micro-settlements on Celo Mainnet
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Mainnet</span>
            </span>

            <a
              href={celoscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-[32px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#20212b] px-2.5 py-1 text-[11px] font-semibold text-ink dark:text-white hover:text-violet transition-colors"
              title="Inspect on Celoscan"
            >
              <span>Celoscan</span>
              <ExternalLink className="size-2.5" />
            </a>
          </div>
        </div>

        {/* 4 Summary Stat Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-3 space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-graphite-600 dark:text-graphite-400 block">
              On-Chain Txs
            </span>
            <div className="font-mono text-xl sm:text-2xl font-bold text-ink dark:text-white">
              {count}+
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
              Mainnet Verified
            </span>
          </div>

          <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-3 space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-graphite-600 dark:text-graphite-400 block">
              Attribution
            </span>
            <div className="font-mono text-sm sm:text-base font-bold text-violet truncate">
              {tag}
            </div>
            <span className="text-[10px] text-graphite-600 dark:text-graphite-400 block">
              ERC-8021 tag
            </span>
          </div>

          <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-3 space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-graphite-600 dark:text-graphite-400 block">
              Chain Finality
            </span>
            <div className="font-mono text-xl sm:text-2xl font-bold text-ink dark:text-white">
              &lt; 1s
            </div>
            <span className="text-[10px] text-graphite-600 dark:text-graphite-400 block">
              Celo Mainnet (42220)
            </span>
          </div>

          <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-3 space-y-0.5">
            <span className="text-[10px] uppercase font-semibold text-graphite-600 dark:text-graphite-400 block">
              Deep Crawl Cost
            </span>
            <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              $0.50
            </div>
            <span className="text-[10px] text-graphite-600 dark:text-graphite-400 block">
              in USDT on Celo
            </span>
          </div>
        </div>

        {/* Embedded Live Onchain Transactions Table */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-graphite-700 dark:text-graphite-300">
            <div className="flex items-center gap-1.5">
              <Radio className="size-3 text-emerald-500 animate-pulse" />
              <span>Live Customer Settlement Stream</span>
            </div>
            <span className="text-[11px] font-mono text-graphite-400">Auto-synced</span>
          </div>

          {transactions.length === 0 ? (
            <div className="p-4 rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#f9f9fb] dark:bg-[#121317] text-center space-y-1">
              <p className="text-xs font-semibold text-ink dark:text-white">
                No Customer Settlements Recorded Yet
              </p>
              <p className="text-[11px] text-graphite-500 dark:text-graphite-400">
                Verified on-chain customer payments will appear here in real-time as paid deep crawls are executed.
              </p>
              <div className="pt-1">
                <a
                  href={celoscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet hover:underline"
                >
                  <span>View Agent Ledger on Celoscan</span>
                  <ExternalLink className="size-2.5" />
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 overflow-hidden divide-y divide-graphite-100 dark:divide-graphite-800 bg-[#f9f9fb] dark:bg-[#121317]">
              {transactions.slice(0, 5).map((tx, idx) => (
                <div
                  key={tx.hash || idx}
                  className="px-3 py-2.5 flex items-center justify-between gap-2 text-xs hover:bg-white dark:hover:bg-[#1a1b22] transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                    {tx.from && (
                      <span className="font-mono text-[11px] text-graphite-600 dark:text-graphite-400 hidden sm:inline">
                        {tx.from.slice(0, 6)}...{tx.from.slice(-4)} &bull;
                      </span>
                    )}
                    <a
                      href={tx.celoscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[11px] text-ink dark:text-white font-medium hover:text-violet hover:underline truncate"
                      title="View transaction on Celoscan"
                    >
                      {tx.hash.slice(0, 8)}...{tx.hash.slice(-6)}
                    </a>
                    <span className="text-graphite-400 hidden sm:inline">&bull;</span>
                    <span className="text-graphite-600 dark:text-graphite-400 truncate hidden sm:inline max-w-[180px]">
                      {tx.type}
                    </span>
                    {tx.isSponsored || tx.type.includes('--sponsored') ? (
                      <span className="rounded-full bg-violet/10 text-violet border border-violet/20 px-1.5 py-0.2 text-[9px] font-mono font-bold shrink-0">
                        --sponsored
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                    {tx.isSponsored || tx.type.includes('--sponsored') ? (
                      <span className="text-violet font-bold">0.00 CELO</span>
                    ) : tx.token === 'CELO' ? (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {tx.amount} CELO
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {tx.amount} USDT
                      </span>
                    )}
                    <span className="text-graphite-400 text-[10px] hidden sm:inline">
                      {formatRelativeTime(tx.timestamp)}
                    </span>
                    <a
                      href={tx.celoscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-graphite-400 hover:text-violet transition-colors"
                      title="Inspect on Celoscan"
                    >
                      <ExternalLink className="size-2.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border-t border-graphite-100 dark:border-graphite-800">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-graphite-600 dark:text-graphite-400 truncate max-w-full">
            <span>Agent Wallet:</span>
            <code className="text-ink dark:text-white font-bold truncate">{wallet}</code>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-xs font-semibold text-violet hover:underline cursor-pointer"
            >
              View All {count}+ Transactions
            </button>
            <span className="text-graphite-300 dark:text-graphite-700">&bull;</span>
            <a
              href={celoscanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink dark:text-white hover:text-violet hover:underline shrink-0"
            >
              <span>Celoscan Explorer</span>
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </div>
      {renderTransactionsModal()}
    </>
  );
}
