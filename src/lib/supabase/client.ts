import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from '@supabase/supabase-js'

type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

type GenericTable = {
  Row: Record<string, Json>
  Insert: Record<string, Json>
  Update: Record<string, Json>
  Relationships: never[]
}

interface Database {
  public: {
    Tables: {
      items: GenericTable
      occurrences: GenericTable
      schedules: GenericTable
      [key: string]: GenericTable
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

let cachedClient: SupabaseClient<Database> | null = null
let fallbackClient: SupabaseClient<Database> | null = null

const missingConfigMessage =
  'Supabase client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'

const proxyHandler: ProxyHandler<(...args: unknown[]) => void> = {
  get(_target, prop) {
    if (prop === 'then') {
      return undefined
    }
    return new Proxy(() => {
      throw new Error(missingConfigMessage)
    }, proxyHandler)
  },
  apply() {
    throw new Error(missingConfigMessage)
  },
}

function createFallbackClient(): SupabaseClient<Database> {
  if (!fallbackClient) {
    fallbackClient = new Proxy(() => undefined, proxyHandler) as unknown as SupabaseClient<Database>
  }
  return fallbackClient
}

export function createClient() {
  if (cachedClient) {
    return cachedClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[supabase] Missing configuration, using fallback client for this environment.')
    }
    return createFallbackClient()
  }

  cachedClient = createSupabaseClient<Database>(supabaseUrl, anonKey)
  return cachedClient
}
