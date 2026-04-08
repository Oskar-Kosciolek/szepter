import { createSupabaseClient } from '@shared/lib/supabaseClient'

export const supabase = createSupabaseClient({
  url: import.meta.env.VITE_SUPABASE_URL as string,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
})
