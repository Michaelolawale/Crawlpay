'use client';

import React, { useEffect, useState } from 'react';
import { Sliders, Check, Loader2, Save } from 'lucide-react';
import { DynamicConfig } from '@/services/db';

export default function AdminConfigPage() {
  const [config, setConfig] = useState<DynamicConfig>({
    quick_price_usd: '0.25',
    full_price_usd: '0.50',
    crawl_timeout_ms: 7000,
    max_pages_full: 50,
    rate_limit_per_minute: 20,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    const authKey = sessionStorage.getItem('crawlpay_admin_auth') || 'crawlpay-admin-2025';
    fetch('/api/admin/config', {
      headers: { Authorization: `Bearer ${authKey}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.quick_price_usd) setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedFeedback(false);

    try {
      const authKey = sessionStorage.getItem('crawlpay_admin_auth') || 'crawlpay-admin-2025';
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authKey}`,
        },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        setSavedFeedback(true);
        setTimeout(() => setSavedFeedback(false), 3000);
      }
    } catch (e) {
      alert('Failed to save configuration updates.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 max-w-3xl">
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Dynamic System Configuration
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Modify runtime pricing, timeout limits, max page caps, and rate limits instantly without redeploying code.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 rounded-2xl border border-border bg-card/60 p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Quick Price */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Quick Audit Price ($ USDT)
            </label>
            <input
              type="text"
              value={config.quick_price_usd}
              onChange={(e) => setConfig({ ...config, quick_price_usd: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Full Price */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Full Audit Price ($ USDT)
            </label>
            <input
              type="text"
              value={config.full_price_usd}
              onChange={(e) => setConfig({ ...config, full_price_usd: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Crawl Timeout */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Crawl Timeout (Milliseconds)
            </label>
            <input
              type="number"
              value={config.crawl_timeout_ms}
              onChange={(e) => setConfig({ ...config, crawl_timeout_ms: parseInt(e.target.value, 10) || 5000 })}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Max Pages Cap */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Full Crawl Max Pages Cap
            </label>
            <input
              type="number"
              value={config.max_pages_full}
              onChange={(e) => setConfig({ ...config, max_pages_full: parseInt(e.target.value, 10) || 20 })}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Rate Limits */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Rate Limit (Audits per IP / Minute)
            </label>
            <input
              type="number"
              value={config.rate_limit_per_minute}
              onChange={(e) => setConfig({ ...config, rate_limit_per_minute: parseInt(e.target.value, 10) || 10 })}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-xs font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          {savedFeedback ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Check className="size-4" />
              <span>Configuration applied live!</span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">Changes take effect immediately.</span>
          )}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
