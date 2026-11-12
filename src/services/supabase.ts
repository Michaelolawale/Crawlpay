import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

let cachedAdminClient: SupabaseClient | null = null;
let cachedAnonClient: SupabaseClient | null = null;
let serverBroadcastChannel: RealtimeChannel | null = null;
let serverBroadcastPromise: Promise<RealtimeChannel | null> | null = null;

export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
}

export function getSupabaseAnonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
}

export function getSupabaseServiceRoleKey(): string | undefined {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    getSupabaseAnonKey()
  );
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseServiceRoleKey() || getSupabaseAnonKey();
  return Boolean(url && key && url.startsWith('http') && !url.includes('placeholder'));
}

/**
 * Returns a server-side Supabase client with elevated privileges
 * (Service Role Key preferred) for safe backend database operations.
 */
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (cachedAdminClient) return cachedAdminClient;

  const url = getSupabaseUrl();
  const serviceKey = getSupabaseServiceRoleKey();

  if (!url || !serviceKey || !isSupabaseConfigured()) {
    return null;
  }

  try {
    cachedAdminClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });
    return cachedAdminClient;
  } catch (err) {
    console.warn('[Supabase] Failed to initialize admin client:', err);
    return null;
  }
}

/**
 * Returns a public anon client suitable for client or public queries.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (cachedAnonClient) return cachedAnonClient;

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey || !isSupabaseConfigured()) {
    return null;
  }

  try {
    cachedAnonClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });
    return cachedAnonClient;
  } catch (err) {
    console.warn('[Supabase] Failed to initialize public client:', err);
    return null;
  }
}

/**
 * Initializes and retrieves a persistent subscribed server-side Realtime broadcast channel.
 */
async function getServerBroadcastChannel(): Promise<RealtimeChannel | null> {
  if (serverBroadcastChannel) return serverBroadcastChannel;
  if (serverBroadcastPromise) return serverBroadcastPromise;

  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  serverBroadcastPromise = new Promise((resolve) => {
    try {
      const channel = admin.channel('crawlpay-admin-telemetry', {
        config: { broadcast: { ack: true } },
      });

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          serverBroadcastChannel = channel;
          resolve(channel);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          serverBroadcastPromise = null;
          resolve(null);
        }
      });
    } catch (e) {
      serverBroadcastPromise = null;
      resolve(null);
    }
  });

  return serverBroadcastPromise;
}

/**
 * Broadcasts an instant Realtime message across the WebSocket cluster to all active admin clients.
 */
export async function broadcastAdminEvent(
  event: 'job_change' | 'payment_change' | 'report_change' | 'config_change' | 'blocklist_change' | 'telemetry_sync',
  payload?: any
): Promise<void> {
  try {
    const ch = await getServerBroadcastChannel();
    if (ch) {
      await ch.send({
        type: 'broadcast',
        event,
        payload: {
          ...payload,
          timestamp: Date.now(),
        },
      });
    }
  } catch (err) {
    // Non-blocking real-time broadcast warning
    console.warn('[Supabase Realtime] Broadcast notice:', err);
  }
}

