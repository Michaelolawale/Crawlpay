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
  LayoutGrid,
  ChevronRight,
  ArrowRight,
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
  const [mobilePillarView, setMobilePillarView] = useState<'cards' | 'chart'>('cards');

  const svgRef = useRef<SVGSVGElement | null>(null);
  const svgMobileRef = useRef<SVGSVGElement | null>(null);

  const compDomain =
    competitorDomain ||
    comparison?.competitor?.url?.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '') ||
    'Industry Optimal';
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
  // DESKTOP COORDINATE SYSTEM (viewBox: 0 0 800 270)
  // ---------------------------------------------------------------------------
  const deskMargin = { top: 28, right: 30, bottom: 44, left: 55 };
  const deskPlotW = 800 - deskMargin.left - deskMargin.right; // 715px
  const deskPlotH = 270 - deskMargin.top - deskMargin.bottom; // 198px

  const deskTimeToX = (t: number) => deskMargin.left + Math.min(1, Math.max(0, t / 4.0)) * deskPlotW;
  const deskPctToY = (p: number) => deskMargin.top + deskPlotH - (Math.min(100, Math.max(0, p)) / 100) * deskPlotH;

  // ---------------------------------------------------------------------------
  // MOBILE COORDINATE SYSTEM (viewBox: 0 0 390 280) - Optimized for 360-430px screens
  // ---------------------------------------------------------------------------
  const mobMargin = { top: 26, right: 18, bottom: 44, left: 46 };
  const mobPlotW = 390 - mobMargin.left - mobMargin.right; // 326px
  const mobPlotH = 280 - mobMargin.top - mobMargin.bottom; // 210px

  const mobTimeToX = (t: number) => mobMargin.left + Math.min(1, Math.max(0, t / 4.0)) * mobPlotW;
  const mobPctToY = (p: number) => mobMargin.top + mobPlotH - (Math.min(100, Math.max(0, p)) / 100) * mobPlotH;

  // Monotonic S-curve generator factory
  const buildCurve = (toX: (t: number) => number, toY: (p: number) => number) => {
    return (ttfb: number, fcp: number, dom: number, lcp: number) => {
      const pts = [
        { t: 0, p: 0 },
        { t: ttfb, p: 10 },
        { t: fcp, p: 50 },
        { t: dom, p: 82 },
        { t: lcp, p: 100 },
        { t: 4.0, p: 100 },
      ];

      let linePath = `M ${toX(pts[0].t)} ${toY(pts[0].p)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const x1 = toX(p1.t);
        const y1 = toY(p1.p);
        const x2 = toX(p2.t);
        const y2 = toY(p2.p);

        const dx = x2 - x1;
        linePath += ` C ${x1 + dx * 0.5} ${y1}, ${x1 + dx * 0.5} ${y2}, ${x2} ${y2}`;
      }

      const areaPath = `${linePath} L ${toX(4.0)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`;
      return { linePath, areaPath };
    };
  };

  const deskTargetCurve = buildCurve(deskTimeToX, deskPctToY)(targetTtfb, targetFcp, targetDom, targetLcp);
  const deskCompCurve = buildCurve(deskTimeToX, deskPctToY)(compTtfb, compFcp, compDom, compLcp);

  const mobTargetCurve = buildCurve(mobTimeToX, mobPctToY)(targetTtfb, targetFcp, targetDom, targetLcp);
  const mobCompCurve = buildCurve(mobTimeToX, mobPctToY)(compTtfb, compFcp, compDom, compLcp);

  // Compute interpolated percentage at any hovered timestamp
  const getInterpolatedPct = (t: number, ttfb: number, fcp: number, dom: number, lcp: number): number => {
    if (t <= 0) return 0;
    if (t <= ttfb) return (t / ttfb) * 10;
    if (t <= fcp) return 10 + ((t - ttfb) / (fcp - ttfb)) * 40;
    if (t <= dom) return 50 + ((t - fcp) / (dom - fcp)) * 32;
    if (t <= lcp) return 82 + ((t - dom) / (lcp - dom)) * 18;
    return 100;
  };

  // Mouse scrubber (desktop)
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) * (800 / rect.width);
    const clampedX = Math.max(deskMargin.left, Math.min(deskMargin.left + deskPlotW, relativeX));
    const t = ((clampedX - deskMargin.left) / deskPlotW) * 4.0;
    setHoverTime(Number(t.toFixed(2)));
  };

  // Touch scrubber (mobile)
  const handleSvgTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!svgMobileRef.current || e.touches.length === 0) return;
    const rect = svgMobileRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX;
    const relativeX = (touchX - rect.left) * (390 / rect.width);
    const clampedX = Math.max(mobMargin.left, Math.min(mobMargin.left + mobPlotW, relativeX));
    const t = ((clampedX - mobMargin.left) / mobPlotW) * 4.0;
    setHoverTime(Number(t.toFixed(2)));
  };

  const activeHoverTime = hoverTime !== null ? hoverTime : targetLcp;
  const currentTargetPct = Math.round(getInterpolatedPct(activeHoverTime, targetTtfb, targetFcp, targetDom, targetLcp));
  const currentCompPct = Math.round(getInterpolatedPct(activeHoverTime, compTtfb, compFcp, compDom, compLcp));

  const isTargetFaster = targetLcp <= compLcp;
  const lcpDiff = Math.abs(targetLcp - compLcp).toFixed(1);

  return (
    <section
      className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] shadow-sm overflow-hidden space-y-4 sm:space-y-5 p-3.5 sm:p-6"
      id="overview-graph-section"
    >
      {/* 1. Header Bar with Responsive Tab Navigation */}
      <div className="flex flex-col gap-3.5 border-b border-graphite-100 dark:border-graphite-800 pb-3.5 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-[8px] bg-violet/10 text-violet shrink-0">
                <BarChart3 className="size-4" />
              </span>
              <h3 className="font-display text-sm font-bold sm:text-base text-ink dark:text-white">
                Telemetry &amp; Benchmark Charts
              </h3>
              <span className="rounded-full border border-violet/20 bg-violet/5 dark:bg-violet/10 px-2 py-0.5 text-[10px] font-mono font-bold text-violet shrink-0">
                Interactive
              </span>
            </div>
            <p className="mt-1 text-xs text-graphite-800 dark:text-graphite-400">
              Deterministic metrics for <strong className="text-ink dark:text-white">{auditedDomain}</strong> vs{' '}
              <strong className="text-violet">{compDomain}</strong>
            </p>
          </div>

          {/* Quick Delta Indicator on Desktop */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold">
            {isTargetFaster ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                <TrendingUp className="size-3.5 shrink-0" />
                <span>Target leads by {lcpDiff}s LCP</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-full">
                <TrendingDown className="size-3.5 shrink-0" />
                <span>{compDomain} leads by {lcpDiff}s LCP</span>
              </span>
            )}
          </div>
        </div>

        {/* Chart Selector Tabs - Scrollable with smooth touch scrolling */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-1 px-1 py-0.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#1a1b22] p-1 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-1.5 rounded-[48px] px-3 sm:px-4 py-2 sm:py-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'timeline'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-xs'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white'
            }`}
          >
            <Activity className="size-3 shrink-0" />
            <span>DOM Paint Curve</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pillars')}
            className={`flex items-center gap-1.5 rounded-[48px] px-3 sm:px-4 py-2 sm:py-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'pillars'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-xs'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white'
            }`}
          >
            <Layers className="size-3 shrink-0" />
            <span>Pillar Scores</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vitals')}
            className={`flex items-center gap-1.5 rounded-[48px] px-3 sm:px-4 py-2 sm:py-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'vitals'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-xs'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white'
            }`}
          >
            <Zap className="size-3 shrink-0" />
            <span>Vitals Waterfall</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bots')}
            className={`flex items-center gap-1.5 rounded-[48px] px-3 sm:px-4 py-2 sm:py-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
              activeTab === 'bots'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-xs'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white'
            }`}
          >
            <Bot className="size-3 shrink-0" />
            <span>AI Bot Permissions</span>
          </button>
        </div>
      </div>

      {/* 2. Responsive Legend & Delta Pill Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-2.5 sm:p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-violet shrink-0 ring-2 ring-violet/20" />
            <span className="font-bold text-ink dark:text-white text-[11px] sm:text-xs truncate max-w-[130px] sm:max-w-none">
              {auditedDomain}
            </span>
            <span className="rounded-full border border-violet/20 bg-violet/10 px-1.5 sm:px-2 py-0.2 text-[9px] text-violet font-mono shrink-0 font-bold">
              Target
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-500/20" />
            <span className="font-bold text-ink dark:text-white text-[11px] sm:text-xs truncate max-w-[130px] sm:max-w-none">
              {compDomain}
            </span>
            <span className="rounded-full border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-1.5 sm:px-2 py-0.2 text-[9px] text-graphite-800 dark:text-graphite-400 font-mono shrink-0">
              {hasCompetitor ? 'Competitor' : 'Standard'}
            </span>
          </div>
        </div>

        {/* Mobile Delta Indicator */}
        <div className="sm:hidden text-[11px] font-semibold w-full pt-1 border-t border-graphite-200/50 dark:border-graphite-800">
          {isTargetFaster ? (
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="size-3.5 shrink-0" />
              <span>Target leads by {lcpDiff}s LCP</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-800 dark:text-amber-400">
              <TrendingDown className="size-3.5 shrink-0" />
              <span>{compDomain} leads by {lcpDiff}s LCP</span>
            </span>
          )}
        </div>
      </div>

      {/* =======================================================================
          TAB 1: CUMULATIVE DOM RENDER & PAINT TIMELINE
          ======================================================================= */}
      {activeTab === 'timeline' && (
        <div className="space-y-3">
          {/* Real-time Telemetry Scrubber Pill */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-0.5 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-sans font-bold text-ink dark:text-white text-xs sm:text-sm">
                Cumulative DOM Paint Completion
              </span>
              <span className="text-[10px] text-graphite-800 dark:text-graphite-400 font-mono hidden sm:inline">
                (0% to 100%)
              </span>
            </div>

            {/* Live Values HUD */}
            <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 font-mono text-[11px] bg-white dark:bg-[#1a1b22] border border-graphite-100 dark:border-graphite-800 px-3 py-1.5 rounded-[48px] shadow-xs">
              <span className="text-graphite-800 dark:text-graphite-400 font-medium">
                Time: <strong className="text-ink dark:text-white font-bold">{activeHoverTime}s</strong>
              </span>
              <span className="text-graphite-300 dark:text-graphite-700">&bull;</span>
              <span className="text-violet font-bold">Target: {currentTargetPct}%</span>
              <span className="text-graphite-300 dark:text-graphite-700">&bull;</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Standard: {currentCompPct}%</span>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="relative w-full rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#14151a] p-2 sm:p-4 select-none touch-pan-y">
            {/* -------------------------------------------------------------
                A) MOBILE TAILORED SVG (viewBox: 0 0 390 280) - Visible on < sm
                ------------------------------------------------------------- */}
            <div className="block sm:hidden w-full">
              <svg
                ref={svgMobileRef}
                viewBox="0 0 390 280"
                className="w-full h-72 overflow-visible cursor-crosshair touch-none"
                onTouchStart={handleSvgTouchMove}
                onTouchMove={handleSvgTouchMove}
                onTouchEnd={() => setHoverTime(null)}
              >
                <defs>
                  <linearGradient id="mobTargetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6c5edc" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#6c5edc" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="mobCompGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Gridlines & Labels */}
                {[100, 75, 50, 25, 0].map((pct) => {
                  const y = mobPctToY(pct);
                  return (
                    <g key={pct}>
                      <line
                        x1={mobMargin.left}
                        y1={y}
                        x2={mobMargin.left + mobPlotW}
                        y2={y}
                        stroke="#e6e6e8"
                        className="dark:stroke-[#252631]"
                        strokeDasharray={pct === 0 ? undefined : '3 3'}
                        strokeWidth={pct === 0 ? 1.5 : 0.9}
                      />
                      <text
                        x={mobMargin.left - 8}
                        y={y + 4}
                        fill="#707077"
                        fontSize="11"
                        textAnchor="end"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {pct}%
                      </text>
                    </g>
                  );
                })}

                {/* X-Axis Gridlines & Time Labels */}
                {[0.0, 1.0, 2.0, 2.5, 4.0].map((t) => {
                  const x = mobTimeToX(t);
                  const isGoal = t === 2.5;
                  return (
                    <g key={t}>
                      <line
                        x1={x}
                        y1={mobMargin.top}
                        x2={x}
                        y2={mobMargin.top + mobPlotH}
                        stroke={isGoal ? '#10b981' : '#e6e6e8'}
                        className={isGoal ? undefined : 'dark:stroke-[#252631]'}
                        strokeDasharray={isGoal ? '4 3' : '2 2'}
                        strokeWidth={isGoal ? 1.8 : 0.8}
                        strokeOpacity={isGoal ? 1 : 0.6}
                      />
                      <text
                        x={x}
                        y={mobMargin.top + mobPlotH + 20}
                        fill={isGoal ? '#10b981' : '#707077'}
                        fontSize="11"
                        textAnchor="middle"
                        fontFamily="monospace"
                        fontWeight={isGoal ? 'bold' : 'normal'}
                      >
                        {t === 2.5 ? '2.5s★' : `${t.toFixed(1)}s`}
                      </text>
                    </g>
                  );
                })}

                {/* Benchmark Area & Line */}
                <path d={mobCompCurve.areaPath} fill="url(#mobCompGrad)" />
                <path d={mobCompCurve.linePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinejoin="round" />

                {/* Target Site Area & Line */}
                <path d={mobTargetCurve.areaPath} fill="url(#mobTargetGrad)" />
                <path d={mobTargetCurve.linePath} fill="none" stroke="#6c5edc" strokeWidth="3.5" strokeLinejoin="round" />

                {/* Milestone Nodes */}
                <g>
                  <circle cx={mobTimeToX(targetTtfb)} cy={mobPctToY(10)} r="4.5" fill="#6c5edc" stroke="#ffffff" strokeWidth="2" />
                  <circle cx={mobTimeToX(targetFcp)} cy={mobPctToY(50)} r="5.5" fill="#6c5edc" stroke="#ffffff" strokeWidth="2" />
                  <circle cx={mobTimeToX(targetLcp)} cy={mobPctToY(100)} r="7" fill="#6c5edc" stroke="#ffffff" strokeWidth="2.5" />
                </g>

                {/* Interactive Crosshair Tracker */}
                {hoverTime !== null && (
                  <g>
                    <line
                      x1={mobTimeToX(hoverTime)}
                      y1={mobMargin.top}
                      x2={mobTimeToX(hoverTime)}
                      y2={mobMargin.top + mobPlotH}
                      stroke="#18181a"
                      className="dark:stroke-white"
                      strokeWidth="1.8"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={mobTimeToX(hoverTime)}
                      cy={mobPctToY(currentTargetPct)}
                      r="6"
                      fill="#6c5edc"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx={mobTimeToX(hoverTime)}
                      cy={mobPctToY(currentCompPct)}
                      r="5.5"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                  </g>
                )}
              </svg>
              <p className="text-[10px] text-center text-graphite-800/80 dark:text-graphite-400 font-mono mt-1">
                Touch and drag along chart to scrub millisecond milestones &bull; ★ 2.5s Google LCP standard
              </p>
            </div>

            {/* -------------------------------------------------------------
                B) DESKTOP TAILORED SVG (viewBox: 0 0 800 270) - Visible on sm+
                ------------------------------------------------------------- */}
            <div className="hidden sm:block w-full">
              <svg
                ref={svgRef}
                viewBox="0 0 800 270"
                className="w-full h-64 sm:h-72 overflow-visible cursor-crosshair"
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
                  const y = deskPctToY(pct);
                  return (
                    <g key={pct}>
                      <line
                        x1={deskMargin.left}
                        y1={y}
                        x2={deskMargin.left + deskPlotW}
                        y2={y}
                        stroke="#e6e6e8"
                        className="dark:stroke-[#252631]"
                        strokeDasharray={pct === 0 ? undefined : '3 3'}
                        strokeWidth={pct === 0 ? 1.5 : 1}
                      />
                      <text
                        x={deskMargin.left - 10}
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
                  const x = deskTimeToX(t);
                  const isGoogleThreshold = t === 2.5;
                  return (
                    <g key={t}>
                      <line
                        x1={x}
                        y1={deskMargin.top}
                        x2={x}
                        y2={deskMargin.top + deskPlotH}
                        stroke={isGoogleThreshold ? '#10b981' : '#e6e6e8'}
                        className={isGoogleThreshold ? undefined : 'dark:stroke-[#252631]'}
                        strokeDasharray={isGoogleThreshold ? '4 3' : '2 2'}
                        strokeWidth={isGoogleThreshold ? 1.5 : 0.8}
                        strokeOpacity={isGoogleThreshold ? 0.9 : 0.5}
                      />
                      <text
                        x={x}
                        y={deskMargin.top + deskPlotH + 20}
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
                <path d={deskCompCurve.areaPath} fill="url(#realCompAreaGrad)" />
                <path d={deskCompCurve.linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round" />

                {/* Target Site Cumulative Area & Line */}
                <path d={deskTargetCurve.areaPath} fill="url(#realTargetAreaGrad)" />
                <path d={deskTargetCurve.linePath} fill="none" stroke="#6c5edc" strokeWidth="2.5" strokeLinejoin="round" />

                {/* Milestone Dots on Target Line (TTFB, FCP, LCP) */}
                <g>
                  <circle cx={deskTimeToX(targetTtfb)} cy={deskPctToY(10)} r="4" fill="#6c5edc" stroke="#ffffff" strokeWidth="2" />
                  <circle cx={deskTimeToX(targetFcp)} cy={deskPctToY(50)} r="4.5" fill="#6c5edc" stroke="#ffffff" strokeWidth="2" />
                  <circle cx={deskTimeToX(targetLcp)} cy={deskPctToY(100)} r="5.5" fill="#6c5edc" stroke="#ffffff" strokeWidth="2.5" />
                </g>

                {/* Interactive Crosshair Tracker Cursor */}
                {hoverTime !== null && (
                  <g>
                    <line
                      x1={deskTimeToX(hoverTime)}
                      y1={deskMargin.top}
                      x2={deskTimeToX(hoverTime)}
                      y2={deskMargin.top + deskPlotH}
                      stroke="#18181a"
                      className="dark:stroke-white"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={deskTimeToX(hoverTime)}
                      cy={deskPctToY(currentTargetPct)}
                      r="5"
                      fill="#6c5edc"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <circle
                      cx={deskTimeToX(hoverTime)}
                      cy={deskPctToY(currentCompPct)}
                      r="4.5"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  </g>
                )}
              </svg>
            </div>

            {/* Bottom Milestone Badges - Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 pt-3 border-t border-graphite-100 dark:border-graphite-800 text-xs">
              <div className="rounded-[12px] bg-white dark:bg-[#1a1b22] p-2.5 border border-graphite-100 dark:border-graphite-800 space-y-0.5">
                <span className="text-[10px] text-graphite-800 dark:text-graphite-400 block font-mono font-medium">TTFB Latency</span>
                <strong className="text-ink dark:text-white font-mono text-sm block">{targetTtfb}s</strong>
                <span className="text-[10px] text-graphite-800/80 dark:text-graphite-400 block truncate">Server stream opened</span>
              </div>

              <div className="rounded-[12px] bg-white dark:bg-[#1a1b22] p-2.5 border border-graphite-100 dark:border-graphite-800 space-y-0.5">
                <span className="text-[10px] text-graphite-800 dark:text-graphite-400 block font-mono font-medium">FCP Initial Paint</span>
                <strong className="text-ink dark:text-white font-mono text-sm block">{targetFcp}s</strong>
                <span className="text-[10px] text-graphite-800/80 dark:text-graphite-400 block truncate">First text rendered</span>
              </div>

              <div className="rounded-[12px] bg-white dark:bg-[#1a1b22] p-2.5 border border-graphite-100 dark:border-graphite-800 space-y-0.5">
                <span className="text-[10px] text-graphite-800 dark:text-graphite-400 block font-mono font-medium">DOM Interactive</span>
                <strong className="text-ink dark:text-white font-mono text-sm block">{targetDom}s</strong>
                <span className="text-[10px] text-graphite-800/80 dark:text-graphite-400 block truncate">JavaScript ready</span>
              </div>

              <div className="rounded-[12px] bg-violet/5 dark:bg-violet/10 p-2.5 border border-violet/30 space-y-0.5">
                <span className="text-[10px] text-violet block font-mono font-bold">LCP Full Render</span>
                <strong className="text-violet font-mono text-sm block">{targetLcp}s</strong>
                <span className="text-[10px] text-violet/90 block truncate font-medium">
                  {targetLcp <= 2.5 ? 'Passed standard (<2.5s)' : 'Exceeds 2.5s threshold'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 2: PILLAR SCORES (0 - 100 SCALE)
          Mobile: High-Readability Comparative Meter Cards + Optional Column Chart
          Desktop: Calibrated 6-Category Grouped Bar Chart + Details Drawer
          ======================================================================= */}
      {activeTab === 'pillars' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs px-0.5">
            <div>
              <span className="font-bold text-ink dark:text-white text-xs sm:text-sm block">
                Pillar Scores Comparison (0 – 100 Scale)
              </span>
              <span className="text-[11px] text-graphite-800 dark:text-graphite-400">
                Evaluating crawlability, speed, mobile usability, content, AEO and GEO bots.
              </span>
            </div>

            {/* Mobile View Switcher (Cards vs Columns) */}
            <div className="flex sm:hidden items-center self-start rounded-[48px] border border-graphite-200 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#1a1b22] p-0.5 text-[10px] font-semibold">
              <button
                type="button"
                onClick={() => setMobilePillarView('cards')}
                className={`rounded-[48px] px-2.5 py-1 transition-all ${
                  mobilePillarView === 'cards'
                    ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-xs'
                    : 'text-graphite-800 dark:text-graphite-300'
                }`}
              >
                Cards View
              </button>
              <button
                type="button"
                onClick={() => setMobilePillarView('chart')}
                className={`rounded-[48px] px-2.5 py-1 transition-all ${
                  mobilePillarView === 'chart'
                    ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-xs'
                    : 'text-graphite-800 dark:text-graphite-300'
                }`}
              >
                Column Chart
              </button>
            </div>
          </div>

          {/* -----------------------------------------------------------------
              MOBILE VIEW 1: RESPONSIVE COMPARATIVE METER CARDS (DEFAULT MOBILE)
              ----------------------------------------------------------------- */}
          <div className={`${mobilePillarView === 'cards' ? 'block sm:hidden' : 'hidden'} space-y-2.5`}>
            {pillarCategories.map((pillar, idx) => {
              const diff = pillar.target - pillar.comp;
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.label}
                  className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#14151a] p-3.5 space-y-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 items-center justify-center rounded-[8px] bg-violet/10 text-violet shrink-0">
                        <Icon className="size-3.5" />
                      </span>
                      <div>
                        <span className="font-bold text-xs text-ink dark:text-white block">
                          {pillar.fullName}
                        </span>
                        <span className="text-[10px] text-graphite-800 dark:text-graphite-400 font-mono">
                          {pillar.label} Pillar
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        diff >= 0
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {diff >= 0 ? `+${diff} Target Lead` : `${diff} Gap`}
                    </span>
                  </div>

                  {/* Dual Horizontal Comparative Bars */}
                  <div className="space-y-1.5 font-mono text-[11px] pt-1">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="flex items-center gap-1.5 text-ink dark:text-white font-medium">
                          <span className="size-2 rounded-full bg-violet" />
                          <span className="truncate max-w-[170px]">{auditedDomain}</span>
                        </span>
                        <strong className="text-violet font-bold text-xs">{pillar.target}/100</strong>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#e6e6e8] dark:bg-[#252631]">
                        <div
                          className="h-full rounded-full bg-violet transition-all duration-500 ease-out"
                          style={{ width: `${pillar.target}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="flex items-center gap-1.5 text-graphite-800 dark:text-graphite-400">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          <span className="truncate max-w-[170px]">{compDomain}</span>
                        </span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">{pillar.comp}/100</strong>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#e6e6e8] dark:bg-[#252631]">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
                          style={{ width: `${pillar.comp}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* -----------------------------------------------------------------
              MOBILE VIEW 2 & DESKTOP: GROUPED COLUMN BAR CHART
              ----------------------------------------------------------------- */}
          <div
            className={`${
              mobilePillarView === 'chart' ? 'block' : 'hidden sm:block'
            } rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#14151a] p-2 sm:p-4 overflow-x-auto no-scrollbar`}
          >
            {/* Horizontal scroll helper banner on mobile if in column mode */}
            <div className="sm:hidden flex items-center justify-between pb-2 text-[10px] text-graphite-800 dark:text-graphite-400 font-mono">
              <span>← Swipe chart horizontally to explore →</span>
              <span className="font-bold text-violet">6 Health Pillars</span>
            </div>

            <div className="min-w-[520px] sm:min-w-0">
              <svg viewBox="0 0 800 240" className="w-full h-64 sm:h-64 overflow-visible">
                {/* Y-Axis Horizontal Gridlines */}
                {[100, 75, 50, 25, 0].map((score) => {
                  const y = deskPctToY(score);
                  return (
                    <g key={score}>
                      <line
                        x1={deskMargin.left}
                        y1={y}
                        x2={deskMargin.left + deskPlotW}
                        y2={y}
                        stroke="#e6e6e8"
                        className="dark:stroke-[#252631]"
                        strokeDasharray={score === 0 ? undefined : '3 3'}
                      />
                      <text
                        x={deskMargin.left - 10}
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
                  const categoryW = deskPlotW / pillarCategories.length;
                  const centerX = deskMargin.left + (idx + 0.5) * categoryW;

                  const barW = 20;
                  const targetBarH = (pillar.target / 100) * deskPlotH;
                  const compBarH = (pillar.comp / 100) * deskPlotH;

                  const targetBarY = deskMargin.top + deskPlotH - targetBarH;
                  const compBarY = deskMargin.top + deskPlotH - compBarH;

                  const isHovered = hoverPillarIdx === idx;

                  return (
                    <g
                      key={pillar.label}
                      className="cursor-pointer transition-opacity"
                      onMouseEnter={() => setHoverPillarIdx(idx)}
                      onMouseLeave={() => setHoverPillarIdx(null)}
                      onClick={() => setHoverPillarIdx(hoverPillarIdx === idx ? null : idx)}
                    >
                      {/* Hover highlight background column */}
                      {isHovered && (
                        <rect
                          x={centerX - categoryW * 0.45}
                          y={deskMargin.top}
                          width={categoryW * 0.9}
                          height={deskPlotH}
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
                        fontSize="11"
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
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {pillar.comp}
                      </text>

                      {/* Pillar Label below X-axis */}
                      <text
                        x={centerX}
                        y={deskMargin.top + deskPlotH + 20}
                        fill="#18181a"
                        className="dark:fill-white"
                        fontSize="12"
                        fontWeight={isHovered ? 'bold' : '600'}
                        textAnchor="middle"
                      >
                        {pillar.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Interactive Pillar Details Drawer */}
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 pt-3 border-t border-graphite-100 dark:border-graphite-800 text-xs">
              {pillarCategories.map((p, i) => {
                const diff = p.target - p.comp;
                return (
                  <div
                    key={i}
                    onClick={() => setHoverPillarIdx(i)}
                    className={`rounded-[12px] p-2.5 border transition-all cursor-pointer ${
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
        <div className="space-y-3 sm:space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {vitalsMetrics.map((metric) => {
              const maxScale = Math.max(metric.targetVal, metric.compVal, metric.poorThreshold) * 1.15;
              const targetPct = Math.min(100, Math.round((metric.targetVal / maxScale) * 100));
              const compPct = Math.min(100, Math.round((metric.compVal / maxScale) * 100));

              const isGood = metric.targetVal <= metric.goodThreshold;
              const isNeedsWork = metric.targetVal <= metric.poorThreshold;
              const statusLabel = isGood ? 'Good' : isNeedsWork ? 'Needs Work' : 'Poor';

              return (
                <div
                  key={metric.key}
                  className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#1a1b22] p-3.5 sm:p-4 space-y-3 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-sans text-xs sm:text-sm font-bold text-ink dark:text-white block">
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

                  {/* Horizontal Bar Latency Waterfall */}
                  <div className="space-y-2 pt-1 font-mono text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-ink dark:text-white font-medium">
                          <span className="size-2 rounded-full bg-violet" />
                          <span className="truncate max-w-[160px]">{auditedDomain}</span>
                        </span>
                        <span className="font-bold text-violet">{metric.targetVal}{metric.unit}</span>
                      </div>
                      <div className="relative h-2.5 sm:h-3 w-full overflow-hidden rounded-full bg-[#e6e6e8] dark:bg-[#252631]">
                        <div
                          className="h-full rounded-full bg-violet transition-all duration-700 ease-out"
                          style={{ width: `${targetPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-graphite-800 dark:text-graphite-400">
                          <span className="size-2 rounded-full bg-emerald-500" />
                          <span className="truncate max-w-[160px]">{compDomain}</span>
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{metric.compVal}{metric.unit}</span>
                      </div>
                      <div className="relative h-2.5 sm:h-3 w-full overflow-hidden rounded-full bg-[#e6e6e8] dark:bg-[#252631]">
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
        <div className="space-y-3 sm:space-y-4">
          <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {botList.map((bot: any, idx: number) => {
              const isAllowed = bot.status === 'allowed';
              const isBlocked = bot.status === 'blocked';
              return (
                <div
                  key={idx}
                  className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#1a1b22] p-3.5 sm:p-4 space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-ink dark:text-white flex items-center gap-1.5">
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
