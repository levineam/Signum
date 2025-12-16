/**
 * YouTube Transcript API Route
 *
 * Fetches the transcript for a YouTube video.
 *
 * POST /api/youtube/transcript
 * Body: { videoId: string }
 * Returns: { transcript: string, segmentCount: number, durationSeconds?: number }
 */

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  fetchTranscript,
  TranscriptError,
  TranscriptErrorCode,
} from '@/lib/youtube/transcript'

// Use Node.js runtime for compatibility with youtube-transcript library
export const runtime = 'nodejs'

const isTestMode =
  ['1', 'true'].includes(process.env.E2E_TEST_MODE ?? '') ||
  ['1', 'true'].includes(process.env.NEXT_PUBLIC_E2E_TEST_MODE ?? '')

interface TranscriptRequest {
  videoId: string
}

export async function POST(request: Request) {
  try {
    // Validate Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if ((!supabaseUrl || !supabaseAnonKey) && !isTestMode) {
      console.error('[YouTube Transcript API] Missing Supabase environment variables')
      return NextResponse.json(
        { error: 'Server configuration error', code: 'SERVER_CONFIG_ERROR' },
        { status: 500 }
      )
    }

    // Authenticate user (skip in dev:test mode)
    if (!isTestMode) {
      const authHeader = request.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        )
      }

      const token = authHeader.split(' ')[1]
      const supabase = createClient(supabaseUrl!, supabaseAnonKey!, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      })

      const { data, error } = await supabase.auth.getUser()
      if (error || !data?.user) {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        )
      }
    }

    // Parse and validate request body
    const body: TranscriptRequest = await request.json()

    if (!body.videoId) {
      return NextResponse.json(
        { error: 'Video ID is required', code: 'MISSING_VIDEO_ID' },
        { status: 400 }
      )
    }

    // Fetch the transcript
    const result = await fetchTranscript(body.videoId)

    return NextResponse.json({
      transcript: result.text,
      segmentCount: result.segments.length,
      durationSeconds: result.durationSeconds,
    })
  } catch (error) {
    // Handle transcript-specific errors
    if (error instanceof TranscriptError) {
      const statusCode = getStatusCodeForError(error.code)
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
        },
        { status: statusCode }
      )
    }

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'INVALID_REQUEST' },
        { status: 400 }
      )
    }

    // Log unexpected errors
    console.error('[YouTube Transcript API] Unexpected error:', error)

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    )
  }
}

/**
 * Maps error codes to HTTP status codes
 */
function getStatusCodeForError(code: TranscriptErrorCode): number {
  switch (code) {
    case TranscriptErrorCode.INVALID_VIDEO_ID:
      return 400
    case TranscriptErrorCode.TRANSCRIPT_NOT_FOUND:
      return 404
    case TranscriptErrorCode.VIDEO_UNAVAILABLE:
      return 404
    case TranscriptErrorCode.NETWORK_ERROR:
      return 503
    case TranscriptErrorCode.UNKNOWN_ERROR:
    default:
      return 500
  }
}
