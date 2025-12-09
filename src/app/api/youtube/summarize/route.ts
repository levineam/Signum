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

import { createClient } from '@supabase/supabase-js'
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

// Edge runtime for longer timeout (25s+)
export const runtime = 'edge'

// Error codes for this endpoint
enum VideoSummarizeErrorCode {
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INVALID_VIDEO_ID = 'INVALID_VIDEO_ID',
  TRANSCRIPT_NOT_FOUND = 'TRANSCRIPT_NOT_FOUND',
  VIDEO_UNAVAILABLE = 'VIDEO_UNAVAILABLE',
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

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Unauthorized', code: VideoSummarizeErrorCode.AUTH_REQUIRED },
        { status: 401 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Video Summarize] Missing Supabase environment variables')
      return NextResponse.json<ErrorResponse>(
        { error: 'Server configuration error', code: VideoSummarizeErrorCode.SERVER_CONFIG_ERROR },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Unauthorized', code: VideoSummarizeErrorCode.AUTH_REQUIRED },
        { status: 401 }
      )
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

    // Validate video ID format
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Invalid video ID format', code: VideoSummarizeErrorCode.INVALID_VIDEO_ID },
        { status: 400 }
      )
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
            statusCode = 404
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
            errorCode = VideoSummarizeErrorCode.INTERNAL_ERROR
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

    // 4. Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('[Video Summarize] Missing OpenAI API key')
      return NextResponse.json<ErrorResponse>(
        { error: 'AI service not configured', code: VideoSummarizeErrorCode.AI_SERVICE_ERROR },
        { status: 500 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 20000, // 20 seconds
      maxRetries: 0,
    })

    // 5. Generate summary with OpenAI
    console.log('[Video Summarize] Calling OpenAI API...')
    const startTime = Date.now()

    try {
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

      const markdownSummary = completion.choices[0]?.message?.content || ''
      const tokensUsed = completion.usage?.total_tokens || 0

      // 6. Convert markdown to HTML
      console.log('[Video Summarize] Converting markdown to HTML...')
      const htmlSummary = await convertMarkdownToHtml(markdownSummary)

      // 7. Create note with summary
      const noteTitle = `Video Summary: ${videoId}`
      const metadata: VideoSummaryNoteMetadata = {
        sourceType: 'video',
        videoId,
        videoUrl: videoUrl || `https://www.youtube.com/watch?v=${videoId}`,
        tokensUsed,
        model: 'gpt-4o-mini',
        generatedAt: new Date().toISOString(),
        ...(entryId && { journalEntryId: entryId }),
      }

      console.log('[Video Summarize] Creating note...')
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: noteTitle,
          content: htmlSummary,
          note_type: 'custom',
          metadata,
        })
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

      // 8. Log usage
      console.log('[Video Summarize] Request completed', {
        userId: user.id,
        videoId,
        noteId: note.id,
        tokensUsed,
        summaryLength: htmlSummary.length,
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json<VideoSummarizeResponse>({
        noteId: note.id,
        summary: htmlSummary,
        tokensUsed,
        model: 'gpt-4o-mini',
      })

    } catch (error: unknown) {
      // Handle timeout errors
      if (error && typeof error === 'object' && 'name' in error && error.name === 'APIConnectionTimeoutError') {
        return NextResponse.json<ErrorResponse>(
          { error: 'Request timeout - AI took too long to respond', code: VideoSummarizeErrorCode.TIMEOUT },
          { status: 408 }
        )
      }
      throw error
    }

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
