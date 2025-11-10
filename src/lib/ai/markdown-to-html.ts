/**
 * Markdown to HTML Conversion Utility
 *
 * Converts markdown-formatted AI responses to HTML for storage in the database.
 * This ensures consistent rendering in NoteViewer and reuses existing sanitization.
 *
 * Uses remark + remark-html for reliable markdown parsing and conversion.
 */

import { remark } from 'remark'
import html from 'remark-html'

/**
 * Converts markdown text to HTML
 *
 * @param markdown - The markdown string to convert
 * @returns HTML string ready for storage and rendering
 *
 * @example
 * ```typescript
 * const markdown = `## Hello World\n\nThis is **bold** text.`
 * const html = await convertMarkdownToHtml(markdown)
 * // Returns: <h2>Hello World</h2>\n<p>This is <strong>bold</strong> text.</p>
 * ```
 */
export async function convertMarkdownToHtml(markdown: string): Promise<string> {
  try {
    const result = await remark()
      .use(html, {
        sanitize: false, // We sanitize separately with DOMPurify in sanitizeHtml()
      })
      .process(markdown)

    return String(result)
  } catch (error) {
    console.error('[Markdown Conversion] Failed to convert markdown to HTML:', error)
    console.error('[Markdown Conversion] Input:', markdown)

    // Fallback: return original text wrapped in paragraph tag
    // This ensures content is never lost, even if markdown parsing fails
    return `<p>${markdown}</p>`
  }
}
