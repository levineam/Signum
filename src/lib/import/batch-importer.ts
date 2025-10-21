/**
 * Batch Importer
 *
 * Handles batch insertion of notes into Supabase
 * Manages transactions, deduplication, and progress tracking
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ParsedNote } from './obsidian-parser';

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

    return result;
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
          noteData.created_at = new Date(
            parsedNote.frontmatter.created as string
          ).toISOString();
        }
        if (parsedNote.frontmatter.modified && typeof parsedNote.frontmatter.modified === 'string') {
          noteData.updated_at = new Date(
            parsedNote.frontmatter.modified as string
          ).toISOString();
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
