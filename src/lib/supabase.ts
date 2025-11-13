import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

/**
 * Check if public Supabase credentials are available
 */
export function hasPublicSupabase(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

/**
 * Get Supabase client (lazy initialization)
 * This prevents build-time errors when env vars are not set
 */
function getSupabase(): SupabaseClient {
  if (_supabase) {
    return _supabase
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  _supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })

  return _supabase
}

// Export a Proxy that lazily initializes the client
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (client as any)[prop]
    // Bind methods to preserve 'this' context
    return typeof value === 'function' ? value.bind(client) : value
  }
})

export { scheduleQueries } from './supabase/schedules'
export { itemQueries } from './supabase/items'
export { occurrenceQueries } from './supabase/occurrences'

export type {
  Schedule,
  Item,
  Occurrence,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  CreateItemRequest,
  UpdateItemRequest,
  CreateOccurrenceRequest,
  UpdateOccurrenceRequest,
  ItemsQuery,
  OccurrencesQuery
} from '@/types/temporal'
