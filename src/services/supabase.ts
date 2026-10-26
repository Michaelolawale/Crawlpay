import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedAdminClient: SupabaseClient | null = null;
let cachedAnonClient: SupabaseClient | null = null;

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
    });
    return cachedAnonClient;
  } catch (err) {
    console.warn('[Supabase] Failed to initialize public client:', err);
    return null;
  }
}
