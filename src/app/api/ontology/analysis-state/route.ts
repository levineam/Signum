/**
 * API Route: Get Analysis State
 * Story 2.4.4: Incremental AI Ontology Analysis
 *
 * Safely fetches analysis state for authenticated user.
 * Does NOT expose admin client to browser.
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getAnalysisState } from '@/lib/ontology/state'
import { hasAdminKey } from '@/lib/supabase-admin'
import logger from '@/utils/logger'

const isTestMode = ['1', 'true'].includes(process.env.E2E_TEST_MODE ?? '')

export async function GET() {
  try {
    if (isTestMode) {
      const now = new Date().toISOString()
      return NextResponse.json({
        success: true,
        state: {
          lastAnalyzedAt: now,
          lastRunSummary: {
            timestamp: now,
          },
        },
      })
    }
    if (!hasAdminKey()) {
      return NextResponse.json(
        { success: false, error: 'Server configuration incomplete: missing SUPABASE_SERVICE_ROLE_KEY' },
        { status: 503 }
      )
    }
    // 1. Get authenticated user from session
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Fetch state using admin client (server-side only)
    const state = await getAnalysisState(user.id)

    if (!state) {
      return NextResponse.json({
        success: true,
        state: null,
      })
    }

    // 3. Return only necessary info (don't expose full state)
    return NextResponse.json({
      success: true,
      state: {
        lastAnalyzedAt: state.lastAnalyzedAt,
        lastRunSummary: state.lastRunSummary,
      },
    })
  } catch (error) {
    logger.error({ route: 'analysis-state' }, 'Failed to get analysis state:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch analysis state',
      },
      { status: 500 }
    )
  }
}
