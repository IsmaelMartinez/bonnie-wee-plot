import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}

function getAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
}

/**
 * Check whether Supabase env vars are configured.
 * Returns false when running without cloud features.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(getUrl() && getAnonKey())
}

/**
 * Anonymous Supabase client — no auth context.
 */
export function createAnonClient(): SupabaseClient {
  return createClient(getUrl(), getAnonKey())
}

/**
 * Authenticated Supabase client — uses Clerk JWT for RLS.
 * The token should come from Clerk's getToken({ template: 'supabase' }).
 */
export function createAuthClient(token: string): SupabaseClient {
  return createClient(getUrl(), getAnonKey(), {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  })
}
