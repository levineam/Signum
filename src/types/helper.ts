/**
 * Helper System Type Definitions for Story 1.8.1
 *
 * Defines types for the Helper System database infrastructure,
 * including helper usage tracking and user preferences.
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Helper type discriminator.
 * Matches CHECK constraint in helper_usage table (Story 1.8.1, Codex fix #2).
 * Issue #18: Removed 'gentle-prompt' - only in-entry helpers remain.
 */
export type HelperType =
  | 'cbt-distortions'     // CBT Cognitive Distortions helper

// ============================================================================
// Helper Event Types (Discriminated Union)
// ============================================================================

/**
 * Base event structure for all helper events.
 */
interface BaseHelperEvent {
  type: string
  timestamp: string  // ISO timestamp
}

/**
 * Event: Helper opened by user.
 */
export interface HelperOpenedEvent extends BaseHelperEvent {
  type: 'helper_opened'
  data: {
    triggerSource: 'manual' | 'auto'  // How helper was triggered
  }
}

/**
 * Event: User selected items from helper.
 */
export interface HelperSelectionEvent extends BaseHelperEvent {
  type: 'helper_selection'
  data: {
    selectedCount: number
    selectedItems: string[]
  }
}

/**
 * Event: Helper content inserted into entry.
 */
export interface HelperInsertedEvent extends BaseHelperEvent {
  type: 'helper_inserted'
  data: {
    insertedText: string
    distortionCount?: number  // For CBT distortions helper
  }
}

/**
 * Event: User cleared all selections.
 */
export interface HelperClearedEvent extends BaseHelperEvent {
  type: 'helper_cleared'
  data: {
    previousSelectionCount: number
  }
}

/**
 * Event: User dismissed helper.
 */
export interface HelperDismissedEvent extends BaseHelperEvent {
  type: 'helper_dismissed'
  data: {
    dismissalReason?: 'manual' | 'auto' | 'timeout'
  }
}

/**
 * Discriminated union of all helper event types.
 */
export type HelperEvent =
  | HelperOpenedEvent
  | HelperSelectionEvent
  | HelperInsertedEvent
  | HelperClearedEvent
  | HelperDismissedEvent

// ============================================================================
// Metadata Interfaces
// ============================================================================

/**
 * Metadata structure for helper_usage table (stored in JSONB column).
 */
export interface HelperUsageMetadata {
  events: HelperEvent[]          // Event history for this helper interaction
  selectionCount: number         // Total items selected
  insertedText?: string          // Final text inserted (if any)
  distortionNames?: string[]     // For CBT distortions helper
  promptCategory?: string        // For gentle prompt helper
}

/**
 * User preferences for helper dismissal state.
 */
export interface DismissedHelpers {
  [helperType: string]: boolean  // Key: helper type, Value: dismissed or not
}

// ============================================================================
// Main Database Interfaces
// ============================================================================

/**
 * Helper usage record from database.
 * Matches helper_usage table schema (Story 1.8.1).
 */
export interface HelperUsage {
  id: string                     // UUID
  userId: string                 // Foreign key to auth.users
  entryId: string                // Foreign key to notes
  helperType: HelperType         // Type of helper used
  selectedItems: string[]        // Items selected (Codex fix #3: defaults to empty array)
  metadata: HelperUsageMetadata  // Event history and context
  insertedAt: string             // ISO timestamp (Codex fix #1: single timestamp column)
}

/**
 * User preferences from database.
 * Matches user_preferences table schema (Story 1.8.1).
 */
export interface UserPreferences {
  userId: string                 // Primary key, foreign key to auth.users
  dismissedHelpers: DismissedHelpers  // Helper dismissal state
  updatedAt: string              // ISO timestamp (auto-updated via trigger, Codex fix #4)
}

// ============================================================================
// Request/Response Interfaces
// ============================================================================

/**
 * Request to create a new helper usage record.
 */
export interface CreateHelperUsageRequest {
  helperType: HelperType
  entryId: string
  selectedItems: string[]        // Can be empty array (Codex fix #3)
  metadata: HelperUsageMetadata
}

/**
 * Response from creating helper usage.
 */
export interface HelperUsageResponse {
  success: boolean
  usage?: HelperUsage
  error?: string
}

/**
 * Request to update user preferences (dismiss helper).
 */
export interface UpdateUserPreferencesRequest {
  dismissedHelpers: Partial<DismissedHelpers>
}

/**
 * Response from updating user preferences.
 */
export interface UserPreferencesResponse {
  success: boolean
  preferences?: UserPreferences
  error?: string
}

// ============================================================================
// Helper Type Guards
// ============================================================================

/**
 * Type guard to check if a helper type is CBT distortions.
 */
export function isCBTDistortionsHelper(helperType: HelperType): boolean {
  return helperType === 'cbt-distortions'
}

/**
 * Type guard to check if an event is a helper opened event.
 */
export function isHelperOpenedEvent(event: HelperEvent): event is HelperOpenedEvent {
  return event.type === 'helper_opened'
}

/**
 * Type guard to check if an event is a helper selection event.
 */
export function isHelperSelectionEvent(event: HelperEvent): event is HelperSelectionEvent {
  return event.type === 'helper_selection'
}

/**
 * Type guard to check if an event is a helper inserted event.
 */
export function isHelperInsertedEvent(event: HelperEvent): event is HelperInsertedEvent {
  return event.type === 'helper_inserted'
}

/**
 * Type guard to check if an event is a helper cleared event.
 */
export function isHelperClearedEvent(event: HelperEvent): event is HelperClearedEvent {
  return event.type === 'helper_cleared'
}

/**
 * Type guard to check if an event is a helper dismissed event.
 */
export function isHelperDismissedEvent(event: HelperEvent): event is HelperDismissedEvent {
  return event.type === 'helper_dismissed'
}

// ============================================================================
// Helper Constants
// ============================================================================

/**
 * All available helper types (for UI dropdowns, validation, etc.)
 * Issue #18: Removed gentle-prompt - only in-entry helpers.
 */
export const HELPER_TYPES: HelperType[] = [
  'cbt-distortions'
]

/**
 * Human-readable labels for helper types.
 * Issue #18: Simplified to only in-entry helpers.
 */
export const HELPER_TYPE_LABELS: Record<HelperType, string> = {
  'cbt-distortions': 'CBT Cognitive Distortions'
}
