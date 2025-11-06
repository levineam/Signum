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
  | 'gratitude'           // Three Good Things (Story 2.5.5)
  | 'values-affirmation'  // Values Affirmation (Story 2.5.6)
  | 'self-compassion'     // Self-Compassion Break (Story 2.5.7)
  | 'woop'                // WOOP Goal-Setting (Story 2.5.8)
  | 'best-possible-self'  // Best Possible Self Helper (Story 2.5.9)
  | 'savoring'            // Savoring Helper (Story 2.5.10)
  | 'loving-kindness'     // Loving-Kindness Meditation (Story 2.5.12)
  | 'morning'             // Morning Daily Practice (Story 2.10)
  | 'day-planning'        // Day Planning Helper (Story 2.11)

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
    fieldCompletionCount?: number  // For gratitude and other form-based helpers
    [key: string]: unknown  // Allow additional helper-specific fields
  }
}

/**
 * Event: User cleared all selections.
 */
export interface HelperClearedEvent extends BaseHelperEvent {
  type: 'helper_cleared'
  data: {
    previousSelectionCount?: number
    previousFieldCount?: number  // For form-based helpers
    [key: string]: unknown  // Allow additional helper-specific fields
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

  // ===============================
  // Story 2.5.5 — Gratitude helper
  // ===============================
  // Number of gratitude fields with content (e.g., 0–3 for Three Good Things)
  gratitudeFieldsCompleted?: number
  // Per-field character counts for gratitude inputs (ordered)
  gratitudeFieldCharCounts?: number[]

  // ======================================
  // Story 2.5.6 — Values Affirmation helper
  // ======================================
  // Which value was selected for affirmation (label or id)
  valuesSelectedValue?: string
  // Per-field character counts for values reflection inputs (ordered)
  valuesFieldCharCounts?: number[]

  // ====================================
  // Story 2.5.7 — Self-Compassion helper
  // ====================================
  // Character count for the described situation (telemetry)
  situationCharacterCount?: number
  // Whether the user affirmed completing the three compassion steps
  selfCompassionStepsAcknowledged?: boolean

  // ============================
  // Story 2.5.8 — WOOP helper
  // ============================
  // Character counts per WOOP step
  woopStepCounts?: {
    wish: number
    outcome: number
    obstacle: number
    plan: number
  }
  // Plan contains an if-then structure (simple heuristic detection)
  hasIfThenFormat?: boolean

  // ====================================
  // Story 2.5.9 — Best Possible Self helper
  // ====================================
  // Character and word counts for the future vision entry
  visionCharacterCount?: number
  visionWordCount?: number

  // ===============================
  // Story 2.5.10 — Savoring helper
  // ===============================
  // Selected savoring strategy and reflection stats
  savoringStrategy?: string
  reflectionCharacterCount?: number
  hasReflection?: boolean

  // ========================================================
  // Story 2.5.12 — Loving-Kindness Meditation helper
  // ========================================================
  // Recipient selection and name telemetry
  lkmRecipient?: 'Self' | 'Loved One' | 'Neutral Person' | 'Difficult Person'
  lkmPersonNamed?: boolean
  lkmNameLength?: number

  // ===================================
  // Story 2.11 — Day Planning helper
  // ===================================
  // Character counts for all 7 planning fields (ordered array)
  dayPlanningFieldCharCounts?: number[]
  // Number of fields completed (1-7)
  fieldCompletionCount?: number
  // If-then format detected in obstacle planning (Section 6)
  // hasIfThenFormat?: boolean  // Already defined above for WOOP
  // Time specification detected in time commitment (Section 4)
  hasTimeSpecification?: boolean
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
  'day-planning',        // Story 2.11 - First position for high visibility
  'morning',             // Story 2.10 - Morning Daily Practice
  'cbt-distortions',
  'gratitude',
  'values-affirmation',
  'self-compassion',
  'woop',
  'best-possible-self',
  'savoring',
  'loving-kindness'
]

/**
 * Human-readable labels for helper types.
 * Issue #18: Simplified to only in-entry helpers.
 */
export const HELPER_TYPE_LABELS: Record<HelperType, string> = {
  'day-planning': 'Day Planning Helper',           // Story 2.11
  'morning': 'Morning Daily Practice',             // Story 2.10
  'cbt-distortions': 'CBT Cognitive Distortions',
  'gratitude': 'Three Good Things',
  'values-affirmation': 'Values Affirmation',
  'self-compassion': 'Self-Compassion Break',
  'woop': 'WOOP Goal Planning',
  'best-possible-self': 'Best Possible Self',
  'savoring': 'Savoring Practice',
  'loving-kindness': 'Loving-Kindness Meditation'
}
