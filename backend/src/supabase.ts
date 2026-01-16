import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Prefer the service role key on the server when available (has storage insert permissions).
const serverKey = supabaseServiceRoleKey || supabaseAnonKey

export const supabase = createClient(supabaseUrl, serverKey)