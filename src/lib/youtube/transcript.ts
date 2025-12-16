/**
 * YouTube Transcript Service
 *
 * Provides functions to fetch transcripts from YouTube videos.
 * Uses the youtube-transcript package to extract captions.
 */

import { YoutubeTranscript } from 'youtube-transcript'
import { validateVideoId } from '@/utils/youtube'
import { fetchTranscriptViaYoutubei } from '@/lib/youtube/youtubeiTranscript'

const TIMEDTEXT_BASE_URL = 'https://www.youtube.com/api/timedtext'
const DEFAULT_YT_HEADERS: Record<string, string> = {
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
  Accept: 'application/json,text/plain,*/*',
}

/**
 * A single transcript segment with text and timing
 */
export interface TranscriptSegment {
  text: string
  offset: number  // Start time in milliseconds
  duration: number  // Duration in milliseconds
}

/**
 * Result of fetching a transcript
 */
export interface TranscriptResult {
  text: string  // Full concatenated transcript
  segments: TranscriptSegment[]
  language?: string
  durationSeconds?: number
}

/**
 * Error codes for transcript fetching
 */
export enum TranscriptErrorCode {
  INVALID_VIDEO_ID = 'INVALID_VIDEO_ID',
  TRANSCRIPT_NOT_FOUND = 'TRANSCRIPT_NOT_FOUND',
  VIDEO_UNAVAILABLE = 'VIDEO_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error for transcript fetching issues
 */
export class TranscriptError extends Error {
  constructor(
    message: string,
    public code: TranscriptErrorCode,
    public cause?: Error
  ) {
    super(message)
    this.name = 'TranscriptError'
    // Ensure proper prototype chain for instanceof checks across compilation targets
    Object.setPrototypeOf(this, TranscriptError.prototype)
  }
}

type TimedTextJson3 = {
  events?: Array<{
    tStartMs?: number
    dDurationMs?: number
    segs?: Array<{ utf8?: string }>
  }>
}

function parseTimedTextJson3(json: TimedTextJson3): TranscriptSegment[] {
  const events = Array.isArray(json.events) ? json.events : []
  const segments: TranscriptSegment[] = []
  for (const e of events) {
    const start = typeof e.tStartMs === 'number' ? e.tStartMs : Number.NaN
    const dur = typeof e.dDurationMs === 'number' ? e.dDurationMs : Number.NaN
    const text = (e.segs ?? [])
      .map((s) => s.utf8 ?? '')
      .join('')
      .replace(/\n/g, ' ')
      .trim()
    if (!Number.isFinite(start) || !Number.isFinite(dur) || !text) continue
    segments.push({ text, offset: Math.round(start), duration: Math.round(dur) })
  }
  return segments
}

async function fetchTranscriptViaTimedText(args: {
  videoId: string
  lang: string
  kind?: 'asr'
}): Promise<TranscriptResult | null> {
  const { videoId, lang, kind } = args
  const url = new URL(TIMEDTEXT_BASE_URL)
  url.searchParams.set('v', videoId)
  url.searchParams.set('lang', lang)
  url.searchParams.set('fmt', 'json3')
  if (kind) url.searchParams.set('kind', kind)

  let resp: Response
  try {
    resp = await fetch(url.toString(), { method: 'GET', headers: DEFAULT_YT_HEADERS })
  } catch (e) {
    throw new TranscriptError(
      'Network error while fetching transcript. Please try again.',
      TranscriptErrorCode.NETWORK_ERROR,
      e instanceof Error ? e : undefined
    )
  }

  if (!resp.ok) {
    if (resp.status === 429 || resp.status === 403 || resp.status >= 500) {
      throw new TranscriptError(
        `Transcript temporarily unavailable (YouTube rate-limited/blocked our server). Try again later.`,
        TranscriptErrorCode.NETWORK_ERROR
      )
    }
    // Non-fatal for other statuses; treat as "no transcript"
    return null
  }

  const bodyText = await resp.text()
  if (!bodyText.trim()) return null

  let json: TimedTextJson3
  try {
    json = JSON.parse(bodyText) as TimedTextJson3
  } catch {
    return null
  }

  const segments = parseTimedTextJson3(json)
  if (segments.length === 0) return null

  const fullText = segments.map((s) => s.text).join(' ')
  const last = segments[segments.length - 1]
  const durationSeconds = last ? Math.round((last.offset + last.duration) / 1000) : undefined
  return { text: fullText, segments, language: lang, durationSeconds }
}

/**
 * Fetches the transcript for a YouTube video
 *
 * @param videoId - The YouTube video ID
 * @returns TranscriptResult with full text and segments
 * @throws TranscriptError if transcript cannot be fetched
 *
 * @example
 * ```typescript
 * try {
 *   const result = await fetchTranscript('dQw4w9WgXcQ')
 *   console.log(result.text) // Full transcript text
 * } catch (error) {
 *   if (error instanceof TranscriptError) {
 *     console.log(error.code) // e.g., 'TRANSCRIPT_NOT_FOUND'
 *   }
 * }
 * ```
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptResult> {
  // Validate video ID format
  if (!validateVideoId(videoId)) {
    throw new TranscriptError(
      'Invalid video ID format',
      TranscriptErrorCode.INVALID_VIDEO_ID
    )
  }

  try {
    // Attempt A (preferred): Innertube youtubei/v1/get_transcript (plugin-inspired)
    // Try multiple language variants before falling back to legacy library
    const languageVariants: Array<{ lang: string; country: string }> = [
      { lang: 'en', country: 'US' }, // Primary: English (US)
      { lang: 'en', country: 'GB' }, // Fallback: English (UK)
      { lang: '', country: 'US' },   // Try auto-detect language
    ]

    for (const config of languageVariants) {
      try {
        return await fetchTranscriptViaYoutubei(videoId, config)
      } catch (err) {
        // Don't fall through to legacy lib if we got a network error (403/429/blocked)
        // These indicate server-side blocking, not missing transcripts
        if (err instanceof TranscriptError) {
          if (err.code === TranscriptErrorCode.INVALID_VIDEO_ID) {
            throw err
          }
          if (err.code === TranscriptErrorCode.NETWORK_ERROR) {
            throw err
          }
          // For TRANSCRIPT_NOT_FOUND, try next language variant
          if (err.code === TranscriptErrorCode.TRANSCRIPT_NOT_FOUND) {
            continue // Try next language variant
          }
        }
        // For other errors, try next language variant
      }
    }

    // Attempt B (fallback): timedtext json3 endpoint (often works even when watch-page parsing fails)
    const timedTextLangs = ['en', 'en-US', 'en-GB']
    for (const lang of timedTextLangs) {
      try {
        const direct = await fetchTranscriptViaTimedText({ videoId, lang })
        if (direct) return direct
        const asr = await fetchTranscriptViaTimedText({ videoId, lang, kind: 'asr' })
        if (asr) return asr
      } catch (e) {
        if (e instanceof TranscriptError && e.code === TranscriptErrorCode.NETWORK_ERROR) {
          throw e
        }
        // otherwise keep trying
      }
    }

    // Attempt B (fallback): youtube-transcript library
    // This library may not have headers, so it's more likely to be blocked, but worth trying
    let rawTranscript
    try {
      rawTranscript = await YoutubeTranscript.fetchTranscript(videoId)
    } catch (fallbackError) {
      // Classify fallback errors before rethrowing
      const errorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
      const errorLower = errorMessage.toLowerCase()
      
      // Check for blocking/rate-limiting indicators
      if (
        errorLower.includes('429') ||
        errorLower.includes('rate limit') ||
        errorLower.includes('too many requests') ||
        errorLower.includes('403') ||
        errorLower.includes('forbidden') ||
        errorLower.includes('blocked') ||
        errorLower.includes('bot') ||
        errorLower.includes('consent') ||
        errorLower.includes('captcha') ||
        (fallbackError instanceof Error && 'status' in fallbackError && (fallbackError.status === 403 || fallbackError.status === 429))
      ) {
        throw new TranscriptError(
          'Transcript temporarily unavailable (YouTube rate-limited/blocked our server). Try again later.',
          TranscriptErrorCode.NETWORK_ERROR,
          fallbackError instanceof Error ? fallbackError : undefined
        )
      }
      // Re-throw to be handled by outer catch block
      throw fallbackError
    }

    if (!rawTranscript || rawTranscript.length === 0) {
      throw new TranscriptError(
        'Transcript not available for this video',
        TranscriptErrorCode.TRANSCRIPT_NOT_FOUND
      )
    }

    // Map to our segment format
    const segments: TranscriptSegment[] = rawTranscript.map((segment) => ({
      text: segment.text,
      offset: Math.round(segment.offset),
      duration: Math.round(segment.duration),
    }))

    // Concatenate all text with spaces
    const fullText = segments.map(s => s.text).join(' ')

    // Calculate total duration from last segment
    const lastSegment = segments[segments.length - 1]
    const durationSeconds = lastSegment
      ? Math.round((lastSegment.offset + lastSegment.duration) / 1000)
      : undefined

    return {
      text: fullText,
      segments,
      durationSeconds,
    }
  } catch (error) {
    // If already a TranscriptError, rethrow
    if (error instanceof TranscriptError) {
      throw error
    }

    // Parse common error messages from youtube-transcript
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorLower = errorMessage.toLowerCase()

    // Check for rate limiting / blocking indicators FIRST (before transcript-not-found)
    // These should be classified as NETWORK_ERROR, not TRANSCRIPT_NOT_FOUND
    if (
      errorLower.includes('429') ||
      errorLower.includes('rate limit') ||
      errorLower.includes('too many requests') ||
      errorLower.includes('403') ||
      errorLower.includes('forbidden') ||
      errorLower.includes('blocked') ||
      errorLower.includes('bot') ||
      errorLower.includes('consent') ||
      errorLower.includes('captcha') ||
      (error instanceof Error && 'status' in error && (error.status === 403 || error.status === 429))
    ) {
      throw new TranscriptError(
        'Transcript temporarily unavailable (YouTube rate-limited/blocked our server). Try again later.',
        TranscriptErrorCode.NETWORK_ERROR,
        error instanceof Error ? error : undefined
      )
    }

    if (errorMessage.includes('Could not find any transcripts') ||
        errorMessage.includes('No transcript found') ||
        errorMessage.includes('Transcript is disabled')) {
      throw new TranscriptError(
        'Transcript not available for this video. The video may not have captions enabled.',
        TranscriptErrorCode.TRANSCRIPT_NOT_FOUND,
        error instanceof Error ? error : undefined
      )
    }

    if (errorMessage.includes('Video unavailable') ||
        errorMessage.includes('private video') ||
        errorMessage.includes('This video is not available')) {
      throw new TranscriptError(
        'Video is unavailable. It may be private, deleted, or region-restricted.',
        TranscriptErrorCode.VIDEO_UNAVAILABLE,
        error instanceof Error ? error : undefined
      )
    }

    if (errorMessage.includes('network') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('fetch failed') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('ETIMEDOUT')) {
      throw new TranscriptError(
        'Network error while fetching transcript. Please try again.',
        TranscriptErrorCode.NETWORK_ERROR,
        error instanceof Error ? error : undefined
      )
    }

    // Unknown error
    throw new TranscriptError(
      'Failed to fetch transcript. Please try again later.',
      TranscriptErrorCode.UNKNOWN_ERROR,
      error instanceof Error ? error : undefined
    )
  }
}
