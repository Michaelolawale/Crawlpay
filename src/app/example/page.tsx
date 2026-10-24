'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Globe,
  Calendar,
  Sparkles,
  ArrowRight,
  Download,
  Printer,
} from 'lucide-react';
import { CrawlLogo } from '@/components/CrawlLogo';
import { CheckEngineView } from '@/components/CheckEngineView';
import exampleReportData from '@/data/exampleReport.json';
import { FullAuditReport } from '@/types/audit';

export default function ExampleReportPage() {
  const report = exampleReportData as unknown as FullAuditReport;
  const realTxHash = '0x3fc8402348c27474548c645bb2290dbeee4f47aeb38107342b108cbb34a062f5';

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crawlpay-example-evangelcarriersnetwork.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={exportJson}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
            >
              <Download className="size-3.5" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors"
            >
              <Printer className="size-3.5" />
              <span>Print / PDF</span>
            </button>

            <Link
              href="/app/audit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
            >
              <span>Audit Your Site</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Banner: Real Audit Disclaimer with Real Tx Link */}
        <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 sm:p-6 backdrop-blur-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                  <span>Real On-Chain Audit</span>
                </span>
                <span className="text-xs text-muted-foreground">Executed on Celo Mainnet</span>
              </div>
              <h1 className="font-display text-xl font-bold text-foreground sm:text-2xl">
                Example report: evangelcarriersnetwork.org
              </h1>
              <p className="text-xs text-muted-foreground">
                This is a live, deterministic technical SEO audit executed directly through the Crawlpay pipeline on a real production domain.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 text-xs space-y-1 sm:text-right shrink-0">
              <span className="text-[11px] text-muted-foreground block">Verified Attributed Settlement:</span>
              <a
                href={`https://celoscan.io/tx/${realTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-mono text-primary hover:underline text-xs"
              >
                <span>{`${realTxHash.slice(0, 10)}...${realTxHash.slice(-8)}`}</span>
                <ExternalLink className="size-3" />
              </a>
              <span className="block text-[10px] text-muted-foreground font-mono">Chain ID: 42220 (Celo Mainnet)</span>
            </div>
          </div>
        </div>

        {/* Full Check Engine View */}
        <CheckEngineView report={report} />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/40 py-8 text-xs text-muted-foreground mt-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <Link href="/docs" className="hover:text-foreground">
              Docs
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Terms & Policy
            </Link>
            <Link href="/app/audit" className="hover:text-foreground">
              Launch App
            </Link>
          </div>

          <div className="text-[11px]">
            <span>Crawlpay · Autonomous deterministic SEO crawler on Celo</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
