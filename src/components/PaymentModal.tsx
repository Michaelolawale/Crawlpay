'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { CONFIG } from '@/config';
import { FullAuditReport } from '@/types/audit';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl: string;
  mode: 'quick' | 'full';
  onAuditReady?: (report: FullAuditReport, reportId: string) => void;
  onPaymentConfirmed?: (txHash?: string) => void;
}

type ModalStep = 'review' | 'status';
type AuditStatusPhase = 'wallet_confirm' | 'onchain_confirm' | 'running_audit' | 'ready' | 'failed';

export function PaymentModal({
  isOpen,
  onClose,
  targetUrl,
  mode,
  onAuditReady,
  onPaymentConfirmed,
}: PaymentModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<ModalStep>('review');
  const [statusPhase, setStatusPhase] = useState<AuditStatusPhase>('wallet_confirm');
  const [statusMessage, setStatusMessage] = useState<string>('Please approve the transaction in your wallet...');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [createdReportId, setCreatedReportId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  // Expandable sections
  const [showManualPay, setShowManualPay] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copiedManual, setCopiedManual] = useState(false);
  const [manualTxInput, setManualTxInput] = useState('');
  const [manualVerifying, setManualVerifying] = useState(false);

  const priceUsd = mode === 'quick' ? '0.25' : '0.50';
  const payToAddress = CONFIG.AGENT_WALLET_ADDRESS;

  // Helper to completely clear stuck active jobs
  const handleResetFlow = () => {
    try {
      localStorage.removeItem('crawlpay_active_job');
    } catch {}
    setStep('review');
    setStatusPhase('wallet_confirm');
    setStatusMessage('Waiting to start...');
    setErrorMessage(null);
    setIsPaying(false);
  };

  // Restore active job if refreshed (auto-expires stale jobs after 3 minutes)
  useEffect(() => {
    try {
      const activeJobRaw = localStorage.getItem('crawlpay_active_job');
      if (activeJobRaw) {
        const active = JSON.parse(activeJobRaw);
        const ageMs = Date.now() - (active.timestamp || 0);
        // If older than 3 minutes, discard stale session
        if (ageMs > 3 * 60 * 1000) {
          localStorage.removeItem('crawlpay_active_job');
          return;
        }

        if (active.targetUrl === targetUrl && active.statusPhase !== 'ready') {
          setStep('status');
          setStatusPhase(active.statusPhase);
          setStatusMessage(active.statusMessage || 'Processing your audit request...');
          setTxHash(active.txHash || null);
          setCreatedReportId(active.reportId || null);
        }
      }
    } catch {}
  }, [targetUrl]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedManual(true);
    setTimeout(() => setCopiedManual(false), 2000);
  };

  /**
   * Main Wallet Payment Flow
   */
  const handlePayWithWallet = async () => {
    setIsPaying(true);
    setErrorMessage(null);
    setIsWrongNetwork(false);

    const ethereum = (window as unknown as { ethereum?: any })?.ethereum;
    if (!ethereum) {
      setIsPaying(false);
      setErrorMessage('No EVM wallet detected. Please install MetaMask, Rabby, or a Celo-compatible wallet to continue.');
      return;
    }

    try {
      // 1. Request accounts
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || !accounts[0]) {
        throw new Error('Wallet connection was cancelled or rejected.');
      }
      const userWallet = accounts[0];

      // 2. Ensure Celo Mainnet (42220 / 0xa4ec)
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xa4ec' }],
        });
      } catch (switchError: any) {
        if (switchError?.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0xa4ec',
                chainName: 'Celo Mainnet',
                nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
                rpcUrls: ['https://forno.celo.org'],
                blockExplorerUrls: ['https://celoscan.io'],
              },
            ],
          });
        } else if (switchError?.code === 4001) {
          setIsWrongNetwork(true);
          throw new Error('Network switch to Celo Mainnet was rejected.');
        }
      }

      // 3. Switch to Status Stepper
      setStep('status');
      setStatusPhase('wallet_confirm');
      setStatusMessage('Please confirm the transaction in your wallet...');

      // 4. Send attributed micropayment transaction on Celo Mainnet
      let submittedTxHash: string;
      try {
        submittedTxHash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: userWallet,
              to: payToAddress,
              value: '0x0', // Micro-payment
              data: CONFIG.DATA_SUFFIX, // ERC-8021 Attribution tag suffix
            },
          ],
        });
      } catch (txErr: any) {
        // Handle User Rejection gracefully
        if (txErr?.code === 4001 || txErr?.message?.toLowerCase().includes('reject') || txErr?.message?.toLowerCase().includes('denied')) {
          setStep('review');
          setErrorMessage('Transaction was rejected in your wallet. You can try again whenever you’re ready.');
          setIsPaying(false);
          return;
        }

        // Handle Insufficient Gas / Tokens
        if (txErr?.message?.toLowerCase().includes('insufficient funds')) {
          setStep('review');
          setErrorMessage('Insufficient CELO for gas fees. Note: Gas on Celo is paid in CELO (typically < $0.001 per transaction). Please top up your wallet with a small amount of CELO.');
          setIsPaying(false);
          return;
        }

        throw txErr;
      }

      setTxHash(submittedTxHash);
      setStatusPhase('onchain_confirm');
      setStatusMessage(`Transaction submitted (${submittedTxHash.slice(0, 10)}...). Confirming on Celo Mainnet...`);

      // Persist active job to survive refresh
      const newJobId = `job_${Date.now()}`;
      localStorage.setItem(
        'crawlpay_active_job',
        JSON.stringify({
          jobId: newJobId,
          targetUrl,
          mode,
          txHash: submittedTxHash,
          userWallet,
          statusPhase: 'onchain_confirm',
          statusMessage: `Transaction submitted (${submittedTxHash.slice(0, 10)}...). Confirming on Celo Mainnet...`,
          timestamp: Date.now(),
        })
      );

      // 5. Trigger audit pipeline execution
      setStatusPhase('running_audit');
      const runningMsg = 'Payment verified! Running multi-page crawler and deterministic SEO checks...';
      setStatusMessage(runningMsg);
      localStorage.setItem(
        'crawlpay_active_job',
        JSON.stringify({
          jobId: newJobId,
          targetUrl,
          mode,
          txHash: submittedTxHash,
          userWallet,
          statusPhase: 'running_audit',
          statusMessage: runningMsg,
          timestamp: Date.now(),
        })
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 65000); // 65 second timeout guard

      let auditRes: Response;
      try {
        auditRes = await fetch('/api/audit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `x402 ${submittedTxHash}`,
          },
          body: JSON.stringify({
            url: targetUrl,
            mode,
            paymentProof: submittedTxHash,
            wallet: userWallet,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      const auditData = await auditRes.json();
      if (!auditRes.ok) {
        throw new Error(auditData.error || 'Audit crawler failed during execution.');
      }

      const generatedReportId = `rep_${Date.now()}`;
      setCreatedReportId(generatedReportId);
      setStatusPhase('ready');
      setStatusMessage('Audit completed successfully! Your report and code fixes are ready.');

      // Update stored job
      localStorage.setItem(
        'crawlpay_active_job',
        JSON.stringify({
          jobId: newJobId,
          targetUrl,
          mode,
          txHash: submittedTxHash,
          userWallet,
          statusPhase: 'ready',
          reportId: generatedReportId,
        })
      );

      // Save report in localStorage history
      saveToHistory(auditData, generatedReportId, submittedTxHash, mode, targetUrl, userWallet);
      onAuditReady?.(auditData, generatedReportId);
      onPaymentConfirmed?.(submittedTxHash);
    } catch (err: any) {
      console.error('[Payment Flow Error]', err);
      if (step === 'status') {
        setStatusPhase('failed');
        setErrorMessage(err?.message || 'Audit execution encountered an error.');
      } else {
        setErrorMessage(err?.message || 'Payment initiation failed.');
      }
    } finally {
      setIsPaying(false);
    }
  };

  /**
   * Manual Payment Verification
   */
  const handleVerifyManualTx = async () => {
    if (!manualTxInput.trim().startsWith('0x') || manualTxInput.trim().length !== 66) {
      setErrorMessage('Please enter a valid 66-character Celo transaction hash starting with 0x.');
      return;
    }

    setManualVerifying(true);
    setErrorMessage(null);
    try {
      const verifyRes = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: manualTxInput.trim() }),
      });
      const verifyData = await verifyRes.json();

      if (verifyData.valid && verifyData.mined) {
        setTxHash(manualTxInput.trim());
        setStep('status');
        setStatusPhase('running_audit');
        setStatusMessage('Manual transaction confirmed! Running audit...');

        const auditRes = await fetch('/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: targetUrl,
            mode,
            paymentProof: manualTxInput.trim(),
          }),
        });

        const auditData = await auditRes.json();
        if (!auditRes.ok) throw new Error(auditData.error || 'Audit execution failed.');

        const repId = `rep_${Date.now()}`;
        setCreatedReportId(repId);
        setStatusPhase('ready');
        setStatusMessage('Audit completed successfully!');
        saveToHistory(auditData, repId, manualTxInput.trim(), mode, targetUrl, 'Manual');
        onAuditReady?.(auditData, repId);
        onPaymentConfirmed?.(manualTxInput.trim());
      } else {
        setErrorMessage(verifyData.error || 'Transaction was not found or has not been mined yet on Celo Mainnet.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to verify manual transaction.');
    } finally {
      setManualVerifying(false);
    }
  };

  const saveToHistory = (
    report: FullAuditReport,
    id: string,
    hash: string,
    auditMode: 'quick' | 'full',
    url: string,
    walletAddr: string
  ) => {
    try {
      const existing = JSON.parse(localStorage.getItem('crawlpay_reports') || '[]');
      const newEntry = {
        id,
        date: new Date().toISOString(),
        targetUrl: url,
        mode: auditMode,
        wallet: walletAddr,
        pagesChecked: report.pagesChecked || (auditMode === 'quick' ? 1 : 10),
        issuesCount: {
          critical: report.prioritizedGroups?.filter((g) => g.severity === 'critical').length || 0,
          high: report.prioritizedGroups?.filter((g) => g.severity === 'high').length || 0,
          medium: report.prioritizedGroups?.filter((g) => g.severity === 'medium').length || 0,
          low: report.prioritizedGroups?.filter((g) => g.severity === 'low').length || 0,
          total: report.prioritizedGroups?.length || 0,
        },
        reportData: report,
        txHash: hash,
        celoscanUrl: `https://celoscan.io/tx/${hash}`,
      };
      existing.unshift(newEntry);
      localStorage.setItem('crawlpay_reports', JSON.stringify(existing));
    } catch {}
  };

  const handleClose = () => {
    if (statusPhase === 'running_audit' || statusPhase === 'onchain_confirm') {
      if (!confirm('An audit is currently in progress. Are you sure you want to close this window?')) {
        return;
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container: Bottom sheet on mobile, rounded card on desktop */}
      <div className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-border bg-card p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Close modal"
        >
          <X className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Wallet className="size-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">Confirm and pay</h3>
            {/* Stepper Indicator */}
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className={`font-medium ${step === 'review' ? 'text-primary' : 'text-muted-foreground'}`}>
                1. Review
              </span>
              <span className="text-muted-foreground">→</span>
              <span className={`font-medium ${step === 'status' ? 'text-primary' : 'text-muted-foreground'}`}>
                2. Status
              </span>
            </div>
          </div>
        </div>

        {/* STEP 1: REVIEW & PAY */}
        {step === 'review' && (
          <div className="mt-5 space-y-4">
            {/* Summary Box with clean elevated background */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Target URL:</span>
                <span className="font-mono font-medium text-foreground truncate max-w-[280px]">
                  {targetUrl}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Crawl Depth:</span>
                <span className="font-medium text-foreground capitalize">
                  {mode === 'quick' ? 'Quick Audit (1 Page)' : 'Full Audit (Up to 50 Pages)'}
                </span>
              </div>

              <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                {mode === 'quick'
                  ? 'Includes single-page crawl, 10 deterministic checks, root cause grouping & AI fixes.'
                  : 'Includes deep multi-page BFS crawl, sitewide indexability, orphan checks, and code patches.'}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-sm font-semibold text-foreground">Total Fee:</span>
                <span className="text-base font-bold text-primary font-mono">${priceUsd} USDT</span>
              </div>
            </div>

            {/* Error Feedback */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{errorMessage}</p>
                  {isWrongNetwork && (
                    <button
                      type="button"
                      onClick={handlePayWithWallet}
                      className="mt-2 inline-flex items-center gap-1.5 rounded bg-amber-500/20 px-2.5 py-1 text-amber-300 hover:bg-amber-500/30 font-medium"
                    >
                      <AlertTriangle className="size-3" />
                      <span>Switch to Celo Mainnet (42220)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ONE Primary Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePayWithWallet}
                disabled={isPaying}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md disabled:opacity-50"
              >
                {isPaying ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
                <span>{isPaying ? 'Processing...' : 'Pay with wallet'}</span>
              </button>

              <div className="mt-2.5 text-center">
                <Link
                  href="/example"
                  target="_blank"
                  className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                >
                  See an example report
                </Link>
              </div>
            </div>

            {/* Collapsed "Pay manually" section */}
            <div className="border-t border-border/80 pt-3">
              <button
                type="button"
                onClick={() => setShowManualPay(!showManualPay)}
                className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Pay manually (Direct Transfer)</span>
                {showManualPay ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </button>

              {showManualPay && (
                <div className="mt-3 space-y-2.5 rounded-lg border border-border/70 bg-muted/20 p-3 text-xs animate-in fade-in">
                  <p className="text-[11px] text-muted-foreground">
                    Transfer exactly <strong className="text-foreground">${priceUsd} USDT</strong> or equivalent to the agent address on Celo Mainnet:
                  </p>
                  <div className="flex items-center justify-between rounded-lg border border-border/70 bg-card px-3 py-2 font-mono text-[11px]">
                    <span className="truncate mr-2 text-foreground">{payToAddress}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(payToAddress)}
                      className="inline-flex items-center gap-1 text-primary hover:underline shrink-0"
                    >
                      {copiedManual ? <Check className="size-3" /> : <Copy className="size-3" />}
                      <span>{copiedManual ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="pt-2">
                    <label className="block text-[11px] text-muted-foreground mb-1">
                      Already sent? Enter your transaction hash:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="0x..."
                        value={manualTxInput}
                        onChange={(e) => setManualTxInput(e.target.value)}
                        className="flex-1 rounded-lg border border-border/70 bg-card px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyManualTx}
                        disabled={manualVerifying}
                        className="rounded-lg bg-primary/20 text-primary px-3 py-1.5 text-xs font-semibold hover:bg-primary/30 disabled:opacity-50"
                      >
                        {manualVerifying ? <Loader2 className="size-3.5 animate-spin" /> : "I've sent it"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Collapsed "Payment details" expander */}
            <div className="border-t border-border/80 pt-3">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Payment details & attribution</span>
                {showDetails ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </button>

              {showDetails && (
                <div className="mt-3 space-y-1.5 rounded-lg border border-border/70 bg-muted/20 p-3 text-[11px] text-muted-foreground animate-in fade-in">
                  <div className="flex justify-between">
                    <span>Network:</span>
                    <strong className="text-foreground">Celo Mainnet (Chain ID: {CONFIG.CELO_CHAIN_ID})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Attribution Tag:</span>
                    <strong className="font-mono text-primary">{CONFIG.ATTRIBUTION_TAG}</strong>
                  </div>
                  <div className="pt-1 text-[10px] text-muted-foreground border-t border-border/40">
                    Settlements use the ERC-8021 calldata attribution standard for on-chain verification without custodial middlemen.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: STATUS STEP (SURVIVES REFRESH) */}
        {step === 'status' && (
          <div className="mt-5 space-y-5">
            {/* Stepper Progress Visualizer */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                    statusPhase !== 'wallet_confirm'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-primary/20 text-primary border border-primary animate-pulse'
                  }`}
                >
                  {statusPhase !== 'wallet_confirm' ? <Check className="size-3.5" /> : '1'}
                </span>
                <span className="text-xs font-medium text-foreground">Confirm in wallet</span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                    statusPhase === 'running_audit' || statusPhase === 'ready'
                      ? 'bg-emerald-500 text-white'
                      : statusPhase === 'onchain_confirm'
                      ? 'bg-primary/20 text-primary border border-primary animate-pulse'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {statusPhase === 'running_audit' || statusPhase === 'ready' ? (
                    <Check className="size-3.5" />
                  ) : (
                    '2'
                  )}
                </span>
                <span className="text-xs font-medium text-foreground">Confirming on-chain</span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                    statusPhase === 'ready'
                      ? 'bg-emerald-500 text-white'
                      : statusPhase === 'running_audit'
                      ? 'bg-primary/20 text-primary border border-primary animate-pulse'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {statusPhase === 'ready' ? <Check className="size-3.5" /> : '3'}
                </span>
                <span className="text-xs font-medium text-foreground">Running crawl & audit</span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                    statusPhase === 'ready' ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {statusPhase === 'ready' ? <Check className="size-3.5" /> : '4'}
                </span>
                <span className="text-xs font-medium text-foreground">Report ready</span>
              </div>
            </div>

            {/* Current Phase Message Box */}
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
              <div className="flex items-center gap-2">
                {statusPhase !== 'ready' && statusPhase !== 'failed' && (
                  <Loader2 className="size-4 animate-spin text-primary" />
                )}
                {statusPhase === 'ready' && <Check className="size-4 text-emerald-400" />}
                {statusPhase === 'failed' && <AlertCircle className="size-4 text-destructive" />}
                <span className="text-xs font-semibold text-foreground">{statusMessage}</span>
              </div>

              {txHash && (
                <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                  <span>Transaction Hash: </span>
                  <a
                    href={`https://celoscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>{`${txHash.slice(0, 10)}...${txHash.slice(-8)}`}</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Cancel or Start fresh if user wants to abort */}
            {statusPhase !== 'ready' && statusPhase !== 'failed' && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={handleResetFlow}
                  className="text-xs text-muted-foreground/80 hover:text-foreground hover:underline transition-colors cursor-pointer"
                >
                  Cancel or start fresh
                </button>
              </div>
            )}

            {/* Action when Ready */}
            {statusPhase === 'ready' && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (createdReportId) {
                      router.push(`/app/reports/${createdReportId}`);
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
                >
                  <span>View Full Report & Fixes</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            )}

            {/* Action when Failed */}
            {statusPhase === 'failed' && (
              <div className="space-y-3">
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <p className="font-semibold">Audit crawl failed</p>
                  <p className="mt-1">{errorMessage}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('review');
                      setStatusPhase('wallet_confirm');
                      setErrorMessage(null);
                    }}
                    className="flex-1 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-accent transition-colors"
                  >
                    Return to Review
                  </button>
                  <button
                    type="button"
                    onClick={handlePayWithWallet}
                    className="flex-1 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Retry Audit
                  </button>
                </div>
              </div>
            )}

            {/* Failure Policy Note */}
            <div className="text-[11px] text-muted-foreground text-center border-t border-border/80 pt-3">
              <span>Failure policy: if a crawl encounters an error after payment, it auto-retries once. If unresolved, contact support for a full refund. </span>
              <Link href="/terms" target="_blank" className="text-primary hover:underline">
                Read our Refund Policy in Terms
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
