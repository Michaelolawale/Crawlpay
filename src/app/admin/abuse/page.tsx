'use client';

import React, { useEffect, useState } from 'react';
import { ShieldBan, Trash2, Plus, AlertCircle, ShieldAlert } from 'lucide-react';
import { BlocklistRecord } from '@/services/db';

export default function AdminAbusePage() {
  const [blocklist, setBlocklist] = useState<BlocklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<'wallet' | 'ip' | 'domain'>('domain');
  const [value, setValue] = useState('');
  const [reason, setReason] = useState('');

  const fetchBlocklist = async () => {
    setLoading(true);
    try {
      const authKey = sessionStorage.getItem('crawlpay_admin_auth') || '';
      const res = await fetch('/api/admin/abuse', {
        headers: { Authorization: `Bearer ${authKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBlocklist(data.blocklist || []);
      }
    } catch (e) {
      console.warn('Abuse fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocklist();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    try {
      const authKey = sessionStorage.getItem('crawlpay_admin_auth') || '';
      const res = await fetch('/api/admin/abuse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authKey}`,
        },
        body: JSON.stringify({ type, value: value.trim(), reason }),
      });
      if (res.ok) {
        setValue('');
        setReason('');
        await fetchBlocklist();
      }
    } catch (e) {
      alert('Failed to add blocklist entry.');
    }
  };

  const handleRemove = async (bType: string, bValue: string) => {
    try {
      const authKey = sessionStorage.getItem('crawlpay_admin_auth') || '';
      const res = await fetch(`/api/admin/abuse?type=${encodeURIComponent(bType)}&value=${encodeURIComponent(bValue)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authKey}` },
      });
      if (res.ok) {
        await fetchBlocklist();
      }
    } catch (e) {
      alert('Failed to remove blocklist entry.');
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 max-w-4xl">
      <div className="border-b border-graphite-100 dark:border-graphite-800 pb-6">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-ink dark:text-white sm:text-3xl">
          Abuse Prevention &amp; Blocklist
        </h1>
        <p className="mt-1 text-sm text-graphite-800 dark:text-graphite-400 font-normal">
          Block abusive wallets, prohibited domains, or high-velocity scraping IPs from initiating audits.
        </p>
      </div>

      {/* Add New Rule */}
      <form onSubmit={handleAdd} className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-6 sm:p-8 space-y-5 shadow-sm">
        <h2 className="text-[12px] font-mono font-medium uppercase tracking-wider text-graphite-600 dark:text-graphite-400 flex items-center gap-2">
          <ShieldAlert className="size-4 text-rose-600 dark:text-rose-400" />
          <span>Add New Restriction</span>
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-[12px] font-mono uppercase tracking-wider text-graphite-600 dark:text-graphite-400 mb-1.5 font-medium">Target Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-[32px] border border-graphite-100 dark:border-graphite-700 bg-[#f4f4f6] dark:bg-[#20212b] px-4 py-2.5 text-xs font-semibold text-ink dark:text-white focus:border-ink dark:focus:border-white focus:bg-white dark:focus:bg-[#1a1b22] focus:outline-none focus:ring-1 focus:ring-ink dark:focus:ring-white transition-all"
            >
              <option value="domain">Domain (e.g. spam-site.com)</option>
              <option value="wallet">Wallet Address (0x...)</option>
              <option value="ip">IP Address</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-mono uppercase tracking-wider text-graphite-600 dark:text-graphite-400 mb-1.5 font-medium">Value to Block</label>
            <input
              type="text"
              placeholder="e.g. malicious-site.xyz"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-[32px] border border-graphite-100 dark:border-graphite-700 bg-[#f4f4f6] dark:bg-[#20212b] px-4 py-2.5 text-xs font-mono text-ink dark:text-white focus:border-ink dark:focus:border-white focus:bg-white dark:focus:bg-[#1a1b22] focus:outline-none focus:ring-1 focus:ring-ink dark:focus:ring-white transition-all"
            />
          </div>

          <div>
            <label className="block text-[12px] font-mono uppercase tracking-wider text-graphite-600 dark:text-graphite-400 mb-1.5 font-medium">Reason / Flag</label>
            <input
              type="text"
              placeholder="e.g. Phishing / crawler botnet"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-[32px] border border-graphite-100 dark:border-graphite-700 bg-[#f4f4f6] dark:bg-[#20212b] px-4 py-2.5 text-xs text-ink dark:text-white focus:border-ink dark:focus:border-white focus:bg-white dark:focus:bg-[#1a1b22] focus:outline-none focus:ring-1 focus:ring-ink dark:focus:ring-white transition-all"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={!value.trim()}
            className="inline-flex h-[42px] items-center gap-2 rounded-[48px] bg-rose-600 px-5 text-xs font-semibold text-white hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Add to Blocklist</span>
          </button>
        </div>
      </form>

      {/* Active Blocklist */}
      <div className="rounded-[20px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-graphite-100 dark:border-graphite-800 bg-[#f4f4f6] dark:bg-[#20212b] flex items-center justify-between">
          <span className="text-[12px] font-mono font-medium uppercase tracking-wider text-graphite-800 dark:text-graphite-300">
            Active Blocklist Entries ({blocklist.length})
          </span>
        </div>

        <div className="divide-y divide-graphite-100 dark:divide-graphite-800 text-xs">
          {blocklist.length === 0 ? (
            <div className="p-8 text-center text-graphite-800 dark:text-graphite-400 font-normal">
              No entities currently blocklisted.
            </div>
          ) : (
            blocklist.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 hover:bg-[#fafafb] dark:hover:bg-[#20212b]/50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-[6px] bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 text-[10px] font-mono font-bold text-rose-700 dark:text-rose-400 uppercase border border-rose-200 dark:border-rose-800/80">
                      {item.type}
                    </span>
                    <span className="font-mono font-bold text-ink dark:text-white text-sm">{item.value}</span>
                  </div>
                  <p className="text-[12px] text-graphite-800 dark:text-graphite-400">
                    Reason: {item.reason} · Blocked at {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(item.type, item.value)}
                  className="rounded-[8px] border border-graphite-100 dark:border-graphite-800 bg-white dark:bg-[#16171d] p-2 text-graphite-800 dark:text-graphite-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 transition-colors cursor-pointer"
                  title="Remove restriction"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
