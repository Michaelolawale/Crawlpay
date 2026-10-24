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
      const authKey = sessionStorage.getItem('crawlpay_admin_auth') || 'crawlpay-admin-2025';
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
      <div className="border-b border-border pb-6">
        <div className="inline-flex items-center gap-1.5 rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-400 mb-2">
          <FlaskConical className="size-3.5" />
          <span>Internal Developer Sandbox Only</span>
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Isolated Audit Sandbox
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Execute full crawler audits without on-chain micro-payments. Server-side enforced via <code className="font-mono text-primary">ENABLE_SANDBOX=true</code> and admin session. All executions are strictly tagged <code className="font-mono text-purple-400">is_test = true</code> and quarantined from public metrics and feeds.
        </p>
      </div>

      {/* Sandbox Form */}
      <div className="rounded-2xl border border-purple-500/20 bg-card/60 p-6 sm:p-8 backdrop-blur-sm">
        <form onSubmit={handleRunSandbox} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Test Target URL
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Globe className="size-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="https://example.com"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm font-mono text-foreground focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Crawl Depth
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div
                onClick={() => setMode('quick')}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  mode === 'quick'
                    ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500'
                    : 'border-border bg-background'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className={`size-4 ${mode === 'quick' ? 'text-purple-400' : 'text-muted-foreground'}`} />
                  <span className="font-semibold text-sm text-foreground">Quick Audit (1 Page)</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Free sandbox simulation</p>
              </div>

              <div
                onClick={() => setMode('full')}
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  mode === 'full'
                    ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500'
                    : 'border-border bg-background'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className={`size-4 ${mode === 'full' ? 'text-purple-400' : 'text-muted-foreground'}`} />
                  <span className="font-semibold text-sm text-foreground">Full Deep Crawl (Up to 50 Pages)</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Free sandbox simulation</p>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={running || !targetUrl.trim()}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white hover:bg-purple-700 transition-all shadow-md disabled:opacity-50"
          >
            {running ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
            <span>{running ? 'Running Sandbox Pipeline...' : 'Run Sandbox Audit (is_test=true)'}</span>
          </button>
        </form>
      </div>

      {/* Rendered Sandbox Report */}
      {jobInfo && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 text-xs flex items-center justify-between text-purple-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-purple-400" />
            <span>Job created: <strong className="font-mono">{jobInfo.jobId}</strong></span>
          </div>
          <span className="font-mono font-bold bg-purple-500/20 px-2 py-0.5 rounded text-[10px]">
            is_test: true (Quarantined from metrics)
          </span>
        </div>
      )}

      {report && (
        <div className="space-y-4 pt-4 border-t border-border">
          <h2 className="font-display text-lg font-bold text-foreground">Sandbox Audit Output</h2>
          <CheckEngineView report={report} />
        </div>
      )}
    </div>
  );
}
