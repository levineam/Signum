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

import { useEffect, useState } from 'react'
import type { Config } from 'dompurify'

// DOMPurify instance - eagerly loaded on client side to avoid race conditions
let DOMPurify: typeof import('dompurify').default | null = null
let isLoading = false
let hookRegistered = false

// Subscribers to notify when DOMPurify loads
type Subscriber = () => void
const subscribers = new Set<Subscriber>()

const sanitizeConfig: Config = {
  // Allow common formatting tags used in rich text editor
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'b', 'i',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'a', 'span', 'div',
    'blockquote', 'code', 'pre',
    'mark', // For text highlighting (including Obsidian imports)
    'iframe', // For YouTube video embeds (filtered by domain in hook)
  ],
  // Allow safe attributes (style will be filtered via hook)
  ALLOWED_ATTR: [
    'href', 'title', 'class', 'style',
    'data-note-id', // For internal note links
    'data-target', // For Obsidian wikilinks
    'data-video-id', // For YouTube embed containers
    // Iframe-specific attributes (used for YouTube embeds)
    'src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen', 'loading',
  ],
  // Allow only safe protocols for links
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  // Keep relative links safe
  ALLOW_DATA_ATTR: false,
}

// Allowed domains for iframe src (YouTube only for security)
const ALLOWED_IFRAME_DOMAINS = [
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]

// Style filtering hook - registered once globally to avoid race conditions
// This hook filters style attributes to only allow safe styling properties
// Also filters iframe src to only allow trusted YouTube domains
const styleFilterHook = (node: Element, data: { attrName: string; attrValue: string; keepAttr?: boolean }) => {
  // Filter iframe src to only allow YouTube domains
  if (node.tagName === 'IFRAME' && data.attrName === 'src') {
    try {
      const url = new URL(data.attrValue)
      if (!ALLOWED_IFRAME_DOMAINS.includes(url.hostname)) {
        // Not a YouTube domain - strip the src attribute
        data.keepAttr = false
        return
      }
      // Additional check: must be an embed URL
      if (!url.pathname.startsWith('/embed/')) {
        data.keepAttr = false
        return
      }
    } catch {
      // Invalid URL - strip the attribute
      data.keepAttr = false
      return
    }
  }

  if (data.attrName === 'style' && data.attrValue) {
    // Parse the style attribute and filter to only allow safe properties
    const styles = data.attrValue.split(';').map(s => s.trim()).filter(Boolean)
    const allowedStyles = styles.filter(style => {
      const [prop, value] = style.split(':').map(s => s.trim())

      // Allow text-align with safe values
      if (prop === 'text-align') {
        return /^(left|right|center|justify)$/i.test(value)
      }

      // Allow background-color on mark tags for highlighting (hex colors only)
      if (prop === 'background-color' && node.tagName === 'MARK') {
        return /^#[0-9A-Fa-f]{6}$/i.test(value)
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
    // Notify all subscribers that DOMPurify is ready
    subscribers.forEach(callback => callback())
  }).catch(error => {
    console.error('Failed to load DOMPurify:', error)
  })
}

/**
 * React hook to track DOMPurify loading state
 *
 * Returns true when DOMPurify is loaded and ready to use.
 * Causes component to re-render when DOMPurify finishes loading.
 *
 * @returns boolean indicating whether DOMPurify is ready
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isDOMPurifyReady = useDOMPurifyReady()
 *
 *   if (!isDOMPurifyReady) {
 *     return <div>Loading...</div>
 *   }
 *
 *   return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
 * }
 * ```
 */
export function useDOMPurifyReady(): boolean {
  const [isReady, setIsReady] = useState(() => DOMPurify !== null)

  useEffect(() => {
    // If already loaded, no need to subscribe
    if (DOMPurify) {
      setIsReady(true)
      return
    }

    // Subscribe to be notified when DOMPurify loads
    const handleReady = () => setIsReady(true)
    subscribers.add(handleReady)

    // Check again in case it loaded between initial render and effect
    if (DOMPurify) {
      setIsReady(true)
    }

    // Cleanup: unsubscribe on unmount
    return () => {
      subscribers.delete(handleReady)
    }
  }, [])

  return isReady
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 *
 * This function MUST be called before rendering user-generated HTML with dangerouslySetInnerHTML.
 * It removes potentially malicious HTML/JS while preserving safe formatting.
 *
 * Filters style attributes to only allow text-align property with safe values.
 *
 * IMPORTANT: DOMPurify is loaded eagerly when this module initializes. On slow networks,
 * it may not be ready during first render. Use the useDOMPurifyReady() hook to ensure
 * your component re-renders once DOMPurify loads:
 *
 * ```tsx
 * function MyComponent({ content }: { content: string }) {
 *   const isDOMPurifyReady = useDOMPurifyReady()
 *
 *   return (
 *     <div dangerouslySetInnerHTML={{
 *       __html: isDOMPurifyReady ? sanitizeHtml(content) : ''
 *     }} />
 *   )
 * }
 * ```
 *
 * If called before DOMPurify loads, returns empty string as a safe fallback.
 * Components using useDOMPurifyReady() will automatically re-render with sanitized content
 * once DOMPurify finishes loading.
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML safe for rendering with dangerouslySetInnerHTML, or empty string if DOMPurify not loaded yet
 *
 * @example
 * ```tsx
 * function MyComponent({ content }: { content: string }) {
 *   const isDOMPurifyReady = useDOMPurifyReady()
 *
 *   if (!isDOMPurifyReady) {
 *     return <div className="text-muted-foreground">Loading...</div>
 *   }
 *
 *   return <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
 * }
 * ```
 */
export function sanitizeHtml(html: string): string {
  // If DOMPurify not loaded yet, return empty string as safe fallback
  // Components should use useDOMPurifyReady() hook to re-render when ready
  if (!DOMPurify) {
    return ''
  }

  // Use DOMPurify with the globally registered hook
  return DOMPurify.sanitize(html, sanitizeConfig)
}
