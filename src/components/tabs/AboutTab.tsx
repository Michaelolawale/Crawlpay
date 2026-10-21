'use client';

import React from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Mail,
  Bot,
  Scale,
  ExternalLink,
} from 'lucide-react';

export function AboutTab() {
  const checks = [
    {
      id: 'indexability',
      name: 'HTTP Status & Indexability',
      desc: 'Checks 200 OK statuses, 4xx/5xx errors, redirect loops, and robots meta tags (noindex/nofollow).',
    },
    {
      id: 'canonical',
      name: 'Canonical Consistency',
      desc: 'Validates self-referential canonical tags, cross-domain canonicals, and duplicate URL parameters.',
    },
    {
      id: 'titlesDescriptions',
      name: 'Titles & Meta Descriptions',
      desc: 'Enforces optimal SERP character limits (Title: 30-60 chars, Description: 70-160 chars) and uniqueness.',
    },
    {
      id: 'headings',
      name: 'Heading Hierarchy',
      desc: 'Validates single H1 rule, presence of page topics, and logical hierarchical ordering (H1 -> H2 -> H3).',
    },
    {
      id: 'links',
      name: 'Link & Anchor Integrity',
      desc: 'Audits internal link architecture, external link ratios, empty anchor tags, and javascript: links.',
    },
    {
      id: 'sitemap',
      name: 'Robots.txt & Sitemap Coverage',
      desc: 'Verifies robots.txt disallow directives and confirms that crawled URLs match the declared XML sitemaps.',
    },
    {
      id: 'duplicateContent',
      name: 'Near-Duplicate Content (Simhash)',
      desc: 'Calculates 64-bit Simhash Hamming distance across page bodies to pinpoint near-duplicate content clusters.',
    },
    {
      id: 'images',
      name: 'Image Optimization & Accessibility',
      desc: 'Flags missing alt attributes, uncompressed payloads (>500KB), and missing width/height attributes.',
    },
    {
      id: 'performance',
      name: 'Core Web Vitals & Render Modes',
      desc: 'Measures LCP, CLS, and FID/INP benchmarks; detects client-side rendering (CSR) without server-side HTML.',
    },
    {
      id: 'structuredData',
      name: 'Schema.org JSON-LD Validation',
      desc: 'Validates JSON-LD schema syntax, BreadcrumbList, Organization, and structured data entities.',
    },
  ];

  const notChecked = [
    {
      title: 'Backlinks & External Link Graphs',
      reason: 'Requires crawling the entire multi-billion-page web (e.g. Ahrefs/Majestic). CrawlPay inspects your site directly.',
    },
    {
      title: 'Keyword Search Volumes & SERP Ranks',
      reason: 'Keyword rank tracking requires commercial scraping of Google Search result pages in different geographic locations.',
    },
    {
      title: 'Synthetic Domain Authority Scores',
      reason: 'We adhere to the Check Engine principle: zero invented scores. Every finding carries direct DOM evidence.',
    },
    {
      title: 'Private Server Log File Analysis',
      reason: 'Requires private server access and internal web server access logs (Apache/Nginx/Caddy).',
    },
    {
      title: 'Full Client-Side JS Execution',
      reason: 'Static BFS crawler for performance and security. If a page requires JavaScript to render, we emit an informational note.',
    },
  ];

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
          About CrawlPay & Check Engine
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Autonomous technical SEO agent powered by deterministic code, onchain Celo settlement, and full scope transparency.
        </p>
      </div>

      {/* Section 1: What the Agent Checks */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-foreground">What the Agent Checks (10 Core Disciplines)</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Findings are detected by deterministic rule-based algorithms—never hallucinated by an LLM. Every finding carries exact URL evidence and expected benchmarks.
        </p>

        <div className="grid gap-3 sm:grid-cols-2 pt-2">
          {checks.map((c, i) => (
            <div key={c.id} className="rounded-lg border border-border/80 bg-background/60 p-3.5 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-primary">#{i + 1}</span>
                <span className="text-xs font-semibold text-foreground">{c.name}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: What It Doesn't Check */}
      <section className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="size-5 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">Scope Transparency: What It Doesn&apos;t Check</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          In adherence to the Check Engine principles, we state explicitly what is outside our crawl scope rather than presenting incomplete data:
        </p>

        <div className="space-y-2.5 pt-1">
          {notChecked.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/40 p-3 text-xs">
              <XCircle className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">{item.title}:</span>{' '}
                <span className="text-muted-foreground">{item.reason}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Terms & Responsible Crawling */}
      <section className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="size-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Terms of Service & Crawler Standards</h3>
        </div>

        <div className="space-y-3 text-xs text-foreground/90 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <p>
              <strong>Authorized Testing Only:</strong> You must only audit websites that you own, operate, or have express permission to inspect. CrawlPay is intended for webmasters and engineering teams optimizing their digital assets.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <p>
              <strong>Crawler User-Agent:</strong> CrawlPay operates with the transparent User-Agent string:{' '}
              <code className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-primary">
                CrawlPayBot/1.0 (+https://crawlpay.io/bot)
              </code>
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <p>
              <strong>Rate Limiting & Robots Compliance:</strong> We enforce a strict rate limit of maximum 2 requests per second per host. The engine strictly respects <code className="font-mono bg-black/30 px-1.5 py-0.5 rounded">robots.txt</code> Disallow directives for our bot.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
            <p>
              <strong>Abuse & Security Inquiries:</strong> If you represent a website and wish to report unauthorized crawl behavior, contact our automated abuse desk at{' '}
              <a href="mailto:abuse@crawlpay.io" className="text-primary hover:underline font-mono">
                abuse@crawlpay.io
              </a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
