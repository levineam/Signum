import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Use Node.js runtime for OpenAI API calls (edge runtime has limitations)
export const runtime = 'nodejs'

// Increase timeout for Whisper API processing (default is 10s, we need more)
export const maxDuration = 60 // 60 seconds

// Maximum file size (4.5 MB to stay under serverless body limit)
const MAX_FILE_SIZE_BYTES = 4.5 * 1024 * 1024

// Supported audio MIME types
const SUPPORTED_MIME_TYPES = [
  'audio/webm',
  'audio/webm;codecs=opus',
  'audio/mp4',
  'audio/wav',
  'audio/mpeg',
  'audio/ogg',
]

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * POST /api/transcribe
 *
 * Transcribes audio using OpenAI Whisper API and cleans up the text with GPT-4.
 *
 * Request:
 * - Content-Type: audio/webm, audio/mp4, or audio/wav
 * - Body: Audio file (raw binary)
 * - Max size: 4.5 MB
 *
 * Response:
 * - 200: { text: string } - Transcribed and cleaned text
 * - 400: Invalid request (bad MIME type, file too large)
 * - 401: Unauthorized (not logged in)
 * - 429: Rate limit exceeded
 * - 500: Server error (Whisper/GPT API failure)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  console.log(`[transcribe:${requestId}] Request received`)

  try {
    // 1. Authenticate user (optional for now - Phase 7 will add stricter auth)
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.warn(`[transcribe:${requestId}] Auth error (continuing anyway):`, authError)
    }

    if (user) {
      console.log(`[transcribe:${requestId}] User authenticated: ${user.id}`)
    } else {
      console.warn(`[transcribe:${requestId}] No user found, but continuing (auth optional for now)`)
    }

    // 2. Validate Content-Type
    const contentType = request.headers.get('content-type') || ''
    const isValidMimeType = SUPPORTED_MIME_TYPES.some((type) =>
      contentType.toLowerCase().includes(type.toLowerCase())
    )

    if (!isValidMimeType) {
      console.error(`[transcribe:${requestId}] Invalid Content-Type: ${contentType}`)
      return NextResponse.json(
        { error: `Unsupported audio format. Supported: ${SUPPORTED_MIME_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // 3. Get audio data as ArrayBuffer
    const arrayBuffer = await request.arrayBuffer()
    const fileSize = arrayBuffer.byteLength

    console.log(`[transcribe:${requestId}] File size: ${fileSize} bytes (${(fileSize / 1024 / 1024).toFixed(2)} MB)`)

    // 4. Validate file size
    if (fileSize > MAX_FILE_SIZE_BYTES) {
      console.error(`[transcribe:${requestId}] File too large: ${fileSize} bytes`)
      return NextResponse.json(
        {
          error: `File too large. Maximum size: ${(MAX_FILE_SIZE_BYTES / 1024 / 1024).toFixed(1)} MB`,
        },
        { status: 400 }
      )
    }

    if (fileSize === 0) {
      console.error(`[transcribe:${requestId}] Empty file`)
      return NextResponse.json({ error: 'Empty audio file' }, { status: 400 })
    }

    // 5. Determine file extension based on MIME type
    let fileExtension = 'webm'
    if (contentType.includes('mp4')) {
      fileExtension = 'mp4'
    } else if (contentType.includes('wav')) {
      fileExtension = 'wav'
    } else if (contentType.includes('ogg')) {
      fileExtension = 'ogg'
    } else if (contentType.includes('mpeg')) {
      fileExtension = 'mp3'
    }

    // 6. Create File object for OpenAI API
    const audioFile = new File([arrayBuffer], `audio.${fileExtension}`, {
      type: contentType,
    })

    console.log(`[transcribe:${requestId}] Calling Whisper API (${fileExtension})...`)
    const whisperStartTime = Date.now()

    // 7. Call Whisper API for transcription
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // Optimize for English (can remove for auto-detection)
      response_format: 'text',
    })

    const whisperLatency = Date.now() - whisperStartTime
    console.log(`[transcribe:${requestId}] Whisper API completed in ${whisperLatency}ms`)
    console.log(`[transcribe:${requestId}] Raw transcription length: ${transcription.length} chars`)

    // 8. Clean up transcription with GPT-5 Mini (intent-based)
    console.log(`[transcribe:${requestId}] Calling GPT-5 Mini for intent cleanup...`)
    const gptStartTime = Date.now()

    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: `You are a journaling assistant. Clean up the transcribed text by:
1. Removing filler words ("um", "uh", "like", "you know")
2. Fixing grammar and punctuation
3. Preserving the user's authentic voice and meaning
4. Keeping the text concise and clear
5. Maintaining first-person perspective

Output ONLY the cleaned text, nothing else.`,
        },
        {
          role: 'user',
          content: transcription,
        },
      ],
      temperature: 0.3, // Low temperature for consistency
      max_completion_tokens: 500, // GPT-5 uses max_completion_tokens instead of max_tokens
    })

    const gptLatency = Date.now() - gptStartTime
    const cleanedText = completion.choices[0]?.message?.content?.trim() || transcription

    console.log(`[transcribe:${requestId}] GPT-5 Mini completed in ${gptLatency}ms`)
    console.log(`[transcribe:${requestId}] Cleaned text length: ${cleanedText.length} chars`)

    // 9. Log final metrics
    const totalLatency = Date.now() - startTime
    console.log(`[transcribe:${requestId}] Total latency: ${totalLatency}ms`)
    console.log(`[transcribe:${requestId}] Breakdown: Whisper ${whisperLatency}ms, GPT ${gptLatency}ms`)

    // 10. Return cleaned transcription
    return NextResponse.json(
      {
        text: cleanedText,
        metadata: {
          requestId,
          fileSize,
          whisperLatency,
          gptLatency,
          totalLatency,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    const totalLatency = Date.now() - startTime
    console.error(`[transcribe:${requestId}] Error after ${totalLatency}ms:`, error)

    // Handle OpenAI API errors
    if (error instanceof OpenAI.APIError) {
      console.error(`[transcribe:${requestId}] OpenAI API Error:`, {
        status: error.status,
        message: error.message,
        code: error.code,
      })

      return NextResponse.json(
        {
          error: 'Transcription service unavailable. Please try again.',
          details: error.message,
        },
        { status: error.status || 500 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 }
    )
  }
}
