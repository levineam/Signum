/**
 * Batch Importer
 *
 * Handles batch insertion of notes into Supabase
 * Manages transactions, deduplication, and progress tracking
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ParsedNote } from './obsidian-parser'
import { createQueueJob, insertTelemetry } from '@/lib/ontology/queue'
import { runIncrementalExtraction } from '@/lib/ontology/extractor'
import { updateAnalysisState } from '@/lib/ontology/state'
import { Note } from '@/types/note'

/**
 * Generate a simple UUID v4 without external dependency
 */
function generateImportId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export interface ImportOptions {
  preserveTimestamps: boolean;
  importTags: boolean;
  skipBrokenLinks: boolean;
  userId: string;
}

export interface ImportProgress {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  currentFile?: string;
}

export interface ImportResult {
  success: boolean;
  noteIds: string[];
  skippedFiles: Array<{ fileName: string; reason: string }>;
  errors: string[];
  summary: {
    notesImported: number;
    totalProcessed: number;
  };
}

export class BatchImporter {
  private readonly BATCH_SIZE = 50;

  constructor(private supabase: SupabaseClient) {}

  /**
   * Import multiple notes in batches
   */
  async importNotes(
    parsedNotes: ParsedNote[],
    options: ImportOptions,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      noteIds: [],
      skippedFiles: [],
      errors: [],
      summary: {
        notesImported: 0,
        totalProcessed: 0,
      },
    };

    const progress: ImportProgress = {
      total: parsedNotes.length,
      processed: 0,
      succeeded: 0,
      failed: 0,
    };

    // Check for duplicates first
    const titleMap = await this.getExistingNoteTitles(options.userId);

    // Process notes in batches
    for (let i = 0; i < parsedNotes.length; i += this.BATCH_SIZE) {
      const batch = parsedNotes.slice(i, i + this.BATCH_SIZE);

      const batchResult = await this.processBatch(
        batch,
        options,
        titleMap,
        progress,
        onProgress
      );

      result.noteIds.push(...batchResult.noteIds);
      result.skippedFiles.push(...batchResult.skipped);
      result.errors.push(...batchResult.errors);
    }

    result.summary.notesImported = result.noteIds.length;
    result.summary.totalProcessed = parsedNotes.length;
    result.success = result.errors.length === 0;

    // Story 2.5.1: Trigger ontology analysis after successful import
    if (result.success && result.noteIds.length > 0) {
      await this.triggerOntologyAnalysis(options.userId, result.noteIds);
    }

