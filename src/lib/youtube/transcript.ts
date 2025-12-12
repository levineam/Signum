/**
 * YouTube Transcript Service
 *
 * Provides functions to fetch transcripts from YouTube videos.
 * Uses the youtube-transcript package to extract captions.
 */

import { YoutubeTranscript } from 'youtube-transcript'
import { validateVideoId } from '@/utils/youtube'
import { fetchTranscriptViaYoutubei } from '@/lib/youtube/youtubeiTranscript'

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
    try {
      return await fetchTranscriptViaYoutubei(videoId, { lang: 'en', country: 'US' })
    } catch (err) {
      // Fall through to legacy lib as fallback (it occasionally succeeds when youtubei fails)
      if (err instanceof TranscriptError && err.code === TranscriptErrorCode.INVALID_VIDEO_ID) {
        throw err
      }
    }

    // Fetch transcript using youtube-transcript library
    const rawTranscript = await YoutubeTranscript.fetchTranscript(videoId)

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
        errorMessage.includes('fetch failed')) {
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
