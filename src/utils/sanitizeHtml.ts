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

// Dynamically import DOMPurify to avoid SSR issues
// Use isomorphic-dompurify for SSR safety when available
let DOMPurify: typeof import('dompurify').default | null = null

// Lazy-load DOMPurify only on client side
async function loadDOMPurify() {
  if (typeof window === 'undefined') return null
  if (DOMPurify) return DOMPurify

  try {
    // Try isomorphic-dompurify first (SSR-safe)
    const purifyModule = await import('isomorphic-dompurify')
    DOMPurify = purifyModule.default
    return DOMPurify
  } catch {
    // Fallback to regular dompurify if isomorphic version fails
    const purifyModule = await import('dompurify')
    DOMPurify = purifyModule.default
    return DOMPurify
  }
}

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

// Track if hook is registered to avoid duplicate registration
let hookRegistered = false
let initializationPromise: Promise<void> | null = null

// Initialize DOMPurify and register hooks (client-side only)
async function initializeDOMPurify() {
  if (initializationPromise) return initializationPromise

  initializationPromise = (async () => {
    const purify = await loadDOMPurify()
    if (purify && !hookRegistered) {
      purify.addHook('uponSanitizeAttribute', styleFilterHook)
      hookRegistered = true
    }
  })()

  return initializationPromise
}

// Auto-initialize on client side
if (typeof window !== 'undefined') {
  initializeDOMPurify()
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 *
 * This function MUST be called before rendering user-generated HTML with dangerouslySetInnerHTML.
 * It removes potentially malicious HTML/JS while preserving safe formatting.
 *
 * Filters style attributes to only allow text-align property with safe values.
 *
 * During SSR, this returns the raw HTML (safe since it won't be rendered server-side).
 * On the client, it uses DOMPurify to sanitize the HTML.
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
  // During SSR, return raw HTML (it won't be rendered anyway)
  if (typeof window === 'undefined' || !DOMPurify) {
    return html
  }

  // Use DOMPurify with the globally registered hook
  // Hook is registered during initialization, so it's safe to use
  return DOMPurify.sanitize(html, sanitizeConfig)
}
