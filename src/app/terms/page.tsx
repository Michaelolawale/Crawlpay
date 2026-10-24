'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, HelpCircle, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { CrawlLogo } from '@/components/CrawlLogo';
import { CONFIG } from '@/config';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Background Grid Pattern */}
      <div className="pointer-events-none fixed inset-0 dot-grid opacity-20" aria-hidden="true" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <CrawlLogo className="size-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              crawl<span className="text-primary">pay</span>
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground uppercase">
              Terms
            </span>
          </Link>

          <nav className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              Home
            </Link>
            <Link href="/docs" className="text-muted-foreground hover:text-foreground">
              Docs
            </Link>
            <Link
              href="/app/audit"
              className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
            >
              Launch App
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            Terms of Service & Refund Policy
          </h1>
          <p className="text-sm text-muted-foreground">
            Clear, straightforward policies governing on-demand crawls, micro-payments, report privacy, and failure refunds.
          </p>
        </div>

        {/* About Crawlpay */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="font-display text-xl font-bold text-foreground">About Crawlpay</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Crawlpay is an autonomous technical SEO and competitor intelligence platform designed for web developers, site owners, and autonomous AI agents. Unlike traditional SaaS tools that require monthly subscriptions and user accounts, Crawlpay provides deterministic on-demand audits settled directly on Celo rails via x402 micro-payments.
          </p>
        </section>

        {/* Refund & Failure Policy */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <RefreshCw className="size-5 text-primary" />
            <span>Failure & Refund Policy</span>
          </h2>
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 text-xs text-muted-foreground leading-relaxed">
            <p>
              When you submit a payment transaction for an audit, the transaction is verified on the Celo blockchain.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong className="text-foreground">Automatic Retry:</strong> If a crawl fails due to a network glitch, target host timeout, or transient rate limit, our backend crawler automatically attempts one immediate retry.
              </li>
              <li>
                <strong className="text-foreground">Irrecoverable Failures & Refunds:</strong> If the target website is completely unreachable, permanently blocking crawlers, or the system fails to produce an audit report after payment verification, you are entitled to a full refund.
              </li>
              <li>
                <strong className="text-foreground">How to Claim:</strong> To request a manual refund for an unfulfilled transaction, provide your Celo transaction hash to our support operator or submit an automated refund request with your linked payment ID.
              </li>
            </ul>
          </div>
        </section>

        {/* Report Access & Privacy Policy */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="size-5 text-primary" />
            <span>Report Access Policy</span>
          </h2>
          <div className="rounded-xl border border-border bg-card p-5 space-y-3 text-xs text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">Unguessable URL Sharing:</strong> Audit reports generated by Crawlpay are assigned a high-entropy, cryptographically unguessable unique identifier. Anyone with the direct report link (<code className="rounded bg-muted px-1.5 py-0.5 text-foreground">/app/reports/[id]</code>) can view the analysis. This enables frictionless sharing across engineering teams, agencies, and stakeholders without account provisioning.
            </p>
            <p>
              Crawlpay does not make your report links publicly searchable unless you choose to share them or authorize public showcase.
            </p>
          </div>
        </section>

        {/* Acceptable Use & SSRF Protection */}
        <section className="space-y-4 border-t border-border pt-8">
          <h2 className="font-display text-xl font-bold text-foreground">Acceptable Use & Security</h2>
          <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
            <p>
              Users and autonomous agents agree not to abuse the crawler to initiate denial-of-service attacks, scan internal private networks, or bypass security barriers.
            </p>
            <p>
              Crawlpay actively enforces server-side SSRF filters: any attempt to audit private IP addresses (e.g. 10.0.0.0/8, 192.168.0.0/16, 127.0.0.1, AWS/GCP cloud metadata endpoints) will be strictly rejected with HTTP 400.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
