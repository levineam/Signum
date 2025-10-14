/**
 * Supabase Admin Client (Service Role)
 *
 * Uses service role key to bypass RLS for backend operations.
 * ONLY use in API routes and server-side code.
 * NEVER expose to client.
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceRole) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for admin operations')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
