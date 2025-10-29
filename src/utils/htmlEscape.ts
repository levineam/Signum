/**
 * HTML Escape Utility
 *
 * Escapes HTML special characters to prevent XSS attacks when inserting
 * user-generated content into HTML strings.
 *
 * @param text - The text to escape
 * @returns The escaped text safe for insertion into HTML
 */
export function escapeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  }

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char])
}
