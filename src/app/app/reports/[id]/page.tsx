'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  Download,
  Printer,
  Check,
  Calendar,
  Globe,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { CheckEngineView } from '@/components/CheckEngineView';
import { FullAuditReport } from '@/types/audit';
import { focusRing } from '@/components/SiteHeader';

export default function SingleReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id as string;

  const [report, setReport] = useState<FullAuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (report?.targetUrl) {
      document.title = `${report.targetUrl} — Audit report | CrawlPay`;
    } else {
      document.title = 'Audit report | CrawlPay';
    }
  }, [report]);

  useEffect(() => {
    if (!reportId) return;

    // 1. Try to find in localStorage reports
    try {
      const stored = localStorage.getItem('crawlpay_reports');
      if (stored) {
        const list = JSON.parse(stored);
        const match = list.find((item: any) => item.id === reportId);
        if (match && match.reportData) {
          setReport(match.reportData);
          setLoading(false);
          return;
        }
      }
    } catch {}

    // 2. Fallback: try fetching from server
    fetch(`/api/reports/${reportId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Report not found');
        return res.json();
      })
      .then((data) => {
        setReport(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback: If it's example report or general fallback
        fetch('/api/example')
          .then((res) => res.json())
          .then((exampleData) => {
            setReport(exampleData);
            setLoading(false);
          })
          .catch(() => {
            setErrorMsg('Unable to locate the specified audit report.');
            setLoading(false);
          });
      });
  }, [reportId]);

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const exportJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crawlpay-report-${report.targetUrl.replace(/[^a-z0-9]/gi, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3">
        <Loader2 className="size-8 animate-spin text-ink dark:text-white" />
        <p className="text-[14px] font-medium text-graphite-700 dark:text-graphite-300">Loading audit report...</p>
      </div>
    );
  }

  if (errorMsg || !report) {
    return (
      <div className="mx-auto max-w-lg rounded-[20px] border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-8 text-center space-y-4">
        <AlertCircle className="mx-auto size-8 text-rose-600 dark:text-rose-400" />
        <h2 className="text-[18px] font-semibold text-ink dark:text-white">Report not found</h2>
        <p className="text-[14px] text-graphite-700 dark:text-graphite-300">
          {errorMsg || 'The requested audit report could not be found or has expired.'}
        </p>
        <Link
          href="/app/reports"
          className={`inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white px-5 py-2.5 text-[14px] font-medium text-white dark:text-ink hover:opacity-90 ${focusRing}`}
        >
          <ArrowLeft className="size-4" />
          <span>Back to reports</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top Action Bar */}
      <div className="space-y-4 border-b border-graphite-100 dark:border-graphite-800 pb-5">
        {/* Navigation Breadcrumb */}
        <div className="no-print">
          <Link
            href="/app/reports"
            className={`inline-flex items-center gap-1.5 rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-3.5 py-1.5 text-xs sm:text-[13px] font-medium text-ink dark:text-white hover:bg-graphite-100 dark:hover:bg-[#252631] transition-colors shadow-xs cursor-pointer ${focusRing}`}
            title="Back to all reports"
            aria-label="Back to all reports"
          >
            <ArrowLeft className="size-3.5" />
            <span>All reports</span>
          </Link>
        </div>

        {/* Title and Actions Row */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <Globe className="size-5 text-violet shrink-0 mt-0.5 sm:mt-1" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                <h1 className="font-sans text-[18px] sm:text-[22px] font-bold text-ink dark:text-white break-all sm:truncate">
                  {report.targetUrl}
                </h1>
                {(() => {
                  const isDeepCrawl = report.isFreeTier === false || (report.pagesChecked && report.pagesChecked > 1) || report.mode === 'full';
                  return (
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium shrink-0 ${
                      isDeepCrawl
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                        : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-700 dark:text-graphite-300 border border-graphite-200 dark:border-graphite-700'
                    }`}>
                      {isDeepCrawl ? `Deep crawl (${report.pagesChecked || 50} pages)` : 'Quick audit (1 page)'}
                    </span>
                  );
                })()}
              </div>
              <div className="text-xs text-graphite-600 dark:text-graphite-400 flex flex-wrap items-center gap-2 mt-1.5">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Calendar className="size-3.5 shrink-0 text-graphite-400" />
                  <span>{new Date(report.auditTimestamp).toLocaleString()}</span>
                </span>
                <span className="text-graphite-300 dark:text-graphite-700">•</span>
                <span className="font-mono text-[11px] text-graphite-500 dark:text-graphite-400 rounded-md bg-graphite-100 dark:bg-graphite-800/80 px-2 py-0.5 border border-graphite-200/50 dark:border-graphite-700/50 whitespace-nowrap">
                  ID: {reportId}
                </span>
              </div>
            </div>
          </div>

          {/* Share and Export Actions */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 no-print">
            <button
              type="button"
              onClick={copyShareLink}
              className={`inline-flex items-center justify-center gap-1.5 rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-3.5 py-2 text-xs sm:text-[13px] font-medium text-ink dark:text-white hover:bg-graphite-100 dark:hover:bg-[#252631] transition-colors shadow-xs cursor-pointer w-full sm:w-auto ${focusRing}`}
            >
              {copiedLink ? <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" /> : <Share2 className="size-3.5 text-graphite-500" />}
              <span>{copiedLink ? 'Link copied' : 'Share link'}</span>
            </button>

            <button
              type="button"
              onClick={exportJson}
              className={`inline-flex items-center justify-center gap-1.5 rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-3.5 py-2 text-xs sm:text-[13px] font-medium text-ink dark:text-white hover:bg-graphite-100 dark:hover:bg-[#252631] transition-colors shadow-xs cursor-pointer w-full sm:w-auto ${focusRing}`}
            >
              <Download className="size-3.5 text-graphite-500" />
              <span>Export JSON</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className={`inline-flex items-center justify-center gap-1.5 rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-3.5 py-2 text-xs sm:text-[13px] font-medium text-ink dark:text-white hover:bg-graphite-100 dark:hover:bg-[#252631] transition-colors shadow-xs cursor-pointer w-full sm:w-auto ${focusRing}`}
            >
              <Printer className="size-3.5 text-graphite-500" />
              <span>Print / PDF</span>
            </button>

            {(() => {
              const isDeepCrawl = report.isFreeTier === false || (report.pagesChecked && report.pagesChecked > 1) || report.mode === 'full';
              const rerunMode = isDeepCrawl ? 'full' : 'quick';
              return (
                <Link
                  href={`/app/audit?target=${encodeURIComponent(report.targetUrl)}&mode=${rerunMode}`}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-[48px] bg-ink dark:bg-white px-4 py-2 text-xs sm:text-[13px] font-semibold text-white dark:text-ink hover:opacity-90 transition-opacity shadow-xs cursor-pointer w-full sm:w-auto shrink-0 ${focusRing}`}
                  title={isDeepCrawl ? 'Re-run deep crawl ($0.50 in USDT)' : 'Re-run free quick audit'}
                >
                  <RotateCcw className="size-3.5" />
                  <span>{isDeepCrawl ? 'Run again ($0.50)' : 'Run again'}</span>
                </Link>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Complete Check Engine Report */}
      <CheckEngineView report={report} />
    </div>
  );
}
