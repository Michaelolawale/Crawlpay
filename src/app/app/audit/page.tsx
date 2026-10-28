'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Search,
  UploadCloud,
  FileSpreadsheet,
  X,
  Zap,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ShieldCheck,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { PaymentModal } from '@/components/PaymentModal';
import { CheckEngineView } from '@/components/CheckEngineView';
import { parseGscFile, parseGscExport, GscAnalysisResult } from '@/utils/gscParser';
import { FullAuditReport } from '@/types/audit';

function AuditPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTarget = searchParams.get('target') || '';

  const [targetUrl, setTargetUrl] = useState(initialTarget);
  const [depth, setDepth] = useState<'quick' | 'full'>('quick');
  const [gscAnalysis, setGscAnalysis] = useState<GscAnalysisResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedReport, setCompletedReport] = useState<FullAuditReport | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTarget) {
      setTargetUrl(initialTarget);
    }
  }, [initialTarget]);

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
  const currentPrice = depth === 'quick' ? '0.25' : '0.50';

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

  const handleLaunchModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleAuditReady = (report: FullAuditReport, reportId: string) => {
    setCompletedReport(report);
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Banner / Breadcrumb */}
      <div>
        <p className="font-sans text-[14px] sm:text-[16px] leading-[1.6] font-[400] text-violet mb-1">
          Autonomous Execution
        </p>
        <h1 className="font-sans text-[24px] sm:text-[34px] font-[600] tracking-tight text-ink leading-snug">
          Deterministic SEO &amp; Competitor Intelligence Audit
        </h1>
        <p className="mt-1 text-[14px] sm:text-[15px] text-graphite-800 leading-relaxed font-normal">
          Autonomous crawl with 10 deterministic engine checks, root cause grouping, and ready-to-deploy code fixes settled per crawl on Celo Mainnet.
        </p>
      </div>

      {/* Main Audit Form Card */}
      <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#16171d] p-5 sm:p-8 shadow-sm">
        <form onSubmit={handleLaunchModal} className="space-y-5 sm:space-y-6">
          {/* URL Input Field */}
          <div>
            <label htmlFor="target-url" className="block text-[12px] font-mono uppercase tracking-wider text-graphite-600 dark:text-graphite-400 mb-2 font-medium">
              Target Website URL
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Globe className="size-4 text-graphite-600 dark:text-graphite-400" />
              </div>
              <input
                id="target-url"
                type="text"
                placeholder="example.com or yoursite.com"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="block w-full rounded-[32px] border border-ink dark:border-graphite-800 bg-white dark:bg-[#111216] py-3 pl-10 pr-4 text-[14px] sm:text-[15px] text-ink dark:text-white placeholder:text-graphite-600 dark:placeholder:text-graphite-500 focus:outline-none focus:shadow-hero-field font-mono transition-shadow"
              />
            </div>
            {targetUrl && !isFormValid && (
              <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                Please enter a valid website domain or URL (e.g. example.com).
              </p>
            )}
          </div>

          {/* Depth Selector Cards */}
          <div>
            <label className="block text-[12px] font-mono uppercase tracking-wider text-graphite-600 dark:text-graphite-400 mb-2 font-medium">
              Select Audit Depth
            </label>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
              {/* Quick Depth Card */}
              <div
                onClick={() => setDepth('quick')}
                className={`cursor-pointer rounded-[16px] p-4 transition-all ${
                  depth === 'quick'
                    ? 'border-2 border-ink dark:border-violet bg-white dark:bg-[#1a1b22] shadow-sm'
                    : 'border border-graphite-100 dark:border-graphite-800 bg-white/70 dark:bg-[#16171d]/70 hover:bg-white dark:hover:bg-[#1a1b22]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className={`size-4 ${depth === 'quick' ? 'text-violet' : 'text-graphite-600 dark:text-graphite-400'}`} />
                    <span className="font-sans font-[600] text-[15px] text-ink dark:text-white">Quick Audit</span>
                  </div>
                  <span className={`rounded-[48px] px-2.5 py-0.5 text-[12px] font-mono ${
                    depth === 'quick' ? 'bg-ink dark:bg-white text-white dark:text-ink' : 'bg-graphite-100 dark:bg-[#22232c] text-graphite-600 dark:text-graphite-300'
                  }`}>
                    $0.25 USDT
                  </span>
                </div>
                <p className="mt-2 text-[13px] text-graphite-800 dark:text-graphite-300 leading-relaxed font-normal">
                  Fast single-page and core route crawl. Runs 10 engine checks, root cause grouping, stack detection, and code patches.
                </p>
              </div>

              {/* Full Depth Card */}
              <div
                onClick={() => setDepth('full')}
                className={`cursor-pointer rounded-[16px] p-4 transition-all ${
                  depth === 'full'
                    ? 'border-2 border-ink dark:border-violet bg-white dark:bg-[#1a1b22] shadow-sm'
                    : 'border border-graphite-100 dark:border-graphite-800 bg-white/70 dark:bg-[#16171d]/70 hover:bg-white dark:hover:bg-[#1a1b22]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className={`size-4 ${depth === 'full' ? 'text-violet' : 'text-graphite-600 dark:text-graphite-400'}`} />
                    <span className="font-sans font-[600] text-[15px] text-ink dark:text-white">Full Deep Crawl</span>
                  </div>
                  <span className={`rounded-[48px] px-2.5 py-0.5 text-[12px] font-mono ${
                    depth === 'full' ? 'bg-ink dark:bg-white text-white dark:text-ink' : 'bg-graphite-100 dark:bg-[#22232c] text-graphite-600 dark:text-graphite-300'
                  }`}>
                    $0.50 USDT
                  </span>
                </div>
                <p className="mt-2 text-[13px] text-graphite-800 dark:text-graphite-300 leading-relaxed font-normal">
                  Deep multi-page BFS crawl (up to 50 pages). Detects sitewide orphan links, canonical loops, rendering defects, and full indexability.
                </p>
              </div>
            </div>
          </div>

          {/* Optional Google Search Console Upload */}
          <div className="rounded-[16px] border border-dashed border-graphite-200 dark:border-graphite-800 p-4 bg-white dark:bg-[#16171d]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[13px] font-[500] text-ink dark:text-white flex items-center gap-1.5">
                  <FileSpreadsheet className="size-4 text-violet" />
                  <span>Optional: Google Search Console Export</span>
                </span>
                <p className="text-[12px] text-graphite-600 dark:text-graphite-400 mt-0.5">
                  Upload CSV/ZIP to cross-reference crawl results with real Google impressions and query rankings.
                </p>
              </div>

              {gscAnalysis ? (
                <button
                  type="button"
                  onClick={clearGscFile}
                  className="inline-flex items-center justify-center gap-1 rounded-[48px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 px-3 py-1.5 text-[12px] font-medium text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 self-start sm:self-auto cursor-pointer"
                >
                  <X className="size-3" />
                  <span>Remove</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#22232c] px-3.5 py-1.5 text-[12px] font-medium text-ink dark:text-white hover:bg-graphite-200/50 dark:hover:bg-[#2a2b36] transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
                >
                  <UploadCloud className="size-3.5 text-graphite-600 dark:text-graphite-400" />
                  <span>Upload File</span>
                </button>
              )}
            </div>

            <label htmlFor="gsc-file-upload" className="sr-only">
              Upload Google Search Console Export File
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
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-[12px] bg-[#f4f4f6] dark:bg-[#1a1b22] p-3 text-xs border border-graphite-100 dark:border-graphite-800">
                <div>
                  <span className="text-graphite-600 dark:text-graphite-400 block text-[10px]">Export File</span>
                  <strong className="text-ink dark:text-white truncate block">{gscAnalysis.fileName}</strong>
                </div>
                <div>
                  <span className="text-graphite-600 dark:text-graphite-400 block text-[10px]">Total URLs in Export</span>
                  <strong className="text-ink dark:text-white">{gscAnalysis.totalUrls.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-graphite-600 dark:text-graphite-400 block text-[10px]">Unindexed URLs Found</span>
                  <strong className="text-violet">{gscAnalysis.unindexedUrls.length} URLs</strong>
                </div>
                <div>
                  <span className="text-graphite-600 dark:text-graphite-400 block text-[10px]">Detected Reasons</span>
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

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-[48px] py-3 px-6 text-[14px] font-normal transition-opacity shadow-sm ${
              isFormValid
                ? 'bg-ink dark:bg-white text-white dark:text-ink hover:opacity-90 cursor-pointer'
                : 'bg-graphite-200 dark:bg-graphite-800 text-graphite-600 dark:text-graphite-400 cursor-not-allowed opacity-60'
            }`}
          >
            <ShieldCheck className="size-4" />
            <span>Pay &amp; audit (${currentPrice} USDT)</span>
          </button>
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
        <div className="mt-12 space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">Audit Results</h2>
              <p className="text-xs text-muted-foreground">Generated via deterministic check engine on Celo</p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/app/reports')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent"
            >
              <span>View All Reports</span>
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
          <div className="h-8 w-64 rounded-lg bg-card/60" />
          <div className="h-96 rounded-2xl border border-border bg-card/30" />
        </div>
      }
    >
      <AuditPageContent />
    </Suspense>
  );
}
