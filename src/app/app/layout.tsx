'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  FileText,
  Wallet,
  AlertTriangle,
  ChevronDown,
  Copy,
  Check,
  LogOut,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { CrawlLogo } from '@/components/CrawlLogo';
import { CONFIG } from '@/config';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  // Check if wallet is available & detect network
  useEffect(() => {
    const ethereum = (window as unknown as { ethereum?: any })?.ethereum;
    if (!ethereum) return;

    ethereum
      .request({ method: 'eth_chainId' })
      .then((currentChainId: string) => {
        setIsWrongNetwork(currentChainId !== '0xa4ec' && currentChainId !== '42220');
      })
      .catch(() => {});

    const handleChainChanged = (newChainId: string) => {
      setIsWrongNetwork(newChainId !== '0xa4ec' && newChainId !== '42220');
    };

    ethereum.on?.('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener?.('chainChanged', handleChainChanged);
    };
  }, []);

  const switchToCelo = async () => {
    const ethereum = (window as unknown as { ethereum?: any })?.ethereum;
    if (!ethereum) return;

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa4ec' }],
      });
      setIsWrongNetwork(false);
    } catch (switchError: any) {
      if (switchError?.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xa4ec',
                chainName: 'Celo Mainnet',
                nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
                rpcUrls: ['https://forno.celo.org'],
                blockExplorerUrls: ['https://celoscan.io'],
              },
            ],
          });
          setIsWrongNetwork(false);
        } catch {}
      }
    }
  };

  const isAuditActive = pathname.startsWith('/app/audit');
  const isReportsActive = pathname.startsWith('/app/reports');

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background Grid Pattern */}
      <div className="pointer-events-none fixed inset-0 dot-grid opacity-20" aria-hidden="true" />

      {/* App Top Bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2.5 transition-opacity hover:opacity-90 shrink-0">
            <span className="flex size-7 sm:size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <CrawlLogo className="size-3.5 sm:size-5" />
            </span>
            <span className="font-display text-sm sm:text-lg font-bold tracking-tight">
              crawl<span className="text-primary">pay</span>
            </span>
          </Link>

          {/* Middle: Exactly two tabs (Audit, Reports) */}
          <nav className="flex items-center gap-0.5 sm:gap-1 rounded-xl border border-border bg-card/60 p-0.5 sm:p-1">
            <Link
              href="/app/audit"
              className={`flex items-center gap-1 sm:gap-2 rounded-lg px-2 sm:px-4 py-1 sm:py-1.5 text-xs font-semibold transition-all ${
                isAuditActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <Search className="size-3 sm:size-3.5" />
              <span>Audit</span>
            </Link>

            <Link
              href="/app/reports"
              className={`flex items-center gap-1 sm:gap-2 rounded-lg px-2 sm:px-4 py-1 sm:py-1.5 text-xs font-semibold transition-all ${
                isReportsActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              }`}
            >
              <FileText className="size-3 sm:size-3.5" />
              <span>Reports</span>
            </Link>
          </nav>

          {/* Right: Network Status Indicator */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {isWrongNetwork ? (
              <button
                type="button"
                onClick={switchToCelo}
                className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
                title="Click to switch to Celo Mainnet"
              >
                <AlertTriangle className="size-3 sm:size-3.5 text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Wrong Network — Switch to Celo</span>
                <span className="sm:hidden">Switch</span>
              </button>
            ) : (
              <div className="flex items-center gap-1 rounded-lg border border-border bg-card px-2 sm:px-2.5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-muted-foreground">
                <span className="size-1.5 sm:size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Celo Mainnet</span>
                <span className="sm:hidden">Celo</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 relative">
        {children}
      </main>

      {/* Unified App Footer */}
      <footer className="border-t border-border bg-card/40 py-6 sm:py-8 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-3 sm:px-6 lg:px-8 sm:flex-row text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/docs" className="hover:text-foreground transition-colors">
              Docs
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms & Policy
            </Link>
            <a
              href="/api/status"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              API Status
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px]">
            <span>Agent:</span>
            <a
              href={`https://celoscan.io/address/${CONFIG.AGENT_WALLET_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-primary hover:underline"
            >
              {CONFIG.AGENT_WALLET_ADDRESS.slice(0, 8)}...{CONFIG.AGENT_WALLET_ADDRESS.slice(-6)}
            </a>
            <span>•</span>
            <span>Chain ID: 42220 (Celo Mainnet)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