    return result;
  }

  /**
   * Trigger ontology analysis based on import size (tiered approach)
   * Story 2.5.1: Bulk Import Ontology Analysis
   * Codex Finding #1: Manages cursor updates appropriately
   */
  private async triggerOntologyAnalysis(userId: string, noteIds: string[]): Promise<void> {
    const noteCount = noteIds.length;
    const importId = generateImportId();
    const sampleStart = Date.now();
    let sampleExtraction:
      | {
          newValues: number;
          newBeliefs: number;
          newAims: number;
        }
      | null = null;

    try {
      // Fetch timestamps for snapshot calculation
      const { data: noteTimestamps } = await this.supabase
        .from('notes')
        .select('id, updated_at')
        .in('id', noteIds);

      if (!noteTimestamps || noteTimestamps.length === 0) {
        console.warn('No notes found for ontology analysis');
        return;
      }

      // Calculate snapshot timestamp (max updated_at)
      const importSnapshotTimestamp = new Date(
        Math.max(...noteTimestamps.map((n) => new Date(n.updated_at).getTime()))
      );

      // Tiered sample sizing
      const sampleSize = noteCount <= 200 ? noteCount : noteCount <= 500 ? 200 : 400;
      const sampleNoteIds = noteIds.slice(0, sampleSize);
      const remainingNoteIds = noteIds.slice(sampleSize);

      // Run immediate sample analysis (does not advance cursor for tier 2/3)
      if (sampleNoteIds.length > 0) {
        await insertTelemetry({
          userId,
          eventType: 'import_sample_start',
          importId,
          noteCount: sampleNoteIds.length
        });

        const { data: sampleNotes } = await this.supabase
          .from('notes')
          .select(
            'id, user_id, title, content, note_type, is_pinned, metadata, created_at, updated_at'
          )
          .in('id', sampleNoteIds);

        if (!sampleNotes || sampleNotes.length === 0) {
          console.warn('Sample notes missing for ontology analysis');
        } else {
          try {
            const notesForExtraction: Note[] = sampleNotes.map((row) => ({
              id: row.id,
              userId: row.user_id,
              title: row.title,
              content: row.content,
              noteType: row.note_type as Note['noteType'],
              isPinned: row.is_pinned ?? false,
              metadata: row.metadata,
              createdAt: row.created_at,
              updatedAt: row.updated_at
            }));

            const extraction = await runIncrementalExtraction(userId, notesForExtraction);
            sampleExtraction = {
              newValues: extraction.newValues,
              newBeliefs: extraction.newBeliefs,
              newAims: extraction.newAims
            };

            await insertTelemetry({
              userId,
              eventType: 'import_sample_complete',
              importId,
              noteCount: sampleNoteIds.length,
              runtimeMs: Date.now() - sampleStart,
              extractedValues: extraction.newValues,
              extractedBeliefs: extraction.newBeliefs,
              extractedAims: extraction.newAims
            });
          } catch (sampleError) {
            console.error('Sample ontology analysis failed:', sampleError);
          }

          // If no remaining notes and sample succeeded, advance the cursor immediately
          if (remainingNoteIds.length === 0 && sampleExtraction) {
            await updateAnalysisState(userId, importSnapshotTimestamp, {
              triggeredBy: 'manual',
              noteCount: sampleNoteIds.length,
              status: 'success',
              runtime: Date.now() - sampleStart,
              extractedCounts: {
                values: sampleExtraction.newValues,
                beliefs: sampleExtraction.newBeliefs,
                aims: sampleExtraction.newAims
              },
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      // P1 FIX: Use queue system for all import sizes instead of server-side fetch
      // Server-side fetch() requires absolute URLs and adds unnecessary complexity
      // The queue system handles analysis asynchronously and provides retry logic
      if (remainingNoteIds.length > 0) {
        await createQueueJob(userId, importId, remainingNoteIds, importSnapshotTimestamp);
        console.log(
          `[BatchImporter] Created queue job for ${remainingNoteIds.length} notes (remaining after sample)`
        );
      }
    } catch (e) {
      console.error('Failed to trigger ontology analysis:', e);
      // Don't fail the import if analysis setup fails
    }
  }

  /**
   * Process a single batch of notes
   */
  private async processBatch(
    batch: ParsedNote[],
    options: ImportOptions,
    titleMap: Map<string, string>,
    progress: ImportProgress,
    onProgress?: (progress: ImportProgress) => void
  ): Promise<{
    noteIds: string[];
    skipped: Array<{ fileName: string; reason: string }>;
    errors: string[];
  }> {
    const noteIds: string[] = [];
    const skipped: Array<{ fileName: string; reason: string }> = [];
    const errors: string[] = [];

    const notesToInsert = [];

    for (const parsedNote of batch) {
      progress.currentFile = parsedNote.fileName;

      // Check for duplicate title
      if (titleMap.has(parsedNote.title.toLowerCase())) {
        // Handle duplicate - append timestamp
        const timestamp = Date.now();
        parsedNote.title = `${parsedNote.title} (${timestamp})`;
      }

      // Build note object
      const noteData: Record<string, unknown> = {
        user_id: options.userId,
        title: parsedNote.title,
        content: parsedNote.content,
        note_type: 'custom',
        is_pinned: false,
        metadata: {
          importedFrom: 'obsidian',
          importDate: new Date().toISOString(),
          originalFileName: parsedNote.fileName,
          relativePath: parsedNote.relativePath, // Preserve folder structure for WikiLink resolution
          frontmatter: parsedNote.frontmatter,
          wikiLinks: parsedNote.wikiLinks.map((link) => ({
            target: link.target,
            text: link.text,
            alias: link.alias,
            isEmbed: link.isEmbed,
          })),
          ...(options.importTags && parsedNote.tags.length > 0
            ? { tags: parsedNote.tags }
            : {}),
        },
      };

      // Preserve timestamps from frontmatter if option enabled
      if (options.preserveTimestamps && parsedNote.frontmatter) {
        if (parsedNote.frontmatter.created && typeof parsedNote.frontmatter.created === 'string') {
          const createdDate = new Date(parsedNote.frontmatter.created as string);
          // Validate date before calling toISOString to prevent crashes
          if (!isNaN(createdDate.getTime())) {
            noteData.created_at = createdDate.toISOString();
          }
        }
        if (parsedNote.frontmatter.modified && typeof parsedNote.frontmatter.modified === 'string') {
          const modifiedDate = new Date(parsedNote.frontmatter.modified as string);
          // Validate date before calling toISOString to prevent crashes
          if (!isNaN(modifiedDate.getTime())) {
            noteData.updated_at = modifiedDate.toISOString();
          }
        }
      }

      notesToInsert.push(noteData);
      titleMap.set(parsedNote.title.toLowerCase(), parsedNote.title);
    }

    // Batch insert
    if (notesToInsert.length > 0) {
      const { data, error } = await this.supabase
        .from('notes')
        .insert(notesToInsert)
        .select('id');

      if (error) {
        errors.push(`Batch insert error: ${error.message}`);
        progress.failed += notesToInsert.length;
      } else if (data) {
        noteIds.push(...data.map((note: { id: string }) => note.id));
        progress.succeeded += data.length;
      }
    }

    progress.processed += batch.length;

    if (onProgress) {
      onProgress({ ...progress });
    }

    return { noteIds, skipped, errors };
  }

  /**
   * Get existing note titles to detect duplicates
   */
  private async getExistingNoteTitles(
    userId: string
  ): Promise<Map<string, string>> {
    const { data: notes, error } = await this.supabase
      .from('notes')
      .select('title')
      .eq('user_id', userId);

    const titleMap = new Map<string, string>();

    if (!error && notes) {
      notes.forEach((note: { title: string }) => {
        titleMap.set(note.title.toLowerCase(), note.title);
      });
    }

    return titleMap;
  }

  /**
   * Rollback import (delete all notes created in this import session)
   */
  async rollbackImport(userId: string, noteIds: string[]): Promise<void> {
    if (noteIds.length === 0) return;

    const { error } = await this.supabase
      .from('notes')
      .delete()
      .in('id', noteIds)
      .eq('user_id', userId);

    if (error) {
      console.error('Rollback failed:', error);
    }
  }
}
