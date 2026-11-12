'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Search,
  Copy,
  Check,
  Fuel,
  ArrowDownLeft,
  FlaskConical,
  ShieldCheck,
} from 'lucide-react';
import { getAdminToken } from '../../../utils/adminClient';
import { useAdminRealtime, RealtimeStatusBadge } from '../../../utils/useAdminRealtime';

interface EnrichedPayment {
  id: string;
  wallet: string;
  amount: string;
  token: string;
  chain_id: number;
  tx_hash: string;
  status: string;
  is_test?: boolean;
  type?: string;
  created_at: string;
  isCustomerPayment: boolean;
  isGasRefuel: boolean;
  tokenFormatted: string;
  amountFormatted: string;
  usdValueFormatted: string;
  maskedWallet: string;
  maskedTx: string;
  celoscanUrl: string;
  job?: {
    id: string;
    url: string;
    depth: 'quick' | 'full';
    status: 'queued' | 'running' | 'done' | 'failed';
    report_id?: string;
  } | null;
}

interface PaymentSummary {
  totalRevenueUsd: string;
  totalCustomerPayments: number;
  totalGasRefuelsCelo: string;
  totalGasRefuelsCount: number;
  totalTransactions: number;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<EnrichedPayment[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalRevenueUsd: '0.00',
    totalCustomerPayments: 0,
    totalGasRefuelsCelo: '0.0000',
    totalGasRefuelsCount: 0,
    totalTransactions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [includeTest, setIncludeTest] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'customer' | 'gas' | 'test'>('all');

  const fetchPayments = useCallback(async (isManual: boolean = false) => {
    if (isManual) setRefreshing(true);
    try {
      const authKey = getAdminToken();
      const url = `/api/admin/payments?includeTest=${includeTest ? 'true' : 'false'}`;
      const res = await fetch(url, {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${authKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        if (data.summary) {
          setSummary(data.summary);
        }
        setLastSyncTime(new Date());
      }
    } catch (e) {
      console.warn('Payments fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [includeTest]);

  // Supabase Realtime live subscriptions for payments
  const realtime = useAdminRealtime({
    onPaymentChange: () => {
      fetchPayments(false);
    },
    onRefresh: () => {
      fetchPayments(false);
    },
  });

  useEffect(() => {
    fetchPayments();
    // 30s background heartbeat as fallback to Supabase Realtime WebSocket
    const interval = setInterval(() => fetchPayments(), 30000);
    return () => clearInterval(interval);
  }, [fetchPayments]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Search
      if (searchFilter) {
        const query = searchFilter.toLowerCase();
        const matchesWallet = (p.wallet || '').toLowerCase().includes(query);
        const matchesTx = (p.tx_hash || '').toLowerCase().includes(query);
        const matchesUrl = (p.job?.url || '').toLowerCase().includes(query);
        const matchesId = (p.id || '').toLowerCase().includes(query);
        if (!matchesWallet && !matchesTx && !matchesUrl && !matchesId) return false;
      }

      // Filter tabs
      if (typeFilter === 'customer') return p.isCustomerPayment;
      if (typeFilter === 'gas') return p.isGasRefuel;
      if (typeFilter === 'test') return p.is_test;

      return true;
    });
  }, [payments, searchFilter, typeFilter]);

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-graphite-100 dark:border-graphite-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white sm:text-3xl">
              Payment & Settlement Ledger
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Celo Mainnet
            </span>
          </div>
          <p className="mt-1 text-sm text-graphite-800 dark:text-graphite-400">
            Strict single-source-of-truth ledger separating customer audit revenue from operational gas refuels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Production vs Sandbox Toggle */}
          <div className="flex items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setIncludeTest(false)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                !includeTest
                  ? 'bg-ink text-white dark:bg-white dark:text-ink shadow-xs'
                  : 'text-graphite-800 dark:text-graphite-400 hover:text-ink dark:hover:text-white'
              }`}
            >
              Production Only
            </button>
            <button
              type="button"
              onClick={() => setIncludeTest(true)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                includeTest
                  ? 'bg-violet text-white shadow-xs'
                  : 'text-graphite-800 dark:text-graphite-400 hover:text-ink dark:hover:text-white'
              }`}
            >
              <FlaskConical className="size-3" />
              <span>Include Sandbox</span>
            </button>
          </div>

          <RealtimeStatusBadge
            status={realtime.status}
            lastEventTime={realtime.lastEventTime}
            eventCount={realtime.eventCount}
            onReconnect={realtime.reconnect}
          />

          {lastSyncTime && (
            <span className="hidden sm:inline-block text-[11px] font-mono text-graphite-800 dark:text-graphite-400">
              Updated {lastSyncTime.toLocaleTimeString()}
            </span>
          )}

          <button
            type="button"
            onClick={() => fetchPayments(true)}
            disabled={loading || refreshing}
            className="inline-flex h-[38px] items-center gap-1.5 rounded-[48px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-4 text-xs font-semibold text-ink dark:text-white hover:bg-graphite-100/50 dark:hover:bg-[#20212b] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${refreshing || loading ? 'animate-spin text-violet' : 'text-graphite-800 dark:text-graphite-400'}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Customer Revenue (USD₮) */}
        <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-sm">
          <div className="flex items-center justify-between text-graphite-800 dark:text-graphite-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Customer Revenue</span>
            <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white">
              ${summary.totalRevenueUsd}
            </span>
            <span className="text-xs font-bold text-graphite-400 font-mono">USD₮</span>
          </div>
          <p className="mt-1 text-[11px] text-graphite-800 dark:text-graphite-400">
            {summary.totalCustomerPayments} verified customer audit payment{summary.totalCustomerPayments === 1 ? '' : 's'}
          </p>
        </div>

        {/* Customer Payments Count */}
        <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-sm">
          <div className="flex items-center justify-between text-graphite-800 dark:text-graphite-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Audit Micro-Payments</span>
            <div className="rounded-full bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <ArrowDownLeft className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white">
              {summary.totalCustomerPayments}
            </span>
            <span className="text-xs font-medium text-graphite-400">transactions</span>
          </div>
          <p className="mt-1 text-[11px] text-graphite-800 dark:text-graphite-400">
            Strictly $0.50 USD₮ (ERC-20, 6 decimals)
          </p>
        </div>

        {/* Operational Gas Inflow (CELO) */}
        <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-sm">
          <div className="flex items-center justify-between text-graphite-800 dark:text-graphite-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Operator Gas Refuels</span>
            <div className="rounded-full bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
              <Fuel className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white font-mono">
              {summary.totalGasRefuelsCelo}
            </span>
            <span className="text-xs font-bold text-graphite-400 font-mono">CELO</span>
          </div>
          <p className="mt-1 text-[11px] text-graphite-800 dark:text-graphite-400">
            Operational gas funding (excluded from revenue)
          </p>
        </div>

        {/* Total Ledger Entries */}
        <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-5 shadow-sm">
          <div className="flex items-center justify-between text-graphite-800 dark:text-graphite-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total On-Chain Events</span>
            <div className="rounded-full bg-violet/10 p-2 text-violet">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold tracking-tight text-ink dark:text-white">
              {summary.totalTransactions}
            </span>
            <span className="text-xs font-medium text-graphite-400">records</span>
          </div>
          <p className="mt-1 text-[11px] text-graphite-800 dark:text-graphite-400">
            100% verified on Celo Mainnet
          </p>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setTypeFilter('all')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              typeFilter === 'all'
                ? 'bg-ink text-white dark:bg-white dark:text-ink'
                : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-800 dark:text-graphite-300 hover:bg-graphite-200 dark:hover:bg-graphite-700'
            }`}
          >
            All Entries ({payments.length})
          </button>

          <button
            onClick={() => setTypeFilter('customer')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              typeFilter === 'customer'
                ? 'bg-emerald-600 text-white'
                : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-800 dark:text-graphite-300 hover:bg-graphite-200 dark:hover:bg-graphite-700'
            }`}
          >
            <CreditCard className="size-3" />
            <span>Customer Payments ({payments.filter((p) => p.isCustomerPayment).length})</span>
          </button>

          <button
            onClick={() => setTypeFilter('gas')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              typeFilter === 'gas'
                ? 'bg-amber-600 text-white'
                : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-800 dark:text-graphite-300 hover:bg-graphite-200 dark:hover:bg-graphite-700'
            }`}
          >
            <Fuel className="size-3" />
            <span>Gas Refuels ({payments.filter((p) => p.isGasRefuel).length})</span>
          </button>

          {payments.some((p) => p.is_test) && (
            <button
              onClick={() => setTypeFilter('test')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                typeFilter === 'test'
                  ? 'bg-violet text-white'
                  : 'bg-graphite-100 dark:bg-graphite-800 text-graphite-800 dark:text-graphite-300 hover:bg-graphite-200 dark:hover:bg-graphite-700'
              }`}
            >
              <FlaskConical className="size-3" />
              <span>Sandbox ({payments.filter((p) => p.is_test).length})</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="size-3.5 text-graphite-400" />
          </div>
          <input
            type="text"
            placeholder="Search wallet, tx hash, domain..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full rounded-[32px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] py-1.5 pl-9 pr-3 text-xs text-ink dark:text-white placeholder:text-graphite-400 focus:outline-none focus:border-violet"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead className="border-b border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] font-bold text-graphite-800 dark:text-graphite-300">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Payer / Source</th>
                <th className="px-4 py-3">Audit Target</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Tx Hash</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Associated Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-graphite-100 dark:divide-graphite-800">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-graphite-800 dark:text-graphite-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CreditCard className="size-6 text-graphite-400 stroke-1" />
                      <p className="font-semibold text-ink dark:text-white">No payment records match filter.</p>
                      <p className="text-[11px] max-w-sm">
                        {searchFilter
                          ? 'Try clearing your search query.'
                          : includeTest
                          ? 'No payments found even with sandbox included.'
                          : 'Toggle "Include Sandbox" above to view test ledger entries, or perform a live deep crawl.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const dateObj = new Date(p.created_at);
                  const isTest = Boolean(p.is_test);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#f4f4f6]/50 dark:hover:bg-[#20212b]/50 transition-colors"
                    >
                      {/* Date */}
                      <td className="px-4 py-3 text-graphite-800 dark:text-graphite-400 whitespace-nowrap">
                        <div className="font-medium text-ink dark:text-white">
                          {dateObj.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <span className="text-[10px] text-graphite-400 font-mono">
                          {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Category Badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {p.isCustomerPayment ? (
                          <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            <CreditCard className="size-2.5" />
                            <span>Customer Payment</span>
                          </div>
                        ) : p.isGasRefuel ? (
                          <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                            <Fuel className="size-2.5" />
                            <span>Gas Refuel</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 rounded-full bg-graphite-100 dark:bg-graphite-800 px-2 py-0.5 text-[10px] font-bold text-graphite-800 dark:text-graphite-300">
                            <span>System Tx</span>
                          </div>
                        )}
                        {isTest && (
                          <span className="ml-1 rounded-full bg-violet/10 text-violet px-1.5 py-0.2 text-[9px] font-bold uppercase">
                            Sandbox
                          </span>
                        )}
                      </td>

                      {/* Payer Wallet */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink dark:text-white">
                          <span>{p.maskedWallet}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.wallet, `wallet-${p.id}`)}
                            className="p-1 hover:text-violet transition-colors cursor-pointer text-graphite-400"
                            title="Copy full address"
                          >
                            {copiedKey === `wallet-${p.id}` ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Audit Target */}
                      <td className="px-4 py-3 max-w-[200px]">
                        {p.job?.url ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={p.job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono font-medium text-ink dark:text-white hover:text-violet hover:underline truncate inline-flex items-center gap-1"
                            >
                              <span>{p.job.url.replace(/^https?:\/\//, '')}</span>
                              <ExternalLink className="size-2.5 opacity-60 shrink-0" />
                            </a>
                            <span className="text-[9px] uppercase font-bold text-graphite-400 font-mono">
                              ({p.job.depth})
                            </span>
                          </div>
                        ) : (
                          <span className="text-graphite-400 text-xs italic">
                            {p.isGasRefuel ? 'Gas Treasury Funding' : 'Unassigned'}
                          </span>
                        )}
                      </td>

                      {/* Amount & Token */}
                      <td className="px-4 py-3 font-mono whitespace-nowrap">
                        <div className="font-bold text-ink dark:text-white">
                          {p.amountFormatted}
                        </div>
                        <div className="text-[10px] text-graphite-400">
                          {p.tokenFormatted}
                        </div>
                      </td>

                      {/* Tx Hash */}
                      <td className="px-4 py-3 font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={p.celoscanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-violet font-semibold hover:underline"
                            title="View on Celoscan"
                          >
                            <span>{p.maskedTx}</span>
                            <ExternalLink className="size-2.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.tx_hash, `tx-${p.id}`)}
                            className="p-1 hover:text-violet transition-colors cursor-pointer text-graphite-400"
                            title="Copy full transaction hash"
                          >
                            {copiedKey === `tx-${p.id}` ? (
                              <Check className="size-3 text-emerald-500" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 capitalize">
                          <CheckCircle2 className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{p.status}</span>
                        </span>
                      </td>

                      {/* Associated Audit */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {p.job?.report_id ? (
                          <Link
                            href={`/admin/reports/${p.job.report_id}?from=payments`}
                            className="inline-flex items-center gap-1 rounded-[32px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] px-2.5 py-1 text-[11px] font-semibold text-ink dark:text-white hover:text-violet transition-colors shadow-sm"
                          >
                            <FileText className="size-3 text-emerald-600 dark:text-emerald-400" />
                            <span>View Report</span>
                          </Link>
                        ) : p.job?.status === 'running' ? (
                          <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 text-[11px] font-semibold animate-pulse">
                            <RefreshCw className="size-3 animate-spin" />
                            <span>Crawling</span>
                          </span>
                        ) : p.job ? (
                          <Link
                            href="/admin/jobs"
                            className="inline-flex items-center gap-1 text-violet hover:underline text-[11px] font-medium"
                          >
                            <span>Manage Job →</span>
                          </Link>
                        ) : (
                          <span className="text-graphite-400 text-[11px]">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
