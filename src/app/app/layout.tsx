'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  FileText,
  AlertTriangle,
  Menu,
  X,
  Home,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { CrawlLogo } from '@/components/CrawlLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SiteFooter } from '@/components/SiteFooter';
import { focusRing } from '@/components/SiteHeader';

const PUBLIC_AGENT_ADDRESS = '0xf06c2b754d07cba299751f0985a48f8013bb6b39';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

    // Check if provider is Phantom which does not support Celo
    const isPhantom = Boolean(
      ethereum?.isPhantom || (window as unknown as { phantom?: { ethereum?: any } })?.phantom?.ethereum === ethereum
    );
    if (isPhantom) {
      alert(
        'Phantom wallet does not support Celo Mainnet (Chain ID 42220). Please connect a Celo-compatible EVM wallet such as MetaMask, Rabby, Valora, or MiniPay.'
      );
      return;
    }

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xa4ec' }],
      });
      setIsWrongNetwork(false);
    } catch (switchError: any) {
      if (switchError?.code === 4001) {
        return; // User cancelled
      }
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
      } catch (addError: any) {
        if (addError?.code !== 4001) {
          alert(
            'Your connected wallet does not support Celo Mainnet (Chain ID 42220). Please switch to MetaMask, Rabby, or Valora.'
          );
        }
      }
    }
  };

  const isAuditActive = pathname.startsWith('/app/audit');
  const isReportsActive = pathname.startsWith('/app/reports');

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#0d0e12] text-ink dark:text-white font-system selection:bg-lavender-tint selection:text-ink overflow-x-hidden">
      {/* 1. APP HEADER */}
      <header className="sticky top-0 z-40 border-b border-graphite-100 dark:border-graphite-800 bg-white/95 dark:bg-[#121317]/95 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-[58px] sm:h-[64px] max-w-[1176px] items-center justify-between px-3.5 sm:px-6">
          {/* Left: Brand Identity */}
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 transition-opacity hover:opacity-90 shrink-0">
            <span className="flex size-7 sm:size-9 items-center justify-center rounded-[8px] sm:rounded-[10px] bg-ink dark:bg-white text-white dark:text-ink shadow-sm shrink-0">
              <CrawlLogo className="size-3.5 sm:size-5" />
            </span>
            <span className="font-sans font-[600] text-[17px] sm:text-[20px] text-ink dark:text-white tracking-tight">
              CrawlPay
            </span>
          </Link>

          {/* Middle: Pill Navigation Tabs (Audit vs Reports) - Desktop only */}
          <nav className="hidden sm:flex items-center gap-1 rounded-[48px] bg-[#f4f4f6] dark:bg-[#1a1b22] p-1 border border-graphite-100 dark:border-graphite-800">
            <Link
              href="/app/audit"
              className={`flex items-center gap-1.5 sm:gap-2 rounded-[48px] px-3.5 sm:px-4 py-1 sm:py-1.5 text-[13px] sm:text-[14px] font-medium transition-all ${
                isAuditActive
                  ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                  : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white hover:bg-graphite-200/50 dark:hover:bg-[#252631]'
              }`}
            >
              <Search className="size-3.5 sm:size-4" />
              <span>Audit</span>
            </Link>

            <Link
              href="/app/reports"
              className={`flex items-center gap-1.5 sm:gap-2 rounded-[48px] px-3.5 sm:px-4 py-1 sm:py-1.5 text-[13px] sm:text-[14px] font-medium transition-all ${
                isReportsActive
                  ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                  : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white hover:bg-graphite-200/50 dark:hover:bg-[#252631]'
              }`}
            >
              <FileText className="size-3.5 sm:size-4" />
              <span>Reports</span>
            </Link>
          </nav>

          {/* Right: Theme Toggle, Network Status & Mobile Menu Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <ThemeToggle />
            {isWrongNetwork ? (
              <button
                type="button"
                onClick={switchToCelo}
                className="flex items-center gap-1.5 rounded-[48px] border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-[12px] font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                title="Click to switch to Celo Mainnet"
              >
                <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="hidden sm:inline">Switch to Celo</span>
                <span className="sm:hidden">Switch</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#1a1b22] px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-[12px] font-mono text-ink dark:text-graphite-200 shrink-0 whitespace-nowrap">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="hidden sm:inline">Celo Mainnet (42220)</span>
                <span className="sm:hidden font-medium">Celo</span>
              </div>
            )}

            {/* Mobile Hamburger to access Home, Docs, Demo */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex sm:hidden p-1.5 text-ink dark:text-white hover:opacity-70 transition-opacity focus:outline-none shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Pills Sub-Bar (Audit vs Reports) */}
        <div className="sm:hidden border-t border-graphite-100 dark:border-graphite-800 bg-[#fafafc] dark:bg-[#16171d] px-3.5 py-2">
          <nav className="grid grid-cols-2 gap-1 rounded-[48px] bg-graphite-100 dark:bg-[#1f2029] p-1 border border-graphite-200/60 dark:border-graphite-800">
            <Link
              href="/app/audit"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-center gap-1.5 rounded-[48px] py-1.5 text-[13px] font-medium transition-all ${
                isAuditActive
                  ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                  : 'text-graphite-700 dark:text-graphite-300 hover:text-ink dark:hover:text-white'
              }`}
            >
              <Search className="size-3.5" />
              <span>Audit</span>
            </Link>

            <Link
              href="/app/reports"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-center gap-1.5 rounded-[48px] py-1.5 text-[13px] font-medium transition-all ${
                isReportsActive
                  ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                  : 'text-graphite-700 dark:text-graphite-300 hover:text-ink dark:hover:text-white'
              }`}
            >
              <FileText className="size-3.5" />
              <span>Reports</span>
            </Link>
          </nav>
        </div>

        {/* Mobile Extra Menu Dropdown (Home, Sample report, Docs) */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#121317] px-3.5 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[14px] font-medium text-graphite-800 dark:text-graphite-200 hover:bg-graphite-100/80 dark:hover:bg-[#1a1b22] hover:text-ink dark:hover:text-white transition-colors ${focusRing}`}
            >
              <Home className="size-4 text-graphite-500" />
              <span>Home</span>
            </Link>
            <Link
              href="/example"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[14px] font-medium text-graphite-800 dark:text-graphite-200 hover:bg-graphite-100/80 dark:hover:bg-[#1a1b22] hover:text-ink dark:hover:text-white transition-colors ${focusRing}`}
            >
              <CheckCircle2 className="size-4 text-graphite-500" />
              <span>Sample report</span>
            </Link>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[14px] font-medium text-graphite-800 dark:text-graphite-200 hover:bg-graphite-100/80 dark:hover:bg-[#1a1b22] hover:text-ink dark:hover:text-white transition-colors ${focusRing}`}
            >
              <BookOpen className="size-4 text-graphite-500" />
              <span>Docs</span>
            </Link>
          </div>
        )}
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-[1176px] mx-auto px-4 sm:px-6 py-6 sm:py-10 relative">
        {children}
      </main>

      {/* 3. SHARED SITE FOOTER */}
      <SiteFooter />
    </div>
  );
}
