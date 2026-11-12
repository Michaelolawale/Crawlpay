'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { getSupabaseClient } from '../services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface UseAdminRealtimeOptions {
  onJobChange?: (payload: any) => void;
  onPaymentChange?: (payload: any) => void;
  onReportChange?: (payload: any) => void;
  onConfigChange?: (payload: any) => void;
  onBlocklistChange?: (payload: any) => void;
  onRefresh?: () => void;
  debounceMs?: number;
}

export interface UseAdminRealtimeResult {
  status: RealtimeStatus;
  lastEventTime: Date | null;
  lastEventType: string | null;
  eventCount: number;
  reconnect: () => void;
}

export function useAdminRealtime(options: UseAdminRealtimeOptions = {}): UseAdminRealtimeResult {
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);
  const [lastEventType, setLastEventType] = useState<string | null>(null);
  const [eventCount, setEventCount] = useState<number>(0);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const channelRef = useRef<RealtimeChannel | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debounceMs = options.debounceMs ?? 300;

  const triggerRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = setTimeout(() => {
      if (optionsRef.current.onRefresh) {
        optionsRef.current.onRefresh();
      }
    }, debounceMs);
  }, [debounceMs]);

  const handleIncomingEvent = useCallback(
    (type: string, payload: any) => {
      setLastEventTime(new Date());
      setLastEventType(type);
      setEventCount((prev) => prev + 1);

      if (type.startsWith('job') && optionsRef.current.onJobChange) {
        optionsRef.current.onJobChange(payload);
      }
      if (type.startsWith('payment') && optionsRef.current.onPaymentChange) {
        optionsRef.current.onPaymentChange(payload);
      }
      if (type.startsWith('report') && optionsRef.current.onReportChange) {
        optionsRef.current.onReportChange(payload);
      }
      if (type.startsWith('config') && optionsRef.current.onConfigChange) {
        optionsRef.current.onConfigChange(payload);
      }
      if (type.startsWith('blocklist') && optionsRef.current.onBlocklistChange) {
        optionsRef.current.onBlocklistChange(payload);
      }

      triggerRefresh();
    },
    [triggerRefresh]
  );

  const connectRealtime = useCallback(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus('disconnected');
      return;
    }

    setStatus('connecting');

    try {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      const channelName = 'crawlpay-admin-telemetry';
      const channel = supabase.channel(channelName, {
        config: {
          broadcast: { ack: true },
        },
      });

      // 1. Listen to Postgres Changes on all tables
      channel
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'jobs' },
          (payload) => handleIncomingEvent('jobs_postgres', payload)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'payments' },
          (payload) => handleIncomingEvent('payments_postgres', payload)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'reports' },
          (payload) => handleIncomingEvent('reports_postgres', payload)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'config' },
          (payload) => handleIncomingEvent('config_postgres', payload)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'blocklist' },
          (payload) => handleIncomingEvent('blocklist_postgres', payload)
        );

      // 2. Listen to Application Broadcasts on shared admin telemetry channel
      channel
        .on('broadcast', { event: 'job_change' }, (payload) => handleIncomingEvent('job_broadcast', payload))
        .on('broadcast', { event: 'payment_change' }, (payload) => handleIncomingEvent('payment_broadcast', payload))
        .on('broadcast', { event: 'report_change' }, (payload) => handleIncomingEvent('report_broadcast', payload))
        .on('broadcast', { event: 'config_change' }, (payload) => handleIncomingEvent('config_broadcast', payload))
        .on('broadcast', { event: 'blocklist_change' }, (payload) => handleIncomingEvent('blocklist_broadcast', payload))
        .on('broadcast', { event: 'telemetry_sync' }, (payload) => handleIncomingEvent('telemetry_sync', payload));

      channel.subscribe((subStatus) => {
        if (subStatus === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
          setStatus('error');
        } else if (subStatus === 'CLOSED') {
          setStatus('disconnected');
        }
      });

      channelRef.current = channel;
    } catch (err) {
      console.warn('[useAdminRealtime] Subscription initialization notice:', err);
      setStatus('error');
    }
  }, [handleIncomingEvent]);

  useEffect(() => {
    connectRealtime();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        connectRealtime();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
      if (channelRef.current) {
        const supabase = getSupabaseClient();
        if (supabase) supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [connectRealtime]);

  return {
    status,
    lastEventTime,
    lastEventType,
    eventCount,
    reconnect: connectRealtime,
  };
}

export function RealtimeStatusBadge({
  status,
  lastEventTime,
  eventCount,
  onReconnect,
}: {
  status: RealtimeStatus;
  lastEventTime?: Date | null;
  eventCount?: number;
  onReconnect?: () => void;
}) {
  if (status === 'connected') {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs"
        title={lastEventTime ? `Connected. Last live sync: ${lastEventTime.toLocaleTimeString()}` : 'Connected to Supabase Realtime'}
      >
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <span className="font-mono">Supabase Realtime Live</span>
        {typeof eventCount === 'number' && eventCount > 0 && (
          <span className="rounded-full bg-emerald-500/20 px-1 text-[9px] font-mono">
            {eventCount}
          </span>
        )}
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
        <span className="font-mono">Connecting Realtime...</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onReconnect}
      className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
      title="Supabase Realtime disconnected. Click to reconnect."
    >
      <span className="size-1.5 rounded-full bg-rose-500" />
      <span className="font-mono">Realtime Offline (Reconnect)</span>
    </button>
  );
}

