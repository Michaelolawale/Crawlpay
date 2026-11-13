'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface DynamicAppConfig {
  quick_price_usd: string;
  full_price_usd: string;
  crawl_timeout_ms: number;
  max_pages_full: number;
  rate_limit_per_minute: number;
}

const DEFAULT_APP_CONFIG: DynamicAppConfig = {
  quick_price_usd: '0.00',
  full_price_usd: '0.50',
  crawl_timeout_ms: 7000,
  max_pages_full: 50,
  rate_limit_per_minute: 20,
};

function formatPriceDisplay(value?: string | number): string {
  if (value === undefined || value === null) return '$0.50';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '$0.50';
  return `$${num.toFixed(2)}`;
}

interface ConfigContextValue {
  config: DynamicAppConfig;
  fullPriceFormatted: string; // e.g. "$0.50" or dynamic "$0.75"
  fullPriceRaw: string; // e.g. "0.50"
  quickPriceFormatted: string; // e.g. "Free" or "$0.00"
  quickPriceRaw: string; // e.g. "0.00"
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue>({
  config: DEFAULT_APP_CONFIG,
  fullPriceFormatted: '$0.50',
  fullPriceRaw: '0.50',
  quickPriceFormatted: 'Free',
  quickPriceRaw: '0.00',
  refreshConfig: async () => {},
});

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  // Always initialize with DEFAULT_APP_CONFIG to ensure SSR and initial client hydration match identically
  const [config, setConfig] = useState<DynamicAppConfig>(DEFAULT_APP_CONFIG);

  const refreshConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/config', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.full_price_usd) {
          setConfig((prev) => ({
            ...prev,
            quick_price_usd: data.quick_price_usd || prev.quick_price_usd,
            full_price_usd: data.full_price_usd || prev.full_price_usd,
            crawl_timeout_ms: Number(data.crawl_timeout_ms) || prev.crawl_timeout_ms,
            max_pages_full: Number(data.max_pages_full) || prev.max_pages_full,
            rate_limit_per_minute: Number(data.rate_limit_per_minute) || prev.rate_limit_per_minute,
          }));

          try {
            localStorage.setItem('crawlpay_dynamic_config', JSON.stringify(data));
          } catch {}
        }
      }
    } catch {
      // Keep existing config on network failure
    }
  }, []);

  useEffect(() => {
    // 1. Post-hydration: load cached config from localStorage if available
    try {
      const cached = localStorage.getItem('crawlpay_dynamic_config');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.full_price_usd) {
          setConfig((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {}

    // 2. Fetch fresh live config from backend
    refreshConfig();

    // 3. Re-validate when user returns to the tab/window
    const onFocus = () => {
      refreshConfig();
    };
    window.addEventListener('focus', onFocus);

    // 4. Polling fallback every 15 seconds
    const interval = setInterval(refreshConfig, 15000);

    // 5. Connect to Supabase Realtime dynamically in browser
    let removeChannelFn: (() => void) | null = null;
    import('@/services/supabase')
      .then(({ getSupabaseClient }) => {
        const supabase = getSupabaseClient();
        if (supabase) {
          const channel = supabase.channel('crawlpay-config-live', {
            config: { broadcast: { ack: false } },
          });

          // Application broadcast event from admin updates
          channel.on('broadcast', { event: 'config_change' }, (payload: any) => {
            if (payload?.payload?.config) {
              setConfig((prev) => ({ ...prev, ...payload.payload.config }));
            }
            refreshConfig();
          });

          // Direct postgres changes on the config table
          channel.on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'config' },
            () => {
              refreshConfig();
            }
          );

          channel.subscribe();
          removeChannelFn = () => {
            try {
              supabase.removeChannel(channel);
            } catch {}
          };
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
      if (removeChannelFn) {
        removeChannelFn();
      }
    };
  }, [refreshConfig]);

  const value = useMemo<ConfigContextValue>(() => {
    const rawFull = config.full_price_usd || '0.50';
    const rawQuick = config.quick_price_usd || '0.00';
    const isFree = rawQuick === '0.00' || rawQuick === '0' || rawQuick === '0.0';

    return {
      config,
      fullPriceFormatted: formatPriceDisplay(rawFull),
      fullPriceRaw: rawFull,
      quickPriceFormatted: isFree ? 'Free' : formatPriceDisplay(rawQuick),
      quickPriceRaw: rawQuick,
      refreshConfig,
    };
  }, [config, refreshConfig]);

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig(): ConfigContextValue {
  return useContext(ConfigContext);
}

