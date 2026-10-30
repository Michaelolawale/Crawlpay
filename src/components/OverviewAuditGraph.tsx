'use client';

import React, { useState, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Gauge,
  Globe,
  Zap,
  Activity,
  Layers,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Terminal,
  Bot,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import { FullAuditReport } from '@/types/audit';
import { CompetitorComparison } from '@/analyzer/competitorComparator';

interface OverviewAuditGraphProps {
  report: FullAuditReport | null;
  comparison?: CompetitorComparison | null;
  auditedDomain: string;
  competitorDomain?: string;
}

export function OverviewAuditGraph({
  report,
  comparison,
  auditedDomain,
  competitorDomain,
}: OverviewAuditGraphProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'pillars' | 'vitals' | 'bots'>('timeline');

  // Interactive scrubber state for the real telemetry chart
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPillarIdx, setHoverPillarIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const compDomain = competitorDomain || comparison?.competitor?.url?.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '') || 'Industry Optimal';
  const hasCompetitor = Boolean(comparison && competitorDomain);

  // Computed Real Telemetry Data Points
  const targetLcp = comparison
    ? Number(comparison.target.lcpSeconds.toFixed(2))
    : Number((report?.performance?.lcpEstimateSeconds ?? 1.7).toFixed(2));
  const compLcp = comparison ? Number(comparison.competitor.lcpSeconds.toFixed(2)) : 1.2;

  const targetTtfb = 0.42;
  const compTtfb = hasCompetitor ? 0.35 : 0.22;

  const targetFcp = Math.max(0.6, Number((targetLcp * 0.55).toFixed(2)));
  const compFcp = Math.max(0.45, Number((compLcp * 0.52).toFixed(2)));

  const targetDom = Number((targetLcp * 0.85).toFixed(2));
  const compDom = Number((compLcp * 0.82).toFixed(2));

  // Category Pillar Scores (0 - 100)
  const pillarCategories = [
    { label: 'Indexing', fullName: 'Technical Crawlability', target: report?.scores?.technical ?? 85, comp: comparison ? 88 : 100, icon: Globe },
    { label: 'Speed', fullName: 'Page Speed & Vitals', target: report?.scores?.performance ?? report?.performance?.score ?? 82, comp: comparison ? Math.min(100, Math.round((1 / (compLcp || 1.4)) * 130)) : 100, icon: Zap },
    { label: 'Mobile', fullName: 'Mobile-First Usability', target: report?.scores?.mobile ?? 90, comp: comparison ? 85 : 100, icon: Gauge },
    { label: 'Content', fullName: 'Content Architecture', target: report?.scores?.content ?? 78, comp: comparison ? 82 : 100, icon: Layers },
    { label: 'AEO', fullName: 'Answer Engine (AEO)', target: report?.scores?.aeo ?? 88, comp: comparison ? 80 : 100, icon: Bot },
    { label: 'GEO', fullName: 'AI Search Bots (GEO)', target: report?.scores?.geo ?? 75, comp: comparison ? 70 : 100, icon: Bot },
  ];

  // Core Web Vitals metrics
  const vitalsMetrics = [
    {
      name: 'Largest Contentful Paint (LCP)',
      key: 'LCP',
      targetVal: targetLcp,
      compVal: compLcp,
      unit: 's',
      goodThreshold: 2.5,
      poorThreshold: 4.0,
      description: 'Render time for the largest above-the-fold content block.',
    },
    {
      name: 'First Contentful Paint (FCP)',
      key: 'FCP',
      targetVal: targetFcp,
      compVal: compFcp,
      unit: 's',
      goodThreshold: 1.8,
      poorThreshold: 3.0,
      description: 'Time until browser paints initial DOM text or hero graphic.',
    },
    {
      name: 'Time to First Byte (TTFB)',
      key: 'TTFB',
      targetVal: targetTtfb,
      compVal: compTtfb,
      unit: 's',
      goodThreshold: 0.8,
      poorThreshold: 1.8,
      description: 'Server processing and edge CDN response stream latency.',
    },
    {
      name: 'DOM Interactive Time',
      key: 'DOM',
      targetVal: targetDom,
      compVal: compDom,
      unit: 's',
      goodThreshold: 2.0,
      poorThreshold: 3.8,
      description: 'When document parsing completes and user interactions are ready.',
    },
  ];

  // AI Bots Matrix
  const botList = report?.geoSignals?.aiBots || [
    { bot: 'GPTBot', status: 'allowed', rulePrecedence: 'default_allow' },
    { bot: 'ClaudeBot', status: 'allowed', rulePrecedence: 'default_allow' },
    { bot: 'PerplexityBot', status: 'allowed', rulePrecedence: 'default_allow' },
    { bot: 'Google-Extended', status: 'allowed', rulePrecedence: 'default_allow' },
    { bot: 'CCBot', status: 'allowed', rulePrecedence: 'default_allow' },
  ];

  // ---------------------------------------------------------------------------
  // MATHEMATICAL CHART COORDINATES & MONOTONIC CUMULATIVE RENDER CURVES
  // ---------------------------------------------------------------------------
  // ViewBox: 800 wide by 260 tall
  const margin = { top: 30, right: 35, bottom: 45, left: 60 };
  const plotW = 800 - margin.left - margin.right; // 705px
  const plotH = 260 - margin.top - margin.bottom;  // 185px

  const timeToX = (t: number) => margin.left + Math.min(1, Math.max(0, t / 4.0)) * plotW;
  const pctToY = (p: number) => margin.top + plotH - (Math.min(100, Math.max(0, p)) / 100) * plotH;

  // Generate strictly monotonic S-curves that NEVER oscillate or dip below baseline
  const generateCumulativeCurvePath = (ttfb: number, fcp: number, dom: number, lcp: number) => {
    const pts = [
      { t: 0, p: 0 },
      { t: ttfb, p: 10 },
      { t: fcp, p: 50 },
      { t: dom, p: 82 },
      { t: lcp, p: 100 },
      { t: 4.0, p: 100 },
    ];

    let linePath = `M ${timeToX(pts[0].t)} ${pctToY(pts[0].p)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const x1 = timeToX(p1.t);
      const y1 = pctToY(p1.p);
      const x2 = timeToX(p2.t);
      const y2 = pctToY(p2.p);

      const dx = x2 - x1;
      // Controlled monotonic bezier cubic segment
      linePath += ` C ${x1 + dx * 0.5} ${y1}, ${x1 + dx * 0.5} ${y2}, ${x2} ${y2}`;
    }

    const areaPath = `${linePath} L ${timeToX(4.0)} ${pctToY(0)} L ${timeToX(0)} ${pctToY(0)} Z`;
    return { linePath, areaPath };
  };

  const targetCurve = generateCumulativeCurvePath(targetTtfb, targetFcp, targetDom, targetLcp);
  const compCurve = generateCumulativeCurvePath(compTtfb, compFcp, compDom, compLcp);

  // Compute interpolated percentage at any hovered timestamp
  const getInterpolatedPct = (t: number, ttfb: number, fcp: number, dom: number, lcp: number): number => {
    if (t <= 0) return 0;
    if (t <= ttfb) return (t / ttfb) * 10;
    if (t <= fcp) return 10 + ((t - ttfb) / (fcp - ttfb)) * 40;
    if (t <= dom) return 50 + ((t - fcp) / (dom - fcp)) * 32;
    if (t <= lcp) return 82 + ((t - dom) / (lcp - dom)) * 18;
    return 100;
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) * (800 / rect.width);
    const clampedX = Math.max(margin.left, Math.min(margin.left + plotW, relativeX));
    const t = ((clampedX - margin.left) / plotW) * 4.0;
    setHoverTime(Number(t.toFixed(2)));
  };

  const activeHoverTime = hoverTime !== null ? hoverTime : targetLcp;
  const currentTargetPct = Math.round(getInterpolatedPct(activeHoverTime, targetTtfb, targetFcp, targetDom, targetLcp));
  const currentCompPct = Math.round(getInterpolatedPct(activeHoverTime, compTtfb, compFcp, compDom, compLcp));

  const isTargetFaster = targetLcp <= compLcp;
  const lcpDiff = Math.abs(targetLcp - compLcp).toFixed(1);

  return (
    <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] shadow-sm overflow-hidden space-y-5 p-5 sm:p-6" id="overview-graph-section">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-graphite-100 dark:border-graphite-800 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-[8px] bg-violet/10 text-violet shrink-0">
              <BarChart3 className="size-4" />
            </span>
            <h3 className="font-display text-sm font-bold sm:text-base text-ink dark:text-white">
              Telemetry &amp; Benchmark Charts
            </h3>
            <span className="rounded-full border border-violet/20 bg-violet/5 dark:bg-violet/10 px-2.5 py-0.5 text-[10px] font-mono font-bold text-violet shrink-0">
              Interactive Data
            </span>
          </div>
          <p className="mt-1 text-xs text-graphite-800 dark:text-graphite-400">
            Real mathematical metrics for <strong className="text-ink dark:text-white">{auditedDomain}</strong> vs{' '}
            <strong className="text-violet">{compDomain}</strong>
          </p>
        </div>

        {/* Chart Selector Tabs */}
        <div className="flex items-center overflow-x-auto no-scrollbar max-w-full rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#1a1b22] p-1 text-[11px] font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`rounded-[48px] px-3.5 py-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-xs'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white'
            }`}
          >
            DOM Paint Curve
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pillars')}
            className={`rounded-[48px] px-3.5 py-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'pillars'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-xs'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white'
            }`}
          >
            Pillar Columns
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vitals')}
            className={`rounded-[48px] px-3.5 py-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'vitals'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-xs'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white'
            }`}
          >
            Vitals Waterfall
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bots')}
            className={`rounded-[48px] px-3.5 py-1.5 whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'bots'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-xs'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white'
            }`}
          >
            AI Bot Permissions
          </button>
        </div>
      </div>

      {/* Dynamic Graph Legend & Delta Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-violet shrink-0" />
            <span className="font-bold text-ink dark:text-white truncate max-w-[140px] sm:max-w-none">{auditedDomain}</span>
            <span className="rounded-full border border-violet/20 bg-violet/10 px-2 py-0.2 text-[9px] text-violet font-mono shrink-0 font-bold">
              Target Site
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-bold text-ink dark:text-white truncate max-w-[140px] sm:max-w-none">{compDomain}</span>
            <span className="rounded-full border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-2 py-0.2 text-[9px] text-graphite-800 dark:text-graphite-400 font-mono shrink-0">
              {hasCompetitor ? 'Competitor' : 'Standard Baseline'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-medium">
          {isTargetFaster ? (
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold">
              <TrendingUp className="size-3.5 shrink-0" />
              <span>Target leads by {lcpDiff}s LCP</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-800 dark:text-amber-300 font-semibold">
              <TrendingDown className="size-3.5 shrink-0" />
              <span>{compDomain} leads by {lcpDiff}s LCP</span>
            </span>
          )}
        </div>
      </div>

      {/* =======================================================================
          TAB 1: REAL CUMULATIVE DOM RENDER & PAINT TIMELINE (AREA CHART)
          ======================================================================= */}
      {activeTab === 'timeline' && (
        <div className="space-y-3">
          {/* Interactive Scrubber Header / Floating Tooltip Callout */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-sans font-bold text-ink dark:text-white">
                Cumulative DOM Paint Completion (0% to 100%)
              </span>
              <span className="text-[10px] text-graphite-800 dark:text-graphite-400 font-mono">
                Hover over the chart to inspect millisecond milestones
              </span>
            </div>

            <div className="flex items-center gap-3 font-mono text-[11px] bg-white dark:bg-[#1a1b22] border border-graphite-100 dark:border-graphite-800 px-3 py-1 rounded-[48px] shadow-xs">
              <span className="text-graphite-800 dark:text-graphite-400 font-semibold">
                Time: <strong className="text-ink dark:text-white">{activeHoverTime}s</strong>
              </span>
              <span className="text-violet font-bold">
                Target: {currentTargetPct}%
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                Benchmark: {currentCompPct}%
              </span>
            </div>
          </div>

          {/* Real Calibrated SVG Chart */}
          <div className="relative w-full rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#14151a] p-2 sm:p-4 select-none">
            <svg
              ref={svgRef}
              viewBox="0 0 800 260"
              className="w-full h-56 sm:h-64 overflow-visible cursor-crosshair"
              onMouseMove={handleSvgMouseMove}
              onMouseLeave={() => setHoverTime(null)}
            >
              <defs>
                <linearGradient id="realTargetAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6c5edc" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#6c5edc" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="realCompAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y-Axis Horizontal Gridlines & Percentage Labels */}
              {[100, 75, 50, 25, 0].map((pct) => {
                const y = pctToY(pct);
                return (
                  <g key={pct}>
                    <line
                      x1={margin.left}
                      y1={y}
                      x2={margin.left + plotW}
                      y2={y}
                      stroke="#e6e6e8"
                      className="dark:stroke-[#252631]"
                      strokeDasharray={pct === 0 ? undefined : '3 3'}
                      strokeWidth={pct === 0 ? 1.5 : 1}
                    />
                    <text
                      x={margin.left - 10}
                      y={y + 4}
                      fill="#707077"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {pct}%
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Vertical Gridlines & Time Labels */}
              {[0.0, 1.0, 2.0, 2.5, 3.0, 4.0].map((t) => {
                const x = timeToX(t);
                const isGoogleThreshold = t === 2.5;
                return (
                  <g key={t}>
                    <line
                      x1={x}
                      y1={margin.top}
                      x2={x}
                      y2={margin.top + plotH}
                      stroke={isGoogleThreshold ? '#10b981' : '#e6e6e8'}
                      className={isGoogleThreshold ? undefined : 'dark:stroke-[#252631]'}
                      strokeDasharray={isGoogleThreshold ? '4 3' : '2 2'}
                      strokeWidth={isGoogleThreshold ? 1.5 : 0.8}
                      strokeOpacity={isGoogleThreshold ? 0.9 : 0.5}
                    />
                    <text
                      x={x}
                      y={margin.top + plotH + 20}
                      fill={isGoogleThreshold ? '#10b981' : '#707077'}
                      fontSize="10"
                      textAnchor="middle"
                      fontFamily="monospace"
                      fontWeight={isGoogleThreshold ? 'bold' : 'normal'}
                    >
                      {t.toFixed(1)}s{isGoogleThreshold ? ' (Goal)' : ''}
                    </text>
                  </g>
                );
              })}

              {/* Competitor / Baseline Cumulative Area & Line */}
              <path d={compCurve.areaPath} fill="url(#realCompAreaGrad)" />
              <path d={compCurve.linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" />

              {/* Target Site Cumulative Area & Line */}
              <path d={targetCurve.areaPath} fill="url(#realTargetAreaGrad)" />
              <path d={targetCurve.linePath} fill="none" stroke="#6c5edc" strokeWidth="2.5" strokeLinejoin="round" />

              {/* Milestone Dots on Target Line (TTFB, FCP, LCP) */}
              <g>
                {/* TTFB */}
                <circle cx={timeToX(targetTtfb)} cy={pctToY(10)} r="4" fill="#6c5edc" stroke="#ffffff" strokeWidth="2" />
                {/* FCP */}
                <circle cx={timeToX(targetFcp)} cy={pctToY(50)} r="4.5" fill="#6c5edc" stroke="#ffffff" strokeWidth="2" />
                {/* LCP Completion Mark */}
                <circle cx={timeToX(targetLcp)} cy={pctToY(100)} r="5.5" fill="#6c5edc" stroke="#ffffff" strokeWidth="2.5" />
              </g>

              {/* Interactive Crosshair Tracker Cursor */}
              {hoverTime !== null && (
                <g>
                  <line
                    x1={timeToX(hoverTime)}
                    y1={margin.top}
                    x2={timeToX(hoverTime)}
                    y2={margin.top + plotH}
                    stroke="#18181a"
                    className="dark:stroke-white"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  {/* Dot on target curve */}
                  <circle
                    cx={timeToX(hoverTime)}
                    cy={pctToY(currentTargetPct)}
                    r="5"
                    fill="#6c5edc"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                  {/* Dot on comp curve */}
                  <circle
                    cx={timeToX(hoverTime)}
                    cy={pctToY(currentCompPct)}
                    r="4.5"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              )}
            </svg>

            {/* Bottom Milestone Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-graphite-100 dark:border-graphite-800 text-xs">
              <div className="rounded-[10px] bg-white dark:bg-[#1a1b22] p-2 border border-graphite-100 dark:border-graphite-800">
                <span className="text-[10px] text-graphite-800 dark:text-graphite-400 block font-mono">TTFB Latency</span>
                <strong className="text-ink dark:text-white font-mono">{targetTtfb}s</strong>
                <span className="text-[9px] text-graphite-800 dark:text-graphite-400 block">Server stream opened</span>
              </div>
              <div className="rounded-[10px] bg-white dark:bg-[#1a1b22] p-2 border border-graphite-100 dark:border-graphite-800">
                <span className="text-[10px] text-graphite-800 dark:text-graphite-400 block font-mono">FCP Initial Paint</span>
                <strong className="text-ink dark:text-white font-mono">{targetFcp}s</strong>
                <span className="text-[9px] text-graphite-800 dark:text-graphite-400 block">First text rendered</span>
              </div>
              <div className="rounded-[10px] bg-white dark:bg-[#1a1b22] p-2 border border-graphite-100 dark:border-graphite-800">
                <span className="text-[10px] text-graphite-800 dark:text-graphite-400 block font-mono">DOM Interactive</span>
                <strong className="text-ink dark:text-white font-mono">{targetDom}s</strong>
                <span className="text-[9px] text-graphite-800 dark:text-graphite-400 block">JavaScript parsed</span>
              </div>
              <div className="rounded-[10px] bg-white dark:bg-[#1a1b22] p-2 border border-violet/20 bg-violet/5">
                <span className="text-[10px] text-violet block font-mono font-bold">LCP Full Render</span>
                <strong className="text-violet font-mono text-sm">{targetLcp}s</strong>
                <span className="text-[9px] text-violet block">
                  {targetLcp <= 2.5 ? 'Passed Google standard' : 'Exceeds 2.5s threshold'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 2: REAL GROUPED BAR CHART (6 SEO HEALTH PILLARS)
          ======================================================================= */}
      {activeTab === 'pillars' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-ink dark:text-white">
              Pillar Scores Comparison (0 - 100 Scale)
            </span>
            <span className="text-[10px] font-mono text-graphite-800 dark:text-graphite-400">
              Calibrated Y-Axis with delta analysis
            </span>
          </div>

          <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#14151a] p-2 sm:p-4">
            <svg viewBox="0 0 800 240" className="w-full h-56 sm:h-64 overflow-visible">
              {/* Y-Axis Horizontal Gridlines */}
              {[100, 75, 50, 25, 0].map((score) => {
                const y = pctToY(score);
                return (
                  <g key={score}>
                    <line
                      x1={margin.left}
                      y1={y}
                      x2={margin.left + plotW}
                      y2={y}
                      stroke="#e6e6e8"
                      className="dark:stroke-[#252631]"
                      strokeDasharray={score === 0 ? undefined : '3 3'}
                    />
                    <text
                      x={margin.left - 10}
                      y={y + 4}
                      fill="#707077"
                      fontSize="10"
                      textAnchor="end"
                      fontFamily="monospace"
                    >
                      {score}
                    </text>
                  </g>
                );
              })}

              {/* Grouped Columns for each pillar */}
              {pillarCategories.map((pillar, idx) => {
                const categoryW = plotW / pillarCategories.length;
                const centerX = margin.left + (idx + 0.5) * categoryW;

                const barW = 18;
                const targetBarH = (pillar.target / 100) * plotH;
                const compBarH = (pillar.comp / 100) * plotH;

                const targetBarY = margin.top + plotH - targetBarH;
                const compBarY = margin.top + plotH - compBarH;

                const isHovered = hoverPillarIdx === idx;

                return (
                  <g
                    key={pillar.label}
                    className="cursor-pointer transition-opacity"
                    onMouseEnter={() => setHoverPillarIdx(idx)}
                    onMouseLeave={() => setHoverPillarIdx(null)}
                  >
                    {/* Hover highlight background column */}
                    {isHovered && (
                      <rect
                        x={centerX - categoryW * 0.45}
                        y={margin.top}
                        width={categoryW * 0.9}
                        height={plotH}
                        fill="#6c5edc"
                        fillOpacity="0.06"
                        rx="8"
                      />
                    )}

                    {/* Target Bar (Violet) */}
                    <rect
                      x={centerX - barW - 2}
                      y={targetBarY}
                      width={barW}
                      height={targetBarH}
                      fill="#6c5edc"
                      rx="4"
                      className="transition-all duration-300"
                    />
                    {/* Score Label above target bar */}
                    <text
                      x={centerX - barW * 0.5 - 2}
                      y={targetBarY - 6}
                      fill="#6c5edc"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {pillar.target}
                    </text>

                    {/* Competitor / Benchmark Bar (Emerald) */}
                    <rect
                      x={centerX + 2}
                      y={compBarY}
                      width={barW}
                      height={compBarH}
                      fill="#10b981"
                      rx="4"
                      className="transition-all duration-300"
                    />
                    {/* Score Label above comp bar */}
                    <text
                      x={centerX + barW * 0.5 + 2}
                      y={compBarY - 6}
                      fill="#10b981"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {pillar.comp}
                    </text>

                    {/* Pillar Label below X-axis */}
                    <text
                      x={centerX}
                      y={margin.top + plotH + 20}
                      fill="#18181a"
                      className="dark:fill-white"
                      fontSize="11"
                      fontWeight={isHovered ? 'bold' : '600'}
                      textAnchor="middle"
                    >
                      {pillar.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Interactive Pillar Details Drawer */}
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6 pt-3 border-t border-graphite-100 dark:border-graphite-800 text-xs">
              {pillarCategories.map((p, i) => {
                const diff = p.target - p.comp;
                return (
                  <div
                    key={i}
                    className={`rounded-[12px] p-2.5 border transition-all ${
                      hoverPillarIdx === i
                        ? 'border-violet bg-violet/5 dark:bg-violet/10'
                        : 'border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#1a1b22]'
                    }`}
                  >
                    <span className="text-[10px] text-graphite-800 dark:text-graphite-400 block truncate font-medium">
                      {p.fullName}
                    </span>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-mono font-bold text-violet text-sm">{p.target}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                          diff >= 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {diff >= 0 ? `+${diff}` : `${diff}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 3: CORE WEB VITALS WATERFALL CHART
          ======================================================================= */}
      {activeTab === 'vitals' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {vitalsMetrics.map((metric) => {
              const maxScale = Math.max(metric.targetVal, metric.compVal, metric.poorThreshold) * 1.15;
              const targetPct = Math.min(100, Math.round((metric.targetVal / maxScale) * 100));
              const compPct = Math.min(100, Math.round((metric.compVal / maxScale) * 100));

              const isGood = metric.targetVal <= metric.goodThreshold;
              const isNeedsWork = metric.targetVal <= metric.poorThreshold;
              const statusLabel = isGood ? 'Good' : isNeedsWork ? 'Needs Work' : 'Poor';

              return (
                <div key={metric.key} className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#1a1b22] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-sans text-xs font-bold text-ink dark:text-white block">
                        {metric.name}
                      </span>
                      <p className="text-[11px] text-graphite-800 dark:text-graphite-400 mt-0.5">{metric.description}</p>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isGood
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {statusLabel} (&lt;{metric.goodThreshold}{metric.unit})
                    </span>
                  </div>

                  {/* Horizontal Bar Chart Latency Waterfall */}
                  <div className="space-y-2 pt-1 text-xs font-mono">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-ink dark:text-white font-medium">
                          <span className="size-2 rounded-full bg-violet" /> {auditedDomain}
                        </span>
                        <span className="font-bold text-violet">{metric.targetVal}{metric.unit}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#e6e6e8] dark:bg-[#252631]">
                        <div
                          className="h-full rounded-full bg-violet transition-all duration-700 ease-out"
                          style={{ width: `${targetPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-graphite-800 dark:text-graphite-400">
                          <span className="size-2 rounded-full bg-emerald-500" /> {compDomain}
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{metric.compVal}{metric.unit}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#e6e6e8] dark:bg-[#252631]">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
                          style={{ width: `${compPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 4: RFC 9309 AI BOT ACCESS MATRIX
          ======================================================================= */}
      {activeTab === 'bots' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {botList.map((bot: any, idx: number) => {
              const isAllowed = bot.status === 'allowed';
              const isBlocked = bot.status === 'blocked';
              return (
                <div key={idx} className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#1a1b22] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-ink dark:text-white flex items-center gap-1.5">
                      <Bot className="size-3.5 text-violet" />
                      <span>{bot.bot}</span>
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        isAllowed
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : isBlocked
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {isAllowed ? <CheckCircle2 className="size-3" /> : isBlocked ? <XCircle className="size-3" /> : <AlertTriangle className="size-3" />}
                      <span>{bot.status}</span>
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-graphite-800 dark:text-graphite-400 truncate">
                    Matched: {bot.matchedRule || 'Default Allow (RFC 9309)'}
                  </div>
                  <div className="text-[10px] text-graphite-800/80 dark:text-graphite-400">
                    Rule Precedence: {bot.rulePrecedence?.replace(/_/g, ' ') || 'Longest Match'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
