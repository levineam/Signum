import { NextResponse } from 'next/server'
import { hasPublicSupabase } from '@/lib/supabase'
import { hasAdminKey } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0-greenfield',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      platform: 'signum-greenfield',
      env: {
        nextPublicSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        nextPublicSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        supabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
        openaiApiKey: Boolean(process.env.OPENAI_API_KEY),
        ontologyIncrementalEnabled: process.env.ONTOLOGY_INCREMENTAL_ENABLED !== 'false'
      },
      readiness: {
        publicSupabaseConfigured: hasPublicSupabase(),
        adminSupabaseConfigured: hasAdminKey()
      }
    }

    return NextResponse.json(healthCheck)
  } catch {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
