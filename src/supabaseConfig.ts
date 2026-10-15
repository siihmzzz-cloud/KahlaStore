export const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
export const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabaseConfigMessage = 'Admin services are not configured for this deployment. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel project settings, then redeploy.'
