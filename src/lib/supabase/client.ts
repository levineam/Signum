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

export function createClient() {
  if (cachedClient) {
    return cachedClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
  }

  cachedClient = createSupabaseClient<Database>(supabaseUrl, anonKey)
  return cachedClient
}
