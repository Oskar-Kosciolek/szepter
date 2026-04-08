import { createClient } from '@supabase/supabase-js'
import type { SupabaseClientOptions } from '@supabase/supabase-js'

/**
 * Factory that creates a Supabase client with platform-specific credentials and auth storage.
 *
 * Mobile (Expo) — reads EXPO_PUBLIC_* env vars, uses AsyncStorage:
 *   createSupabaseClient(
 *     {},
 *     { auth: { storage: AsyncStorage, detectSessionInUrl: false, ... } }
 *   )
 *
 * Web (Vite) — Vite exposes env via import.meta.env, so pass explicitly:
 *   createSupabaseClient(
 *     { url: import.meta.env.VITE_SUPABASE_URL, anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY }
 *   )
 *
 * Web (Next.js) — reads NEXT_PUBLIC_* env vars, default cookie storage:
 *   createSupabaseClient()
 */
export function createSupabaseClient(
  credentials?: { url?: string; anonKey?: string },
  options?: SupabaseClientOptions<'public'>
) {
  const url =
    credentials?.url ??
    process.env.EXPO_PUBLIC_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ''
  const anonKey =
    credentials?.anonKey ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    ''
  return createClient(url, anonKey, options)
}
