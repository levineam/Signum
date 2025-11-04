/**
 * API Route: /api/import/obsidian
 *
 * Handles Obsidian vault import requests
 * Processes multiple .md files, converts them to Signum format, and imports to database
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { obsidianParser } from '@/lib/import/obsidian-parser';
import { BatchImporter } from '@/lib/import/batch-importer';
import { LinkResolver } from '@/lib/import/link-resolver';
import logger from '@/utils/logger'

export const maxDuration = 60; // Allow up to 60 seconds for large imports

// Vercel has a 4.5MB limit for Hobby, 6MB for Pro
// We need to warn users about this in the UI
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface ImportRequest {
  files: Array<{
    fileName: string;
    relativePath?: string; // Full path from vault root (e.g., "daily/note.md")
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
    const cookieStore = await cookies();
    let supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // Try to get user from cookies first
    let user = null;
    let authError = null;

    const cookieAuth = await supabase.auth.getUser();
    user = cookieAuth.data.user;
    authError = cookieAuth.error;

    // Fallback: Check Authorization header (for Vercel previews where cookies don't work)
    if (authError || !user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const { data, error } = await supabase.auth.getUser(token);
        user = data.user;
        authError = error;

        // CRITICAL: Create a new client with the bearer token in global headers
        // so BatchImporter/LinkResolver can authenticate their DB operations under RLS.
        // We can't use setSession() because it requires a refresh_token.
        if (!error && data.user) {
          supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              cookies: {
                getAll() {
                  return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                  cookiesToSet.forEach(({ name, value, options }) =>
                    cookieStore.set(name, value, options)
                  );
                },
              },
              global: {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            }
          );
        }
      }
    }

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

    const importId = `import-${Date.now()}-${user.id.slice(0, 8)}`;

    logger.debug({ route: 'obsidian' }, `[${importId}] Starting import of ${body.files.length} files for user ${user.id}`);

    // Validate total size server-side (100MB max)
    // SECURITY: Compute actual size from content, don't trust client-provided size
    const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB
    let totalSize = 0;

    for (const file of body.files) {
      const actualSize = Buffer.byteLength(file.content, 'utf8');
      totalSize += actualSize;

      if (totalSize > MAX_TOTAL_SIZE) {
        return NextResponse.json(
          { error: 'Total vault size exceeds 100MB limit' },
          { status: 400 }
        );
      }
    }

    // Phase 1: Parse all files
    const parsedNotes = [];
    const parseErrors: Array<{ fileName: string; error: string }> = [];

    for (const file of body.files) {
      try {
        // Compute actual file size server-side
        const actualSize = Buffer.byteLength(file.content, 'utf8');

        // Validate file
        const validation = obsidianParser.validateFile(
          file.fileName,
          actualSize,
          file.content
        );

        if (!validation.valid) {
          parseErrors.push({
            fileName: file.fileName,
            error: validation.error || 'Validation failed',
          });
          continue;
        }

        // Parse file with relative path for folder structure preservation
        const parsed = await obsidianParser.parseFile(
          file.fileName,
          file.content,
          file.relativePath
        );

        parsedNotes.push(parsed);
      } catch (error) {
        logger.error({ route: 'obsidian' }, `[${importId}] Error parsing ${file.fileName}:`, error);
        parseErrors.push({
          fileName: file.fileName,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.debug({ route: 'obsidian' }, `[${importId}] Parsed ${parsedNotes.length} notes, ${parseErrors.length} errors`);

    // Phase 2: Import notes to database
    const batchImporter = new BatchImporter(supabase);
    const importResult = await batchImporter.importNotes(
      parsedNotes,
      {
        ...body.options,
        userId: user.id,
      }
    );

    logger.debug({ route: 'obsidian' }, `[${importId}] Imported ${importResult.noteIds.length} notes`);

    // Check if batch import failed
    if (!importResult.success || importResult.errors.length > 0) {
      logger.error({ route: 'obsidian' }, `[${importId}] Batch import failed, rolling back ${importResult.noteIds.length} notes`);
      await batchImporter.rollbackImport(user.id, importResult.noteIds);

      return NextResponse.json(
        {
          success: false,
          summary: {
            notesImported: 0,
            linksResolved: 0,
            brokenLinks: [],
            skippedFiles: importResult.skippedFiles,
            errors: importResult.errors,
          },
          importId,
        },
        { status: 500 }
      );
    }

    // Phase 3: Resolve WikiLinks
    let linkResolutionResult;
    if (importResult.noteIds.length > 0) {
      try {
        const linkResolver = new LinkResolver(supabase);
        linkResolutionResult = await linkResolver.resolveLinks(
          user.id,
          importResult.noteIds
        );
        logger.debug({ route: 'obsidian' }, `[${importId}] Resolved ${linkResolutionResult.resolvedCount} links, ${linkResolutionResult.brokenLinks.length} broken`);
      } catch (error) {
        logger.error({ route: 'obsidian' }, `[${importId}] Link resolution error:`, error);
        // Roll back on link resolution failure
        await batchImporter.rollbackImport(user.id, importResult.noteIds);

        return NextResponse.json(
          {
            success: false,
            summary: {
              notesImported: 0,
              linksResolved: 0,
              brokenLinks: [],
              skippedFiles: importResult.skippedFiles,
              errors: [`Link resolution failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
            },
            importId,
          },
          { status: 500 }
        );
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

    logger.debug({ route: 'obsidian' }, `[${importId}] Import complete:`, {
      notesImported: response.summary.notesImported,
      linksResolved: response.summary.linksResolved,
      brokenLinks: response.summary.brokenLinks.length,
      skipped: response.summary.skippedFiles.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error({ route: 'obsidian' }, 'Import error:', error);

    return NextResponse.json(
      {
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
