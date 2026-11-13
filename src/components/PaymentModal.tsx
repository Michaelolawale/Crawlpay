'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
import { useConfig } from '@/context/ConfigContext';

const PUBLIC_AGENT_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_ADDRESS || '0xf06c2b754d07cba299751f0985a48f8013bb6b39';
const CELO_USDT_ADDRESS = '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e';
const USDT_DECIMALS = 6;
const CELO_CHAIN_ID = 42220;
const ATTRIBUTION_TAG = 'celo_757c2ac3b70c';
const DATA_SUFFIX =
  '0x63656c6f5f373537633261633362373063110080218021802180218021802180218021';
const CELO_PRICE_QUICK = process.env.NEXT_PUBLIC_CELO_PRICE_QUICK || '3.3';
const CELO_PRICE_FULL = process.env.NEXT_PUBLIC_CELO_PRICE_FULL || '6.6';

/**
 * Encodes an ERC-20 transfer(address to, uint256 amount) call with attribution tag calldata suffix.
 */
function encodeErc20Transfer(to: string, amountUnits: bigint, dataSuffix?: string): `0x${string}` {
  const methodId = 'a9059cbb';
  const cleanTo = to.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const cleanAmount = amountUnits.toString(16).padStart(64, '0');
  const cleanSuffix = dataSuffix ? dataSuffix.replace(/^0x/, '') : '';
  return `0x${methodId}${cleanTo}${cleanAmount}${cleanSuffix}` as `0x${string}`;
}

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

/**
 * Resolves the active EVM provider, detecting multi-wallet injections and non-Celo wallets like Phantom.
 */
