import { createBrowserClient } from '@supabase/ssr';
import { createClient as createServerClientBase } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// One gate, used everywhere (DRY): true only when keys are configured
export const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const adminReady = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

// ─── Browser client (null in local mode — callers skip DB) ──
export function createClient() {
  if (!supabaseReady) return null;
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ─── Admin client (server API routes only) ─────────────────
export function createAdminClient() {
  if (!adminReady) return null;
  return createServerClientBase(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

