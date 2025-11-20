/**
 * Ontology Analysis Queue Management
 * Story 2.5.1: Bulk Import Ontology Analysis
 *
 * Handles:
 * - Creating queue jobs for bulk imports
 * - Processing queue batches via Supabase Cron
 * - Telemetry tracking for metrics
 * - Idempotent note processing (prevents double-analysis)
 */

import { supabaseAdmin } from '@/lib/supabase-admin'

// ============================================================================
// Types
// ============================================================================

export interface QueueJob {
  id: string
  userId: string
  importId: string
  importSnapshotTimestamp: string
  totalNotes: number
  processedNotes: number
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  errorMessage?: string
  retryAttempts: number
  maxRetries: number
  createdAt: string
  updatedAt: string
}

export interface TelemetryEvent {
  userId: string
  eventType:
    | 'import_sample_start'
    | 'import_sample_complete'
    | 'queue_created'
    | 'queue_batch_complete'
    | 'queue_batch_failed'
    | 'queue_complete'
    | 'manual_trigger'
  importId?: string
  queueId?: string
  noteCount?: number
  runtimeMs?: number
  tokenEstimate?: number
  extractedValues?: number
  extractedBeliefs?: number
  extractedAims?: number
  errorMessage?: string
  metadata?: Record<string, unknown>
}

// ============================================================================
// Queue Creation
// ============================================================================

/**
 * Create a queue job for remaining notes after sample analysis
 * Codex Finding #2: Stores explicit note IDs to prevent double-processing
 */
export async function createQueueJob(
  userId: string,
  importId: string,
  noteIds: string[],
  importSnapshotTimestamp: Date
): Promise<QueueJob> {
  // Create queue record
  const { data: queueData, error: queueError } = await supabaseAdmin
    .from('ontology_analysis_queue')
    .insert({
      user_id: userId,
      import_id: importId,
      import_snapshot_timestamp: importSnapshotTimestamp.toISOString(),
      total_notes: noteIds.length,
      processed_notes: 0,
      status: 'pending'
    })
    .select()
    .single()

  if (queueError) {
    console.error('Failed to create queue job:', queueError)
    throw queueError
  }

  // Insert note IDs into join table
  const { error: notesError } = await supabaseAdmin
    .from('ontology_analysis_queue_notes')
    .insert(
      noteIds.map((noteId) => ({
        queue_id: queueData.id,
        note_id: noteId,
        processed: false
      }))
    )

  if (notesError) {
    console.error('Failed to populate queue notes:', notesError)
    // Rollback queue creation
    await supabaseAdmin
      .from('ontology_analysis_queue')
      .delete()
      .eq('id', queueData.id)
    throw notesError
  }

  // Track in telemetry (Codex Finding #4)
  await insertTelemetry({
    userId,
    eventType: 'queue_created',
    importId,
    queueId: queueData.id,
    noteCount: noteIds.length
  })

  return {
    id: queueData.id,
    userId: queueData.user_id,
    importId: queueData.import_id,
    importSnapshotTimestamp: queueData.import_snapshot_timestamp,
    totalNotes: queueData.total_notes,
    processedNotes: queueData.processed_notes,
    status: queueData.status,
    retryAttempts: queueData.retry_attempts,
    maxRetries: queueData.max_retries,
    createdAt: queueData.created_at,
    updatedAt: queueData.updated_at
  }
}

// ============================================================================
// Queue Processing (called by Cron)
// ============================================================================

/**
 * Get next pending queue job
 * Used by background worker (Supabase Cron)
 */
export async function getNextPendingJob(): Promise<{
  queueId: string
  userId: string
  importId: string
  importSnapshotTimestamp: string
  remainingNotes: number
  retryAttempts: number
  maxRetries: number
} | null> {
  const { data, error } = await supabaseAdmin.rpc('get_next_queue_job')

  if (error) {
    console.error('Failed to get next queue job:', error)
    throw error
  }

  if (!data || data.length === 0) {
    return null
  }

  return {
    queueId: data[0].queue_id,
    userId: data[0].user_id,
    importId: data[0].import_id,
    importSnapshotTimestamp: data[0].import_snapshot_timestamp,
    remainingNotes: data[0].remaining_notes,
    retryAttempts: data[0].retry_attempts,
    maxRetries: data[0].max_retries
  }
}

