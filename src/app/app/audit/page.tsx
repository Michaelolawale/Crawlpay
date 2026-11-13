'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  UploadCloud,
  FileSpreadsheet,
  X,
  Zap,
  Globe,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Layers,
  ArrowRight,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { PaymentModal } from '@/components/PaymentModal';
import { CheckEngineView } from '@/components/CheckEngineView';
import { parseGscFile, GscAnalysisResult } from '@/utils/gscParser';
import exampleReportData from '@/data/exampleReport.json';
import { FullAuditReport } from '@/types/audit';
import { focusRing } from '@/components/SiteHeader';
import { useConfig } from '@/context/ConfigContext';

function AuditPageContent() {
  const router = useRouter();
  const { fullPriceFormatted } = useConfig();
  const searchParams = useSearchParams();
  const initialTarget = searchParams.get('target') || '';
  const initialMode = searchParams.get('mode') || searchParams.get('depth');

  const [targetUrl, setTargetUrl] = useState(initialTarget);
  const [depth, setDepth] = useState<'quick' | 'full'>(
    initialMode === 'full' || initialMode === 'deep' ? 'full' : 'quick'
  );
  const [gscAnalysis, setGscAnalysis] = useState<GscAnalysisResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRunningFreeAudit, setIsRunningFreeAudit] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedReport, setCompletedReport] = useState<FullAuditReport | null>(null);
  const [freeQuota, setFreeQuota] = useState<{
    remaining: number;
    limit: number;
    remainingHourly: number;
    limitHourly: number;
    remainingDaily: number;
    limitDaily: number;
    limitType?: 'hourly' | 'daily';
    retryAfterSec?: number;
  }>({
    remaining: 5,
    limit: 5,
    remainingHourly: 5,
    limitHourly: 5,
    remainingDaily: 20,
    limitDaily: 20,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchQuota = async () => {
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const data = await res.json();
        if (typeof data.remaining === 'number') {
          setFreeQuota({
            remaining: data.remaining,
            limit: data.limit || 5,
            remainingHourly: typeof data.remainingHourly === 'number' ? data.remainingHourly : data.remaining,
            limitHourly: data.limitHourly || 5,
            remainingDaily: typeof data.remainingDaily === 'number' ? data.remainingDaily : 20,
            limitDaily: data.limitDaily || 20,
            limitType: data.limitType,
            retryAfterSec: data.retryAfterSec,
          });
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchQuota();
  }, []);

  useEffect(() => {
    document.title = 'Audit your website | CrawlPay';
  }, []);

  useEffect(() => {
    if (initialTarget) {
      setTargetUrl(initialTarget);
    }
    const mode = searchParams.get('mode') || searchParams.get('depth');
    if (mode === 'full' || mode === 'deep') {
      setDepth('full');
    } else if (mode === 'quick') {
      setDepth('quick');
    }
  }, [initialTarget, searchParams]);

  useEffect(() => {
    if (searchParams.get('sample') === 'true' || searchParams.get('demo') === 'true') {
      setCompletedReport(exampleReportData as unknown as FullAuditReport);
    }
  }, [searchParams]);

  // URL validation check
  const isValidUrl = (url: string): boolean => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    try {
      const withScheme = trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? trimmed
        : `https://${trimmed}`;
      const parsed = new URL(withScheme);
      return parsed.hostname.includes('.') && parsed.hostname.length >= 4;
    } catch {
      return false;
    }
  };

  const isFormValid = isValidUrl(targetUrl);

  // Handle Search Console export upload (CSV, JSON, TSV, or ZIP)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    try {
      const parsed = await parseGscFile(file);
      if (parsed.unindexedUrls.length === 0) {
        setErrorMsg(`No valid URLs found in "${file.name}". Please ensure your GSC export contains a URL or Page column.`);
        setGscAnalysis(null);
      } else {
        setGscAnalysis(parsed);
        // Autofill target URL if empty
        if (!targetUrl.trim() && parsed.suggestedDomain) {
          setTargetUrl(parsed.suggestedDomain);
        }
      }
    } catch (err: any) {
      console.warn('GSC upload error:', err);
      setErrorMsg(`Failed to parse Search Console export: ${err?.message || 'Invalid format'}`);
      setGscAnalysis(null);
    }
  };

  const clearGscFile = () => {
    setGscAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isRunningFreeAudit) return;
    setErrorMsg(null);

    if (depth === 'full') {
      setIsModalOpen(true);
      return;
    }

    // Free Quick Audit execution
    setIsRunningFreeAudit(true);
    setCompletedReport(null);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          mode: 'quick',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setFreeQuota((prev) => ({
            ...prev,
            remaining: 0,
            remainingHourly: typeof data.remainingHourly === 'number' ? data.remainingHourly : (data.limitType === 'hourly' ? 0 : prev.remainingHourly),
            remainingDaily: typeof data.remainingDaily === 'number' ? data.remainingDaily : (data.limitType === 'daily' ? 0 : prev.remainingDaily),
            limitType: data.limitType || 'hourly',
            retryAfterSec: data.retryAfterSec || 3600,
          }));
          throw new Error(
            data.error || 'Free quick audit limit reached (5 per hour, 20 per day cap). You can start a deep crawl or wait for the cooldown.'
          );
        }
        throw new Error(data.error || 'Quick audit execution failed.');
      }

      // Read remaining quota or refetch
      fetchQuota();

      const repId = `rep_${Date.now()}`;
      setCompletedReport(data);

      try {
        const groups = data.prioritizedGroups || data.checkEngineReport?.prioritizedGroups || [];
        const critical = groups.filter((g: any) => g.severity === 'critical').reduce((acc: number, g: any) => acc + (g.affectedCount || 1), 0);
        const high = groups.filter((g: any) => g.severity === 'high').reduce((acc: number, g: any) => acc + (g.affectedCount || 1), 0);
        const medium = groups.filter((g: any) => g.severity === 'medium').reduce((acc: number, g: any) => acc + (g.affectedCount || 1), 0);
        const low = groups.filter((g: any) => g.severity === 'low' || g.severity === 'info').reduce((acc: number, g: any) => acc + (g.affectedCount || 1), 0);

        const stored = localStorage.getItem('crawlpay_reports');
        const list = stored ? JSON.parse(stored) : [];
        list.unshift({
          id: repId,
          targetUrl,
          date: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          overallScore: data.scores?.overall || 85,
          mode: 'quick',
          pagesChecked: data.pagesChecked || 1,
          issuesCount: {
            critical,
            high,
            medium,
            low,
            total: critical + high + medium + low,
          },
          reportData: data,
        });
        localStorage.setItem('crawlpay_reports', JSON.stringify(list.slice(0, 50)));
      } catch { }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Quick audit execution failed.');
    } finally {
      setIsRunningFreeAudit(false);
    }
  };

  const handleAuditReady = (report: FullAuditReport, _reportId: string) => {
    setCompletedReport(report);
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-fade-in">
      <div>
        <h1 className="font-sans text-[26px] sm:text-[34px] font-[600] tracking-tight text-ink dark:text-white leading-tight">
          Audit your website for search and AI
        </h1>
        <p className="mt-2 text-[15px] sm:text-[16px] text-graphite-800 dark:text-graphite-200 leading-relaxed font-normal max-w-[760px]">
          CrawlPay checks your pages the way search engines and AI assistants see them, identifies technical blockers, and provides paste-ready code fixes.
        </p>
      </div>

      {/* Main Audit Form Card */}
      <div className="rounded-[20px] border border-graphite-200 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#16171d] p-5 sm:p-8 shadow-sm">
        <form onSubmit={handleStartAudit} className="space-y-6">
          {/* URL Input Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="target-url" className="block text-[14px] font-medium text-ink dark:text-white">
                Website address
              </label>
              <span className="text-[12px] text-graphite-600 dark:text-graphite-400">Single page or domain</span>
            </div>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <Globe className="size-4 text-graphite-500" />
              </div>
              <input
                id="target-url"
                type="text"
                placeholder="example.com or yoursite.com"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className={`block w-full rounded-[32px] border border-ink dark:border-graphite-700 bg-white dark:bg-[#111216] py-3 pl-11 pr-4 text-[15px] sm:text-[16px] text-ink dark:text-white placeholder:text-graphite-500 transition-all ${focusRing}`}
              />
            </div>
            {targetUrl && !isFormValid && (
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
                Please enter a valid website domain or URL (e.g. example.com).
              </p>
            )}

            {/* Quick Suggestions when empty */}
            {!targetUrl && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-graphite-600 dark:text-graphite-400">Try a sample:</span>
                  {['crawlpay.vercel.app', 'linear.app', 'stripe.com'].map((domain) => (
                    <button
                      key={domain}
                      type="button"
                      onClick={() => setTargetUrl(domain)}
                      className={`rounded-full border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-3 py-0.5 text-graphite-800 dark:text-graphite-200 hover:border-violet hover:text-violet transition-colors cursor-pointer ${focusRing}`}
                    >
                      {domain}
                    </button>
                  ))}
                </div>
                <Link
                  href="/example"
                  className={`inline-flex items-center gap-1 text-violet hover:underline font-medium ${focusRing}`}
                >
                  <span>Or view a sample report</span>
                  <ArrowRight className="size-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Depth Selector Cards (Semantic Radio Inputs per DESIGN.md) */}
          <fieldset>
            <legend className="text-[14px] font-medium text-ink dark:text-white mb-3">
              Select audit depth
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
              {/* Quick Audit Option */}
              <label
                className={`relative flex flex-col justify-between rounded-[20px] p-5 sm:p-6 cursor-pointer border-2 transition-all ${
                  depth === 'quick'
                    ? 'border-ink dark:border-white bg-white dark:bg-[#1a1b22] shadow-sm'
                    : 'border-graphite-200 dark:border-graphite-800 bg-white/70 dark:bg-[#16171d]/70 hover:border-graphite-300 dark:hover:border-graphite-700'
                } ${focusRing}`}
              >
                <input
                  type="radio"
                  name="audit-depth"
                  value="quick"
                  checked={depth === 'quick'}
                  onChange={() => setDepth('quick')}
                  className="sr-only"
                />
                <div>
                  <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex size-8 items-center justify-center rounded-full ${
                        depth === 'quick' ? 'bg-ink dark:bg-white text-white dark:text-ink' : 'bg-graphite-100 dark:bg-graphite-800 text-ink dark:text-white'
                      }`}>
                        <Zap className="size-4" />
                      </span>
                      <span className="font-sans font-[600] text-[16px] sm:text-[17px] text-ink dark:text-white">
                        Quick audit
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className="rounded-full px-2.5 py-0.5 text-[12px] font-sans font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        Free
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-mono font-medium ${
                        freeQuota.remaining <= 0
                          ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-700 dark:text-graphite-300'
                      }`}>
                        {freeQuota.remainingHourly} of 5 free left this hr
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 text-[14px] text-graphite-700 dark:text-graphite-300 leading-relaxed font-normal">
                    One page, up to 5 per hour (daily cap of 20). Full checks for search engines, AI crawlers, on-page keyword opportunities, and ready-to-paste code fixes.
                  </p>
                </div>
              </label>

              {/* Deep Crawl Option */}
              <label
                className={`relative flex flex-col justify-between rounded-[20px] p-5 sm:p-6 cursor-pointer border-2 transition-all ${
                  depth === 'full'
                    ? 'border-ink dark:border-white bg-white dark:bg-[#1a1b22] shadow-sm'
                    : 'border-graphite-200 dark:border-graphite-800 bg-white/70 dark:bg-[#16171d]/70 hover:border-graphite-300 dark:hover:border-graphite-700'
                } ${focusRing}`}
              >
                <input
                  type="radio"
                  name="audit-depth"
                  value="full"
                  checked={depth === 'full'}
                  onChange={() => setDepth('full')}
                  className="sr-only"
                />
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`flex size-8 items-center justify-center rounded-full ${
                        depth === 'full' ? 'bg-ink dark:bg-white text-white dark:text-ink' : 'bg-graphite-100 dark:border-graphite-800 text-ink dark:text-white'
                      }`}>
                        <Layers className="size-4" />
                      </span>
                      <span className="font-sans font-[600] text-[16px] sm:text-[17px] text-ink dark:text-white">
                        Deep crawl
                      </span>
                    </div>
                    <span className="rounded-full px-2.5 py-0.5 text-[12px] font-sans font-semibold bg-violet/10 dark:bg-violet/20 text-violet" suppressHydrationWarning>
                      {fullPriceFormatted} in USDT
                    </span>
                  </div>
                  <p className="mt-3 text-[14px] text-graphite-700 dark:text-graphite-300 leading-relaxed font-normal">
                    Up to 50 pages. Detects orphan pages, redirect loops, and canonical clashes across your site, with client-ready PDF export and an onchain receipt.
                  </p>
                </div>
              </label>
            </div>
          </fieldset>

          {/* Optional Google Search Console Upload */}
          <div className="rounded-[16px] border border-dashed border-graphite-300 dark:border-graphite-700 p-4 bg-white dark:bg-[#16171d]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[14px] font-medium text-ink dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="size-4 text-violet" />
                  <span>Optional: Google Search Console export</span>
                </span>
                <p className="text-[13px] text-graphite-600 dark:text-graphite-400 mt-1">
                  Upload CSV or ZIP to cross-reference crawl results with real Google query data.
                </p>
              </div>

              {gscAnalysis ? (
                <button
                  type="button"
                  onClick={clearGscFile}
                  className={`inline-flex items-center justify-center gap-1 rounded-[48px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-3 py-1.5 text-[12px] font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 self-start sm:self-auto cursor-pointer ${focusRing}`}
                >
                  <X className="size-3" />
                  <span>Remove</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-[48px] border border-graphite-300 dark:border-graphite-700 bg-[#f4f4f6] dark:bg-[#22232c] px-4 py-1.5 text-[13px] font-medium text-ink dark:text-white hover:bg-graphite-200 dark:hover:bg-[#2a2b36] transition-colors self-start sm:self-auto shrink-0 cursor-pointer ${focusRing}`}
                >
                  <UploadCloud className="size-4 text-graphite-600 dark:text-graphite-400" />
                  <span>Upload file</span>
                </button>
              )}
            </div>

            <label htmlFor="gsc-file-upload" className="sr-only">
              Upload Google Search Console export file
            </label>
            <input
              id="gsc-file-upload"
              ref={fileInputRef}
              type="file"
              accept=".csv,.zip,.tsv"
              onChange={handleFileUpload}
              className="hidden"
              aria-label="Upload Google Search Console export file"
            />

            {gscAnalysis && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-[12px] bg-[#f4f4f6] dark:bg-[#1a1b22] p-3 text-xs border border-graphite-200 dark:border-graphite-800">
                <div>
                  <span className="text-graphite-600 dark:text-graphite-400 block text-[11px]">Export file</span>
                  <strong className="text-ink dark:text-white truncate block">{gscAnalysis.fileName}</strong>
                </div>
                <div>
                  <span className="text-graphite-600 dark:text-graphite-400 block text-[11px]">Total URLs in export</span>
                  <strong className="text-ink dark:text-white">{gscAnalysis.totalUrls.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-graphite-600 dark:text-graphite-400 block text-[11px]">Unindexed URLs found</span>
                  <strong className="text-violet">{gscAnalysis.unindexedUrls.length} URLs</strong>
                </div>
                <div>
                  <span className="text-graphite-600 dark:text-graphite-400 block text-[11px]">Detected reasons</span>
                  <strong className="text-ink dark:text-white">{gscAnalysis.reasonsDetected.length || 1} status type(s)</strong>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-[12px] border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Rate Limit Reached Paywall / Upgrade Banner */}
          {depth === 'quick' && freeQuota.remaining <= 0 && (
            <div className="rounded-[16px] border border-amber-300 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/30 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                    {freeQuota.limitType === 'daily' || (freeQuota.remainingDaily !== undefined && freeQuota.remainingDaily <= 0)
                      ? 'Daily Free Audit Cap Reached (20/20 Used)'
                      : 'Hourly Free Audit Limit Reached (5/5 Used)'}
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    {freeQuota.limitType === 'daily' || (freeQuota.remainingDaily !== undefined && freeQuota.remainingDaily <= 0)
                      ? `You have reached the daily cap of 20 free quick audits for this IP${freeQuota.retryAfterSec ? ` (quota resets in ~${Math.ceil(freeQuota.retryAfterSec / 3600)}h)` : ''}. Upgrade to a Deep Crawl for instant multi-page crawling, orphan detection, and competitor gap analysis.`
                      : `You have reached the maximum 5 free quick audits for this hour${freeQuota.retryAfterSec ? ` (resets in ~${Math.ceil(freeQuota.retryAfterSec / 60)} min)` : ''}. Upgrade to a Deep Crawl for instant multi-page crawling, orphan detection, and competitor gap analysis.`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setDepth('full')}
                  className="inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white px-4 py-2 text-xs font-semibold text-white dark:text-ink hover:opacity-90 shadow-sm cursor-pointer"
                >
                  <Layers className="size-3.5" />
                  <span suppressHydrationWarning>Start Deep Crawl ({fullPriceFormatted} in USDT)</span>
                </button>
                <button
                  type="button"
                  onClick={fetchQuota}
                  className="inline-flex items-center gap-1.5 rounded-[48px] border border-graphite-300 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-3.5 py-2 text-xs font-medium text-ink dark:text-white hover:bg-graphite-100 dark:hover:bg-[#252631] cursor-pointer"
                >
                  <RotateCcw className="size-3.5 text-graphite-500" />
                  <span>Check Quota</span>
                </button>
              </div>
            </div>
          )}

          {/* Primary Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormValid || isRunningFreeAudit || (depth === 'quick' && freeQuota.remaining <= 0)}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-[48px] py-3.5 px-6 text-[15px] font-medium transition-all ${
                isFormValid && !isRunningFreeAudit && !(depth === 'quick' && freeQuota.remaining <= 0)
                  ? 'bg-ink dark:bg-white text-white dark:text-ink hover:opacity-90 active:scale-[0.99] cursor-pointer'
                  : 'bg-graphite-200 dark:bg-graphite-800 text-graphite-600 dark:text-graphite-400 cursor-not-allowed opacity-60'
              } ${focusRing}`}
            >
              {isRunningFreeAudit ? (
                <>
                  <Loader2 className="size-4 animate-spin text-white dark:text-ink" />
                  <span>Auditing page and analyzing content...</span>
                </>
              ) : depth === 'quick' ? (
                freeQuota.remaining <= 0 ? (
                  <>
                    <AlertCircle className="size-4 text-amber-500" />
                    <span>
                      {freeQuota.limitType === 'daily' || (freeQuota.remainingDaily !== undefined && freeQuota.remainingDaily <= 0)
                        ? 'Daily limit reached (20/20 used)'
                        : 'Hourly limit reached (5/5 used)'}
                    </span>
                  </>
                ) : (
                  <>
                    <Zap className="size-4 text-emerald-400 dark:text-emerald-600" />
                    <span>Run free audit</span>
                  </>
                )
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  <span suppressHydrationWarning>Start a deep crawl ({fullPriceFormatted} in USDT)</span>
                </>
              )}
            </button>
            <p className="mt-2.5 text-center text-[13px] text-graphite-600 dark:text-graphite-400">
              {depth === 'quick'
                ? 'No account, wallet or email needed.'
                : 'Paid in USDT on Celo. No subscription.'}
            </p>
          </div>
        </form>
      </div>

      {/* Payment & Audit Stepper Modal */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetUrl={targetUrl}
        mode={depth}
        onAuditReady={handleAuditReady}
      />

      {/* Rendered Live Report View when ready on this page */}
      {completedReport && (
        <div className="mt-12 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-graphite-200 dark:border-graphite-800 pb-4">
            <div>
              <h2 className="font-sans text-[22px] font-[600] text-ink dark:text-white">Audit results</h2>
              <p className="text-[13px] text-graphite-600 dark:text-graphite-400">Generated by CrawlPay on Celo</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/app/reports')}
              className={`inline-flex items-center gap-1.5 rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#16171d] px-3.5 py-1.5 text-[13px] font-medium text-ink dark:text-white hover:bg-graphite-100 dark:hover:bg-[#252631] transition-colors ${focusRing}`}
            >
              <span>Saved reports</span>
              <ArrowRight className="size-3.5" />
            </button>
          </div>

          <CheckEngineView report={completedReport} gscAnalysis={gscAnalysis} />
        </div>
      )}
    </div>
  );
}

export default function AppAuditPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full space-y-8 animate-pulse">
          <div className="h-8 w-64 rounded-lg bg-graphite-100 dark:bg-graphite-800" />
          <div className="h-96 rounded-2xl border border-graphite-200 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#16171d]" />
        </div>
      }
    >
      <AuditPageContent />
    </Suspense>
  );
}
