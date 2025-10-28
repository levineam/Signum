/**
 * HTML Sanitization Utility
 *
 * Sanitizes HTML content to prevent XSS attacks while preserving safe formatting.
 * Uses DOMPurify to strip dangerous elements and attributes.
 *
 * IMPORTANT: This module must be used in client components only ('use client')
 * since it relies on browser APIs through DOMPurify.
 */

import DOMPurify from 'isomorphic-dompurify'
import type { Config } from 'dompurify'

const sanitizeConfig: Config = {
  // Allow common formatting tags used in rich text editor
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'b', 'i',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'span', 'div',
    'blockquote', 'code', 'pre'
  ],
  // Allow safe attributes (style will be filtered via hook)
  ALLOWED_ATTR: [
    'href', 'title', 'class', 'style',
    'data-note-id', // For internal note links
    'data-target', // For Obsidian wikilinks
  ],
  // Allow only safe protocols for links
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // Keep relative links safe
  ALLOW_DATA_ATTR: false,
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 *
 * This function MUST be called before rendering user-generated HTML with dangerouslySetInnerHTML.
 * It removes potentially malicious HTML/JS while preserving safe formatting.
 *
 * Filters style attributes to only allow text-align property with safe values.
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML safe for rendering with dangerouslySetInnerHTML
 *
 * @example
 * ```tsx
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
 * ```
 */
export function sanitizeHtml(html: string): string {
  // Clone DOMPurify to avoid affecting global hooks
  const purify = DOMPurify

  // Add a hook to filter style attributes to only allow text-align
  purify.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName === 'style' && data.attrValue) {
      // Parse the style attribute and filter to only allow text-align
      const styles = data.attrValue.split(';').map(s => s.trim()).filter(Boolean)
      const allowedStyles = styles.filter(style => {
        const [prop, value] = style.split(':').map(s => s.trim())
        // Only allow text-align with safe values
        if (prop === 'text-align') {
          return /^(left|right|center|justify)$/i.test(value)
        }
        return false
      })

      // Update the style attribute with only allowed styles
      data.attrValue = allowedStyles.join('; ')

      // If no allowed styles, remove the attribute
      if (!data.attrValue) {
        data.keepAttr = false
      }
    }
  })

  const sanitized = purify.sanitize(html, sanitizeConfig)

  // Remove the hook after use to avoid affecting other calls
  purify.removeAllHooks()

  return sanitized
}
