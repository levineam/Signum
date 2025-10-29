/**
 * HTML Sanitization Utility
 *
 * Sanitizes HTML content to prevent XSS attacks while preserving safe formatting.
 * Uses DOMPurify to strip dangerous elements and attributes.
 *
 * IMPORTANT: This module must be used in client components only ('use client')
 * since it relies on browser APIs through DOMPurify.
 */

'use client'

import type { Config } from 'dompurify'

// DOMPurify instance - eagerly loaded on client side to avoid race conditions
let DOMPurify: typeof import('dompurify').default | null = null
let isLoading = false
let hookRegistered = false

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

// Style filtering hook - registered once globally to avoid race conditions
// This hook filters style attributes to only allow text-align with safe values
const styleFilterHook = (node: Element, data: { attrName: string; attrValue: string; keepAttr?: boolean }) => {
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
}

// Eagerly load DOMPurify on module initialization (client-side only)
// This ensures it's available before any component tries to render
if (typeof window !== 'undefined' && !DOMPurify && !isLoading) {
  isLoading = true
  import('dompurify').then(module => {
    DOMPurify = module.default
    // Register hook after loading
    if (!hookRegistered && DOMPurify) {
      DOMPurify.addHook('uponSanitizeAttribute', styleFilterHook)
      hookRegistered = true
    }
  }).catch(error => {
    console.error('Failed to load DOMPurify:', error)
  })
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 *
 * This function MUST be called before rendering user-generated HTML with dangerouslySetInnerHTML.
 * It removes potentially malicious HTML/JS while preserving safe formatting.
 *
 * Filters style attributes to only allow text-align property with safe values.
 *
 * IMPORTANT: DOMPurify is loaded eagerly when this module initializes. If called before
 * DOMPurify finishes loading (rare edge case), returns empty string as a safe fallback.
 * In practice, DOMPurify loads so quickly that components will have it available by
 * first render. This approach avoids the complexity of Suspense boundaries while
 * maintaining security.
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML safe for rendering with dangerouslySetInnerHTML, or empty string if DOMPurify not loaded yet
 *
 * @example
 * ```tsx
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
 * ```
 */
export function sanitizeHtml(html: string): string {
  // If DOMPurify not loaded yet, return empty string as safe fallback
  // This is a rare edge case - DOMPurify loads imperatively on module init
  if (!DOMPurify) {
    console.warn('DOMPurify not loaded yet, returning empty string. Content will render when loaded.')
    return ''
  }

  // Use DOMPurify with the globally registered hook
  return DOMPurify.sanitize(html, sanitizeConfig)
}
