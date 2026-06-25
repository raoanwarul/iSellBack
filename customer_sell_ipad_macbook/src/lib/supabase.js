import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://atvpqfpvrzvfakcpgnja.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF0dnBxZnB2cnp2ZmFrY3BnbmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMDU0NzksImV4cCI6MjA5NzY4MTQ3OX0.1STIBYmRXVr3f8kA4SMCDvKQFz2guG_4fT_ByPFxOLA'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
