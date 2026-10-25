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
      const authKey = sessionStorage.getItem('crawlpay_admin_auth') || '';
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
    const interval = setInterval(fetchPayments, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-graphite-100 dark:border-graphite-800 pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white sm:text-3xl">
            Payment Ledger
          </h1>
          <p className="mt-1 text-sm text-graphite-800 dark:text-graphite-400">
            Complete on-chain ledger of all verified micro-payments settled on Celo Mainnet.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchPayments}
          disabled={loading}
          className="inline-flex h-[40px] items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-4 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#20212b] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin text-violet' : 'text-graphite-800 dark:text-graphite-400'}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Ledger Table */}
      <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] font-bold text-graphite-800 dark:text-graphite-300">
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
            <tbody className="divide-y divide-graphite-100 dark:divide-graphite-800">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-graphite-800 dark:text-graphite-400">
                    No payment records logged yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f4f4f6]/50 dark:hover:bg-[#20212b]/50 transition-colors">
                    <td className="px-4 py-3 text-graphite-800 dark:text-graphite-400 whitespace-nowrap">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-ink dark:text-white whitespace-nowrap">
                      {`${p.wallet.slice(0, 8)}...${p.wallet.slice(-6)}`}
                    </td>
                    <td className="px-4 py-3 font-bold font-mono text-ink dark:text-white">
                      ${p.amount}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink dark:text-white">{p.token}</td>
                    <td className="px-4 py-3 font-mono text-graphite-800 dark:text-graphite-400">{p.chain_id}</td>
                    <td className="px-4 py-3 font-mono">
                      <a
                        href={`https://celoscan.io/tx/${p.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-violet font-semibold hover:underline"
                      >
                        <span>{`${p.tx_hash.slice(0, 10)}...${p.tx_hash.slice(-6)}`}</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 capitalize">
                        <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
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
