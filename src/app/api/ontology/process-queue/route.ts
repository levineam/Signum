/**
 * API Route: Process Ontology Analysis Queue
 * Story 2.5.1: Bulk Import Ontology Analysis
 *
 * Called by Supabase Cron every 2 minutes to process one pending queue job.
 * Processes 20 notes at a time, marks them as processed, updates queue progress.
 *
 * Codex Findings #2: Fetches notes by explicit ID (not cursor)
 * Codex Finding #1: Does NOT update lastAnalyzedAt until queue completes
 * Codex Finding #4: Tracks all events in telemetry
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import {
  getNextPendingJob,
  getUnprocessedNotes,
  markNotesProcessed,
  updateQueueStatus,
  completeQueueJob,
  insertTelemetry,
  type UnprocessedNoteRow
} from '@/lib/ontology/queue'
import { runIncrementalExtraction } from '@/lib/ontology/extractor'
import { Note } from '@/types/note'

// Feature flag - server-side control
const QUEUE_PROCESSING_ENABLED =
  process.env.ONTOLOGY_QUEUE_PROCESSING_ENABLED !== 'false'

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Check feature flag
    if (!QUEUE_PROCESSING_ENABLED) {
      return NextResponse.json(
        {
          success: false,
          error: 'Queue processing is disabled',
          details: 'Feature flag ONTOLOGY_QUEUE_PROCESSING_ENABLED is off'
        },
        { status: 503 }
      )
    }

    // 2. Verify service role token
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.substring('Bearer '.length)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!token || token !== serviceRoleKey) {
      return NextResponse.json(
        { success: false, error: 'Invalid service role token' },
        { status: 401 }
      )
    }

    // 3. Get next pending job (Codex Finding #2: atomic lock)
    const job = await getNextPendingJob()

    if (!job) {
      // No pending jobs, exit gracefully
      return NextResponse.json({
        success: true,
        message: 'No pending queue jobs',
        jobsProcessed: 0
      })
    }

    const {
      queueId,
      userId,
      importId,
      importSnapshotTimestamp,
      remainingNotes,
      retryAttempts,
      maxRetries
    } = job

    console.log(
      `[Queue] Processing job ${queueId} for user ${userId}. Remaining notes: ${remainingNotes}`
    )

    // 4. Mark queue as in_progress
    await updateQueueStatus(queueId, 'in_progress')

    // 5. Fetch next batch of notes (Codex Finding #2: by ID, not cursor)
    const batchSize = 20
    const unprocessedNotes = await getUnprocessedNotes(queueId, batchSize)

    if (unprocessedNotes.length === 0) {
      // Queue already completed or race condition
      await updateQueueStatus(queueId, 'completed')
      return NextResponse.json({
        success: true,
        message: 'Queue job already completed',
        jobsProcessed: 0
      })
    }

    // Convert to Note type
    const notesToProcess: Note[] = unprocessedNotes.map((row: UnprocessedNoteRow) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      noteType: row.note_type as Note['noteType'],
      isPinned: row.is_pinned,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }))

    // 6. Run extraction on this batch
    // Codex Finding #1: Do NOT update lastAnalyzedAt
    let extraction = { newValues: 0, newBeliefs: 0, newAims: 0 }
    let batchError: string | null = null

    try {
      extraction = await runIncrementalExtraction(userId, notesToProcess)
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : 'Unknown extraction error'
      batchError = errorMsg
      const nextRetryAttempt = (retryAttempts ?? 0) + 1
      const retryLimit = maxRetries ?? 3
      const retriesExhausted = nextRetryAttempt >= retryLimit

      console.error(
        `[Queue] Extraction failed for batch (attempt ${nextRetryAttempt}/${retryLimit}): ${errorMsg}`
      )

      // Keep the queue pending until we exhaust retries, then mark as failed.
      await updateQueueStatus(
        queueId,
        retriesExhausted ? 'failed' : 'pending',
        undefined,
        errorMsg,
        nextRetryAttempt
      )

      // Track failure in telemetry
      await insertTelemetry({
        userId,
        eventType: 'queue_batch_failed',
        importId,
        queueId,
        noteCount: notesToProcess.length,
        runtimeMs: Date.now() - startTime,
        tokenEstimate: 0,
        extractedValues: 0,
        extractedBeliefs: 0,
        extractedAims: 0,
        errorMessage: errorMsg,
        metadata: {
          failedNoteIds: notesToProcess.map((n) => n.id),
          retryAttempt: nextRetryAttempt,
          maxRetries: retryLimit,
          queueFailed: retriesExhausted
        }
      })

      return NextResponse.json(
        {
          success: false,
          error: 'Extraction failed',
          details: errorMsg,
          queueId,
          noteCount: notesToProcess.length,
          retryAttempt: nextRetryAttempt,
          maxRetries: retryLimit
        },
        { status: retriesExhausted ? 500 : 503 }
      )
    }

    // 7. Mark notes as processed (only if extraction succeeded)
    const processedNoteIds = notesToProcess.map((n) => n.id)
    try {
      await markNotesProcessed(queueId, processedNoteIds)
    } catch (markError) {
      console.error(
        `[Queue] Failed to mark notes processed: ${markError instanceof Error ? markError.message : 'unknown'}`
      )
      // This is a critical error - notes were analyzed but couldn't be marked
      // Mark queue as failed to prevent data loss
      await updateQueueStatus(queueId, 'failed')
      throw markError
    }

    // 8. Get current queue state and calculate new processed count
    const runtime = Date.now() - startTime
    const { data: queueData } = await supabaseAdmin
      .from('ontology_analysis_queue')
      .select('processed_notes, total_notes')
      .eq('id', queueId)
      .single()

    const currentProcessedCount = queueData?.processed_notes || 0
    const newProcessedCount = currentProcessedCount + unprocessedNotes.length
    await updateQueueStatus(queueId, 'pending', newProcessedCount)

    // 9. Track in telemetry (Codex Finding #4)
    await insertTelemetry({
      userId,
      eventType: 'queue_batch_complete',
      importId,
      queueId,
      noteCount: unprocessedNotes.length,
      runtimeMs: runtime,
      tokenEstimate: unprocessedNotes.length * 500,
      extractedValues: extraction.newValues,
      extractedBeliefs: extraction.newBeliefs,
      extractedAims: extraction.newAims,
      errorMessage: batchError || undefined,
      metadata: {
        processedCount: newProcessedCount,
        remainingCount: (queueData?.total_notes || 0) - newProcessedCount,
        batchNumber: Math.ceil(newProcessedCount / 20)
      }
    })

    // 10. Check if queue is complete
    if (newProcessedCount >= (queueData?.total_notes || 0)) {
      // All notes processed! Advance lastAnalyzedAt (Codex Finding #1)
      try {
        await completeQueueJob(
          queueId,
          userId,
          new Date(importSnapshotTimestamp)
        )

        // Track completion in telemetry
        await insertTelemetry({
          userId,
          eventType: 'queue_complete',
          importId,
          queueId,
          noteCount: remainingNotes,
          runtimeMs: Date.now() - startTime
        })

        console.log(`[Queue] Job ${queueId} completed successfully`)
      } catch (completeError) {
        console.error(
          `[Queue] Failed to complete queue job: ${completeError instanceof Error ? completeError.message : 'unknown'}`
        )
        await updateQueueStatus(
          queueId,
          'failed',
          newProcessedCount,
          completeError instanceof Error ? completeError.message : 'Failed to complete queue'
        )
      }
    }

    // 11. Return success
    return NextResponse.json({
      success: true,
      jobId: queueId,
      notesProcessed: unprocessedNotes.length,
      totalProcessed: newProcessedCount,
      remainingNotes: remainingNotes - newProcessedCount,
      runtime
    })
  } catch (error) {
    console.error('[Queue] Unexpected error:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        success: false,
        error: 'Queue processing failed',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check queue processing status
 */
export async function GET() {
  try {
    // Get pending job count
    const { count } = await supabaseAdmin
      .from('ontology_analysis_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')

    return NextResponse.json({
      enabled: QUEUE_PROCESSING_ENABLED,
      pendingJobs: count || 0
    })
  } catch {
    return NextResponse.json(
      {
        enabled: QUEUE_PROCESSING_ENABLED,
        error: 'Failed to check queue status'
      },
      { status: 500 }
    )
  }
}
