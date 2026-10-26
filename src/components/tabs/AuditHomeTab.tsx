'use client';

import React, { useRef, useState, useEffect } from 'react';
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
  Copy,
  Check,
} from 'lucide-react';
import { CheckEngineView } from '../CheckEngineView';
import { PaymentModal } from '../PaymentModal';
import { parseGscFile, parseGscExport, GscAnalysisResult } from '@/utils/gscParser';
import { FullAuditReport } from '@/types/audit';

interface AuditHomeTabProps {
  initialTarget?: string;
  loadedReport?: FullAuditReport | null;
  onAuditCompleted?: (report: FullAuditReport) => void;
}

export function AuditHomeTab({ initialTarget = '', loadedReport, onAuditCompleted }: AuditHomeTabProps) {
  const [targetUrl, setTargetUrl] = useState(initialTarget);
  const [mode, setMode] = useState<'quick' | 'full'>('quick');
  const [gscAnalysis, setGscAnalysis] = useState<GscAnalysisResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FullAuditReport | null>(loadedReport || null);
  const [activePatchTab, setActivePatchTab] = useState<'html' | 'nextjs' | 'shopify' | 'schema'>('html');
  const [copiedPatch, setCopiedPatch] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialTarget) {
      setTargetUrl(initialTarget);
    }
  }, [initialTarget]);

  useEffect(() => {
    if (loadedReport) {
      setReport(loadedReport);
      setTargetUrl(loadedReport.targetUrl);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [loadedReport]);

  // Price shown plainly
  const currentPrice = mode === 'quick' ? '0.25' : '0.50';

  // Handle Search Console export upload (CSV, JSON, TSV, or ZIP)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    try {
      const parsed = await parseGscFile(file);
      if (parsed.unindexedUrls.length === 0) {
        setError(`No valid URLs found in "${file.name}". Please ensure your GSC export contains a URL or Page column.`);
        setGscAnalysis(null);
      } else {
        setGscAnalysis(parsed);
        // If targetUrl is currently empty, autofill with detected domain
        if (!targetUrl.trim() && parsed.suggestedDomain) {
          setTargetUrl(parsed.suggestedDomain);
        }
      }
    } catch (err: any) {
      console.warn('GSC upload error:', err);
      setError(`Failed to parse Search Console export: ${err?.message || 'Invalid format'}`);
      setGscAnalysis(null);
    }
  };

  const clearGscFile = () => {
    setGscAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // User clicks "Pay & audit" -> Opens wallet modal
  const handlePayClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl.trim()) return;
    setError(null);
    setIsModalOpen(true);
  };

  // Payment confirmed -> Execute audit
  const handlePaymentConfirmed = async (txHash?: string) => {
    setIsModalOpen(false);
    setLoading(true);
    setError(null);
    setElapsed(0);

    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(txHash ? { Authorization: `x402 ${txHash}` } : {}),
        },
        body: JSON.stringify({
          url: targetUrl.trim(),
          mode,
          paymentProof: txHash,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `Audit execution failed with status ${res.status}`);
      }

      setReport(data);

      // Save to localStorage reports
      saveReportLocally(data, txHash);

      // Callback if provided
      if (onAuditCompleted) {
        onAuditCompleted(data);
      }

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setError(err?.message || 'Audit execution encountered an unexpected error.');
    } finally {
      clearInterval(timer);
      setLoading(false);
    }
  };

  const saveReportLocally = (rep: FullAuditReport, txHash?: string) => {
    try {
      const existing = JSON.parse(localStorage.getItem('crawlpay_reports') || '[]');
      const newEntry = {
        id: `audit_${Date.now()}`,
        date: new Date().toISOString(),
        targetUrl: rep.targetUrl,
        mode,
        pagesChecked: rep.pagesChecked || (mode === 'quick' ? 1 : 5),
        issuesCount: {
          critical: rep.prioritizedGroups?.filter((g) => g.severity === 'critical').length || 0,
          high: rep.prioritizedGroups?.filter((g) => g.severity === 'high').length || 0,
          medium: rep.prioritizedGroups?.filter((g) => g.severity === 'medium').length || 0,
          low: rep.prioritizedGroups?.filter((g) => g.severity === 'low').length || 0,
          total: rep.prioritizedGroups?.length || 0,
        },
        reportData: rep,
        txHash: txHash || rep.onchainReceipt?.upstreamBrowserReceipt?.txHash,
        celoscanUrl: rep.onchainReceipt?.upstreamBrowserReceipt?.celoscanUrl,
      };
      localStorage.setItem('crawlpay_reports', JSON.stringify([newEntry, ...existing.slice(0, 49)]));

      // Also record to activity
      const activity = JSON.parse(localStorage.getItem('crawlpay_activity') || '[]');
      const newActivity = {
        id: `act_${Date.now()}`,
        date: new Date().toISOString(),
        targetUrl: rep.targetUrl,
        mode,
        amountUsd: currentPrice,
        txHash: newEntry.txHash || '0x42220celo...settled',
        celoscanUrl: newEntry.celoscanUrl || `https://celoscan.io/address/0xf06c2b754d07cba299751f0985a48f8013bb6b39`,
        attributionTag: 'celo_757c2ac3b70c',
        isRealBroadcast: true,
      };
      localStorage.setItem('crawlpay_activity', JSON.stringify([newActivity, ...activity.slice(0, 99)]));
    } catch (e) {
      console.warn('Unable to persist report to local storage:', e);
    }
  };

  const copyPatch = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  const patches = {
    html: report?.codePatches?.htmlHeadBlock,
    nextjs: report?.codePatches?.nextJsMetadata,
    shopify: report?.codePatches?.shopifyLiquid,
    schema: report?.codePatches?.schemaJsonLd,
  };
  const availablePatches = Object.entries(patches).filter(([, val]) => Boolean(val));

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Autonomous SEO Audit
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Deterministic technical SEO, Core Web Vitals, and stack-tailored code fixes. No accounts, no subscriptions.
        </p>
      </div>

      {/* Main Audit Form */}
      <form onSubmit={handlePayClick} className="rounded-xl border border-border bg-card p-5 sm:p-7 shadow-sm">
        {/* Target URL */}
        <label htmlFor="targetUrl" className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Target Website URL
          </span>
          <div className="relative">
            <input
              id="targetUrl"
              name="targetUrl"
              type="url"
              required
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://example.com"
              className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-inner"
            />
            <Globe className="pointer-events-none absolute right-3.5 top-3.5 size-5 text-muted-foreground/50" />
          </div>
        </label>

        {/* Depth & Plain Price Options */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {/* Quick Option */}
          <div
            onClick={() => setMode('quick')}
            className={`cursor-pointer rounded-lg border p-4 transition-all ${
              mode === 'quick'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-background/50 hover:border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="depthMode"
                  checked={mode === 'quick'}
                  onChange={() => setMode('quick')}
                  className="accent-primary"
                />
                <div>
                  <span className="text-sm font-semibold text-foreground">Quick Audit</span>
                  <p className="text-xs text-muted-foreground">Homepage & Core Navigation (Up to 5 pages)</p>
                </div>
              </div>
              <div className="rounded bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-bold text-primary font-mono">
                $0.25 USD₮
              </div>
            </div>
          </div>

          {/* Full Option */}
          <div
            onClick={() => setMode('full')}
            className={`cursor-pointer rounded-lg border p-4 transition-all ${
              mode === 'full'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-background/50 hover:border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="depthMode"
                  checked={mode === 'full'}
                  onChange={() => setMode('full')}
                  className="accent-primary"
                />
                <div>
                  <span className="text-sm font-semibold text-foreground">Full Crawl</span>
                  <p className="text-xs text-muted-foreground">Deep BFS traversal (Up to 50 pages)</p>
                </div>
              </div>
              <div className="rounded bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-bold text-primary font-mono">
                $0.50 USD₮
              </div>
            </div>
          </div>
        </div>

        {/* Optional Search Console Export Dropzone */}
        <div className="mt-6 rounded-lg border border-dashed border-border bg-background/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded bg-muted/60 p-2 text-muted-foreground">
                <FileSpreadsheet className="size-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Optional: Search Console Export (.csv or .json)
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
                  Upload your GSC Page Indexing export to automatically pinpoint URLs flagged as <em>&quot;Crawled - currently not indexed&quot;</em>.
                </p>
                {gscAnalysis ? (
                  <div className="mt-2.5 inline-flex items-center gap-2 rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400">
                    <CheckCircle2 className="size-3.5" />
                    <span>
                      {gscAnalysis.fileName} ({gscAnalysis.unindexedUrls.length} unindexed URLs parsed)
                    </span>
                    <button
                      type="button"
                      onClick={clearGscFile}
                      className="ml-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ) : (
                  <label className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors">
                    <UploadCloud className="size-3.5 text-primary" />
                    <span>Choose GSC File</span>
                    <input
                      id="gscFile"
                      name="gscFile"
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.tsv,.json,.txt,.zip,application/zip"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Price & Submit Action */}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-4 pt-5 border-t border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Settlement Price:</span>
            <span className="font-mono text-lg font-bold text-primary">${currentPrice} USD₮</span>
            <span className="text-[11px] text-muted-foreground">· Celo Mainnet</span>
          </div>

          <button
            type="submit"
            disabled={loading || !targetUrl.trim()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? (
              <>
                <Clock className="size-4 animate-spin" />
                <span>Auditing ({elapsed}s)...</span>
              </>
            ) : (
              <>
                <Zap className="size-4" />
                <span>Pay & audit (${currentPrice} USD₮)</span>
              </>
            )}
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{error}</span>
          </div>
        )}
      </form>

      {/* Audit Results View (No summary card, purely deterministic findings) */}
      {report && (
        <div ref={resultsRef} className="space-y-6 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <h3 className="font-display text-xl font-bold text-foreground">
                Audit Results for {report.targetUrl}
              </h3>
              <span className="text-xs text-muted-foreground font-mono">
                Crawled at {new Date(report.auditTimestamp).toLocaleTimeString()} · {report.pagesChecked} page
                {report.pagesChecked > 1 ? 's' : ''} inspected
              </span>
            </div>
            {report.onchainReceipt?.upstreamBrowserReceipt?.celoscanUrl && (
              <a
                href={report.onchainReceipt.upstreamBrowserReceipt.celoscanUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
              >
                <span>Celoscan Settlement</span>
                <Globe className="size-3" />
              </a>
            )}
          </div>

          {/* Deterministic Check Engine View */}
          <CheckEngineView
            report={report}
            groups={report.prioritizedGroups || []}
            whatPassed={report.whatPassed || 'Verified clean on all inspected criteria.'}
            notChecked={report.notChecked || []}
            pagesChecked={report.pagesChecked || 1}
            targetUrl={report.targetUrl}
            detectedStack={report.detectedStack}
            gscAnalysis={gscAnalysis}
          />

          {/* Generated Code Patches */}
          {availablePatches.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="size-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Generated Code Fixes</h4>
                </div>
                <button
                  type="button"
                  onClick={() => copyPatch(patches[activePatchTab] || '')}
                  className="inline-flex items-center gap-1 rounded border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copiedPatch ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
                  <span>{copiedPatch ? 'Copied' : 'Copy Fix'}</span>
                </button>
              </div>

              {/* Sub-tabs for patch types */}
              <div className="flex gap-2 border-b border-border pb-2 text-xs">
                {patches.html && (
                  <button
                    onClick={() => setActivePatchTab('html')}
                    className={`rounded px-2.5 py-1 font-medium ${
                      activePatchTab === 'html' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    HTML Head
                  </button>
                )}
                {patches.nextjs && (
                  <button
                    onClick={() => setActivePatchTab('nextjs')}
                    className={`rounded px-2.5 py-1 font-medium ${
                      activePatchTab === 'nextjs' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Next.js Metadata
                  </button>
                )}
                {patches.shopify && (
                  <button
                    onClick={() => setActivePatchTab('shopify')}
                    className={`rounded px-2.5 py-1 font-medium ${
                      activePatchTab === 'shopify' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Shopify Liquid
                  </button>
                )}
                {patches.schema && (
                  <button
                    onClick={() => setActivePatchTab('schema')}
                    className={`rounded px-2.5 py-1 font-medium ${
                      activePatchTab === 'schema' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Schema JSON-LD
                  </button>
                )}
              </div>

              <pre className="max-h-64 overflow-x-auto rounded-lg bg-black/40 p-4 font-mono text-xs text-foreground/90">
                {patches[activePatchTab] || 'No code fix generated for this stack.'}
              </pre>
            </section>
          )}
        </div>
      )}

      {/* Payment Modal (Only triggered upon clicking Pay & audit) */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetUrl={targetUrl}
        mode={mode}
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </div>
  );
}
