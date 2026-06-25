import { createClient } from '@supabase/supabase-js'

// Environment variables with fallback for local development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zdyzqbufilsfesdusfci.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkeXpxYnVmaWxzZmVzZHVzZmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NzM5MTgsImV4cCI6MjA5MTQ0OTkxOH0.cNCLGkGGl1v2H9eCXLd5owNP8d8nMZI0BUXwg0MmO3Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
