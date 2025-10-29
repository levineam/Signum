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

// Lazy-loaded DOMPurify instance
let DOMPurify: typeof import('dompurify').default | null = null
let loadingPromise: Promise<typeof import('dompurify').default> | null = null

// Load DOMPurify module (cached after first call)
function loadDOMPurify(): Promise<typeof import('dompurify').default> {
  if (DOMPurify) {
    return Promise.resolve(DOMPurify)
  }

  if (!loadingPromise) {
    loadingPromise = import('dompurify').then(module => {
      DOMPurify = module.default
      return module.default
    })
  }

  return loadingPromise
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

// Initialize DOMPurify and register hooks (blocks until ready)
// Uses React Suspense pattern - throws promise to suspend rendering until loaded
function ensureDOMPurifyReady(): typeof import('dompurify').default {
  if (typeof window === 'undefined') {
    // During SSR, throw error to prevent rendering
    // This should never happen since this is a 'use client' module
    throw new Error('sanitizeHtml() cannot be called during server-side rendering')
  }

  if (DOMPurify) {
    // Already loaded, register hook if needed
    if (!hookRegistered) {
      DOMPurify.addHook('uponSanitizeAttribute', styleFilterHook)
      hookRegistered = true
    }
    return DOMPurify
  }

  // Not loaded yet - throw promise to trigger Suspense
  // React will catch this promise and suspend rendering until it resolves
  throw loadDOMPurify().then(purify => {
    // Register hook after loading
    if (!hookRegistered) {
      purify.addHook('uponSanitizeAttribute', styleFilterHook)
      hookRegistered = true
    }
    return purify
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
 * IMPORTANT: This function uses React Suspense. If DOMPurify isn't loaded yet, it will
 * throw a promise to suspend rendering until DOMPurify is ready. This ensures XSS
 * protection is ALWAYS applied before HTML is rendered - never returns unsanitized HTML.
 *
 * Components using this function should be wrapped in a Suspense boundary:
 * ```tsx
 * <Suspense fallback={<div>Loading...</div>}>
 *   <ComponentUsingS anitizeHtml />
 * </Suspense>
 * ```
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
  // Ensure DOMPurify is loaded and hooks are registered
  // Throws promise for Suspense if not ready yet
  const purify = ensureDOMPurifyReady()

  // Use DOMPurify with the globally registered hook
  // At this point we're guaranteed DOMPurify is loaded
  return purify.sanitize(html, sanitizeConfig)
}
