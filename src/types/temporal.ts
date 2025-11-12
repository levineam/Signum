/**
 * Type definitions for unified Tasks & Reminders system (Epic 1.10, Phase 2)
 *
 * This implements the PRD-spec three-table schema:
 * - schedules: RFC 5545 recurrence patterns
 * - items: Tasks and reminders
 * - occurrences: Materialized recurring instances
 */

// ============================================================================
// ENUMs
// ============================================================================

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }
export type ItemType = 'task' | 'reminder'
export type ItemStatus = 'pending' | 'completed' | 'cancelled'
export type PriorityLevel = 'low' | 'medium' | 'high'

// ============================================================================
// Schedules (RFC 5545 Recurrence Rules)
// ============================================================================

/**
 * Defines a recurrence pattern using RFC 5545 (iCalendar) RRULE format.
 *
 * Examples:
 * - Daily: "FREQ=DAILY;INTERVAL=1"
 * - Weekly (Mon/Wed/Fri): "FREQ=WEEKLY;BYDAY=MO,WE,FR"
 * - Monthly (15th): "FREQ=MONTHLY;BYMONTHDAY=15"
 * - Yearly (birthday): "FREQ=YEARLY;BYMONTH=11;BYMONTHDAY=12"
 */
export interface Schedule {
  id: string
  userId: string

  // RFC 5545 recurrence rule
  rrule: string

  // IANA timezone (e.g., 'America/New_York', 'UTC')
  timezone: string

  // Exception dates (EXDATE) - dates to skip
  exceptionDates: string[] // ISO date strings: ['2025-11-25', '2025-12-25']

  // Additional dates (RDATE) - extra dates to include
  recurrenceDates: string[] // ISO date strings: ['2025-11-26']

  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}

// ============================================================================
// Items (Tasks and Reminders)
// ============================================================================

/**
 * Individual task or reminder.
 * Can be:
 * 1. One-time with due date (schedule_id = null, due_at set)
 * 2. Recurring (schedule_id set)
 * 3. No due date (reminder only, both null)
 */
export interface Item {
  id: string
  userId: string

  // Classification
  itemType: ItemType

  // Content
  title: string
  description?: string

  // Scheduling
  scheduleId?: string // Foreign key to schedules table
  dueAt?: string // ISO timestamp for one-time items

  // Task-specific fields
  priority?: PriorityLevel
  estimateMinutes?: number // Time estimate

  // Reminder-specific fields
  reminderTime?: string // ISO timestamp - when to remind
  snoozeUntil?: string // ISO timestamp - snoozed until

  // Status
  status: ItemStatus
  completedAt?: string // ISO timestamp

  // Extensible metadata
  metadata: Record<string, JsonValue>

  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}

// ============================================================================
// Occurrences (Materialized Recurring Instances)
// ============================================================================

/**
 * Represents a specific instance of a recurring item.
 *
 * Materialized for efficient querying of "what's due today" without
 * needing to calculate recurrence rules on every query.
 *
 * Supports per-instance overrides for title, description, due time, etc.
 */
export interface Occurrence {
  id: string
  userId: string
  itemId: string // Foreign key to items table

  // When this occurrence is scheduled
  scheduledAt: string // ISO timestamp

  // Instance-specific overrides (null = inherit from parent item)
  title?: string
  description?: string
  dueAt?: string // ISO timestamp
  reminderTime?: string // ISO timestamp

  // Status (per-instance)
  status: ItemStatus
  completedAt?: string // ISO timestamp

  // Skip flag
  isSkipped: boolean

  // Extensible metadata
  metadata: Record<string, JsonValue>

  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Request to create a new schedule
 */
export interface CreateScheduleRequest {
  rrule: string
  timezone: string
  exceptionDates?: string[]
  recurrenceDates?: string[]
}

/**
 * Request to update an existing schedule
 */
export interface UpdateScheduleRequest {
  id: string
  rrule?: string
  timezone?: string
  exceptionDates?: string[]
  recurrenceDates?: string[]
}

/**
 * Request to create a new item (task or reminder)
 */
export interface CreateItemRequest {
  itemType: ItemType
  title: string
  description?: string
  scheduleId?: string // For recurring items
  dueAt?: string // For one-time items
  priority?: PriorityLevel
  estimateMinutes?: number
  reminderTime?: string
  metadata?: Record<string, JsonValue>
}

/**
 * Request to update an existing item
 */
export interface UpdateItemRequest {
  id: string
  title?: string
  description?: string
  dueAt?: string
  priority?: PriorityLevel
  estimateMinutes?: number
  reminderTime?: string
  snoozeUntil?: string
  status?: ItemStatus
  metadata?: Record<string, JsonValue>
}

/**
 * Request to create a new occurrence (usually auto-generated)
 */
export interface CreateOccurrenceRequest {
  itemId: string
  scheduledAt: string
  title?: string // Override parent title
  description?: string // Override parent description
  dueAt?: string // Override parent dueAt
  reminderTime?: string // Override parent reminderTime
  metadata?: Record<string, JsonValue>
}

/**
 * Request to update an existing occurrence
 */
export interface UpdateOccurrenceRequest {
  id: string
  title?: string
  description?: string
  dueAt?: string
  reminderTime?: string
  status?: ItemStatus
  isSkipped?: boolean
  metadata?: Record<string, JsonValue>
}

// ============================================================================
// Query Types
// ============================================================================

/**
 * Query parameters for fetching items
 */
export interface ItemsQuery {
  itemType?: ItemType
  status?: ItemStatus
  priority?: PriorityLevel
  dueBefore?: string // ISO timestamp
  dueAfter?: string // ISO timestamp
  hasSchedule?: boolean // true = recurring, false = one-time
  search?: string // Full-text search on title/description
  limit?: number
  offset?: number
}

/**
 * Query parameters for fetching occurrences
 */
export interface OccurrencesQuery {
  itemId?: string
  status?: ItemStatus
  scheduledBefore?: string // ISO timestamp
  scheduledAfter?: string // ISO timestamp
  excludeSkipped?: boolean
  limit?: number
  offset?: number
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Combined view of an item with its schedule details
 */
export interface ItemWithSchedule extends Item {
  schedule?: Schedule
}

/**
 * Combined view of an occurrence with its parent item details
 */
export interface OccurrenceWithItem extends Occurrence {
  item: Item
}

/**
 * View for "What's Due Today" queries
 * Combines both one-time items and recurring occurrences
 */
export interface DueItem {
  id: string
  type: 'item' | 'occurrence'
  itemType: ItemType
  title: string
  description?: string
  dueAt?: string
  priority?: PriorityLevel
  status: ItemStatus
  isRecurring: boolean
  parentItemId?: string // For occurrences
}

// ============================================================================
// RRULE Helper Types
// ============================================================================

/**
 * Simplified RRULE builder parameters
 */
export interface RRuleParams {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  interval?: number // Default: 1
  count?: number // Number of occurrences
  until?: string // ISO date string (YYYYMMDD)
  byweekday?: string[] // ['MO', 'WE', 'FR']
  bymonthday?: number[] // [1, 15, 28]
  bymonth?: number[] // [1, 6, 12] for January, June, December
}

/**
 * Parsed RRULE components
 */
export interface ParsedRRule {
  freq: string
  interval: number
  count?: number
  until?: string
  byweekday?: string[]
  bymonthday?: number[]
  bymonth?: number[]
}
