import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null
try {
  const url = import.meta.env.VITE_SUPABASE_URL ?? ''
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
  if (url && key) supabase = createClient(url, key)
} catch {
  supabase = null
}

export { supabase }
export function hasSupabase(): boolean {
  return supabase !== null
}
