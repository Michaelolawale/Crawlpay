'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  FlaskConical,
  Globe,
  Play,
  FileText,
  Search,
  Filter,
  Radio,
  Zap,
} from 'lucide-react';
import { JobRecord } from '@/services/db';
import { getAdminToken } from '@/utils/adminClient';

function formatRelativeTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    const now = Date.now();
    const diffSec = Math.floor((now - d.getTime()) / 1000);
    if (diffSec < 5) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

function isRecentJob(isoString: string): boolean {
  try {
    const d = new Date(isoString);
    const diffMs = Date.now() - d.getTime();
    return diffMs < 30 * 60 * 1000; // Within 30 minutes
  } catch {
    return false;
  }
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rerunningId, setRerunningId] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick live trigger
  const [quickUrl, setQuickUrl] = useState('');
  const [quickMode, setQuickMode] = useState<'quick' | 'full'>('quick');
  const [launchingAudit, setLaunchingAudit] = useState(false);

  // Filter
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'recent' | 'production' | 'test' | 'failed'>('all');

  const fetchJobs = useCallback(async (isManual: boolean = false) => {
    if (isManual) setRefreshing(true);
    try {
      const authKey = getAdminToken();
      if (!authKey) {
        setErrorMessage('Admin credentials not found. Please log in through the operator portal.');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const res = await fetch('/api/admin/jobs', {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${authKey}`,
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
        },
      });

      if (res.ok) {
        const data = await res.json();
        const incomingJobs: JobRecord[] = Array.isArray(data.jobs) ? data.jobs : [];
        // Ensure strictly sorted descending by start time
        incomingJobs.sort(
          (a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
        );
        setJobs(incomingJobs);
        setLastSyncTime(new Date());
        setErrorMessage(null);
      } else if (res.status === 401) {
        setErrorMessage('Session expired or unauthorized (401). Please re-enter your admin passphrase.');
      } else {
        setErrorMessage(`Server responded with status ${res.status}`);
      }
    } catch (e: any) {
      console.warn('Jobs fetch error:', e);
      setErrorMessage(e?.message || 'Failed to connect to backend jobs service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => {
      fetchJobs();
    }, 6000); // 6s fast live polling for active audits
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleRerun = async (jobId: string) => {
    setRerunningId(jobId);
    try {
      const authKey = getAdminToken();
      const res = await fetch('/api/admin/jobs/rerun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authKey}`,
        },
        body: JSON.stringify({ jobId }),
      });
      if (res.ok) {
        await fetchJobs(true);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Rerun failed: ${err.error || 'Server error'}`);
      }
    } catch (e: any) {
      alert(`Rerun error: ${e?.message}`);
    } finally {
      setRerunningId(null);
    }
  };

  const handleLaunchQuickAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = quickUrl.trim();
    if (!cleanUrl) return;

    setLaunchingAudit(true);
    setErrorMessage(null);

    try {
      const authKey = getAdminToken();
      const res = await fetch('/api/admin/sandbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authKey}`,
        },
        body: JSON.stringify({
          url: cleanUrl,
          mode: quickMode,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setQuickUrl('');
        await fetchJobs(true);
      } else {
        setErrorMessage(`Audit trigger failed: ${data.error || 'Check server logs'}`);
      }
    } catch (err: any) {
      setErrorMessage(`Audit error: ${err?.message}`);
    } finally {
      setLaunchingAudit(false);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      // Search text
      if (searchFilter) {
        const query = searchFilter.toLowerCase();
        const matchesUrl = j.url.toLowerCase().includes(query);
        const matchesId = j.id.toLowerCase().includes(query);
        const matchesWallet = (j.wallet || '').toLowerCase().includes(query);
        if (!matchesUrl && !matchesId && !matchesWallet) return false;
      }

      // Filter tabs
      if (typeFilter === 'recent') return isRecentJob(j.started_at);
      if (typeFilter === 'production') return !j.is_test;
      if (typeFilter === 'test') return j.is_test;
      if (typeFilter === 'failed') return j.status === 'failed';

      return true;
    });
  }, [jobs, searchFilter, typeFilter]);

  const recentCount = useMemo(() => jobs.filter((j) => isRecentJob(j.started_at)).length, [jobs]);
  const runningCount = useMemo(() => jobs.filter((j) => j.status === 'running').length, [jobs]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-graphite-100 dark:border-graphite-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white sm:text-3xl">
              Audit Jobs Queue
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed
            </span>
          </div>
          <p className="mt-1 text-sm text-graphite-800 dark:text-graphite-400">
            Real-time crawler pipelines, execution statuses, benchmarks, and direct report links.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lastSyncTime && (
            <span className="hidden sm:inline-block text-[11px] font-mono text-graphite-800 dark:text-graphite-400">
              Updated {lastSyncTime.toLocaleTimeString()}
            </span>
          )}

          <button
            type="button"
            onClick={() => fetchJobs(true)}
            disabled={loading || refreshing}
            className="inline-flex h-[38px] items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-4 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#20212b] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 ${
                loading || refreshing ? 'animate-spin text-violet' : 'text-graphite-800 dark:text-graphite-400'
              }`}
            />
            <span>{refreshing ? 'Updating...' : 'Refresh Queue'}</span>
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="rounded-[16px] border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-3 shadow-sm">
          <AlertCircle className="size-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Sync Warning: </span>
            {errorMessage}
          </div>
          <button
            onClick={() => fetchJobs(true)}
            className="text-xs font-semibold underline text-rose-700 dark:text-rose-300 hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Quick Trigger Tool bar */}
      <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-4 sm:p-5 shadow-sm">
        <form onSubmit={handleLaunchQuickAudit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink dark:text-white shrink-0">
            <Zap className="size-4 text-violet" />
            <span>Trigger Live Audit:</span>
          </div>

          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Globe className="size-3.5 text-graphite-400" />
            </div>
            <input
              type="text"
              placeholder="https://example.com"
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
              className="w-full rounded-[32px] border border-graphite-100 dark:border-graphite-700 bg-[#f4f4f6] dark:bg-[#20212b] py-2 pl-9 pr-3 text-xs font-mono text-ink dark:text-white focus:border-violet focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={quickMode}
              onChange={(e) => setQuickMode(e.target.value as 'quick' | 'full')}
              className="rounded-[32px] border border-graphite-100 dark:border-graphite-700 bg-[#f4f4f6] dark:bg-[#20212b] py-2 px-3 text-xs font-medium text-ink dark:text-white"
            >
              <option value="quick">Quick (1 Page)</option>
              <option value="full">Full (Deep Crawl)</option>
            </select>

            <button
              type="submit"
              disabled={launchingAudit || !quickUrl.trim()}
              className="inline-flex h-[36px] items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white px-4 text-xs font-semibold text-white dark:text-ink hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shrink-0"
            >
              <Play className={`size-3 ${launchingAudit ? 'animate-spin' : ''}`} />
              <span>{launchingAudit ? 'Crawling...' : 'Run Audit'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setTypeFilter('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-ink text-white dark:bg-white dark:text-ink'
                : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-800 dark:text-graphite-300 hover:bg-graphite-200 dark:hover:bg-graphite-700'
            }`}
          >
            All Jobs ({jobs.length})
          </button>

          <button
            onClick={() => setTypeFilter('recent')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1 ${
              typeFilter === 'recent'
                ? 'bg-ink text-white dark:bg-white dark:text-ink'
                : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-800 dark:text-graphite-300 hover:bg-graphite-200 dark:hover:bg-graphite-700'
            }`}
          >
            <Clock className="size-3" />
            <span>Recent ({recentCount})</span>
          </button>

          <button
            onClick={() => setTypeFilter('production')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              typeFilter === 'production'
                ? 'bg-ink text-white dark:bg-white dark:text-ink'
                : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-800 dark:text-graphite-300 hover:bg-graphite-200 dark:hover:bg-graphite-700'
            }`}
          >
            Production ({jobs.filter((j) => !j.is_test).length})
          </button>

          <button
            onClick={() => setTypeFilter('test')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              typeFilter === 'test'
                ? 'bg-ink text-white dark:bg-white dark:text-ink'
                : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-800 dark:text-graphite-300 hover:bg-graphite-200 dark:hover:bg-graphite-700'
            }`}
          >
            Sandbox ({jobs.filter((j) => j.is_test).length})
          </button>

          {jobs.some((j) => j.status === 'failed') && (
            <button
              onClick={() => setTypeFilter('failed')}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer text-rose-600 dark:text-rose-400 ${
                typeFilter === 'failed'
                  ? 'bg-rose-600 text-white dark:bg-rose-600 dark:text-white'
                  : 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60'
              }`}
            >
              Failed ({jobs.filter((j) => j.status === 'failed').length})
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="size-3.5 text-graphite-400" />
          </div>
          <input
            type="text"
            placeholder="Search URL, ID, wallet..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full rounded-[32px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] py-1.5 pl-9 pr-3 text-xs text-ink dark:text-white placeholder:text-graphite-400 focus:outline-none focus:border-violet"
          />
        </div>
      </div>

      {/* Jobs Table */}
      <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] font-bold text-graphite-800 dark:text-graphite-300">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Started</th>
                <th className="px-4 py-3">Target URL</th>
                <th className="px-4 py-3">Job ID</th>
                <th className="px-4 py-3">Depth</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-100 dark:divide-graphite-800">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-graphite-800 dark:text-graphite-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock className="size-6 text-graphite-400 stroke-1" />
                      <p className="font-semibold text-ink dark:text-white">No audit jobs found.</p>
                      <p className="text-[11px] max-w-sm">
                        {searchFilter
                          ? 'No results match your active search filter.'
                          : 'Trigger an audit above or run a test from the sandbox to see live crawler jobs.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredJobs.map((j) => {
                  const recent = isRecentJob(j.started_at);
                  return (
                    <tr
                      key={j.id}
                      className={`hover:bg-[#f4f4f6]/60 dark:hover:bg-[#20212b]/60 transition-colors ${
                        recent ? 'bg-violet/[0.02] dark:bg-violet/[0.04]' : ''
                      }`}
                    >
                      {/* Started At Timestamp */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5" title={new Date(j.started_at).toLocaleString()}>
                          <span className="font-medium text-ink dark:text-white">
                            {formatRelativeTime(j.started_at)}
                          </span>
                          {recent && (
                            <span className="rounded-full bg-violet/10 text-violet border border-violet/20 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider">
                              New
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-graphite-400 font-mono">
                          {new Date(j.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Target URL */}
                      <td className="px-4 py-3 font-mono font-semibold text-ink dark:text-white max-w-[220px]">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={j.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="truncate hover:text-violet hover:underline flex items-center gap-1"
                          >
                            <span>{j.url.replace(/^https?:\/\//, '')}</span>
                            <ExternalLink className="size-2.5 opacity-60 shrink-0" />
                          </a>
                        </div>
                        {j.wallet && (
                          <div className="text-[10px] text-graphite-400 font-mono truncate">
                            by {j.wallet.slice(0, 6)}...{j.wallet.slice(-4)}
                          </div>
                        )}
                      </td>

                      {/* Job ID */}
                      <td className="px-4 py-3 font-mono text-graphite-800 dark:text-graphite-400 whitespace-nowrap text-[11px]">
                        {j.id.slice(0, 16)}...
                      </td>

                      {/* Depth */}
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-[#f4f4f6] dark:bg-[#20212b] border border-graphite-100 dark:border-graphite-700 px-2.5 py-0.5 text-[10px] font-bold text-graphite-800 dark:text-graphite-300 uppercase">
                          {j.depth}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {j.is_test ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet/10 border border-violet/20 px-2.5 py-0.5 text-[10px] font-bold text-violet">
                            <FlaskConical className="size-2.5" />
                            <span>Sandbox</span>
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            Production
                          </span>
                        )}
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 font-mono text-graphite-800 dark:text-graphite-400 whitespace-nowrap">
                        {j.duration_ms ? `${(j.duration_ms / 1000).toFixed(2)}s` : '—'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {j.status === 'done' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Done</span>
                          </span>
                        )}
                        {j.status === 'running' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-400 animate-pulse">
                            <RefreshCw className="size-3 animate-spin text-blue-600 dark:text-blue-400" />
                            <span>Running</span>
                          </span>
                        )}
                        {j.status === 'failed' && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:text-rose-400"
                            title={j.error || 'Execution failed'}
                          >
                            <AlertCircle className="size-3 text-rose-600 dark:text-rose-400" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          {j.report_id && (
                            <Link
                              href={`/app/reports/${j.report_id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-2.5 py-1 text-[11px] font-semibold text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#20212b] transition-colors shadow-sm"
                              title="Inspect Generated Report"
                            >
                              <FileText className="size-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Report</span>
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRerun(j.id)}
                            disabled={rerunningId === j.id}
                            className="inline-flex items-center gap-1 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-2.5 py-1 text-[11px] font-semibold text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#20212b] shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
                            title="Rerun this crawl"
                          >
                            <RotateCcw className={`size-3 ${rerunningId === j.id ? 'animate-spin text-violet' : ''}`} />
                            <span>Rerun</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
