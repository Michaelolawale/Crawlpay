'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Share2,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Globe,
  Loader2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { CheckEngineView } from '@/components/CheckEngineView';
import { FullAuditReport } from '@/types/audit';

export default function SingleReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id as string;

  const [report, setReport] = useState<FullAuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
          .catch((err) => {
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
        <Loader2 className="size-8 animate-spin text-ink" />
        <p className="text-sm font-medium text-graphite-800">Loading audit report...</p>
      </div>
    );
  }

  if (errorMsg || !report) {
    return (
      <div className="mx-auto max-w-lg rounded-[20px] border border-rose-200 bg-rose-50/50 p-8 text-center space-y-4">
        <AlertCircle className="mx-auto size-8 text-rose-600" />
        <h2 className="text-base font-bold text-ink">Report Not Found</h2>
        <p className="text-xs text-graphite-800">
          {errorMsg || 'The requested audit report could not be found or has expired.'}
        </p>
        <Link
          href="/app/reports"
          className="inline-flex h-[42px] items-center gap-1.5 rounded-[48px] bg-ink px-5 text-xs font-semibold text-white hover:opacity-90"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Reports</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-graphite-100 pb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/app/reports')}
            className="rounded-[12px] border border-graphite-100 bg-white p-2 text-graphite-800 hover:bg-[#f4f4f6] hover:text-ink transition-colors shadow-sm"
            title="Back to Reports"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <Globe className="size-4 text-violet shrink-0" />
              <h1 className="font-mono text-base sm:text-lg font-bold text-ink truncate">{report.targetUrl}</h1>
            </div>
            <p className="text-xs text-graphite-800 flex flex-wrap items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="size-3 shrink-0" />
                <span>{new Date(report.auditTimestamp).toLocaleString()}</span>
              </span>
              <span>•</span>
              <span className="font-mono text-[11px] text-graphite-800">ID: {reportId}</span>
            </p>
          </div>
        </div>

        {/* Share and Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyShareLink}
            className="inline-flex h-[38px] items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-3.5 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#20212b] transition-colors shadow-sm cursor-pointer"
          >
            {copiedLink ? <Check className="size-3.5 text-emerald-600" /> : <Share2 className="size-3.5 text-graphite-800 dark:text-graphite-400" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
          </button>

          <button
            type="button"
            onClick={exportJson}
            className="inline-flex h-[38px] items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-3.5 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#20212b] transition-colors shadow-sm cursor-pointer"
          >
            <Download className="size-3.5 text-graphite-800 dark:text-graphite-400" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-[38px] items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-3.5 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#20212b] transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="size-3.5 text-graphite-800 dark:text-graphite-400" />
            <span>Print / PDF</span>
          </button>

          <Link
            href={`/app/audit?target=${encodeURIComponent(report.targetUrl)}`}
            className="inline-flex h-[38px] items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white px-4 text-xs font-semibold text-white dark:text-ink hover:opacity-90 transition-opacity shadow-sm cursor-pointer shrink-0"
            title="Deploy fixes and re-audit on Celo Mainnet ($0.25)"
          >
            <RotateCcw className="size-3.5" />
            <span>Re-audit Live ($0.25)</span>
          </Link>
        </div>
      </div>

      {/* Complete Check Engine Report */}
      <CheckEngineView report={report} />
    </div>
  );
}
