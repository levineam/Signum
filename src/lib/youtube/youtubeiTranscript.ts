/**
 * YouTube transcript fetching via Innertube `youtubei/v1/get_transcript` (plugin-inspired).
 *
 * Edge-safe: no Node-only APIs (no Buffer). Implements a tiny protobuf encoder
 * for the specific `params` message used by the transcript endpoint.
 *
 * Inspired by obsidian-yt-transcript:
 * - https://github.com/lstrzepek/obsidian-yt-transcript
 */
import { validateVideoId } from '@/utils/youtube'
import type { TranscriptResult, TranscriptSegment } from './transcript'
import { TranscriptError, TranscriptErrorCode } from './transcript'

const WATCH_URL_BASE = 'https://www.youtube.com/watch?v='
const YOUTUBEI_GET_TRANSCRIPT_URL =
  'https://www.youtube.com/youtubei/v1/get_transcript?prettyPrint=false'

export interface YoutubeiTranscriptConfig {
  lang?: string // e.g. 'en'
  country?: string // e.g. 'US'
}

/**
 * Extract visitorData from a YouTube watch page HTML.
 */
export function extractVisitorData(html: string): string | null {
  const m = html.match(/"visitorData"\s*:\s*"([^"]+)"/)
  return m?.[1] ?? null
}

/**
 * Extract `getTranscriptEndpoint.params` from a YouTube watch page HTML.
 *
 * This intentionally avoids `eval()` for security. It uses a narrow regex around
 * the expected JSON shape.
 */
export function extractTranscriptParams(html: string): string | null {
  // Typical shape: "getTranscriptEndpoint":{"params":"..."}
  const m1 = html.match(
    /"getTranscriptEndpoint"\s*:\s*\{\s*"params"\s*:\s*"([^"]+)"/
  )
  if (m1?.[1]) return m1[1]

  // Some pages nest it without the quoted key (rare); keep conservative.
  const m2 = html.match(/getTranscriptEndpoint"\s*:\s*\{\s*"params"\s*:\s*"([^"]+)"/)
  return m2?.[1] ?? null
}

/**
 * Convert a Uint8Array to base64 (Edge-safe).
 */
function bytesToBase64(bytes: Uint8Array): string {
  // Chunk to avoid call stack limits on large arrays (ours are tiny).
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

function encodeVarint(value: number): number[] {
  const out: number[] = []
  let v = value >>> 0
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80)
    v >>>= 7
  }
  out.push(v)
  return out
}

function encodeString(fieldTag: number, text: string): number[] {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(text)
  return [fieldTag, ...encodeVarint(bytes.length), ...Array.from(bytes)]
}

function encodeVarintField(fieldTag: number, value: number): number[] {
  return [fieldTag, ...encodeVarint(value)]
}

/**
 * Generate the youtubei `params` payload (base64 w/ URL-encoded '=' -> %3D).
 *
 * Mirrors the plugin’s message layout:
 * 1: videoId (string)
 * 2: contextData (string; hard-coded)
 * 3: 1
 * 5: engagement panel id (string)
 * 6: field6Value (0|1)
 * 7: 1
 * 8: 1
 */
export function generateTranscriptParams(
  videoId: string,
  useAsrStyle: boolean,
  field6Value: 0 | 1
): string {
  // Field tags are already wire-encoded (fieldNumber << 3 | wireType).
  // string => wireType 2, varint => wireType 0.
  const TAG_F1_STRING = 10
  const TAG_F2_STRING = 18
  const TAG_F3_VARINT = 24
  const TAG_F5_STRING = 42
  const TAG_F6_VARINT = 48
  const TAG_F7_VARINT = 56
  const TAG_F8_VARINT = 64

  // Plugin hard-codes these. Keep identical for compatibility.
  const contextData = useAsrStyle ? 'CgNhc3ISAmVuGgA%3D' : 'CgASAmVuGgA%3D'
  const panelId = 'engagement-panel-searchable-transcript-search-panel'

  const bytes: number[] = []
  bytes.push(...encodeString(TAG_F1_STRING, videoId))
  bytes.push(...encodeString(TAG_F2_STRING, contextData))
  bytes.push(...encodeVarintField(TAG_F3_VARINT, 1))
  bytes.push(...encodeString(TAG_F5_STRING, panelId))
  bytes.push(...encodeVarintField(TAG_F6_VARINT, field6Value))
  bytes.push(...encodeVarintField(TAG_F7_VARINT, 1))
  bytes.push(...encodeVarintField(TAG_F8_VARINT, 1))

  const base64 = bytesToBase64(new Uint8Array(bytes))
  return base64.replace(/=/g, '%3D')
}

export function generateTranscriptParamVariants(videoId: string): string[] {
  return [
    generateTranscriptParams(videoId, true, 1),
    generateTranscriptParams(videoId, false, 0),
    generateTranscriptParams(videoId, true, 0),
    generateTranscriptParams(videoId, false, 1),
  ]
}

export interface YoutubeiTranscriptSegment {
  text: string
  startMs: number
  endMs: number
}

