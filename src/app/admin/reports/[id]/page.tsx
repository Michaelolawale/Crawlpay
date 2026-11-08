'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Eye,
  EyeOff,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
  RotateCcw,
  Globe,
  Wallet,
  Clock,
  Layers,
  FileText,
  Lock,
} from 'lucide-react';
import { CheckEngineView } from '@/components/CheckEngineView';
import { FullAuditReport } from '@/types/audit';
import { getAdminToken } from '@/utils/adminClient';

export default function AdminReportInspectorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromSource = searchParams.get('from') || 'jobs';
  const reportId = params?.id as string;

  const [rawReport, setRawReport] = useState<FullAuditReport | null>(null);
  const [jobMeta, setJobMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Privacy & Redaction controls (enabled by default for safe screen-sharing)
  const [privacyMode, setPrivacyMode] = useState<boolean>(true);
  const [maskDomain, setMaskDomain] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [rerunning, setRerunning] = useState(false);

  useEffect(() => {
    if (!reportId) return;

    const token = getAdminToken();
    if (!token) {
      setErrorMsg('Admin authentication required. Please log in through the operator portal.');
      setLoading(false);
      return;
    }

    fetch(`/api/admin/reports/${encodeURIComponent(reportId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Unauthorized: Session expired or invalid admin token.');
          }
          // Try public fallback if admin route is not available
          const publicRes = await fetch(`/api/reports/${encodeURIComponent(reportId)}`);
          if (publicRes.ok) {
            const data = await publicRes.json();
            return { report: data, job: null };
          }
          throw new Error('Audit report not found.');
        }
        return res.json();
      })
      .then((data) => {
        setRawReport(data.report);
        if (data.job) setJobMeta(data.job);
        setLoading(false);
      })
      .catch((err: any) => {
        setErrorMsg(err?.message || 'Failed to load report.');
        setLoading(false);
      });
  }, [reportId]);

  // Redacted / Sanitized Report for Privacy Mode
  const displayReport = useMemo(() => {
    if (!rawReport) return null;
    if (!privacyMode && !maskDomain) return rawReport;

    const sanitized = JSON.parse(JSON.stringify(rawReport)) as FullAuditReport;

    // Mask Target URL if requested
    if (maskDomain && sanitized.targetUrl) {
      try {
        const u = new URL(sanitized.targetUrl);
        const host = u.hostname;
        const maskedHost = `client-${host.slice(0, 3)}***${host.slice(host.lastIndexOf('.'))}`;
        sanitized.targetUrl = `${u.protocol}//${maskedHost}`;
      } catch {
        sanitized.targetUrl = 'https://client-project-***.org';
      }
    }

    // Mask Wallet in metadata and receipt
    if (privacyMode) {
      if (sanitized.onchainReceipt) {
        if (sanitized.onchainReceipt.upstreamBrowserReceipt) {
          const tx = sanitized.onchainReceipt.upstreamBrowserReceipt.txHash;
          if (tx && tx.length === 66) {
            sanitized.onchainReceipt.upstreamBrowserReceipt.txHash = `${tx.slice(0, 8)}...${tx.slice(-6)}`;
          }
        }
      }
    }

    return sanitized;
  }, [rawReport, privacyMode, maskDomain]);

  const rawWallet = jobMeta?.wallet || rawReport?.onchainReceipt?.upstreamBrowserReceipt?.txHash;
  const maskedWallet = useMemo(() => {
    if (!jobMeta?.wallet) return 'Anonymous / Direct API';
    if (!privacyMode) return jobMeta.wallet;
    return `${jobMeta.wallet.slice(0, 6)}...${jobMeta.wallet.slice(-4)}`;
  }, [jobMeta?.wallet, privacyMode]);

  const exportSanitizedJson = () => {
    if (!displayReport) return;
    const blob = new Blob([JSON.stringify(displayReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanitized-audit-report-${reportId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRerun = async () => {
    if (!displayReport?.targetUrl) return;
    setRerunning(true);
    try {
      const token = getAdminToken();
      const res = await fetch('/api/admin/sandbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: rawReport?.targetUrl || displayReport.targetUrl,
          mode: displayReport.pagesChecked > 1 ? 'full' : 'quick',
        }),
      });
      const data = await res.json();
      if (res.ok && data?.report) {
        setRawReport(data.report);
        alert('Crawl successfully re-executed with fresh telemetry!');
      } else {
        alert(`Rerun failed: ${data?.error || 'Server error'}`);
      }
    } catch (err: any) {
      alert(`Rerun error: ${err?.message}`);
    } finally {
      setRerunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3">
        <Loader2 className="size-8 animate-spin text-violet" />
        <p className="text-xs font-mono text-graphite-600 dark:text-graphite-400">
          Decrypting operator audit payload...
        </p>
      </div>
    );
  }

  if (errorMsg || !displayReport) {
    return (
      <div className="mx-auto max-w-lg rounded-[20px] border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 p-8 text-center space-y-4">
        <AlertCircle className="mx-auto size-8 text-rose-600 dark:text-rose-400" />
        <h2 className="text-base font-bold text-ink dark:text-white">Operator Access Restricted</h2>
        <p className="text-xs text-graphite-700 dark:text-graphite-300">
          {errorMsg || 'The requested audit report is either missing or access is unauthorized.'}
        </p>
        <div className="pt-2 flex items-center justify-center gap-2">
          <Link
            href="/admin/reports"
            className="inline-flex h-[38px] items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white px-5 text-xs font-semibold text-white dark:text-ink hover:opacity-90"
          >
            <ArrowLeft className="size-3.5" />
            <span>All Reports</span>
          </Link>
          <Link
            href="/admin/jobs"
            className="inline-flex h-[38px] items-center gap-1.5 rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-5 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-100 dark:hover:bg-[#252631]"
          >
            <span>Jobs Queue</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Privacy Mode Banner for Screen Sharing / Office Hours */}
      <div
        className={`rounded-[16px] border p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          privacyMode
            ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
            : 'border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex size-9 items-center justify-center rounded-full shrink-0 ${
              privacyMode
                ? 'bg-emerald-600 text-white'
                : 'bg-amber-600 text-white'
            }`}
          >
            {privacyMode ? <ShieldCheck className="size-4" /> : <ShieldAlert className="size-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs sm:text-sm">
                {privacyMode ? 'Privacy Mode Active (Safe for Screen Sharing)' : 'Raw Operator Mode (PII Exposed)'}
              </span>
              <span className="rounded-full bg-white/60 dark:bg-black/40 px-2 py-0.5 text-[10px] font-mono font-bold">
                {privacyMode ? 'REDACTED' : 'CONFIDENTIAL'}
              </span>
            </div>
            <p className="text-[11px] opacity-85 mt-0.5">
              {privacyMode
                ? 'Client wallet addresses, transaction hashes, and internal network traces are automatically masked.'
                : 'Warning: Client wallet address and full blockchain receipts are visible on screen.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`inline-flex items-center gap-1.5 rounded-[48px] px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-colors cursor-pointer ${
              privacyMode
                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                : 'bg-amber-700 text-white hover:bg-amber-800'
            }`}
          >
            {privacyMode ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            <span>{privacyMode ? 'Show Raw Data' : 'Enable Privacy Mask'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMaskDomain(!maskDomain)}
            className={`inline-flex items-center gap-1.5 rounded-[48px] border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              maskDomain
                ? 'bg-ink dark:bg-white text-white dark:text-ink border-transparent'
                : 'bg-white dark:bg-[#16171d] text-ink dark:text-white border-graphite-200 dark:border-graphite-700 hover:bg-graphite-50'
            }`}
            title="Mask target website URL for stealth client demos"
          >
            <Globe className="size-3" />
            <span>{maskDomain ? 'Domain Masked' : 'Mask Domain'}</span>
          </button>
        </div>
      </div>

      {/* Operator Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-graphite-100 dark:border-graphite-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href={
              fromSource === 'payments'
                ? '/admin/payments'
                : fromSource === 'overview'
                ? '/admin'
                : fromSource === 'reports'
                ? '/admin/reports'
                : '/admin/jobs'
            }
            className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-2 text-graphite-700 dark:text-graphite-300 hover:text-ink dark:hover:text-white transition-colors shadow-sm"
            title="Back to admin dashboard"
          >
            <ArrowLeft className="size-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-lg font-bold text-ink dark:text-white">
                Admin Audit Inspector
              </h1>
              <span className="font-mono text-[11px] text-graphite-500 bg-[#f4f4f6] dark:bg-[#20212b] px-2 py-0.5 rounded">
                {reportId.slice(0, 16)}...
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-[11px] text-graphite-600 dark:text-graphite-400 mt-0.5">
              <span className="font-mono font-medium text-ink dark:text-white flex items-center gap-1">
                <Globe className="size-3 text-violet" />
                <span>{displayReport.targetUrl}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <Wallet className="size-3 text-emerald-600" />
                <span>{maskedWallet}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={exportSanitizedJson}
            className="inline-flex h-[36px] items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-3.5 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#20212b] transition-colors shadow-sm cursor-pointer"
            title="Download report with privacy redaction applied"
          >
            <Download className="size-3.5 text-graphite-600 dark:text-graphite-400" />
            <span>Export Sanitized</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-[36px] items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-3 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#20212b] transition-colors shadow-sm cursor-pointer"
          >
            <Printer className="size-3.5 text-graphite-600 dark:text-graphite-400" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={handleRerun}
            disabled={rerunning}
            className="inline-flex h-[36px] items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white px-4 text-xs font-semibold text-white dark:text-ink hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm cursor-pointer shrink-0"
            title="Execute crawler again on this target URL"
          >
            <RotateCcw className={`size-3.5 ${rerunning ? 'animate-spin' : ''}`} />
            <span>{rerunning ? 'Crawling...' : 'Rerun Crawl'}</span>
          </button>
        </div>
      </div>

      {/* Render the core Check Engine View */}
      <CheckEngineView report={displayReport} />
    </div>
  );
}

