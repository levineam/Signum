/**
 * API Route: Incremental Ontology Analysis
 * Story 2.4.4: Incremental AI Ontology Analysis
 *
 * This route is called by:
 * 1. Manual "Analyze My Notes" button (triggeredBy: 'manual')
 * 2. Supabase Cron scheduled job (triggeredBy: 'scheduled')
 *
 * Both paths use the same incremental pipeline for parity.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Note } from '@/types/note'
import {
  getAnalysisState,
  updateAnalysisState,
  recordFailedRun,
  tryAcquireLock,
  releaseLock,
  getNotesForIncrementalAnalysis,
  type AnalysisRunSummary
} from '@/lib/ontology/state'
import { runIncrementalExtraction } from '@/lib/ontology/extractor'
import { hasAdminKey } from '@/lib/supabase-admin'

// Feature flag - server-side control
const INCREMENTAL_ENABLED =
  process.env.ONTOLOGY_INCREMENTAL_ENABLED !== 'false'

// Rate limiting: max 6 runs per hour per user
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 6

/**
 * Count recent runs within the rate limit window (SECURITY FIX: Issue #3)
 */
function countRecentRuns(state: { lastRunSummary?: AnalysisRunSummary }): number {
  if (!state.lastRunSummary?.timestamp) return 0

  const lastRunTime = new Date(state.lastRunSummary.timestamp).getTime()
  const timeSinceLastRun = Date.now() - lastRunTime

  // If last run was outside the window, count resets to 0
  if (timeSinceLastRun >= RATE_LIMIT_WINDOW) return 0

  // Get run count from metadata (or default to 1 if not tracked yet)
  const summary = state.lastRunSummary as AnalysisRunSummary & { runCountInWindow?: number }
  return summary.runCountInWindow || 1
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Check feature flag
    if (!INCREMENTAL_ENABLED) {
      return NextResponse.json(
        {
          success: false,
          error: 'Incremental analysis is currently disabled',
          details: 'Feature flag ONTOLOGY_INCREMENTAL_ENABLED is off'
        },
        { status: 503 }
      )
    }

    // 1b. Ensure admin key is present for server-side operations
    if (!hasAdminKey()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration incomplete',
          details: 'Missing SUPABASE_SERVICE_ROLE_KEY'
        },
        { status: 503 }
      )
    }

    // 2. Parse request body first to check trigger type
    const body = await request.json().catch(() => ({}))
    const triggeredBy = (body.triggeredBy as 'manual' | 'scheduled') || 'manual'

    // 3. Dual authentication: Session OR Service Role (P1 FIX)
    let userId: string

    // Check for service-role token first (scheduled runs from Supabase Cron)
    const authHeader = request.headers.get('Authorization')
    const isServiceRoleRequest = authHeader?.startsWith('Bearer ')

    if (isServiceRoleRequest && authHeader) {
      // Scheduled run: Validate service-role token
      const token = authHeader.substring('Bearer '.length)
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (token !== serviceRoleKey) {
        return NextResponse.json(
          { success: false, error: 'Invalid service role token' },
          { status: 401 }
        )
      }

      // For service-role requests, userId MUST be in body
      if (!body.userId) {
        return NextResponse.json(
          { success: false, error: 'userId required for scheduled runs' },
          { status: 400 }
        )
      }

      userId = body.userId
    } else {
      // Manual run: Authenticate via session cookies (SECURITY FIX: Issue #2)
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

      // Use authenticated user ID (ignore body userId for security)
      userId = user.id
    }

    // 4. Get analysis state BEFORE acquiring lock (SECURITY FIX: Issue P1)
    // This preserves runCountInWindow for rate limiting before tryAcquireLock overwrites it
    const state = await getAnalysisState(userId)

    // 5. Rate limiting check (only for manual triggers) - SECURITY FIX: Issue #3
    if (triggeredBy === 'manual') {
      const recentRunCount = state ? countRecentRuns(state) : 0

      if (recentRunCount >= RATE_LIMIT_MAX) {
        // Don't acquire lock for rate-limited requests
        // SECURITY FIX: Preserve runCountInWindow to prevent rate limit bypass
        await recordFailedRun(userId, 'Rate limit exceeded', 0, recentRunCount)

        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded',
            details: `Maximum ${RATE_LIMIT_MAX} analyses per hour`
          },
          { status: 429 }
        )
      }
    }

    // 6. Try to acquire lock (prevent concurrent runs)
    const lockAcquired = await tryAcquireLock(userId)
    if (!lockAcquired) {
      return NextResponse.json(
        {
          success: false,
          error: 'Analysis already in progress',
          details: 'Please wait for the current analysis to complete'
        },
        { status: 409 }
      )
    }

    // 7. Calculate run count for rate limiting
    // SECURITY FIX: Only increment for manual runs to prevent scheduled jobs from blocking users
    // SECURITY FIX: Scheduled runs preserve manual count ONLY if within active window
    // SECURITY FIX: Declare outside try block so error handler can preserve count
    const runCountInWindow = triggeredBy === 'manual'
      ? (state ? countRecentRuns(state) + 1 : 1)
      : (() => {
          // For scheduled runs: only preserve count if last run was within the window
          if (!state?.lastRunSummary?.timestamp) return undefined
          const lastRunTime = new Date(state.lastRunSummary.timestamp).getTime()
          const timeSinceLastRun = Date.now() - lastRunTime
          // If outside window, reset count so cooldown can expire
          if (timeSinceLastRun >= RATE_LIMIT_WINDOW) return undefined
          // Otherwise preserve the count
          return (state.lastRunSummary as AnalysisRunSummary & { runCountInWindow?: number })?.runCountInWindow
        })()

    let notesToAnalyze: Note[] = [] // Declare outside try block for error handler access

    try {
      // 8. Get notes for incremental analysis
      const lastAnalyzed = state?.lastAnalyzedAt
        ? new Date(state.lastAnalyzedAt)
        : null

      notesToAnalyze = await getNotesForIncrementalAnalysis(
        userId,
        lastAnalyzed
      )

      // 9. Check if there are notes to analyze
      if (notesToAnalyze.length === 0) {
        const runtime = Date.now() - startTime

        // SECURITY FIX: Include runCountInWindow for manual runs only (undefined for scheduled)
        const skipSummary: AnalysisRunSummary & { runCountInWindow?: number } = {
          triggeredBy,
          noteCount: 0,
          runtime,
          status: 'skipped',
          timestamp: new Date().toISOString()
        }
        if (runCountInWindow !== undefined) {
          skipSummary.runCountInWindow = runCountInWindow
        }
        await releaseLock(userId, skipSummary)

        return NextResponse.json({
          success: true,
          message: 'No new notes to analyze',
          skipped: true,
          runtime
        })
      }

      // 10. Run incremental extraction
      const extraction = await runIncrementalExtraction(userId, notesToAnalyze)

      // 11. Calculate metrics
      const runtime = Date.now() - startTime
      const tokenEstimate = notesToAnalyze.length * 500 // Rough estimate

      // 12. Determine the lastAnalyzedAt timestamp
      // SECURITY FIX: Use max updated_at from analyzed notes to prevent skipping notes created during analysis
      const maxNoteTimestamp = notesToAnalyze.reduce(
        (max, note) => {
          const noteTime = new Date(note.updatedAt)
          return noteTime > max ? noteTime : max
        },
        new Date(0)
      )

      // 13. Update analysis state with rate limit tracking
      const runSummary: AnalysisRunSummary & { runCountInWindow?: number } = {
        triggeredBy,
        noteCount: notesToAnalyze.length,
        runtime,
        tokenEstimate,
        status: 'success',
        extractedCounts: {
          values: extraction.newValues,
          beliefs: extraction.newBeliefs,
          aims: extraction.newAims
        },
        timestamp: new Date().toISOString()
      }

      // Add run count tracking (manual runs increment, scheduled runs preserve existing count)
      if (runCountInWindow !== undefined) {
        runSummary.runCountInWindow = runCountInWindow
      }

      await updateAnalysisState(userId, maxNoteTimestamp, runSummary)

      // 14. Release lock
      await releaseLock(userId, runSummary)

      // 15. Return success
      return NextResponse.json({
        success: true,
        noteCount: notesToAnalyze.length,
        extraction: {
          newValues: extraction.newValues,
          newBeliefs: extraction.newBeliefs,
          newAims: extraction.newAims
        },
        runtime,
        tokenEstimate
      })
    } catch (extractionError) {
      // Release lock on error
      const errorMessage =
        extractionError instanceof Error
          ? extractionError.message
          : 'Unknown error'

      // SECURITY FIX: Pass runCountInWindow to preserve rate limit counter on failure
      await recordFailedRun(userId, errorMessage, notesToAnalyze?.length || 0, runCountInWindow)

      throw extractionError
    }
  } catch (error) {
    console.error('Incremental analysis failed:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: 'Incremental analysis failed',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check feature flag status (read-only)
 */
export async function GET() {
  return NextResponse.json({
    enabled: INCREMENTAL_ENABLED,
    rateLimitMax: RATE_LIMIT_MAX,
    rateLimitWindow: RATE_LIMIT_WINDOW
  })
}
