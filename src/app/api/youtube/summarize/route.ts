/**
 * YouTube Video Summarization API Route
 *
 * Fetches a YouTube video transcript and generates an AI summary.
 * Creates a linked note with the summary content.
 *
 * POST /api/youtube/summarize
 * Body: { videoId: string, videoUrl?: string, entryId?: string }
 * Returns: { noteId: string, summary: string, tokensUsed: number, model: string }
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { hasPublicSupabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { convertMarkdownToHtml } from '@/lib/ai/markdown-to-html'
import { VIDEO_SUMMARY_SYSTEM_PROMPT } from '@/lib/ai/prompt-templates'
import type {
  VideoSummarizeRequest,
  VideoSummarizeResponse,
  VideoSummaryNoteMetadata,
} from '@/lib/ai/types'
import {
  fetchTranscript,
  TranscriptError,
  TranscriptErrorCode,
} from '@/lib/youtube/transcript'
import { validateVideoId } from '@/utils/youtube'
import {
  shouldSkipEntryValidation,
  validateJournalEntryOwnership,
} from './validation'

// Edge runtime for longer timeout (25s+)
export const runtime = 'edge'

const isTestMode =
  ['1', 'true'].includes(process.env.E2E_TEST_MODE ?? '') ||
  ['1', 'true'].includes(process.env.NEXT_PUBLIC_E2E_TEST_MODE ?? '')

// Error codes for this endpoint
enum VideoSummarizeErrorCode {
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_VIDEO_ID = 'INVALID_VIDEO_ID',
  TRANSCRIPT_NOT_FOUND = 'TRANSCRIPT_NOT_FOUND',
  VIDEO_UNAVAILABLE = 'VIDEO_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  OPENAI_RATE_LIMIT = 'OPENAI_RATE_LIMIT',
  TIMEOUT = 'TIMEOUT',
  NOTE_CREATION_FAILED = 'NOTE_CREATION_FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVER_CONFIG_ERROR = 'SERVER_CONFIG_ERROR',
}

interface ErrorResponse {
  error: string
  code: VideoSummarizeErrorCode
  details?: string
}

type NotesRow = {
  id: string
  user_id: string
  title: string
  content: string
  note_type: string
  metadata: VideoSummaryNoteMetadata
  is_pinned: boolean
  created_at: string
  updated_at: string
}

type NotesInsert = {
  id?: string
  user_id: string
  title: string
  content?: string
  note_type: string
  metadata?: VideoSummaryNoteMetadata
  is_pinned?: boolean
  created_at?: string
  updated_at?: string
}

type Database = {
  public: {
    Tables: {
      notes: {
        Row: NotesRow
        Insert: NotesInsert
        Update: Partial<NotesRow>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

function buildLocalNoteId(): string {
  try {
    return `local-note-${crypto.randomUUID()}`
  } catch {
    return `local-note-${Date.now()}`
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user (skip in dev:test mode)
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    let userId: string | null = null
    let supabase: SupabaseClient<Database> | null = null

    if (!isTestMode) {
      if (!token) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Unauthorized', code: VideoSummarizeErrorCode.AUTH_REQUIRED },
          { status: 401 }
        )
      }

      if (!hasPublicSupabase()) {
        console.error('[Video Summarize] Missing Supabase environment variables')
        return NextResponse.json<ErrorResponse>(
          { error: 'Server configuration error', code: VideoSummarizeErrorCode.SERVER_CONFIG_ERROR },
          { status: 500 }
        )
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

      supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      })

      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Unauthorized', code: VideoSummarizeErrorCode.AUTH_REQUIRED },
          { status: 401 }
        )
      }

      userId = user.id
    } else {
      userId = 'test-user'
    }

    // 2. Parse and validate request
    const body: VideoSummarizeRequest = await request.json()
    const { videoId, videoUrl, entryId } = body

    if (!videoId) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Video ID is required', code: VideoSummarizeErrorCode.INVALID_REQUEST },
        { status: 400 }
      )
    }

    // Validate video ID format using shared utility
    if (!validateVideoId(videoId)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid video ID format', code: VideoSummarizeErrorCode.INVALID_VIDEO_ID },
        { status: 400 }
      )
    }

    // Validate entryId ownership if provided
    // Skip validation for local/test/guest entries
    if (!isTestMode && !shouldSkipEntryValidation(entryId)) {
      const ownsEntry = await validateJournalEntryOwnership(supabase!, entryId!, userId!)

      if (!ownsEntry) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Journal entry not found or access denied', code: VideoSummarizeErrorCode.INVALID_REQUEST },
          { status: 403 }
        )
      }
    }

    // 2b. Avoid duplicate summaries for the same user/video
    if (!isTestMode && supabase) {
      const { data: existingNote } = await supabase
        .from('notes')
        .select('id, content, metadata')
        .eq('user_id', userId!)
        .eq('note_type', 'custom')
        .contains('metadata', { videoId, sourceType: 'video' })
        .maybeSingle()

      if (existingNote) {
        return NextResponse.json<VideoSummarizeResponse>({
          noteId: existingNote.id,
          noteTitle: existingNote.metadata?.title,
          summary: existingNote.content ?? '',
          tokensUsed: existingNote.metadata?.tokensUsed ?? 0,
          model: existingNote.metadata?.model ?? 'cached',
        })
      }
    }

    // 3. Fetch transcript
    console.log('[Video Summarize] Fetching transcript for video:', videoId)
    let transcript: string

    try {
      const result = await fetchTranscript(videoId)
      transcript = result.text
      console.log('[Video Summarize] Transcript fetched, length:', transcript.length)
    } catch (error) {
      if (error instanceof TranscriptError) {
        // Map transcript error codes to appropriate HTTP status and error codes
        let statusCode = 500
        let errorCode = VideoSummarizeErrorCode.INTERNAL_ERROR

        switch (error.code) {
          case TranscriptErrorCode.TRANSCRIPT_NOT_FOUND:
            // 422 avoids confusing browser/devtools “route missing” semantics for a known business error
            statusCode = 422
            errorCode = VideoSummarizeErrorCode.TRANSCRIPT_NOT_FOUND
            break
          case TranscriptErrorCode.VIDEO_UNAVAILABLE:
            statusCode = 404
            errorCode = VideoSummarizeErrorCode.VIDEO_UNAVAILABLE
            break
          case TranscriptErrorCode.INVALID_VIDEO_ID:
            statusCode = 400
            errorCode = VideoSummarizeErrorCode.INVALID_VIDEO_ID
            break
          case TranscriptErrorCode.NETWORK_ERROR:
            statusCode = 503
            errorCode = VideoSummarizeErrorCode.NETWORK_ERROR
            break
          case TranscriptErrorCode.UNKNOWN_ERROR:
          default:
            statusCode = 500
            errorCode = VideoSummarizeErrorCode.INTERNAL_ERROR
            break
        }

        return NextResponse.json<ErrorResponse>(
          {
            error: error.message,
            code: errorCode,
          },
          { status: statusCode }
        )
      }
      throw error
    }

    // 4. Generate summary (OpenAI if configured, else stub in dev:test)
    let tokensUsed = 0
    let modelUsed = 'gpt-4o-mini'
    let markdownSummary = ''

    if (!process.env.OPENAI_API_KEY) {
      if (!isTestMode) {
        console.error('[Video Summarize] Missing OpenAI API key')
        return NextResponse.json<ErrorResponse>(
          { error: 'AI service not configured', code: VideoSummarizeErrorCode.AI_SERVICE_ERROR },
          { status: 500 }
        )
      }

      modelUsed = 'stub'
      const words = transcript.split(/\s+/).filter(Boolean)
      const preview = words.slice(0, 180).join(' ')
      markdownSummary = [
        '## Summary (Test Mode)',
        '',
        preview ? preview + (words.length > 180 ? '…' : '') : 'No transcript text available.',
        '',
        '## Key takeaways',
        '',
        '- (Test Mode) Configure `OPENAI_API_KEY` for real summaries.',
      ].join('\n')
    } else {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 23000, // 23 seconds (leaves 2s buffer within 25s Edge runtime limit)
        maxRetries: 0,
      })

      console.log('[Video Summarize] Calling OpenAI API...')
      const startTime = Date.now()

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: VIDEO_SUMMARY_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: `Please summarize this YouTube video based on its transcript:\n\n${transcript}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500, // Slightly more for video summaries
      })

      const duration = Date.now() - startTime
      console.log(`[Video Summarize] OpenAI API call completed in ${duration}ms`)

      markdownSummary = completion.choices[0]?.message?.content || ''
      tokensUsed = completion.usage?.total_tokens || 0
      modelUsed = completion.model || 'gpt-4o-mini'
    }

    // 5. Convert markdown to HTML
    console.log('[Video Summarize] Converting markdown to HTML...')
    const htmlSummary = await convertMarkdownToHtml(markdownSummary)

    // 6. Create note with summary (local in dev:test; Supabase otherwise)
    const noteTitle = `Video Summary: ${videoId}`
    const metadata: VideoSummaryNoteMetadata = {
      sourceType: 'video',
      videoId,
      videoUrl: videoUrl || `https://www.youtube.com/watch?v=${videoId}`,
      tokensUsed,
      model: modelUsed,
      generatedAt: new Date().toISOString(),
      ...(entryId && { journalEntryId: entryId }),
    }

    if (isTestMode || !hasPublicSupabase()) {
      const noteId = buildLocalNoteId()
      return NextResponse.json<VideoSummarizeResponse>({
        noteId,
        noteTitle,
        summary: htmlSummary,
        tokensUsed,
        model: modelUsed,
        isLocal: true,
      })
    }

    console.log('[Video Summarize] Creating note...')
    const notePayload: NotesInsert = {
      user_id: userId!,
      title: noteTitle,
      content: htmlSummary,
      note_type: 'custom',
      metadata,
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Supabase type generation is not available in this edge runtime; payload matches runtime schema
    const { data: note, error: noteError } = await supabase!
      .from('notes')
      .insert(notePayload)
      .select('id')
      .single()

    if (noteError || !note) {
      console.error('[Video Summarize] Failed to create note:', noteError)
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Failed to save summary. Please try again.',
          code: VideoSummarizeErrorCode.NOTE_CREATION_FAILED,
        },
        { status: 500 }
      )
    }

    // 7. Log usage
    console.log('[Video Summarize] Request completed', {
      userId,
      videoId,
      noteId: note.id,
      tokensUsed,
      summaryLength: htmlSummary.length,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json<VideoSummarizeResponse>({
      noteId: note.id,
      noteTitle,
      summary: htmlSummary,
      tokensUsed,
      model: modelUsed,
    })

  } catch (error: unknown) {
    console.error('[Video Summarize] Error occurred:', {
      error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
    })

    // Handle OpenAI rate limit
    if (error && typeof error === 'object' && 'response' in error) {
      const errorResponse = error as { response?: { status?: number } }
      if (errorResponse.response?.status === 429) {
        return NextResponse.json<ErrorResponse>(
          { error: 'AI rate limit reached. Please try again later.', code: VideoSummarizeErrorCode.OPENAI_RATE_LIMIT },
          { status: 429 }
        )
      }
    }

    // JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid request body', code: VideoSummarizeErrorCode.INVALID_REQUEST },
        { status: 400 }
      )
    }

    // Generic error
    const isDev = process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview'
    return NextResponse.json<ErrorResponse>(
      {
        error: 'Failed to generate video summary. Please try again.',
        code: VideoSummarizeErrorCode.INTERNAL_ERROR,
        ...(isDev && { details: error instanceof Error ? error.message : String(error) }),
      },
      { status: 500 }
    )
  }
}
