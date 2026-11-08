'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  ShieldCheck,
  Download,
  Printer,
} from 'lucide-react';
import { SiteHeader, focusRing } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CheckEngineView } from '@/components/CheckEngineView';
import exampleReportData from '@/data/exampleReport.json';
import { FullAuditReport } from '@/types/audit';

export default function ExampleReportPage() {
  const report = exampleReportData as unknown as FullAuditReport;
  const realTxHash = '0x3fc8402348c27474548c645bb2290dbeee4f47aeb38107342b108cbb34a062f5';

  useEffect(() => {
    document.title = 'Sample report (SEO, AEO & GEO) | CrawlPay';
  }, []);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crawlpay-sample-report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0d0e12] text-ink dark:text-white font-system selection:bg-lavender-tint selection:text-ink overflow-x-hidden transition-colors">
      {/* 1. SHARED SITE HEADER */}
      <SiteHeader />

      {/* 2. MAIN REPORT CONTENT */}
      <main className="max-w-[1176px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-graphite-100 dark:border-graphite-800 pb-5">
          <div className="flex items-center gap-2.5">
            <h1 className="font-sans font-[600] text-[18px] sm:text-[20px] text-ink dark:text-white">
              Sample report
            </h1>
            <span className="rounded-[4px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 px-2 py-0.5 text-[11px] font-mono font-medium">
              Verified onchain
            </span>
          </div>

          {/* Right Action Controls: Export JSON & Print / PDF */}
          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={exportJson}
              className={`inline-flex items-center gap-1.5 rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-3.5 py-1.5 text-[13px] font-medium text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#252631] transition-colors cursor-pointer ${focusRing}`}
              title="Download report JSON"
            >
              <Download className="size-3.5 text-graphite-600 dark:text-graphite-400" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className={`inline-flex items-center gap-1.5 rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-3.5 py-1.5 text-[13px] font-medium text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#252631] transition-colors cursor-pointer ${focusRing}`}
              title="Print or save as PDF"
            >
              <Printer className="size-3.5 text-graphite-600 dark:text-graphite-400" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Frozen Notice Banner */}
        <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#16171d] p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="size-4" />
              </span>
              <span className="font-sans font-[600] text-[15px] sm:text-[16px] text-ink dark:text-white break-all sm:truncate">
                Sample Report: {report.targetUrl}
              </span>
              <span className="rounded-[4px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[11px] font-mono font-medium shrink-0">
                Settled in USDT on Celo
              </span>
            </div>
            <p className="text-[13px] text-graphite-700 dark:text-graphite-300">
              This is a real CrawlPay deep crawl report. You can review the exact findings, crawler checks, and code patches.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-graphite-200 dark:border-graphite-700">
            <div className="text-left md:text-right">
              <span className="block text-[11px] font-mono text-graphite-500 dark:text-graphite-400 uppercase">Settlement Hash</span>
              <a
                href={`https://celoscan.io/tx/${realTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1 font-mono text-[12px] text-violet hover:underline ${focusRing}`}
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

      {/* 3. SHARED FOOTER */}
      <SiteFooter />
    </div>
  );
}
