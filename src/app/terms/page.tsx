'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, RefreshCw, Menu, X, Lock, CheckCircle2 } from 'lucide-react';
import { CrawlLogo } from '@/components/CrawlLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

const PUBLIC_AGENT_ADDRESS = '0xf06c2b754d07cba299751f0985a48f8013bb6b39';

export default function TermsPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-ink font-system selection:bg-lavender-tint selection:text-ink overflow-x-hidden">
      {/* 1. HEADER (64px tall, CrawlPay logo & wordmark) */}
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
            <span className="hidden xs:inline-block rounded-[6px] bg-graphite-100 dark:bg-[#22232c] px-2 py-0.5 text-[11px] font-mono text-graphite-600 dark:text-graphite-300 font-medium ml-1">
              Terms
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-[32px] font-sans text-[16px] font-[400] text-ink dark:text-graphite-200 leading-[1.5] shrink-0">
            <Link href="/" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              Home
            </Link>
            <Link href="/example" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              Demo
            </Link>
            <Link href="/#features" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              Features
            </Link>
            <Link href="/#how-it-works" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              How It Works
            </Link>
            <Link href="/docs" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              Docs
            </Link>
            <Link href="/#faq" className="hover:opacity-75 transition-opacity whitespace-nowrap">
              FAQ
            </Link>
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
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-sans text-[16px] text-ink dark:text-white py-1.5"
            >
              Home
            </Link>
            <Link
              href="/example"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-sans text-[16px] text-ink dark:text-white py-1.5"
            >
              Demo Preview
            </Link>
            <Link
              href="/docs"
              onClick={() => setMobileMenuOpen(false)}
              className="block font-sans text-[16px] text-ink dark:text-white py-1.5"
            >
              Documentation
            </Link>
            <div className="pt-2 border-t border-graphite-100 dark:border-graphite-800">
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

      {/* 2. HERO / BANNER: Calm editorial gray background */}
      <section className="bg-[#f4f4f6] border-b border-graphite-100 py-[48px] sm:py-[64px]">
        <div className="max-w-[1020px] mx-auto px-4 sm:px-6">
          <div className="space-y-3">
            <p className="font-sans text-[15px] sm:text-[18px] leading-[1.6] font-[400] text-violet mb-2">
              Trust, Guarantees &amp; Security
            </p>
            <h1 className="font-sans text-[32px] sm:text-[44px] font-[600] leading-[1.15] text-ink tracking-tight">
              Terms of Service &amp; Refund Policy
            </h1>
            <p className="text-[15px] sm:text-[17px] leading-[1.6] text-graphite-800 font-normal max-w-[760px]">
              Clear, transparent policies governing deterministic crawls, on-chain micropayments, unguessable report sharing, and failure refund guarantees.
            </p>
          </div>
        </div>
      </section>

      {/* 3. MAIN TERMS CONTENT */}
      <main className="max-w-[1020px] mx-auto px-4 sm:px-6 py-[48px] sm:py-[64px] space-y-12">
        {/* About CrawlPay */}
        <section id="about" className="space-y-4 scroll-mt-24">
          <div className="flex items-center gap-2 pb-2 border-b border-graphite-100">
            <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink">
              About CrawlPay
            </h2>
          </div>
          <p className="text-[14px] sm:text-[15px] text-graphite-800 leading-relaxed font-normal">
            CrawlPay is an autonomous technical SEO and competitor intelligence platform designed for web developers, site owners, and autonomous AI agents. Unlike traditional SaaS tools that require recurring monthly retainers and user accounts, CrawlPay provides deterministic on-demand audits settled directly on Celo mainnet rails via x402 micropayments.
          </p>
        </section>

        {/* Refund & Failure Policy */}
        <section id="refund" className="space-y-4 pt-4 scroll-mt-24">
          <div className="flex items-center gap-2 pb-2 border-b border-graphite-100">
            <RefreshCw className="size-5 text-violet" />
            <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink">
              Failure &amp; Refund Guarantee Policy
            </h2>
          </div>
          <div className="rounded-[16px] border border-graphite-100 bg-white p-6 space-y-4 shadow-sm text-[14px] text-graphite-800 leading-relaxed font-normal">
            <p>
              When you submit a payment transaction for an audit, the transaction is verified on the Celo blockchain.
            </p>
            <ul className="space-y-3 list-none pl-0">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-ink font-medium">Automatic Retry:</strong> If a crawl fails due to a network glitch, target host timeout, or transient rate limit, our backend crawler automatically attempts one immediate retry.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-ink font-medium">Irrecoverable Failures &amp; Refunds:</strong> If the target website is completely unreachable, permanently blocking crawlers, or the system fails to produce an audit report after payment verification, you are entitled to a full refund.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-ink font-medium">How to Claim:</strong> To request a manual refund for an unfulfilled transaction, provide your Celo transaction hash to our support operator or submit an automated refund request with your linked payment ID.
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* Report Access & Privacy Policy */}
        <section id="privacy" className="space-y-4 pt-4 scroll-mt-24">
          <div className="flex items-center gap-2 pb-2 border-b border-graphite-100">
            <ShieldCheck className="size-5 text-violet" />
            <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink">
              Report Access &amp; Privacy Policy
            </h2>
          </div>
          <div className="rounded-[16px] border border-graphite-100 bg-white p-6 space-y-4 shadow-sm text-[14px] text-graphite-800 leading-relaxed font-normal">
            <p>
              <strong className="text-ink font-medium">Unguessable URL Sharing:</strong> Audit reports generated by CrawlPay are assigned a high-entropy, cryptographically unguessable unique identifier. Anyone with the direct report link (<code className="rounded-[4px] bg-graphite-100 px-1.5 py-0.5 text-ink font-mono text-[13px]">/app/reports/[id]</code>) can view the analysis. This enables frictionless sharing across engineering teams, agencies, and stakeholders without account provisioning.
            </p>
            <p>
              CrawlPay does not make your report links publicly searchable unless you choose to share them or authorize public showcase.
            </p>
          </div>
        </section>

        {/* Acceptable Use & SSRF Protection */}
        <section id="security" className="space-y-4 pt-4 pb-8 scroll-mt-24">
          <div className="flex items-center gap-2 pb-2 border-b border-graphite-100">
            <Lock className="size-5 text-violet" />
            <h2 className="font-sans text-[22px] sm:text-[26px] font-[600] text-ink">
              Acceptable Use &amp; SSRF Protections
            </h2>
          </div>
          <div className="rounded-[16px] border border-graphite-100 bg-white p-6 space-y-3 shadow-sm text-[14px] text-graphite-800 leading-relaxed font-normal">
            <p>
              Users and autonomous agents agree not to abuse the crawler to initiate denial-of-service attacks, scan internal private networks, or bypass security barriers.
            </p>
            <p>
              CrawlPay actively enforces server-side SSRF filters: any attempt to audit private IP addresses (e.g. 10.0.0.0/8, 192.168.0.0/16, 127.0.0.1, AWS/GCP cloud metadata endpoints) will be strictly rejected with HTTP 400.
            </p>
          </div>
        </section>
      </main>

      {/* 4. INK FOOTER */}
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

            {/* Column 2: Audit Engine */}
            <div className="space-y-[12px]">
              <span className="font-footer text-[13px] sm:text-[14px] leading-[20px] text-graphite-300 font-normal uppercase tracking-wider block">
                AUDIT ENGINE
              </span>
              <div className="space-y-[12px] font-footer text-[14px] leading-[20px]">
                <div>
                  <Link href="/app/audit" className="text-graphite-200 hover:text-white transition-colors">
                    Launch Site Audit
                  </Link>
                </div>
                <div>
                  <Link href="/app/reports" className="text-graphite-200 hover:text-white transition-colors">
                    Audit Reports Archive
                  </Link>
                </div>
                <div>
                  <Link href="/example" className="text-graphite-200 hover:text-white transition-colors">
                    Verified Audit Demo
                  </Link>
                </div>
                <div>
                  <Link href="/docs#endpoints" className="text-graphite-200 hover:text-white transition-colors">
                    10-Check Engine Specs
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
                <div>
                  <a
                    href={`https://celoscan.io/address/${PUBLIC_AGENT_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-graphite-200 hover:text-white transition-colors"
                  >
                    Agent Wallet on Celoscan
                  </a>
                </div>
              </div>
            </div>

            {/* Column 4: Trust & Policies */}
            <div className="space-y-[12px]">
              <span className="font-footer text-[13px] sm:text-[14px] leading-[20px] text-graphite-300 font-normal uppercase tracking-wider block">
                TRUST &amp; POLICIES
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
                  <Link href="/terms#privacy" className="text-graphite-200 hover:text-white transition-colors">
                    Report Access &amp; Privacy
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
