'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  RotateCcw,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Trash2,
  Calendar,
  Globe,
  Search,
  ArrowRight,
} from 'lucide-react';
import { FullAuditReport } from '@/types/audit';
import { focusRing } from '@/components/SiteHeader';

export interface SavedReportItem {
  id: string;
  date: string;
  timestamp?: string | number;
  targetUrl: string;
  mode: 'quick' | 'full';
  wallet?: string;
  pagesChecked: number;
  issuesCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  reportData: FullAuditReport;
  txHash?: string;
  celoscanUrl?: string;
}

export default function AppReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<SavedReportItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [activeWallet, setActiveWallet] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Saved reports | CrawlPay';
  }, []);

  const loadCloudReports = async (wallet?: string) => {
    try {
      const url = wallet ? `/api/reports?wallet=${encodeURIComponent(wallet)}` : '/api/reports';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data?.reports && data.reports.length > 0) {
          setReports((prev) => {
            const combined = [...data.reports, ...prev];
            const map = new Map();
            for (const r of combined) {
              if (!map.has(r.id)) map.set(r.id, r);
            }
            return Array.from(map.values());
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load cloud reports:', e);
    }
  };

  useEffect(() => {
    // 1. Read local reports
    try {
      const stored = localStorage.getItem('crawlpay_reports');
      if (stored) {
        setReports(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse saved reports:', e);
    }

    // 2. Fetch from Supabase backend
    loadCloudReports();

    // 3. Check connected wallet
    const ethereum = (window as unknown as { ethereum?: any })?.ethereum;
    if (ethereum) {
      ethereum
        .request({ method: 'eth_accounts' })
        .then((accs: string[]) => {
          if (accs && accs[0]) {
            setActiveWallet(accs[0]);
            loadCloudReports(accs[0]);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this report from your browser storage?')) return;
    const updated = reports.filter((r) => r.id !== id);
    setReports(updated);
    try {
      localStorage.setItem('crawlpay_reports', JSON.stringify(updated));
    } catch {}
  };

  const filteredReports = reports.filter((r) =>
    r.targetUrl.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-graphite-100 dark:border-graphite-800 pb-6">
        <div>
          <h1 className="font-sans text-[26px] sm:text-[34px] font-[600] tracking-tight text-ink dark:text-white leading-tight">
            Saved reports
          </h1>
          <p className="mt-1.5 text-[14px] sm:text-[15px] text-graphite-700 dark:text-graphite-300">
            {activeWallet
              ? `Displaying audits associated with ${activeWallet.slice(0, 6)}...${activeWallet.slice(-4)}`
              : 'Audit history for this browser session and connected wallet.'}
          </p>
        </div>

        <Link
          href="/app/audit"
          className={`inline-flex items-center justify-center gap-2 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-5 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity shadow-sm self-start sm:self-auto ${focusRing}`}
        >
          <Search className="size-4" />
          <span>Run free audit</span>
        </Link>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-graphite-500" />
          <input
            type="text"
            placeholder="Filter reports by URL..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className={`w-full rounded-[32px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#111216] py-2.5 pl-10 pr-4 text-[14px] text-ink dark:text-white placeholder:text-graphite-500 transition-colors ${focusRing}`}
          />
        </div>
        <span className="text-[13px] font-medium text-graphite-700 dark:text-graphite-300">
          {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'} saved
        </span>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-graphite-200 dark:border-graphite-800 p-12 text-center bg-[#f4f4f6] dark:bg-[#16171d]">
          <div className="flex size-12 items-center justify-center rounded-[12px] bg-white dark:bg-[#1a1b22] border border-graphite-200 dark:border-graphite-700 text-ink dark:text-white mb-4 shadow-sm">
            <FileText className="size-6 text-ink dark:text-white" />
          </div>
          <h2 className="font-sans text-[18px] font-semibold text-ink dark:text-white">No audit reports found</h2>
          <p className="mt-1.5 max-w-sm text-[14px] text-graphite-700 dark:text-graphite-300">
            {searchFilter
              ? 'No audits matched your search filter.'
              : 'You have not run any audits from this wallet yet. Start with a free quick audit.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/app/audit"
              className={`inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-5 py-2.5 text-[14px] font-medium hover:opacity-90 transition-opacity ${focusRing}`}
            >
              <span>Run free audit</span>
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/example"
              className={`inline-flex items-center gap-1.5 rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-5 py-2.5 text-[14px] font-medium text-ink dark:text-white hover:bg-graphite-100 dark:hover:bg-[#252631] transition-colors ${focusRing}`}
            >
              <span>Sample report</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(`/app/reports/${item.id}`)}
              className={`group flex flex-col justify-between gap-4 rounded-[16px] border border-graphite-200 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 transition-all hover:border-violet dark:hover:border-violet/60 hover:shadow-sm cursor-pointer sm:flex-row sm:items-center ${focusRing}`}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(`/app/reports/${item.id}`);
                }
              }}
            >
              {/* URL & Meta */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <Globe className="size-4 text-violet shrink-0" />
                  <span className="font-sans text-[15px] sm:text-[16px] font-semibold text-ink dark:text-white truncate">
                    {item.targetUrl}
                  </span>
                  <span className="rounded-full bg-[#f4f4f6] dark:bg-[#1a1b22] border border-graphite-200 dark:border-graphite-700 px-2.5 py-0.5 text-[11px] font-semibold text-graphite-800 dark:text-graphite-200 shrink-0">
                    {item.mode === 'full' ? 'Deep crawl' : 'Quick audit'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[13px] text-graphite-600 dark:text-graphite-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    <span>{new Date(item.date || item.timestamp || Date.now()).toLocaleDateString()}</span>
                  </span>
                  <span>/</span>
                  <span>{item.pagesChecked || item.reportData?.pagesChecked || 1} page{(item.pagesChecked || item.reportData?.pagesChecked || 1) !== 1 ? 's' : ''}</span>

                  {item.txHash && (
                    <>
                      <span>/</span>
                      <a
                        href={item.celoscanUrl || `https://celoscan.io/tx/${item.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className={`inline-flex items-center gap-1 font-mono text-[11px] text-violet hover:underline ${focusRing}`}
                      >
                        <span>{item.txHash.slice(0, 8)}...</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Findings Summary Badges */}
              <div className="flex items-center gap-2 text-xs shrink-0">
                {(item.issuesCount?.critical || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-2.5 py-0.5 text-[12px] font-semibold text-rose-700 dark:text-rose-300">
                    <ShieldAlert className="size-3 text-rose-600 dark:text-rose-400" />
                    <span>{item.issuesCount?.critical} Critical</span>
                  </span>
                )}
                {(item.issuesCount?.high || 0) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 px-2.5 py-0.5 text-[12px] font-semibold text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="size-3 text-amber-600 dark:text-amber-400" />
                    <span>{item.issuesCount?.high} Warning</span>
                  </span>
                )}
                {(item.issuesCount?.critical || 0) === 0 && (item.issuesCount?.high || 0) === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 px-2.5 py-0.5 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Clean</span>
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-graphite-100 dark:border-graphite-800 sm:border-t-0 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rerunMode = item.mode === 'full' ? 'full' : 'quick';
                    router.push(`/app/audit?target=${encodeURIComponent(item.targetUrl)}&mode=${rerunMode}`);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-3.5 py-1.5 text-[13px] font-medium text-ink dark:text-white hover:bg-graphite-100 dark:hover:bg-[#252631] transition-colors shadow-sm cursor-pointer ${focusRing}`}
                  title={item.mode === 'full' ? 'Re-run deep crawl ($0.50 in USDT)' : 'Re-run free quick audit'}
                >
                  <RotateCcw className="size-3.5 text-violet" />
                  <span className="hidden sm:inline">{item.mode === 'full' ? 'Run again ($0.50)' : 'Run again'}</span>
                  <span className="sm:hidden">{item.mode === 'full' ? 'Rerun ($0.50)' : 'Rerun'}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(item.id, e)}
                  className={`rounded-[10px] border border-graphite-200 dark:border-graphite-700 p-2 text-graphite-600 dark:text-graphite-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900 transition-colors cursor-pointer ${focusRing}`}
                  title="Delete report"
                  aria-label="Delete report"
                >
                  <Trash2 className="size-4" />
                </button>
                <span className="inline-flex items-center gap-1 rounded-[48px] bg-[#f4f4f6] dark:bg-[#1a1b22] border border-graphite-200 dark:border-graphite-700 px-3.5 py-1.5 text-[13px] font-medium text-ink dark:text-white group-hover:bg-ink group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-ink transition-colors cursor-pointer">
                  <Eye className="size-3.5" />
                  <span>View</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