// Full database row type from get_unprocessed_notes RPC function
export interface UnprocessedNoteRow {
  id: string
  user_id: string
  title: string
  content: string
  note_type: string
  is_pinned: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

/**
 * Get unprocessed notes for a queue job (max 20 at a time)
 * Codex Finding #2: Fetch by ID, not by cursor
 * Returns full database rows (not converted to Note type yet)
 */
export async function getUnprocessedNotes(
  queueId: string,
  batchSize: number = 20
): Promise<UnprocessedNoteRow[]> {
  const { data, error } = await supabaseAdmin.rpc('get_unprocessed_notes', {
    p_queue_id: queueId,
    p_batch_size: batchSize
  })

  if (error) {
    console.error('Failed to get unprocessed notes:', error)
    throw error
  }

  return data || []
}

/**
 * Mark notes as processed in queue
 * Idempotent: safe if called multiple times
 */
export async function markNotesProcessed(
  queueId: string,
  noteIds: string[]
): Promise<void> {
  const { error } = await supabaseAdmin.rpc('mark_notes_processed', {
    p_queue_id: queueId,
    p_note_ids: noteIds
  })

  if (error) {
    console.error('Failed to mark notes processed:', error)
    throw error
  }
}

/**
 * Update queue job status
 */
export async function updateQueueStatus(
  queueId: string,
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  processedNotes?: number,
  errorMessage?: string,
  retryAttempts?: number
): Promise<void> {
  const { error } = await supabaseAdmin.rpc('update_queue_status', {
    p_queue_id: queueId,
    p_status: status,
    p_processed_notes: processedNotes || null,
    p_error_message: errorMessage || null,
    p_retry_attempts: typeof retryAttempts === 'number' ? retryAttempts : null
  })

  if (error) {
    console.error('Failed to update queue status:', error)
    throw error
  }
}

/**
 * Complete queue job and advance user's lastAnalyzedAt
 * Called when all notes in queue have been processed
 * Codex Finding #1: Only advance cursor when queue is complete
 */
export async function completeQueueJob(
  queueId: string,
  userId: string,
  importSnapshotTimestamp: Date
): Promise<void> {
  // Update queue status
  await updateQueueStatus(queueId, 'completed')

  // Preserve newer cursors if a manual run advanced them while the queue was processing
  const { data: existingState } = await supabaseAdmin
    .from('ontology_analysis_state')
    .select('last_analyzed_at, last_run_summary')
    .eq('user_id', userId)
    .single()

  const existingTimestamp = existingState?.last_analyzed_at
    ? new Date(existingState.last_analyzed_at)
    : null
  const effectiveTimestamp =
    existingTimestamp && existingTimestamp > importSnapshotTimestamp
      ? existingTimestamp
      : importSnapshotTimestamp

  // Advance user's lastAnalyzedAt to snapshot timestamp
  const { error } = await supabaseAdmin
    .from('ontology_analysis_state')
    .upsert(
      {
        user_id: userId,
        last_analyzed_at: effectiveTimestamp.toISOString(),
        last_run_summary: existingState?.last_run_summary || {}
      },
      {
        onConflict: 'user_id'
      }
    )

  if (error) {
    console.error('Failed to advance lastAnalyzedAt:', error)
    throw error
  }
}

// ============================================================================
// Telemetry (Codex Finding #4)
// ============================================================================

/**
 * Insert telemetry event for metrics tracking
 */
export async function insertTelemetry(event: TelemetryEvent): Promise<string> {
  const { data, error } = await supabaseAdmin.rpc('insert_telemetry', {
    p_user_id: event.userId,
    p_event_type: event.eventType,
    p_import_id: event.importId || null,
    p_queue_id: event.queueId || null,
    p_note_count: event.noteCount || null,
    p_runtime_ms: event.runtimeMs || null,
    p_token_estimate: event.tokenEstimate || null,
    p_extracted_values: event.extractedValues || null,
    p_extracted_beliefs: event.extractedBeliefs || null,
    p_extracted_aims: event.extractedAims || null,
    p_error_message: event.errorMessage || null,
    p_metadata: event.metadata ? JSON.stringify(event.metadata) : null
  })

  if (error) {
    console.error('Failed to insert telemetry:', error)
    throw error
  }

  return data
}

// ============================================================================
// Analytics Queries
// ============================================================================

/**
 * Get metrics for dashboard
 * Measures success criteria from Story 2.5.1
 */
export async function getAnalyticsMetrics(daysBack: number = 7) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysBack)

  // Query 1: Average time to initial ontology (target: <20s)
  const { data: timeToOntology } = await supabaseAdmin
    .from('ontology_analysis_telemetry')
    .select('runtime_ms')
    .eq('event_type', 'import_sample_complete')
    .gte('created_at', cutoffDate.toISOString())

  const avgTimeToOntologyMs = timeToOntology
    ? timeToOntology.reduce((sum, row) => sum + (row.runtime_ms || 0), 0) /
      Math.max(timeToOntology.length, 1)
    : 0

  // Query 2: Queue processing rate (target: 20 notes/2min)
  const { data: batchCompletions } = await supabaseAdmin
    .from('ontology_analysis_telemetry')
    .select('note_count, runtime_ms')
    .eq('event_type', 'queue_batch_complete')
    .gte('created_at', cutoffDate.toISOString())

  const avgNotesPerMinute = batchCompletions
    ? batchCompletions.reduce((sum, row) => {
        const minutesElapsed = (row.runtime_ms || 0) / 60000
        return sum + (minutesElapsed > 0 ? row.note_count / minutesElapsed : 0)
      }, 0) / Math.max(batchCompletions.length, 1)
    : 0

  // Query 3: Success rate (target: >95%)
  const { data: queueCompletions } = await supabaseAdmin
    .from('ontology_analysis_telemetry')
    .select('event_type, error_message')
    .in('event_type', ['queue_complete', 'queue_batch_failed'])
    .gte('created_at', cutoffDate.toISOString())

  const totalQueueEvents = queueCompletions?.length || 0
  const successfulCompletions =
    queueCompletions?.filter(
      (e) => e.event_type === 'queue_complete' && !e.error_message
    ).length || 0
  const failedCompletions =
    queueCompletions?.filter(
      (e) => e.event_type === 'queue_complete' && e.error_message
    ).length || 0
  const failedBatches =
    queueCompletions?.filter((e) => e.event_type === 'queue_batch_failed').length || 0

  const successRate =
    totalQueueEvents > 0
      ? (successfulCompletions / (successfulCompletions + failedCompletions + failedBatches)) *
        100
      : 0

  // Query 4: Cost per 1000 notes
  const { data: costEvents } = await supabaseAdmin
    .from('ontology_analysis_telemetry')
    .select('token_estimate, note_count')
    .in('event_type', ['import_sample_complete', 'queue_batch_complete'])
    .gte('created_at', cutoffDate.toISOString())

  const tokensPerThousand = costEvents
    ? (costEvents.reduce((sum, row) => sum + (row.token_estimate || 0), 0) /
        costEvents.reduce((sum, row) => sum + (row.note_count || 0), 0)) *
      1000
    : 0

  return {
    avgTimeToOntologySeconds: avgTimeToOntologyMs / 1000,
    avgNotesPerMinute: Math.round(avgNotesPerMinute * 100) / 100,
    successRatePercent: Math.round(successRate * 100) / 100,
    tokensPerThousandNotes: Math.round(tokensPerThousand),
    daysBack
  }
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Clean up old queue jobs and telemetry
 * Run via Supabase Cron (e.g., daily)
 */
export async function runCleanup(): Promise<{ queueJobs: number; telemetry: number }> {
  const { data, error } = await supabaseAdmin.rpc('cleanup_ontology_queue')

  if (error) {
    console.error('Failed to cleanup queue:', error)
    throw error
  }

  const result = data?.[0] || { cleaned_queue_jobs: 0, cleaned_telemetry_events: 0 }

  console.log(
    `Ontology queue cleanup: ${result.cleaned_queue_jobs} queue jobs, ${result.cleaned_telemetry_events} telemetry events`
  )

  return {
    queueJobs: result.cleaned_queue_jobs,
    telemetry: result.cleaned_telemetry_events
  }
}
