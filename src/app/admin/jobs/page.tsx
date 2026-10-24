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
      const authKey = sessionStorage.getItem('crawlpay_admin_auth') || 'crawlpay-admin-2025';
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
  }, []);

  const handleRerun = async (jobId: string) => {
    setRerunningId(jobId);
    try {
      const authKey = sessionStorage.getItem('crawlpay_admin_auth') || 'crawlpay-admin-2025';
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Audit Jobs Queue
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor crawler pipelines, execution statuses, duration benchmarks, and trigger reruns.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchJobs}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors shadow-sm"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Jobs Table */}
      <div className="rounded-2xl border border-border bg-card/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
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
            <tbody className="divide-y divide-border/60">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No jobs recorded in database.
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                      {j.id.slice(0, 14)}...
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-foreground max-w-[200px] truncate">
                      {j.url}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                        {j.depth}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {j.is_test ? (
                        <span className="inline-flex items-center gap-1 rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                          <FlaskConical className="size-2.5" />
                          <span>Sandbox Test</span>
                        </span>
                      ) : (
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          Production
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {j.duration_ms ? `${(j.duration_ms / 1000).toFixed(2)}s` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {j.status === 'done' && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="size-3" />
                          <span>Done</span>
                        </span>
                      )}
                      {j.status === 'running' && (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400 animate-pulse">
                          <RefreshCw className="size-3 animate-spin" />
                          <span>Running</span>
                        </span>
                      )}
                      {j.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                          <AlertCircle className="size-3" />
                          <span>Failed: {j.error?.slice(0, 20)}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRerun(j.id)}
                        disabled={rerunningId === j.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-accent disabled:opacity-50"
                        title="Rerun this crawl"
                      >
                        <RotateCcw className={`size-3 ${rerunningId === j.id ? 'animate-spin' : ''}`} />
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
