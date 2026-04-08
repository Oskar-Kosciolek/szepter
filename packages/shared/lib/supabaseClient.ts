import { createClient } from '@supabase/supabase-js'
import type { SupabaseClientOptions } from '@supabase/supabase-js'

// Supports both Expo (EXPO_PUBLIC_*) and Next.js (NEXT_PUBLIC_*) env prefixes.
const supabaseUrl =
  (process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL) as string
const supabaseAnonKey =
  (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string

/**
 * Factory that creates a Supabase client with platform-specific auth storage.
 *
 * Mobile (Expo):
 *   createSupabaseClient({ auth: { storage: AsyncStorage, detectSessionInUrl: false, ... } })
 *
 * Web (Next.js):
 *   createSupabaseClient()  — uses default cookie-based storage
 */
export function createSupabaseClient(options?: SupabaseClientOptions<'public'>) {
  return createClient(supabaseUrl, supabaseAnonKey, options)
}