function getCeloEthereumProvider(): { provider: any; isPhantom: boolean; name: string } | null {
  if (typeof window === 'undefined') return null;
  const eth = (window as unknown as { ethereum?: any })?.ethereum;
  if (!eth) return null;

  // Multi-wallet injector resolution: prioritize non-Phantom EVM wallets that support Celo
  if (Array.isArray(eth.providers) && eth.providers.length > 0) {
    const celoCapable =
      eth.providers.find((p: any) => p.isMetaMask && !p.isPhantom) ||
      eth.providers.find((p: any) => p.isRabby) ||
      eth.providers.find((p: any) => p.isCoinbaseWallet) ||
      eth.providers.find((p: any) => !p.isPhantom);

    if (celoCapable) {
      return {
        provider: celoCapable,
        isPhantom: false,
        name: celoCapable.isRabby ? 'Rabby' : celoCapable.isMetaMask ? 'MetaMask' : 'EVM Wallet',
      };
    }
  }

  const isPhantom = Boolean(
    eth.isPhantom || (window as unknown as { phantom?: { ethereum?: any } })?.phantom?.ethereum === eth
  );

  return {
    provider: eth,
    isPhantom,
    name: isPhantom ? 'Phantom' : eth.isRabby ? 'Rabby' : eth.isMetaMask ? 'MetaMask' : 'EVM Wallet',
  };
}

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
  const [hasVerifiedPayment, setHasVerifiedPayment] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  // Expandable sections
  const [showManualPay, setShowManualPay] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [copiedManual, setCopiedManual] = useState(false);
  const [manualTxInput, setManualTxInput] = useState('');
  const [manualVerifying, setManualVerifying] = useState(false);
  const { config, fullPriceFormatted } = useConfig();

  const priceUsd = mode === 'quick' ? (config.quick_price_usd || '0.00') : (config.full_price_usd || '0.50');
  const celoAmount = mode === 'quick' ? CELO_PRICE_QUICK : CELO_PRICE_FULL;
  const payToAddress = PUBLIC_AGENT_ADDRESS;

  const resetModalState = () => {
    localStorage.removeItem('crawlpay_active_job');
    setStep('review');
    setStatusPhase('wallet_confirm');
    setStatusMessage('Please approve the transaction in your wallet...');
    setTxHash(null);
    setCreatedReportId(null);
    setErrorMessage(null);
    setIsWrongNetwork(false);
    setIsPaying(false);
    setHasVerifiedPayment(false);
  };

  // Restore active job if refreshed or opened (auto-expires stale jobs after 3 minutes)
  useEffect(() => {
    if (!isOpen) return;

    try {
      const activeJobRaw = localStorage.getItem('crawlpay_active_job');
      if (activeJobRaw) {
        const active = JSON.parse(activeJobRaw);
        const ageMs = Date.now() - (active.timestamp || 0);
        // If older than 3 minutes or was failed, discard stale session
        if (ageMs > 3 * 60 * 1000 || active.statusPhase === 'failed') {
          localStorage.removeItem('crawlpay_active_job');
          resetModalState();
          return;
        }

        // Only restore if active audit was genuinely running for this URL
        if (active.targetUrl === targetUrl && active.statusPhase === 'running_audit') {
          setStep('status');
          setStatusPhase(active.statusPhase);
          setStatusMessage(active.statusMessage || 'Processing your audit request in background...');
          setTxHash(active.txHash || null);
          setCreatedReportId(active.reportId || null);
          setHasVerifiedPayment(true);
          if (active.userWallet) setConnectedWallet(active.userWallet);
          return;
        }
      }
    } catch {}

    // If modal opens and we are stuck in a failed or ready phase without an active job, reset to review
    if (statusPhase === 'failed' || statusPhase === 'ready') {
      resetModalState();
    }
  }, [isOpen, targetUrl]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Body scroll lock & Escape key listener
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

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
    setHasVerifiedPayment(true);
    const runningMsg = 'Payment confirmed! Running multi-page crawler and SEO checks...';
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
      localStorage.removeItem('crawlpay_active_job');
      setStatusPhase('failed');
      setErrorMessage(err?.message || 'Audit execution encountered an error.');
    } finally {
      clearTimeout(timeoutId);
      setIsPaying(false);
    }
  };

  /**
   * Main Wallet Payment Flow with Celo compatibility checks & timeout guards
   */
  const handlePayWithWallet = async () => {
    setIsPaying(true);
    setErrorMessage(null);
    setIsWrongNetwork(false);

    // 1. Resolve EVM Provider & Detect non-Celo wallets like Phantom
    const detected = getCeloEthereumProvider();
    if (!detected || !detected.provider) {
      setIsPaying(false);
      setErrorMessage(
        'No EVM wallet detected. Please install a Celo-compatible wallet such as MetaMask, Rabby, Valora, MiniPay, or Coinbase Wallet.'
      );
      return;
    }

    // Explicitly reject Phantom which does not support Celo network (Chain ID 42220)
    if (detected.isPhantom) {
      setIsPaying(false);
      setErrorMessage(
        'Phantom wallet does not support Celo Mainnet (Chain ID 42220). Please connect a Celo-compatible wallet such as MetaMask, Rabby, Valora, MiniPay, or Coinbase Wallet, or use the Manual Transfer option below.'
      );
      return;
    }

    const provider = detected.provider;
    let hasBroadcastTx = false;

    try {
      // 2. Request accounts with 30s timeout guard
      const accountsPromise = provider.request({ method: 'eth_requestAccounts' });
      const accountsTimeout = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Wallet connection request timed out. Please unlock your wallet and approve connection.')),
          30000
        )
      );

      const accounts = await Promise.race([accountsPromise, accountsTimeout]);
      if (!accounts || !accounts[0]) {
        throw new Error('Wallet connection was cancelled or rejected.');
      }
      const userWallet = accounts[0];
      setConnectedWallet(userWallet);

      // 3. Ensure Celo Mainnet (42220 / 0xa4ec)
      let currentChainId: string = '';
      try {
        currentChainId = await provider.request({ method: 'eth_chainId' });
      } catch {}

      const isAlreadyCelo = currentChainId === '0xa4ec' || currentChainId === '42220' || currentChainId === '0x42220';

      if (!isAlreadyCelo) {
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xa4ec' }],
          });
        } catch (switchError: any) {
          if (switchError?.code === 4001) {
            setIsWrongNetwork(true);
            throw new Error('Network switch to Celo Mainnet was rejected in your wallet.');
          }

          // Try adding Celo chain if unsupported or not yet added
          try {
            await provider.request({
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
          } catch (addError: any) {
            if (addError?.code === 4001) {
              throw new Error('Adding Celo Mainnet to your wallet was rejected.');
            }
            throw new Error(
              'Your connected wallet does not support Celo Mainnet (Chain ID 42220). Please switch to MetaMask, Rabby, Valora, or use the Manual Transfer option below.'
            );
          }
        }

        // Verify chain again
        try {
          const verifiedChainId = await provider.request({ method: 'eth_chainId' });
          if (verifiedChainId !== '0xa4ec' && verifiedChainId !== '42220' && verifiedChainId !== '0x42220') {
            setIsWrongNetwork(true);
            throw new Error('Wallet is not connected to Celo Mainnet (Chain ID 42220). Please switch networks in your wallet.');
          }
        } catch (chainErr: any) {
          if (chainErr?.message?.includes('not connected to Celo')) throw chainErr;
        }
      }

      // 4. Pre-flight Balance Checks (CELO gas + USDT balance) BEFORE broadcasting transaction!
      const usdtUnits = BigInt(Math.round(Number(priceUsd) * Math.pow(10, USDT_DECIMALS)));

      // Check native CELO balance for gas
      try {
        const celoBalanceHex = await provider.request({
          method: 'eth_getBalance',
          params: [userWallet, 'latest'],
        });
        const celoBal = BigInt(celoBalanceHex || '0x0');
        if (celoBal === 0n) {
          setStep('review');
          setStatusPhase('wallet_confirm');
          setIsPaying(false);
          setErrorMessage(
            'Insufficient CELO for gas. You need a fraction of a cent of CELO (< $0.001) in your wallet to cover transaction fees on Celo Mainnet. Please add a small amount of CELO to your wallet or use Manual Transfer below.'
          );
          return;
        }
      } catch (gasErr) {
        console.warn('[Gas Balance Check Warning]', gasErr);
      }

      // Check ERC-20 USDT balance on Celo
      try {
        const cleanWallet = userWallet.toLowerCase().replace(/^0x/, '').padStart(64, '0');
        const usdtBalanceHex = await provider.request({
          method: 'eth_call',
          params: [
            {
              to: CELO_USDT_ADDRESS,
              data: `0x70a08231${cleanWallet}`,
            },
            'latest',
          ],
        });
        if (usdtBalanceHex && usdtBalanceHex !== '0x') {
          const usdtBal = BigInt(usdtBalanceHex);
          if (usdtBal < usdtUnits) {
            const userUsdt = (Number(usdtBal) / Math.pow(10, USDT_DECIMALS)).toFixed(2);
            setStep('review');
            setStatusPhase('wallet_confirm');
            setIsPaying(false);
            setErrorMessage(
              `Insufficient USDT balance. Your wallet currently has $${userUsdt} USDT on Celo Mainnet, but $${priceUsd} USDT is required for this audit. Please top up your wallet with USDT on Celo (or use Manual Transfer below).`
            );
            return;
          }
        }
      } catch (usdtErr) {
        console.warn('[USDT Balance Check Warning]', usdtErr);
      }

      // 5. Switch to Status Stepper
      setStep('status');
      setStatusPhase('wallet_confirm');
      setStatusMessage('Please confirm the transaction in your wallet...');

      // 6. Send transaction on Celo Mainnet with 45-second timeout guard
      let submittedTxHash: string;
      const transferData = encodeErc20Transfer(payToAddress, usdtUnits, DATA_SUFFIX);

      try {
        const sendTxPromise = provider.request({
          method: 'eth_sendTransaction',
          params: [
            {
              from: userWallet,
              to: CELO_USDT_ADDRESS,
              value: '0x0',
              data: transferData,
            },
          ],
        });

        const txTimeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  'Wallet confirmation timed out (45s). Your wallet did not complete the transaction. If using an unsupported wallet or custom network, please use MetaMask or the Manual Transfer option below.'
                )
              ),
            45000
          )
        );

        submittedTxHash = await Promise.race([sendTxPromise, txTimeoutPromise]);
      } catch (txErr: any) {
        // Revert back to review step immediately so user is never trapped in endless status spinner
        setStep('review');
        setStatusPhase('wallet_confirm');
        setIsPaying(false);

        if (txErr?.code === 4001 || txErr?.message?.toLowerCase().includes('reject') || txErr?.message?.toLowerCase().includes('denied')) {
          setErrorMessage('Nothing was charged. The transaction was rejected in your wallet. You can try again whenever you’re ready.');
          return;
        }

        if (
          txErr?.message?.toLowerCase().includes('insufficient funds') ||
          txErr?.message?.toLowerCase().includes('exceeds balance') ||
          txErr?.message?.toLowerCase().includes('transfer amount exceeds') ||
          txErr?.message?.toLowerCase().includes('insufficient celo')
        ) {
          setErrorMessage(
            `Nothing was charged. Insufficient USDT or CELO for gas. You need ${fullPriceFormatted} USDT on Celo and a fraction of a cent of CELO for transaction gas (< $0.001). Please top up your wallet or use Manual Transfer.`
          );
          return;
        }

        setErrorMessage(txErr?.message ? `Nothing was charged. ${txErr.message}` : 'Nothing was charged. Transaction could not be broadcast from your wallet.');
        return;
      }

      // Transaction successfully broadcasted on Celo
      hasBroadcastTx = true;
      setTxHash(submittedTxHash);
      setStatusPhase('onchain_confirm');
      setStatusMessage(`Transaction broadcast (${submittedTxHash.slice(0, 10)}...). Confirming on Celo Mainnet...`);

      // 7. Poll for on-chain block mining confirmation
      let isPaymentConfirmed = false;
      let verifyError: string | null = null;

      for (let attempt = 1; attempt <= 15; attempt++) {
        try {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ txHash: submittedTxHash, url: targetUrl, mode }),
          });
          const vData = await verifyRes.json();
          if (vData.valid && vData.mined) {
            isPaymentConfirmed = true;
            setHasVerifiedPayment(true);
            break;
          }
          // If transaction reverted or failed on-chain, stop polling immediately!
          if (vData.reverted || vData.error?.toLowerCase().includes('revert')) {
            verifyError = vData.error || 'Transaction was reverted on Celo Mainnet. No funds were transferred.';
            break;
          }
        } catch {}
        if (attempt < 15) {
          setStatusMessage(`Awaiting Celo block confirmation (attempt ${attempt}/15)...`);
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      if (!isPaymentConfirmed) {
        throw new Error(verifyError || 'Payment verification failed: Transaction was reverted or not found on Celo Mainnet.');
      }

      // 8. Execute audit pipeline ONLY with verified payment proof
      await executeAuditPipeline(submittedTxHash, userWallet);
    } catch (err: any) {
      console.error('[Payment Flow Error]', err);
      localStorage.removeItem('crawlpay_active_job');
      if (hasBroadcastTx) {
        setStatusPhase('failed');
        setErrorMessage(err?.message || 'Audit execution encountered an error.');
      } else {
        // Never leave user trapped on status screen if no transaction took place
        setStep('review');
        setStatusPhase('wallet_confirm');
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
        body: JSON.stringify({ txHash: manualTxInput.trim(), url: targetUrl, mode }),
      });
      const verifyData = await verifyRes.json();

      if (verifyData.valid && verifyData.mined) {
        setTxHash(manualTxInput.trim());
        setHasVerifiedPayment(true);
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
    if (statusPhase === 'failed' || statusPhase === 'ready' || statusPhase === 'wallet_confirm') {
      resetModalState();
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] isolate">
      {/* 1. Full-Screen Backdrop Blur - Edge to edge without container clipping */}
      <div
        className="fixed inset-0 bg-ink/70 dark:bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200 cursor-pointer"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* 2. Scrollable Viewport Wrapper */}
      <div className="fixed inset-0 overflow-y-auto overflow-x-hidden flex min-h-[100dvh] items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        {/* Modal Container: Bottom sheet on mobile, rounded card on desktop */}
        <div
          className="pointer-events-auto relative w-full max-w-lg rounded-t-[24px] sm:rounded-[24px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 sm:p-6 shadow-2xl max-h-[90dvh] sm:max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
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
                  ? 'Includes single-page crawl, SEO, AEO & GEO engine checks, prioritized findings & paste-ready code fixes.'
                  : 'Includes deep multi-page crawl, AEO query mapping, GEO citability, sitewide indexability, and ready code fixes.'}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-graphite-100 dark:border-graphite-800">
                <span className="text-sm font-bold text-ink dark:text-white">Total Fee:</span>
                <span className="text-base font-bold text-ink dark:text-white font-mono">
                  ${priceUsd} USDT <span className="text-xs text-graphite-600 dark:text-graphite-400 font-normal">(on Celo)</span>
                </span>
              </div>
            </div>

            {/* Error Feedback */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-[14px] border border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
                <AlertCircle className="size-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="leading-relaxed">{errorMessage}</p>
                  {isWrongNetwork && (
                    <button
                      type="button"
                      onClick={handlePayWithWallet}
                      className="inline-flex items-center gap-1.5 rounded-[48px] bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 px-3 py-1 text-amber-800 dark:text-amber-200 hover:bg-amber-200 font-semibold text-xs transition-colors"
                    >
                      <AlertTriangle className="size-3" />
                      <span>Switch to Celo Mainnet (42220)</span>
                    </button>
                  )}
                  {errorMessage.includes('Manual Transfer') && (
                    <button
                      type="button"
                      onClick={() => setShowManualPay(true)}
                      className="inline-flex items-center gap-1.5 rounded-[48px] bg-ink dark:bg-white text-white dark:text-ink px-3.5 py-1 text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      <span>Open Manual Transfer Details</span>
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
                <span>{isPaying ? 'Processing...' : `Pay $${priceUsd} USDT with wallet`}</span>
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
                    Transfer exactly <strong className="text-ink dark:text-white">${priceUsd} USDT</strong> to the agent address on Celo Mainnet:
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
                    <span>Accepted Token:</span>
                    <strong className="text-ink dark:text-white">USDT (on Celo Mainnet)</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>USDT Contract:</span>
                    <a
                      href={`https://celoscan.io/token/${CELO_USDT_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-violet hover:underline inline-flex items-center gap-1 text-[10px]"
                    >
                      <span>{`${CELO_USDT_ADDRESS.slice(0, 8)}...${CELO_USDT_ADDRESS.slice(-6)}`}</span>
                      <ExternalLink className="size-2.5" />
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span>Attribution Tag:</span>
                    <strong className="font-mono text-violet">{ATTRIBUTION_TAG}</strong>
                  </div>
                  <div className="pt-1.5 text-[10px] text-graphite-800/80 dark:text-graphite-400 border-t border-graphite-100 dark:border-graphite-800">
                    Settlements use the ERC-8021 calldata attribution standard on Celo Mainnet.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: STATUS STEP (SURVIVES REFRESH) */}
        {step === 'status' && (
          <div className="mt-5 space-y-5 animate-slide-up">
            {/* Visual Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-mono">
                <span className="text-graphite-600 dark:text-graphite-400">Audit Progression</span>
                <span className="font-bold text-violet">
                  {statusPhase === 'wallet_confirm'
                    ? '25%'
                    : statusPhase === 'onchain_confirm'
                    ? '50%'
                    : statusPhase === 'running_audit'
                    ? '80%'
                    : statusPhase === 'ready'
                    ? '100%'
                    : 'Processing'}
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#e6e6e8] dark:bg-[#252631] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet to-emerald-500 transition-all duration-700 ease-out"
                  style={{
                    width:
                      statusPhase === 'wallet_confirm'
                        ? '25%'
                        : statusPhase === 'onchain_confirm'
                        ? '50%'
                        : statusPhase === 'running_audit'
                        ? '80%'
                        : statusPhase === 'ready'
                        ? '100%'
                        : '10%',
                  }}
                />
              </div>
            </div>

            {/* Stepper Progress Visualizer */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    statusPhase !== 'wallet_confirm'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-ink dark:bg-white text-white dark:text-ink animate-pulse ring-2 ring-violet/40'
                  }`}
                >
                  {statusPhase !== 'wallet_confirm' ? <Check className="size-3.5" /> : '1'}
                </span>
                <span className="text-xs font-semibold text-ink dark:text-white">Confirm in wallet</span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    statusPhase === 'running_audit' || statusPhase === 'ready'
                      ? 'bg-emerald-600 text-white'
                      : statusPhase === 'onchain_confirm'
                      ? 'bg-ink dark:bg-white text-white dark:text-ink animate-pulse ring-2 ring-violet/40'
                      : 'bg-[#e6e6e8] dark:bg-[#252631] text-graphite-800 dark:text-graphite-400'
                  }`}
                >
                  {statusPhase === 'running_audit' || statusPhase === 'ready' ? (
                    <Check className="size-3.5" />
                  ) : (
                    '2'
                  )}
                </span>
                <span className="text-xs font-semibold text-ink dark:text-white">Confirming on-chain</span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    statusPhase === 'ready'
                      ? 'bg-emerald-600 text-white'
                      : statusPhase === 'running_audit'
                      ? 'bg-ink dark:bg-white text-white dark:text-ink animate-pulse ring-2 ring-violet/40'
                      : 'bg-[#e6e6e8] dark:bg-[#252631] text-graphite-800 dark:text-graphite-400'
                  }`}
                >
                  {statusPhase === 'ready' ? <Check className="size-3.5" /> : '3'}
                </span>
                <span className="text-xs font-semibold text-ink dark:text-white">Running crawl &amp; audit</span>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`flex size-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    statusPhase === 'ready' ? 'bg-emerald-600 text-white' : 'bg-[#e6e6e8] dark:bg-[#252631] text-graphite-800 dark:text-graphite-400'
                  }`}
                >
                  {statusPhase === 'ready' ? <Check className="size-3.5" /> : '4'}
                </span>
                <span className="text-xs font-semibold text-ink dark:text-white">Report ready</span>
              </div>
            </div>

            {/* Current Phase Message Box */}
            <div className="rounded-[16px] border border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#111216] p-4 space-y-2">
              <div className="flex items-center gap-2">
                {statusPhase !== 'ready' && statusPhase !== 'failed' && (
                  <Loader2 className="size-4 animate-spin text-ink dark:text-white" />
                )}
                {statusPhase === 'ready' && <Check className="size-4 text-emerald-600" />}
                {statusPhase === 'failed' && <AlertCircle className="size-4 text-rose-600" />}
                <span className="text-xs font-semibold text-ink dark:text-white">{statusMessage}</span>
              </div>

              {txHash && (
                <div className="pt-2 border-t border-graphite-100 dark:border-graphite-800 text-[11px] text-graphite-800 dark:text-graphite-400">
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

            {/* Before payment deduction: safe cancel option & wallet fallback hint */}
            {statusPhase === 'wallet_confirm' && (
              <div className="flex flex-col items-center gap-2 pt-2 text-center">
                <button
                  type="button"
                  onClick={resetModalState}
                  className="rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-4 py-1.5 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-100 dark:hover:bg-[#252631] transition-colors cursor-pointer"
                >
                  Cancel and return to review
                </button>
                <p className="text-[11px] text-graphite-500 dark:text-graphite-400 max-w-xs">
                  If your wallet extension does not prompt, it might not support Celo Mainnet (e.g. Phantom). You can cancel and use Manual Transfer instead.
                </p>
              </div>
            )}

            {/* During onchain confirm: Awaiting block receipt indicator */}
            {statusPhase === 'onchain_confirm' && (
              <div className="rounded-[16px] border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 p-3.5 text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300 text-[11px]">
                  <Loader2 className="size-3.5 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Confirming on Celo Mainnet</span>
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  Transaction broadcasted. Awaiting block receipt and verification from Celo network nodes (usually ~2-5 seconds)...
                </p>
              </div>
            )}

            {/* After payment verified & audit is executing: Run in background reassurance */}
            {statusPhase === 'running_audit' && (
              <div className="rounded-[16px] border border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 p-3.5 text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
                    <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Payment Verified on Celo</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-emerald-800 dark:text-emerald-300 hover:underline text-[11px] font-bold cursor-pointer"
                  >
                    Run in background
                  </button>
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
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

            {/* Action when Failed: Never trap the user, always provide a clear path forward */}
            {statusPhase === 'failed' && (
              <div className="space-y-3">
                <div className="rounded-[14px] border border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/40 p-3.5 text-xs text-rose-700 dark:text-rose-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                    <p className="font-bold">
                      {hasVerifiedPayment ? 'Audit crawl failed' : 'Payment not completed / reverted'}
                    </p>
                  </div>
                  <p className="mt-1.5 leading-relaxed">{errorMessage}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 rounded-[48px] border border-graphite-200 dark:border-graphite-700 bg-white dark:bg-[#1a1b22] px-3.5 py-2.5 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-100 dark:hover:bg-[#252631] transition-colors"
                  >
                    Close
                  </button>

                  {!hasVerifiedPayment ? (
                    <button
                      type="button"
                      onClick={resetModalState}
                      className="flex-1 rounded-[48px] bg-ink dark:bg-white px-3.5 py-2.5 text-xs font-semibold text-white dark:text-ink hover:opacity-90 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="size-3.5" />
                      <span>Try Payment Again</span>
                    </button>
                  ) : txHash ? (
                    <button
                      type="button"
                      onClick={() => executeAuditPipeline(txHash, connectedWallet || undefined)}
                      disabled={isPaying}
                      className="flex-1 rounded-[48px] bg-ink dark:bg-white px-3.5 py-2.5 text-xs font-semibold text-white dark:text-ink hover:opacity-90 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {isPaying ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                      <span>{isPaying ? 'Retrying...' : 'Retry Audit (No Extra Fee)'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resetModalState}
                      className="flex-1 rounded-[48px] bg-ink dark:bg-white px-3.5 py-2.5 text-xs font-semibold text-white dark:text-ink hover:opacity-90 transition-colors"
                    >
                      Return to Review
                    </button>
                  )}
                </div>

                {!hasVerifiedPayment && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        resetModalState();
                        setShowManualPay(true);
                      }}
                      className="text-xs text-graphite-600 dark:text-graphite-400 hover:text-ink dark:hover:text-white underline transition-colors cursor-pointer"
                    >
                      Already sent another transaction? Enter hash manually
                    </button>
                  </div>
                )}
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
    </div>,
    document.body
  );
}