type YoutubeiTranscriptResponse = {
  actions?: Array<{
    updateEngagementPanelAction?: {
      content?: {
        transcriptRenderer?: {
          content?: {
            transcriptSearchPanelRenderer?: {
              body?: {
                transcriptSegmentListRenderer?: {
                  initialSegments?: unknown[]
                }
              }
            }
          }
        }
      }
    }
  }>
}

export function parseYoutubeiTranscriptResponse(json: unknown): YoutubeiTranscriptSegment[] {
  const root = json as YoutubeiTranscriptResponse
  const segments =
    root.actions?.[0]?.updateEngagementPanelAction?.content?.transcriptRenderer?.content
      ?.transcriptSearchPanelRenderer?.body?.transcriptSegmentListRenderer?.initialSegments

  if (!Array.isArray(segments)) return []

  const parsed: YoutubeiTranscriptSegment[] = []
  for (const seg of segments) {
    const cue = (seg as { transcriptSegmentRenderer?: unknown })?.transcriptSegmentRenderer as
      | {
          startMs?: string
          endMs?: string
          snippet?: { runs?: Array<{ text?: string }> }
        }
      | undefined
    const startMs = Number.parseInt(cue?.startMs ?? '', 10)
    const endMs = Number.parseInt(cue?.endMs ?? '', 10)
    const text = cue?.snippet?.runs?.[0]?.text ?? ''
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || !text) continue
    parsed.push({ text, startMs, endMs })
  }
  return parsed
}

async function fetchWatchPageHtml(videoId: string): Promise<string> {
  const url = `${WATCH_URL_BASE}${videoId}`
  const resp = await fetch(url, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      // Keep minimal; YouTube may vary output w/ Accept-Language.
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
  })

  if (!resp.ok) {
    if (resp.status === 404) {
      throw new TranscriptError(
        'Video is unavailable. It may be private, deleted, or region-restricted.',
        TranscriptErrorCode.VIDEO_UNAVAILABLE
      )
    }
    throw new TranscriptError(
      `Network error while fetching video page (${resp.status}). Please try again.`,
      TranscriptErrorCode.NETWORK_ERROR
    )
  }
  return await resp.text()
}

async function callYoutubeiGetTranscript(args: {
  videoId: string
  params: string
  visitorData?: string | null
  config?: YoutubeiTranscriptConfig
}): Promise<YoutubeiTranscriptSegment[]> {
  const { videoId, params, visitorData, config } = args

  const body = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20250701.01.00',
        hl: config?.lang ?? 'en',
        gl: config?.country ?? 'US',
        visitorData: visitorData ?? undefined,
      },
    },
    externalVideoId: videoId,
    params,
  }

  const resp = await fetch(YOUTUBEI_GET_TRANSCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'X-Youtube-Client-Name': '1',
      'X-Youtube-Client-Version': '2.20250701.01.00',
      ...(visitorData ? { 'X-Goog-EOM-Visitor-Id': visitorData } : {}),
      Origin: 'https://www.youtube.com',
      Referer: `${WATCH_URL_BASE}${videoId}`,
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
    },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    // YouTube may return 400/403 when params are invalid; treat as non-fatal.
    return []
  }

  let json: unknown
  try {
    json = await resp.json()
  } catch {
    return []
  }

  return parseYoutubeiTranscriptResponse(json)
}

export async function fetchTranscriptViaYoutubei(
  videoId: string,
  config?: YoutubeiTranscriptConfig
): Promise<TranscriptResult> {
  if (!validateVideoId(videoId)) {
    throw new TranscriptError('Invalid video ID format', TranscriptErrorCode.INVALID_VIDEO_ID)
  }

  let html: string
  try {
    html = await fetchWatchPageHtml(videoId)
  } catch (e) {
    if (e instanceof TranscriptError) throw e
    throw new TranscriptError(
      'Network error while fetching transcript. Please try again.',
      TranscriptErrorCode.NETWORK_ERROR,
      e instanceof Error ? e : undefined
    )
  }

  const visitorData = extractVisitorData(html)
  const pageParams = extractTranscriptParams(html)
  const candidates = pageParams ? [pageParams, ...generateTranscriptParamVariants(videoId)] : generateTranscriptParamVariants(videoId)

  for (const params of candidates) {
    try {
      const segs = await callYoutubeiGetTranscript({ videoId, params, visitorData, config })
      if (segs.length === 0) continue

      const segments: TranscriptSegment[] = segs.map((s) => ({
        text: s.text,
        offset: s.startMs,
        duration: Math.max(0, s.endMs - s.startMs),
      }))
      const fullText = segments.map((s) => s.text).join(' ')
      const last = segments[segments.length - 1]
      const durationSeconds = last ? Math.round((last.offset + last.duration) / 1000) : undefined
      return { text: fullText, segments, durationSeconds }
    } catch {
      // try next candidate
    }
  }

  throw new TranscriptError(
    'Transcript not available for this video. The video may not have captions enabled.',
    TranscriptErrorCode.TRANSCRIPT_NOT_FOUND
  )
}


