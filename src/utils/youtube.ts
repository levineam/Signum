/**
 * YouTube URL Detection and Parsing Utilities
 *
 * Provides functions to detect YouTube URLs, extract video IDs,
 * and generate embed URLs for the YouTube video embedding feature.
 */

// YouTube URL patterns that we support
const YOUTUBE_PATTERNS = [
  // Standard watch URLs: youtube.com/watch?v=VIDEO_ID
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:[^&]*&)*v=([a-zA-Z0-9_-]{11})/,
  // Short URLs: youtu.be/VIDEO_ID
  /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  // Embed URLs: youtube.com/embed/VIDEO_ID
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
]

// Video ID must be exactly 11 characters, alphanumeric with dash and underscore
const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/

/**
 * Validates that a string is a valid YouTube video ID
 *
 * @param videoId - The string to validate
 * @returns true if valid 11-character YouTube video ID
 */
export function validateVideoId(videoId: string): boolean {
  return VIDEO_ID_PATTERN.test(videoId)
}

/**
 * Extracts the YouTube video ID from a URL
 *
 * Supports multiple URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - URLs with additional query parameters
 *
 * @param url - The URL to extract the video ID from
 * @returns The 11-character video ID, or null if not a valid YouTube URL
 *
 * @example
 * extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
 * // Returns: 'dQw4w9WgXcQ'
 *
 * extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=30')
 * // Returns: 'dQw4w9WgXcQ'
 */
export function extractYouTubeVideoId(url: string): string | null {
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  return null
}

/**
 * Checks if a string contains a YouTube URL
 *
 * @param text - The text to check
 * @returns true if the text contains a YouTube URL
 */
export function isYouTubeUrl(text: string): boolean {
  return extractYouTubeVideoId(text) !== null
}

/**
 * Generates a privacy-enhanced YouTube embed URL
 *
 * Uses youtube-nocookie.com to reduce tracking. Includes recommended
 * embed parameters for better UX.
 *
 * @param videoId - The YouTube video ID
 * @returns The embed URL for use in an iframe
 *
 * @example
 * getEmbedUrl('dQw4w9WgXcQ')
 * // Returns: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1'
 */
export function getEmbedUrl(videoId: string): string {
  // Use youtube-nocookie.com for enhanced privacy
  // rel=0: Don't show related videos from other channels
  // modestbranding=1: Reduce YouTube branding
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`
}

/**
 * Represents a detected YouTube URL with its position in the text
 */
export interface DetectedYouTubeUrl {
  url: string
  videoId: string
  startIndex: number
  endIndex: number
}

/**
 * Detects all YouTube URLs in a text string
 *
 * Finds all YouTube URLs and returns their positions in the text.
 * Useful for inserting embeds at the correct locations.
 *
 * @param content - The text content to search
 * @returns Array of detected YouTube URLs with their positions
 *
 * @example
 * detectYouTubeUrls('Check out https://youtu.be/abc12345678 and https://youtube.com/watch?v=xyz98765432')
 * // Returns: [
 * //   { url: 'https://youtu.be/abc12345678', videoId: 'abc12345678', startIndex: 10, endIndex: 38 },
 * //   { url: 'https://youtube.com/watch?v=xyz98765432', videoId: 'xyz98765432', startIndex: 43, endIndex: 85 }
 * // ]
 */
export function detectYouTubeUrls(content: string): DetectedYouTubeUrl[] {
  const results: DetectedYouTubeUrl[] = []

  // Combined pattern to find any YouTube URL in text
  // This is more permissive for finding URLs, then we validate with extractYouTubeVideoId
  const urlPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?[^\s]*v=|embed\/)|youtu\.be\/)[a-zA-Z0-9_-]+[^\s]*/g

  let match
  while ((match = urlPattern.exec(content)) !== null) {
    const url = match[0]
    const videoId = extractYouTubeVideoId(url)

    if (videoId) {
      results.push({
        url,
        videoId,
        startIndex: match.index,
        endIndex: match.index + url.length,
      })
    }
  }

  return results
}

/**
 * Creates an HTML string for a YouTube embed
 *
 * Generates the HTML for embedding a YouTube video with proper
 * security attributes and responsive styling.
 *
 * @param videoId - The YouTube video ID
 * @returns HTML string for the embed container
 */
export function createEmbedHtml(videoId: string): string {
  const embedUrl = getEmbedUrl(videoId)

  return `<div class="youtube-embed-container" data-video-id="${videoId}">
  <iframe
    src="${embedUrl}"
    title="YouTube video player"
    frameborder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
    loading="lazy"
  ></iframe>
</div>`
}
