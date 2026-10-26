'use client';

import React, { useState } from 'react';
import {
  FlaskConical,
  Zap,
  Layers,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { CheckEngineView } from '@/components/CheckEngineView';
import { FullAuditReport } from '@/types/audit';
import { getAdminToken } from '@/utils/adminClient';

export default function AdminSandboxPage() {
  const [targetUrl, setTargetUrl] = useState('');
  const [mode, setMode] = useState<'quick' | 'full'>('quick');
  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [report, setReport] = useState<FullAuditReport | null>(null);
  const [jobInfo, setJobInfo] = useState<{ jobId: string; is_test: boolean } | null>(null);

  const handleRunSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;

    setRunning(true);
    setErrorMsg(null);
    setReport(null);
    setJobInfo(null);

    try {
      const authKey = getAdminToken();
      const res = await fetch('/api/admin/sandbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authKey}`,
        },
        body: JSON.stringify({
          url: targetUrl.trim(),
          mode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sandbox audit failed.');
      }

      setReport(data.report);
      setJobInfo({ jobId: data.jobId, is_test: data.is_test });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Sandbox execution error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      <div className="border-b border-graphite-100 dark:border-graphite-800 pb-6">
        <div className="inline-flex items-center gap-1.5 rounded-[48px] bg-violet/10 px-3 py-1 text-xs font-semibold text-violet mb-2">
          <FlaskConical className="size-3.5" />
          <span>Internal Developer Sandbox Only</span>
        </div>
        <h1 className="font-sans text-2xl font-bold tracking-tight text-ink dark:text-white sm:text-3xl">
          Isolated Audit Sandbox
        </h1>
        <p className="mt-1 text-sm text-graphite-800 dark:text-graphite-400 font-normal">
          Execute full crawler audits without on-chain micro-payments. Server-side enforced via <code className="font-mono bg-[#f4f4f6] dark:bg-[#20212b] px-1.5 py-0.5 rounded text-ink dark:text-white">ENABLE_SANDBOX=true</code> and admin session. All executions are strictly tagged <code className="font-mono bg-[#f4f4f6] dark:bg-[#20212b] px-1.5 py-0.5 rounded text-violet font-semibold">is_test = true</code> and quarantined from public metrics and feeds.
        </p>
      </div>

      {/* Sandbox Form */}
      <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleRunSandbox} className="space-y-6">
          <div>
            <label className="block text-[12px] font-mono uppercase tracking-wider text-graphite-600 dark:text-graphite-400 mb-2 font-medium">
              Test Target URL
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Globe className="size-4 text-graphite-600 dark:text-graphite-400" />
              </div>
              <input
                type="text"
                placeholder="https://example.com"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full rounded-[32px] border border-graphite-100 dark:border-graphite-700 bg-[#f4f4f6] dark:bg-[#20212b] py-3 pl-10 pr-4 text-sm font-mono text-ink dark:text-white focus:border-ink dark:focus:border-white focus:bg-white dark:focus:bg-[#1a1b22] focus:outline-none focus:ring-1 focus:ring-ink dark:focus:ring-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-mono uppercase tracking-wider text-graphite-600 dark:text-graphite-400 mb-2 font-medium">
              Crawl Depth
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                onClick={() => setMode('quick')}
                className={`cursor-pointer rounded-[16px] p-4 transition-all ${
                  mode === 'quick'
                    ? 'border-2 border-ink dark:border-white bg-white dark:bg-[#20212b] shadow-sm'
                    : 'border border-graphite-100 dark:border-graphite-700 bg-white/70 dark:bg-[#1a1b22]/70 hover:bg-white dark:hover:bg-[#20212b]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className={`size-4 ${mode === 'quick' ? 'text-violet' : 'text-graphite-600 dark:text-graphite-400'}`} />
                  <span className="font-sans font-[600] text-[15px] text-ink dark:text-white">Quick Audit (1 Page)</span>
                </div>
                <p className="mt-1 text-xs text-graphite-800 dark:text-graphite-400">Free sandbox simulation</p>
              </div>

              <div
                onClick={() => setMode('full')}
                className={`cursor-pointer rounded-[16px] p-4 transition-all ${
                  mode === 'full'
                    ? 'border-2 border-ink dark:border-white bg-white dark:bg-[#20212b] shadow-sm'
                    : 'border border-graphite-100 dark:border-graphite-700 bg-white/70 dark:bg-[#1a1b22]/70 hover:bg-white dark:hover:bg-[#20212b]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className={`size-4 ${mode === 'full' ? 'text-violet' : 'text-graphite-600 dark:text-graphite-400'}`} />
                  <span className="font-sans font-[600] text-[15px] text-ink dark:text-white">Full Deep Crawl (Up to 50 Pages)</span>
                </div>
                <p className="mt-1 text-xs text-graphite-800 dark:text-graphite-400">Free sandbox simulation</p>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-[16px] border border-rose-200 dark:border-rose-800/80 bg-rose-50 dark:bg-rose-950/40 p-3.5 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={running || !targetUrl.trim()}
            className="w-full inline-flex h-[46px] items-center justify-center gap-2 rounded-[48px] bg-ink dark:bg-white px-6 text-sm font-semibold text-white dark:text-ink hover:opacity-90 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {running ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
            <span>{running ? 'Running Sandbox Pipeline...' : 'Run Sandbox Audit (is_test=true)'}</span>
          </button>
        </form>
      </div>

      {/* Rendered Sandbox Report */}
      {jobInfo && (
        <div className="rounded-[16px] border border-violet/20 bg-lavender-tint/40 dark:bg-violet/10 p-4 text-xs flex items-center justify-between text-ink dark:text-white shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Job created: <strong className="font-mono text-ink dark:text-white">{jobInfo.jobId}</strong></span>
          </div>
          <span className="font-mono font-bold bg-white dark:bg-[#16171d] text-violet border border-violet/20 px-2.5 py-0.5 rounded-[48px] text-[11px]">
            is_test: true (Quarantined)
          </span>
        </div>
      )}

      {report && (
        <div className="space-y-4 pt-6 border-t border-graphite-100 dark:border-graphite-800">
          <h2 className="font-sans text-xl font-bold text-ink dark:text-white">Sandbox Audit Output</h2>
          <CheckEngineView report={report} />
        </div>
      )}
    </div>
  );
}
