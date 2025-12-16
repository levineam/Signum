/**
 * YouTube Transcript Note API Route
 *
 * Creates (or reuses) a single note for a YouTube video containing:
 * - Embedded video at top
 * - A "Summarize" action under the embed
 * - Timestamped transcript where clicking a timestamp seeks+autoplays
 *
 * POST /api/youtube/transcript-note
 * Body: { videoId: string, videoUrl?: string }
 * Returns: { noteId, noteTitle, html, isLocal? }
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { hasPublicSupabase } from '@/lib/supabase'
import {
  fetchTranscript,
  TranscriptError,
  TranscriptErrorCode,
} from '@/lib/youtube/transcript'
import { getEmbedUrl, validateVideoId } from '@/utils/youtube'

export const runtime = 'nodejs'

const isTestMode =
  ['1', 'true'].includes(process.env.E2E_TEST_MODE ?? '') ||
  ['1', 'true'].includes(process.env.NEXT_PUBLIC_E2E_TEST_MODE ?? '')

type TranscriptNoteRequest = {
  videoId: string
  videoUrl?: string
}

type TranscriptNoteResponse = {
  noteId: string
  noteTitle: string
  html: string
  isLocal?: boolean
  debugId?: string
}

type VideoTranscriptNoteMetadata = {
  sourceType: 'video'
  videoId: string
  videoUrl: string
  hasTranscript: true
  hasSummary: boolean
  generatedAt: string
  language?: string
  durationSeconds?: number
}

type NotesRow = {
  id: string
  user_id: string
  title: string
  content: string
  note_type: string
  metadata: VideoTranscriptNoteMetadata & Record<string, unknown>
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
  metadata?: VideoTranscriptNoteMetadata
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

function generateDebugId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `yt-transcript-${timestamp}-${random}`
}

function escapeHtmlText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatTimestamp(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  return `${m}:${String(ss).padStart(2, '0')}`
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

function buildTranscriptNoteHtml(args: {
  videoId: string
  videoUrl: string
  transcriptSegments: { text: string; offset: number; duration: number }[]
  embedUrl: string
}): string {
  const { videoId, videoUrl, transcriptSegments, embedUrl } = args
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

  // Wrap transcript so summarize endpoint can insert a summary before it.
  const transcriptBlock = `<div class="youtube-transcript" data-video-id="${safeVideoId}"><h2>Transcript</h2>${transcriptLines}</div>`

  return `${embedBlock}${transcriptBlock}`
}

export async function POST(request: NextRequest) {
  const debugId = generateDebugId()
  let videoId: string | undefined
  let videoUrl: string | undefined
  
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    let userId: string | null = null
    let supabase: SupabaseClient<Database> | null = null

    if (!isTestMode) {
      if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (!hasPublicSupabase()) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

      supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      })

      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = user.id
    } else {
      userId = 'test-user'
    }

    const body = (await request.json()) as TranscriptNoteRequest
    videoId = body.videoId

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
    }

    if (!validateVideoId(videoId)) {
      return NextResponse.json({ error: 'Invalid video ID format' }, { status: 400 })
    }

    // At this point videoId is validated, so videoUrl is always a concrete string.
    videoUrl = body.videoUrl || `https://www.youtube.com/watch?v=${videoId}`

    // If this is a real user environment, try to reuse an existing transcript note for this video.
    if (!isTestMode && supabase) {
      const { data: existingNote } = await supabase
        .from('notes')
        .select('id, title, content, metadata')
        .eq('user_id', userId!)
        .eq('note_type', 'custom')
        .contains(
          'metadata',
          { videoId, sourceType: 'video', hasTranscript: true } as Record<string, unknown>
        )
        .maybeSingle()

      if (existingNote) {
        return NextResponse.json<TranscriptNoteResponse>({
          noteId: existingNote.id,
          noteTitle: existingNote.title,
          html: existingNote.content ?? '',
        })
      }
    }

    const [title, transcript] = await Promise.all([
      fetchYouTubeTitle(videoId),
      fetchTranscript(videoId).catch((err) => {
        // Log structured error details for diagnostics
        const errorDetails = {
          debugId,
          videoId,
          videoUrl,
          errorName: err instanceof Error ? err.name : 'Unknown',
          errorCode: err instanceof TranscriptError ? err.code : undefined,
          errorMessage: err instanceof Error ? err.message : String(err),
          errorStack: err instanceof Error ? err.stack : undefined,
        }
        console.error('[YouTube Transcript Note] Transcript fetch failed:', JSON.stringify(errorDetails, null, 2))
        throw err
      }),
    ])

    const embedUrl = getEmbedUrl(videoId)
    const html = buildTranscriptNoteHtml({
      videoId,
      videoUrl,
      transcriptSegments: transcript.segments,
      embedUrl,
    })

    const metadata: VideoTranscriptNoteMetadata = {
      sourceType: 'video',
      videoId,
      videoUrl,
      hasTranscript: true,
      hasSummary: false,
      generatedAt: new Date().toISOString(),
      language: transcript.language,
      durationSeconds: transcript.durationSeconds,
    }

    if (isTestMode || !hasPublicSupabase()) {
      const noteId = buildLocalNoteId()
      return NextResponse.json<TranscriptNoteResponse>({
        noteId,
        noteTitle: title,
        html,
        isLocal: true,
        debugId,
      })
    }

    const { data: note, error: noteError } = await (supabase as SupabaseClient<Database>)
      .from('notes')
      .insert({
        user_id: userId!,
        title,
        content: html,
        note_type: 'custom',
        metadata,
      })
      .select('id')
      .single()

    if (noteError || !note) {
      return NextResponse.json({ error: 'Failed to create transcript note' }, { status: 500 })
    }

    return NextResponse.json<TranscriptNoteResponse>({
      noteId: note.id,
      noteTitle: title,
      html,
      debugId,
    })
  } catch (error) {
    // Log structured error details for diagnostics
    const errorDetails = {
      debugId,
      videoId: videoId || 'unknown',
      videoUrl: videoUrl || 'unknown',
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorCode: error instanceof TranscriptError ? error.code : undefined,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    }
    console.error('[YouTube Transcript Note] Error:', JSON.stringify(errorDetails, null, 2))

    if (error instanceof TranscriptError) {
      let statusCode = 500
      let message = error.message
      switch (error.code) {
        case TranscriptErrorCode.INVALID_VIDEO_ID:
          statusCode = 400
          break
        case TranscriptErrorCode.TRANSCRIPT_NOT_FOUND:
          statusCode = 422
          message = 'Transcript not found for this video'
          break
        case TranscriptErrorCode.VIDEO_UNAVAILABLE:
          statusCode = 404
          break
        case TranscriptErrorCode.NETWORK_ERROR:
          statusCode = 503
          message = 'Transcript temporarily unavailable (YouTube rate-limited/blocked our server). Try again later.'
          break
        case TranscriptErrorCode.UNKNOWN_ERROR:
        default:
          statusCode = 500
          break
      }
      return NextResponse.json({ error: message, code: error.code, debugId }, { status: statusCode })
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid request body', debugId }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to create transcript note', debugId }, { status: 500 })
  }
}

