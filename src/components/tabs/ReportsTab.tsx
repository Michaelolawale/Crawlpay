'use client';

import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { FullAuditReport } from '@/types/audit';

export interface SavedReportItem {
  id: string;
  date: string;
  targetUrl: string;
  mode: 'quick' | 'full';
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

interface ReportsTabProps {
  onRecheck: (url: string, mode: 'quick' | 'full') => void;
  onViewReport: (report: FullAuditReport) => void;
}

export function ReportsTab({ onRecheck, onViewReport }: ReportsTabProps) {
  const [reports, setReports] = useState<SavedReportItem[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('crawlpay_reports');
      if (stored) {
        setReports(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to parse saved reports:', e);
    }
  }, []);

  const handleDelete = (id: string) => {
    const updated = reports.filter((r) => r.id !== id);
    setReports(updated);
    localStorage.setItem('crawlpay_reports', JSON.stringify(updated));
  };

  const clearAll = () => {
    if (confirm('Clear all audit reports from local storage?')) {
      setReports([]);
      localStorage.removeItem('crawlpay_reports');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Audit Reports
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Past audits for your session. Recheck any site with a single click.
          </p>
        </div>

        {reports.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
          >
            <Trash2 className="size-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center">
          <FileText className="mx-auto size-10 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-semibold text-foreground">No Audits Found Yet</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            Run an audit from the home tab to generate your first technical SEO inspection report.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Target Website</th>
                  <th className="py-3 px-4">Depth</th>
                  <th className="py-3 px-4">Status & Findings</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((item) => {
                  const hasCritical = item.issuesCount.critical > 0;
                  const hasHigh = item.issuesCount.high > 0;
                  const isClean = item.issuesCount.total === 0;

                  return (
                    <tr key={item.id} className="hover:bg-accent/30 transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-muted-foreground/60" />
                          <span>{new Date(item.date).toLocaleDateString()}</span>
                          <span className="text-[10px] text-muted-foreground/60">
                            {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* Site */}
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <a
                          href={item.targetUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
                        >
                          <span className="truncate max-w-[220px]">{item.targetUrl}</span>
                          <ExternalLink className="size-3 shrink-0" />
                        </a>
                      </td>

                      {/* Depth */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="rounded bg-secondary border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {item.mode === 'quick' ? 'Quick (1 page)' : `Full (${item.pagesChecked} pages)`}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isClean ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                            <CheckCircle2 className="size-3" />
                            Clean (0 Issues)
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {hasCritical && (
                              <span className="inline-flex items-center gap-1 rounded bg-destructive/15 border border-destructive/30 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
                                <ShieldAlert className="size-3" />
                                {item.issuesCount.critical} Critical
                              </span>
                            )}
                            {hasHigh && (
                              <span className="inline-flex items-center gap-1 rounded bg-orange-500/15 border border-orange-500/30 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400">
                                <AlertTriangle className="size-3" />
                                {item.issuesCount.high} High
                              </span>
                            )}
                            <span className="text-muted-foreground text-[11px]">
                              ({item.issuesCount.total} total)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewReport(item.reportData)}
                            className="inline-flex items-center gap-1 rounded border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                            title="View audit details"
                          >
                            <Eye className="size-3.5 text-primary" />
                            <span>View</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onRecheck(item.targetUrl, item.mode)}
                            className="inline-flex items-center gap-1 rounded bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                            title="Re-run audit on this site"
                          >
                            <RotateCcw className="size-3.5" />
                            <span>Recheck</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete report"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
