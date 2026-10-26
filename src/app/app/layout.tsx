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
  Sparkles,
} from 'lucide-react';
import { CrawlLogo } from '@/components/CrawlLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

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

        {/* Mobile Extra Menu Dropdown (Home, Docs, Demo Preview) */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#121317] px-4 py-3 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="text-[11px] font-mono font-medium uppercase tracking-wider text-graphite-400 dark:text-graphite-500 px-2 pt-1">
              Quick Links
            </div>
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[14px] font-medium text-graphite-800 dark:text-graphite-200 hover:bg-graphite-100/60 dark:hover:bg-[#1a1b22] transition-colors"
            >
              <Home className="size-4 text-graphite-500" />
              <span>Landing Page</span>
            </Link>
            <Link
              href="/example"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[14px] font-medium text-graphite-800 dark:text-graphite-200 hover:bg-graphite-100/60 dark:hover:bg-[#1a1b22] transition-colors"
            >
              <Sparkles className="size-4 text-graphite-500" />
              <span>Verified Demo Preview</span>
            </Link>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[14px] font-medium text-graphite-800 dark:text-graphite-200 hover:bg-graphite-100/60 dark:hover:bg-[#1a1b22] transition-colors"
            >
              <BookOpen className="size-4 text-graphite-500" />
              <span>Documentation &amp; API</span>
            </Link>
          </div>
        )}
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-[1176px] mx-auto px-4 sm:px-6 py-6 sm:py-10 relative">
        {children}
      </main>

      {/* 3. INK FOOTER */}
      <footer className="w-full bg-ink border-t border-graphite-900 pt-[48px] sm:pt-[64px] pb-[36px] sm:pb-[48px] mt-16">
        <div className="max-w-[1176px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-[32px] text-left">
            <div className="space-y-[12px]">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-[8px] bg-white text-ink shadow-sm shrink-0">
                  <CrawlLogo className="size-4" />
                </span>
                <span className="font-sans font-[600] text-[20px] text-white tracking-tight">
                  CrawlPay
                </span>
              </div>
              <p className="font-footer text-[14px] leading-[20px] text-graphite-200 font-normal">
                Autonomous technical SEO and competitor intelligence audit agent settled per crawl on Celo mainnet.
              </p>
            </div>

            <div className="space-y-[12px]">
              <span className="font-footer text-[13px] sm:text-[14px] leading-[20px] text-graphite-300 font-normal uppercase tracking-wider block">
                NAVIGATION
              </span>
              <div className="space-y-[12px] font-footer text-[14px] leading-[20px]">
                <div>
                  <Link href="/" className="text-graphite-200 hover:text-white transition-colors">
                    Home
                  </Link>
                </div>
                <div>
                  <Link href="/example" className="text-graphite-200 hover:text-white transition-colors">
                    Verified Demo Preview
                  </Link>
                </div>
                <div>
                  <Link href="/app/audit" className="text-graphite-200 hover:text-white transition-colors">
                    Site Audit
                  </Link>
                </div>
                <div>
                  <Link href="/app/reports" className="text-graphite-200 hover:text-white transition-colors">
                    Reports Archive
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-[12px]">
              <span className="font-footer text-[13px] sm:text-[14px] leading-[20px] text-graphite-300 font-normal uppercase tracking-wider block">
                DEVELOPERS
              </span>
              <div className="space-y-[12px] font-footer text-[14px] leading-[20px]">
                <div>
                  <Link href="/docs" className="text-graphite-200 hover:text-white transition-colors">
                    Documentation &amp; API
                  </Link>
                </div>
                <div>
                  <Link href="/docs#mcp" className="text-graphite-200 hover:text-white transition-colors">
                    MCP Agent Setup
                  </Link>
                </div>
                <div>
                  <a
                    href="/api/status"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-graphite-200 hover:text-white transition-colors"
                  >
                    REST API Status
                  </a>
                </div>
              </div>
            </div>

            <div className="space-y-[12px]">
              <span className="font-footer text-[13px] sm:text-[14px] leading-[20px] text-graphite-300 font-normal uppercase tracking-wider block">
                POLICIES
              </span>
              <div className="space-y-[12px] font-footer text-[14px] leading-[20px]">
                <div>
                  <Link href="/terms#about" className="text-graphite-200 hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </div>
                <div>
                  <Link href="/terms#refund" className="text-graphite-200 hover:text-white transition-colors">
                    Refund Guarantee Policy
                  </Link>
                </div>
                <div>
                  <Link href="/terms#security" className="text-graphite-200 hover:text-white transition-colors">
                    SSRF Security Protections
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-graphite-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-footer text-[13px] sm:text-[14px] leading-[20px]">
            <p className="text-graphite-300">
              &copy; {new Date().getFullYear()} CrawlPay. All rights reserved. Zero subscriptions, on-demand execution.
            </p>
            <div className="flex items-center gap-2 text-graphite-300 text-[12px] font-mono">
              <span>Agent:</span>
              <a
                href={`https://celoscan.io/address/${PUBLIC_AGENT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-graphite-200 hover:text-white hover:underline"
              >
                {PUBLIC_AGENT_ADDRESS.slice(0, 8)}...{PUBLIC_AGENT_ADDRESS.slice(-6)}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
