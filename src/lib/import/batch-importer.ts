/**
 * Batch Importer
 *
 * Handles batch insertion of notes into Supabase
 * Manages transactions, deduplication, and progress tracking
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ParsedNote } from './obsidian-parser'
import { createQueueJob } from '@/lib/ontology/queue'
import { v4 as uuidv4 } from 'uuid'

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
    const importId = uuidv4();

    try {
      // Fetch notes to get their timestamps
      const { data: notes } = await this.supabase
        .from('notes')
        .select('id, updated_at')
        .in('id', noteIds);

      if (!notes || notes.length === 0) {
        console.warn('No notes found for ontology analysis');
        return;
      }

      // Calculate snapshot timestamp (max updated_at)
      const importSnapshotTimestamp = new Date(
        Math.max(...notes.map((n) => new Date(n.updated_at).getTime()))
      );

      if (noteCount <= 200) {
        // Tier 1: Analyze all immediately with cursor update
        await fetch('/api/ontology/incremental-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            triggeredBy: 'bulk-import',
            noteIds: noteIds,
            updateCursor: true, // Safe: analyze all, update cursor
          }),
        }).catch((e) => {
          // Don't fail import if analysis fails
          console.error('Failed to trigger ontology analysis:', e);
        });
      } else {
        // Tier 2/3: Sample + queue
        const sampleSize = noteCount <= 500 ? 200 : 400;
        const sampleNoteIds = noteIds.slice(0, sampleSize);
        const queuedNoteIds = noteIds.slice(sampleSize);

        // Immediate sample analysis WITHOUT cursor update (Codex Finding #1)
        await fetch('/api/ontology/incremental-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            triggeredBy: 'bulk-import-sample',
            noteIds: sampleNoteIds,
            updateCursor: false, // DO NOT advance lastAnalyzedAt yet
          }),
        }).catch((e) => {
          console.error('Failed to trigger sample analysis:', e);
        });

        // Queue remaining notes (Codex Finding #2: explicit note ID tracking)
        try {
          await createQueueJob(userId, importId, queuedNoteIds, importSnapshotTimestamp);
        } catch (e) {
          console.error('Failed to create queue job:', e);
          // Don't fail import if queue creation fails
        }
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
