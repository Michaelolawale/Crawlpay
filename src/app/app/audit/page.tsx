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
import { parseGscExport, GscAnalysisResult } from '@/utils/gscParser';
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

  // Handle Search Console export upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const parsed = parseGscExport(content, file.name);
          setGscAnalysis(parsed);
        } catch {
          setErrorMsg('Failed to parse Google Search Console export file.');
        }
      }
    };
    reader.readAsText(file);
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
        <h1 className="font-display text-xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug">
          Deterministic SEO & Competitor Intelligence Audit
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Autonomous crawl with 10 deterministic checks, root cause grouping, and actionable code fixes. Settled on Celo rails.
        </p>
      </div>

      {/* Main Audit Form Card */}
      <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-8 backdrop-blur-xl shadow-sm">
        <form onSubmit={handleLaunchModal} className="space-y-5 sm:space-y-6">
          {/* URL Input Field */}
          <div>
            <label htmlFor="target-url" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Target Website URL
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                <Globe className="size-4 text-muted-foreground" />
              </div>
              <input
                id="target-url"
                type="text"
                placeholder="example.com or https://company.com"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="block w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono transition-colors"
              />
            </div>
            {targetUrl && !isFormValid && (
              <p className="mt-1.5 text-xs text-destructive">
                Please enter a valid website domain or URL (e.g. evangelcarriersnetwork.org).
              </p>
            )}
          </div>

          {/* Depth Selector Cards */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Select Audit Depth
            </label>
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
              {/* Quick Depth Card */}
              <div
                onClick={() => setDepth('quick')}
                className={`cursor-pointer rounded-xl border p-3.5 sm:p-4 transition-all ${
                  depth === 'quick'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-background hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className={`size-4 ${depth === 'quick' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-display font-semibold text-sm text-foreground">Quick Audit</span>
                  </div>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary font-mono">
                    $0.25 USDT
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Fast multi-page crawl (up to 5 core pages). Runs 10 engine checks, root cause grouping, archetype detection, and ready-to-paste code fixes.
                </p>
              </div>

              {/* Full Depth Card */}
              <div
                onClick={() => setDepth('full')}
                className={`cursor-pointer rounded-xl border p-3.5 sm:p-4 transition-all ${
                  depth === 'full'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-background hover:border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className={`size-4 ${depth === 'full' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-display font-semibold text-sm text-foreground">Full Deep Crawl</span>
                  </div>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary font-mono">
                    $0.50 USDT
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Deep multi-page BFS crawl (up to 50 pages). Detects sitewide orphan links, canonical loops, template-wide rendering defects, and full indexability.
                </p>
              </div>
            </div>
          </div>

          {/* Optional Google Search Console Upload */}
          <div className="rounded-xl border border-dashed border-border p-3.5 sm:p-4 bg-muted/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <FileSpreadsheet className="size-3.5 text-primary" />
                  <span>Optional: Google Search Console Export</span>
                </span>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Upload CSV/ZIP to cross-reference crawl results with real Google impressions and query rankings.
                </p>
              </div>

              {gscAnalysis ? (
                <button
                  type="button"
                  onClick={clearGscFile}
                  className="inline-flex items-center justify-center gap-1 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 self-start sm:self-auto"
                >
                  <X className="size-3" />
                  <span>Remove</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors self-start sm:self-auto shrink-0"
                >
                  <UploadCloud className="size-3.5 text-muted-foreground" />
                  <span>Upload File</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.zip,.tsv"
              onChange={handleFileUpload}
              className="hidden"
            />

            {gscAnalysis && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-lg bg-card p-2.5 text-xs border border-border">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Export File</span>
                  <strong className="text-foreground truncate block">{gscAnalysis.fileName}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Total URLs in Export</span>
                  <strong className="text-foreground">{gscAnalysis.totalUrls.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Unindexed URLs Found</span>
                  <strong className="text-amber-400">{gscAnalysis.unindexedUrls.length} URLs</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Detected Reasons</span>
                  <strong className="text-primary">{gscAnalysis.reasonsDetected.length || 1} status type(s)</strong>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Primary Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 px-6 text-sm font-bold transition-all shadow-md ${
              isFormValid
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20 hover:shadow-primary/30 cursor-pointer'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
            }`}
          >
            <ShieldCheck className="size-4" />
            <span>Pay & audit (${currentPrice} USDT)</span>
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

          <CheckEngineView report={completedReport} />
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
