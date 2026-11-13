'use client';

import React from 'react';
import Link from 'next/link';
import { CrawlLogo } from '@/components/CrawlLogo';
import { focusRing } from '@/components/SiteHeader';
import { useConfig } from '@/context/ConfigContext';

const PUBLIC_AGENT_ADDRESS = '0xf06c2b754d07cba299751f0985a48f8013bb6b39';
const SUPPORT_TELEGRAM = 'https://t.me/Noble249';

export function SiteFooter() {
  const { fullPriceFormatted } = useConfig();

  return (
    <footer className="w-full bg-ink border-t border-graphite-900 pt-[48px] sm:pt-[64px] pb-[36px] sm:pb-[48px] text-white">
      <div className="max-w-[1176px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-[32px] text-left">
          {/* Column 1: Brand & Identity */}
          <div className="space-y-[12px]">
            <Link href="/" className={`inline-flex items-center gap-2.5 ${focusRing}`}>
              <span className="flex size-8 items-center justify-center rounded-[8px] bg-white text-ink shadow-sm shrink-0">
                <CrawlLogo className="size-4" />
              </span>
              <span className="font-sans font-[600] text-[20px] text-white tracking-tight">
                CrawlPay
              </span>
            </Link>
            <p className="font-footer text-[14px] leading-[20px] text-graphite-200 font-normal" suppressHydrationWarning>
              A site audit for Google and AI search. Free quick audit, {fullPriceFormatted} deep crawl in USDT on Celo.
            </p>
            <div className="pt-2">
              <span className="font-footer text-[13px] sm:text-[14px] leading-[20px] text-graphite-300 block">
                Chain ID: 42220 (Celo Mainnet)
              </span>
              <span className="font-footer text-[13px] sm:text-[14px] leading-[20px] text-graphite-300 block">
                Protocol: x402 Micropayments
              </span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="space-y-[12px]">
            <span className="font-footer text-[13px] sm:text-[14px] leading-[20px] text-graphite-300 font-normal uppercase tracking-wider block">
              NAVIGATION
            </span>
            <div className="space-y-[12px] font-footer text-[14px] leading-[20px]">
              <div>
                <Link href="/app/audit" className={`text-graphite-200 hover:text-white transition-colors ${focusRing}`}>
                  Quick audit
                </Link>
              </div>
              <div>
                <Link href="/app/reports" className={`text-graphite-200 hover:text-white transition-colors ${focusRing}`}>
                  Saved reports
                </Link>
              </div>
              <div>
                <Link href="/example" className={`text-graphite-200 hover:text-white transition-colors ${focusRing}`}>
                  Sample report
                </Link>
              </div>
              <div>
                <Link href="/#pricing" className={`text-graphite-200 hover:text-white transition-colors ${focusRing}`}>
                  Pricing
                </Link>
              </div>
            </div>
          </div>

          {/* Column 3: Developers */}
          <div className="space-y-[12px]">
            <span className="font-footer text-[13px] sm:text-[14px] leading-[20px] text-graphite-300 font-normal uppercase tracking-wider block">
              DEVELOPERS
            </span>
            <div className="space-y-[12px] font-footer text-[14px] leading-[20px]">
              <div>
                <Link href="/docs" className={`text-graphite-200 hover:text-white transition-colors ${focusRing}`}>
                  Documentation
                </Link>
              </div>
              <div>
                <Link href="/docs#mcp" className={`text-graphite-200 hover:text-white transition-colors ${focusRing}`}>
                  MCP setup
                </Link>
              </div>
              <div>
                <Link href="/docs#api" className={`text-graphite-200 hover:text-white transition-colors ${focusRing}`}>
                  API endpoints
                </Link>
              </div>
              <div>
                <a
                  href="/api/status"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-graphite-200 hover:text-white transition-colors ${focusRing}`}
                >
                  API status
                </a>
              </div>
            </div>
          </div>

          {/* Column 4: Policies & Support */}
          <div className="space-y-[12px]">
            <span className="font-footer text-[13px] sm:text-[14px] leading-[20px] text-graphite-300 font-normal uppercase tracking-wider block">
              POLICIES &amp; SUPPORT
            </span>
            <div className="space-y-[12px] font-footer text-[14px] leading-[20px]">
              <div>
                <Link href="/terms#about" className={`text-graphite-200 hover:text-white transition-colors ${focusRing}`}>
                  About CrawlPay
                </Link>
              </div>
              <div>
                <Link href="/terms#refund" className={`text-graphite-200 hover:text-white transition-colors ${focusRing}`}>
                  Refund policy
                </Link>
              </div>
              <div>
                <Link href="/terms#security" className={`text-graphite-200 hover:text-white transition-colors ${focusRing}`}>
                  Safe crawling
                </Link>
              </div>
              <div>
                <a
                  href={SUPPORT_TELEGRAM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-graphite-200 hover:text-white transition-colors ${focusRing}`}
                >
                  Telegram Support (@Noble249)
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-graphite-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-footer text-[13px] sm:text-[14px] leading-[20px]">
          <p className="text-graphite-300">
            &copy; {new Date().getFullYear()} CrawlPay. All rights reserved. Zero subscriptions, pay per crawl in USDT on Celo.
          </p>
          <div className="flex items-center gap-2 text-graphite-300 text-[12px] font-mono">
            <span>Agent:</span>
            <a
              href={`https://celoscan.io/address/${PUBLIC_AGENT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-graphite-200 hover:text-white hover:underline ${focusRing}`}
            >
              {PUBLIC_AGENT_ADDRESS.slice(0, 8)}...{PUBLIC_AGENT_ADDRESS.slice(-6)}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

