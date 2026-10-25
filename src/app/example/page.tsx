'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Download,
  Printer,
  Menu,
  X,
} from 'lucide-react';
import { CrawlLogo } from '@/components/CrawlLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { CheckEngineView } from '@/components/CheckEngineView';
import exampleReportData from '@/data/exampleReport.json';
import { FullAuditReport } from '@/types/audit';

const PUBLIC_AGENT_ADDRESS = '0xf06c2b754d07cba299751f0985a48f8013bb6b39';

export default function ExampleReportPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const report = exampleReportData as unknown as FullAuditReport;
  const realTxHash = '0x3fc8402348c27474548c645bb2290dbeee4f47aeb38107342b108cbb34a062f5';

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crawlpay-demo-preview.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0c0d10] text-ink dark:text-white font-system selection:bg-lavender-tint selection:text-ink overflow-x-hidden">
      {/* 1. HEADER (64px tall, white, CrawlPay logo & wordmark) */}
      <header className="sticky top-0 z-50 h-[64px] bg-white dark:bg-[#121317] border-b border-graphite-100 dark:border-graphite-800">
        <div className="max-w-[1176px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90 shrink-0">
            <span className="flex size-8 sm:size-9 items-center justify-center rounded-[10px] bg-ink dark:bg-violet text-white shadow-sm shrink-0">
              <CrawlLogo className="size-4 sm:size-5" />
            </span>
            <span className="font-sans font-[600] text-[18px] sm:text-[20px] text-ink dark:text-white tracking-tight">
              CrawlPay
            </span>
            <span className="hidden xs:inline-block rounded-[6px] bg-graphite-100 dark:bg-[#22232c] px-2 py-0.5 text-[11px] font-mono text-graphite-600 dark:text-graphite-300 font-medium ml-1">
              Demo Preview
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />

            <button
              type="button"
              onClick={exportJson}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#1a1b22] px-3.5 py-1.5 text-[13px] font-medium text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#252631] transition-colors cursor-pointer"
            >
              <Download className="size-3.5 text-graphite-600 dark:text-graphite-400" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#1a1b22] px-3.5 py-1.5 text-[13px] font-medium text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#252631] transition-colors cursor-pointer"
            >
              <Printer className="size-3.5 text-graphite-600 dark:text-graphite-400" />
              <span>Print / PDF</span>
            </button>

            <Link
              href="/app/audit"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white px-4 sm:px-5 py-1.5 sm:py-2 text-[13px] sm:text-[14px] font-normal text-white dark:text-ink hover:opacity-90 transition-opacity cursor-pointer shrink-0"
            >
              <span>Audit Your Site</span>
              <ArrowRight className="size-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex size-8 sm:size-9 items-center justify-center rounded-[8px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#1a1b22] p-1 text-ink dark:text-white sm:hidden transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="border-b border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#121317] px-4 py-4 sm:hidden shadow-lg space-y-3">
            <nav className="flex flex-col space-y-1 text-[15px] font-medium">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[6px] px-3 py-2 text-ink dark:text-white hover:bg-lavender-tint dark:hover:bg-[#1f2027] transition-colors"
              >
                Home
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  exportJson();
                }}
                className="flex items-center gap-2 rounded-[6px] px-3 py-2 text-left text-ink dark:text-white hover:bg-lavender-tint dark:hover:bg-[#1f2027] transition-colors"
              >
                <Download className="size-4" />
                <span>Export Report JSON</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.print();
                }}
                className="flex items-center gap-2 rounded-[6px] px-3 py-2 text-left text-ink dark:text-white hover:bg-lavender-tint dark:hover:bg-[#1f2027] transition-colors"
              >
                <Printer className="size-4" />
                <span>Print / Save as PDF</span>
              </button>
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[6px] px-3 py-2 text-ink dark:text-white hover:bg-lavender-tint dark:hover:bg-[#1f2027] transition-colors"
              >
                Documentation
              </Link>
              <Link
                href="/terms"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[6px] px-3 py-2 text-ink dark:text-white hover:bg-lavender-tint dark:hover:bg-[#1f2027] transition-colors"
              >
                Terms &amp; Policies
              </Link>
              <div className="pt-2 border-t border-graphite-100 dark:border-graphite-800">
                <Link
                  href="/app/audit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-[48px] bg-ink dark:bg-white px-4 py-2 text-[14px] font-medium text-white dark:text-ink hover:opacity-90 transition-opacity"
                >
                  <span>Audit Your Site</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* 2. MAIN CONTAINER */}
      <main className="max-w-[1176px] mx-auto px-4 py-8 sm:px-6 space-y-8">
        {/* Banner: Real Audit Verified on Celo */}
        <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#16171d] p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-[6px] bg-white dark:bg-[#22232c] border border-graphite-100 dark:border-graphite-800 px-2 py-0.5 text-[11px] font-bold text-ink dark:text-white">
                  <ShieldCheck className="size-3.5 text-violet" />
                  <span>Real On-Chain Audit</span>
                </span>
                <span className="text-[12px] text-graphite-600 dark:text-graphite-400">Settled on Celo Mainnet (42220)</span>
              </div>
              <h1 className="font-sans text-[20px] sm:text-[24px] font-[600] text-ink dark:text-white">
                Verified Audit: evangelcarriersnetwork.org
              </h1>
              <p className="text-[13px] text-graphite-800 dark:text-graphite-300 font-normal">
                Live deterministic technical SEO and stack audit executed through the CrawlPay engine.
              </p>
            </div>

            <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#1a1b22] p-3.5 text-xs space-y-1 sm:text-right shrink-0 shadow-sm">
              <span className="text-[11px] text-graphite-600 dark:text-graphite-400 block">Verified Celo Settlement:</span>
              <a
                href={`https://celoscan.io/tx/${realTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-violet hover:underline text-[12px] font-medium"
              >
                <span>{`${realTxHash.slice(0, 10)}...${realTxHash.slice(-8)}`}</span>
                <ExternalLink className="size-3" />
              </a>
              <span className="block text-[10px] text-graphite-600 dark:text-graphite-400 font-mono">Protocol: x402 Micropayment</span>
            </div>
          </div>
        </div>

        {/* Full Check Engine View */}
        <CheckEngineView report={report} />
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
                  <Link href="/app/audit" className="text-graphite-200 hover:text-white transition-colors">
                    Launch Site Audit
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
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-graphite-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-footer text-[13px] sm:text-[14px] leading-[20px]">
            <p className="text-graphite-300">
              &copy; {new Date().getFullYear()} CrawlPay. All rights reserved. Zero subscriptions, on-demand execution.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
