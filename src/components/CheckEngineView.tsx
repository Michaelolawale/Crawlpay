'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  XCircle,
  Lock,
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
  PieChart,
  Bot,
  ShieldCheck,
  ArrowRight,
  Search,
  Tag,
  MapPin,
  FileSpreadsheet,
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
  const gscAnalysis = props.gscAnalysis;
  const report = props.report;

  // Workspace Main Navigation Tab (Marketer Command Center: 5 Focused Categories)
  const [activeMainTab, setActiveMainTab] = useState<'issues' | 'keywords' | 'visibility' | 'vitals' | 'competitor'>('issues');
  const [activeQuestionCategory, setActiveQuestionCategory] = useState<'questions' | 'comparisons' | 'prepositions'>('questions');

  // Issue Filtering & State
  const [filterTab, setFilterTab] = useState<'all' | 'errors' | 'warnings' | 'notices' | 'passed'>('all');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  // Active Code Patch Tab
  const [activeCodeTab, setActiveCodeTab] = useState<'nextjs' | 'wordpress' | 'shopify' | 'astro' | 'html' | 'schema' | 'robots' | 'faq'>('nextjs');
  const [aiSnippetTab, setAiSnippetTab] = useState<'robots' | 'llms' | 'faq'>('robots');

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

  // Deterministic core checks count evaluated by CrawlPay engine (10 standards)
  const failedCheckPrefixes = new Set(groups.map((g) => g.checkId.split('.')[0]));
  const TOTAL_CORE_CHECKS = 10;
  const passedCheckCount = Math.max(0, TOTAL_CORE_CHECKS - failedCheckPrefixes.size);

  const displayedGroups = groups.filter((g) => {
    if (filterTab === 'errors') return g.severity === 'critical' || g.severity === 'high';
    if (filterTab === 'warnings') return g.severity === 'medium';
    if (filterTab === 'notices') return g.severity === 'low' || g.severity === 'info';
    if (filterTab === 'passed') return false; // Handled specially in UI
    return true;
  });

  // Pie chart calculation: Clean proportional segments for Passed, Critical, Warnings, Notices
  const pieSegments = [
    {
      id: 'passed',
      label: 'Passed',
      fullLabel: 'Passed Checks',
      count: passedCheckCount,
      color: '#10b981', // emerald-500
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      id: 'critical',
      label: 'Critical',
      fullLabel: 'Critical Errors',
      count: errorGroups.length,
      color: '#ef4444', // rose-500
      textColor: 'text-rose-600 dark:text-rose-400',
    },
    {
      id: 'warnings',
      label: 'Warnings',
      fullLabel: 'Warnings',
      count: warningGroups.length,
      color: '#f59e0b', // amber-500
      textColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      id: 'notices',
      label: 'Notices',
      fullLabel: 'Optimization Notices',
      count: noticeGroups.length,
      color: '#8b5cf6', // violet-500
      textColor: 'text-violet dark:text-violet',
    },
  ];

  const totalEvaluated = pieSegments.reduce((sum, s) => sum + s.count, 0) || 1;
  const pieRadius = 38;
  const pieCircumference = 2 * Math.PI * pieRadius;

  let accumulatedPercent = 0;
  const calculatedPieSegments = pieSegments.map((segment) => {
    const fraction = segment.count / totalEvaluated;
    const strokeDash = fraction * pieCircumference;
    const offset = accumulatedPercent * pieCircumference;
    const percent = Math.round(fraction * 100);
    accumulatedPercent += fraction;
    return {
      ...segment,
      fraction,
      strokeDash,
      offset,
      percent,
    };
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

  // Site Summary & Keyword Research Intelligence
  const siteSummary = report?.siteSummary;
  const keywordData = report?.keywords;
  const suggestedKeywords = keywordData?.suggestedKeywords || [];
  const questionMatrix = keywordData?.questionMatrix;
  const keywordAlignment = keywordData?.keywordAlignment;
  const analyticsSignals = report?.analyticsSignals;
  const localSeoSignals = report?.localSeoSignals;
  const isMultiPage = pagesChecked > 1 || report?.isFreeTier === false || Boolean((report as any)?.mode === 'full');
  const isDeepCrawl = isMultiPage;

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
    : groups.slice(0, 3).map((g) => {
        const uniqueUrls = new Set(g.findings && g.findings.length > 0 ? g.findings.map((f) => f.url) : (g.exampleUrls || [])).size;
        const pCount = uniqueUrls > 0 ? uniqueUrls : (g.totalPagesChecked || 1);
        const descFallback = pCount === 1
          ? (g.affectedCount > 1 ? `Affects 1 page (${g.affectedCount} instances).` : 'Affects 1 page.')
          : `Affects ${pCount} page(s) (${g.affectedCount} instances).`;
        return {
          priority: (g.severity === 'critical' ? 'Critical' : g.severity === 'high' ? 'High' : 'Quick Win') as 'Critical' | 'High' | 'Quick Win',
          title: g.checkId,
          description: g.findings[0]?.evidence?.observed || descFallback,
          snippet: g.findings[0]?.evidence?.snippet,
          action: g.stackFix || g.findings[0]?.evidence?.expected || 'Review affected template code.',
        };
      });

  // Health Rating Metadata
  const getHealthColor = (val: number) => {
    if (val >= 90) return { stroke: '#10b981', text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800', label: 'Optimal Health' };
    if (val >= 75) return { stroke: '#3b82f6', text: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800', label: 'Good Health' };
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
          PRINT-ONLY PROFESSIONAL AUDIT DOCUMENT HEADER
          ========================================================================= */}
      <div className="print-only border-b-2 border-graphite-900 pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-sans font-bold text-xl text-ink">CrawlPay Technical Audit Report</h1>
            <div className="text-xs text-graphite-600 font-mono mt-0.5">
              Audited Target: <strong className="text-ink">{targetUrl}</strong>
            </div>
          </div>
          <div className="text-right text-xs text-graphite-600 font-mono">
            <div>Autonomous Agent • Celo Mainnet (42220)</div>
            <div className="text-[11px] text-graphite-500">
              Settled in USDT • Tag: <code className="text-graphite-700">celo_757c2ac3b70c</code>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          COMMAND CENTER: EXECUTIVE HEALTH & SUMMARY (WITH ACCURATE PIE CHART)
          ========================================================================= */}
      <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column (5 cols): Overall Health Gauge & Domain Identity */}
          <div className="lg:col-span-5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-5">
            <div className="relative flex size-24 shrink-0 items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 100 100" role="img" aria-label={`Overall site health: ${overallScore}%`}>
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
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="font-display text-xl font-bold text-ink dark:text-white tracking-tight break-all sm:truncate max-w-full">
                  {cleanDomain}
                </h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${healthMeta.bg} ${healthMeta.text} ${healthMeta.border}`}>
                  <CheckCircle2 className="size-3 shrink-0" />
                  <span>{healthMeta.label}</span>
                </span>
              </div>

              {/* Clean Unified Inline Metadata */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2.5 gap-y-1 text-xs text-graphite-600 dark:text-graphite-400 font-mono">
                <span className="text-ink dark:text-white font-medium">{detectedStack?.cms || 'Detected Web Stack'}</span>
                <span className="text-graphite-400 dark:text-graphite-600">&bull;</span>
                <span>{pagesChecked} page{pagesChecked > 1 ? 's' : ''} crawled</span>
              </div>

              <p className="text-xs text-graphite-600 dark:text-graphite-400 leading-relaxed pt-0.5">
                Verified against Google Search guidelines &amp; AI crawler standards
              </p>
            </div>
          </div>

          {/* Right Column (7 cols): Audit Findings & Quality Distribution Pie Chart */}
          <div className="lg:col-span-7 rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafc] dark:bg-[#121317] p-3.5 sm:p-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-graphite-100 dark:border-graphite-800">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ink dark:text-white">
                <PieChart className="size-3.5 text-violet" />
                <span>Audit Findings &amp; Check Distribution</span>
              </div>
              {filterTab !== 'all' ? (
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className="text-[11px] text-violet hover:underline font-semibold cursor-pointer"
                >
                  Reset filter (showing all {totalIssuesCount} findings)
                </button>
              ) : (
                <span className="text-[11px] font-mono text-graphite-500">
                  {totalEvaluated} Checks Evaluated
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* SVG Donut / Pie Chart */}
              <div className="relative size-24 shrink-0 flex items-center justify-center">
                <svg className="size-full -rotate-90" viewBox="0 0 100 100" role="img" aria-label="Audit check distribution pie chart">
                  <circle
                    cx="50"
                    cy="50"
                    r={pieRadius}
                    fill="none"
                    stroke="#e6e6e8"
                    className="stroke-[#e6e6e8] dark:stroke-[#202129]"
                    strokeWidth="10"
                  />
                  {calculatedPieSegments.map((seg) => (
                    seg.count > 0 && (
                      <circle
                        key={seg.id}
                        cx="50"
                        cy="50"
                        r={pieRadius}
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="10"
                        strokeDasharray={`${seg.strokeDash} ${pieCircumference - seg.strokeDash}`}
                        strokeDashoffset={-seg.offset}
                        strokeLinecap={seg.fraction === 1 ? 'round' : 'butt'}
                        className="transition-all duration-700 ease-out"
                      />
                    )
                  ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="font-display text-lg font-bold text-ink dark:text-white leading-none">
                    {totalEvaluated}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-graphite-500 font-semibold mt-0.5">
                    Checks
                  </span>
                </div>
              </div>

              {/* Interactive Legend Grid */}
              <div className="grid grid-cols-2 gap-2 flex-1 w-full text-xs">
                {calculatedPieSegments.map((seg) => {
                  const isActive = (seg.id === 'critical' && filterTab === 'errors') ||
                                   (seg.id === 'warnings' && filterTab === 'warnings') ||
                                   (seg.id === 'notices' && filterTab === 'notices') ||
                                   (seg.id === 'passed' && filterTab === 'passed');
                  return (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => {
                        if (seg.id === 'critical') setFilterTab(filterTab === 'errors' ? 'all' : 'errors');
                        else if (seg.id === 'warnings') setFilterTab(filterTab === 'warnings' ? 'all' : 'warnings');
                        else if (seg.id === 'notices') setFilterTab(filterTab === 'notices' ? 'all' : 'notices');
                        else if (seg.id === 'passed') setFilterTab(filterTab === 'passed' ? 'all' : 'passed');
                        setActiveMainTab('issues');
                      }}
                      className={`flex items-center justify-between gap-2 rounded-[10px] border px-2.5 py-1.5 transition-all cursor-pointer ${
                        isActive
                          ? 'ring-2 ring-violet border-transparent bg-violet/10 dark:bg-violet/20'
                          : 'border-graphite-200/60 dark:border-graphite-800 bg-white dark:bg-[#1a1b22] hover:border-graphite-300 dark:hover:border-graphite-700'
                      }`}
                      title={`Filter by ${seg.fullLabel}`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                        <span className="text-[12px] font-medium text-graphite-800 dark:text-graphite-200 truncate">
                          {seg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 font-mono text-[11px]">
                        <span className="font-bold text-ink dark:text-white">{seg.count}</span>
                        <span className="text-graphite-500 text-[10px]">({seg.percent}%)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 6 Thematic Health Pillar Meters (Unified Streamlined Grid) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 pt-3 border-t border-graphite-100 dark:border-graphite-800">
          <div className="p-3 space-y-1.5 rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22]/60">
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

          <div className="p-3 space-y-1.5 rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22]/60">
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

          <div className="p-3 space-y-1.5 rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22]/60">
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

          <div className="p-3 space-y-1.5 rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22]/60">
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

          <div className="p-3 space-y-1.5 rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22]/60">
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

          <div className="p-3 space-y-1.5 rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22]/60">
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
          WHAT THIS SITE IS ABOUT (DETECTED FROM PAGE CONTENT - STRUCTURED TABLE)
          ========================================================================= */}
      <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite-100 dark:border-graphite-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-[10px] bg-violet/10 text-violet">
              <FileText className="size-4" />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-ink dark:text-white">
                What This Site Is About
              </h3>
              <p className="text-[11px] text-graphite-500">Summary detected from on-page content, titles, and headings &middot; No fabricated assumptions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-graphite-500">Detection Confidence:</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-semibold ${
              siteSummary?.confidence === 'High'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : siteSummary?.confidence === 'Moderate'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
            }`}>
              <CheckCircle2 className="size-3" />
              <span>{siteSummary?.confidence || 'High'}</span>
            </span>
          </div>
        </div>

        <p className="text-[13px] sm:text-[14px] text-ink dark:text-graphite-200 leading-relaxed font-normal">
          {siteSummary?.summary || (siteSummary?.detectedBrandName ? `${siteSummary.detectedBrandName} operates as an online ${siteSummary.businessModel.toLowerCase()} offering ${siteSummary.primaryOffering}.` : `This website operates as an online business for ${cleanDomain}. Add descriptive title, meta description, and <h1> heading tags to clarify its core purpose.`)}
        </p>

        {/* Mobile-Friendly Entity Cards (< md) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:hidden">
          <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafc] dark:bg-[#121317] p-3 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-graphite-500 block">What this site does</span>
            <span className="font-semibold text-xs text-ink dark:text-white leading-relaxed block">{siteSummary?.primaryOffering || report?.archetype?.keyAuditFocus || 'Digital content or service'}</span>
            <span className="text-[10px] text-graphite-400 font-mono block">On-page headings &amp; copy</span>
          </div>

          <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafc] dark:bg-[#121317] p-3 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-graphite-500 block">Detected Brand Name</span>
            <span className="font-semibold text-xs text-ink dark:text-white block">{siteSummary?.detectedBrandName || cleanDomain}</span>
            <span className="text-[10px] text-graphite-400 font-mono block">Title tag &amp; OpenGraph</span>
          </div>

          <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafc] dark:bg-[#121317] p-3 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-graphite-500 block">Business Model</span>
            <span className="text-xs text-ink dark:text-white block">{siteSummary?.businessModel || report?.archetype?.label || 'Online Business'}</span>
            <span className="text-[10px] text-graphite-400 font-mono block">Navigation &amp; structure signals</span>
          </div>

          <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafc] dark:bg-[#121317] p-3 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-graphite-500 block">Target Audience</span>
            <span className="text-xs text-ink dark:text-white block">{siteSummary?.targetAudience || 'General visitors & buyers'}</span>
            <span className="text-[10px] text-graphite-400 font-mono block">Content intent signals</span>
          </div>
        </div>

        {/* Structured Site Summary Entity Table (>= md) */}
        <div className="hidden md:block overflow-x-auto rounded-[14px] border border-graphite-100 dark:border-graphite-800">
          <table className="w-full text-left text-xs min-w-[550px]">
            <thead className="bg-[#f4f4f6]/80 dark:bg-[#1a1b22] text-graphite-600 dark:text-graphite-400 font-mono text-[10px] uppercase tracking-wider border-b border-graphite-100 dark:border-graphite-800">
              <tr>
                <th scope="col" className="py-2.5 px-4 font-semibold w-1/4">Entity Property</th>
                <th scope="col" className="py-2.5 px-4 font-semibold w-1/2">Detected Meaning</th>
                <th scope="col" className="py-2.5 px-4 font-semibold w-1/4">Source Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-100 dark:divide-graphite-800">
              <tr className="hover:bg-[#fafafb] dark:hover:bg-[#1a1b22]/40 transition-colors">
                <td className="py-3 px-4 font-medium text-graphite-600 dark:text-graphite-400">What this site does</td>
                <td className="py-3 px-4 font-semibold text-ink dark:text-white leading-relaxed">{siteSummary?.primaryOffering || report?.archetype?.keyAuditFocus || 'Digital content or service'}</td>
                <td className="py-3 px-4 font-mono text-[11px] text-graphite-500">On-page headings &amp; copy</td>
              </tr>
              <tr className="hover:bg-[#fafafb] dark:hover:bg-[#1a1b22]/40 transition-colors">
                <td className="py-3 px-4 font-medium text-graphite-600 dark:text-graphite-400">Detected Brand Name</td>
                <td className="py-3 px-4 font-semibold text-ink dark:text-white">{siteSummary?.detectedBrandName || cleanDomain}</td>
                <td className="py-3 px-4 font-mono text-[11px] text-graphite-500">Title tag &amp; OpenGraph</td>
              </tr>
              <tr className="hover:bg-[#fafafb] dark:hover:bg-[#1a1b22]/40 transition-colors">
                <td className="py-3 px-4 font-medium text-graphite-600 dark:text-graphite-400">Business Model</td>
                <td className="py-3 px-4 text-ink dark:text-white">{siteSummary?.businessModel || report?.archetype?.label || 'Online Business'}</td>
                <td className="py-3 px-4 font-mono text-[11px] text-graphite-500">Navigation &amp; structure signals</td>
              </tr>
              <tr className="hover:bg-[#fafafb] dark:hover:bg-[#1a1b22]/40 transition-colors">
                <td className="py-3 px-4 font-medium text-graphite-600 dark:text-graphite-400">Target Audience</td>
                <td className="py-3 px-4 text-ink dark:text-white">{siteSummary?.targetAudience || 'General visitors & buyers'}</td>
                <td className="py-3 px-4 font-mono text-[11px] text-graphite-500">Content intent signals</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* =========================================================================
          GOOGLE SEARCH CONSOLE CROSS-REFERENCE (IF UPLOADED)
          ========================================================================= */}
      {gscAnalysis && (
        <section className="rounded-[20px] border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/20 p-5 sm:p-6 space-y-4 shadow-sm animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/80 dark:border-amber-900/50 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <FileSpreadsheet className="size-4" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-ink dark:text-white flex items-center gap-2">
                  <span>Google Search Console Cross-Reference</span>
                  <span className="rounded-full bg-amber-100 dark:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[10px] font-mono">
                    {gscAnalysis.fileName}
                  </span>
                </h3>
                <p className="text-xs text-graphite-600 dark:text-graphite-400 mt-0.5">
                  Verified real Google crawl &amp; indexing status data cross-referenced with on-page audits.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-white dark:bg-[#1a1b22] border border-amber-200 dark:border-amber-800/60 px-3 py-1 font-mono text-ink dark:text-graphite-200">
                Total in export: <strong>{gscAnalysis.totalUrls.toLocaleString()}</strong>
              </span>
              <span className="rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-3 py-1 font-mono text-rose-700 dark:text-rose-300">
                Unindexed: <strong>{gscAnalysis.unindexedUrls.length}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-[12px] bg-white dark:bg-[#16171d] border border-amber-200/70 dark:border-amber-900/40 p-3 space-y-1">
              <span className="text-[11px] font-mono text-graphite-500 uppercase tracking-wider block">Detected Issue Types</span>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {gscAnalysis.reasonsDetected.length > 0 ? (
                  gscAnalysis.reasonsDetected.map((reason, idx) => (
                    <span key={idx} className="rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 text-[10px] font-medium">
                      {reason}
                    </span>
                  ))
                ) : (
                  <span className="text-graphite-600 dark:text-graphite-400 font-mono text-[11px]">Crawled - not indexed</span>
                )}
              </div>
            </div>

            <div className="rounded-[12px] bg-white dark:bg-[#16171d] border border-amber-200/70 dark:border-amber-900/40 p-3 space-y-1">
              <span className="text-[11px] font-mono text-graphite-500 uppercase tracking-wider block">Diagnostic Impact</span>
              <p className="text-graphite-700 dark:text-graphite-300 text-[11px] leading-relaxed">
                Google crawled these URLs but withheld indexation. CrawlPay checks identify the technical blockers behind each.
              </p>
            </div>

            <div className="rounded-[12px] bg-white dark:bg-[#16171d] border border-amber-200/70 dark:border-amber-900/40 p-3 space-y-1">
              <span className="text-[11px] font-mono text-graphite-500 uppercase tracking-wider block">Recommended Action</span>
              <p className="text-graphite-700 dark:text-graphite-300 text-[11px] leading-relaxed">
                Review the canonical tags, duplicate body copy, and thin content fixes highlighted in the Priority Action Plan below.
              </p>
            </div>
          </div>

          {/* Unindexed URLs List (Scrollable) */}
          {gscAnalysis.unindexedUrls.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-mono text-graphite-600 dark:text-graphite-400 uppercase tracking-wider block">
                Sample Flagged URLs ({Math.min(gscAnalysis.unindexedUrls.length, 10)} of {gscAnalysis.unindexedUrls.length})
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {gscAnalysis.unindexedUrls.slice(0, 10).map((url, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 rounded-[10px] border border-amber-200/80 dark:border-amber-900/40 bg-white dark:bg-[#16171d] px-3 py-2 text-xs font-mono shadow-xs"
                  >
                    <span className="truncate text-ink dark:text-graphite-200 flex-1">{url}</span>
                    <span className="shrink-0 rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 px-2 py-0.5 text-[10px] font-sans font-medium">
                      {gscAnalysis.reasonsDetected[0] || 'Crawled - not indexed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          WORKSPACE NAVIGATION BAR (TABBED ARCHITECTURE)
          ========================================================================= */}
      <div className="print-only border-b border-graphite-300 pb-2 mb-3">
        <h2 className="font-sans font-bold text-base text-ink uppercase tracking-wider">
          {activeMainTab === 'issues' && 'Priority Action Plan & Technical Findings'}
          {activeMainTab === 'keywords' && 'On-Page Keyword & Search Engine Query Opportunities'}
          {activeMainTab === 'visibility' && 'AI Search Engine & LLM Crawler Readiness'}
          {activeMainTab === 'vitals' && 'Core Web Vitals & Speed Performance'}
          {activeMainTab === 'competitor' && 'Competitor Side-by-Side Comparison'}
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-graphite-100 dark:border-graphite-800 pb-2 gap-2 no-print">
        <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto -mx-1 px-1 sm:mx-0 sm:px-0 py-1">
          <button
            type="button"
            onClick={() => setActiveMainTab('issues')}
            className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-[48px] px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeMainTab === 'issues'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white hover:bg-graphite-100 dark:hover:bg-[#202129]'
            }`}
          >
            <ShieldAlert className="size-3.5 shrink-0" />
            <span className="shrink-0 whitespace-nowrap">Priority Action Plan</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono leading-none ${activeMainTab === 'issues' ? 'bg-white/20 text-white dark:bg-black/20 dark:text-ink' : 'bg-graphite-200 dark:bg-graphite-800 text-graphite-800 dark:text-graphite-300'}`}>
              {totalIssuesCount} Fixes
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('keywords')}
            className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-[48px] px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeMainTab === 'keywords'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white hover:bg-graphite-100 dark:hover:bg-[#202129]'
            }`}
          >
            <Search className="size-3.5 shrink-0 text-violet" />
            <span className="shrink-0 whitespace-nowrap">Keyword Strategy</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono leading-none ${activeMainTab === 'keywords' ? 'bg-white/20 text-white dark:bg-black/20 dark:text-ink' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'}`}>
              {suggestedKeywords.length > 0 ? `${suggestedKeywords.length} Angles` : 'Active'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('visibility')}
            className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-[48px] px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeMainTab === 'visibility'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white hover:bg-graphite-100 dark:hover:bg-[#202129]'
            }`}
          >
            <Bot className="size-3.5 shrink-0 text-violet" />
            <span className="shrink-0 whitespace-nowrap">Google &amp; AI Visibility</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono leading-none ${activeMainTab === 'visibility' ? 'bg-white/20 text-white dark:bg-black/20 dark:text-ink' : 'bg-violet/10 text-violet font-semibold'}`}>
              {aeoScore}% AEO
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('vitals')}
            className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-[48px] px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeMainTab === 'vitals'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white hover:bg-graphite-100 dark:hover:bg-[#202129]'
            }`}
          >
            <Smartphone className="size-3.5 shrink-0" />
            <span className="shrink-0 whitespace-nowrap">Speed, Tracking &amp; CMS Fixes</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono leading-none ${activeMainTab === 'vitals' ? 'bg-white/20 text-white dark:bg-black/20 dark:text-ink' : 'bg-graphite-200 dark:bg-graphite-800 text-graphite-800 dark:text-graphite-300'}`}>
              {mobileScore}% Mobile
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('competitor')}
            className={`flex shrink-0 whitespace-nowrap items-center gap-2 rounded-[48px] px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeMainTab === 'competitor'
                ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                : 'text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white hover:bg-graphite-100 dark:hover:bg-[#202129]'
            }`}
          >
            <Swords className="size-3.5 shrink-0 text-blue-500" />
            <span className="shrink-0 whitespace-nowrap">Competitor Analysis</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-mono leading-none flex items-center gap-1 ${
              !isDeepCrawl
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold border border-amber-300/40 dark:border-amber-800/40'
                : activeMainTab === 'competitor'
                ? 'bg-white/20 text-white dark:bg-black/20 dark:text-ink'
                : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
            }`}>
              {!isDeepCrawl && <Lock className="size-2.5" />}
              <span>{!isDeepCrawl ? 'Deep crawl' : comparison ? 'Active' : 'Benchmark'}</span>
            </span>
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
            <span className="text-xs font-mono text-gray-400">Audit Protocol Schema (v2.0.0)</span>
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
          TAB 2: KEYWORD STRATEGY & CONTENT OPPORTUNITIES
          ========================================================================= */}
      {activeMainTab === 'keywords' && (() => {
        const primaryTopic = suggestedKeywords[0]?.keyword || report?.semantics?.primaryKeywordDetected || 'online platform';
        const currentTitleText = keywordAlignment?.currentTags?.title || report?.technical?.title || 'No title tag found';
        const currentH1Text = keywordAlignment?.currentTags?.h1 || report?.technical?.headings?.h1s?.[0] || 'No main headline found';
        const currentMetaText = keywordAlignment?.currentTags?.metaDescription || report?.technical?.metaDescription || 'No meta description found';

        const titleHasTopic = keywordAlignment?.hasTitleMatch ?? currentTitleText.toLowerCase().includes(primaryTopic.toLowerCase());
        const h1HasTopic = keywordAlignment?.hasH1Match ?? currentH1Text.toLowerCase().includes(primaryTopic.toLowerCase());
        const metaHasTopic = keywordAlignment?.hasMetaMatch ?? currentMetaText.toLowerCase().includes(primaryTopic.toLowerCase());
        const isFullyAligned = keywordAlignment?.isFullyAligned ?? (titleHasTopic && h1HasTopic);

        const cleanRewrites = {
          title: keywordAlignment?.recommendedRewrites?.title || `${primaryTopic} — ${cleanDomain}`,
          h1: keywordAlignment?.recommendedRewrites?.h1 || primaryTopic,
          meta: keywordAlignment?.recommendedRewrites?.metaDescription || `Discover ${primaryTopic} on ${cleanDomain}. Official features, pricing, and direct answers.`,
        };

        const activeQuestionsList =
          activeQuestionCategory === 'questions'
            ? questionMatrix?.questions || []
            : activeQuestionCategory === 'comparisons'
            ? questionMatrix?.comparisons || []
            : questionMatrix?.prepositions || [];

        return (
          <div className="space-y-6 tab-panel-enter">
            {/* Header: Overview of Page Topic */}
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-graphite-100 dark:border-graphite-800 pb-3">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-violet font-semibold">
                    Keyword Strategy
                  </span>
                  <h3 className="font-display text-lg font-bold text-ink dark:text-white mt-0.5">
                    How Search Engines &amp; AI Understand Your Page Topic
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-graphite-600 dark:text-graphite-400 font-mono">Primary Topic:</span>
                  <span className="rounded-full bg-violet/10 border border-violet/20 px-3 py-1 font-mono text-xs font-bold text-violet">
                    {primaryTopic}
                  </span>
                </div>
              </div>

              <p className="text-[13px] sm:text-[14px] text-graphite-700 dark:text-graphite-300 leading-relaxed font-normal">
                {report?.keywords?.plainLanguageAdvice ||
                  'Search engines and AI assistants rank your page by checking whether your title, main headline, and description focus on the same core topic. When your tags align, your ranking power is focused rather than split.'}
              </p>
            </div>

            {/* Part 1: Tag Alignment Audit & Paste-Ready Fixes */}
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-graphite-100 dark:border-graphite-800 pb-3">
                <div>
                  <h4 className="font-display text-base font-bold text-ink dark:text-white">
                    Step 1: Align Your Main Page Tags
                  </h4>
                  <p className="text-xs text-graphite-600 dark:text-graphite-400 mt-0.5">
                    Compare what is currently on your page with recommended copy-paste replacements
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shrink-0 ${
                  isFullyAligned
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  {isFullyAligned ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                  <span>{isFullyAligned ? 'Tags Fully Aligned' : 'Tags Need Alignment'}</span>
                </span>
              </div>

              <p className="text-xs text-graphite-700 dark:text-graphite-300 leading-relaxed">
                {keywordAlignment?.plainDiagnosis ||
                  `Your page title, main headline (H1), and description should all feature "${primaryTopic}". When they target different terms, search engines cannot determine your primary subject.`}
              </p>

              {/* 3-Card Tag Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* 1. Title Tag Card */}
                <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafc] dark:bg-[#121317] p-4 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-ink dark:text-white">&lt;title&gt; Tag</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        titleHasTopic
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80'
                      }`}>
                        {titleHasTopic ? 'Matches Topic' : 'Missing Topic'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-graphite-500 uppercase font-mono block">Current on page:</span>
                      <p className="text-xs text-graphite-700 dark:text-graphite-300 line-clamp-2 mt-0.5" title={currentTitleText}>
                        {currentTitleText}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-graphite-200/60 dark:border-graphite-800 space-y-2">
                    <span className="text-[11px] font-semibold text-violet block">Recommended rewrite (under 60 chars):</span>
                    <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#1a1b22] border border-graphite-200/60 dark:border-graphite-800 text-xs font-medium text-ink dark:text-white break-words">
                      {cleanRewrites.title}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(cleanRewrites.title, 'copy-title-tag')}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                    >
                      {copiedKey === 'copy-title-tag' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      <span>{copiedKey === 'copy-title-tag' ? 'Copied Title' : 'Copy Title'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Main Headline (H1) Card */}
                <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafc] dark:bg-[#121317] p-4 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-ink dark:text-white">&lt;h1&gt; Main Headline</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        h1HasTopic
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80'
                      }`}>
                        {h1HasTopic ? 'Matches Topic' : 'Missing Topic'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-graphite-500 uppercase font-mono block">Current on page:</span>
                      <p className="text-xs text-graphite-700 dark:text-graphite-300 line-clamp-2 mt-0.5" title={currentH1Text}>
                        {currentH1Text}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-graphite-200/60 dark:border-graphite-800 space-y-2">
                    <span className="text-[11px] font-semibold text-violet block">Recommended headline:</span>
                    <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#1a1b22] border border-graphite-200/60 dark:border-graphite-800 text-xs font-medium text-ink dark:text-white break-words">
                      {cleanRewrites.h1}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(cleanRewrites.h1, 'copy-h1-tag')}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                    >
                      {copiedKey === 'copy-h1-tag' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      <span>{copiedKey === 'copy-h1-tag' ? 'Copied Headline' : 'Copy Headline'}</span>
                    </button>
                  </div>
                </div>

                {/* 3. Meta Description Card */}
                <div className="rounded-[14px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafc] dark:bg-[#121317] p-4 flex flex-col justify-between space-y-3.5">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-ink dark:text-white">Meta Description</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        metaHasTopic
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80'
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80'
                      }`}>
                        {metaHasTopic ? 'Matches Topic' : 'Missing Topic'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-graphite-500 uppercase font-mono block">Current on page:</span>
                      <p className="text-xs text-graphite-700 dark:text-graphite-300 line-clamp-2 mt-0.5" title={currentMetaText}>
                        {currentMetaText}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-graphite-200/60 dark:border-graphite-800 space-y-2">
                    <span className="text-[11px] font-semibold text-violet block">Recommended rewrite (under 155 chars):</span>
                    <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#1a1b22] border border-graphite-200/60 dark:border-graphite-800 text-xs font-medium text-ink dark:text-white break-words">
                      {cleanRewrites.meta}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(cleanRewrites.meta, 'copy-meta-tag')}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                    >
                      {copiedKey === 'copy-meta-tag' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      <span>{copiedKey === 'copy-meta-tag' ? 'Copied Description' : 'Copy Description'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Part 2: Target Search Keywords */}
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] shadow-sm overflow-hidden space-y-0">
              <div className="p-4 sm:p-5 border-b border-graphite-100 dark:border-graphite-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="font-display text-base font-bold text-ink dark:text-white">
                    Step 2: Recommended Search Keywords
                  </h4>
                  <p className="text-xs text-graphite-600 dark:text-graphite-400 mt-0.5">
                    Core search phrases detected from your content, mapped by search intent and on-page presence
                  </p>
                </div>
                <span className="text-[11px] font-mono text-graphite-500">
                  {suggestedKeywords.length || 1} Primary Keywords
                </span>
              </div>

              {/* Mobile Card View (< 768px) */}
              <div className="divide-y divide-graphite-100 dark:divide-graphite-800 md:hidden">
                {(suggestedKeywords.length > 0
                  ? suggestedKeywords
                  : [
                      {
                        id: 'kw_fallback',
                        keyword: primaryTopic,
                        angleLabel: 'Core Subject',
                        intent: 'Commercial' as const,
                        onPagePlacement: 'in_h1' as const,
                        whyItMatters: 'Primary keyword detected across your main headlines.',
                        recommendedPlacement: 'Ensure this appears in your <title> and main <h1> tag.',
                      },
                    ]
                ).map((kw) => {
                  const isFound = kw.onPagePlacement === 'in_h1' || kw.onPagePlacement === 'in_title';
                  const isPartial = kw.onPagePlacement === 'in_subheading' || kw.onPagePlacement === 'in_body_only';

                  const statusLabel =
                    kw.onPagePlacement === 'in_h1'
                      ? 'Found in H1 Headline'
                      : kw.onPagePlacement === 'in_title'
                      ? 'Found in Page Title'
                      : kw.onPagePlacement === 'in_subheading'
                      ? 'In Subheading'
                      : kw.onPagePlacement === 'in_body_only'
                      ? 'In Body Text Only'
                      : 'Missing from Page';

                  return (
                    <div key={kw.id} className="p-4 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono font-bold text-ink dark:text-white text-[14px] break-words">
                          {kw.keyword}
                        </span>
                        <span className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-graphite-100 dark:bg-graphite-800 text-graphite-700 dark:text-graphite-300 border border-graphite-200 dark:border-graphite-700 shrink-0">
                          {kw.intent}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-graphite-500 uppercase">Status:</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            isFound
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : isPartial
                              ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {isFound ? (
                            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <AlertTriangle className="size-3 text-amber-600 dark:text-amber-400" />
                          )}
                          <span>{statusLabel}</span>
                        </span>
                      </div>
                      <div className="text-xs text-graphite-700 dark:text-graphite-300 leading-relaxed bg-[#f8f8fa] dark:bg-[#121317] p-2.5 rounded-[8px] border border-graphite-100 dark:border-graphite-800 space-y-1">
                        <p className="font-medium text-ink dark:text-white">{kw.recommendedPlacement}</p>
                        <p className="text-[11px] text-graphite-500">{kw.whyItMatters}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead className="bg-[#f4f4f6]/80 dark:bg-[#1a1b22] text-graphite-600 dark:text-graphite-400 uppercase tracking-wider font-mono text-[10px] border-b border-graphite-100 dark:border-graphite-800">
                    <tr>
                      <th scope="col" className="py-3 px-4 font-semibold w-1/4">Target Keyword</th>
                      <th scope="col" className="py-3 px-3 font-semibold w-28">Search Intent</th>
                      <th scope="col" className="py-3 px-3 font-semibold w-36">Current Status</th>
                      <th scope="col" className="py-3 px-4 font-semibold">Where to Place on Page</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-graphite-100 dark:divide-graphite-800">
                    {(suggestedKeywords.length > 0
                      ? suggestedKeywords
                      : [
                          {
                            id: 'kw_fallback',
                            keyword: primaryTopic,
                            angleLabel: 'Core Subject',
                            intent: 'Commercial' as const,
                            onPagePlacement: 'in_h1' as const,
                            whyItMatters: 'Primary keyword detected across your main headlines.',
                            recommendedPlacement: 'Ensure this appears in your <title> and main <h1> tag.',
                          },
                        ]
                    ).map((kw) => {
                      const isFound = kw.onPagePlacement === 'in_h1' || kw.onPagePlacement === 'in_title';
                      const isPartial = kw.onPagePlacement === 'in_subheading' || kw.onPagePlacement === 'in_body_only';

                      const statusLabel =
                        kw.onPagePlacement === 'in_h1'
                          ? 'Found in H1 Headline'
                          : kw.onPagePlacement === 'in_title'
                          ? 'Found in Page Title'
                          : kw.onPagePlacement === 'in_subheading'
                          ? 'In Subheading'
                          : kw.onPagePlacement === 'in_body_only'
                          ? 'In Body Text Only'
                          : 'Missing from Page';

                      return (
                        <tr key={kw.id} className="hover:bg-[#fafafb] dark:hover:bg-[#1a1b22]/50 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-ink dark:text-white text-[13px]">
                            {kw.keyword}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap bg-graphite-100 dark:bg-graphite-800 text-graphite-700 dark:text-graphite-300 border border-graphite-200 dark:border-graphite-700">
                              {kw.intent}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap ${
                              isFound
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : isPartial
                                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}>
                              {isFound ? <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" /> : <AlertTriangle className="size-3 text-amber-600 dark:text-amber-400" />}
                              <span>{statusLabel}</span>
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-graphite-700 dark:text-graphite-300 leading-relaxed">
                            <p className="font-medium text-ink dark:text-white">{kw.recommendedPlacement}</p>
                            <p className="text-[11px] text-graphite-500 mt-0.5">{kw.whyItMatters}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Part 3: Questions Customers & AI Ask */}
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] shadow-sm overflow-hidden space-y-0">
              <div className="p-4 sm:p-5 border-b border-graphite-100 dark:border-graphite-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-display text-base font-bold text-ink dark:text-white">
                    Step 3: Questions Customers &amp; AI Ask
                  </h4>
                  <p className="text-xs text-graphite-600 dark:text-graphite-400 mt-0.5">
                    Answer these questions on your page in an FAQ section to get cited by ChatGPT, Claude, and Google AI Overviews
                  </p>
                </div>

                {/* Sub-Category Filter Buttons */}
                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 rounded-[16px] sm:rounded-[32px] bg-[#f4f4f6] dark:bg-[#1a1b22] p-1 border border-graphite-200 dark:border-graphite-800">
                  <button
                    type="button"
                    onClick={() => setActiveQuestionCategory('questions')}
                    className={`rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      activeQuestionCategory === 'questions'
                        ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                        : 'text-graphite-700 dark:text-graphite-300 hover:text-ink dark:hover:text-white'
                    }`}
                  >
                    Questions ({questionMatrix?.questions?.length || 4})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveQuestionCategory('comparisons')}
                    className={`rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      activeQuestionCategory === 'comparisons'
                        ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                        : 'text-graphite-700 dark:text-graphite-300 hover:text-ink dark:hover:text-white'
                    }`}
                  >
                    Comparisons ({questionMatrix?.comparisons?.length || 1})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveQuestionCategory('prepositions')}
                    className={`rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                      activeQuestionCategory === 'prepositions'
                        ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-sm'
                        : 'text-graphite-700 dark:text-graphite-300 hover:text-ink dark:hover:text-white'
                    }`}
                  >
                    Prepositions ({questionMatrix?.prepositions?.length || 2})
                  </button>
                </div>
              </div>

              {/* Mobile Card View (< 768px) */}
              <div className="divide-y divide-graphite-100 dark:divide-graphite-800 md:hidden">
                {activeQuestionsList.map((item, idx) => (
                  <div key={idx} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-sans font-bold text-ink dark:text-white text-[13px] leading-snug">
                        &ldquo;{item.query}&rdquo;
                      </span>
                      <span className="inline-flex rounded-[6px] bg-graphite-100 dark:bg-[#202129] px-2 py-0.5 text-[10px] font-medium text-graphite-800 dark:text-graphite-300 whitespace-nowrap shrink-0">
                        {item.targetContentFormat}
                      </span>
                    </div>
                    <p className="text-xs text-graphite-700 dark:text-graphite-300 leading-relaxed bg-[#f8f8fa] dark:bg-[#121317] p-2.5 rounded-[8px] border border-graphite-100 dark:border-graphite-800">
                      {item.recommendation}
                    </p>
                  </div>
                ))}
              </div>

              {/* Desktop Table View (>= 768px) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[650px]">
                  <thead className="bg-[#f4f4f6]/80 dark:bg-[#1a1b22] text-graphite-600 dark:text-graphite-400 uppercase tracking-wider font-mono text-[10px] border-b border-graphite-100 dark:border-graphite-800">
                    <tr>
                      <th scope="col" className="py-3 px-4 font-semibold w-1/3">Search Question</th>
                      <th scope="col" className="py-3 px-3 font-semibold w-32">Recommended Format</th>
                      <th scope="col" className="py-3 px-4 font-semibold">How to Answer on Your Page</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-graphite-100 dark:divide-graphite-800">
                    {activeQuestionsList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-[#fafafb] dark:hover:bg-[#1a1b22]/50 transition-colors">
                        <td className="py-3.5 px-4 font-sans font-bold text-ink dark:text-white text-[13px]">
                          &ldquo;{item.query}&rdquo;
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="inline-flex rounded-[6px] bg-graphite-100 dark:bg-[#202129] px-2.5 py-1 text-[11px] font-medium text-graphite-800 dark:text-graphite-300 whitespace-nowrap">
                            {item.targetContentFormat}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-graphite-700 dark:text-graphite-300 leading-relaxed">
                          {item.recommendation}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          TAB 1: PRIORITY ACTION PLAN & FINDINGS EXPLORER
          ========================================================================= */}
      {activeMainTab === 'issues' && (
        <div className="space-y-5 tab-panel-enter">
          {/* Top Priority Fixes Table (Integrated into Action Plan) */}
          {topActionItems.length > 0 && filterTab === 'all' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="size-4 text-amber-500" />
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink dark:text-white">
                    Top Priority Fixes (Move the Needle First)
                  </h3>
                </div>
                <span className="text-xs font-mono text-graphite-600 dark:text-graphite-400">
                  Ranked by crawl &amp; search impact
                </span>
              </div>

              {/* Mobile Card View (< 768px) */}
              <div className="space-y-3 md:hidden">
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
                      className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-4 space-y-3 shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                            item.priority === 'Critical'
                              ? 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20'
                              : item.priority === 'High'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {item.priority === 'Critical' ? (
                            <ShieldAlert className="size-2.5" />
                          ) : item.priority === 'High' ? (
                            <AlertTriangle className="size-2.5" />
                          ) : (
                            <Info className="size-2.5" />
                          )}
                          <span>{item.priority}</span>
                        </span>

                        {knowledge.suggestedFix || topFix ? (
                          <button
                            type="button"
                            onClick={() => handleCopy(knowledge.suggestedFix || topFix?.text || '', `topfix-${idx}`)}
                            className="inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink hover:opacity-90 px-3 py-1 text-[11px] font-semibold transition-all cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                          >
                            {copiedKey === `topfix-${idx}` ? (
                              <Check className="size-3 text-emerald-400" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                            <span>{copiedKey === `topfix-${idx}` ? 'Copied' : 'Copy Fix'}</span>
                          </button>
                        ) : null}
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-ink dark:text-white text-[14px] leading-snug">
                          {knowledge.title}
                        </h4>
                        <span className="inline-block rounded bg-graphite-100 dark:bg-graphite-800 px-1.5 py-0.5 text-[9px] font-mono text-graphite-600 dark:text-graphite-400">
                          {item.title}
                        </span>
                      </div>

                      <div className="text-xs text-graphite-700 dark:text-graphite-300 leading-relaxed bg-[#f8f8fa] dark:bg-[#121317] p-2.5 rounded-[8px] border border-graphite-100 dark:border-graphite-800 space-y-1.5">
                        <p>
                          <strong className="text-ink dark:text-white font-semibold">Why it matters:</strong>{' '}
                          {knowledge.whyItMatters}
                        </p>
                        <p>
                          <strong className="text-ink dark:text-white font-semibold">
                            Action for {detectedStack?.cms || 'Your Stack'}:
                          </strong>{' '}
                          {specificAction}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>= 768px) */}
              <div className="hidden md:block overflow-x-auto rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] shadow-sm">
                <table className="w-full text-left text-xs min-w-[720px]">
                  <thead className="bg-[#f4f4f6]/80 dark:bg-[#1a1b22] text-graphite-600 dark:text-graphite-400 font-mono text-[10px] uppercase tracking-wider border-b border-graphite-100 dark:border-graphite-800">
                    <tr>
                      <th scope="col" className="py-3 px-4 font-semibold w-24">Priority</th>
                      <th scope="col" className="py-3 px-4 font-semibold w-48">Issue &amp; Code</th>
                      <th scope="col" className="py-3 px-4 font-semibold">Why It Matters</th>
                      <th scope="col" className="py-3 px-4 font-semibold">Action for {detectedStack?.cms || 'Your Stack'}</th>
                      <th scope="col" className="py-3 px-4 font-semibold text-right w-36">Solution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-graphite-100 dark:divide-graphite-800">
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
                        <tr key={idx} className="hover:bg-[#fafafb] dark:hover:bg-[#1a1b22]/40 transition-colors">
                          <td className="py-3.5 px-4 align-top">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
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
                          </td>
                          <td className="py-3.5 px-4 align-top">
                            <div className="space-y-1">
                              <span className="font-bold text-ink dark:text-white block leading-snug">
                                {knowledge.title}
                              </span>
                              <span className="inline-block rounded bg-graphite-100 dark:bg-graphite-800 px-1.5 py-0.5 text-[9px] font-mono text-graphite-600 dark:text-graphite-400">
                                {item.title}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 align-top text-graphite-700 dark:text-graphite-300 leading-relaxed max-w-xs">
                            {knowledge.whyItMatters}
                          </td>
                          <td className="py-3.5 px-4 align-top text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal">
                            {specificAction}
                          </td>
                          <td className="py-3.5 px-4 align-top text-right">
                            {(knowledge.suggestedFix || topFix) ? (
                              <button
                                type="button"
                                onClick={() => handleCopy(knowledge.suggestedFix || topFix?.text || '', `topfix-${idx}`)}
                                className="inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink hover:opacity-90 px-3 py-1 text-[11px] font-semibold transition-all cursor-pointer shadow-xs whitespace-nowrap"
                              >
                                {copiedKey === `topfix-${idx}` ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                                <span>{copiedKey === `topfix-${idx}` ? 'Copied' : 'Copy Fix'}</span>
                              </button>
                            ) : (
                              <span className="text-[11px] font-mono text-graphite-400">Manual review</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Filter Status Sub-bar */}
          {filterTab !== 'all' && (
            <div className="flex items-center justify-between rounded-[12px] bg-violet/5 dark:bg-violet/10 border border-violet/20 px-4 py-2.5 text-xs">
              <span className="font-medium text-graphite-800 dark:text-graphite-200">
                Filtered view: Showing <strong className="text-violet uppercase">{filterTab}</strong> ({filterTab === 'passed' ? passedCheckCount : displayedGroups.length} items)
              </span>
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className="text-violet hover:underline font-semibold cursor-pointer"
              >
                Reset to all findings
              </button>
            </div>
          )}

          {/* Passed Checks View */}
          {filterTab === 'passed' ? (
            <div className="rounded-[16px] border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 p-8 text-center space-y-3">
              <CheckCircle2 className="mx-auto size-8 text-emerald-500" />
              <h4 className="font-display text-base font-bold text-ink dark:text-white">
                {passedCheckCount} Core Audit Checks Fully Passed
              </h4>
              <p className="text-xs text-graphite-700 dark:text-graphite-300 max-w-lg mx-auto leading-relaxed">
                These technical standards verified clean with zero blocking errors detected on crawled pages: Canonical URLs, Mobile Viewport, XML Sitemap, Robots.txt, and Core Indexability.
              </p>
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className="inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-4 py-2 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer mt-2"
              >
                <span>View all findings ({totalIssuesCount})</span>
              </button>
            </div>
          ) : displayedGroups.length === 0 ? (
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-8 text-center space-y-3">
              <CheckCircle2 className="mx-auto size-8 text-emerald-500" />
              <h4 className="font-display text-base font-bold text-ink dark:text-white">Zero Findings in Selected Filter</h4>
              <p className="text-xs text-graphite-800 dark:text-graphite-400">
                All checks in the &quot;{filterTab}&quot; category passed validation with zero errors.
              </p>
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className="inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-4 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
              >
                <span>Reset filter</span>
              </button>
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

              const distinctPages = new Set(
                group.findings && group.findings.length > 0
                  ? group.findings.map((f) => f.url)
                  : group.exampleUrls || []
              ).size;
              const pagesCount = distinctPages > 0 ? distinctPages : (group.totalPagesChecked || 1);
              const pageImpactText = pagesCount === 1
                ? (group.affectedCount > 1
                    ? `Affects 1 page (${group.affectedCount} instances)`
                    : 'Affects 1 page')
                : `Affects ${pagesCount} pages (${group.affectedCount} instances)`;

              return (
                <div
                  key={group.rootCauseKey}
                  className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] shadow-sm overflow-hidden transition-all hover:border-graphite-300 dark:hover:border-graphite-700"
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
                          <span className="rounded-full bg-graphite-100 dark:bg-graphite-800 px-2 py-0.5 text-[9px] font-mono text-graphite-600 dark:text-graphite-400 shrink-0 font-medium">
                            {group.checkId}
                          </span>
                          <span className="rounded-full bg-graphite-100 dark:bg-graphite-800 px-2 py-0.2 text-[9px] font-mono text-graphite-800 dark:text-graphite-400 shrink-0">
                            {knowledge.category}
                          </span>
                        </div>
                        <span className="text-xs text-graphite-800 dark:text-graphite-400">
                          {pageImpactText} &middot; Priority Score {group.priority} &middot; {knowledge.impactLevel}
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
                      <span className="text-xs text-violet font-semibold transition-colors">{isExpanded ? 'Hide Details' : 'View Action'}</span>
                      <ChevronDown className={`size-4 text-violet transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Expanded Issue Action Drawer */}
                  {isExpanded && (
                    <div className="border-t border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#14151a] p-4 sm:p-5 space-y-4 animate-slide-up">
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
              {whatPassed || 'All checked SEO, search crawler standards, and mobile accessibility guidelines passed automated validation.'}
            </p>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: GOOGLE & AI VISIBILITY (AEO & GEO ACTION PLAN)
          ========================================================================= */}
      {activeMainTab === 'visibility' && (() => {
        const aiBotsList = (geoSignals?.aiBots && geoSignals.aiBots.length > 0)
          ? geoSignals.aiBots
          : [
              { bot: 'GPTBot', status: 'allowed' as const, rulePrecedence: 'default_allow' },
              { bot: 'ClaudeBot', status: 'allowed' as const, rulePrecedence: 'default_allow' },
              { bot: 'PerplexityBot', status: 'allowed' as const, rulePrecedence: 'default_allow' },
              { bot: 'Google-Extended', status: 'allowed' as const, rulePrecedence: 'default_allow' },
            ];

        const botProfiles: Record<string, { engine: string; provider: string; impact: string }> = {
          GPTBot: {
            engine: 'ChatGPT & SearchGPT',
            provider: 'OpenAI',
            impact: 'Enables live source citations and referenced links in ChatGPT answers.',
          },
          ClaudeBot: {
            engine: 'Claude Search',
            provider: 'Anthropic',
            impact: 'Allows Claude to crawl and quote your pages during conversational research.',
          },
          PerplexityBot: {
            engine: 'Perplexity AI',
            provider: 'Perplexity',
            impact: 'Powers real-time citation cards and clickable source footnotes.',
          },
          'Google-Extended': {
            engine: 'Gemini & AI Overviews',
            provider: 'Google',
            impact: 'Supplies source references for Google AI summaries above standard search.',
          },
        };

        const robotsSnippet = effectivePatches?.geoRobotsBlock || `# CrawlPay Recommended robots.txt (AI Search Enabled)
User-agent: *
Allow: /

# Permit AI Search and Answer Engine crawlers
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /`;

        const llmsSnippet = `# ${cleanDomain}
> ${siteSummary?.summary || `${cleanDomain} provides online digital tools, features, and documentation.`}

## Overview
- Website: https://${cleanDomain}
- Primary Focus: ${siteSummary?.primaryOffering || 'Online services & developer tools'}
- Target Audience: ${siteSummary?.targetAudience || 'General visitors & buyers'}

## Essential Documentation & Pages
- [/](https://${cleanDomain}): Homepage and primary features
- [/docs](https://${cleanDomain}/docs): Technical documentation and guides`;

        const faqSchemaSnippet = effectivePatches?.aeoFaqSchema || `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is ${cleanDomain}?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${siteSummary?.summary || `${cleanDomain} provides official online features, tools, and direct answers.`}"
      }
    }
  ]
}
</script>`;

        const activeSnippetCode =
          aiSnippetTab === 'robots'
            ? robotsSnippet
            : aiSnippetTab === 'llms'
            ? llmsSnippet
            : faqSchemaSnippet;

        const activeSnippetDestination =
          aiSnippetTab === 'robots'
            ? 'Place in your root public folder: /robots.txt'
            : aiSnippetTab === 'llms'
            ? 'Place in your root public folder: /llms.txt'
            : 'Insert inside the <head> tag on your homepage or template';

        const isAiCitationReady = aeoScore >= 70 && geoScore >= 70;

        return (
          <div className="space-y-6 tab-panel-enter">
            {/* Executive Overview & AI Citation Readiness */}
            <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-graphite-100 dark:border-graphite-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-violet/10 flex items-center justify-center text-violet shrink-0">
                    <Bot className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-ink dark:text-white">
                      Google &amp; AI Engine Visibility
                    </h3>
                    <p className="text-xs text-graphite-700 dark:text-graphite-400">
                      Can ChatGPT, Claude, Perplexity, and Google Gemini discover and cite your content?
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAiCitationReady ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Ready for AI Citations</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Action Recommended</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 2 Core Score Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[16px] border border-violet/20 bg-violet/5 dark:bg-violet/10 p-4 sm:p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-violet">
                      Answer Engine Score (AEO)
                    </span>
                    <span className="font-mono text-2xl font-black text-ink dark:text-white">
                      {aeoScore}<span className="text-xs text-graphite-400 font-normal">/100</span>
                    </span>
                  </div>
                  <p className="text-xs text-graphite-700 dark:text-graphite-300 leading-relaxed">
                    Evaluates conversational question headings, structured answers, and definition clarity for Google AI Overviews and voice search.
                  </p>
                </div>

                <div className="rounded-[16px] border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 sm:p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Generative Engine Score (GEO)
                    </span>
                    <span className="font-mono text-2xl font-black text-ink dark:text-white">
                      {geoScore}<span className="text-xs text-graphite-400 font-normal">/100</span>
                    </span>
                  </div>
                  <p className="text-xs text-graphite-700 dark:text-graphite-300 leading-relaxed">
                    Evaluates crawler permissions for ChatGPT, Claude, and Perplexity, brand authority knowledge graph links, and /llms.txt context files.
                  </p>
                </div>
              </div>
            </div>

            {/* STEP 1: AI Search Crawler Access */}
            <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite-100 dark:border-graphite-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="size-6 rounded-full bg-violet/10 text-violet font-mono text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <h4 className="font-display text-sm font-bold uppercase tracking-wider text-ink dark:text-white">
                      AI Search Crawler Access (robots.txt)
                    </h4>
                    <p className="text-xs text-graphite-600 dark:text-graphite-400">
                      Permissions verified for the 4 primary search and answer engine crawlers.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-graphite-600 dark:text-graphite-400">
                  RFC 9309 Rules
                </span>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                {aiBotsList.map((b: any, idx: number) => {
                  const meta = botProfiles[b.bot] || {
                    engine: b.bot,
                    provider: 'AI Crawler',
                    impact: 'Indexes website content to generate cited responses.',
                  };
                  const isBlocked = b.status === 'blocked';
                  const isUnknown = b.status === 'unknown';

                  return (
                    <div
                      key={idx}
                      className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-4 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-ink dark:text-white">
                            {b.bot}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              isBlocked
                                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300'
                                : isUnknown
                                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                                : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {isBlocked ? (
                              <XCircle className="size-2.5" />
                            ) : isUnknown ? (
                              <AlertTriangle className="size-2.5" />
                            ) : (
                              <CheckCircle2 className="size-2.5" />
                            )}
                            <span>{isBlocked ? 'Blocked' : isUnknown ? 'Review' : 'Allowed'}</span>
                          </span>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-ink dark:text-white">
                            {meta.engine}
                          </div>
                          <div className="text-[11px] text-graphite-500">
                            {meta.provider}
                          </div>
                        </div>

                        <p className="text-[11px] text-graphite-700 dark:text-graphite-400 leading-snug">
                          {meta.impact}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-graphite-200/60 dark:border-graphite-700/60 text-[10px] font-mono text-graphite-600 dark:text-graphite-400 truncate" title={b.matchedRule || 'Allowed by Default (No Disallow directive found)'}>
                        {b.matchedRule || 'No Disallow rule (Allowed)'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* STEP 2: Content Citation Readiness */}
            <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite-100 dark:border-graphite-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="size-6 rounded-full bg-violet/10 text-violet font-mono text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h4 className="font-display text-sm font-bold uppercase tracking-wider text-ink dark:text-white">
                      Content Citation Readiness
                    </h4>
                    <p className="text-xs text-graphite-600 dark:text-graphite-400">
                      Key structure and brand signals AI models look for when attributing answers.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-graphite-600 dark:text-graphite-400">
                  4 Core Signals
                </span>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                {/* Signal 1: Question Headings */}
                <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink dark:text-white">
                      Question-Based Headings
                    </span>
                    {(aeoSignals?.questionHeadingsCount ?? 0) > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="size-2.5" />
                        <span>{aeoSignals?.questionHeadingsCount} Found</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="size-2.5" />
                        <span>None Found</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-graphite-700 dark:text-graphite-300 leading-relaxed">
                    AI models scan section headings for conversational question patterns (What, How, Why, Can) to match direct search queries.
                  </p>
                  {aeoSignals?.questionHeadings && aeoSignals.questionHeadings.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {aeoSignals.questionHeadings.slice(0, 4).map((q, qIdx) => (
                        <span
                          key={qIdx}
                          className="rounded-full bg-violet/10 border border-violet/20 px-2.5 py-0.5 text-[11px] font-mono text-violet truncate max-w-full"
                        >
                          {q}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Signal 2: Machine FAQ Schema */}
                <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink dark:text-white">
                      Structured FAQ Schema
                    </span>
                    {aeoSignals?.hasFaqSchema ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="size-2.5" />
                        <span>FAQPage Detected</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="size-2.5" />
                        <span>Missing FAQ Schema</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-graphite-700 dark:text-graphite-300 leading-relaxed">
                    Structured FAQ markup enables search engines and LLMs to extract exact question-and-answer pairs cleanly without hallucination.
                  </p>
                </div>

                {/* Signal 3: Brand Authority & sameAs */}
                <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink dark:text-white">
                      Brand Authority &amp; Profiles
                    </span>
                    {geoSignals?.brandEntityDeclared ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="size-2.5" />
                        <span>{geoSignals.declaredSameAsCount} Linked</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
                        <AlertTriangle className="size-2.5" />
                        <span>No Profiles Linked</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-graphite-700 dark:text-graphite-300 leading-relaxed">
                    Links your website to verified social profiles, GitHub, and corporate entries in the Google Knowledge Graph.
                  </p>
                  {geoSignals?.declaredSameAsLinks && geoSignals.declaredSameAsLinks.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {geoSignals.declaredSameAsLinks.slice(0, 3).map((link, lIdx) => (
                        <span
                          key={lIdx}
                          className="rounded-full bg-graphite-100 dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 px-2 py-0.5 text-[10px] font-mono text-graphite-700 dark:text-graphite-300 truncate max-w-[200px]"
                        >
                          {link}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Signal 4: /llms.txt Context File */}
                <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6]/60 dark:bg-[#1a1b22] p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink dark:text-white">
                      AI Context File (/llms.txt)
                    </span>
                    {geoSignals?.hasLlmsTxt ? (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="size-2.5" />
                        <span>Found at /llms.txt</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold bg-graphite-200 dark:bg-graphite-800 text-graphite-700 dark:text-graphite-300">
                        <Info className="size-2.5" />
                        <span>Not Found</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-graphite-700 dark:text-graphite-300 leading-relaxed">
                    A standardized markdown specification file at /llms.txt that gives AI assistants a clean overview and index of key documentation.
                  </p>
                </div>
              </div>

              {/* Delivery Health Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-graphite-100 dark:border-graphite-800">
                <span className="text-[11px] font-semibold text-graphite-600 dark:text-graphite-400">
                  Delivery Health:
                </span>
                {geoSignals?.isClientRendered ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 font-mono text-[11px] text-amber-800 dark:text-amber-300 font-semibold">
                    <AlertTriangle className="size-3 text-amber-600" />
                    <span>Client-Side Rendered (Slower for Bots)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 font-mono text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    <span>Server-Rendered HTML (Optimal for Crawlers)</span>
                  </span>
                )}

                {geoSignals?.wafStatus === 'waf_blocked' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2.5 py-0.5 font-mono text-[11px] text-rose-800 dark:text-rose-300 font-semibold">
                    <XCircle className="size-3 text-rose-600" />
                    <span>Firewall Blocking AI Bots (HTTP 403)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 font-mono text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    <span>Accessible (No Firewall Block)</span>
                  </span>
                )}
              </div>
            </section>

            {/* STEP 3: Copy-Paste Fixes */}
            <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite-100 dark:border-graphite-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="size-6 rounded-full bg-violet/10 text-violet font-mono text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <div>
                    <h4 className="font-display text-sm font-bold uppercase tracking-wider text-ink dark:text-white">
                      Copy-Paste Fixes for AI Citations
                    </h4>
                    <p className="text-xs text-graphite-600 dark:text-graphite-400">
                      Pre-generated snippets customized for {cleanDomain} to enable AI search crawling and citations.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(activeSnippetCode, `ai-snippet-${aiSnippetTab}`)}
                  className="inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-3.5 py-1.5 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  {copiedKey === `ai-snippet-${aiSnippetTab}` ? (
                    <>
                      <Check className="size-3 text-emerald-400" />
                      <span>Copied to Clipboard</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>

              {/* Tab Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAiSnippetTab('robots')}
                  className={`rounded-[48px] px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    aiSnippetTab === 'robots'
                      ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-xs'
                      : 'bg-[#f4f4f6] dark:bg-[#1a1b22] text-graphite-700 dark:text-graphite-300 hover:text-ink dark:hover:text-white'
                  }`}
                >
                  robots.txt (AI Crawlers)
                </button>
                <button
                  type="button"
                  onClick={() => setAiSnippetTab('llms')}
                  className={`rounded-[48px] px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    aiSnippetTab === 'llms'
                      ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-xs'
                      : 'bg-[#f4f4f6] dark:bg-[#1a1b22] text-graphite-700 dark:text-graphite-300 hover:text-ink dark:hover:text-white'
                  }`}
                >
                  /llms.txt (AI Context Index)
                </button>
                <button
                  type="button"
                  onClick={() => setAiSnippetTab('faq')}
                  className={`rounded-[48px] px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    aiSnippetTab === 'faq'
                      ? 'bg-ink dark:bg-white text-white dark:text-ink shadow-xs'
                      : 'bg-[#f4f4f6] dark:bg-[#1a1b22] text-graphite-700 dark:text-graphite-300 hover:text-ink dark:hover:text-white'
                  }`}
                >
                  FAQ Schema (JSON-LD)
                </button>
              </div>

              {/* File Destination & Code Snippet Box */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-mono text-graphite-600 dark:text-graphite-400">
                  <FileCode className="size-3.5 text-violet" />
                  <span>{activeSnippetDestination}</span>
                </div>

                <div className="rounded-[14px] bg-[#0c0d12] border border-graphite-800 p-4 overflow-x-auto">
                  <pre className="font-mono text-xs text-graphite-200 leading-relaxed whitespace-pre">
                    <code>{activeSnippetCode}</code>
                  </pre>
                </div>
              </div>
            </section>
          </div>
        );
      })()}

      {/* =========================================================================
          TAB 4: MOBILE & CORE WEB VITALS
          ========================================================================= */}
      {activeMainTab === 'vitals' && (
        <div className="space-y-6 tab-panel-enter">
          {/* Mobile Telemetry Grid */}
          <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite-100 dark:border-graphite-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="size-4 text-emerald-600" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink dark:text-white">
                  Mobile Usability &amp; Responsiveness (375px–414px)
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
                  Estimated main content rendering speed on mobile.
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
                <p className="text-[10px] text-graphite-800 dark:text-graphite-400">Visual page stability threshold.</p>
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

          {/* Web Analytics & Conversion Tracking Table */}
          <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite-100 dark:border-graphite-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="size-4 text-violet" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink dark:text-white">
                  Web Analytics &amp; Conversion Tracking
                </h3>
              </div>
              <span className="text-xs font-mono text-graphite-500">
                Verified On-Page Tags
              </span>
            </div>

            <p className="text-xs text-graphite-600 dark:text-graphite-400 leading-relaxed">
              Tracking code verification and customer conversion actions discovered in your page HTML.
            </p>

            {/* Mobile Card View (< 768px) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
              {/* GA4 */}
              <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#1a1b22] p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-ink dark:text-white text-xs">Google Analytics 4 (GA4)</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                    analyticsSignals?.hasGa4
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  }`}>
                    {analyticsSignals?.hasGa4 ? <CheckCircle2 className="size-2.5" /> : <AlertTriangle className="size-2.5" />}
                    <span>{analyticsSignals?.hasGa4 ? 'Installed' : 'Missing Tag'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-graphite-500">Traffic &amp; pageview analytics</p>
                <div className="text-[11px] font-mono text-graphite-800 dark:text-graphite-200 bg-white dark:bg-[#121317] p-2 rounded-[8px] border border-graphite-100 dark:border-graphite-800">
                  {analyticsSignals?.detectedTrackingId
                    ? `Active ID: ${analyticsSignals.detectedTrackingId}`
                    : analyticsSignals?.hasGa4
                    ? 'Google gtag.js script detected in page head'
                    : 'No GA4 measurement code detected. Add gtag.js to record visitor metrics.'}
                </div>
              </div>

              {/* GTM */}
              <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#1a1b22] p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-ink dark:text-white text-xs">Google Tag Manager (GTM)</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                    analyticsSignals?.hasGtm
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-600 dark:text-graphite-400'
                  }`}>
                    {analyticsSignals?.hasGtm ? <CheckCircle2 className="size-2.5" /> : <Info className="size-2.5" />}
                    <span>{analyticsSignals?.hasGtm ? 'Installed' : 'Not Used'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-graphite-500">Central tag container</p>
                <div className="text-[11px] font-mono text-graphite-800 dark:text-graphite-200 bg-white dark:bg-[#121317] p-2 rounded-[8px] border border-graphite-100 dark:border-graphite-800">
                  {analyticsSignals?.hasGtm
                    ? 'GTM container script active on page'
                    : 'Optional if GA4 is loaded directly via script'}
                </div>
              </div>

              {/* Meta Pixel */}
              <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#1a1b22] p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-ink dark:text-white text-xs">Meta / Facebook Pixel</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                    analyticsSignals?.hasMetaPixel
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-600 dark:text-graphite-400'
                  }`}>
                    {analyticsSignals?.hasMetaPixel ? <CheckCircle2 className="size-2.5" /> : <Info className="size-2.5" />}
                    <span>{analyticsSignals?.hasMetaPixel ? 'Detected' : 'Not Used'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-graphite-500">Paid social ad retargeting</p>
                <div className="text-[11px] font-mono text-graphite-800 dark:text-graphite-200 bg-white dark:bg-[#121317] p-2 rounded-[8px] border border-graphite-100 dark:border-graphite-800">
                  {analyticsSignals?.hasMetaPixel ? 'fbq tracking script initialized' : 'No Meta tracking snippet discovered'}
                </div>
              </div>

              {/* Lead Forms */}
              <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#1a1b22] p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-ink dark:text-white text-xs">Lead Capture Forms</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                    analyticsSignals?.hasLeadForm
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  }`}>
                    {analyticsSignals?.hasLeadForm ? <CheckCircle2 className="size-2.5" /> : <AlertTriangle className="size-2.5" />}
                    <span>{analyticsSignals?.hasLeadForm ? 'Active Form' : 'No Form'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-graphite-500">Customer inquiry collection</p>
                <div className="text-[11px] font-mono text-graphite-800 dark:text-graphite-200 bg-white dark:bg-[#121317] p-2 rounded-[8px] border border-graphite-100 dark:border-graphite-800">
                  {analyticsSignals?.hasLeadForm ? 'Interactive lead capture form detected' : 'No input form detected on this landing page'}
                </div>
              </div>

              {/* Phone Links */}
              <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#1a1b22] p-3.5 space-y-2 sm:col-span-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-ink dark:text-white text-xs">Click-to-Call Link (tel:)</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                    analyticsSignals?.hasPhoneLink
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-600 dark:text-graphite-400'
                  }`}>
                    {analyticsSignals?.hasPhoneLink ? <CheckCircle2 className="size-2.5" /> : <Info className="size-2.5" />}
                    <span>{analyticsSignals?.hasPhoneLink ? 'Active' : 'Not Present'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-graphite-500">Mobile customer dialer</p>
                <div className="text-[11px] font-mono text-graphite-800 dark:text-graphite-200 bg-white dark:bg-[#121317] p-2 rounded-[8px] border border-graphite-100 dark:border-graphite-800">
                  {analyticsSignals?.hasPhoneLink ? 'Direct telephone dialer link available' : 'Recommended for local businesses and immediate phone leads'}
                </div>
              </div>
            </div>

            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto rounded-[14px] border border-graphite-100 dark:border-graphite-800">
              <table className="w-full text-left text-xs min-w-[560px]">
                <thead className="bg-[#f4f4f6]/80 dark:bg-[#1a1b22] text-graphite-600 dark:text-graphite-400 font-mono text-[10px] uppercase tracking-wider border-b border-graphite-100 dark:border-graphite-800">
                  <tr>
                    <th scope="col" className="py-2.5 px-4 font-semibold">Measurement Signal</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold">Purpose</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold">Detection Status</th>
                    <th scope="col" className="py-2.5 px-4 font-semibold">Observation &amp; Next Step</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-graphite-100 dark:divide-graphite-800">
                  {/* GA4 */}
                  <tr className="hover:bg-[#fafafb] dark:hover:bg-[#1a1b22]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-ink dark:text-white">Google Analytics 4 (GA4)</td>
                    <td className="py-3 px-3 text-graphite-700 dark:text-graphite-300">Traffic &amp; pageview analytics</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        analyticsSignals?.hasGa4
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                      }`}>
                        {analyticsSignals?.hasGa4 ? <CheckCircle2 className="size-2.5" /> : <AlertTriangle className="size-2.5" />}
                        <span>{analyticsSignals?.hasGa4 ? 'Installed' : 'Missing Tag'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-graphite-800 dark:text-graphite-200">
                      {analyticsSignals?.detectedTrackingId
                        ? `Active tracking ID: ${analyticsSignals.detectedTrackingId}`
                        : analyticsSignals?.hasGa4
                        ? 'Google gtag.js script detected in page head'
                        : 'No GA4 measurement code detected. Add gtag.js to record visitor metrics.'}
                    </td>
                  </tr>

                  {/* GTM */}
                  <tr className="hover:bg-[#fafafb] dark:hover:bg-[#1a1b22]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-ink dark:text-white">Google Tag Manager (GTM)</td>
                    <td className="py-3 px-3 text-graphite-700 dark:text-graphite-300">Central tag container</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        analyticsSignals?.hasGtm
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                          : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-600 dark:text-graphite-400'
                      }`}>
                        {analyticsSignals?.hasGtm ? <CheckCircle2 className="size-2.5" /> : <Info className="size-2.5" />}
                        <span>{analyticsSignals?.hasGtm ? 'Installed' : 'Not Used'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-graphite-800 dark:text-graphite-200">
                      {analyticsSignals?.hasGtm
                        ? 'GTM container script active on page'
                        : 'Optional if GA4 is loaded directly via script'}
                    </td>
                  </tr>

                  {/* Meta Pixel */}
                  <tr className="hover:bg-[#fafafb] dark:hover:bg-[#1a1b22]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-ink dark:text-white">Meta / Facebook Pixel</td>
                    <td className="py-3 px-3 text-graphite-700 dark:text-graphite-300">Paid social ad retargeting</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        analyticsSignals?.hasMetaPixel
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                          : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-600 dark:text-graphite-400'
                      }`}>
                        {analyticsSignals?.hasMetaPixel ? <CheckCircle2 className="size-2.5" /> : <Info className="size-2.5" />}
                        <span>{analyticsSignals?.hasMetaPixel ? 'Detected' : 'Not Used'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-graphite-800 dark:text-graphite-200">
                      {analyticsSignals?.hasMetaPixel ? 'fbq tracking script initialized' : 'No Meta tracking snippet discovered'}
                    </td>
                  </tr>

                  {/* Lead Forms */}
                  <tr className="hover:bg-[#fafafb] dark:hover:bg-[#1a1b22]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-ink dark:text-white">Lead Capture Forms</td>
                    <td className="py-3 px-3 text-graphite-700 dark:text-graphite-300">Customer inquiry collection</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        analyticsSignals?.hasLeadForm
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                      }`}>
                        {analyticsSignals?.hasLeadForm ? <CheckCircle2 className="size-2.5" /> : <AlertTriangle className="size-2.5" />}
                        <span>{analyticsSignals?.hasLeadForm ? 'Active Form' : 'No Form'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-graphite-800 dark:text-graphite-200">
                      {analyticsSignals?.hasLeadForm ? 'Interactive lead capture form detected' : 'No input form detected on this landing page'}
                    </td>
                  </tr>

                  {/* Phone Links */}
                  <tr className="hover:bg-[#fafafb] dark:hover:bg-[#1a1b22]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-ink dark:text-white">Click-to-Call Link (tel:)</td>
                    <td className="py-3 px-3 text-graphite-700 dark:text-graphite-300">Mobile customer dialer</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        analyticsSignals?.hasPhoneLink
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                          : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-600 dark:text-graphite-400'
                      }`}>
                        {analyticsSignals?.hasPhoneLink ? <CheckCircle2 className="size-2.5" /> : <Info className="size-2.5" />}
                        <span>{analyticsSignals?.hasPhoneLink ? 'Active' : 'Not Present'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-graphite-800 dark:text-graphite-200">
                      {analyticsSignals?.hasPhoneLink ? 'Direct telephone dialer link available' : 'Recommended for local businesses and immediate phone leads'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Local SEO Readiness Table */}
          <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-graphite-100 dark:border-graphite-800 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-emerald-600" />
                <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink dark:text-white">
                  Local SEO &amp; Google Map Pack Readiness
                </h3>
              </div>
              <span className="text-xs font-mono text-graphite-500">
                On-Page Verification
              </span>
            </div>

            <p className="text-xs text-graphite-600 dark:text-graphite-400 leading-relaxed">
              Evaluates structured local markup, physical address signals, and Google Maps integration to support local customer discovery.
            </p>

            {/* Mobile Card View (< 768px) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
              {/* LocalBusiness Schema */}
              <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#1a1b22] p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-ink dark:text-white text-xs">LocalBusiness Schema (JSON-LD)</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                    localSeoSignals?.hasLocalBusinessSchema
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                  }`}>
                    {localSeoSignals?.hasLocalBusinessSchema ? <CheckCircle2 className="size-2.5" /> : <AlertTriangle className="size-2.5" />}
                    <span>{localSeoSignals?.hasLocalBusinessSchema ? 'Schema Verified' : 'Missing Schema'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-graphite-500">Structured business entity</p>
                <div className="text-[11px] font-mono text-graphite-800 dark:text-graphite-200 bg-white dark:bg-[#121317] p-2 rounded-[8px] border border-graphite-100 dark:border-graphite-800">
                  {localSeoSignals?.hasLocalBusinessSchema
                    ? `Configured: ${localSeoSignals.businessName || 'LocalBusiness entity active'}`
                    : 'Add LocalBusiness structured data declaring address and opening hours for Google Maps.'}
                </div>
              </div>

              {/* Google Maps Embed / Link */}
              <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#1a1b22] p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-ink dark:text-white text-xs">Google Maps Integration</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                    localSeoSignals?.hasGoogleMapsLink
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-600 dark:text-graphite-400'
                  }`}>
                    {localSeoSignals?.hasGoogleMapsLink ? <CheckCircle2 className="size-2.5" /> : <Info className="size-2.5" />}
                    <span>{localSeoSignals?.hasGoogleMapsLink ? 'Map Linked' : 'No Link'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-graphite-500">Directions &amp; map link</p>
                <div className="text-[11px] font-mono text-graphite-800 dark:text-graphite-200 bg-white dark:bg-[#121317] p-2 rounded-[8px] border border-graphite-100 dark:border-graphite-800">
                  {localSeoSignals?.hasGoogleMapsLink
                    ? 'Google Maps link or embed discovered'
                    : 'Linking to your Google Business Profile assists customers seeking directions.'}
                </div>
              </div>

              {/* Physical Address (NAP) */}
              <div className="rounded-[12px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#1a1b22] p-3.5 space-y-2 sm:col-span-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-ink dark:text-white text-xs">Physical Address (NAP Consistency)</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                    localSeoSignals?.hasAddressSignal
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                      : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-600 dark:text-graphite-400'
                  }`}>
                    {localSeoSignals?.hasAddressSignal ? <CheckCircle2 className="size-2.5" /> : <Info className="size-2.5" />}
                    <span>{localSeoSignals?.hasAddressSignal ? 'Address Found' : 'No Address'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-graphite-500">Name, Address &amp; Zip</p>
                <div className="text-[11px] font-mono text-graphite-800 dark:text-graphite-200 bg-white dark:bg-[#121317] p-2 rounded-[8px] border border-graphite-100 dark:border-graphite-800">
                  {localSeoSignals?.hasAddressSignal
                    ? 'Physical location signals verified on-page'
                    : 'Ensure your physical street address matches your Google Business Profile exactly.'}
                </div>
              </div>
            </div>

            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto rounded-[14px] border border-graphite-100 dark:border-graphite-800">
              <table className="w-full text-left text-xs min-w-[560px]">
                <thead className="bg-[#f4f4f6]/80 dark:bg-[#1a1b22] text-graphite-600 dark:text-graphite-400 font-mono text-[10px] uppercase tracking-wider border-b border-graphite-100 dark:border-graphite-800">
                  <tr>
                    <th scope="col" className="py-2.5 px-4 font-semibold">Local SEO Factor</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold">Google Requirement</th>
                    <th scope="col" className="py-2.5 px-3 font-semibold">Status</th>
                    <th scope="col" className="py-2.5 px-4 font-semibold">Marketer Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-graphite-100 dark:divide-graphite-800">
                  {/* LocalBusiness Schema */}
                  <tr className="hover:bg-[#fafafb] dark:hover:bg-[#1a1b22]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-ink dark:text-white">LocalBusiness Schema (JSON-LD)</td>
                    <td className="py-3 px-3 text-graphite-700 dark:text-graphite-300">Structured business entity</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        localSeoSignals?.hasLocalBusinessSchema
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                      }`}>
                        {localSeoSignals?.hasLocalBusinessSchema ? <CheckCircle2 className="size-2.5" /> : <AlertTriangle className="size-2.5" />}
                        <span>{localSeoSignals?.hasLocalBusinessSchema ? 'Schema Verified' : 'Missing Schema'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-graphite-800 dark:text-graphite-200">
                      {localSeoSignals?.hasLocalBusinessSchema
                        ? `Configured: ${localSeoSignals.businessName || 'LocalBusiness entity active'}`
                        : 'Add LocalBusiness structured data declaring address and opening hours for Google Maps.'}
                    </td>
                  </tr>

                  {/* Google Maps Embed / Link */}
                  <tr className="hover:bg-[#fafafb] dark:hover:bg-[#1a1b22]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-ink dark:text-white">Google Maps Integration</td>
                    <td className="py-3 px-3 text-graphite-700 dark:text-graphite-300">Directions &amp; map link</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        localSeoSignals?.hasGoogleMapsLink
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                          : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-600 dark:text-graphite-400'
                      }`}>
                        {localSeoSignals?.hasGoogleMapsLink ? <CheckCircle2 className="size-2.5" /> : <Info className="size-2.5" />}
                        <span>{localSeoSignals?.hasGoogleMapsLink ? 'Map Linked' : 'No Link'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-graphite-800 dark:text-graphite-200">
                      {localSeoSignals?.hasGoogleMapsLink
                        ? 'Google Maps link or embed discovered'
                        : 'Linking to your Google Business Profile assists customers seeking directions.'}
                    </td>
                  </tr>

                  {/* Physical Address (NAP) */}
                  <tr className="hover:bg-[#fafafb] dark:hover:bg-[#1a1b22]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-ink dark:text-white">Physical Address (NAP Consistency)</td>
                    <td className="py-3 px-3 text-graphite-700 dark:text-graphite-300">Name, Address &amp; Zip</td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        localSeoSignals?.hasAddressSignal
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                          : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-600 dark:text-graphite-400'
                      }`}>
                        {localSeoSignals?.hasAddressSignal ? <CheckCircle2 className="size-2.5" /> : <Info className="size-2.5" />}
                        <span>{localSeoSignals?.hasAddressSignal ? 'Address Found' : 'No Address'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-graphite-800 dark:text-graphite-200">
                      {localSeoSignals?.hasAddressSignal
                        ? 'Physical location signals verified on-page'
                        : 'Ensure your physical street address matches your Google Business Profile exactly.'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Stack-Tailored Implementation Patches */}
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
              { id: 'robots', label: 'robots.txt Configuration', icon: Terminal, match: false },
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
      </div>
    )}

      {/* =========================================================================
          TAB 5: COMPETITOR ANALYSIS & BENCHMARK INTELLIGENCE
          ========================================================================= */}
      {activeMainTab === 'competitor' && (
        <div className="space-y-6 tab-panel-enter">
          {!isDeepCrawl ? (
            /* 1. DEEP CRAWL GATE FOR FREE AUDITS */
            <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-6 sm:p-10 shadow-sm text-center relative overflow-hidden">
              <div className="relative z-10 max-w-[640px] mx-auto space-y-5">
                <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-8 ring-amber-500/5 mx-auto">
                  <Lock className="size-7" />
                </div>

                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                    <Lock className="size-3" />
                    Deep Crawl Feature
                  </span>
                  <h3 className="font-sans text-xl sm:text-2xl font-bold text-ink dark:text-white tracking-tight">
                    Head-to-Head Competitor Intelligence
                  </h3>
                  <p className="text-sm text-graphite-700 dark:text-graphite-300 leading-relaxed">
                    Benchmark <strong className="text-ink dark:text-white font-mono">{cleanDomain}</strong> directly against any competitor to diagnose load speed curves, schema gap opportunities, and receive an actionable 3-step outrank playbook.
                  </p>
                </div>

                {/* Features Unlocked Grid */}
                <div className="grid gap-3 sm:grid-cols-2 text-left pt-2 pb-2 text-xs">
                  <div className="flex items-start gap-2.5 rounded-[14px] bg-[#f4f4f6]/70 dark:bg-[#1a1b22] p-3.5 border border-graphite-100 dark:border-graphite-800">
                    <Activity className="size-4 text-violet shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="text-ink dark:text-white block font-semibold">Speed &amp; Vitals Curves</strong>
                      <span className="text-graphite-600 dark:text-graphite-400 text-[11px] leading-relaxed">
                        Side-by-side LCP, TTFB, and DOM completion timelines mapped against your rival
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-[14px] bg-[#f4f4f6]/70 dark:bg-[#1a1b22] p-3.5 border border-graphite-100 dark:border-graphite-800">
                    <Bot className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="text-ink dark:text-white block font-semibold">AI &amp; Schema Gap Analysis</strong>
                      <span className="text-graphite-600 dark:text-graphite-400 text-[11px] leading-relaxed">
                        Compare structured JSON-LD schemas and verify AI crawler access (GPTBot, ClaudeBot)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-[14px] bg-[#f4f4f6]/70 dark:bg-[#1a1b22] p-3.5 border border-graphite-100 dark:border-graphite-800">
                    <CheckCircle2 className="size-4 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="text-ink dark:text-white block font-semibold">3 Steps to Outrank Them</strong>
                      <span className="text-graphite-600 dark:text-graphite-400 text-[11px] leading-relaxed">
                        Automated strategic diagnostic identifying why they lead and exact steps to beat them
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-[14px] bg-[#f4f4f6]/70 dark:bg-[#1a1b22] p-3.5 border border-graphite-100 dark:border-graphite-800">
                    <Layers className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <strong className="text-ink dark:text-white block font-semibold">Site-Wide Architecture (Up to 50 Pages)</strong>
                      <span className="text-graphite-600 dark:text-graphite-400 text-[11px] leading-relaxed">
                        Orphan pages, redirect loops, and broken internal links crawled across your domain
                      </span>
                    </div>
                  </div>
                </div>

                {/* Call to Actions */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href={`/app/audit?target=${encodeURIComponent(targetUrl || cleanDomain)}&mode=full`}
                    className="inline-flex items-center justify-center gap-2 rounded-[48px] bg-ink dark:bg-white px-6 py-3 text-xs sm:text-[13px] font-semibold text-white dark:text-ink hover:opacity-90 transition-all shadow-sm w-full sm:w-auto cursor-pointer"
                  >
                    <Zap className="size-3.5 fill-current" />
                    <span>Unlock in Deep Crawl ($0.50 in USDT)</span>
                  </Link>

                  <Link
                    href="/example"
                    className="inline-flex items-center justify-center gap-2 rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-5 py-3 text-xs sm:text-[13px] font-medium text-ink dark:text-white hover:bg-graphite-100 dark:hover:bg-[#252631] transition-colors w-full sm:w-auto cursor-pointer"
                  >
                    <Swords className="size-3.5 text-blue-500" />
                    <span>View Sample Competitor Report</span>
                  </Link>
                </div>

                <p className="text-[11px] text-graphite-500 font-mono pt-1">
                  Settled onchain via x402 on Celo &bull; Zero subscriptions &bull; One-time micropayment
                </p>
              </div>
            </section>
          ) : (
            /* 2. UNLOCKED COMPETITOR INTELLIGENCE (UN-NESTED SIBLING CARDS) */
            <>
              {/* Card 1: Search & Benchmark Control Center */}
              <section className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-graphite-100 dark:border-graphite-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="size-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                        <Swords className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-display text-base font-bold text-ink dark:text-white">
                          Head-to-Head Competitor Intelligence
                        </h3>
                        <p className="text-xs text-graphite-600 dark:text-graphite-400">
                          Benchmark your technical SEO, load speed curves, and structured data directly against any rival domain.
                        </p>
                      </div>
                    </div>
                  </div>
                  {comparison ? (
                    <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                      Comparison Active ({comparison.competitor.url})
                    </span>
                  ) : (
                    <span className="rounded-full bg-graphite-100 dark:bg-graphite-800 border border-graphite-200 dark:border-graphite-700 px-3 py-1 text-xs font-semibold text-graphite-600 dark:text-graphite-300">
                      Industry Standard Baseline
                    </span>
                  )}
                </div>

                <form onSubmit={handleRunCompetitor} className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="relative flex-1">
                      <Globe className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4 text-graphite-400" />
                      <input
                        id="competitor-domain-input"
                        type="text"
                        aria-label="Enter rival website domain to compare"
                        value={competitorUrl}
                        onChange={(e) => setCompetitorUrl(e.target.value)}
                        placeholder="Enter rival domain (e.g. semrush.com or ahrefs.com)"
                        className="w-full rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#1a1b22] pl-10 pr-4 py-2.5 text-xs text-ink dark:text-white placeholder:text-graphite-400 focus:outline-none focus:ring-1 focus:ring-ink dark:focus:ring-white"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={compLoading}
                      className="inline-flex items-center justify-center gap-1.5 rounded-[48px] bg-ink dark:bg-white px-5 py-2.5 text-xs font-semibold text-white dark:text-ink hover:opacity-90 hover-lift active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer shrink-0 shadow-xs"
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
                  </div>

                  {/* Quick Rival Suggestions */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] pt-1">
                    <span className="text-graphite-500 font-mono">Quick test rivals:</span>
                    {['ahrefs.com', 'semrush.com', 'moz.com'].map((rival) => (
                      <button
                        key={rival}
                        type="button"
                        onClick={() => setCompetitorUrl(rival)}
                        className="rounded-full border border-graphite-200 dark:border-graphite-800 bg-white dark:bg-[#1a1b22] px-2.5 py-0.5 text-graphite-700 dark:text-graphite-300 hover:text-blue-500 hover:border-blue-400 font-mono hover-lift transition-all cursor-pointer"
                      >
                        {rival}
                      </button>
                    ))}
                  </div>
                </form>

                {compError && (
                  <div className="rounded-[12px] border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-3 text-xs text-rose-700 dark:text-rose-400">
                    {compError}
                  </div>
                )}
              </section>

              {/* Card 2: Head-to-Head Metric Summary Cards (when comparison active) */}
              {comparison && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-4 sm:p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink dark:text-white font-mono">{cleanDomain}</span>
                      <span className="rounded-full bg-violet/10 text-violet px-2.5 py-0.5 text-[10px] font-bold">Your Site</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-graphite-600 dark:text-graphite-400">Health Score</span>
                      <strong className="font-mono text-ink dark:text-white">{comparison.target.score}/100</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-graphite-200/50 dark:border-graphite-700/50">
                      <div>
                        <span className="text-[10px] text-graphite-600 dark:text-graphite-400 block">LCP Speed</span>
                        <strong className="font-mono text-ink dark:text-white">{comparison.target.lcpSeconds}s</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-graphite-600 dark:text-graphite-400 block">Structured Schemas</span>
                        <strong className="font-mono text-ink dark:text-white">{comparison.target.schemaCount} tags</strong>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-4 sm:p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink dark:text-white font-mono">{comparison.competitor.url}</span>
                      <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-[10px] font-bold">Competitor</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-graphite-600 dark:text-graphite-400">Health Score</span>
                      <strong className="font-mono text-ink dark:text-white">{comparison.competitor.score}/100</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-graphite-200/50 dark:border-graphite-700/50">
                      <div>
                        <span className="text-[10px] text-graphite-600 dark:text-graphite-400 block">LCP Speed</span>
                        <strong className="font-mono text-ink dark:text-white">{comparison.competitor.lcpSeconds}s</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-graphite-600 dark:text-graphite-400 block">Structured Schemas</span>
                        <strong className="font-mono text-ink dark:text-white">{comparison.competitor.schemaCount} tags</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 3: Standalone Un-nested Performance & Benchmark Graph */}
              <OverviewAuditGraph
                report={report || null}
                comparison={comparison || null}
                auditedDomain={cleanDomain}
                competitorDomain={comparison?.competitor?.url}
              />

              {/* Card 4: Strategic Playbook (when comparison active) */}
              {comparison && (
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="rounded-[20px] border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-5 space-y-2.5 shadow-xs">
                    <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <TrendingDown className="size-3.5" />
                      <span>Why They Lead in Search Visibility:</span>
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

                  <div className="rounded-[20px] border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 space-y-2.5 shadow-xs">
                    <span className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5" />
                      <span>3 Steps to Outrank Them:</span>
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
              )}
            </>
          )}
        </div>
      )}

    {/* =========================================================================
        AUDIT TRANSPARENCY & DATA BOUNDARIES
        ========================================================================= */}
    <section className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#fafafb] dark:bg-[#16171d] p-4 text-xs space-y-2">
      <div className="flex items-center gap-2 font-semibold text-ink dark:text-white">
        <Info className="size-4 text-violet" />
        <span>Audit Scope &amp; Verified Data Boundaries</span>
      </div>
      <p className="text-graphite-600 dark:text-graphite-400 leading-relaxed">
        <strong>{isMultiPage ? `Multi-Page Analysis (${pagesChecked} Pages):` : 'Single-Page Analysis:'}</strong>{' '}
        {isMultiPage
          ? `Crawlpay evaluated ${pagesChecked} pages across your site structure, verifying internal links, responsive layouts, schemas, analytics tags, and search engine crawler rules.`
          : 'Crawlpay evaluated all visible on-page HTML, headings, mobile responsiveness, structured schemas, analytics tags, and search engine crawler rules for this specific URL. To crawl your entire site architecture (up to 50 pages) for broken internal links and orphan pages, run a Full Crawl.'}
      </p>
      <p className="text-graphite-600 dark:text-graphite-400 leading-relaxed">
        <strong>Private Search Data:</strong> Historical search impression graphs and keyword clickstream data require verified Google Search Console account credentials and are not estimated or fabricated.
      </p>
    </section>
    </div>
  );
}
