import { createClient } from '@supabase/supabase-js'
import { supabaseAnonKey, supabaseUrl } from './supabaseConfig'
import type { Database } from './database.types'

const supabaseRuntime = globalThis as typeof globalThis & { __ka7laSupabaseClient?: ReturnType<typeof createClient<Database>> }

export const supabase = supabaseRuntime.__ka7laSupabaseClient ?? (supabaseRuntime.__ka7laSupabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
}))
