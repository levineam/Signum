/**
 * Supabase Admin Client (Service Role)
 *
 * Uses service role key to bypass RLS for backend operations.
 * ONLY use in API routes and server-side code.
 * NEVER expose to client.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

let cachedAdmin: SupabaseClient | null = null

export function hasAdminKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && supabaseUrl)
}

export function getSupabaseAdmin(): SupabaseClient {
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRole) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for admin operations')
  }
  if (!cachedAdmin) {
    cachedAdmin = createClient(supabaseUrl, serviceRole, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return cachedAdmin
}

// Backward-compatible export: proxy defers client creation until used
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseAdmin()
    // @ts-expect-error dynamic prop proxy
    return client[prop]
  }
})
