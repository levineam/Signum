/**
 * API Route: /api/import/obsidian
 *
 * Handles Obsidian vault import requests
 * Processes multiple .md files, converts them to Signum format, and imports to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { obsidianParser } from '@/lib/import/obsidian-parser';
import { BatchImporter } from '@/lib/import/batch-importer';
import { LinkResolver } from '@/lib/import/link-resolver';

export const maxDuration = 60; // Allow up to 60 seconds for large imports

export interface ImportRequest {
  files: Array<{
    fileName: string;
    content: string;
    size: number;
  }>;
  options: {
    preserveTimestamps: boolean;
    importTags: boolean;
    skipBrokenLinks: boolean;
  };
}

export interface ImportResponse {
  success: boolean;
  summary: {
    notesImported: number;
    linksResolved: number;
    brokenLinks: Array<{
      sourceTitle: string;
      targetTitle: string;
      wikiLink: string;
    }>;
    skippedFiles: Array<{ fileName: string; reason: string }>;
    errors: string[];
  };
  importId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: ImportRequest = await request.json();

    // Validate request
    if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate total size (100MB max)
    const totalSize = body.files.reduce((sum, file) => sum + file.size, 0);
    const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB

    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        { error: 'Total vault size exceeds 100MB limit' },
        { status: 400 }
      );
    }

    const importId = `import-${Date.now()}-${user.id.slice(0, 8)}`;

    console.log(`[${importId}] Starting import of ${body.files.length} files for user ${user.id}`);

    // Phase 1: Parse all files
    const parsedNotes = [];
    const parseErrors: Array<{ fileName: string; error: string }> = [];

    for (const file of body.files) {
      try {
        // Validate file
        const validation = obsidianParser.validateFile(
          file.fileName,
          file.size,
          file.content
        );

        if (!validation.valid) {
          parseErrors.push({
            fileName: file.fileName,
            error: validation.error || 'Validation failed',
          });
          continue;
        }

        // Parse file
        const parsed = await obsidianParser.parseFile(
          file.fileName,
          file.content
        );

        parsedNotes.push(parsed);
      } catch (error) {
        console.error(`[${importId}] Error parsing ${file.fileName}:`, error);
        parseErrors.push({
          fileName: file.fileName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    console.log(`[${importId}] Parsed ${parsedNotes.length} notes, ${parseErrors.length} errors`);

    // Phase 2: Import notes to database
    const batchImporter = new BatchImporter(supabase);
    const importResult = await batchImporter.importNotes(
      parsedNotes,
      {
        ...body.options,
        userId: user.id,
      }
    );

    console.log(`[${importId}] Imported ${importResult.noteIds.length} notes`);

    // Phase 3: Resolve WikiLinks
    let linkResolutionResult;
    if (importResult.noteIds.length > 0) {
      try {
        const linkResolver = new LinkResolver(supabase);
        linkResolutionResult = await linkResolver.resolveLinks(
          user.id,
          importResult.noteIds
        );
        console.log(`[${importId}] Resolved ${linkResolutionResult.resolvedCount} links, ${linkResolutionResult.brokenLinks.length} broken`);
      } catch (error) {
        console.error(`[${importId}] Link resolution error:`, error);
        linkResolutionResult = {
          resolvedCount: 0,
          brokenLinks: [],
          updatedNotes: [],
        };
      }
    } else {
      linkResolutionResult = {
        resolvedCount: 0,
        brokenLinks: [],
        updatedNotes: [],
      };
    }

    // Build response
    const response: ImportResponse = {
      success: importResult.success && parseErrors.length === 0,
      summary: {
        notesImported: importResult.noteIds.length,
        linksResolved: linkResolutionResult.resolvedCount,
        brokenLinks: linkResolutionResult.brokenLinks.map((link) => ({
          sourceTitle: link.sourceTitle,
          targetTitle: link.targetTitle,
          wikiLink: link.wikiLink,
        })),
        skippedFiles: [
          ...importResult.skippedFiles,
          ...parseErrors.map((e) => ({
            fileName: e.fileName,
            reason: e.error,
          })),
        ],
        errors: importResult.errors,
      },
      importId,
    };

    console.log(`[${importId}] Import complete:`, {
      notesImported: response.summary.notesImported,
      linksResolved: response.summary.linksResolved,
      brokenLinks: response.summary.brokenLinks.length,
      skipped: response.summary.skippedFiles.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Import error:', error);

    return NextResponse.json(
      {
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
