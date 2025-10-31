/**
 * Guest journaling types for unauthenticated users
 */

export interface GuestDraft {
  content: string        // HTML content from rich text editor
  lastModified: string   // ISO 8601 timestamp
  version: number        // Schema version for future migrations (current: 1)
}

export interface AuthModalState {
  dismissedAt: number    // Unix timestamp
  cooldownMs: number     // Cooldown duration in milliseconds (default: 60000)
}

export const GUEST_DRAFT_KEY = 'guest_journal_draft'
export const AUTH_MODAL_DISMISSED_KEY = 'auth_modal_dismissed'
export const MAX_DRAFT_SIZE = 50000  // 50KB in characters
export const DRAFT_WARNING_SIZE = 40000  // Warn at 40KB
export const IDLE_TIMER_MS = 2000  // 2 seconds
export const COOLDOWN_MS = 60000  // 60 seconds
