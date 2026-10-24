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

  useEffect(() => {
    // Read local reports
    try {
      const stored = localStorage.getItem('crawlpay_reports');
      if (stored) {
        setReports(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse saved reports:', e);
    }

    // Check connected wallet
    const ethereum = (window as unknown as { ethereum?: any })?.ethereum;
    if (ethereum) {
      ethereum
        .request({ method: 'eth_accounts' })
        .then((accs: string[]) => {
          if (accs && accs[0]) setActiveWallet(accs[0]);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Audit Reports History
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {activeWallet
              ? `Displaying audits associated with ${activeWallet.slice(0, 6)}...${activeWallet.slice(-4)}`
              : 'Audit history for this browser session and connected wallet.'}
          </p>
        </div>

        <Link
          href="/app/audit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
        >
          <Search className="size-3.5" />
          <span>New Audit</span>
        </Link>
      </div>

      {/* Filter and Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Filter reports by URL..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'} saved
        </span>
      </div>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center bg-card/40">
          <div className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-4">
            <FileText className="size-6" />
          </div>
          <h3 className="font-display text-base font-semibold text-foreground">No audit reports found</h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {searchFilter
              ? 'No audits matched your search criteria.'
              : 'You have not run any audits from this wallet yet. Start your first audit now!'}
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/app/audit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <span>Run an Audit</span>
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/example"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent"
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
              className="group flex flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-accent/30 cursor-pointer sm:flex-row sm:items-center"
            >
              {/* URL & Meta */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Globe className="size-3.5 text-primary shrink-0" />
                  <span className="font-mono text-sm font-semibold text-foreground truncate">
                    {item.targetUrl}
                  </span>
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase">
                    {item.mode}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
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
                  <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                    <ShieldAlert className="size-3" />
                    <span>{item.issuesCount.critical} Crit</span>
                  </span>
                )}
                {item.issuesCount.high > 0 && (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-500">
                    <AlertTriangle className="size-3" />
                    <span>{item.issuesCount.high} High</span>
                  </span>
                )}
                {item.issuesCount.critical === 0 && item.issuesCount.high === 0 && (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
                    <CheckCircle2 className="size-3" />
                    <span>Clean</span>
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-border/60 sm:border-t-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/app/audit?target=${encodeURIComponent(item.targetUrl)}`);
                  }}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  title="Re-run audit"
                >
                  <RotateCcw className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDelete(item.id, e)}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Delete report"
                >
                  <Trash2 className="size-3.5" />
                </button>
                <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
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
