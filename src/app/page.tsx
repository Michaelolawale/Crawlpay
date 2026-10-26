'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  ArrowRight,
  Check,
  Copy,
  Menu,
  X,
} from 'lucide-react';
import { CrawlLogo } from '@/components/CrawlLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

const PUBLIC_AGENT_ADDRESS = '0xf06c2b754d07cba299751f0985a48f8013bb6b39';

export default function LandingPage() {
  const [heroUrl, setHeroUrl] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedPatch, setCopiedPatch] = useState(false);

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = heroUrl.trim();
    if (trimmed) {
      window.location.href = `/app/audit?target=${encodeURIComponent(trimmed)}`;
    } else {
      window.location.href = '/app/audit';
    }
  };

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const copyPatchCode = () => {
    navigator.clipboard.writeText(`// Next.js App Router canonical fix
export const metadata = {
  metadataBase: new URL('https://domain.com'),
  alternates: {
    canonical: '/',
  },
};`);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  const faqs = [
    {
      q: 'What is CrawlPay and how does it work?',
      a: 'CrawlPay is an autonomous SEO audit agent on Celo mainnet. It inspects live websites using 10 deterministic engine checks and delivers ready-to-deploy code fixes on demand, settled per crawl via x402 micropayments.',
    },
    {
      q: 'How does on-demand x402 payment work on Celo?',
      a: 'x402 enables instant per-request micropayments without subscriptions. Audits cost $0.25 (Quick 1-Page) or $0.50 (Deep 50-Page crawl) settled directly from your EVM browser wallet or agent key in USDT, USDC, or CELO.',
    },
    {
      q: 'What checks does the deterministic engine run?',
      a: 'The engine evaluates canonical URL consistency, robots.txt directives, XML sitemaps, indexability headers, heading hierarchy, meta descriptions, OpenGraph tags, mobile viewport settings, and Core Web Vitals.',
    },
    {
      q: 'Which wallets and tokens are supported?',
      a: 'Any standard EVM browser wallet (MetaMask, Rabby, Valora, MiniPay, Coinbase Wallet) connected to Celo Mainnet (Chain ID 42220). Autonomous agent scripts can also settle programmatically using hotwallet keys.',
    },
    {
      q: 'What happens if a crawl fails?',
      a: 'If a target website is temporarily unreachable or times out, CrawlPay automatically executes a retry. If the audit cannot complete, you are eligible for an immediate full refund per our refund guarantee policy.',
    },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0e12] text-ink dark:text-white font-system selection:bg-lavender-tint selection:text-ink overflow-x-hidden transition-colors">
      {/* 1. HEADER (64px tall, CrawlPay logo & wordmark left, right-aligned nav DM Sans 16/400 ink, 32px gap) */}
      <header className="sticky top-0 z-50 h-[64px] bg-white dark:bg-[#121317] border-b border-graphite-100 dark:border-graphite-800 transition-colors">
        <div className="max-w-[1176px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          {/* Logo Badge + Wordmark */}
          <Link
            href="/"
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0"
          >
            <span className="flex size-8 sm:size-9 items-center justify-center rounded-[10px] bg-ink dark:bg-white text-white dark:text-ink shadow-sm shrink-0">
              <CrawlLogo className="size-4 sm:size-5" />
            </span>
            <span className="font-sans font-[600] text-[18px] sm:text-[20px] text-ink dark:text-white tracking-tight">
              CrawlPay
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-[32px] font-sans text-[16px] font-[400] text-ink dark:text-graphite-200 leading-[1.5] shrink-0">
            <Link href="/example" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              Demo
            </Link>
            <a href="#features" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              Features
            </a>
            <a href="#how-it-works" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              How It Works
            </a>
            <Link href="/docs" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              Docs
            </Link>
            <a href="#faq" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              FAQ
            </a>
          </nav>

          {/* Right Action: Theme Toggle + Capsule Button + Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <ThemeToggle />

            <Link
              href="/app/audit"
              className="hidden sm:inline-flex bg-ink dark:bg-white text-white dark:text-ink rounded-[48px] px-[20px] sm:px-[24px] py-[7px] text-[14px] leading-[1.6] font-normal hover:opacity-90 transition-opacity items-center justify-center cursor-pointer whitespace-nowrap shrink-0"
            >
              Launch CrawlPay
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex lg:hidden p-1.5 text-ink dark:text-white hover:opacity-70 transition-opacity focus:outline-none shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white dark:bg-[#121317] border-b border-graphite-100 dark:border-graphite-800 px-4 py-4 space-y-3 shadow-lg">
            <Link
              href="/example"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-sans text-[16px] text-ink dark:text-white py-1.5 font-medium"
            >
              Demo
            </Link>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-sans text-[16px] text-ink dark:text-white py-1.5"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-sans text-[16px] text-ink dark:text-white py-1.5"
            >
              How It Works
            </a>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-sans text-[16px] text-ink dark:text-white py-1.5"
            >
              Docs
            </Link>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-sans text-[16px] text-ink dark:text-white py-1.5"
            >
              FAQ
            </a>
            <div className="pt-2">
              <Link
                href="/app/audit"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full bg-ink dark:bg-white text-white dark:text-ink rounded-[48px] px-[24px] py-[10px] text-[14px] leading-[1.6] font-normal hover:opacity-90 transition-opacity inline-flex items-center justify-center cursor-pointer"
              >
                Launch CrawlPay
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* 2. HERO: Calm editorial gray background with updated headline & copy */}
        <section className="bg-[#f4f4f6] border-b border-graphite-100 pt-[48px] pb-[52px] sm:pt-[80px] sm:pb-[84px]">
          <div className="max-w-[1176px] mx-auto px-4 sm:px-6 text-center">
            {/* Eyebrow: DM Sans 400, 18px, 1.6, violet */}
            <p className="font-sans text-[15px] sm:text-[18px] leading-[1.6] font-[400] text-violet mb-3 sm:mb-4">
              Autonomous SEO on Celo Mainnet
            </p>

            {/* Display Headline: DM Sans 600, fluid responsive text */}
            <h1 className="font-sans text-[32px] sm:text-[46px] md:text-[60px] font-[600] leading-[1.12] text-ink max-w-[920px] mx-auto break-words">
              Autonomous site audits. <br className="hidden sm:inline" />
              Pay per crawl, not per month.
            </h1>

            {/* Supporting Line: Simple, accurate, core info */}
            <p className="text-[15px] sm:text-[17px] leading-[1.6] text-graphite-800 max-w-[660px] mx-auto mt-4 sm:mt-6 font-normal">
              No accounts. No subscriptions. Enter any target URL to run 10 deterministic engine checks, isolate root cause diagnostics, and get copy-pasteable code fixes—settled on-chain for $0.25.
            </p>

            {/* Search / Input Field with Filled Capsule Button */}
            <form onSubmit={handleHeroSubmit} className="mt-[28px] sm:mt-[32px] max-w-[620px] mx-auto">
              <div className="flex flex-col sm:flex-row items-center gap-[10px] sm:gap-[12px]">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={heroUrl}
                    onChange={(e) => setHeroUrl(e.target.value)}
                    placeholder="Enter website URL (e.g. example.com or yoursite.com)"
                    className="w-full bg-white text-ink border border-ink rounded-[32px] px-[18px] sm:px-[21px] py-[10px] sm:py-[11px] placeholder:text-graphite-600 focus:outline-none focus:shadow-hero-field text-[15px] sm:text-[16px] transition-shadow"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto shrink-0 bg-ink text-white rounded-[48px] px-[24px] py-[10px] sm:py-[11px] text-[14px] leading-[1.6] font-normal hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>Audit Your Site</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </form>

            {/* Clean Value-Proposition Badges */}
            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-[13px] sm:text-[14px] text-graphite-800">
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-ink shrink-0" />
                <span>10 Deterministic Checks</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-ink shrink-0" />
                <span>Next.js &amp; WordPress Fixes</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-ink shrink-0" />
                <span>Celo On-Chain Settlement</span>
              </span>
            </div>
          </div>
        </section>

        {/* 3. TWO-COLUMN GRID OF EQUAL SHOWCASE CARDS (Lavender panel & Gold panel) */}
        <section id="features" className="py-[40px] sm:py-[64px]">
          <div id="showcase" className="sr-only" />
          <div className="max-w-[1176px] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px] sm:gap-[24px]">
              {/* Showcase Card 1: Lavender Panel */}
              <div className="bg-lavender-panel rounded-[20px] sm:rounded-[24px] p-4 sm:p-[24px] flex flex-col justify-between space-y-[20px] sm:space-y-[24px]">
                {/* Product Screenshot inside a white 12px-radius inset with the screenshot shadow */}
                <div className="bg-white dark:bg-[#16171d] rounded-[12px] p-3.5 sm:p-[20px] border border-graphite-100 dark:border-graphite-800 shadow-screenshot-inset">
                  <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-graphite-100 dark:border-graphite-800 text-xs">
                    <span className="font-sans font-[600] text-ink dark:text-white">Target Audit Report</span>
                    <span className="font-mono text-graphite-600 dark:text-graphite-300 text-[10px] sm:text-[11px] truncate max-w-[150px] sm:max-w-none">
                      example.com
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5 my-3 text-left">
                    <div className="p-2 sm:p-2.5 rounded-[8px] bg-graphite-100/50 dark:bg-[#20212b] border border-transparent dark:border-graphite-800/80">
                      <span className="text-[10px] sm:text-[11px] font-medium text-graphite-600 dark:text-graphite-200 block">Health Score</span>
                      <span className="font-sans font-[600] text-[17px] sm:text-[20px] text-ink dark:text-white">100 / 100</span>
                    </div>
                    <div className="p-2 sm:p-2.5 rounded-[8px] bg-graphite-100/50 dark:bg-[#20212b] border border-transparent dark:border-graphite-800/80">
                      <span className="text-[10px] sm:text-[11px] font-medium text-graphite-600 dark:text-graphite-200 block">Engine Checks</span>
                      <span className="font-sans font-[600] text-[17px] sm:text-[20px] text-ink dark:text-white">10 / 10 Pass</span>
                    </div>
                    <div className="p-2 sm:p-2.5 rounded-[8px] bg-graphite-100/50 dark:bg-[#20212b] border border-transparent dark:border-graphite-800/80">
                      <span className="text-[10px] sm:text-[11px] font-medium text-graphite-600 dark:text-graphite-200 block">Canonical Chain</span>
                      <span className="font-sans font-[600] text-[13px] sm:text-[14px] text-ink dark:text-white truncate block">Self-Referencing</span>
                    </div>
                    <div className="p-2 sm:p-2.5 rounded-[8px] bg-graphite-100/50 dark:bg-[#20212b] border border-transparent dark:border-graphite-800/80">
                      <span className="text-[10px] sm:text-[11px] font-medium text-graphite-600 dark:text-graphite-200 block">Settlement</span>
                      <span className="font-sans font-[600] text-[13px] sm:text-[14px] text-ink dark:text-white truncate block">0x3fc8...4023</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-graphite-100 dark:border-graphite-800 flex items-center justify-between text-[10px] sm:text-[11px] text-graphite-600 dark:text-graphite-300">
                    <span>10 deterministic evaluations</span>
                    <span className="text-ink dark:text-white font-mono font-medium">Verified Celo Tx</span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-sans font-[600] text-[20px] sm:text-[24px] leading-[1.33] text-ink">
                    Deterministic 10-Check Audit Engine
                  </h3>
                  <p className="text-[13px] sm:text-[14px] text-graphite-800 mt-1">
                    Evaluates canonical chains, indexability, metadata, and Core Web Vitals.
                  </p>
                </div>
              </div>

              {/* Showcase Card 2: Gold Panel */}
              <div className="bg-gold rounded-[20px] sm:rounded-[24px] p-4 sm:p-[24px] flex flex-col justify-between space-y-[20px] sm:space-y-[24px]">
                {/* Product Screenshot inside a white 12px-radius inset with the screenshot shadow */}
                <div className="bg-white rounded-[12px] p-3.5 sm:p-[20px] shadow-screenshot-inset">
                  <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-graphite-100 text-xs">
                    <span className="font-sans font-[500] text-ink">Remediation Patch</span>
                    <button
                      type="button"
                      onClick={copyPatchCode}
                      className="inline-flex items-center gap-1 font-mono text-[10px] sm:text-[11px] text-ink hover:opacity-75 transition-opacity cursor-pointer bg-transparent border-0 p-0"
                    >
                      <Copy className="size-3 text-ink" />
                      <span>{copiedPatch ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="my-3 font-mono text-[10px] sm:text-[11px] bg-graphite-900 text-graphite-200 p-2.5 sm:p-3 rounded-[8px] overflow-x-auto text-left leading-relaxed">
                    <div className="text-graphite-300">// Next.js App Router canonical fix</div>
                    <div className="text-white">export const metadata = &#123;</div>
                    <div className="pl-2 sm:pl-3 text-white">metadataBase: new URL(&apos;https://domain.com&apos;),</div>
                    <div className="pl-2 sm:pl-3 text-white">alternates: &#123;</div>
                    <div className="pl-4 sm:pl-6 text-white">canonical: &apos;/&apos;,</div>
                    <div className="pl-2 sm:pl-3 text-white">&#125;,</div>
                    <div className="text-white">&#125;;</div>
                  </div>

                  <div className="pt-2 border-t border-graphite-100 flex items-center justify-between text-[10px] sm:text-[11px] text-graphite-600">
                    <span className="truncate max-w-[150px] sm:max-w-none">Target: src/app/layout.tsx</span>
                    <span className="text-ink font-medium shrink-0">Ready to deploy</span>
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="font-sans font-[600] text-[20px] sm:text-[24px] leading-[1.33] text-ink">
                    Framework-Specific Code Patches
                  </h3>
                  <p className="text-[13px] sm:text-[14px] text-graphite-800 mt-1">
                    Ready-to-deploy code fixes for Next.js, WordPress, and Shopify to eliminate penalties.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS: 3-step deterministic execution flow */}
        <section id="how-it-works" className="w-full bg-white border-t border-graphite-100 py-[48px] sm:py-[80px]">
          <div className="max-w-[1176px] mx-auto px-4 sm:px-6">
            <div className="text-center max-w-[680px] mx-auto">
              <p className="font-sans text-[15px] sm:text-[18px] leading-[1.6] font-[400] text-violet mb-2">
                Deterministic Execution
              </p>
              <h2 className="font-sans text-[28px] sm:text-[38px] md:text-[44px] font-[600] leading-[1.15] text-ink tracking-tight">
                How CrawlPay works
              </h2>
              <p className="text-[15px] sm:text-[17px] leading-[1.6] text-graphite-800 mt-3 font-normal">
                Three deterministic steps to audit any live website, pinpoint root-cause crawl blockers, and deploy instant code remedies.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-10 sm:mt-14 text-left">
              {/* Step 1 */}
              <div className="bg-[#fcfcfd] border border-graphite-100 rounded-[16px] p-6 sm:p-7 flex flex-col justify-between hover:border-ink/20 transition-all shadow-sm">
                <div>
                  <div className="size-9 rounded-full bg-ink text-white font-mono font-medium text-[13px] flex items-center justify-center mb-5">
                    01
                  </div>
                  <h3 className="font-sans font-[600] text-[20px] leading-[1.3] text-ink mb-2">
                    Enter Target URL
                  </h3>
                  <p className="text-[14px] leading-[1.6] text-graphite-800 font-normal">
                    Input any public domain or path. Choose a single-page quick crawl or sitewide BFS audit to evaluate robots.txt, canonical chains, and indexability.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-graphite-100/70 font-mono text-[11px] text-graphite-600 bg-white p-3 rounded-[8px] border border-graphite-100">
                  <div className="text-ink font-medium">Target: example.com</div>
                  <div className="text-graphite-600">Scope: 10 Engine Checks</div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-[#fcfcfd] border border-graphite-100 rounded-[16px] p-6 sm:p-7 flex flex-col justify-between hover:border-ink/20 transition-all shadow-sm">
                <div>
                  <div className="size-9 rounded-full bg-ink text-white font-mono font-medium text-[13px] flex items-center justify-center mb-5">
                    02
                  </div>
                  <h3 className="font-sans font-[600] text-[20px] leading-[1.3] text-ink mb-2">
                    Micro-Settlement
                  </h3>
                  <p className="text-[14px] leading-[1.6] text-graphite-800 font-normal">
                    Authorize an on-demand $0.25 micropayment on Celo Mainnet via the x402 open standard with USDT, USDC, or CELO. No subscriptions or account friction.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-graphite-100/70 font-mono text-[11px] text-graphite-600 bg-white p-3 rounded-[8px] border border-graphite-100">
                  <div className="text-ink font-medium">Protocol: x402 Micropayment</div>
                  <div className="text-graphite-600">Rate: $0.25 (Gas &lt; $0.001)</div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-[#fcfcfd] border border-graphite-100 rounded-[16px] p-6 sm:p-7 flex flex-col justify-between hover:border-ink/20 transition-all shadow-sm">
                <div>
                  <div className="size-9 rounded-full bg-ink text-white font-mono font-medium text-[13px] flex items-center justify-center mb-5">
                    03
                  </div>
                  <h3 className="font-sans font-[600] text-[20px] leading-[1.3] text-ink mb-2">
                    Diagnostics &amp; Fixes
                  </h3>
                  <p className="text-[14px] leading-[1.6] text-graphite-800 font-normal">
                    The engine executes 10 technical checks in under 5 seconds. Get root-cause diagnostics and copy-pasteable code fixes for Next.js and WordPress.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-graphite-100/70 font-mono text-[11px] text-graphite-600 bg-white p-3 rounded-[8px] border border-graphite-100">
                  <div className="text-ink font-medium">Output: 10/10 Diagnostics</div>
                  <div className="text-graphite-600">Patch: layout.tsx Ready</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. ALTERNATING UNBOXED EDITORIAL SPLIT(S) — Gray background with framed white insets */}
        <section id="architecture" className="w-full bg-[#f4f4f6] border-t border-b border-graphite-100 py-[48px] sm:py-[80px]">
          <div className="max-w-[1176px] mx-auto px-4 sm:px-6 space-y-[64px] sm:space-y-[88px]">
            {/* Editorial Split 1: Text Left, Product Mockup Right — items-start ensures same horizontal alignment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[48px] items-start">
              {/* Text Left (not inside a card) */}
              <div className="space-y-4 text-left">
                <p className="font-sans text-[15px] sm:text-[18px] leading-[1.6] font-[400] text-violet">
                  Deterministic Analysis
                </p>
                <h2 className="font-sans text-[26px] sm:text-[34px] lg:text-[38px] font-[600] leading-[1.18] text-ink">
                  Root cause grouping. Zero guessing.
                </h2>
                <p className="text-[15px] sm:text-[16px] leading-[1.6] text-graphite-800 font-normal">
                  CrawlPay evaluates live server responses against explicit technical criteria. Issues are grouped by underlying root cause—so fixing one configuration resolves dozens of search warnings at once.
                </p>
                <div className="pt-2">
                  <Link
                    href="/docs"
                    className="text-[15px] sm:text-[16px] leading-[25.6px] text-violet font-normal hover:bg-lavender-tint hover:rounded-[5px] px-1 -mx-1 transition-colors inline-flex items-center justify-center sm:justify-start gap-1"
                  >
                    <span>Read engine documentation</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>

              {/* Product Mockup Right: Contained inside a white 12px-radius inset with the screenshot shadow */}
              <div className="w-full">
                <div className="bg-white rounded-[12px] p-4 sm:p-[24px] border border-graphite-100 shadow-screenshot-inset">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-graphite-100 gap-1">
                    <span className="font-sans font-[600] text-[15px] sm:text-[16px] text-ink">CrawlPay Engine Diagnostics</span>
                    <span className="font-mono text-[11px] sm:text-[12px] text-graphite-600">SSRF Verified &bull; Latency 210ms</span>
                  </div>

                  <div className="py-3 sm:py-4 space-y-2 sm:space-y-2.5">
                    <div className="flex items-start sm:items-center justify-between p-2.5 sm:p-3 rounded-[8px] bg-graphite-100/40 gap-2">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-2.5 min-w-0">
                        <span className="size-2 rounded-full bg-ink shrink-0 mt-1 sm:mt-0" />
                        <div className="min-w-0">
                          <div className="font-sans font-[500] text-[13px] sm:text-[14px] text-ink">Canonical Loop &amp; Redirection</div>
                          <div className="text-[11px] sm:text-[12px] text-graphite-600 truncate">Self-referencing canonical confirmed</div>
                        </div>
                      </div>
                      <span className="font-sans font-[500] text-[11px] sm:text-[12px] text-ink bg-white px-2 py-0.5 rounded-[4px] border border-graphite-100 shrink-0">
                        Passed
                      </span>
                    </div>

                    <div className="flex items-start sm:items-center justify-between p-2.5 sm:p-3 rounded-[8px] bg-graphite-100/40 gap-2">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-2.5 min-w-0">
                        <span className="size-2 rounded-full bg-ink shrink-0 mt-1 sm:mt-0" />
                        <div className="min-w-0">
                          <div className="font-sans font-[500] text-[13px] sm:text-[14px] text-ink">Robots.txt &amp; Sitemap Indexability</div>
                          <div className="text-[11px] sm:text-[12px] text-graphite-600 truncate">All search bots allowed with XML sitemap</div>
                        </div>
                      </div>
                      <span className="font-sans font-[500] text-[11px] sm:text-[12px] text-ink bg-white px-2 py-0.5 rounded-[4px] border border-graphite-100 shrink-0">
                        Passed
                      </span>
                    </div>

                    <div className="flex items-start sm:items-center justify-between p-2.5 sm:p-3 rounded-[8px] bg-graphite-100/40 gap-2">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-2.5 min-w-0">
                        <span className="size-2 rounded-full bg-ink shrink-0 mt-1 sm:mt-0" />
                        <div className="min-w-0">
                          <div className="font-sans font-[500] text-[13px] sm:text-[14px] text-ink">Heading Hierarchy &amp; Semantics</div>
                          <div className="text-[11px] sm:text-[12px] text-graphite-600 truncate">Single H1 root, ordered H2/H3 nesting</div>
                        </div>
                      </div>
                      <span className="font-sans font-[500] text-[11px] sm:text-[12px] text-ink bg-white px-2 py-0.5 rounded-[4px] border border-graphite-100 shrink-0">
                        Passed
                      </span>
                    </div>

                    <div className="flex items-start sm:items-center justify-between p-2.5 sm:p-3 rounded-[8px] bg-graphite-100/40 gap-2">
                      <div className="flex items-start sm:items-center gap-2 sm:gap-2.5 min-w-0">
                        <span className="size-2 rounded-full bg-ink shrink-0 mt-1 sm:mt-0" />
                        <div className="min-w-0">
                          <div className="font-sans font-[500] text-[13px] sm:text-[14px] text-ink">OpenGraph &amp; Twitter Metadata</div>
                          <div className="text-[11px] sm:text-[12px] text-graphite-600 truncate">Complete social cards with image URLs</div>
                        </div>
                      </div>
                      <span className="font-sans font-[500] text-[11px] sm:text-[12px] text-ink bg-white px-2 py-0.5 rounded-[4px] border border-graphite-100 shrink-0">
                        Passed
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 sm:pt-3 border-t border-graphite-100 flex items-center justify-between text-[11px] sm:text-[12px] text-graphite-600">
                    <span>Deterministic crawler execution</span>
                    <span className="font-mono text-ink">Celo Mainnet (42220)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Editorial Split 2: Product Mockup Left, Text Right — items-start ensures same horizontal alignment */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[48px] items-start">
              {/* Product Mockup Left */}
              <div className="w-full order-2 lg:order-1">
                <div className="bg-white rounded-[12px] p-4 sm:p-[24px] border border-graphite-100 shadow-screenshot-inset">
                  <div className="flex items-center justify-between pb-3 border-b border-graphite-100">
                    <span className="font-sans font-[600] text-[15px] sm:text-[16px] text-ink">Crawl Selection &amp; Settlement</span>
                    <span className="font-mono text-[11px] sm:text-[12px] text-graphite-600">x402 Micropayment</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3 sm:my-4">
                    <div className="p-3.5 sm:p-4 rounded-[12px] border border-ink bg-white text-left">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-sans font-[600] text-[14px] sm:text-[15px] text-ink">Quick Audit</span>
                        <span className="font-mono font-[600] text-[14px] text-ink">$0.25</span>
                      </div>
                      <p className="text-[11px] sm:text-[12px] text-graphite-800 leading-relaxed mb-3">
                        Single-page crawl with 10 deterministic engine checks and immediate code patch.
                      </p>
                      <span className="inline-block text-[10px] sm:text-[11px] font-mono text-graphite-600 bg-graphite-100 px-2 py-0.5 rounded-[4px]">
                        1 Page Crawled
                      </span>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-[12px] border border-graphite-100 bg-white text-left">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-sans font-[600] text-[14px] sm:text-[15px] text-ink">Deep BFS Crawl</span>
                        <span className="font-mono font-[600] text-[14px] text-ink">$0.50</span>
                      </div>
                      <p className="text-[11px] sm:text-[12px] text-graphite-800 leading-relaxed mb-3">
                        Sitewide multi-page crawl detecting orphan pages, status codes, and redirect loops.
                      </p>
                      <span className="inline-block text-[10px] sm:text-[11px] font-mono text-graphite-600 bg-graphite-100 px-2 py-0.5 rounded-[4px]">
                        Up to 50 Pages
                      </span>
                    </div>
                  </div>

                  <div className="pt-2.5 sm:pt-3 border-t border-graphite-100 flex items-center justify-between text-[11px] sm:text-[12px] text-graphite-600">
                    <span>Settled in USDT, USDC, or CELO</span>
                    <span className="text-ink font-mono font-medium">Zero subscription commit</span>
                  </div>
                </div>
              </div>

              {/* Text Right */}
              <div className="space-y-4 text-left order-1 lg:order-2">
                <p className="font-sans text-[15px] sm:text-[18px] leading-[1.6] font-[400] text-violet">
                  Autonomous Settlement
                </p>
                <h2 className="font-sans text-[26px] sm:text-[34px] lg:text-[38px] font-[600] leading-[1.18] text-ink">
                  Pay strictly per crawl. No subscriptions.
                </h2>
                <p className="text-[15px] sm:text-[16px] leading-[1.6] text-graphite-800 font-normal">
                  Traditional SEO tools charge expensive monthly retainers whether you audit or not. CrawlPay executes audits on demand via the x402 open standard on Celo mainnet—from $0.25 per run in USDT, USDC, or CELO.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <Link
                    href="/app/audit"
                    className="w-full sm:w-auto bg-ink text-white rounded-[48px] px-[24px] py-[9px] text-[14px] leading-[1.6] font-normal hover:opacity-90 transition-opacity inline-flex items-center justify-center cursor-pointer"
                  >
                    Audit target domain
                  </Link>
                  <Link
                    href="/example"
                    className="text-[15px] sm:text-[16px] leading-[25.6px] text-violet font-normal hover:bg-lavender-tint hover:rounded-[5px] px-1 -mx-1 transition-colors inline-flex items-center justify-center sm:justify-start gap-1"
                  >
                    <span>View sample audit preview</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. FULL-WIDTH INK FAQ BAND (Ink background, rows separated by 1px graphite-900 bottom borders) */}
        <section id="faq" className="w-full bg-ink py-[48px] sm:py-[80px]">
          {/* Narrow Centered Column */}
          <div className="max-w-[760px] mx-auto px-4 sm:px-6 text-left">
            <h2 className="font-sans text-[28px] sm:text-[36px] md:text-[46px] font-[600] leading-[1.15] text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-[14px] sm:text-[16px] leading-[1.6] text-graphite-200 mt-3 sm:mt-4 mb-8 sm:mb-10 font-normal">
              Direct answers regarding CrawlPay audits, the deterministic engine, and on-chain settlement.
            </p>

            {/* Accordion Rows: separated by 1px graphite-900 bottom borders */}
            <div className="border-t border-graphite-900">
              {faqs.map((faq, idx) => (
                <div key={idx} className="border-b border-graphite-900">
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full py-4 sm:py-6 flex items-center justify-between text-left cursor-pointer group bg-transparent border-0"
                  >
                    {/* Questions: white DM Sans 24/500 */}
                    <span className="font-sans text-[17px] sm:text-[22px] md:text-[24px] font-[500] leading-[1.33] text-white pr-3">
                      {faq.q}
                    </span>
                    {/* Thin white right chevron, rotates on toggle */}
                    <ChevronRight
                      className={`size-5 sm:size-6 text-white stroke-[1.5] shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-90' : ''
                        }`}
                    />
                  </button>

                  {/* Answers: graphite-200, revealed 24px below question with no extra panel */}
                  {openFaq === idx && (
                    <div className="pt-1 sm:pt-2 pb-5 sm:pb-6 text-[14px] sm:text-[16px] leading-[1.6] text-graphite-200 font-normal">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* 6. INK FOOTER (Ink background, multi-column text lists, labels graphite-300, links graphite-200, Arial 14/400/20px, 12px row gaps, no cards) */}
      <footer className="w-full bg-ink border-t border-graphite-900 pt-[48px] sm:pt-[64px] pb-[36px] sm:pb-[48px]">
        <div className="max-w-[1176px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-[32px] text-left">
            {/* Column 1: Brand & Identity */}
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
                  <Link href="/app/audit" className="text-graphite-200 hover:text-white transition-colors">
                    Site Audit
                  </Link>
                </div>
                <div>
                  <Link href="/app/reports" className="text-graphite-200 hover:text-white transition-colors">
                    Reports Archive
                  </Link>
                </div>
                <div>
                  <Link href="/example" className="text-graphite-200 hover:text-white transition-colors">
                    Verified Demo Preview
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

            {/* Column 4: Policies */}
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

          {/* Bottom Bar */}
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
