'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Search,
  Globe,
  Calendar,
  Eye,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { getAdminToken } from '../../../utils/adminClient';

interface AdminReportSummary {
  id: string;
  targetUrl: string;
  wallet?: string;
  mode: 'quick' | 'full';
  pagesChecked: number;
  createdAt: string;
  score: number | null;
  technicalScore: number | null;
  aeoScore: number | null;
  geoScore: number | null;
  issuesCount: {
    critical: number;
    high: number;
  };
}

export default function AdminReportsArchivePage() {
  const [reports, setReports] = useState<AdminReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [includeTest, setIncludeTest] = useState(false);

  const fetchReports = async () => {
    setRefreshing(true);
    try {
      const authKey = getAdminToken();
      const res = await fetch(`/api/admin/reports?includeTest=${includeTest ? 'true' : 'false'}`, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${authKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      console.warn('Reports archive fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 12000);
    return () => clearInterval(interval);
  }, [includeTest]);

  const filteredReports = reports.filter((r) =>
    r.targetUrl.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (r.wallet && r.wallet.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-graphite-100 dark:border-graphite-800 pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white sm:text-3xl">
            Audit Reports Archive
          </h1>
          <p className="mt-1 text-sm text-graphite-800 dark:text-graphite-400">
            Inspect generated technical SEO, AEO, and GEO crawl reports across all user sessions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Production vs Sandbox Toggle */}
          <div className="flex items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setIncludeTest(false)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                !includeTest
                  ? 'bg-ink text-white dark:bg-white dark:text-ink shadow-xs'
                  : 'text-graphite-800 dark:text-graphite-400 hover:text-ink dark:hover:text-white'
              }`}
            >
              Production
            </button>
            <button
              type="button"
              onClick={() => setIncludeTest(true)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                includeTest
                  ? 'bg-violet text-white shadow-xs'
                  : 'text-graphite-800 dark:text-graphite-400 hover:text-ink dark:hover:text-white'
              }`}
            >
              Sandbox
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`inline-flex items-center gap-1.5 rounded-[48px] border px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              privacyMode
                ? 'bg-violet/10 border-violet/30 text-violet'
                : 'border-graphite-200 dark:border-graphite-800 bg-white dark:bg-[#16171d] text-ink dark:text-white hover:bg-graphite-100 dark:hover:bg-[#20212b]'
            }`}
          >
            <Shield className="size-3.5" />
            <span>{privacyMode ? 'Privacy: Redacted' : 'Privacy: Visible'}</span>
          </button>

          <button
            type="button"
            onClick={fetchReports}
            disabled={refreshing}
            className="inline-flex h-[38px] items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-4 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#20212b] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin text-violet' : 'text-graphite-800 dark:text-graphite-400'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-graphite-400" />
          <input
            type="text"
            placeholder="Search reports by domain or wallet..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full rounded-[48px] border border-graphite-200 dark:border-graphite-800 bg-white dark:bg-[#16171d] py-2 pl-10 pr-4 text-xs text-ink dark:text-white placeholder:text-graphite-400 focus:outline-none focus:ring-1 focus:ring-ink dark:focus:ring-white"
          />
        </div>
        <span className="text-xs font-mono text-graphite-600 dark:text-graphite-400">
          {filteredReports.length} of {reports.length} Reports Evaluated
        </span>
      </div>

      {/* Reports Table */}
      <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] shadow-sm overflow-hidden">
        {loading && reports.length === 0 ? (
          <div className="py-12 text-center text-xs text-graphite-600 dark:text-graphite-400">
            <RefreshCw className="size-5 mx-auto mb-2 animate-spin text-violet" />
            <p>Loading audit reports archive...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-12 text-center text-xs text-graphite-600 dark:text-graphite-400">
            <FileText className="size-6 mx-auto mb-2 text-graphite-400 stroke-1" />
            <p className="font-semibold text-ink dark:text-white text-sm">No reports found</p>
            <p className="mt-1">Audits run by users or tests will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-[#f4f4f6]/80 dark:bg-[#1a1b22] text-graphite-600 dark:text-graphite-400 font-mono text-[10px] uppercase tracking-wider border-b border-graphite-100 dark:border-graphite-800">
                <tr>
                  <th scope="col" className="py-3 px-4 font-semibold w-48">Audit Target</th>
                  <th scope="col" className="py-3 px-3 font-semibold w-24">Type</th>
                  <th scope="col" className="py-3 px-3 font-semibold w-32">Wallet</th>
                  <th scope="col" className="py-3 px-3 font-semibold w-20">Health</th>
                  <th scope="col" className="py-3 px-3 font-semibold w-36">Scores (SEO/AEO/GEO)</th>
                  <th scope="col" className="py-3 px-3 font-semibold">Date</th>
                  <th scope="col" className="py-3 px-4 font-semibold text-right w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-graphite-100 dark:divide-graphite-800">
                {filteredReports.map((r) => {
                  const displayUrl = privacyMode
                    ? r.targetUrl.replace(/^https?:\/\//, '').replace(/(.{3}).*(.{4})/, '$1***$2')
                    : r.targetUrl.replace(/^https?:\/\//, '');

                  return (
                    <tr key={r.id} className="hover:bg-[#fafafb] dark:hover:bg-[#1a1b22]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-ink dark:text-white text-[13px]">
                        <div className="flex items-center gap-1.5 truncate max-w-[220px]">
                          <Globe className="size-3.5 text-violet shrink-0" />
                          <span className="truncate">{displayUrl}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="rounded-full bg-[#f4f4f6] dark:bg-[#1a1b22] border border-graphite-200 dark:border-graphite-800 px-2 py-0.5 text-[10px] font-mono font-bold uppercase text-graphite-700 dark:text-graphite-300">
                          {r.mode === 'full' ? `Deep (${r.pagesChecked}p)` : 'Quick (1p)'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono text-[11px] text-graphite-600 dark:text-graphite-400">
                        {r.wallet
                          ? privacyMode
                            ? '0x••••...••••'
                            : `${r.wallet.slice(0, 6)}...${r.wallet.slice(-4)}`
                          : 'Anonymous'}
                      </td>

                      <td className="py-3.5 px-3">
                        {r.score !== null ? (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-mono font-bold ${
                            r.score >= 80
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : r.score >= 60
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}>
                            <span>{r.score}%</span>
                          </span>
                        ) : (
                          <span className="font-mono text-graphite-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-[11px]">
                        <span className="text-blue-500 font-semibold">{r.technicalScore ?? '—'}</span>
                        <span className="text-graphite-400"> / </span>
                        <span className="text-violet font-semibold">{r.aeoScore ?? '—'}</span>
                        <span className="text-graphite-400"> / </span>
                        <span className="text-emerald-500 font-semibold">{r.geoScore ?? '—'}</span>
                      </td>

                      <td className="py-3.5 px-3 text-graphite-600 dark:text-graphite-400 whitespace-nowrap font-mono text-[11px]">
                        {new Date(r.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/admin/reports/${r.id}?from=reports`}
                          className="inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-3 py-1 text-[11px] font-semibold hover:opacity-90 transition-opacity shadow-xs"
                        >
                          <Eye className="size-3" />
                          <span>Inspect</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

