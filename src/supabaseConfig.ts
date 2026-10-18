// These are public Supabase client settings (the anon key is designed to ship
// in browser bundles). Keeping the project defaults here lets Vercel builds
// connect even though .env.local is intentionally not committed.
const configuredUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://ttbkcazsgzqupyjpixyx.supabase.co').trim()

// VITE_SUPABASE_URL should normally be the project root. Accept the REST URL
// format too, since it is often copied from the Supabase API settings page.
export const supabaseUrl = configuredUrl.replace(/\/+$/, '').replace(/\/rest\/v1$/i, '')
export const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0YmtjYXpzZ3pxdXB5anBpeHl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNTkyNDcsImV4cCI6MjEwNzYzNTI0N30.yOBLsv-6qOTIQbAhJOhX89qXd7gUD8-21hOUd4err2A'
).trim()
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabaseConfigMessage = 'Supabase could not be configured. Check the project URL and public key settings.'
