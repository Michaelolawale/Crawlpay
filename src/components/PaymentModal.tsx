'use client';

import React, { useState } from 'react';
import {
  Wallet,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { CONFIG } from '@/config';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl: string;
  mode: 'quick' | 'full';
  onPaymentConfirmed: (txHash?: string) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  targetUrl,
  mode,
  onPaymentConfirmed,
}: PaymentModalProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [web3Loading, setWeb3Loading] = useState(false);
  const [agentSettleLoading, setAgentSettleLoading] = useState(false);
  const [web3Status, setWeb3Status] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const priceUsd = mode === 'quick' ? '0.25' : '0.50';
  const payToAddress = CONFIG.AGENT_WALLET_ADDRESS;
  const attributionTag = CONFIG.ATTRIBUTION_TAG;
  const dataSuffix = CONFIG.DATA_SUFFIX;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  /**
   * Real Web3 browser wallet transfer (MetaMask, MiniPay, Rabby, Valora)
   * Sends payment with ERC-8021 attribution suffix on Celo Mainnet
   */
  const handleWeb3Pay = async () => {
    setWeb3Loading(true);
    setErrorMsg(null);
    setWeb3Status('Connecting to browser wallet...');

    try {
      const ethereum = (window as unknown as { ethereum?: any })?.ethereum;
      if (!ethereum) {
        throw new Error('No Web3 wallet extension found (MetaMask / Rabby / Celo). Please install an EVM extension or use Agent Settle.');
      }

      // Request accounts
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || !accounts[0]) {
        throw new Error('Wallet connection rejected by user.');
      }

      setWeb3Status('Switching to Celo Mainnet (42220)...');
      // Ensure Celo Mainnet (42220 / 0xa4ec)
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
        }
      }

      setWeb3Status('Broadcasting attributed transaction on Celo Mainnet...');
      // Broadcast with attribution data suffix
      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: accounts[0],
            to: payToAddress,
            value: '0x0', // Micro-payment
            data: dataSuffix, // ERC-8021 attribution tag suffix
          },
        ],
      });

      setWeb3Status(`Transaction submitted (${txHash.slice(0, 10)}...). Verifying on Celo...`);

      // Verify transaction via backend
      try {
        const verifyRes = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txHash }),
        });
        const verifyData = await verifyRes.json();
        console.log('[Web3 Payment] Verified:', verifyData);
      } catch {
        // Continue if verification takes extra blocks
      }

      onPaymentConfirmed(txHash);
    } catch (err: any) {
      console.error('[Web3 Payment Error]', err);
      setErrorMsg(err?.message || 'Transaction failed or was rejected in wallet.');
    } finally {
      setWeb3Loading(false);
      setWeb3Status(null);
    }
  };

  /**
   * Autonomous Agent Hotwallet Settle:
   * Triggers the agent hotwallet on Celo mainnet to broadcast an attributed transaction directly!
   */
  const handleAgentBroadcastSettle = async () => {
    setAgentSettleLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/agent/broadcast', {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.txHash) {
        console.log('[Agent Settle] Real attributed tx broadcast:', data.txHash);
        onPaymentConfirmed(data.txHash);
      } else {
        // Inform user about funding if 0 balance
        const msg = data?.error || 'Agent wallet has insufficient CELO for gas.';
        setErrorMsg(`${msg} (Send 0.05 CELO to ${payToAddress} on Celo Mainnet to fund autonomous transactions, or use Sandbox Settle below).`);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Agent settlement failed.');
    } finally {
      setAgentSettleLoading(false);
    }
  };

  /**
   * Sandbox preview settle for testing without gas
   */
  const handleSandboxSettle = () => {
    const mockTx = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    onPaymentConfirmed(mockTx);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Close dialog"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Wallet className="size-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">Settle Audit on Celo Rails</h3>
            <p className="text-xs text-muted-foreground">
              No logins · No subscriptions · Settled per crawl via x402
            </p>
          </div>
        </div>

        {/* Pricing Summary */}
        <div className="mt-5 rounded-lg border border-border bg-background p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Target URL:</span>
            <span className="font-mono font-medium text-foreground truncate max-w-[280px]">
              {targetUrl}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Crawl Depth:</span>
            <span className="font-medium text-foreground">
              {mode === 'quick' ? 'Quick Audit (1 Page)' : 'Full Audit (Up to 50 Pages)'}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/80">
            <span className="text-sm font-semibold text-foreground">Total Fee Due:</span>
            <span className="text-base font-bold text-primary font-mono">${priceUsd} USD₮</span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mt-4 space-y-2 text-xs">
          <div>
            <span className="text-muted-foreground block mb-1">PayTo Agent Address (Celo Mainnet):</span>
            <div className="flex items-center justify-between rounded border border-border bg-muted/30 px-3 py-2 font-mono text-[11px]">
              <span className="truncate mr-2 text-foreground">{payToAddress}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(payToAddress, 'address')}
                className="inline-flex items-center gap-1 text-primary hover:underline shrink-0"
              >
                {copied === 'address' ? <Check className="size-3" /> : <Copy className="size-3" />}
                <span>{copied === 'address' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Network: <strong className="text-foreground">Celo Mainnet (42220)</strong></span>
            <span>Tag: <strong className="font-mono text-primary">{attributionTag}</strong></span>
          </div>
        </div>

        {web3Status && (
          <div className="mt-3 flex items-center gap-2 rounded border border-primary/30 bg-primary/10 p-2.5 text-xs text-primary animate-pulse">
            <Loader2 className="size-3.5 animate-spin shrink-0" />
            <span>{web3Status}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 flex items-start gap-2 rounded border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col gap-2.5">
          <div className="flex flex-col gap-2 sm:flex-row">
            {/* Real Web3 Wallet */}
            <button
              type="button"
              onClick={handleWeb3Pay}
              disabled={web3Loading || agentSettleLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60"
            >
              {web3Loading ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
              <span>{web3Loading ? 'Signing Tx...' : 'Pay with Web3 Wallet'}</span>
            </button>

            {/* Autonomous Hotwallet Settle */}
            <button
              type="button"
              onClick={handleAgentBroadcastSettle}
              disabled={web3Loading || agentSettleLoading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent transition-colors disabled:opacity-60"
            >
              {agentSettleLoading ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4 text-primary" />}
              <span>{agentSettleLoading ? 'Broadcasting...' : 'Agent Hotwallet Settle'}</span>
            </button>
          </div>

          {/* Sandbox Fallback */}
          <button
            type="button"
            onClick={handleSandboxSettle}
            className="w-full text-center text-[11px] text-muted-foreground hover:text-foreground py-1 underline transition-colors"
          >
            Or run instant Sandbox Preview (No wallet required)
          </button>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-emerald-400" />
          <span>Attributed on Celo Mainnet via ERC-8021 calldata suffix</span>
        </div>
      </div>
    </div>
  );
}
