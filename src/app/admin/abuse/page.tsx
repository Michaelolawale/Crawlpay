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
      const authKey = sessionStorage.getItem('crawlpay_admin_auth') || 'crawlpay-admin-2025';
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
      const authKey = sessionStorage.getItem('crawlpay_admin_auth') || 'crawlpay-admin-2025';
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
      const authKey = sessionStorage.getItem('crawlpay_admin_auth') || 'crawlpay-admin-2025';
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
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Abuse Prevention & Blocklist
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Block abusive wallets, prohibited domains, or high-velocity scraping IPs from initiating audits.
        </p>
      </div>

      {/* Add New Rule */}
      <form onSubmit={handleAdd} className="rounded-2xl border border-border bg-card/60 p-6 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <ShieldAlert className="size-4 text-destructive" />
          <span>Add New Restriction</span>
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] text-muted-foreground mb-1">Target Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="domain">Domain (e.g. spam-site.com)</option>
              <option value="wallet">Wallet Address (0x...)</option>
              <option value="ip">IP Address</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-muted-foreground mb-1">Value to Block</label>
            <input
              type="text"
              placeholder="e.g. malicious-site.xyz"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-[11px] text-muted-foreground mb-1">Reason / Flag</label>
            <input
              type="text"
              placeholder="e.g. Phishing / crawler botnet"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!value.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 transition-colors shadow-sm disabled:opacity-50"
        >
          <Plus className="size-3.5" />
          <span>Add to Blocklist</span>
        </button>
      </form>

      {/* Active Blocklist */}
      <div className="rounded-2xl border border-border bg-card/60 overflow-hidden shadow-sm">
        <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Active Blocklist Entries ({blocklist.length})
          </span>
        </div>

        <div className="divide-y divide-border/60 text-xs">
          {blocklist.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No entities currently blocklisted.
            </div>
          ) : (
            blocklist.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive uppercase">
                      {item.type}
                    </span>
                    <span className="font-mono font-semibold text-foreground">{item.value}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Reason: {item.reason} · Blocked at {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(item.type, item.value)}
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
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
