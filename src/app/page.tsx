'use client';

import React, { useState, useEffect } from 'react';
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
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  Code2,
  FileText,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { CrawlLogo } from '@/components/CrawlLogo';
import { CONFIG } from '@/config';

interface ActivityItem {
  id: string;
  url: string;
  depth: string;
  status: string;
  timestamp: string;
  truncatedWallet: string;
  txHash: string;
  celoscanUrl: string;
}

export default function LandingPage() {
  const [heroUrl, setHeroUrl] = useState('');
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchActivities = () => {
      fetch('/api/activity')
        .then((res) => res.json())
        .then((data) => {
          if (data?.activity) {
            setActivities(data.activity);
          }
        })
        .catch(() => {});
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 6000);
    return () => clearInterval(interval);
  }, []);

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

  const faqs = [
    {
      q: 'What is x402?',
      a: 'x402 is an open Web3 standard that implements the HTTP 402 Payment Required status code. It allows web applications and autonomous AI agents to pay for API calls and audits per-request using on-chain micropayments without creating accounts, saving credit cards, or subscribing.',
    },
    {
      q: 'Which wallet do I need to pay?',
      a: 'You can use any standard EVM-compatible browser wallet such as MetaMask, Rabby, Valora, MiniPay, or Coinbase Wallet connected to Celo Mainnet (Chain ID 42220). Autonomous agents can also settle via standard hotwallet private keys.',
    },
    {
      q: 'What tokens are required for payment and gas?',
      a: 'Audits cost $0.25 (Quick) or $0.50 (Full) settled in USDT, USDC, or CELO. Gas on Celo is paid in native CELO (typically less than $0.001 per transaction).',
    },
    {
      q: 'What happens if a crawl fails?',
      a: 'If a crawl encounters a transient network timeout or rate limit after payment verification, our backend automatically executes one retry. If the target website is permanently unreachable, you are eligible for an immediate full refund per our refund policy.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background Grid Pattern */}
      <div className="pointer-events-none fixed inset-0 dot-grid opacity-20" aria-hidden="true" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
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

          {/* Navigation Links (Desktop) */}
          <nav className="hidden items-center gap-7 text-xs font-semibold text-muted-foreground md:flex">
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
            <Link href="/docs" className="transition-colors hover:text-foreground">
              Docs
            </Link>
            <a href="#activity" className="transition-colors hover:text-foreground">
              Live activity
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Celo Mainnet</span>
            </div>

            <Link
              href="/app/audit"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-3.5 sm:px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 gap-1.5 shrink-0"
            >
              <span>Launch App</span>
              <ArrowRight className="size-3.5" />
            </Link>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex size-9 items-center justify-center rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground md:hidden transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="size-5 text-primary" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="border-b border-border bg-card/95 backdrop-blur-xl px-4 py-4 md:hidden animate-in slide-in-from-top-2 duration-200 shadow-xl space-y-3">
            <nav className="flex flex-col space-y-2 text-sm font-medium">
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                How it works
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Pricing
              </a>
              <Link
                href="/docs"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Documentation & API
              </Link>
              <a
                href="#activity"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Live Activity Feed
              </a>
              <Link
                href="/terms"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                Terms & Refunds
              </Link>
            </nav>

            <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Celo Mainnet (Chain 42220)</span>
              </div>
              <span className="font-mono text-[11px] text-primary">Micro-settlement</span>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 sm:pt-28 sm:pb-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] sm:text-xs font-medium text-primary mb-6 shadow-sm max-w-full">
              <Sparkles className="size-3.5 shrink-0" />
              <span className="truncate">Deterministic Technical SEO & Competitor Intelligence</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground leading-[1.15]">
              Instant site audits. <br />
              <span className="text-primary">Pay per crawl.</span>
            </h1>

            {/* Hero Subtitle */}
            <p className="mt-4 sm:mt-6 text-sm sm:text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              No accounts · No logins · No subscriptions. Enter any URL to receive 10 deterministic engine checks, root cause grouping, and copy-pasteable framework code fixes.
            </p>

            {/* Hero URL Input Form */}
            <form onSubmit={handleHeroSubmit} className="mt-6 sm:mt-8 mx-auto max-w-xl">
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <div className="relative flex-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                    <Globe className="size-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    value={heroUrl}
                    onChange={(e) => setHeroUrl(e.target.value)}
                    placeholder="Enter website URL (e.g. evangelcarriersnetwork.org)..."
                    className="w-full rounded-xl border border-border bg-card/80 py-3 sm:py-3.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono shadow-sm transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 sm:px-6 py-3 sm:py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md shrink-0 cursor-pointer"
                >
                  <span>Pay & audit ($0.25)</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-[11px] sm:text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-400 shrink-0" />
                <span>Deterministic Checks</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-400 shrink-0" />
                <span>WordPress / Next.js / Shopify Fixes</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="size-3.5 text-emerald-400 shrink-0" />
                <span>Celo On-Chain Settlement</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (3 STEPS) */}
      <section id="how-it-works" className="border-t border-border bg-card/20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              How It Works
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Three seamless steps from URL submission to actionable engineering patches.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Step 1 */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 relative">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                1
              </div>
              <h3 className="font-display font-bold text-base text-foreground">Submit Target URL</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provide any public website or domain. Our crawler runs rigorous SSRF filtering to validate reachability and network safety before crawling begins.
              </p>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 relative">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                2
              </div>
              <h3 className="font-display font-bold text-base text-foreground">Confirm & Pay</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Confirm your crawl depth and approve a micro-settlement ($0.25 - $0.50 USDT) using your EVM browser wallet. No accounts or card numbers needed.
              </p>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-border bg-card p-6 space-y-3 relative">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                3
              </div>
              <h3 className="font-display font-bold text-base text-foreground">Get Report & Fixes</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Receive 10 deterministic check evaluations, root-cause groups, page importance rankings, and ready-to-deploy code snippets tailored to your stack.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section id="pricing" className="border-t border-border py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              Transparent, Per-Crawl Pricing
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Zero subscriptions. Pay only for the audits you execute.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
            {/* Quick Audit */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-foreground">Quick Audit</span>
                  <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    1 Page
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-extrabold text-primary">$0.25</span>
                  <span className="text-xs text-muted-foreground font-semibold">USDT / crawl</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ideal for quick checks on homepages, landing pages, or marketing campaigns.
                </p>

                <ul className="space-y-2.5 text-xs text-muted-foreground pt-4 border-t border-border">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    <span>Instant single-page crawl</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    <span>10 deterministic engine checks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    <span>Root cause finding grouping</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    <span>Ready-to-paste code patches</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/app/audit"
                className="w-full inline-flex items-center justify-center rounded-xl border border-border bg-background py-3 text-xs font-bold text-foreground hover:bg-accent transition-colors"
              >
                <span>Audit 1 Page ($0.25)</span>
              </Link>
            </div>

            {/* Full Audit */}
            <div className="rounded-2xl border border-primary/50 bg-primary/5 p-6 sm:p-8 flex flex-col justify-between space-y-6 relative ring-1 ring-primary/40">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-foreground">Full Deep Crawl</span>
                  <span className="rounded-md bg-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
                    Up to 50 Pages
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-4xl font-extrabold text-primary">$0.50</span>
                  <span className="text-xs text-muted-foreground font-semibold">USDT / crawl</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Thorough sitewide multi-page BFS crawl for production domains and e-commerce stores.
                </p>

                <ul className="space-y-2.5 text-xs text-muted-foreground pt-4 border-t border-border/80">
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    <span>Multi-page BFS deep crawler</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    <span>Orphan page & dead link discovery</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    <span>Canonical loop & redirect chains</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="size-4 text-emerald-400 shrink-0" />
                    <span>Search Console correlation support</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/app/audit"
                className="w-full inline-flex items-center justify-center rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
              >
                <span>Deep Audit ($0.50)</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* EXAMPLE REPORT PREVIEW */}
      <section className="border-t border-border bg-card/20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-10 space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Live Audit Output
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground mt-1 break-words">
                  Example report: evangelcarriersnetwork.org
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  A real, verified technical audit executed directly on Celo Mainnet.
                </p>
              </div>

              <Link
                href="/example"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm shrink-0"
              >
                <span>View Real Example Report</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 rounded-xl border border-border bg-background p-4 text-center">
              <div>
                <span className="text-[11px] text-muted-foreground block">Overall Score</span>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono">100/100</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Technical SEO</span>
                <span className="text-2xl font-extrabold text-emerald-400 font-mono">100/100</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Content & Headings</span>
                <span className="text-2xl font-extrabold text-foreground font-mono">88/100</span>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Performance Vitals</span>
                <span className="text-2xl font-extrabold text-amber-400 font-mono">75/100</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground pt-2 border-t border-border/60">
              <span className="font-mono text-[11px] truncate max-w-full">
                Target: https://evangelcarriersnetwork.org/
              </span>
              <a
                href="https://celoscan.io/tx/0x3fc8402348c27474548c645bb2290dbeee4f47aeb38107342b108cbb34a062f5"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-mono text-[11px] shrink-0"
              >
                <span>Verified Tx: 0x3fc8...4023</span>
                <ExternalLink className="size-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE ACTIVITY STRIP */}
      <section id="activity" className="border-t border-border py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Live Audit Activity</h2>
              <p className="text-xs text-muted-foreground">Recent real-time audits settled on Celo</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Feed</span>
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-card/60 divide-y divide-border/60 overflow-hidden text-xs">
            {activities.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                Loading activity feed...
              </div>
            ) : (
              activities.slice(0, 5).map((act) => (
                <div key={act.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 gap-2 hover:bg-accent/30 transition-colors">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <Activity className="size-3.5 text-primary shrink-0" />
                    <span className="font-mono text-muted-foreground">{act.truncatedWallet}</span>
                    <span className="text-muted-foreground">audited</span>
                    <span className="font-mono font-medium text-foreground truncate max-w-[150px] sm:max-w-[240px]">
                      {act.url}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase font-semibold text-muted-foreground shrink-0">
                      {act.depth}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-muted-foreground text-[11px]">
                    <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>•</span>
                    <a
                      href={act.celoscanUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
                    >
                      <span>Tx</span>
                      <ExternalLink className="size-2.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="border-t border-border bg-card/20 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-muted-foreground">
              Everything you need to know about Crawlpay, x402 payments, and refunds.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-border bg-card overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="flex w-full items-center justify-between p-4 text-left text-xs font-semibold text-foreground hover:bg-accent/40 transition-colors"
                >
                  <span className="pr-3">{faq.q}</span>
                  <ChevronDown
                    className={`size-4 text-muted-foreground shrink-0 transition-transform ${
                      openFaq === idx ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-4 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/40">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Unified Footer */}
      <footer className="border-t border-border bg-card/40 py-8 sm:py-10 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            <Link href="/docs" className="hover:text-foreground transition-colors font-medium">
              Docs
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors font-medium">
              Terms & Policy
            </Link>
            <a
              href="/api/status"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors font-medium"
            >
              API Status
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-center sm:text-left">
            <span>Agent Address:</span>
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
