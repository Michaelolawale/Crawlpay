'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ListOrdered,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  FlaskConical,
  Globe,
} from 'lucide-react';
import { JobRecord } from '@/services/db';

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [rerunningId, setRerunningId] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const authKey = sessionStorage.getItem('crawlpay_admin_auth') || '';
      const res = await fetch('/api/admin/jobs', {
        headers: { Authorization: `Bearer ${authKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (e) {
      console.warn('Jobs fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRerun = async (jobId: string) => {
    setRerunningId(jobId);
    try {
      const authKey = sessionStorage.getItem('crawlpay_admin_auth') || '';
      const res = await fetch('/api/admin/jobs/rerun', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authKey}`,
        },
        body: JSON.stringify({ jobId }),
      });
      if (res.ok) {
        await fetchJobs();
      } else {
        const err = await res.json();
        alert(`Rerun failed: ${err.error}`);
      }
    } catch (e: any) {
      alert(`Rerun error: ${e?.message}`);
    } finally {
      setRerunningId(null);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-graphite-100 dark:border-graphite-800 pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white sm:text-3xl">
            Audit Jobs Queue
          </h1>
          <p className="mt-1 text-sm text-graphite-800 dark:text-graphite-400">
            Monitor crawler pipelines, execution statuses, duration benchmarks, and trigger reruns.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchJobs}
          disabled={loading}
          className="inline-flex h-[40px] items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-4 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#20212b] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin text-violet' : 'text-graphite-800 dark:text-graphite-400'}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Jobs Table */}
      <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] font-bold text-graphite-800 dark:text-graphite-300">
              <tr>
                <th className="px-4 py-3">Job ID</th>
                <th className="px-4 py-3">Target URL</th>
                <th className="px-4 py-3">Depth</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-100 dark:divide-graphite-800">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-graphite-800 dark:text-graphite-400">
                    No jobs recorded in database.
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-[#f4f4f6]/50 dark:hover:bg-[#20212b]/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-graphite-800 dark:text-graphite-400 whitespace-nowrap">
                      {j.id.slice(0, 14)}...
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-ink dark:text-white max-w-[200px] truncate">
                      {j.url}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#f4f4f6] dark:bg-[#20212b] border border-graphite-100 dark:border-graphite-700 px-2.5 py-0.5 text-[10px] font-bold text-graphite-800 dark:text-graphite-300 uppercase">
                        {j.depth}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {j.is_test ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet/10 border border-violet/20 px-2.5 py-0.5 text-[10px] font-bold text-violet">
                          <FlaskConical className="size-2.5" />
                          <span>Sandbox Test</span>
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          Production
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-graphite-800 dark:text-graphite-400">
                      {j.duration_ms ? `${(j.duration_ms / 1000).toFixed(2)}s` : '—'}
                    </td>
                    <td className="px-4 py-3">
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:text-rose-400">
                          <AlertCircle className="size-3 text-rose-600 dark:text-rose-400" />
                          <span>Failed: {j.error?.slice(0, 20)}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRerun(j.id)}
                        disabled={rerunningId === j.id}
                        className="inline-flex items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-3 py-1 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#20212b] shadow-sm disabled:opacity-50 transition-colors cursor-pointer"
                        title="Rerun this crawl"
                      >
                        <RotateCcw className={`size-3 ${rerunningId === j.id ? 'animate-spin text-violet' : ''}`} />
                        <span>Rerun</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
