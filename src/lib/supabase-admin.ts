/**
 * Supabase Admin Client (Service Role)
 *
 * Uses service role key to bypass RLS for backend operations.
 * ONLY use in API routes and server-side code.
 * NEVER expose to client.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabaseAdmin: SupabaseClient | null = null

/**
 * Check if admin key is available
 */
export function hasAdminKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL)
}

/**
 * Get Supabase admin client (lazy initialization)
 * This prevents build-time errors when SUPABASE_SERVICE_ROLE_KEY is not set
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) {
    return _supabaseAdmin
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required')
  }

  if (!supabaseServiceRole) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for admin operations')
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return _supabaseAdmin
}


// Legacy export for backward compatibility
// @deprecated Use getSupabaseAdmin() instead
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (client as any)[prop]
    // Bind methods to preserve 'this' context
    return typeof value === 'function' ? value.bind(client) : value
  }
})
