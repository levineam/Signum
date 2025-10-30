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

  // Clean up URL (remove trailing slash if present)
  const cleanUrl = supabaseUrl.replace(/\/$/, '')
  
  // Validate URL format
  try {
    const url = new URL(cleanUrl)
    if (!url.protocol.startsWith('https')) {
      console.warn('Supabase URL should use https:// protocol')
    }
  } catch (error) {
    console.error('Invalid Supabase URL format:', cleanUrl)
    throw new Error(`Invalid Supabase URL format: ${cleanUrl}`)
  }

  console.log('Initializing Supabase client with URL:', cleanUrl.substring(0, 30) + '...')

  _supabase = createClient(cleanUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
          },
        }).catch((error) => {
          console.error('Supabase fetch error:', {
            url,
            error: error.message,
            supabaseUrl: cleanUrl,
          })
          throw error
        })
      },
    },
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
