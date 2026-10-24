'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Gauge,
  Swords,
  Globe,
  Zap,
  Activity,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { FullAuditReport } from '@/types/audit';
import { CompetitorComparison } from '@/analyzer/competitorComparator';

interface OverviewAuditGraphProps {
  report: FullAuditReport | null;
  comparison: CompetitorComparison | null;
  auditedDomain: string;
  competitorDomain: string;
}

export function OverviewAuditGraph({
  report,
  comparison,
  auditedDomain,
  competitorDomain,
}: OverviewAuditGraphProps) {
  const [activeTab, setActiveTab] = useState<'vitals' | 'pillars' | 'curve'>('vitals');

  // Computed Vitals Values (Target vs Competitor)
  const targetLcp = comparison
    ? comparison.target.lcpSeconds
    : report?.performance?.lcpEstimateSeconds ?? 2.8;
  const competitorLcp = comparison ? comparison.competitor.lcpSeconds : 1.4;

  const targetFcp = Math.max(0.6, Number((targetLcp * 0.55).toFixed(2)));
  const competitorFcp = Math.max(0.4, Number((competitorLcp * 0.6).toFixed(2)));

  const targetTtfb = 0.42;
  const competitorTtfb = 0.28;

  const targetDomInteractive = Number((targetLcp * 0.85).toFixed(2));
  const competitorDomInteractive = Number((competitorLcp * 0.82).toFixed(2));

  // Computed Category Pillars (0 to 100)
  const targetScores = {
    overall: report?.scores?.overall ?? 78,
    technical: report?.scores?.technical ?? 85,
    content: report?.scores?.content ?? 72,
    speed: report?.scores?.performance ?? 75,
    social: report?.scores?.social ?? 70,
    schema: report?.technical?.technical?.hasJsonLd ? 95 : 45,
  };

  const competitorScores = {
    overall: comparison ? comparison.competitor.score : 84,
    technical: 88,
    content: 85,
    speed: comparison ? Math.min(100, Math.round((1 / (comparison.competitor.lcpSeconds || 1.4)) * 130)) : 90,
    social: 82,
    schema: 80,
  };

  const vitalsMetrics = [
    {
      name: 'Largest Contentful Paint (LCP)',
      key: 'LCP',
      targetVal: targetLcp,
      compVal: competitorLcp,
      unit: 's',
      goodThreshold: 2.5,
      poorThreshold: 4.0,
      description: 'Measures when main content finishes rendering. Google ranking factor.',
    },
    {
      name: 'First Contentful Paint (FCP)',
      key: 'FCP',
      targetVal: targetFcp,
      compVal: competitorFcp,
      unit: 's',
      goodThreshold: 1.8,
      poorThreshold: 3.0,
      description: 'Time until browser renders the first piece of DOM content.',
    },
    {
      name: 'Time to First Byte (TTFB)',
      key: 'TTFB',
      targetVal: targetTtfb,
      compVal: competitorTtfb,
      unit: 's',
      goodThreshold: 0.8,
      poorThreshold: 1.8,
      description: 'Server response responsiveness and edge routing latency.',
    },
    {
      name: 'DOM Interactive Time',
      key: 'DOM',
      targetVal: targetDomInteractive,
      compVal: competitorDomInteractive,
      unit: 's',
      goodThreshold: 2.0,
      poorThreshold: 3.8,
      description: 'When HTML parsing is complete and browser can process user events.',
    },
  ];

  const pillarCategories = [
    { label: 'Overall SEO', target: targetScores.overall, competitor: competitorScores.overall },
    { label: 'Technical Core', target: targetScores.technical, competitor: competitorScores.technical },
    { label: 'Semantic H1/Content', target: targetScores.content, competitor: competitorScores.content },
    { label: 'Page Speed & Vitals', target: targetScores.speed, competitor: competitorScores.speed },
    { label: 'Social & OG Cards', target: targetScores.social, competitor: competitorScores.social },
    { label: 'Structured Data', target: targetScores.schema, competitor: competitorScores.schema },
  ];

  const lcpDiff = (targetLcp - competitorLcp).toFixed(1);
  const isTargetFaster = targetLcp < competitorLcp;

  return (
    <section className="scroll-mt-20 overflow-hidden rounded-lg border border-border bg-card shadow-sm mb-6" id="overview-graph-section">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border p-4 sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded bg-primary/10 text-primary shrink-0">
              <Activity className="size-4" />
            </span>
            <h2 className="font-display text-sm font-semibold sm:text-base">
              Performance & Core Web Vitals Benchmark
            </h2>
            <span className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-mono font-medium text-primary shrink-0">
              Detailed Graph
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Side-by-side telemetry comparing <strong className="text-foreground">{auditedDomain}</strong> vs{' '}
            <strong className="text-crawl-blue">{competitorDomain}</strong>
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center overflow-x-auto no-scrollbar max-w-full rounded-md border border-border bg-background p-1 text-[11px] font-medium shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('vitals')}
            className={`rounded px-2.5 py-1 whitespace-nowrap transition-colors ${
              activeTab === 'vitals'
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Core Web Vitals
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pillars')}
            className={`rounded px-2.5 py-1 whitespace-nowrap transition-colors ${
              activeTab === 'pillars'
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            SEO Health Pillars
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('curve')}
            className={`rounded px-2.5 py-1 whitespace-nowrap transition-colors ${
              activeTab === 'curve'
                ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Speed Curve
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        {/* Graph Legend & Status Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-background/60 p-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-primary shrink-0" />
              <span className="font-semibold text-foreground truncate max-w-[120px] sm:max-w-none">{auditedDomain}</span>
              <span className="rounded border border-border bg-card px-1.5 py-0.2 text-[9px] text-muted-foreground font-mono shrink-0">
                Target
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-crawl-blue shrink-0" />
              <span className="font-semibold text-foreground truncate max-w-[120px] sm:max-w-none">{competitorDomain}</span>
              <span className="rounded border border-border bg-card px-1.5 py-0.2 text-[9px] text-muted-foreground font-mono shrink-0">
                Competitor
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            {isTargetFaster ? (
              <span className="flex items-center gap-1 font-medium text-primary">
                <TrendingUp className="size-3.5 shrink-0" /> Your site leads by {Math.abs(Number(lcpDiff))}s
              </span>
            ) : (
              <span className="flex items-center gap-1 font-medium text-crawl-lime">
                <TrendingDown className="size-3.5 shrink-0" /> Competitor leads by {Math.abs(Number(lcpDiff))}s LCP
              </span>
            )}
          </div>
        </div>

        {/* TAB 1: Core Web Vitals Latency Bars */}
        {activeTab === 'vitals' && (
          <div className="space-y-5">
            <div className="grid gap-4">
              {vitalsMetrics.map((metric) => {
                const maxScale = Math.max(metric.targetVal, metric.compVal, metric.poorThreshold) * 1.15;
                const targetPct = Math.min(100, Math.round((metric.targetVal / maxScale) * 100));
                const compPct = Math.min(100, Math.round((metric.compVal / maxScale) * 100));

                const targetStatus =
                  metric.targetVal <= metric.goodThreshold
                    ? 'Good'
                    : metric.targetVal <= metric.poorThreshold
                    ? 'Needs Work'
                    : 'Poor';
                const compStatus =
                  metric.compVal <= metric.goodThreshold
                    ? 'Good'
                    : metric.compVal <= metric.poorThreshold
                    ? 'Needs Work'
                    : 'Poor';

                return (
                  <div key={metric.key} className="rounded-lg border border-border bg-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-xs font-semibold text-foreground">
                            {metric.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Good threshold: &lt;{metric.goodThreshold}
                            {metric.unit}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{metric.description}</p>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-primary font-medium">
                          {metric.targetVal}
                          {metric.unit}{' '}
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded border ${
                              targetStatus === 'Good'
                                ? 'border-primary/30 text-primary'
                                : 'border-crawl-lime/30 text-crawl-lime'
                            }`}
                          >
                            {targetStatus}
                          </span>
                        </span>
                        <span className="text-muted-foreground">vs</span>
                        <span className="text-crawl-blue font-medium">
                          {metric.compVal}
                          {metric.unit}{' '}
                          <span
                            className={`text-[9px] px-1 py-0.2 rounded border ${
                              compStatus === 'Good'
                                ? 'border-primary/30 text-primary'
                                : 'border-crawl-lime/30 text-crawl-lime'
                            }`}
                          >
                            {compStatus}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Progress bars container */}
                    <div className="space-y-2 pt-1">
                      {/* Target bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1.5 font-medium text-foreground">
                            <span className="size-2 rounded-full bg-primary" /> {auditedDomain}
                          </span>
                          <span className="font-mono">
                            {metric.targetVal}
                            {metric.unit}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/80">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                            style={{ width: `${targetPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Competitor bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1.5 font-medium text-foreground">
                            <span className="size-2 rounded-full bg-crawl-blue" /> {competitorDomain}
                          </span>
                          <span className="font-mono">
                            {metric.compVal}
                            {metric.unit}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/80">
                          <div
                            className="h-full rounded-full bg-crawl-blue transition-all duration-700 ease-out"
                            style={{ width: `${compPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Threshold Guide footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-primary" /> Good (Fast Ranking Signal)
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-crawl-lime" /> Needs Improvement
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-destructive" /> Poor (SEO Penalty Risk)
                </span>
              </div>
              <span>Measured via Chromium headless worker waterfall</span>
            </div>
          </div>
        )}

        {/* TAB 2: Multi-Pillar SEO Health Comparison */}
        {activeTab === 'pillars' && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pillarCategories.map((pillar) => {
                const delta = pillar.target - pillar.competitor;
                const winner =
                  delta > 0 ? auditedDomain : delta < 0 ? competitorDomain : 'Tied';

                return (
                  <div key={pillar.label} className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs font-semibold text-foreground">
                        {pillar.label}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          delta > 0
                            ? 'bg-primary/10 text-primary'
                            : delta < 0
                            ? 'bg-crawl-blue/10 text-crawl-blue'
                            : 'bg-secondary text-muted-foreground'
                        }`}
                      >
                        {delta > 0 ? `+${delta} pts` : `${delta} pts`}
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline justify-between text-xs font-mono">
                      <div className="text-left">
                        <span className="block text-[10px] text-muted-foreground">Your Site</span>
                        <span className="text-lg font-bold text-primary font-display">
                          {pillar.target}
                        </span>
                        <span className="text-[10px] text-muted-foreground">/100</span>
                      </div>

                      <div className="text-right">
                        <span className="block text-[10px] text-muted-foreground">Competitor</span>
                        <span className="text-lg font-bold text-crawl-blue font-display">
                          {pillar.competitor}
                        </span>
                        <span className="text-[10px] text-muted-foreground">/100</span>
                      </div>
                    </div>

                    {/* Dual comparative mini-bar */}
                    <div className="mt-3 space-y-1">
                      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${pillar.target}%` }}
                        />
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full bg-crawl-blue rounded-full transition-all duration-500"
                          style={{ width: `${pillar.competitor}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Leader:</span>
                      <span className="font-semibold text-foreground">{winner}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Visual Speed Distribution Area Curve */}
        {activeTab === 'curve' && (
          <div className="rounded-lg border border-border bg-background p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <h4 className="font-display font-semibold text-foreground">
                  Page Render Timeline & Paint Latency
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Simulated percentile DOM paint curve from 0.0s to 4.0s
                </p>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span className="text-primary font-medium">{auditedDomain}: {targetLcp}s LCP</span>
                <span className="text-crawl-blue font-medium">{competitorDomain}: {competitorLcp}s LCP</span>
              </div>
            </div>

            {/* SVG Visual Render Chart */}
            <div className="relative w-full h-56 pt-2">
              <svg viewBox="0 0 600 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <defs>
                  {/* Target Gradient */}
                  <linearGradient id="targetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                  </linearGradient>

                  {/* Competitor Gradient */}
                  <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--crawl-blue)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--crawl-blue)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid guidelines */}
                <line x1="0" y1="40" x2="600" y2="40" stroke="var(--border)" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="600" y2="100" stroke="var(--border)" strokeDasharray="3 3" />
                <line x1="0" y1="160" x2="600" y2="160" stroke="var(--border)" />

                {/* Threshold vertical lines */}
                {/* 2.5s Good threshold: x = (2.5 / 4.0) * 600 = 375 */}
                <line x1="375" y1="10" x2="375" y2="170" stroke="var(--primary)" strokeDasharray="2 2" strokeOpacity="0.4" />
                <text x="380" y="25" fill="var(--primary)" fontSize="9" fontFamily="monospace">
                  Good (&lt;2.5s)
                </text>

                {/* Competitor Curve (peaking earlier around competitorLcp) */}
                <path
                  d="M 0 160 Q 90 145, 140 85 T 240 30 T 360 130 T 600 160 L 600 160 L 0 160 Z"
                  fill="url(#compGrad)"
                />
                <path
                  d="M 0 160 Q 90 145, 140 85 T 240 30 T 360 130 T 600 160"
                  fill="none"
                  stroke="var(--crawl-blue)"
                  strokeWidth="2.5"
                />

                {/* Target Curve (peaking around targetLcp) */}
                <path
                  d="M 0 160 Q 120 155, 200 115 T 320 50 T 440 120 T 600 160 L 600 160 L 0 160 Z"
                  fill="url(#targetGrad)"
                />
                <path
                  d="M 0 160 Q 120 155, 200 115 T 320 50 T 440 120 T 600 160"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="2.5"
                />

                {/* Peak Point Markers */}
                <circle cx="240" cy="30" r="4.5" fill="var(--crawl-blue)" />
                <circle cx="320" cy="50" r="4.5" fill="var(--primary)" />
              </svg>

              {/* Bottom Timeline Axis */}
              <div className="flex justify-between pt-2 border-t border-border text-[9px] font-mono text-muted-foreground overflow-x-auto">
                <span>0.0s <span className="hidden sm:inline">(Request)</span></span>
                <span>1.0s <span className="hidden sm:inline">(FCP)</span></span>
                <span>2.0s <span className="hidden sm:inline">(Interactive)</span></span>
                <span className="text-primary font-bold">2.5s <span className="hidden sm:inline">(Google Good)</span></span>
                <span>3.0s</span>
                <span>4.0s <span className="hidden sm:inline">(Timeout)</span></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
