import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate required environment variables at startup
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Missing Supabase environment variables.\n' +
    'Create a .env file in the project root with:\n' +
    '  VITE_SUPABASE_URL=your_supabase_url\n' +
    '  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key'
  )
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')
