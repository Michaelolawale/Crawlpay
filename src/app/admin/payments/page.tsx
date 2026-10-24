'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, ExternalLink, RefreshCw, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { PaymentRecord } from '@/services/db';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const authKey = sessionStorage.getItem('crawlpay_admin_auth') || 'crawlpay-admin-2025';
      const res = await fetch('/api/admin/payments', {
        headers: { Authorization: `Bearer ${authKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
      }
    } catch (e) {
      console.warn('Payments fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Payment Ledger
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete on-chain ledger of all verified micro-payments settled on Celo Mainnet.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPayments}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-accent transition-colors shadow-sm"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-border bg-card/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Payer Wallet</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Chain ID</th>
                <th className="px-4 py-3">Transaction Hash</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No payment records logged yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground whitespace-nowrap">
                      {`${p.wallet.slice(0, 8)}...${p.wallet.slice(-6)}`}
                    </td>
                    <td className="px-4 py-3 font-bold font-mono text-primary">
                      ${p.amount}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">{p.token}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{p.chain_id}</td>
                    <td className="px-4 py-3 font-mono">
                      <a
                        href={`https://celoscan.io/tx/${p.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <span>{`${p.tx_hash.slice(0, 10)}...${p.tx_hash.slice(-6)}`}</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 capitalize">
                        <CheckCircle2 className="size-3" />
                        <span>{p.status}</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
