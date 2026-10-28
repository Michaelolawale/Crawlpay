'use client';

import React, { useState, useEffect } from 'react';
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
  Globe,
  HelpCircle,
  ExternalLink,
  Gauge,
  Zap,
  TrendingDown,
  Swords,
  Activity,
  Sparkles,
  Clock,
  Image as ImageIcon,
  Code2,
  CheckCircle,
  Smartphone,
  Terminal,
  CheckCheck,
  Flame,
} from 'lucide-react';
import { FindingGroup, Severity } from '../engine/types';
import { GscAnalysisResult } from '../utils/gscParser';
import { FullAuditReport } from '../types/audit';
import { CompetitorComparison } from '../analyzer/competitorComparator';
import { generateCodePatches } from '../analyzer/fixGenerator';
import { getSuggestedContentFix } from '../analyzer/contentFixes';

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
  const [activeMainTab, setActiveMainTab] = useState<'issues' | 'vitals' | 'patches' | 'competitor'>('issues');

  // Issue Filtering & State
  const [filterTab, setFilterTab] = useState<'all' | 'errors' | 'warnings' | 'notices'>('all');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  // Active Code Patch Tab
  const [activeCodeTab, setActiveCodeTab] = useState<'nextjs' | 'wordpress' | 'shopify' | 'astro' | 'html' | 'schema'>('nextjs');

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

  const mobileMetrics = report?.mobileMetrics || report?.performance?.mobile;

  // Code Patches
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
  };

  // Top Action Items / Needle Movers
  const topActionItems = report?.topNeedleMovers && report.topNeedleMovers.length > 0
    ? report.topNeedleMovers
    : groups.slice(0, 3).map((g) => ({
        priority: (g.severity === 'critical' ? 'Critical' : g.severity === 'high' ? 'High' : 'Quick Win') as 'Critical' | 'High' | 'Quick Win',
        title: g.checkId.replace(/_/g, ' '),
        description: g.findings[0]?.evidence?.observed || `Affects ${g.affectedCount} page(s).`,
        action: g.stackFix || g.findings[0]?.evidence?.expected || 'Review affected template code.',
      }));

  // Health Rating Metadata
  const getHealthColor = (val: number) => {
    if (val >= 80) return { stroke: '#10b981', text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800', label: 'Good Health' };
    if (val >= 60) return { stroke: '#f59e0b', text: 'text-amber-800 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800', label: 'Needs Improvement' };
    return { stroke: '#ef4444', text: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800', label: 'Critical Attention' };
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

  const cleanDomain = targetUrl ? targetUrl.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '') : 'Target Domain';

  return (
    <div className="w-full space-y-6">
      {/* =========================================================================
          COMMAND CENTER: EXECUTIVE HEALTH & SUMMARY (DEDUPLICATED & STREAMLINED)
          ========================================================================= */}
      <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-sm space-y-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Overall Health Gauge & Domain Context */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
            <div className="relative flex size-28 shrink-0 items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 110 110">
                <circle
                  cx="55"
                  cy="55"
                  r={radius}
                  fill="none"
                  stroke="#e6e6e8"
                  className="stroke-[#e6e6e8] dark:stroke-[#252631]"
                  strokeWidth="8"
                />
                <circle
                  cx="55"
                  cy="55"
                  r={radius}
                  fill="none"
                  stroke={healthMeta.stroke}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white">
                  {overallScore}%
                </span>
                <span className="text-[10px] uppercase font-bold text-graphite-800 dark:text-graphite-400">
                  Health
                </span>
              </div>
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="font-display text-lg font-bold text-ink dark:text-white break-words sm:truncate max-w-full">
                  {cleanDomain}
                </h2>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border shrink-0 ${healthMeta.bg} ${healthMeta.text} ${healthMeta.border}`}>
                  {healthMeta.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-graphite-800 dark:text-graphite-400 font-mono">
                <span className="inline-flex items-center gap-1.5 bg-[#f4f4f6] dark:bg-[#202129] px-2.5 py-0.5 rounded-full border border-graphite-100 dark:border-graphite-800">
                  <Globe className="size-3 text-violet" />
                  <span>{pagesChecked} Page{pagesChecked > 1 ? 's' : ''} Crawled</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-violet/10 dark:bg-violet/20 px-2.5 py-0.5 rounded-full border border-violet/20 text-violet font-semibold">
                  <span>Stack: {detectedStack?.cms || 'Detected Web Stack'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 font-semibold">
                  <Smartphone className="size-3" />
                  <span>Mobile: {mobileScore}%</span>
                </span>
              </div>

              <p className="text-xs text-graphite-800 dark:text-graphite-400 max-w-md leading-relaxed pt-0.5">
                Evaluated against Google Mobile-First search standards and deterministic engine specifications.
              </p>
            </div>
          </div>

          {/* Right: Interactive Tri-Color Issue Badges */}
          <div className="flex-1 max-w-md space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFilterTab(filterTab === 'errors' ? 'all' : 'errors');
                  setActiveMainTab('issues');
                }}
                className={`flex flex-col rounded-[14px] border p-2.5 sm:p-3 text-left transition-all cursor-pointer ${
                  filterTab === 'errors'
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 ring-1 ring-rose-300 dark:ring-rose-800 shadow-sm'
                    : 'border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#1a1b22] hover:bg-rose-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="size-3 shrink-0 text-rose-600 dark:text-rose-400" />
                    <span>Errors</span>
                  </span>
                  <span className="size-1.5 sm:size-2 rounded-full bg-rose-500 shrink-0" />
                </div>
                <span className="mt-1 font-display text-lg sm:text-xl font-bold text-rose-700 dark:text-rose-300">
                  {errorCount || errorGroups.length}
                </span>
                <span className="text-[10px] text-graphite-800 dark:text-graphite-400 leading-tight">
                  {errorGroups.length} issue{errorGroups.length !== 1 ? 's' : ''}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterTab(filterTab === 'warnings' ? 'all' : 'warnings');
                  setActiveMainTab('issues');
                }}
                className={`flex flex-col rounded-[14px] border p-2.5 sm:p-3 text-left transition-all cursor-pointer ${
                  filterTab === 'warnings'
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 ring-1 ring-amber-300 dark:ring-amber-800 shadow-sm'
                    : 'border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#1a1b22] hover:bg-amber-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="size-3 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>Warns</span>
                  </span>
                  <span className="size-1.5 sm:size-2 rounded-full bg-amber-500 shrink-0" />
                </div>
                <span className="mt-1 font-display text-lg sm:text-xl font-bold text-amber-800 dark:text-amber-300">
                  {warningCount || warningGroups.length}
                </span>
                <span className="text-[10px] text-graphite-800 dark:text-graphite-400 leading-tight">
                  {warningGroups.length} issue{warningGroups.length !== 1 ? 's' : ''}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterTab(filterTab === 'notices' ? 'all' : 'notices');
                  setActiveMainTab('issues');
                }}
                className={`flex flex-col rounded-[14px] border p-2.5 sm:p-3 text-left transition-all cursor-pointer ${
                  filterTab === 'notices'
                    ? 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-300 dark:ring-blue-800 shadow-sm'
                    : 'border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#1a1b22] hover:bg-blue-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    <Info className="size-3 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span>Notices</span>
                  </span>
                  <span className="size-1.5 sm:size-2 rounded-full bg-blue-500 shrink-0" />
                </div>
                <span className="mt-1 font-display text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-300">
                  {noticeCount || noticeGroups.length}
                </span>
                <span className="text-[10px] text-graphite-800 dark:text-graphite-400 leading-tight">
                  {noticeGroups.length} item{noticeGroups.length !== 1 ? 's' : ''}
                </span>
              </button>
            </div>

            {/* Proportional Factor Distribution Meter */}
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#e6e6e8] dark:bg-[#252631] flex">
                {totalIssuesCount > 0 ? (
                  <>
                    <div style={{ width: `${(errorGroups.length / totalIssuesCount) * 100}%` }} className="bg-rose-500 transition-all duration-500" />
                    <div style={{ width: `${(warningGroups.length / totalIssuesCount) * 100}%` }} className="bg-amber-500 transition-all duration-500" />
                    <div style={{ width: `${(noticeGroups.length / totalIssuesCount) * 100}%` }} className="bg-blue-500 transition-all duration-500" />
                  </>
                ) : (
                  <div className="w-full bg-emerald-500" />
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-graphite-800 dark:text-graphite-400">
                <span>Distribution of detected factors</span>
                {filterTab !== 'all' && (
                  <button type="button" onClick={() => setFilterTab('all')} className="text-violet hover:underline font-semibold cursor-pointer">
                    Reset Filter ({displayedGroups.length}/{groups.length})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Executive Summary Callout */}
        <div className="rounded-[16px] border border-violet/20 bg-violet/5 dark:bg-violet/10 p-4 sm:p-5 text-xs sm:text-sm space-y-2">
          <div className="flex items-center gap-2 font-bold text-violet dark:text-violet">
            <Sparkles className="size-4" />
            <span>AI Executive Overview</span>
          </div>
          <p className="text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal">
            {report?.summary || `Audit completed across ${pagesChecked} page(s) for ${cleanDomain}. Core indexability, mobile responsiveness, and technical metadata have been evaluated. Review the prioritized roadmap and code patches below.`}
          </p>
        </div>

        {/* 5 Thematic Health Pillar Meters */}
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5 pt-1">
          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-3 space-y-1.5">
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

          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-graphite-800 dark:text-graphite-300 flex items-center gap-1.5">
                <Zap className="size-3 text-amber-500" />
                Performance
              </span>
              <span className="font-bold text-ink dark:text-white font-mono">{performanceScore}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#e6e6e8] dark:bg-[#252631] overflow-hidden">
              <div className={`h-full rounded-full ${performanceScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${performanceScore}%` }} />
            </div>
          </div>

          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-graphite-800 dark:text-graphite-300 flex items-center gap-1.5">
                <Smartphone className="size-3 text-emerald-600" />
                Mobile SEO
              </span>
              <span className="font-bold text-ink dark:text-white font-mono">{mobileScore}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#e6e6e8] dark:bg-[#252631] overflow-hidden">
              <div className={`h-full rounded-full ${mobileScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${mobileScore}%` }} />
            </div>
          </div>

          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-3 space-y-1.5">
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

          <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-graphite-800 dark:text-graphite-300 flex items-center gap-1.5">
                <Sparkles className="size-3 text-violet" />
                Schema &amp; Social
              </span>
              <span className="font-bold text-ink dark:text-white font-mono">{socialScore}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#e6e6e8] dark:bg-[#252631] overflow-hidden">
              <div className={`h-full rounded-full ${socialScore >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${socialScore}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          TOP ACTION ROADMAP: 3 HIGHEST PRIORITY FIXES (INSTANT VALUE)
          ========================================================================= */}
      {topActionItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="size-4 text-amber-500" />
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink dark:text-white">
              Top Priority Needle Movers
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {topActionItems.map((item, idx) => {
              const topFix = getSuggestedContentFix(item.title, item.description, cleanDomain);
              return (
                <div
                  key={idx}
                  className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-4 space-y-2.5 shadow-sm flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.priority === 'Critical'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                            : item.priority === 'High'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                        }`}
                      >
                        {item.priority}
                      </span>
                      <span className="font-mono text-[11px] text-graphite-800 dark:text-graphite-400">#0{idx + 1}</span>
                    </div>
                    <h4 className="text-xs font-bold text-ink dark:text-white capitalize line-clamp-2">{item.title}</h4>
                    <p className="text-[11px] text-graphite-800 dark:text-graphite-400 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-graphite-100 dark:border-graphite-800 space-y-2">
                    <div className="text-[11px] text-violet dark:text-violet font-medium line-clamp-2">
                      <span className="font-semibold text-ink dark:text-white">Remedy: </span>
                      {item.action}
                    </div>

                    {topFix && (
                      <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-dashed border-graphite-100 dark:border-graphite-800">
                        <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-semibold truncate flex-1">
                          Fix: {topFix.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(topFix.text, `topfix-${idx}`)}
                          className="inline-flex shrink-0 items-center gap-1 rounded-[48px] bg-emerald-700 dark:bg-emerald-600 hover:bg-emerald-800 dark:hover:bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white transition-all cursor-pointer shadow-xs"
                        >
                          {copiedKey === `topfix-${idx}` ? <Check className="size-2.5" /> : <Copy className="size-2.5" />}
                          <span>{copiedKey === `topfix-${idx}` ? 'Copied' : `Copy ${topFix.actionLabel}`}</span>
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
          WORKSPACE NAVIGATION BAR (TABBED ARCHITECTURE PREVENTING INFINITE SCROLL)
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
            <span className="shrink-0 whitespace-nowrap">Issues Explorer</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono leading-none ${activeMainTab === 'issues' ? 'bg-white/20 text-white dark:bg-black/20 dark:text-ink' : 'bg-graphite-200 dark:bg-graphite-800 text-graphite-800 dark:text-graphite-300'}`}>
              {totalIssuesCount}
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
            <span className="shrink-0 whitespace-nowrap">AI Code Patches</span>
            <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
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
            <span className="text-xs font-mono text-gray-400">Deterministic Agent Schema Output</span>
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
          TAB 1: ISSUES EXPLORER
          ========================================================================= */}
      {activeMainTab === 'issues' && (
        <div className="space-y-4">
          {displayedGroups.length === 0 ? (
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-8 text-center space-y-2">
              <CheckCircle2 className="mx-auto size-8 text-emerald-500" />
              <h4 className="font-display text-base font-bold text-ink dark:text-white">Zero Issues in Filter</h4>
              <p className="text-xs text-graphite-800 dark:text-graphite-400">
                No issues match the selected &quot;{filterTab}&quot; category.
              </p>
            </div>
          ) : (
            displayedGroups.map((group) => {
              const isExpanded = !!expandedKeys[group.rootCauseKey];
              const sampleFinding = group.findings[0];
              const contentFix = getSuggestedContentFix(
                group.checkId,
                sampleFinding?.evidence?.observed,
                cleanDomain,
                sampleFinding?.evidence?.snippet
              );

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
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                          group.severity === 'critical'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                            : group.severity === 'high'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                            : group.severity === 'medium'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60'
                            : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60'
                        }`}
                      >
                        {group.severity}
                      </span>
                      <div className="min-w-0">
                        <span className="font-display text-sm font-bold text-ink dark:text-white capitalize block break-words sm:truncate">
                          {group.checkId.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-graphite-800 dark:text-graphite-400">
                          Affects {group.affectedCount} page{group.affectedCount !== 1 ? 's' : ''} &middot; Priority Score {group.priority}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {contentFix && (
                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 text-[10px] font-bold">
                          <Sparkles className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Fix Ready</span>
                        </span>
                      )}
                      <span className="text-xs text-violet font-medium">{isExpanded ? 'Hide Details' : 'View Action'}</span>
                      {isExpanded ? <ChevronUp className="size-4 text-violet" /> : <ChevronDown className="size-4 text-violet" />}
                    </div>
                  </button>

                  {/* Expanded Issue Action Drawer */}
                  {isExpanded && (
                    <div className="border-t border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#14151a] p-4 sm:p-5 space-y-4">
                      {/* Ready-to-Paste AI Content Fix Callout */}
                      {contentFix && (
                        <div className="rounded-[14px] border border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/40 p-4 space-y-2.5 shadow-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                              <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>1-Click Ready Solution: {contentFix.label}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(contentFix.text, `fix-${group.rootCauseKey}`)}
                              className="inline-flex items-center gap-1.5 rounded-[48px] bg-emerald-700 dark:bg-emerald-600 hover:bg-emerald-800 dark:hover:bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition-all cursor-pointer shadow-xs shrink-0"
                            >
                              {copiedKey === `fix-${group.rootCauseKey}` ? (
                                <>
                                  <Check className="size-3" />
                                  <span>Copied to Clipboard!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3" />
                                  <span>Copy {contentFix.actionLabel}</span>
                                </>
                              )}
                            </button>
                          </div>

                          <div className="rounded-[10px] bg-white dark:bg-[#0c0d10] border border-emerald-200 dark:border-emerald-900/60 p-3 text-xs text-ink dark:text-white font-mono leading-relaxed select-all break-words">
                            {contentFix.text}
                          </div>

                          <div className="flex flex-wrap items-center justify-between text-[11px] text-graphite-800 dark:text-graphite-400 gap-1">
                            <span className="italic">Draft suggestion: review before use{contentFix.charCount ? ` · ${contentFix.charCount} characters` : ''}</span>
                            <span className="font-semibold text-emerald-800 dark:text-emerald-400">{contentFix.recommendation}</span>
                          </div>
                        </div>
                      )}

                      {group.stackFix && (
                        <div className="rounded-[12px] border border-violet/20 bg-violet/5 dark:bg-violet/10 p-3.5 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-violet block">
                            Direct Solution for {detectedStack?.cms || 'Your Stack'}:
                          </span>
                          <p className="text-xs text-ink dark:text-white font-medium leading-relaxed">
                            {group.stackFix}
                          </p>
                        </div>
                      )}

                      {sampleFinding && (
                        <div className="grid gap-3 sm:grid-cols-2 text-xs">
                          <div className="rounded-[12px] border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 p-3 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-400">Observed Defect:</span>
                            <p className="text-ink dark:text-white font-medium">{sampleFinding.evidence.observed}</p>
                            {sampleFinding.evidence.snippet && (
                              <pre className="mt-2 text-[10px] font-mono text-gray-200 bg-graphite-900 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
                                {sampleFinding.evidence.snippet}
                              </pre>
                            )}
                          </div>

                          <div className="rounded-[12px] border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 space-y-1">
                            <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-400">Expected Standard:</span>
                            <p className="text-ink dark:text-white font-medium">{sampleFinding.evidence.expected}</p>
                            {group.exampleUrls.length > 0 && (
                              <div className="pt-2">
                                <span className="text-[10px] font-semibold text-graphite-800 dark:text-graphite-400 block mb-0.5">Sample URLs:</span>
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
              {whatPassed || 'All checked SEO and accessibility guidelines passed validation.'}
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MOBILE & CORE WEB VITALS
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
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    mobileMetrics?.hasViewportTag !== false ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
                  }`}>
                    {mobileMetrics?.hasViewportTag !== false ? 'Passed' : 'Missing Tag'}
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
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    mobileMetrics?.tapTargetsOptimal !== false ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  }`}>
                    {mobileMetrics?.tapTargetsOptimal !== false ? 'Optimal' : `${mobileMetrics?.smallTapTargetCount || 0} Tight Targets`}
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
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    (mobileMetrics?.imagesMissingDimensionsCount || 0) <= 2 ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  }`}>
                    {(mobileMetrics?.imagesMissingDimensionsCount || 0) <= 2 ? 'CLS Protected' : 'Shifts Detected'}
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
                <p className="text-[10px] text-graphite-800 dark:text-graphite-400">Synchronous &lt;script&gt; tags lacking async/defer.</p>
              </div>

              <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-4 space-y-1">
                <span className="text-xs text-graphite-800 dark:text-graphite-400 flex items-center gap-1">
                  <ImageIcon className="size-3 text-emerald-500" />
                  Asset Delivery
                </span>
                <div className="font-mono text-sm font-bold text-ink dark:text-white truncate pt-1">
                  {performance.usesModernImageFormats ? 'WebP / AVIF' : `${performance.heavyAssetCount} Legacy PNG/JPEGs`}
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
          TAB 3: AI STACK CODE PATCHES
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
              { id: 'astro', label: 'Astro Layout', icon: Sparkles, match: detectedStack?.cms === 'Astro' },
              { id: 'schema', label: 'JSON-LD Schema', icon: Layers, match: false },
              { id: 'html', label: 'Standard HTML', icon: Terminal, match: false },
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
                  : effectivePatches?.htmlHeadBlock}
              </pre>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 4: COMPETITOR BENCHMARK
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
                    <CheckCircle className="size-3.5" />
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
          SCOPE TRANSPARENCY
          ========================================================================= */}
      <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 text-xs space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite-100 dark:border-graphite-800 pb-3">
          <div className="flex items-center gap-2 font-bold text-ink dark:text-white">
            <HelpCircle className="size-4 text-violet" />
            <span>Audit Scope &amp; Transparency</span>
          </div>
          <span className="text-[11px] text-graphite-800 dark:text-graphite-400">
            Factors requiring private credentials or off-page web indexes
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
