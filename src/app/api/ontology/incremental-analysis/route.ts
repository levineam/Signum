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

// Feature flag - server-side control
const INCREMENTAL_ENABLED =
  process.env.ONTOLOGY_INCREMENTAL_ENABLED !== 'false'

// Rate limiting: max 6 runs per hour per user
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 6

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

    // 2. Parse request
    const body = await request.json()
    const { userId, triggeredBy = 'manual' } = body as {
      userId: string
      triggeredBy?: 'manual' | 'scheduled'
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId required' },
        { status: 400 }
      )
    }

    // 3. Try to acquire lock (prevent concurrent runs)
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

    let notesToAnalyze: Note[] = [] // Declare outside try block for error handler access

    try {
      // 4. Get analysis state
      const state = await getAnalysisState(userId)

      // 5. Rate limiting check (only for manual triggers)
      if (triggeredBy === 'manual' && state?.lastRunSummary) {
        const lastRunTime = state.lastRunSummary.timestamp
          ? new Date(state.lastRunSummary.timestamp).getTime()
          : 0
        const timeSinceLastRun = Date.now() - lastRunTime

        if (timeSinceLastRun < RATE_LIMIT_WINDOW) {
          // Check if user has exceeded rate limit
          // (simplified - in production, track run count in summary)
          const recentRunCount = 1 // TODO: Track properly in state
          if (recentRunCount >= RATE_LIMIT_MAX) {
            await releaseLock(userId, {
              ...state.lastRunSummary,
              status: 'skipped',
              error: 'Rate limit exceeded'
            })

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
      }

      // 6. Get notes for incremental analysis
      const lastAnalyzed = state?.lastAnalyzedAt
        ? new Date(state.lastAnalyzedAt)
        : null

      notesToAnalyze = await getNotesForIncrementalAnalysis(
        userId,
        lastAnalyzed
      )

      // 7. Check if there are notes to analyze
      if (notesToAnalyze.length === 0) {
        const runtime = Date.now() - startTime

        await releaseLock(userId, {
          triggeredBy,
          noteCount: 0,
          runtime,
          status: 'skipped',
          timestamp: new Date().toISOString()
        })

        return NextResponse.json({
          success: true,
          message: 'No new notes to analyze',
          skipped: true,
          runtime
        })
      }

      // 8. Run incremental extraction
      const extraction = await runIncrementalExtraction(userId, notesToAnalyze)

      // 9. Calculate metrics
      const runtime = Date.now() - startTime
      const tokenEstimate = notesToAnalyze.length * 500 // Rough estimate

      // 10. Update analysis state
      const runSummary: AnalysisRunSummary = {
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

      await updateAnalysisState(userId, new Date(), runSummary)

      // 11. Release lock
      await releaseLock(userId, runSummary)

      // 12. Return success
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

      await recordFailedRun(userId, errorMessage, notesToAnalyze?.length || 0)

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
