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
import OpenAI, { APIError } from 'openai'
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

const TRANSCRIPT_TIMEOUT_MS = 8000

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

function escapeHtmlText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function fetchYouTubeTitle(videoId: string): Promise<string> {
  try {
    const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      `https://www.youtube.com/watch?v=${videoId}`
    )}&format=json`
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) return `Video: ${videoId}`
    const data = (await res.json()) as { title?: string }
    return data.title?.trim() || `Video: ${videoId}`
  } catch {
    return `Video: ${videoId}`
  }
}

function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  return `${m}:${String(ss).padStart(2, '0')}`
}

function buildTranscriptNoteHtml(args: {
  videoId: string
  videoUrl: string
  embedUrl: string
  transcriptSegments: { text: string; offset: number; duration: number }[]
}): string {
  const { videoId, videoUrl, embedUrl, transcriptSegments } = args
  const safeVideoId = escapeHtmlText(videoId)
  const safeVideoUrl = escapeHtmlText(videoUrl)
  const safeEmbedUrl = escapeHtmlText(embedUrl)

  const embedBlock = `<div class="youtube-embed-container" contenteditable="false" data-video-id="${safeVideoId}" data-video-url="${safeVideoUrl}"><iframe contenteditable="false" tabindex="-1" src="${safeEmbedUrl}" title="YouTube video player" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe><div class="youtube-embed-actions" contenteditable="false"><span class="youtube-summarize-btn" role="button" contenteditable="false" tabindex="-1" data-video-id="${safeVideoId}" data-video-url="${safeVideoUrl}">Summarize</span></div></div>`

  const transcriptLines = transcriptSegments
    .map((seg) => {
      const seconds = Math.floor(seg.offset / 1000)
      const ts = formatTimestamp(seconds)
      const safeText = escapeHtmlText(seg.text)
      return `<p><a class="youtube-timestamp" href="#yt=${safeVideoId}&t=${seconds}" data-video-id="${safeVideoId}" data-t="${seconds}">${ts}</a> ${safeText}</p>`
    })
    .join('')

  return `${embedBlock}<div class="youtube-transcript" data-video-id="${safeVideoId}"><h2>Transcript</h2>${transcriptLines}</div>`
}

function upsertSummaryIntoTranscriptNoteHtml(args: {
  noteHtml: string
  videoId: string
  summaryHtml: string
}): string {
  const { noteHtml, videoId, summaryHtml } = args

  // DOMParser is available in Edge runtime (Web API). If it fails, fall back to naive append.
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(noteHtml, 'text/html')

    const transcript = doc.querySelector(
      `.youtube-transcript[data-video-id="${CSS.escape(videoId)}"]`
    )
    const existingSummary = doc.querySelector(
      `.youtube-summary[data-video-id="${CSS.escape(videoId)}"]`
    ) as HTMLElement | null

    const summaryWrapper = doc.createElement('div')
    summaryWrapper.className = 'youtube-summary'
    summaryWrapper.setAttribute('data-video-id', videoId)
    summaryWrapper.innerHTML = `<h2>Summary</h2>${summaryHtml}`

    if (existingSummary) {
      existingSummary.replaceWith(summaryWrapper)
    } else if (transcript && transcript.parentNode) {
      transcript.parentNode.insertBefore(summaryWrapper, transcript)
    } else {
      // Best effort: put summary after the embed block if present, else append.
      const embed = doc.querySelector(
        `.youtube-embed-container[data-video-id="${CSS.escape(videoId)}"]`
      )
      if (embed && embed.parentNode) {
        embed.parentNode.insertBefore(summaryWrapper, embed.nextSibling)
      } else {
        doc.body.appendChild(summaryWrapper)
      }
    }

    return doc.body.innerHTML
  } catch {
    return `${noteHtml}<div class="youtube-summary" data-video-id="${escapeHtmlText(videoId)}"><h2>Summary</h2>${summaryHtml}</div>`
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
    const { videoId, videoUrl, entryId, targetNoteId } = body

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

    // Validate videoUrl if provided (must be YouTube domain and well-formed)
    if (videoUrl) {
      try {
        const parsedUrl = new URL(videoUrl)
        const hostname = parsedUrl.hostname.toLowerCase()
        const isYouTubeHost = hostname.includes('youtube.com') || hostname.includes('youtu.be')

        if (!isYouTubeHost) {
          return NextResponse.json<ErrorResponse>(
            { error: 'Invalid video URL domain', code: VideoSummarizeErrorCode.INVALID_REQUEST },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json<ErrorResponse>(
          { error: 'Invalid video URL format', code: VideoSummarizeErrorCode.INVALID_REQUEST },
          { status: 400 }
        )
      }
    }

    const effectiveVideoUrl = videoUrl || `https://www.youtube.com/watch?v=${videoId}`

    // 3. Fetch transcript
    console.log('[Video Summarize] Fetching transcript for video:', videoId)
    let transcriptText: string
    let transcriptSegments: { text: string; offset: number; duration: number }[] = []

    try {
      let timeoutId: NodeJS.Timeout | undefined
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new TranscriptError(
              'Transcript request timed out',
              TranscriptErrorCode.NETWORK_ERROR
            )
          )
        }, TRANSCRIPT_TIMEOUT_MS)
      })

      const result = await Promise.race([fetchTranscript(videoId), timeoutPromise])
      if (timeoutId) clearTimeout(timeoutId)
      transcriptText = result.text
      transcriptSegments = result.segments
      console.log('[Video Summarize] Transcript fetched, length:', transcriptText.length)
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
      const words = transcriptText.split(/\s+/).filter(Boolean)
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
            content: `Please summarize this YouTube video based on its transcript:\n\n${transcriptText}`,
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

    // 6. Summarize into an existing transcript note (preferred), or create one if needed.
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`
    const videoTitle = await fetchYouTubeTitle(videoId)
    const supabaseClient = supabase as SupabaseClient<Database> | null

    // Local/test mode: return a local note payload for the UI to store.
    if (isTestMode || !hasPublicSupabase() || !supabaseClient) {
      const noteId = buildLocalNoteId()
      const baseHtml = buildTranscriptNoteHtml({
        videoId,
        videoUrl: effectiveVideoUrl,
        embedUrl,
        transcriptSegments,
      })
      const updatedHtml = upsertSummaryIntoTranscriptNoteHtml({
        noteHtml: baseHtml,
        videoId,
        summaryHtml: htmlSummary,
      })
      return NextResponse.json<VideoSummarizeResponse>({
        noteId,
        noteTitle: videoTitle,
        summary: htmlSummary,
        noteHtml: updatedHtml,
        tokensUsed,
        model: modelUsed,
        isLocal: true,
      })
    }

    let noteIdToUpdate = targetNoteId || ''
    let noteTitleToUse = videoTitle
    let existingContent: string | null = null
    let existingMetadata: Record<string, unknown> | null = null

    if (noteIdToUpdate) {
      const { data: existing } = await supabaseClient
        .from('notes')
        .select('id, title, content, metadata')
        .eq('id', noteIdToUpdate)
        .eq('user_id', userId!)
        .maybeSingle()
      if (!existing) {
        return NextResponse.json<ErrorResponse>(
          { error: 'Note not found', code: VideoSummarizeErrorCode.INVALID_REQUEST },
          { status: 404 }
        )
      }
      noteTitleToUse = existing.title
      existingContent = existing.content ?? ''
      existingMetadata = (existing.metadata as unknown as Record<string, unknown>) ?? null
    } else {
      // Find existing transcript note for this video.
      const { data: existingTranscriptNote } = await supabaseClient
        .from('notes')
        .select('id, title, content, metadata')
        .eq('user_id', userId!)
        .eq('note_type', 'custom')
        // Prefer transcript note marker so we don't match old summary-only notes.
        .contains(
          'metadata',
          { videoId, sourceType: 'video', hasTranscript: true } as Record<string, unknown>
        )
        .maybeSingle()

      if (existingTranscriptNote) {
        noteIdToUpdate = existingTranscriptNote.id
        noteTitleToUse = existingTranscriptNote.title
        existingContent = existingTranscriptNote.content ?? ''
        existingMetadata = (existingTranscriptNote.metadata as unknown as Record<string, unknown>) ?? null
      } else {
        // Create a new transcript note (single note model).
        const baseHtml = buildTranscriptNoteHtml({
          videoId,
          videoUrl: effectiveVideoUrl,
          embedUrl,
          transcriptSegments,
        })
        const initialHtml = upsertSummaryIntoTranscriptNoteHtml({
          noteHtml: baseHtml,
          videoId,
          summaryHtml: htmlSummary,
        })
        const metadata: Record<string, unknown> = {
          sourceType: 'video',
          videoId,
          videoUrl: effectiveVideoUrl,
          videoTitle,
          hasTranscript: true,
          hasSummary: true,
          tokensUsed,
          model: modelUsed,
          generatedAt: new Date().toISOString(),
          ...(entryId && { journalEntryId: entryId }),
        }

        const { data: created, error: createError } = await supabaseClient
          .from('notes')
          .insert({
            user_id: userId!,
            title: videoTitle,
            content: initialHtml,
            note_type: 'custom',
            metadata: metadata as unknown as VideoSummaryNoteMetadata,
          })
          .select('id')
          .single()

        if (createError || !created) {
          return NextResponse.json<ErrorResponse>(
            { error: 'Failed to save summary. Please try again.', code: VideoSummarizeErrorCode.NOTE_CREATION_FAILED },
            { status: 500 }
          )
        }

        return NextResponse.json<VideoSummarizeResponse>({
          noteId: created.id,
          noteTitle: videoTitle,
          summary: htmlSummary,
          noteHtml: initialHtml,
          tokensUsed,
          model: modelUsed,
        })
      }
    }

    // Update existing transcript note by inserting/replacing summary above transcript.
    const updatedHtml = upsertSummaryIntoTranscriptNoteHtml({
      noteHtml: existingContent || '',
      videoId,
      summaryHtml: htmlSummary,
    })

    const updatedMetadata: Record<string, unknown> = {
      ...(existingMetadata || {}),
      sourceType: 'video',
      videoId,
      videoUrl: effectiveVideoUrl,
      videoTitle,
      hasTranscript: true,
      hasSummary: true,
      tokensUsed,
      model: modelUsed,
      generatedAt: new Date().toISOString(),
      ...(entryId && { journalEntryId: entryId }),
    }

    const { error: updateError } = await supabaseClient
      .from('notes')
      .update({ content: updatedHtml, metadata: updatedMetadata as unknown as VideoSummaryNoteMetadata })
      .eq('id', noteIdToUpdate)
      .eq('user_id', userId!)

    if (updateError) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Failed to save summary. Please try again.', code: VideoSummarizeErrorCode.NOTE_CREATION_FAILED },
        { status: 500 }
      )
    }

    // 7. Log usage
    console.log('[Video Summarize] Request completed', {
      userId,
      videoId,
      noteId: noteIdToUpdate,
      tokensUsed,
      summaryLength: htmlSummary.length,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json<VideoSummarizeResponse>({
      noteId: noteIdToUpdate,
      noteTitle: noteTitleToUse,
      summary: htmlSummary,
      noteHtml: updatedHtml,
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
    if (error instanceof APIError && error.status === 429) {
      return NextResponse.json<ErrorResponse>(
        { error: 'AI rate limit reached. Please try again later.', code: VideoSummarizeErrorCode.OPENAI_RATE_LIMIT },
        { status: 429 }
      )
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
