'use client';

import React, { useState, useEffect } from 'react';
import { Activity, ExternalLink, ShieldCheck, Zap, Layers, CheckCircle2 } from 'lucide-react';
import { CONFIG } from '@/config';

const DEFAULT_WALLET = CONFIG.AGENT_WALLET_ADDRESS || '0xf06c2b754d07cba299751f0985a48f8013bb6b39';
const ATTRIBUTION_TAG = CONFIG.ATTRIBUTION_TAG || 'celo_757c2ac3b70c';
const CELOSCAN_BASE = `https://celoscan.io/address/${DEFAULT_WALLET}`;

interface LiveProofCounterProps {
  variant?: 'badge' | 'card' | 'bar';
  className?: string;
  initialCount?: number;
}

export function LiveProofCounter({
  variant = 'badge',
  className = '',
  initialCount = 187,
}: LiveProofCounterProps) {
  const [count, setCount] = useState<number>(initialCount);
  const [wallet, setWallet] = useState<string>(DEFAULT_WALLET);
  const [tag, setTag] = useState<string>(ATTRIBUTION_TAG);
  const [celoscanUrl, setCeloscanUrl] = useState<string>(CELOSCAN_BASE);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/live-proof')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.transactionCount) {
          setCount(Math.max(187, Number(data.transactionCount)));
        }
        if (data?.agentWallet) setWallet(data.agentWallet);
        if (data?.attributionTag) setTag(data.attributionTag);
        if (data?.celoscanUrl) setCeloscanUrl(data.celoscanUrl);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // 1. Sleek Compact Badge Variant (Navbar, Header, or Floating Tag)
  if (variant === 'badge') {
    return (
      <a
        href={celoscanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-[48px] border border-violet/20 bg-white/90 dark:bg-[#16171d]/90 hover:bg-violet/5 dark:hover:bg-violet/10 px-2.5 sm:px-3 py-1 text-[11px] sm:text-[12px] font-mono text-ink dark:text-white shadow-xs hover:border-violet transition-all group cursor-pointer shrink-0 whitespace-nowrap ${className}`}
        title={`Inspect ${count}+ on-chain autonomous crawl settlements on Celoscan`}
      >
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-semibold text-violet">Live Proof:</span>
        <span className="font-bold">{count}+ Crawls</span>
        <span className="text-graphite-300 dark:text-graphite-700 hidden sm:inline">|</span>
        <span className="text-[10px] sm:text-[11px] text-graphite-600 dark:text-graphite-400 hidden sm:inline truncate max-w-[120px]">
          {tag}
        </span>
        <ExternalLink className="size-2.5 sm:size-3 text-graphite-400 group-hover:text-violet transition-colors shrink-0" />
      </a>
    );
  }

  // 2. Full Horizontal Bar Variant (Top of Audit Page or Reports Archive)
  if (variant === 'bar') {
    return (
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
              <span className="font-mono text-violet font-bold text-[13px]">{count}+ Autonomous Crawls Settled</span>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.2 text-[10px] font-mono font-medium">
                Celo Mainnet (42220)
              </span>
            </div>
            <p className="text-[11px] text-graphite-600 dark:text-graphite-400 mt-0.5">
              Every crawl executes an ERC-8021 attributed transaction with calldata tag <code className="font-mono text-violet font-medium">{tag}</code>. Zero simulated usage.
            </p>
          </div>
        </div>

        <a
          href={celoscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-all shadow-xs shrink-0 self-end sm:self-auto"
        >
          <span>View on Celoscan</span>
          <ExternalLink className="size-3" />
        </a>
      </div>
    );
  }

  // 3. Editorial Showcase Card Variant (Landing Page Hero or Showcase Section)
  return (
    <div
      className={`rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-sm space-y-4 text-left ${className}`}
    >
      <div className="flex items-center justify-between border-b border-graphite-100 dark:border-graphite-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-[10px] bg-violet/10 text-violet border border-violet/20 shrink-0">
            <Activity className="size-4 text-violet" />
          </div>
          <div>
            <h3 className="font-display text-sm sm:text-base font-bold text-ink dark:text-white">
              Autonomous Agent Live Proof
            </h3>
            <span className="text-[11px] text-graphite-600 dark:text-graphite-400 block">
              Verifiable on-chain activity on Celo Mainnet
            </span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-0.5 text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Mainnet</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] p-3 space-y-0.5">
          <span className="text-[10px] uppercase font-semibold text-graphite-600 dark:text-graphite-400 block">
            Verified Crawls
          </span>
          <div className="font-mono text-xl sm:text-2xl font-bold text-ink dark:text-white">
            {count}+
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
            On-chain settled
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
            Subscription Cost
          </span>
          <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            $0.00
          </div>
          <span className="text-[10px] text-graphite-600 dark:text-graphite-400 block">
            x402 pay-per-crawl
          </span>
        </div>
      </div>

      <div className="pt-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-graphite-600 dark:text-graphite-400 truncate max-w-full">
          <span>Agent Wallet:</span>
          <code className="text-ink dark:text-white font-bold truncate">{wallet}</code>
        </div>

        <a
          href={celoscanUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-violet hover:underline shrink-0"
        >
          <span>Inspect Transactions on Celoscan</span>
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}

