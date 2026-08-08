import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qrstkwlakctszamkvsgh.supabase.co'
const supabaseAnonKey = 'sb_publishable_zqppgbF5RgedwkOOxXaJKg_9abQjvdP'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false // Essential for Electron since it uses file:// protocol instead of Web URLs
  }
})
