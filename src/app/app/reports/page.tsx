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
  Wallet,
} from 'lucide-react';
import { FullAuditReport } from '@/types/audit';

export interface SavedReportItem {
  id: string;
  date: string;
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
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-graphite-100 pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Audit Reports History
          </h1>
          <p className="mt-1 text-sm text-graphite-800">
            {activeWallet
              ? `Displaying audits associated with ${activeWallet.slice(0, 6)}...${activeWallet.slice(-4)}`
              : 'Audit history for this browser session and connected wallet.'}
          </p>
        </div>

        <Link
          href="/app/audit"
          className="inline-flex h-[44px] items-center justify-center gap-2 rounded-[48px] bg-ink px-5 text-xs font-semibold text-white hover:opacity-90 transition-all shadow-sm"
        >
          <Search className="size-3.5" />
          <span>New Audit</span>
        </Link>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-3.5 -translate-y-1/2 text-graphite-800/60" />
          <input
            type="text"
            placeholder="Filter reports by URL..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full rounded-[32px] border border-graphite-100 bg-white py-2.5 pl-10 pr-4 text-xs text-ink placeholder:text-graphite-800/50 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>
        <span className="text-xs font-medium text-graphite-800">
          {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'} saved
        </span>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-graphite-200 p-12 text-center bg-[#f4f4f6]">
          <div className="flex size-12 items-center justify-center rounded-[12px] bg-white border border-graphite-100 text-ink mb-4 shadow-sm">
            <FileText className="size-6 text-ink" />
          </div>
          <h3 className="font-display text-base font-bold text-ink">No audit reports found</h3>
          <p className="mt-1 max-w-sm text-xs text-graphite-800">
            {searchFilter
              ? 'No audits matched your search criteria.'
              : 'You have not run any audits from this wallet yet. Start your first audit now!'}
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/app/audit"
              className="inline-flex h-[42px] items-center gap-1.5 rounded-[48px] bg-ink px-5 text-xs font-semibold text-white hover:opacity-90 transition-all"
            >
              <span>Run an Audit</span>
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/example"
              className="inline-flex h-[42px] items-center gap-1.5 rounded-[48px] border border-graphite-100 bg-white px-5 text-xs font-semibold text-ink hover:bg-graphite-100/50 transition-all"
            >
              <span>View Demo Preview</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((item) => (
            <div
              key={item.id}
              onClick={() => router.push(`/app/reports/${item.id}`)}
              className="group flex flex-col justify-between gap-4 rounded-[16px] border border-graphite-100 bg-white p-4 transition-all hover:border-ink/20 hover:shadow-sm cursor-pointer sm:flex-row sm:items-center"
            >
              {/* URL & Meta */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Globe className="size-3.5 text-violet shrink-0" />
                  <span className="font-mono text-sm font-semibold text-ink truncate">
                    {item.targetUrl}
                  </span>
                  <span className="rounded-full bg-[#f4f4f6] border border-graphite-100 px-2 py-0.5 text-[10px] font-semibold text-graphite-800 uppercase">
                    {item.mode}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-graphite-800">
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </span>
                  <span>•</span>
                  <span>{item.pagesChecked} pages</span>

                  {item.txHash && (
                    <>
                      <span>•</span>
                      <a
                        href={item.celoscanUrl || `https://celoscan.io/tx/${item.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-violet hover:underline"
                      >
                        <span>{item.txHash.slice(0, 8)}...</span>
                        <ExternalLink className="size-2.5" />
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Findings Summary Pills */}
              <div className="flex items-center gap-2 text-xs">
                {item.issuesCount.critical > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-bold text-rose-600">
                    <ShieldAlert className="size-3" />
                    <span>{item.issuesCount.critical} Crit</span>
                  </span>
                )}
                {item.issuesCount.high > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                    <AlertTriangle className="size-3" />
                    <span>{item.issuesCount.high} High</span>
                  </span>
                )}
                {item.issuesCount.critical === 0 && item.issuesCount.high === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 className="size-3" />
                    <span>Clean</span>
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-graphite-100 dark:border-graphite-800 sm:border-t-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/app/audit?target=${encodeURIComponent(item.targetUrl)}`);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-3 py-1.5 text-xs font-semibold text-graphite-800 dark:text-graphite-200 hover:bg-[#f4f4f6] dark:hover:bg-[#20212b] hover:text-ink dark:hover:text-white transition-colors shadow-sm cursor-pointer"
                  title="Deploy fixes and re-audit on Celo Mainnet ($0.25)"
                >
                  <RotateCcw className="size-3.5 text-violet" />
                  <span className="hidden sm:inline">Re-audit ($0.25)</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(item.id, e)}
                  className="rounded-[10px] border border-graphite-100 dark:border-graphite-800 p-2 text-graphite-800 dark:text-graphite-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900 transition-colors cursor-pointer"
                  title="Delete report"
                >
                  <Trash2 className="size-3.5" />
                </button>
                <span className="inline-flex items-center gap-1 rounded-[48px] bg-[#f4f4f6] dark:bg-[#20212b] border border-graphite-100 dark:border-graphite-800 px-3.5 py-1.5 text-xs font-semibold text-ink dark:text-white group-hover:bg-ink group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-ink transition-colors cursor-pointer">
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
