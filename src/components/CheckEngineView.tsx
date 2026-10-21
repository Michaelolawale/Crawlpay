'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileCode,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Wrench,
  Globe,
  HelpCircle,
  ExternalLink,
  FileSpreadsheet,
} from 'lucide-react';
import { FindingGroup, Severity } from '../engine/types';
import { GscAnalysisResult } from '../utils/gscParser';

interface CheckEngineViewProps {
  groups: FindingGroup[];
  whatPassed: string;
  notChecked: string[];
  pagesChecked: number;
  targetUrl: string;
  detectedStack?: {
    cms?: string;
    seoPlugin?: string;
    framework?: string;
  };
  gscAnalysis?: GscAnalysisResult | null;
}

export function CheckEngineView({
  groups,
  whatPassed,
  notChecked,
  pagesChecked,
  targetUrl,
  detectedStack,
  gscAnalysis,
}: CheckEngineViewProps) {
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getSeverityBadge = (sev: Severity) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-destructive/15 px-2 py-0.5 text-[11px] font-semibold text-destructive border border-destructive/30">
            <ShieldAlert className="size-3" />
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-orange-500/15 px-2 py-0.5 text-[11px] font-semibold text-orange-400 border border-orange-500/30">
            <AlertTriangle className="size-3" />
            HIGH
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-500/30">
            <AlertTriangle className="size-3" />
            MEDIUM
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/30">
            <Info className="size-3" />
            LOW
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-0.5 text-[11px] font-semibold text-muted-foreground border border-border">
            <Info className="size-3" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2.5 py-1 text-primary font-medium">
            <Globe className="size-3.5" />
            <span>{pagesChecked} Page{pagesChecked > 1 ? 's' : ''} Checked</span>
          </span>

          <span className="inline-flex items-center gap-1 rounded-md bg-secondary border border-border px-2.5 py-1 text-muted-foreground font-medium">
            <Layers className="size-3.5 text-primary" />
            <span>
              Stack: {detectedStack?.cms || 'Custom HTML'}
              {detectedStack?.seoPlugin && detectedStack.seoPlugin !== 'None' ? ` (${detectedStack.seoPlugin})` : ''}
            </span>
          </span>

          <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 border border-primary/20 px-2.5 py-1 text-primary font-medium">
            <span>{groups.length} Issue Group{groups.length !== 1 ? 's' : ''}</span>
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowJson(!showJson)}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors"
        >
          <FileCode className="size-3.5 text-primary" />
          <span>{showJson ? 'Hide Agent JSON' : 'Export Agent JSON'}</span>
        </button>
      </div>

      {/* Raw Agent JSON Export */}
      {showJson && (
        <div className="relative rounded-lg border border-border bg-background p-4 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">Deterministic Agent FindingGroup Schema</span>
            <button
              onClick={() => handleCopy(JSON.stringify(groups, null, 2), 'raw-json')}
              className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {copiedKey === 'raw-json' ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
              <span>{copiedKey === 'raw-json' ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>
          <pre className="max-h-72 overflow-y-auto text-[11px] font-mono text-primary/90 bg-black/40 p-3 rounded">
            {JSON.stringify({ prioritizedGroups: groups, whatPassed, notChecked }, null, 2)}
          </pre>
        </div>
      )}

      {/* GSC "Crawled - currently not indexed" Cross-Reference */}
      {gscAnalysis && (
        <section className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-400">
            <FileSpreadsheet className="size-4" />
            <span>Google Search Console: Unindexed Pages Detected ({gscAnalysis.unindexedUrls.length})</span>
          </div>
          <p className="text-xs text-foreground/90 leading-relaxed">
            Google crawled these URLs but withheld indexation. CrawlPay cross-referenced them with the crawler to pinpoint root causes (e.g. duplicate body copy, missing headings, or low content depth):
          </p>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pt-1">
            {gscAnalysis.unindexedUrls.map((url, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 rounded border border-border bg-background/80 px-3 py-1.5 text-xs font-mono">
                <span className="truncate text-foreground/90">{url}</span>
                <span className="shrink-0 rounded bg-destructive/15 text-destructive px-1.5 py-0.5 text-[10px] font-sans font-semibold">
                  Crawled - not indexed
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Prioritized Issue Groups with Evidence */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            Root-Cause Finding Groups ({groups.length})
          </h3>
          <span className="text-[11px] text-muted-foreground">
            Ranked by deterministic priority formula: severity × log(1 + count) × (1 + importance/5)
          </span>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <CheckCircle2 className="mx-auto size-8 text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">Zero Technical Issues Detected</p>
            <p className="text-xs text-muted-foreground mt-1">
              All checked areas passed without errors or indexing blockers.
            </p>
          </div>
        ) : (
          groups.map((group, idx) => {
            const isExpanded = expandedKeys[group.rootCauseKey] ?? (idx < 3);
            const firstFinding = group.findings[0];

            return (
              <div
                key={group.rootCauseKey}
                className="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-all"
              >
                {/* Group Header */}
                <div
                  onClick={() => toggleExpand(group.rootCauseKey)}
                  className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4 hover:bg-accent/40 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-2.5 min-w-0">
                    {getSeverityBadge(group.severity)}
                    <span className="font-mono text-xs font-semibold text-foreground truncate">
                      {group.checkId}
                    </span>
                    <span className="rounded bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground font-medium">
                      {group.affectedCount} page{group.affectedCount > 1 ? 's' : ''} affected
                    </span>
                    <span className="text-[10px] text-muted-foreground/80 font-mono">
                      (Priority: {group.priority})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-[11px] font-mono truncate max-w-[200px] text-muted-foreground/70 hidden sm:inline">
                      {group.rootCauseKey}
                    </span>
                    {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-border bg-background/50 p-4 space-y-4">
                    {/* Stack Tailored Fix */}
                    {group.stackFix && (
                      <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
                          <Wrench className="size-3.5" />
                          <span>Stack-Tailored Fix ({detectedStack?.cms || 'Detected Stack'})</span>
                        </div>
                        <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                          {group.stackFix}
                        </p>
                      </div>
                    )}

                    {/* Evidence Card */}
                    {firstFinding && (
                      <div className="grid gap-3 sm:grid-cols-2 text-xs">
                        <div className="rounded border border-border/80 bg-card p-3">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
                            Observed State
                          </span>
                          <p className="mt-1 text-foreground/90 font-medium leading-relaxed">
                            {firstFinding.evidence.observed}
                          </p>
                          {firstFinding.evidence.snippet && (
                            <pre className="mt-2 text-[10px] font-mono text-muted-foreground bg-black/30 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                              {firstFinding.evidence.snippet}
                            </pre>
                          )}
                        </div>

                        <div className="rounded border border-border/80 bg-card p-3">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                            Expected Benchmark
                          </span>
                          <p className="mt-1 text-foreground/90 font-medium leading-relaxed">
                            {firstFinding.evidence.expected}
                          </p>
                          <div className="mt-3">
                            <span className="text-[10px] text-muted-foreground block mb-1">Sample URLs:</span>
                            <div className="space-y-1">
                              {group.exampleUrls.slice(0, 3).map((url, uidx) => (
                                <a
                                  key={uidx}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[11px] font-mono text-primary hover:underline truncate"
                                >
                                  <ExternalLink className="size-3 shrink-0" />
                                  <span className="truncate">{url}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* What Passed Section */}
      <section className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs">
        <div className="flex items-center gap-2 font-semibold text-emerald-400 mb-1">
          <CheckCircle2 className="size-4" />
          <span>What Passed (Clean Verification)</span>
        </div>
        <p className="text-foreground/90 leading-relaxed">
          {whatPassed}
        </p>
      </section>

      {/* State What Was Not Checked */}
      <section className="rounded-lg border border-border bg-card/60 p-4 text-xs">
        <div className="flex items-center gap-2 font-semibold text-muted-foreground mb-2">
          <HelpCircle className="size-4 text-muted-foreground" />
          <span>Scope Transparency: What Was Not Checked</span>
        </div>
        <ul className="grid gap-1.5 sm:grid-cols-2 text-muted-foreground text-[11px] list-disc list-inside">
          {notChecked.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
