'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  ShieldCheck,
  Layers,
  CircleDollarSign,
  ExternalLink,
  Cpu,
  Check,
  FileCode,
  Terminal,
  Globe,
  UploadCloud,
  FileSpreadsheet,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { CrawlLogo } from '@/components/CrawlLogo';
import { CONFIG } from '@/config';

export default function LandingPage() {
  const [heroUrl, setHeroUrl] = useState('');

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = heroUrl.trim();
    if (trimmed) {
      window.location.href = `/audit?target=${encodeURIComponent(trimmed)}`;
    } else {
      window.location.href = '/audit';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background Grid Pattern */}
      <div className="pointer-events-none fixed inset-0 dot-grid opacity-20" aria-hidden="true" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <CrawlLogo className="size-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              crawl<span className="text-primary">pay</span>
            </span>
          </Link>

          {/* Navigation Links linking directly to app sections & tabs */}
          <nav className="hidden items-center gap-7 text-xs font-semibold text-muted-foreground md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How It Works
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
            <Link href="/audit?tab=agents" className="transition-colors hover:text-foreground">
              For Agents & MCP
            </Link>
            <Link href="/audit?tab=activity" className="transition-colors hover:text-foreground">
              Live Activity
            </Link>
            <Link href="/audit?tab=about" className="transition-colors hover:text-foreground">
              About & Terms
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Celo Mainnet</span>
            </div>

            <Link
              href="/audit"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 gap-1.5"
            >
              <span>Launch App</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 sm:pt-28 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary mb-6 shadow-sm">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              <span>Autonomous Celo Mainnet Agent</span>
              <span className="text-primary/40">·</span>
              <span className="font-mono text-[11px]">{CONFIG.ATTRIBUTION_TAG}</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl sm:leading-[1.12]">
              Deterministic Technical SEO. <br />
              <span className="text-primary">Settled Per Crawl.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-5 text-base sm:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Say goodbye to <strong className="text-foreground font-semibold">$200/month subscriptions</strong>. CrawlPay runs deterministic technical audits, diagnoses unindexed pages, and generates copy-paste code fixes—paid on-demand via Celo HTTP 402 micro-rails.
            </p>

            {/* Quick URL Launch Form */}
            <form
              onSubmit={handleHeroSubmit}
              className="mt-8 mx-auto max-w-xl flex flex-col sm:flex-row items-center gap-2 p-1.5 rounded-xl border border-border bg-card/90 shadow-2xl backdrop-blur-md"
            >
              <div className="relative w-full">
                <Globe className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
                <input
                  type="url"
                  value={heroUrl}
                  onChange={(e) => setHeroUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-transparent pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-all gap-2 shrink-0 cursor-pointer"
              >
                <span>Audit Site</span>
                <ArrowRight className="size-4" />
              </button>
            </form>

            {/* Quick Presets */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
              <span>Quick tests:</span>
              <button
                type="button"
                onClick={() => {
                  window.location.href = `/audit?target=${encodeURIComponent('https://stripe.com')}`;
                }}
                className="rounded border border-border bg-card px-2.5 py-0.5 text-[11px] font-mono hover:border-primary/40 hover:text-foreground transition-colors"
              >
                stripe.com
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = `/audit?target=${encodeURIComponent('https://linear.app')}`;
                }}
                className="rounded border border-border bg-card px-2.5 py-0.5 text-[11px] font-mono hover:border-primary/40 hover:text-foreground transition-colors"
              >
                linear.app
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = `/audit?target=${encodeURIComponent('https://celo.org')}`;
                }}
                className="rounded border border-border bg-card px-2.5 py-0.5 text-[11px] font-mono hover:border-primary/40 hover:text-foreground transition-colors"
              >
                celo.org
              </button>
            </div>

            {/* Key Value Points */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="size-4 text-primary" /> Plain $0.25 / $0.50 USD₮ pricing
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="size-4 text-primary" /> No logins · No accounts
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="size-4 text-primary" /> Settled per crawl on Celo Mainnet
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* The Subscription Trap Problem Section */}
      <section className="border-t border-border py-20 bg-card/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-wider font-semibold text-primary">The Subscription Trap</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight font-display sm:text-4xl">
              Legacy SEO tools don&apos;t fit autonomous agents
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Traditional platforms force developers and autonomous agents into rigid monthly contracts. CrawlPay makes audits granular, verifiable, and on-demand.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Legacy tools */}
            <div className="rounded-xl border border-destructive/30 bg-destructive/[0.03] p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-destructive/20">
                <h3 className="font-display text-base font-semibold text-foreground">Legacy SEO Platforms</h3>
                <span className="rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                  $99–$249 / month
                </span>
              </div>
              <ul className="space-y-3 text-xs text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <span className="text-destructive font-bold text-sm leading-none">✕</span>
                  <span><strong>Mandatory Monthly Tax:</strong> You pay every month even if you only ran a single audit.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-destructive font-bold text-sm leading-none">✕</span>
                  <span><strong>Requires Human Credit Cards:</strong> AI agents cannot sign up or solve CAPTCHAs.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-destructive font-bold text-sm leading-none">✕</span>
                  <span><strong>Hallucinated LLM Advice:</strong> Generates generic buzzword advice without verifying code.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-destructive font-bold text-sm leading-none">✕</span>
                  <span><strong>No Code Patches:</strong> Flags errors without providing the actual Next.js or Shopify code fixes.</span>
                </li>
              </ul>
            </div>

            {/* CrawlPay */}
            <div className="rounded-xl border border-primary/30 bg-primary/[0.03] p-6 sm:p-7 space-y-4 relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-primary/20">
                <div className="flex items-center gap-2">
                  <CrawlLogo className="size-4 text-primary" />
                  <h3 className="font-display text-base font-semibold text-foreground">CrawlPay Protocol</h3>
                </div>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary font-mono">
                  $0.25 / $0.50 USD₮
                </span>
              </div>
              <ul className="space-y-3 text-xs text-foreground/90">
                <li className="flex items-start gap-2.5">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Pure Pay-As-You-Go:</strong> Zero monthly subscriptions. Pay only when an audit executes.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Machine Payments (x402):</strong> AI agents settle calls in stablecoins on Celo Mainnet in seconds.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Deterministic Check Engine:</strong> 10 rule-based checks with exact URL and DOM evidence.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="size-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Stack-Tailored Code Fixes:</strong> Generates drop-in snippets for Next.js, Shopify, and JSON-LD.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Core Pillars (Matching the 5 App Tabs) */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-wider font-semibold text-primary">Core Architecture</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight font-display sm:text-4xl">
              Engineered for precision and machine settlement
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              A transparent, deterministic technical SEO platform designed for humans and autonomous AI agents alike.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Pillar 1: Deterministic Check Engine */}
            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 space-y-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <h3 className="font-display text-base font-semibold text-foreground">10 Deterministic Checks</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Zero invented scores or AI padding. Evaluates indexability, canonical tags, headings, link graph, XML sitemaps, 64-bit Simhash content duplication, Core Web Vitals, and JSON-LD schema.
              </p>
            </div>

            {/* Pillar 2: GSC Unindexed Diagnosis */}
            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 space-y-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileSpreadsheet className="size-5" />
              </span>
              <h3 className="font-display text-base font-semibold text-foreground">Search Console Cross-Reference</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Upload your GSC Page Indexing export (.csv or .json) to diagnose URLs flagged as <em>&quot;Crawled - currently not indexed&quot;</em> and identify the exact technical blockers preventing indexation.
              </p>
            </div>

            {/* Pillar 3: Copy-Paste Code Fixes */}
            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 space-y-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileCode className="size-5" />
              </span>
              <h3 className="font-display text-base font-semibold text-foreground">Stack-Tailored Code Fixes</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Automatically detects CMS and frameworks (Next.js, Shopify, WordPress, Rank Math) and outputs drop-in code patches for HTML &lt;head&gt;, Next.js metadata, and Schema.org JSON-LD.
              </p>
            </div>

            {/* Pillar 4: For Agents & MCP */}
            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 space-y-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Cpu className="size-5" />
              </span>
              <h3 className="font-display text-base font-semibold text-foreground">Agent & MCP Integration</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Complete Model Context Protocol (MCP) configuration, OpenAPI x402 endpoints, and ERC-8004 identity registry (<code className="font-mono text-primary text-[11px]">0x8004...a432</code>) for agent autonomy.
              </p>
            </div>

            {/* Pillar 5: Verified Onchain Activity */}
            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 space-y-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Activity className="size-5" />
              </span>
              <h3 className="font-display text-base font-semibold text-foreground">Verifiable Celo Ledger</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                All paid audits are tagged with ERC-8021 calldata (<code className="font-mono text-primary text-[11px]">{CONFIG.ATTRIBUTION_TAG}</code>) and verifiable via direct Celoscan explorer links.
              </p>
            </div>

            {/* Pillar 6: Scope Transparency */}
            <div className="rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 space-y-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="size-5" />
              </span>
              <h3 className="font-display text-base font-semibold text-foreground">Scope Transparency</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Honest reporting. We state what passed and explicitly declare what was not checked (e.g. backlink graphs or rank tracking) rather than fabricating synthetic metrics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section id="how-it-works" className="border-t border-border py-20 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-wider font-semibold text-primary">Workflow</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight font-display sm:text-4xl">
              How CrawlPay works in 3 simple steps
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              No registration forms. No credit cards. No recurring subscriptions.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="rounded-xl border border-border bg-card p-6 relative">
              <span className="font-display text-3xl font-bold text-primary/30">01</span>
              <h3 className="font-display text-base font-semibold text-foreground mt-2">
                1. Select URL & Depth
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Enter your target URL and choose between a Quick Audit (1 page) or a Full Crawl (up to 50 pages). Optionally attach a Google Search Console export.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-xl border border-border bg-card p-6 relative">
              <span className="font-display text-3xl font-bold text-primary/30">02</span>
              <h3 className="font-display text-base font-semibold text-foreground mt-2">
                2. Settle on Celo Rails
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Click &quot;Pay & audit&quot; to open the wallet modal. Pay $0.25 or $0.50 USD₮ via Web3 or instant x402 facilitator. Your transaction carries the ERC-8021 attribution tag.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-xl border border-border bg-card p-6 relative">
              <span className="font-display text-3xl font-bold text-primary/30">03</span>
              <h3 className="font-display text-base font-semibold text-foreground mt-2">
                3. Inspect Root Causes & Fixes
              </h3>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Review findings grouped by root cause with exact observed snippets, benchmarks, and copy-paste code patches. All past audits are saved in your Reports tab.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-wider font-semibold text-primary">Plain Pricing</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight font-display sm:text-4xl">
              Pay per crawl. Never per month.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              Transparent, unbundled pricing settled in USD₮ on Celo Mainnet.
            </p>
          </div>

          <div className="grid gap-6 max-w-3xl mx-auto sm:grid-cols-2">
            {/* Quick Audit */}
            <div className="rounded-xl border border-primary/40 bg-card p-6 sm:p-8 flex flex-col shadow-lg relative">
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                Popular
              </span>
              <h3 className="font-display text-lg font-bold text-foreground">Quick Audit</h3>
              <p className="text-xs text-muted-foreground mt-1">Single page technical & meta health inspection.</p>

              <div className="my-6">
                <span className="font-display text-4xl font-bold text-foreground">$0.25</span>
                <span className="text-xs text-muted-foreground ml-2 font-mono">USD₮ / audit</span>
              </div>

              <ul className="space-y-3 text-xs text-muted-foreground flex-1">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> 1-page full DOM & Core Web Vitals crawl
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> 10 deterministic rule-based checks
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> Stack-tailored code patches (Next.js / Shopify)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> Google Search Console unindexed diagnostics
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> Saved locally with 1-click Recheck
                </li>
              </ul>

              <div className="mt-8">
                <Link
                  href="/audit"
                  className="w-full inline-flex items-center justify-center rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-all gap-1.5"
                >
                  <span>Launch Quick Audit</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Full Crawl */}
            <div className="rounded-xl border border-border bg-card p-6 sm:p-8 flex flex-col">
              <h3 className="font-display text-lg font-bold text-foreground">Full Crawl</h3>
              <p className="text-xs text-muted-foreground mt-1">Deep BFS crawler exploring internal link hierarchy.</p>

              <div className="my-6">
                <span className="font-display text-4xl font-bold text-foreground">$0.50</span>
                <span className="text-xs text-muted-foreground ml-2 font-mono">USD₮ / crawl</span>
              </div>

              <ul className="space-y-3 text-xs text-muted-foreground flex-1">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> Up to 50 pages depth & BFS traversal
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> 64-bit Simhash near-duplicate text detection
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> XML Sitemap cross-referencing & link ratios
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> Full GSC batch unindexed page cross-match
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-primary" /> Verified Celo Mainnet settlement receipt
                </li>
              </ul>

              <div className="mt-8">
                <Link
                  href="/audit"
                  className="w-full inline-flex items-center justify-center rounded-lg border border-border bg-background py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-all gap-1.5"
                >
                  <span>Launch Full Crawl</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 border-t border-border bg-card/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 shadow-xl relative">
            <div className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5">
              <CrawlLogo className="size-6" />
            </div>

            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              Ready to crawl without the subscription tax?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Start your first deterministic technical SEO audit in seconds. No logins, no accounts, and no monthly fees.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/audit"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-all"
              >
                <span>Launch CrawlPay App</span>
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/audit?tab=agents"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent transition-all"
              >
                <Cpu className="size-4 text-primary" />
                <span>Agent & MCP Docs</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <CrawlLogo className="size-4" />
              </span>
              <span className="font-display text-base font-bold tracking-tight">
                crawl<span className="text-primary">pay</span>
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                © {new Date().getFullYear()} CrawlPay Protocol · Celo Mainnet
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
              <Link href="/audit" className="hover:text-foreground transition-colors">
                Audit App
              </Link>
              <span>·</span>
              <Link href="/audit?tab=reports" className="hover:text-foreground transition-colors">
                Reports
              </Link>
              <span>·</span>
              <Link href="/audit?tab=agents" className="hover:text-foreground transition-colors">
                For Agents
              </Link>
              <span>·</span>
              <Link href="/audit?tab=activity" className="hover:text-foreground transition-colors">
                Activity
              </Link>
              <span>·</span>
              <Link href="/audit?tab=about" className="hover:text-foreground transition-colors">
                About & Terms
              </Link>
              <span>·</span>
              <a
                href={`https://celoscan.io/address/${CONFIG.AGENT_WALLET_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-foreground transition-colors flex items-center gap-1 font-mono text-[11px]"
              >
                <span>Celoscan</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
