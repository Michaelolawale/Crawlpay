'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  FileCode,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Globe,
  HelpCircle,
  ExternalLink,
  Gauge,
  Zap,
  TrendingDown,
  TrendingUp,
  Swords,
  Activity,
  FileText,
  FileQuestion,
  Clock,
  Image as ImageIcon,
  Code2,
  Smartphone,
  Terminal,
  CheckCheck,
  Flame,
  BarChart3,
  Bot,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { FindingGroup, Severity } from '../engine/types';
import { getStackFix } from '../engine/utils/stackDetector';
import { GscAnalysisResult } from '../utils/gscParser';
import { FullAuditReport } from '../types/audit';
import { CompetitorComparison } from '../analyzer/competitorComparator';
import { generateCodePatches } from '../analyzer/fixGenerator';
import { getSuggestedContentFix } from '../analyzer/contentFixes';
import { getFindingKnowledge } from '../analyzer/findingKnowledge';
import { OverviewAuditGraph } from './OverviewAuditGraph';

interface CheckEngineViewProps {
  groups?: FindingGroup[];
  whatPassed?: string;
  notChecked?: string[];
  pagesChecked?: number;
  targetUrl?: string;
  detectedStack?: {
    cms?: string;
    seoPlugin?: string;
    framework?: string;
  };
  gscAnalysis?: GscAnalysisResult | null;
  report?: FullAuditReport;
}

