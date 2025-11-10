/**
 * Markdown to HTML Conversion Utility
 *
 * Converts markdown-formatted AI responses to HTML for storage in the database.
 * This ensures consistent rendering in NoteViewer and reuses existing sanitization.
 *
 * Uses remark + remark-html for reliable markdown parsing and conversion.
 */

import { remark } from 'remark'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import type { Schema } from 'hast-util-sanitize'

// Allow the same general formatting tags that the client-side sanitizer permits.
// This prevents unsafe HTML (script tags, event handlers, etc.) from being stored
// while still letting legitimate formatting through.
const allowedTagNames = [
  'p', 'br', 'strong', 'em', 'u', 's', 'b', 'i',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'a', 'span', 'div',
  'blockquote', 'code', 'pre', 'mark'
]

const sanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: Array.from(new Set([...(defaultSchema.tagNames || []), ...allowedTagNames])),
  attributes: {
    ...defaultSchema.attributes,
    '*': Array.from(new Set([...(defaultSchema.attributes?.['*'] || []), 'className'])),
    a: Array.from(new Set([...(defaultSchema.attributes?.a || []), 'href', 'title', 'target', 'rel'])),
    span: Array.from(new Set([...(defaultSchema.attributes?.span || []), 'data-note-id'])),
    div: Array.from(new Set([...(defaultSchema.attributes?.div || []), 'data-note-id'])),
  },
  clobberPrefix: '',
  protocols: {
    ...defaultSchema.protocols,
    href: ['http', 'https', 'mailto', 'tel', 'sms', 'relative']
  }
}

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
      .use(remarkRehype, { allowDangerousHtml: false })
      .use(rehypeSanitize, sanitizeSchema)
      .use(rehypeStringify)
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
