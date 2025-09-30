/**
 * Utility for generating titles for journal entries during migration.
 *
 * Strategy: Hybrid approach
 * 1. Try content preview first (semantic hook)
 * 2. Fall back to date-based title
 * 3. Add time suffix for same-day duplicates
 */

export interface JournalEntry {
  id: string
  date: string  // YYYY-MM-DD format
  content: string
  lastModified: string
  isSample?: boolean
}

export interface TitleGenerationOptions {
  /**
   * If true, attempts to use first meaningful sentence from content
   * Falls back to date-based title if content is empty/unsuitable
   */
  useContentPreview?: boolean

  /**
   * Array of existing titles to check for duplicates.
   * CRITICAL: Must be maintained outside the loop to prevent same-day collisions.
   */
  existingTitles?: string[]
}

/**
 * Generates a human-readable, deterministic title for a journal entry.
 *
 * @param entry - The journal entry to generate a title for
 * @param options - Configuration options
 * @returns A unique, human-readable title
 *
 * @example
 * // Content-based title
 * generateJournalTitle({
 *   date: '2024-09-30',
 *   content: 'Had an interesting conversation today.',
 *   ...
 * }, { useContentPreview: true })
 * // Returns: "Sep 30: Had an interesting conversation today"
 *
 * @example
 * // Date-based fallback (empty content)
 * generateJournalTitle({
 *   date: '2024-09-30',
 *   content: '',
 *   ...
 * })
 * // Returns: "Journal Entry - Monday, Sep 30, 2024"
 *
 * @example
 * // Same-day duplicate resolution
 * generateJournalTitle({
 *   date: '2024-09-30',
 *   content: '',
 *   lastModified: '2024-09-30T14:35:00Z',
 *   ...
 * }, { existingTitles: ['Journal Entry - Monday, Sep 30, 2024'] })
 * // Returns: "Journal Entry - Monday, Sep 30, 2024 (2:35 PM)"
 */
export function generateJournalTitle(
  entry: JournalEntry,
  options: TitleGenerationOptions = {}
): string {
  const { useContentPreview = false, existingTitles = [] } = options

  const date = new Date(entry.date)
  const shortDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })

  // Strategy 1: Try content-based title
  if (useContentPreview && entry.content.trim()) {
    const contentTitle = generateContentBasedTitle(entry.content, shortDate)
    if (contentTitle) {
      return contentTitle
    }
  }

  // Strategy 2: Fall back to date-based title
  return generateDateBasedTitle(date, entry.lastModified, existingTitles)
}

/**
 * Attempts to generate a title from the first meaningful sentence.
 * Returns null if content is unsuitable.
 */
function generateContentBasedTitle(content: string, shortDate: string): string | null {
  const plainText = stripHtml(content)

  // Find first sentence that's long enough to be meaningful
  const sentences = plainText.split(/[.!?]/)
  const firstSentence = sentences
    .map(s => s.trim())
    .find(s => s.length >= 10)  // Min 10 chars to be meaningful

  if (!firstSentence) {
    return null
  }

  // If sentence fits nicely, use it as-is
  if (firstSentence.length <= 60) {
    return `${shortDate}: ${firstSentence}`
  }

  // If too long, truncate with ellipsis
  return `${shortDate}: ${firstSentence.substring(0, 57)}...`
}

/**
 * Generates a deterministic date-based title with duplicate resolution.
 */
function generateDateBasedTitle(
  date: Date,
  lastModified: string,
  existingTitles: string[]
): string {
  const fullDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const baseTitle = `Journal Entry - ${fullDate}`

  // Check for same-day duplicate
  if (existingTitles.includes(baseTitle)) {
    const time = new Date(lastModified).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
    return `${baseTitle} (${time})`
  }

  return baseTitle
}

/**
 * Strips HTML tags and normalizes whitespace.
 * Preserves sentence structure for title extraction.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')      // Remove all HTML tags
    .replace(/&nbsp;/g, ' ')      // Replace non-breaking spaces
    .replace(/&[a-z]+;/gi, '')    // Remove HTML entities
    .replace(/\s+/g, ' ')         // Normalize whitespace
    .trim()
}