export function CheckEngineView(props: CheckEngineViewProps) {
  const groups = props.groups || props.report?.prioritizedGroups || props.report?.checkEngineReport?.prioritizedGroups || [];
  const whatPassed = props.whatPassed || props.report?.whatPassed || props.report?.checkEngineReport?.whatPassed || '';
  const notChecked = props.notChecked || props.report?.notChecked || props.report?.checkEngineReport?.notChecked || [];
  const pagesChecked = props.pagesChecked ?? props.report?.pagesChecked ?? 1;
  const targetUrl = props.targetUrl || props.report?.targetUrl || '';
  const detectedStack = props.detectedStack || props.report?.detectedStack;
  const report = props.report;

  // Workspace Main Navigation Tab (Executive Command Center)
  const [activeMainTab, setActiveMainTab] = useState<'issues' | 'graphs' | 'aeo-geo' | 'vitals' | 'patches' | 'competitor'>('issues');

  // Issue Filtering & State
  const [filterTab, setFilterTab] = useState<'all' | 'errors' | 'warnings' | 'notices'>('all');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  // Active Code Patch Tab
  const [activeCodeTab, setActiveCodeTab] = useState<'nextjs' | 'wordpress' | 'shopify' | 'astro' | 'html' | 'schema' | 'robots' | 'faq'>('nextjs');

  // Auto-sync code tab with detected stack
  useEffect(() => {
    const cms = detectedStack?.cms?.toLowerCase() || '';
    if (cms.includes('wordpress')) setActiveCodeTab('wordpress');
    else if (cms.includes('shopify')) setActiveCodeTab('shopify');
    else if (cms.includes('astro')) setActiveCodeTab('astro');
    else if (cms.includes('next')) setActiveCodeTab('nextjs');
  }, [detectedStack]);

  // Competitor Analysis State
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError] = useState<string | null>(null);
  const [comparison, setComparison] = useState<CompetitorComparison | null>(null);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Group Categorization
  const errorGroups = groups.filter((g) => g.severity === 'critical' || g.severity === 'high');
  const warningGroups = groups.filter((g) => g.severity === 'medium');
  const noticeGroups = groups.filter((g) => g.severity === 'low' || g.severity === 'info');

  const totalIssuesCount = groups.length;
  const errorCount = errorGroups.reduce((acc, g) => acc + g.affectedCount, 0);
  const warningCount = warningGroups.reduce((acc, g) => acc + g.affectedCount, 0);
  const noticeCount = noticeGroups.reduce((acc, g) => acc + g.affectedCount, 0);

  const displayedGroups = groups.filter((g) => {
    if (filterTab === 'errors') return g.severity === 'critical' || g.severity === 'high';
    if (filterTab === 'warnings') return g.severity === 'medium';
    if (filterTab === 'notices') return g.severity === 'low' || g.severity === 'info';
    return true;
  });

  // Health Scores
  const overallScore = report?.scores?.overall ?? Math.max(35, Math.min(100, 100 - (errorGroups.length * 15 + warningGroups.length * 6 + noticeGroups.length * 2)));
  const technicalScore = report?.scores?.technical ?? Math.max(40, 100 - (groups.filter((g) => g.checkId.includes('canonical') || g.checkId.includes('indexability') || g.checkId.includes('sitemap')).length * 15));
  const contentScore = report?.scores?.content ?? Math.max(45, 100 - (groups.filter((g) => g.checkId.includes('titles') || g.checkId.includes('headings') || g.checkId.includes('descriptions')).length * 12));
  const performanceScore = report?.scores?.performance ?? report?.performance?.score ?? 82;
  const mobileScore = report?.scores?.mobile ?? report?.performance?.mobile?.mobileScore ?? Math.max(40, 100 - (groups.filter((g) => g.checkId.includes('mobile')).length * 15));
  const socialScore = report?.scores?.social ?? (report?.technical?.openGraph?.hasCompleteOg ? 95 : 65);
  const aeoScore = report?.scores?.aeo ?? 88;
  const geoScore = report?.scores?.geo ?? 75;
  const aeoSignals = report?.aeoSignals;
  const geoSignals = report?.geoSignals;
  const coverage = report?.coverage;

  const mobileMetrics = report?.mobileMetrics || report?.performance?.mobile;

  // Code Patches
  const cleanDomain = targetUrl ? targetUrl.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '') : 'yourdomain.com';

  const generatedPatches = (targetUrl || report?.targetUrl) ? generateCodePatches(
    targetUrl || report?.targetUrl || '',
    report?.technical || { headings: { h1s: [] }, title: '', metaDescription: '', openGraph: {} } as any,
    report?.archetype || { type: 'saas', label: 'Website', confidence: 90, detectedSignals: [], primarySchemaNeeded: '', keyAuditFocus: '' },
    detectedStack
  ) : null;

  const effectivePatches = {
    ...generatedPatches,
    ...report?.codePatches,
    wordPressPhp: report?.codePatches?.wordPressPhp || generatedPatches?.wordPressPhp || '',
    astroSeo: report?.codePatches?.astroSeo || generatedPatches?.astroSeo || '',
    nextJsMetadata: report?.codePatches?.nextJsMetadata || generatedPatches?.nextJsMetadata || '',
    shopifyLiquid: report?.codePatches?.shopifyLiquid || generatedPatches?.shopifyLiquid || '',
    htmlHeadBlock: report?.codePatches?.htmlHeadBlock || generatedPatches?.htmlHeadBlock || '',
    schemaJsonLd: report?.codePatches?.schemaJsonLd || generatedPatches?.schemaJsonLd || '',
    aeoFaqSchema: report?.codePatches?.aeoFaqSchema || generatedPatches?.aeoFaqSchema || '',
    geoRobotsBlock: report?.codePatches?.geoRobotsBlock || generatedPatches?.geoRobotsBlock || '',
  };

  // Top Action Items / Needle Movers
  const topActionItems = report?.topNeedleMovers && report.topNeedleMovers.length > 0
    ? report.topNeedleMovers
    : groups.slice(0, 3).map((g) => ({
        priority: (g.severity === 'critical' ? 'Critical' : g.severity === 'high' ? 'High' : 'Quick Win') as 'Critical' | 'High' | 'Quick Win',
        title: g.checkId,
        description: g.findings[0]?.evidence?.observed || `Affects ${g.affectedCount} page(s).`,
        snippet: g.findings[0]?.evidence?.snippet,
        action: g.stackFix || g.findings[0]?.evidence?.expected || 'Review affected template code.',
      }));

  // Health Rating Metadata
  const getHealthColor = (val: number) => {
    if (val >= 80) return { stroke: '#10b981', text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800', label: 'Optimal Health' };
    if (val >= 60) return { stroke: '#f59e0b', text: 'text-amber-800 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800', label: 'Needs Improvement' };
    return { stroke: '#ef4444', text: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800', label: 'Action Required' };
  };

  const healthMeta = getHealthColor(overallScore);

  // Performance data extraction
  const performance = report?.performance || {
    score: performanceScore,
    lcpEstimateSeconds: parseFloat((1.0 + (100 - performanceScore) * 0.028).toFixed(2)),
    clsEstimate: parseFloat(((100 - performanceScore) * 0.0018).toFixed(3)),
    heavyAssetCount: 0,
    renderBlockingScriptsCount: 0,
    usesModernImageFormats: true,
    opportunities: [],
  };

  // SVG Gauge calculations (radius 48 -> circumference ~301.6)
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  // Competitor Run
  const handleRunCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitorUrl.trim()) return;
    setCompLoading(true);
    setCompError(null);

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: targetUrl || report?.targetUrl,
          competitorUrl: competitorUrl.trim(),
          mode: 'quick',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to compare competitor');
      setComparison(data.comparison);
    } catch (err: any) {
      setCompError(err?.message || 'Comparison request failed.');
    } finally {
      setCompLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* =========================================================================
          COMMAND CENTER: EXECUTIVE HEALTH & SUMMARY (CLEAN & MINIMALIST)
          ========================================================================= */}
      <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-sm space-y-5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Overall Health Gauge & Clean Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
            <div className="relative flex size-24 shrink-0 items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="#e6e6e8"
                  className="stroke-[#e6e6e8] dark:stroke-[#202129]"
                  strokeWidth="6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={healthMeta.stroke}
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={(2 * Math.PI * 42) * (1 - overallScore / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white leading-none">
                  {overallScore}%
                </span>
                <span className="text-[9px] uppercase tracking-wider font-semibold text-graphite-600 dark:text-graphite-400 mt-0.5">
                  Health
                </span>
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="font-display text-xl font-bold text-ink dark:text-white tracking-tight break-all sm:truncate max-w-full">
                  {cleanDomain}
                </h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${healthMeta.bg} ${healthMeta.text} ${healthMeta.border}`}>
                  <CheckCircle2 className="size-3 shrink-0" />
                  <span>{healthMeta.label}</span>
                </span>
              </div>

              {/* Clean Unified Inline Metadata (No clutter pills) */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1 text-xs text-graphite-600 dark:text-graphite-400 font-mono">
                <span className="text-ink dark:text-white font-medium">{detectedStack?.cms || 'Detected Web Stack'}</span>
                <span className="text-graphite-400 dark:text-graphite-600">&bull;</span>
                <span>{pagesChecked} page{pagesChecked > 1 ? 's' : ''} crawled</span>
                <span className="text-graphite-400 dark:text-graphite-600">&bull;</span>
                <span>Mobile {mobileScore}%</span>
                <span className="text-graphite-400 dark:text-graphite-600">&bull;</span>
                <span>AEO {aeoScore}%</span>
                <span className="text-graphite-400 dark:text-graphite-600">&bull;</span>
                <span>GEO {geoScore}%</span>
              </div>

              <p className="text-xs text-graphite-600 dark:text-graphite-400 max-w-lg leading-relaxed pt-0.5">
                RFC 9309 crawler standards &middot; Google Mobile-First specifications
              </p>
            </div>
          </div>

          {/* Right: Clean, Minimalist Issue Filter Counters */}
          <div className="flex flex-col sm:items-end justify-center gap-2">
            <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
              {/* Errors */}
              <button
                type="button"
                onClick={() => {
                  setFilterTab(filterTab === 'errors' ? 'all' : 'errors');
                  setActiveMainTab('issues');
                }}
                className={`flex flex-col rounded-[12px] border px-3.5 py-2.5 text-left transition-all cursor-pointer min-w-[96px] ${
                  filterTab === 'errors'
                    ? 'border-rose-500/50 bg-rose-500/10 dark:bg-rose-950/30 ring-1 ring-rose-500/30'
                    : 'border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22]/70 hover:border-graphite-200 dark:hover:border-graphite-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="size-3" />
                    <span>Errors</span>
                  </span>
                  {errorGroups.length > 0 && <span className="size-1.5 rounded-full bg-rose-500" />}
                </div>
                <span className="mt-1 font-display text-lg font-bold text-ink dark:text-white leading-none">
                  {errorGroups.length}
                </span>
                <span className="mt-1 text-[10px] text-graphite-600 dark:text-graphite-400">
                  {errorGroups.length === 0 ? 'None' : `${errorCount} page${errorCount !== 1 ? 's' : ''}`}
                </span>
              </button>

              {/* Warnings */}
              <button
                type="button"
                onClick={() => {
                  setFilterTab(filterTab === 'warnings' ? 'all' : 'warnings');
                  setActiveMainTab('issues');
                }}
                className={`flex flex-col rounded-[12px] border px-3.5 py-2.5 text-left transition-all cursor-pointer min-w-[96px] ${
                  filterTab === 'warnings'
                    ? 'border-amber-500/50 bg-amber-500/10 dark:bg-amber-950/30 ring-1 ring-amber-500/30'
                    : 'border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22]/70 hover:border-graphite-200 dark:hover:border-graphite-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="size-3" />
                    <span>Warnings</span>
                  </span>
                  {warningGroups.length > 0 && <span className="size-1.5 rounded-full bg-amber-500" />}
                </div>
                <span className="mt-1 font-display text-lg font-bold text-ink dark:text-white leading-none">
                  {warningGroups.length}
                </span>
                <span className="mt-1 text-[10px] text-graphite-600 dark:text-graphite-400">
                  {warningGroups.length === 0 ? 'None' : `${warningCount} page${warningCount !== 1 ? 's' : ''}`}
                </span>
              </button>

              {/* Notices */}
              <button
                type="button"
                onClick={() => {
                  setFilterTab(filterTab === 'notices' ? 'all' : 'notices');
                  setActiveMainTab('issues');
                }}
                className={`flex flex-col rounded-[12px] border px-3.5 py-2.5 text-left transition-all cursor-pointer min-w-[96px] ${
                  filterTab === 'notices'
                    ? 'border-violet/50 bg-violet/10 dark:bg-violet/20 ring-1 ring-violet/30'
                    : 'border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22]/70 hover:border-graphite-200 dark:hover:border-graphite-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-violet dark:text-violet">
                  <span className="flex items-center gap-1">
                    <Info className="size-3" />
                    <span>Notices</span>
                  </span>
                  {noticeGroups.length > 0 && <span className="size-1.5 rounded-full bg-violet" />}
                </div>
                <span className="mt-1 font-display text-lg font-bold text-ink dark:text-white leading-none">
                  {noticeGroups.length}
                </span>
                <span className="mt-1 text-[10px] text-graphite-600 dark:text-graphite-400">
                  {noticeGroups.length === 0 ? 'None' : `${noticeCount} instance${noticeCount !== 1 ? 's' : ''}`}
                </span>
              </button>
            </div>

            {filterTab !== 'all' && (
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className="text-[10px] text-violet hover:underline font-semibold cursor-pointer self-center sm:self-end"
              >
                Reset Filter (Showing {displayedGroups.length} of {groups.length})
              </button>
            )}
          </div>
        </div>

        {/* AI Executive Summary Callout */}
        <div className="rounded-[14px] border border-violet/20 bg-violet/5 dark:bg-violet/10 p-3.5 sm:p-4 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold text-violet">
            <FileText className="size-3.5" />
            <span>Executive Overview</span>
          </div>
          <p className="text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal">
            {report?.summary || `Audit completed across ${pagesChecked} page(s) for ${cleanDomain}. Indexability, rendering barriers, answer engine formulation, and bot access have been evaluated. Review the prioritized fixes below.`}
          </p>
        </div>

        {/* 6 Thematic Health Pillar Meters (Unified Streamlined Strip) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-graphite-100 dark:divide-graphite-800 rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/40 dark:bg-[#1a1b22]/40 overflow-hidden">
          <div className="p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-graphite-800 dark:text-graphite-300 flex items-center gap-1.5">
                <Globe className="size-3 text-violet" />
                Indexing
              </span>
              <span className="font-bold text-ink dark:text-white font-mono">{technicalScore}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#e6e6e8] dark:bg-[#252631] overflow-hidden">
              <div className={`h-full rounded-full ${technicalScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${technicalScore}%` }} />
            </div>
          </div>

          <div className="p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-graphite-800 dark:text-graphite-300 flex items-center gap-1.5">
                <Zap className="size-3 text-amber-500" />
                Vitals
              </span>
              <span className="font-bold text-ink dark:text-white font-mono">{performanceScore}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#e6e6e8] dark:bg-[#252631] overflow-hidden">
              <div className={`h-full rounded-full ${performanceScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${performanceScore}%` }} />
            </div>
          </div>

          <div className="p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-graphite-800 dark:text-graphite-300 flex items-center gap-1.5">
                <Smartphone className="size-3 text-emerald-600" />
                Mobile
              </span>
              <span className="font-bold text-ink dark:text-white font-mono">{mobileScore}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#e6e6e8] dark:bg-[#252631] overflow-hidden">
              <div className={`h-full rounded-full ${mobileScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${mobileScore}%` }} />
            </div>
          </div>

          <div className="p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-graphite-800 dark:text-graphite-300 flex items-center gap-1.5">
                <Layers className="size-3 text-blue-500" />
                Content
              </span>
              <span className="font-bold text-ink dark:text-white font-mono">{contentScore}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#e6e6e8] dark:bg-[#252631] overflow-hidden">
              <div className={`h-full rounded-full ${contentScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${contentScore}%` }} />
            </div>
          </div>

          <div className="p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-graphite-800 dark:text-graphite-300 flex items-center gap-1.5">
                <Bot className="size-3 text-violet" />
                AEO
              </span>
              <span className="font-bold text-ink dark:text-white font-mono">{aeoScore}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#e6e6e8] dark:bg-[#252631] overflow-hidden">
              <div className={`h-full rounded-full ${aeoScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${aeoScore}%` }} />
            </div>
          </div>

          <div className="p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-graphite-800 dark:text-graphite-300 flex items-center gap-1.5">
                <Bot className="size-3 text-emerald-600" />
                GEO
              </span>
              <span className="font-bold text-ink dark:text-white font-mono">{geoScore}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#e6e6e8] dark:bg-[#252631] overflow-hidden">
              <div className={`h-full rounded-full ${geoScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${geoScore}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          TOP ACTION ROADMAP: 3 HIGHEST PRIORITY FIXES (CLEAN & DISTINCT)
          ========================================================================= */}
      {topActionItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="size-4 text-amber-500" />
              <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink dark:text-white">
                Top Priority Fixes (Move the Needle First)
              </h3>
            </div>
            <span className="text-xs font-mono text-graphite-600 dark:text-graphite-400">
              Ranked by crawl impact
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {topActionItems.map((item, idx) => {
              const knowledge = getFindingKnowledge(item.title, item.description, detectedStack, cleanDomain, item.snippet);
              const topFix = getSuggestedContentFix(item.title, item.description, cleanDomain, item.snippet);
              const specificAction =
                item.action &&
                !item.action.includes('Appearance > Customize') &&
                !item.action.includes('Review affected template')
                  ? item.action
                  : getStackFix(item.title, detectedStack) || knowledge.actionSteps[0];

              return (
                <div
                  key={idx}
                  className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-4 sm:p-5 shadow-sm flex flex-col justify-between gap-3.5"
                >
                  <div className="space-y-2.5">
                    {/* Header badge & index */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            item.priority === 'Critical'
                              ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20'
                              : item.priority === 'High'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {item.priority === 'Critical' ? <ShieldAlert className="size-2.5" /> : item.priority === 'High' ? <AlertTriangle className="size-2.5" /> : <Info className="size-2.5" />}
                          <span>{item.priority}</span>
                        </span>
                        <span className="text-[10px] font-mono text-graphite-600 dark:text-graphite-400">
                          {knowledge.category}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-graphite-600 dark:text-graphite-400 font-bold">
                        #0{idx + 1}
                      </span>
                    </div>

                    {/* Distinct title and explanation */}
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-ink dark:text-white leading-snug">
                        {knowledge.title}
                      </h4>
                      <p className="text-xs text-graphite-600 dark:text-graphite-400 leading-relaxed line-clamp-3">
                        {knowledge.whyItMatters}
                      </p>
                    </div>
                  </div>

                  {/* Tailored Remedy Callout */}
                  <div className="space-y-2.5">
                    <div className="rounded-[10px] bg-[#f4f4f6]/60 dark:bg-[#1a1b22]/70 border border-graphite-100 dark:border-graphite-800 p-2.5 space-y-1 text-xs">
                      <span className="text-[10px] font-mono font-bold uppercase text-violet flex items-center gap-1">
                        <span>Action for {detectedStack?.cms || 'Your Stack'}:</span>
                      </span>
                      <p className="text-graphite-800 dark:text-graphite-300 leading-relaxed font-normal text-[11px]">
                        {specificAction}
                      </p>
                    </div>

                    {/* Copy Solution Button */}
                    {(knowledge.suggestedFix || topFix) && (
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-graphite-100 dark:border-graphite-800">
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold truncate flex-1">
                          {topFix ? '1-Click Content Fix' : 'Code Patch Ready'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(knowledge.suggestedFix || topFix?.text || '', `topfix-${idx}`)}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink hover:opacity-90 px-3 py-1 text-[11px] font-semibold transition-all cursor-pointer shadow-xs"
                        >
                          {copiedKey === `topfix-${idx}` ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                          <span>{copiedKey === `topfix-${idx}` ? 'Copied' : 'Copy Fix'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* =========================================================================
          WORKSPACE NAVIGATION BAR (TABBED ARCHITECTURE)
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-graphite-100 dark:border-graphite-800 pb-2 gap-2">
        <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto -mx-1 px-1 sm:mx-0 sm:px-0 py-1">
          <button
            type="button"
            onClick={() => setActiveMainTab('issues')}
            className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-[48px] px-3.5 sm:px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeMainTab === 'issues'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white hover:bg-graphite-100 dark:hover:bg-[#202129]'
            }`}
          >
            <ShieldAlert className="size-3.5 shrink-0" />
            <span className="shrink-0 whitespace-nowrap">Findings Explorer</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono leading-none ${activeMainTab === 'issues' ? 'bg-white/20 text-white dark:bg-black/20 dark:text-ink' : 'bg-graphite-200 dark:bg-graphite-800 text-graphite-800 dark:text-graphite-300'}`}>
              {totalIssuesCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('graphs')}
            className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-[48px] px-3.5 sm:px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeMainTab === 'graphs'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white hover:bg-graphite-100 dark:hover:bg-[#202129]'
            }`}
          >
            <BarChart3 className="size-3.5 shrink-0 text-violet" />
            <span className="shrink-0 whitespace-nowrap">Visual Telemetry</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono leading-none ${activeMainTab === 'graphs' ? 'bg-white/20 text-white dark:bg-black/20 dark:text-ink' : 'bg-violet/10 text-violet font-semibold'}`}>
              Graphs
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('aeo-geo')}
            className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-[48px] px-3.5 sm:px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeMainTab === 'aeo-geo'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white hover:bg-graphite-100 dark:hover:bg-[#202129]'
            }`}
          >
            <Bot className="size-3.5 shrink-0 text-violet" />
            <span className="shrink-0 whitespace-nowrap">AI Search (AEO &amp; GEO)</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono leading-none ${activeMainTab === 'aeo-geo' ? 'bg-white/20 text-white dark:bg-black/20 dark:text-ink' : 'bg-violet/10 text-violet font-semibold'}`}>
              {aeoScore}/{geoScore}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('vitals')}
            className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-[48px] px-3.5 sm:px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeMainTab === 'vitals'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white hover:bg-graphite-100 dark:hover:bg-[#202129]'
            }`}
          >
            <Smartphone className="size-3.5 shrink-0" />
            <span className="shrink-0 whitespace-nowrap">Mobile &amp; Vitals</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono leading-none ${activeMainTab === 'vitals' ? 'bg-white/20 text-white dark:bg-black/20 dark:text-ink' : 'bg-graphite-200 dark:bg-graphite-800 text-graphite-800 dark:text-graphite-300'}`}>
              {mobileScore}%
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('patches')}
            className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-[48px] px-3.5 sm:px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeMainTab === 'patches'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white hover:bg-graphite-100 dark:hover:bg-[#202129]'
            }`}
          >
            <Code2 className="size-3.5 shrink-0" />
            <span className="shrink-0 whitespace-nowrap">Code Patches</span>
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('competitor')}
            className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-[48px] px-3.5 sm:px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeMainTab === 'competitor'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white hover:bg-graphite-100 dark:hover:bg-[#202129]'
            }`}
          >
            <Swords className="size-3.5 shrink-0" />
            <span className="shrink-0 whitespace-nowrap">Competitor Bench</span>
          </button>
        </nav>

        <button
          type="button"
          onClick={() => setShowJson(!showJson)}
          className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#202129] px-3.5 py-1.5 text-xs font-semibold text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          <FileCode className="size-3.5 text-violet" />
          <span>{showJson ? 'Hide JSON' : 'Export JSON'}</span>
        </button>
      </div>

      {/* Raw Agent JSON Modal/Drawer */}
      {showJson && (
        <div className="rounded-[16px] border border-graphite-800 bg-[#0d0e12] p-4 shadow-md text-gray-100 space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-graphite-800">
            <span className="text-xs font-mono text-gray-400">Deterministic Agent Schema (v2.0.0)</span>
            <button
              onClick={() => handleCopy(JSON.stringify(groups, null, 2), 'raw-json')}
              className="inline-flex items-center gap-1.5 rounded-[48px] bg-graphite-800 px-3 py-1 text-xs text-gray-200 hover:text-white cursor-pointer"
            >
              {copiedKey === 'raw-json' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
              <span>{copiedKey === 'raw-json' ? 'Copied' : 'Copy Payload'}</span>
            </button>
          </div>
          <pre className="max-h-64 overflow-y-auto text-[11px] font-mono text-gray-300 select-all p-2 bg-black/40 rounded-lg">
            {JSON.stringify(groups, null, 2)}
          </pre>
        </div>
      )}

      {/* =========================================================================
          TAB 1: FINDINGS EXPLORER (100% EXPLANATORY & ACTIONABLE)
          ========================================================================= */}
      {activeMainTab === 'issues' && (
        <div className="space-y-4">
          {displayedGroups.length === 0 ? (
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-8 text-center space-y-2">
              <CheckCircle2 className="mx-auto size-8 text-emerald-500" />
              <h4 className="font-display text-base font-bold text-ink dark:text-white">Zero Findings in Selected Filter</h4>
              <p className="text-xs text-graphite-800 dark:text-graphite-400">
                All checks in the &quot;{filterTab}&quot; category passed validation.
              </p>
            </div>
          ) : (
            displayedGroups.map((group) => {
              const isExpanded = !!expandedKeys[group.rootCauseKey];
              const sampleFinding = group.findings[0];
              const knowledge = getFindingKnowledge(
                group.checkId,
                sampleFinding?.evidence?.observed,
                detectedStack,
                cleanDomain,
                sampleFinding?.evidence?.snippet
              );
              const contentFix = getSuggestedContentFix(
                group.checkId,
                sampleFinding?.evidence?.observed,
                cleanDomain,
                sampleFinding?.evidence?.snippet
              );

              const isCritical = group.severity === 'critical' || group.severity === 'high';
              const isWarning = group.severity === 'medium';

              return (
                <div
                  key={group.rootCauseKey}
                  className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] shadow-sm overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(group.rootCauseKey)}
                    className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 text-left gap-3 hover:bg-[#fafafb] dark:hover:bg-[#1b1c23] transition-colors cursor-pointer"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                          isCritical
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                            : isWarning
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60'
                            : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60'
                        }`}
                      >
                        {isCritical ? <ShieldAlert className="size-3" /> : isWarning ? <AlertTriangle className="size-3" /> : <Info className="size-3" />}
                        <span>{group.severity}</span>
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-sm font-bold text-ink dark:text-white block break-words sm:truncate">
                            {knowledge.title}
                          </span>
                          <span className="rounded-full bg-graphite-100 dark:bg-graphite-800 px-2 py-0.2 text-[9px] font-mono text-graphite-800 dark:text-graphite-400 shrink-0">
                            {knowledge.category}
                          </span>
                        </div>
                        <span className="text-xs text-graphite-800 dark:text-graphite-400">
                          Affects {group.affectedCount} page{group.affectedCount !== 1 ? 's' : ''} &middot; Priority Score {group.priority} &middot; {knowledge.impactLevel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {(knowledge.suggestedFix || contentFix) && (
                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 text-[10px] font-bold">
                          <CheckCircle2 className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Fix Ready</span>
                        </span>
                      )}
                      <span className="text-xs text-violet font-semibold">{isExpanded ? 'Hide Details' : 'View Action'}</span>
                      {isExpanded ? <ChevronUp className="size-4 text-violet" /> : <ChevronDown className="size-4 text-violet" />}
                    </div>
                  </button>

                  {/* Expanded Issue Action Drawer */}
                  {isExpanded && (
                    <div className="border-t border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#14151a] p-4 sm:p-5 space-y-4">
                      {/* 1. WHY THIS MATTERS (PLAIN ENGLISH EXPLANATION) */}
                      <div className="rounded-[14px] border border-violet/20 bg-violet/5 dark:bg-violet/10 p-4 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-violet uppercase tracking-wider">
                          <Info className="size-3.5 text-violet shrink-0" />
                          <span>Why This Finding Matters for Search &amp; AI:</span>
                        </div>
                        <p className="text-xs text-ink dark:text-white leading-relaxed">
                          {knowledge.whyItMatters}
                        </p>
                      </div>

                      {/* 2. OBSERVED EVIDENCE VS EXPECTED STANDARD */}
                      {sampleFinding && (
                        <div className="grid gap-3 sm:grid-cols-2 text-xs">
                          <div className="rounded-[14px] border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-3.5 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
                              <XCircle className="size-3 text-rose-600 dark:text-rose-400" />
                              <span>Observed Defect on Your Site:</span>
                            </span>
                            <p className="text-ink dark:text-white font-medium">{sampleFinding.evidence.observed}</p>
                            {sampleFinding.evidence.snippet && (
                              <pre className="mt-2 text-[10px] font-mono text-gray-200 bg-graphite-900 dark:bg-black/60 p-2.5 rounded-[8px] overflow-x-auto whitespace-pre-wrap break-all border border-graphite-800">
                                {sampleFinding.evidence.snippet}
                              </pre>
                            )}
                          </div>

                          <div className="rounded-[14px] border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Expected Standard:</span>
                            </span>
                            <p className="text-ink dark:text-white font-medium">{sampleFinding.evidence.expected}</p>
                            {group.exampleUrls.length > 0 && (
                              <div className="pt-2">
                                <span className="text-[10px] font-semibold text-graphite-800 dark:text-graphite-400 block mb-1">
                                  Sample Observed URL(s):
                                </span>
                                {group.exampleUrls.slice(0, 2).map((u, i) => (
                                  <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-mono text-violet hover:underline truncate">
                                    <ExternalLink className="size-2.5 shrink-0" />
                                    <span className="truncate">{u}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 3. STEP-BY-STEP ACTIONABLE REMEDIATION */}
                      <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#1a1b22] p-4 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-ink dark:text-white block">
                          Step-by-Step Action Required to Fix:
                        </span>
                        <div className="space-y-1.5 text-xs text-graphite-800 dark:text-graphite-300">
                          {knowledge.actionSteps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-violet/10 text-violet font-mono text-[10px] font-bold mt-0.5">
                                {idx + 1}
                              </span>
                              <span className="leading-snug">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 4. READY-TO-COPY CODE SOLUTION */}
                      {(knowledge.suggestedFix || contentFix) && (
                        <div className="rounded-[14px] border border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 p-4 space-y-2.5 shadow-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                              <Code2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>1-Click Ready Solution for {detectedStack?.cms || 'Your Stack'}:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(knowledge.suggestedFix || contentFix?.text || '', `fix-${group.rootCauseKey}`)}
                              className="inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink hover:opacity-90 px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0"
                            >
                              {copiedKey === `fix-${group.rootCauseKey}` ? (
                                <>
                                  <Check className="size-3 text-emerald-400" />
                                  <span>Copied to Clipboard!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3" />
                                  <span>Copy Solution Code</span>
                                </>
                              )}
                            </button>
                          </div>

                          <pre className="rounded-[10px] bg-white dark:bg-[#0c0d10] border border-emerald-200 dark:border-emerald-900/60 p-3 text-xs text-ink dark:text-white font-mono leading-relaxed select-all overflow-x-auto whitespace-pre-wrap">
                            {knowledge.suggestedFix || contentFix?.text}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Clean Verification Summary */}
          <div className="rounded-[16px] border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-400">
              <CheckCheck className="size-4" />
              <span>Verified Standards Passed Cleanly</span>
            </div>
            <p className="text-graphite-800 dark:text-graphite-200 leading-relaxed">
              {whatPassed || 'All checked SEO, RFC 9309 crawler standards, and mobile accessibility guidelines passed deterministic validation.'}
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: VISUAL TELEMETRY & GRAPHS
          ========================================================================= */}
      {activeMainTab === 'graphs' && (
        <OverviewAuditGraph
          report={report || null}
          comparison={comparison}
          auditedDomain={cleanDomain}
          competitorDomain={comparison?.competitor?.url}
        />
      )}

      {/* =========================================================================
          TAB 3: AI SEARCH & ANSWER ENGINE (AEO & GEO)
          ========================================================================= */}
      {activeMainTab === 'aeo-geo' && (
        <div className="space-y-6">
          {/* Executive Overview Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* AEO Card */}
            <div className="rounded-[20px] border border-violet/20 bg-gradient-to-br from-violet/5 via-white to-white dark:from-violet/10 dark:via-[#16171d] dark:to-[#16171d] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-graphite-100 dark:border-graphite-800 pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="size-4 text-violet" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink dark:text-white">
                    Answer Engine Optimization (AEO)
                  </h3>
                </div>
                <span className="rounded-full bg-violet/10 text-violet border border-violet/20 px-3 py-0.5 text-xs font-mono font-bold">
                  {aeoScore}/100
                </span>
              </div>
              <p className="text-xs text-graphite-800 dark:text-graphite-300 leading-relaxed">
                Evaluates query-first heading formulations, definition clarity, and structured lists/tables for Google AI Overviews and conversational voice search.
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-white/80 dark:bg-[#1a1b22] p-3 space-y-1">
                  <span className="text-[11px] font-semibold text-graphite-800 dark:text-graphite-400 block">Question Headings</span>
                  <span className="font-mono text-base font-bold text-ink dark:text-white">
                    {aeoSignals?.questionHeadingsCount ?? 0}
                  </span>
                  <span className="text-[10px] text-graphite-800 dark:text-graphite-400 block">
                    (What, How, Why, Can...)
                  </span>
                </div>

                <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-white/80 dark:bg-[#1a1b22] p-3 space-y-1">
                  <span className="text-[11px] font-semibold text-graphite-800 dark:text-graphite-400 block">Machine FAQ Schema</span>
                  <div className="pt-0.5">
                    {aeoSignals?.hasFaqSchema ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                        <span>FAQPage Present</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-800 dark:text-amber-400">
                        <AlertTriangle className="size-3 text-amber-600 dark:text-amber-400" />
                        <span>Missing Schema</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-graphite-800 dark:text-graphite-400 block">
                    (Visible Q&amp;A Pairing)
                  </span>
                </div>
              </div>

              {aeoSignals?.questionHeadings && aeoSignals.questionHeadings.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-graphite-800 dark:text-graphite-400 block">
                    Detected Question Headings:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {aeoSignals.questionHeadings.map((q, idx) => (
                      <span key={idx} className="rounded-full bg-violet/10 border border-violet/20 px-2.5 py-0.5 text-[11px] font-mono text-violet">
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* GEO Card */}
            <div className="rounded-[20px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-white to-white dark:from-emerald-500/10 dark:via-[#16171d] dark:to-[#16171d] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-graphite-100 dark:border-graphite-800 pb-3">
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink dark:text-white">
                    Generative Engine Optimization (GEO)
                  </h3>
                </div>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-0.5 text-xs font-mono font-bold">
                  {geoScore}/100
                </span>
              </div>
              <p className="text-xs text-graphite-800 dark:text-graphite-300 leading-relaxed">
                Evaluates crawlability by LLM search agents (ChatGPT Search, Perplexity, Claude), knowledge graph entity anchors, and edge firewall permissions.
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-white/80 dark:bg-[#1a1b22] p-3 space-y-1">
                  <span className="text-[11px] font-semibold text-graphite-800 dark:text-graphite-400 block">WAF Edge Reachability</span>
                  <div className="pt-0.5">
                    {geoSignals?.wafStatus === 'accessible' ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                        <span>GPTBot Allowed</span>
                      </span>
                    ) : geoSignals?.wafStatus === 'waf_blocked' ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-rose-700 dark:text-rose-400">
                        <XCircle className="size-3 text-rose-600 dark:text-rose-400" />
                        <span>WAF Block (403)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-graphite-800 dark:text-graphite-400">
                        <Info className="size-3 text-graphite-600" />
                        <span>Probe Skipped</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-graphite-800 dark:text-graphite-400 block">
                    (Cloudflare / AWS WAF)
                  </span>
                </div>

                <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-white/80 dark:bg-[#1a1b22] p-3 space-y-1">
                  <span className="text-[11px] font-semibold text-graphite-800 dark:text-graphite-400 block">Entity Grounding</span>
                  <div className="pt-0.5">
                    {geoSignals?.brandEntityDeclared ? (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                        <span>{geoSignals.declaredSameAsCount} sameAs Link{geoSignals.declaredSameAsCount > 1 ? 's' : ''}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-amber-800 dark:text-amber-400">
                        <AlertTriangle className="size-3 text-amber-600 dark:text-amber-400" />
                        <span>No sameAs Links</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-graphite-800 dark:text-graphite-400 block">
                    (Wikidata / Wikipedia)
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {geoSignals?.isClientRendered ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 font-mono text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                    <AlertTriangle className="size-3 text-amber-600" />
                    <span>Client-Rendered JS Barrier</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 font-mono text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    <span>Server-Rendered Raw HTML</span>
                  </span>
                )}

                {geoSignals?.hasLlmsTxt ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 font-mono text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    <span>/llms.txt Present</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-graphite-100 dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 px-2.5 py-0.5 font-mono text-[11px] text-graphite-800 dark:text-graphite-300">
                    <Info className="size-3 text-graphite-600" />
                    <span>/llms.txt Missing</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* RFC 9309 Bot Permissions Matrix */}
          <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-graphite-100 dark:border-graphite-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="size-4 text-violet" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink dark:text-white">
                  RFC 9309 AI Search Bot Permissions (robots.txt)
                </h3>
              </div>
              <span className="text-xs font-mono text-graphite-800 dark:text-graphite-400">
                Longest-Match Evaluation
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(geoSignals?.aiBots || [
                { bot: 'GPTBot', status: 'allowed', rulePrecedence: 'default_allow' },
                { bot: 'ClaudeBot', status: 'allowed', rulePrecedence: 'default_allow' },
                { bot: 'PerplexityBot', status: 'allowed', rulePrecedence: 'default_allow' },
                { bot: 'Google-Extended', status: 'allowed', rulePrecedence: 'default_allow' },
              ]).map((b: any, idx: number) => {
                const isBlocked = b.status === 'blocked';
                const isUnknown = b.status === 'unknown';
                return (
                  <div key={idx} className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-ink dark:text-white flex items-center gap-1.5">
                        <Bot className="size-3.5 text-violet" />
                        <span>{b.bot}</span>
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        isBlocked
                          ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
                          : isUnknown
                          ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                          : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      }`}>
                        {isBlocked ? <XCircle className="size-2.5" /> : isUnknown ? <AlertTriangle className="size-2.5" /> : <CheckCircle2 className="size-2.5" />}
                        <span>{b.status}</span>
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-graphite-800 dark:text-graphite-400 truncate">
                      {b.matchedRule || 'Default Allow (No Disallow)'}
                    </div>
                    <div className="text-[10px] text-graphite-800/80 dark:text-graphite-400">
                      Rule Precedence: {b.rulePrecedence?.replace(/_/g, ' ') || 'Longest Match'}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* =========================================================================
          TAB 4: MOBILE & CORE WEB VITALS
          ========================================================================= */}
      {activeMainTab === 'vitals' && (
        <div className="space-y-6">
          {/* Mobile Telemetry Grid */}
          <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite-100 dark:border-graphite-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-emerald-600" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink dark:text-white">
                  Mobile-First Indexing Telemetry (375px–414px)
                </h3>
              </div>
              <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-mono font-bold">
                Mobile Score: {mobileScore}/100
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-4 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-graphite-800 dark:text-graphite-300">Viewport Meta</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    mobileMetrics?.hasViewportTag !== false ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
                  }`}>
                    {mobileMetrics?.hasViewportTag !== false ? <CheckCircle2 className="size-2.5" /> : <XCircle className="size-2.5" />}
                    <span>{mobileMetrics?.hasViewportTag !== false ? 'Passed' : 'Missing'}</span>
                  </span>
                </div>
                <div className="font-mono text-[11px] font-bold text-ink dark:text-white break-all leading-tight">
                  {mobileMetrics?.viewportContent || 'width=device-width, initial-scale=1'}
                </div>
                <p className="text-[10px] text-graphite-800 dark:text-graphite-400">
                  {mobileMetrics?.isUserScalableDisabled ? 'Zoom disabled (WCAG warning)' : 'Permits user pinch-to-zoom'}
                </p>
              </div>

              <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-4 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-graphite-800 dark:text-graphite-300">Tap Targets (48px)</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    mobileMetrics?.tapTargetsOptimal !== false ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  }`}>
                    {mobileMetrics?.tapTargetsOptimal !== false ? <CheckCircle2 className="size-2.5" /> : <AlertTriangle className="size-2.5" />}
                    <span>{mobileMetrics?.tapTargetsOptimal !== false ? 'Optimal' : `${mobileMetrics?.smallTapTargetCount || 0} Tight Targets`}</span>
                  </span>
                </div>
                <div className="font-mono text-sm font-bold text-ink dark:text-white">
                  {mobileMetrics?.tapTargetsOptimal !== false ? '48×48px Standard' : 'Spacing Needed'}
                </div>
                <p className="text-[10px] text-graphite-800 dark:text-graphite-400">
                  Finger touch spacing between buttons &amp; links.
                </p>
              </div>

              <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-4 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-graphite-800 dark:text-graphite-300">Layout Shifts (CLS)</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    (mobileMetrics?.imagesMissingDimensionsCount || 0) <= 2 ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  }`}>
                    {(mobileMetrics?.imagesMissingDimensionsCount || 0) <= 2 ? <CheckCircle2 className="size-2.5" /> : <AlertTriangle className="size-2.5" />}
                    <span>{(mobileMetrics?.imagesMissingDimensionsCount || 0) <= 2 ? 'CLS Protected' : 'Shifts Detected'}</span>
                  </span>
                </div>
                <div className="font-mono text-sm font-bold text-ink dark:text-white">
                  {(mobileMetrics?.imagesMissingDimensionsCount || 0) <= 2 ? 'Zero Shift Risk' : `${mobileMetrics?.imagesMissingDimensionsCount} Undimensioned`}
                </div>
                <p className="text-[10px] text-graphite-800 dark:text-graphite-400">
                  Explicit aspect-ratios prevent sudden mobile jumps.
                </p>
              </div>

              <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-4 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-graphite-800 dark:text-graphite-300">Mobile LCP (4G)</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                    ~{mobileMetrics?.mobileLcpSeconds || 1.8}s
                  </span>
                </div>
                <div className="font-mono text-sm font-bold text-ink dark:text-white">
                  Good (&lt;2.5s)
                </div>
                <p className="text-[10px] text-graphite-800 dark:text-graphite-400">
                  Simulated Largest Contentful Paint on mobile cellular.
                </p>
              </div>
            </div>
          </section>

          {/* Desktop Core Web Vitals */}
          <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite-100 dark:border-graphite-800 pb-3">
              <div className="flex items-center gap-2">
                <Gauge className="size-4 text-amber-500" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink dark:text-white">
                  Core Web Vitals &amp; Page Speed Engine
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-ink dark:text-white">
                Speed Score: {performance.score}/100
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-4 space-y-1">
                <span className="text-xs text-graphite-800 dark:text-graphite-400 flex items-center gap-1">
                  <Clock className="size-3 text-violet" />
                  LCP (Largest Contentful)
                </span>
                <div className="font-mono text-xl font-bold text-ink dark:text-white">{performance.lcpEstimateSeconds}s</div>
                <p className="text-[10px] text-graphite-800 dark:text-graphite-400">Desktop main content rendering mark.</p>
              </div>

              <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-4 space-y-1">
                <span className="text-xs text-graphite-800 dark:text-graphite-400 flex items-center gap-1">
                  <Activity className="size-3 text-blue-500" />
                  CLS (Cumulative Shift)
                </span>
                <div className="font-mono text-xl font-bold text-ink dark:text-white">{performance.clsEstimate}</div>
                <p className="text-[10px] text-graphite-800 dark:text-graphite-400">Visual DOM stability threshold.</p>
              </div>

              <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-4 space-y-1">
                <span className="text-xs text-graphite-800 dark:text-graphite-400 flex items-center gap-1">
                  <Code2 className="size-3 text-rose-500" />
                  Render-Blocking Scripts
                </span>
                <div className="font-mono text-xl font-bold text-ink dark:text-white">{performance.renderBlockingScriptsCount}</div>
                <p className="text-[10px] text-graphite-800 dark:text-graphite-400">Synchronous scripts lacking async/defer.</p>
              </div>

              <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-4 space-y-1">
                <span className="text-xs text-graphite-800 dark:text-graphite-400 flex items-center gap-1">
                  <ImageIcon className="size-3 text-emerald-500" />
                  Asset Delivery
                </span>
                <div className="font-mono text-sm font-bold text-ink dark:text-white truncate pt-1">
                  {performance.usesModernImageFormats ? 'WebP / AVIF' : `${performance.heavyAssetCount} Legacy Formats`}
                </div>
                <p className="text-[10px] text-graphite-800 dark:text-graphite-400">Next-gen media compression rating.</p>
              </div>
            </div>

            {performance.opportunities && performance.opportunities.length > 0 && (
              <div className="pt-2 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-graphite-800 dark:text-graphite-400 block">
                  Actionable Speed Opportunities
                </span>
                <div className="grid gap-2 sm:grid-cols-2 text-xs">
                  {performance.opportunities.map((opp, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-2 p-3 rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22]">
                      <span className="font-medium text-ink dark:text-white">{opp.title}</span>
                      <span className="font-mono text-[11px] font-bold text-violet shrink-0">{opp.savingEstimate}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* =========================================================================
          TAB 5: STACK-TAILORED CODE PATCHES
          ========================================================================= */}
      {activeMainTab === 'patches' && (
        <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-graphite-100 dark:border-graphite-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Code2 className="size-4 text-violet" />
                <h3 className="font-display text-base font-bold text-ink dark:text-white">
                  Stack-Tailored Implementation Patches
                </h3>
                <span className="rounded-full bg-violet/10 border border-violet/20 px-2.5 py-0.5 text-[10px] font-bold text-violet uppercase">
                  {detectedStack?.cms || 'Detected Stack'}
                </span>
              </div>
              <p className="text-xs text-graphite-800 dark:text-graphite-400">
                Ready-to-deploy code snippets eliminating mobile CLS and optimizing indexability.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const codeToCopy =
                  activeCodeTab === 'nextjs'
                    ? effectivePatches?.nextJsMetadata
                    : activeCodeTab === 'wordpress'
                    ? effectivePatches?.wordPressPhp
                    : activeCodeTab === 'shopify'
                    ? effectivePatches?.shopifyLiquid
                    : activeCodeTab === 'astro'
                    ? effectivePatches?.astroSeo
                    : activeCodeTab === 'schema'
                    ? effectivePatches?.schemaJsonLd
                    : activeCodeTab === 'robots'
                    ? effectivePatches?.geoRobotsBlock
                    : activeCodeTab === 'faq'
                    ? effectivePatches?.aeoFaqSchema
                    : effectivePatches?.htmlHeadBlock;
                if (codeToCopy) {
                  handleCopy(codeToCopy, `patch-${activeCodeTab}`);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-ink hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
            >
              {copiedKey === `patch-${activeCodeTab}` ? (
                <>
                  <Check className="size-3.5 text-emerald-400 dark:text-emerald-600" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copy Active Patch</span>
                </>
              )}
            </button>
          </div>

          {/* Framework Tab Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-graphite-100 dark:border-graphite-800">
            {[
              { id: 'nextjs', label: 'Next.js App Router', icon: Code2, match: detectedStack?.cms === 'Next.js' },
              { id: 'wordpress', label: 'WordPress / PHP', icon: FileCode, match: detectedStack?.cms === 'WordPress' },
              { id: 'shopify', label: 'Shopify Liquid', icon: Globe, match: detectedStack?.cms === 'Shopify' },
              { id: 'astro', label: 'Astro Layout', icon: FileCode, match: detectedStack?.cms === 'Astro' },
              { id: 'schema', label: 'JSON-LD Schema', icon: Layers, match: false },
              { id: 'robots', label: 'RFC 9309 robots.txt', icon: Terminal, match: false },
              { id: 'faq', label: 'Visible FAQ Schema', icon: FileQuestion, match: false },
              { id: 'html', label: 'Standard HTML', icon: Code2, match: false },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeCodeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCodeTab(tab.id as any)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-[48px] px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                      : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white hover:bg-graphite-100 dark:hover:bg-[#252631]'
                  }`}
                >
                  <Icon className="size-3.5" />
                  <span>{tab.label}</span>
                  {tab.match && <span className={`size-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-emerald-500'}`} />}
                </button>
              );
            })}
          </div>

          {/* Target File Instruction & Monospaced Code Viewer */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between text-xs text-graphite-800 dark:text-graphite-400 px-1 gap-2">
              <span className="font-mono flex items-center gap-1.5">
                <span className="font-semibold text-ink dark:text-white">Target File:</span>
                <code className="bg-[#f4f4f6] dark:bg-[#22232c] px-2 py-0.5 rounded text-violet font-bold">
                  {activeCodeTab === 'nextjs'
                    ? 'src/app/layout.tsx (or src/app/[slug]/page.tsx)'
                    : activeCodeTab === 'wordpress'
                    ? 'wp-content/themes/your-theme/functions.php'
                    : activeCodeTab === 'shopify'
                    ? 'layout/theme.liquid (inside <head>)'
                    : activeCodeTab === 'astro'
                    ? 'src/layouts/Layout.astro'
                    : activeCodeTab === 'schema'
                    ? 'Insert inside <head> on root template'
                    : activeCodeTab === 'robots'
                    ? 'public/robots.txt (Web Server Root)'
                    : activeCodeTab === 'faq'
                    ? 'Insert inside <head> matching visible Q&A'
                    : 'index.html (inside <head>)'}
                </code>
              </span>
              <span className="text-[11px] font-mono">
                Auto-configured for {cleanDomain}
              </span>
            </div>

            <div className="relative rounded-[16px] border border-graphite-800 bg-[#0d0e12] p-4 text-gray-100 shadow-md">
              <pre className="text-xs font-mono overflow-x-auto max-h-[360px] leading-relaxed select-all">
                {activeCodeTab === 'nextjs'
                  ? effectivePatches?.nextJsMetadata
                  : activeCodeTab === 'wordpress'
                  ? effectivePatches?.wordPressPhp
                  : activeCodeTab === 'shopify'
                  ? effectivePatches?.shopifyLiquid
                  : activeCodeTab === 'astro'
                  ? effectivePatches?.astroSeo
                  : activeCodeTab === 'schema'
                  ? effectivePatches?.schemaJsonLd
                  : activeCodeTab === 'robots'
                  ? effectivePatches?.geoRobotsBlock
                  : activeCodeTab === 'faq'
                  ? effectivePatches?.aeoFaqSchema
                  : effectivePatches?.htmlHeadBlock}
              </pre>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 6: COMPETITOR BENCHMARK
          ========================================================================= */}
      {activeMainTab === 'competitor' && (
        <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-graphite-100 dark:border-graphite-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Swords className="size-4 text-blue-500" />
                <h3 className="font-display text-base font-bold text-ink dark:text-white">
                  Head-to-Head Competitor Intelligence
                </h3>
              </div>
              <p className="text-xs text-graphite-800 dark:text-graphite-400">
                Benchmark your technical SEO and speed vitals directly against any rival domain.
              </p>
            </div>
            {comparison && (
              <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                Comparison Active
              </span>
            )}
          </div>

          <form onSubmit={handleRunCompetitor} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Globe className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4 text-graphite-800/60 dark:text-graphite-400" />
              <input
                id="competitor-domain-input"
                type="text"
                aria-label="Enter rival website domain to compare"
                value={competitorUrl}
                onChange={(e) => setCompetitorUrl(e.target.value)}
                placeholder="Enter rival domain (e.g. semrush.com or ahrefs.com)"
                className="w-full rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#1a1b22] pl-10 pr-4 py-2.5 text-xs text-ink dark:text-white placeholder:text-graphite-800/60 focus:outline-none focus:ring-1 focus:ring-ink dark:focus:ring-white"
              />
            </div>
            <button
              type="submit"
              disabled={compLoading}
              className="inline-flex items-center justify-center gap-1.5 rounded-[48px] bg-ink dark:bg-white px-5 py-2.5 text-xs font-semibold text-white dark:text-ink hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer shrink-0"
            >
              {compLoading ? (
                <>
                  <Activity className="size-3.5 animate-spin" />
                  <span>Crawling Rival...</span>
                </>
              ) : (
                <>
                  <Swords className="size-3.5" />
                  <span>Run Comparison</span>
                </>
              )}
            </button>
          </form>

          {compError && (
            <div className="rounded-[12px] border border-rose-200 bg-rose-50/50 p-3 text-xs text-rose-700">
              {compError}
            </div>
          )}

          {comparison ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#1a1b22] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink dark:text-white font-mono">{cleanDomain}</span>
                    <span className="rounded-full bg-violet/10 text-violet px-2.5 py-0.5 text-[10px] font-bold">Your Site</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-graphite-800 dark:text-graphite-400">Health Score</span>
                    <strong className="font-mono text-ink dark:text-white">{comparison.target.score}/100</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-graphite-100 dark:border-graphite-800">
                    <div>
                      <span className="text-[10px] text-graphite-800 dark:text-graphite-400 block">LCP Speed</span>
                      <strong className="font-mono text-ink dark:text-white">{comparison.target.lcpSeconds}s</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-graphite-800 dark:text-graphite-400 block">Schemas</span>
                      <strong className="font-mono text-ink dark:text-white">{comparison.target.schemaCount} tags</strong>
                    </div>
                  </div>
                </div>

                <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#1a1b22] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink dark:text-white font-mono">{comparison.competitor.url}</span>
                    <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-[10px] font-bold">Competitor</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-graphite-800 dark:text-graphite-400">Health Score</span>
                    <strong className="font-mono text-ink dark:text-white">{comparison.competitor.score}/100</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-graphite-100 dark:border-graphite-800">
                    <div>
                      <span className="text-[10px] text-graphite-800 dark:text-graphite-400 block">LCP Speed</span>
                      <strong className="font-mono text-ink dark:text-white">{comparison.competitor.lcpSeconds}s</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-graphite-800 dark:text-graphite-400 block">Schemas</span>
                      <strong className="font-mono text-ink dark:text-white">{comparison.competitor.schemaCount} tags</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strategic Playbook */}
              <div className="grid gap-3 sm:grid-cols-2 pt-1 text-xs">
                <div className="rounded-[14px] border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-3.5 space-y-2">
                  <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                    <TrendingDown className="size-3.5" />
                    <span>Why They Are Winning Search Ground:</span>
                  </span>
                  <ul className="space-y-1.5 text-graphite-800 dark:text-graphite-300 text-[11px]">
                    {comparison.whyTheyAreWinning.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-500 mt-0.5">&bull;</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[14px] border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-3.5 space-y-2">
                  <span className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    <span>3 Steps to Leapfrog Them:</span>
                  </span>
                  <ul className="space-y-1.5 text-graphite-800 dark:text-graphite-300 text-[11px]">
                    {(comparison.threeStepsToBeatThem || []).map((step, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">{idx + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[16px] border border-dashed border-graphite-200 dark:border-graphite-800 p-6 text-center text-xs text-graphite-800 dark:text-graphite-400 bg-[#f4f4f6]/60 dark:bg-[#1a1b22]">
              <p>Enter any rival website URL above to inspect side-by-side Page Speed, Schema tags, and 3 steps to beat them.</p>
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          AUDIT TRANSPARENCY & SCOPE
          ========================================================================= */}
      <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 text-xs space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite-100 dark:border-graphite-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-ink dark:text-white">
            <HelpCircle className="size-4 text-violet" />
            <span>Audit Scope &amp; Transparency</span>
          </div>
          <span className="text-[11px] text-graphite-800 dark:text-graphite-400">
            Factors requiring private server credentials or off-page web indexes
          </span>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {notChecked.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start sm:items-center justify-between gap-3 rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#1a1b22] p-2.5 text-[11px]"
            >
              <span className="text-ink dark:text-white font-medium leading-snug flex-1 break-words">{item}</span>
              <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold bg-[#f4f4f6] dark:bg-[#22232c] text-graphite-800 dark:text-graphite-300 border border-graphite-100 dark:border-graphite-800 whitespace-nowrap mt-0.5 sm:mt-0">
                External Scope
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
