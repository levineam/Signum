/**
 * Ontology Analysis State Management
 * Story 2.4.4: Incremental AI Ontology Analysis
 *
 * Handles tracking when users' ontologies were last analyzed
 * and provides helpers for incremental analysis workflows.
 *
 * Uses admin client to bypass RLS for state management operations.
 */

import { supabaseAdmin } from '@/lib/supabase-admin'
import { Note } from '@/types/note'

// ============================================================================
// Types
// ============================================================================

export interface AnalysisState {
  userId: string
  lastAnalyzedAt: string | null
  lastRunSummary: AnalysisRunSummary
  createdAt: string
  updatedAt: string
}

export interface AnalysisRunSummary {
  triggeredBy?: 'manual' | 'scheduled'
  noteCount?: number
  runtime?: number // milliseconds
  tokenEstimate?: number
  status?: 'success' | 'failure' | 'skipped'
  error?: string
  extractedCounts?: {
    values: number
    beliefs: number
    aims: number
  }
  timestamp?: string
}

// ============================================================================
// State Management Functions
// ============================================================================

/**
 * Get analysis state for a user (creates if doesn't exist)
 */
export async function getAnalysisState(
  userId: string
): Promise<AnalysisState | null> {
  const { data, error } = await supabaseAdmin.rpc('get_or_create_analysis_state', {
    p_user_id: userId
  })

  if (error) {
    console.error('Failed to get analysis state:', error)
    throw error
  }

  if (!data || data.length === 0) {
    return null
  }

  const record = data[0]
  return {
    userId: record.user_id,
    lastAnalyzedAt: record.last_analyzed_at,
    lastRunSummary: record.last_run_summary || {},
    createdAt: record.created_at,
    updatedAt: record.updated_at
  }
}

/**
 * Update analysis state after successful run
 */
export async function updateAnalysisState(
  userId: string,
  lastAnalyzedAt: Date,
  runSummary: AnalysisRunSummary
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('ontology_analysis_state')
    .upsert(
      {
        user_id: userId,
        last_analyzed_at: lastAnalyzedAt.toISOString(),
        last_run_summary: runSummary
      },
      {
        onConflict: 'user_id'
      }
    )

  if (error) {
    console.error('Failed to update analysis state:', error)
    throw error
  }
}

/**
 * Record failed analysis run (doesn't update lastAnalyzedAt)
 *
 * IMPORTANT: This function ONLY updates last_run_summary, NOT last_analyzed_at.
 * This ensures failed runs (rate limits, errors) don't mark notes as analyzed.
 */
export async function recordFailedRun(
  userId: string,
  error: string,
  noteCount: number
): Promise<void> {
  // Get current state to preserve last_analyzed_at
  const currentState = await getAnalysisState(userId)

  // Only update the summary, explicitly preserving last_analyzed_at
  const { error: updateError } = await supabaseAdmin
    .from('ontology_analysis_state')
    .upsert(
      {
        user_id: userId,
        last_analyzed_at: currentState?.lastAnalyzedAt || null, // Preserve existing timestamp
        last_run_summary: {
          triggeredBy: 'manual',
          noteCount,
          status: 'failure',
          error,
          timestamp: new Date().toISOString()
        }
      },
      {
        onConflict: 'user_id'
      }
    )

  if (updateError) {
    console.error('Failed to record failed run:', updateError)
    throw updateError
  }
}

/**
 * Reset analysis state for a user (debug/admin function)
 */
export async function resetAnalysisState(userId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('ontology_analysis_state')
    .update({
      last_analyzed_at: null,
      last_run_summary: {}
    })
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to reset analysis state:', error)
    throw error
  }
}

/**
 * Get notes that need to be analyzed (new or updated since last analysis)
 */
export async function getNotesForIncrementalAnalysis(
  userId: string,
  lastAnalyzedAt: Date | null
): Promise<Note[]> {
  const { data, error } = await supabaseAdmin.rpc(
    'get_notes_for_incremental_analysis',
    {
      p_user_id: userId,
      p_last_analyzed_at: lastAnalyzedAt?.toISOString() || null
    }
  )

  if (error) {
    console.error('Failed to get notes for incremental analysis:', error)
    throw error
  }

  return data || []
}

/**
 * Check if user needs analysis (has new notes since last run)
 */
export async function needsAnalysis(userId: string): Promise<boolean> {
  const state = await getAnalysisState(userId)

  if (!state || !state.lastAnalyzedAt) {
    // Never analyzed - check if user has any notes
    const notes = await getNotesForIncrementalAnalysis(userId, null)
    return notes.length >= 5 // Minimum threshold
  }

  // Check if there are new notes since last analysis
  const lastAnalyzed = new Date(state.lastAnalyzedAt)
  const newNotes = await getNotesForIncrementalAnalysis(userId, lastAnalyzed)

  return newNotes.length > 0
}

// ============================================================================
// Concurrency Control
// ============================================================================

/**
 * Try to acquire analysis lock for a user
 * Returns true if lock acquired, false if already locked
 */
export async function tryAcquireLock(userId: string): Promise<boolean> {
  // Check if a recent analysis is in progress (within last 10 minutes)
  const tenMinutesAgo = new Date()
  tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10)

  const { data: state } = await supabaseAdmin
    .from('ontology_analysis_state')
    .select('last_run_summary, updated_at')
    .eq('user_id', userId)
    .single()

  if (state) {
    const lastUpdate = new Date(state.updated_at)
    const summary = state.last_run_summary as AnalysisRunSummary

    // If recent update with no status (indicating in-progress), deny lock
    if (
      lastUpdate > tenMinutesAgo &&
      summary &&
      !summary.status
    ) {
      return false
    }
  }

  // Acquire lock by setting status to undefined (in-progress indicator)
  const { error } = await supabaseAdmin
    .from('ontology_analysis_state')
    .upsert(
      {
        user_id: userId,
        last_run_summary: { timestamp: new Date().toISOString() }
      },
      {
        onConflict: 'user_id'
      }
    )

  return !error
}

/**
 * Release analysis lock for a user
 */
export async function releaseLock(
  userId: string,
  summary: AnalysisRunSummary
): Promise<void> {
  await updateAnalysisState(userId, new Date(), summary)
}
