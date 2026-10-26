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
import { FullAuditReport } from '@/types/audit';

const PUBLIC_AGENT_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_ADDRESS || '0xf06c2b754d07cba299751f0985a48f8013bb6b39';
const CELO_CHAIN_ID = 42220;
const ATTRIBUTION_TAG = 'celo_757c2ac3b70c';
const DATA_SUFFIX =
  '0x63656c6f5f373537633261633362373063110080218021802180218021802180218021';
const CELO_PRICE_QUICK = process.env.NEXT_PUBLIC_CELO_PRICE_QUICK || '3.3';
const CELO_PRICE_FULL = process.env.NEXT_PUBLIC_CELO_PRICE_FULL || '6.6';

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
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  // Expandable sections
  const [showManualPay, setShowManualPay] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copiedManual, setCopiedManual] = useState(false);
  const [manualTxInput, setManualTxInput] = useState('');
  const [manualVerifying, setManualVerifying] = useState(false);
  const [dynamicPrices, setDynamicPrices] = useState<{ quick: string; full: string }>({
    quick: '0.25',
    full: '0.50',
  });

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => {
        if (data?.quick_price_usd && data?.full_price_usd) {
          setDynamicPrices({ quick: data.quick_price_usd, full: data.full_price_usd });
        }
      })
      .catch(() => {});
  }, []);

  const priceUsd = mode === 'quick' ? dynamicPrices.quick : dynamicPrices.full;
  const celoAmount = mode === 'quick' ? CELO_PRICE_QUICK : CELO_PRICE_FULL;
  const payToAddress = PUBLIC_AGENT_ADDRESS;

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
          if (active.userWallet) setConnectedWallet(active.userWallet);
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
   * Execute Audit Pipeline with Verified Payment Proof
   */
  const executeAuditPipeline = async (proofTxHash: string, userWalletAddr?: string) => {
    setIsPaying(true);
    setStatusPhase('running_audit');
    const runningMsg = 'Payment confirmed! Running multi-page crawler and deterministic SEO checks...';
    setStatusMessage(runningMsg);
    setErrorMessage(null);

    const wallet = userWalletAddr || connectedWallet || 'unknown';
    const newJobId = `job_${Date.now()}`;
    localStorage.setItem(
      'crawlpay_active_job',
      JSON.stringify({
        jobId: newJobId,
        targetUrl,
        mode,
        txHash: proofTxHash,
        userWallet: wallet,
        statusPhase: 'running_audit',
        statusMessage: runningMsg,
        timestamp: Date.now(),
      })
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 65000); // 65s timeout guard

    try {
      let auditRes = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `x402 ${proofTxHash}`,
        },
        body: JSON.stringify({
          url: targetUrl,
          mode,
          paymentProof: proofTxHash,
          wallet,
        }),
        signal: controller.signal,
      });

      // If 402/retry needed, give the node 3 seconds to sync and retry once
      if (auditRes.status === 402) {
        setStatusMessage('Syncing receipt on Celo Mainnet... retrying verification...');
        await new Promise((r) => setTimeout(r, 3000));
        auditRes = await fetch('/api/audit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `x402 ${proofTxHash}`,
          },
          body: JSON.stringify({
            url: targetUrl,
            mode,
            paymentProof: proofTxHash,
            wallet,
          }),
          signal: controller.signal,
        });
      }

      const auditData = await auditRes.json();
      if (!auditRes.ok) {
        throw new Error(auditData.error || 'Audit crawler failed during execution.');
      }

      const generatedReportId = `rep_${Date.now()}`;
      setCreatedReportId(generatedReportId);
      setStatusPhase('ready');
      setStatusMessage('Audit completed successfully! Your report and code fixes are ready.');

      // Update stored active job
      localStorage.setItem(
        'crawlpay_active_job',
        JSON.stringify({
          jobId: newJobId,
          targetUrl,
          mode,
          txHash: proofTxHash,
          userWallet: wallet,
          statusPhase: 'ready',
          reportId: generatedReportId,
        })
      );

      // Save report in localStorage history
      saveToHistory(auditData, generatedReportId, proofTxHash, mode, targetUrl, wallet);
      if (onAuditReady) {
        onAuditReady(auditData, generatedReportId);
      } else if (onPaymentConfirmed) {
        onPaymentConfirmed(proofTxHash);
      }
    } catch (err: any) {
      console.error('[Audit Pipeline Error]', err);
      setStatusPhase('failed');
      setErrorMessage(err?.message || 'Audit execution encountered an error.');
    } finally {
      clearTimeout(timeoutId);
      setIsPaying(false);
    }
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
      setConnectedWallet(userWallet);

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
      const celoInWei = BigInt(Math.floor(Number(celoAmount) * 1e18));
      const valueHex = '0x' + celoInWei.toString(16);

      try {
        submittedTxHash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: userWallet,
              to: payToAddress,
              value: valueHex, // Deducts real CELO
              data: DATA_SUFFIX, // ERC-8021 Attribution tag suffix
            },
          ],
        });
      } catch (txErr: any) {
        // Handle User Rejection gracefully (No funds deducted yet)
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

      // Transaction successfully broadcasted on Celo
      setTxHash(submittedTxHash);
      setStatusPhase('onchain_confirm');
      setStatusMessage(`Transaction broadcast (${submittedTxHash.slice(0, 10)}...). Confirming on Celo Mainnet...`);

      // 5. Poll for on-chain block mining confirmation
      for (let attempt = 1; attempt <= 15; attempt++) {
        try {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ txHash: submittedTxHash }),
          });
          const vData = await verifyRes.json();
          if (vData.valid && vData.mined) {
            break;
          }
        } catch {}
        if (attempt < 15) {
          setStatusMessage(`Awaiting Celo block confirmation (attempt ${attempt}/15)...`);
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      // 6. Execute audit pipeline with verified payment proof
      await executeAuditPipeline(submittedTxHash, userWallet);
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
        await executeAuditPipeline(manualTxInput.trim(), 'Manual');
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container: Bottom sheet on mobile, rounded card on desktop */}
      <div className="relative w-full max-w-lg rounded-t-[24px] sm:rounded-[24px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-[10px] p-2 text-graphite-800 dark:text-graphite-300 hover:bg-[#f4f4f6] dark:hover:bg-[#1f2027] hover:text-ink dark:hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-[10px] bg-ink dark:bg-violet text-white shadow-sm shrink-0">
            <Wallet className="size-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-ink dark:text-white">Confirm & pay</h3>
            {/* Stepper Indicator */}
            <div className="flex items-center gap-2 mt-0.5 text-xs">
              <span className={`font-semibold ${step === 'review' ? 'text-violet' : 'text-graphite-800 dark:text-graphite-400'}`}>
                1. Review
              </span>
              <span className="text-graphite-800/40 dark:text-graphite-500">→</span>
              <span className={`font-semibold ${step === 'status' ? 'text-violet' : 'text-graphite-800 dark:text-graphite-400'}`}>
                2. Status
              </span>
            </div>
          </div>
        </div>

        {/* STEP 1: REVIEW & PAY */}
        {step === 'review' && (
          <div className="mt-5 space-y-4">
            {/* Summary Box */}
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#111216] p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs gap-2">
                <span className="text-graphite-800 dark:text-graphite-400 shrink-0">Target URL:</span>
                <span className="font-mono font-semibold text-ink dark:text-white truncate max-w-[180px] sm:max-w-[280px]">
                  {targetUrl}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs gap-2">
                <span className="text-graphite-800 dark:text-graphite-400 shrink-0">Crawl Depth:</span>
                <span className="font-semibold text-ink dark:text-white capitalize">
                  {mode === 'quick' ? 'Quick Audit (1 Page)' : 'Full Audit (Up to 50 Pages)'}
                </span>
              </div>

              <div className="text-[11px] text-graphite-800 dark:text-graphite-400 pt-1.5 border-t border-graphite-100 dark:border-graphite-800">
                {mode === 'quick'
                  ? 'Includes single-page crawl, 10 deterministic checks, root cause grouping & AI fixes.'
                  : 'Includes deep multi-page BFS crawl, sitewide indexability, orphan checks, and code patches.'}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-graphite-100 dark:border-graphite-800">
                <span className="text-sm font-bold text-ink dark:text-white">Total Fee:</span>
                <span className="text-base font-bold text-ink dark:text-white font-mono">
                  {celoAmount} CELO <span className="text-xs text-graphite-800 dark:text-graphite-400 font-normal">(${priceUsd} USD)</span>
                </span>
              </div>
            </div>

            {/* Error Feedback */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-[14px] border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 min-w-0">
                  <p>{errorMessage}</p>
                  {isWrongNetwork && (
                    <button
                      type="button"
                      onClick={handlePayWithWallet}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-[48px] bg-amber-100 border border-amber-300 px-3 py-1 text-amber-800 hover:bg-amber-200 font-semibold text-xs"
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
                className="w-full inline-flex h-[48px] items-center justify-center gap-2 rounded-[48px] bg-ink dark:bg-white px-4 text-sm font-semibold text-white dark:text-ink hover:opacity-90 transition-all shadow-sm disabled:opacity-50"
              >
                {isPaying ? <Loader2 className="size-4 animate-spin text-white dark:text-ink" /> : <Wallet className="size-4" />}
                <span>{isPaying ? 'Processing...' : `Pay ${celoAmount} CELO with wallet`}</span>
              </button>

              <div className="mt-2.5 text-center">
                <Link
                  href="/example"
                  target="_blank"
                  className="text-xs text-graphite-800 dark:text-graphite-400 hover:text-ink dark:hover:text-white underline transition-colors"
                >
                  See a demo preview
                </Link>
              </div>
            </div>

            {/* Collapsed "Pay manually" section */}
            <div className="border-t border-graphite-100 dark:border-graphite-800 pt-3">
              <button
                type="button"
                onClick={() => setShowManualPay(!showManualPay)}
                className="flex w-full items-center justify-between text-xs font-semibold text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white transition-colors"
              >
                <span>Pay manually (Direct Transfer)</span>
                {showManualPay ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </button>

              {showManualPay && (
                <div className="mt-3 space-y-2.5 rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#111216] p-3.5 text-xs animate-in fade-in">
                  <p className="text-[11px] text-graphite-800 dark:text-graphite-300">
                    Transfer exactly <strong className="text-ink dark:text-white">{celoAmount} CELO</strong> (${priceUsd} USDT/USD) to the agent address on Celo Mainnet:
                  </p>
                  <div className="flex items-center justify-between rounded-[32px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#1a1b22] px-3.5 py-2 font-mono text-[11px] min-w-0">
                    <span className="truncate mr-2 text-ink dark:text-white flex-1 min-w-0">{payToAddress}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(payToAddress)}
                      className="inline-flex items-center gap-1 text-violet font-semibold hover:underline shrink-0"
                    >
                      {copiedManual ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                      <span>{copiedManual ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="pt-2">
                    <label className="block text-[11px] font-semibold text-graphite-800 dark:text-graphite-300 mb-1">
                      Already sent? Enter your transaction hash:
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="0x..."
                        value={manualTxInput}
                        onChange={(e) => setManualTxInput(e.target.value)}
                        className="flex-1 rounded-[32px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#1a1b22] px-3.5 py-2 text-xs font-mono text-ink dark:text-white placeholder:text-graphite-800/50 dark:placeholder:text-graphite-400/50 focus:outline-none focus:border-ink min-w-0"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyManualTx}
                        disabled={manualVerifying}
                        className="rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-4 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50 shrink-0 shadow-sm"
                      >
                        {manualVerifying ? <Loader2 className="size-3.5 animate-spin text-white dark:text-ink" /> : "I've sent it"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Collapsed "Payment details" expander */}
            <div className="border-t border-graphite-100 dark:border-graphite-800 pt-3">
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="flex w-full items-center justify-between text-xs font-semibold text-graphite-800 dark:text-graphite-300 hover:text-ink dark:hover:text-white transition-colors"
              >
                <span>Payment details & attribution</span>
                {showDetails ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </button>

              {showDetails && (
                <div className="mt-3 space-y-1.5 rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#111216] p-3 text-[11px] text-graphite-800 dark:text-graphite-300 animate-in fade-in">
                  <div className="flex justify-between">
                    <span>Network:</span>
                    <strong className="text-ink dark:text-white">Celo Mainnet (Chain ID: {CELO_CHAIN_ID})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Attribution Tag:</span>
                    <strong className="font-mono text-violet">{ATTRIBUTION_TAG}</strong>
                  </div>
                  <div className="pt-1.5 text-[10px] text-graphite-800/80 dark:text-graphite-400 border-t border-graphite-100 dark:border-graphite-800">
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
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                    statusPhase !== 'wallet_confirm'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-ink text-white animate-pulse'
                  }`}
                >
                  {statusPhase !== 'wallet_confirm' ? <Check className="size-3.5" /> : '1'}
                </span>
                <span className="text-xs font-semibold text-ink">Confirm in wallet</span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                    statusPhase === 'running_audit' || statusPhase === 'ready'
                      ? 'bg-emerald-600 text-white'
                      : statusPhase === 'onchain_confirm'
                      ? 'bg-ink text-white animate-pulse'
                      : 'bg-[#e6e6e8] text-graphite-800'
                  }`}
                >
                  {statusPhase === 'running_audit' || statusPhase === 'ready' ? (
                    <Check className="size-3.5" />
                  ) : (
                    '2'
                  )}
                </span>
                <span className="text-xs font-semibold text-ink">Confirming on-chain</span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                    statusPhase === 'ready'
                      ? 'bg-emerald-600 text-white'
                      : statusPhase === 'running_audit'
                      ? 'bg-ink text-white animate-pulse'
                      : 'bg-[#e6e6e8] text-graphite-800'
                  }`}
                >
                  {statusPhase === 'ready' ? <Check className="size-3.5" /> : '3'}
                </span>
                <span className="text-xs font-semibold text-ink">Running crawl & audit</span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                    statusPhase === 'ready' ? 'bg-emerald-600 text-white' : 'bg-[#e6e6e8] text-graphite-800'
                  }`}
                >
                  {statusPhase === 'ready' ? <Check className="size-3.5" /> : '4'}
                </span>
                <span className="text-xs font-semibold text-ink">Report ready</span>
              </div>
            </div>

            {/* Current Phase Message Box */}
            <div className="rounded-[16px] border border-graphite-100 bg-[#f4f4f6] p-4 space-y-2">
              <div className="flex items-center gap-2">
                {statusPhase !== 'ready' && statusPhase !== 'failed' && (
                  <Loader2 className="size-4 animate-spin text-ink" />
                )}
                {statusPhase === 'ready' && <Check className="size-4 text-emerald-600" />}
                {statusPhase === 'failed' && <AlertCircle className="size-4 text-rose-600" />}
                <span className="text-xs font-semibold text-ink">{statusMessage}</span>
              </div>

              {txHash && (
                <div className="pt-2 border-t border-graphite-100 text-[11px] text-graphite-800">
                  <span>Transaction Hash: </span>
                  <a
                    href={`https://celoscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-violet hover:underline inline-flex items-center gap-1"
                  >
                    <span>{`${txHash.slice(0, 10)}...${txHash.slice(-8)}`}</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Before payment deduction: safe cancel option */}
            {statusPhase === 'wallet_confirm' && (
              <div className="flex justify-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('review');
                    setStatusPhase('wallet_confirm');
                    setErrorMessage(null);
                    setIsPaying(false);
                  }}
                  className="text-xs text-graphite-800 hover:text-ink underline transition-colors cursor-pointer"
                >
                  Cancel and return to review
                </button>
              </div>
            )}

            {/* After payment deduction: Run in background reassurance */}
            {(statusPhase === 'onchain_confirm' || statusPhase === 'running_audit') && (
              <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 p-3.5 text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-800 text-[11px]">
                    <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
                    <span>Payment Verified on Celo</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-emerald-800 hover:underline text-[11px] font-bold cursor-pointer"
                  >
                    Run in background
                  </button>
                </div>
                <p className="text-[11px] text-emerald-700 leading-relaxed">
                  Your audit is executing. You can keep this dialog open or close it—your report will be saved to your Reports history automatically upon completion.
                </p>
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
                  className="w-full inline-flex h-[48px] items-center justify-center gap-2 rounded-[48px] bg-ink px-4 text-sm font-semibold text-white hover:opacity-90 transition-all shadow-sm"
                >
                  <span>View Full Report & Fixes</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            )}

            {/* Action when Failed: Never charge twice, offer free retry using txHash */}
            {statusPhase === 'failed' && (
              <div className="space-y-3">
                <div className="rounded-[14px] border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  <p className="font-bold">Audit crawl failed</p>
                  <p className="mt-1">{errorMessage}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 rounded-[48px] border border-graphite-100 bg-white px-3 py-2 text-xs font-semibold text-ink hover:bg-graphite-100/50 transition-colors"
                  >
                    Close
                  </button>
                  {txHash ? (
                    <button
                      type="button"
                      onClick={() => executeAuditPipeline(txHash, connectedWallet || undefined)}
                      disabled={isPaying}
                      className="flex-1 rounded-[48px] bg-ink px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition-colors disabled:opacity-50"
                    >
                      {isPaying ? 'Retrying...' : 'Retry Audit (No Extra Fee)'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setStep('review');
                        setStatusPhase('wallet_confirm');
                        setErrorMessage(null);
                      }}
                      className="flex-1 rounded-[48px] bg-ink px-3 py-2 text-xs font-semibold text-white hover:opacity-90 transition-colors"
                    >
                      Return to Review
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Failure Policy Note */}
            <div className="text-[11px] text-graphite-800 text-center border-t border-graphite-100 pt-3">
              <span>Failure policy: if a crawl encounters an error after payment, it auto-retries once. If unresolved, contact support for a full refund. </span>
              <Link href="/terms" target="_blank" className="text-violet font-semibold hover:underline">
                Read our Refund Policy in Terms
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
