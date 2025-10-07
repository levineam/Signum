/**
 * Unified Note type definitions for Story 2.3.6
 *
 * This replaces the old separate JournalEntry and Note interfaces
 * with a single unified model using a discriminator field (noteType).
 */

// ============================================================================
// Core Types
// ============================================================================

/**
 * Note type discriminator.
 * Determines the purpose and structure of a note.
 */
export type NoteType =
  | 'journal-entry'    // Daily journal entries (replaces old JournalEntry)
  | 'reflection'       // Notes created from highlighted text
  | 'ontology-value'   // AI-extracted personal value
  | 'ontology-belief'  // AI-extracted personal belief
  | 'ontology-aim'     // AI-extracted personal aim (todos/goals)
  | 'custom'           // User-created standalone note (replaces old 'regular')

/**
 * Link type for bidirectional relationships between notes.
 */
export type LinkType =
  | 'created_from'  // Source journal entry → target note
  | 'references'    // General reference relationship
  | 'related_to'    // Bidirectional related content

/**
 * Confidence level for AI-extracted ontology items.
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low'

// ============================================================================
// Metadata Interfaces
// ============================================================================

/**
 * Type-specific metadata stored in JSONB column.
 * Different note types use different subsets of these fields.
 */
export interface NoteMetadata {
  // For journal entries (note_type: 'journal-entry')
  journalDate?: string          // YYYY-MM-DD format
  prompt?: string               // ACT-inspired prompt shown to user

  // For reflections (note_type: 'reflection')
  sourceNoteId?: string         // UUID of source journal entry
  sourceQuote?: string          // Original highlighted text

  // For ontology items (note_type: 'ontology-*')
  confidence?: ConfidenceLevel  // AI confidence in extraction
  extractedFrom?: string[]      // Array of source note UUIDs
  aiReasoning?: string          // AI explanation for extraction
  items?: Array<{               // Structured ontology items with excerpts
    name: string
    confidence: ConfidenceLevel
    excerpts: Array<{
      noteId: string
      noteTitle: string
      excerpt: string
    }>
  }>

  // General metadata
  tags?: string[]               // User-defined tags
  isSample?: boolean            // True for demo/sample data
  legacyId?: string             // Original localStorage ID (for migration)

  // Legacy type mapping (for migration)
  legacyType?: 'values' | 'beliefs' | 'aims' | 'regular'
}

// ============================================================================
// Main Note Interface
// ============================================================================

/**
 * Unified Note interface.
 * Represents all types of content: journal entries, notes, ontology items.
 */
export interface Note {
  id: string                    // UUID
  userId: string                // Supabase auth user ID
  title: string                 // Display title (auto-generated for journal entries)
  content: string               // HTML content
  noteType: NoteType            // Discriminator field
  isPinned: boolean             // True for ontology cards
  metadata: NoteMetadata        // Type-specific data
  createdAt: string             // ISO timestamp
  updatedAt: string             // ISO timestamp (auto-updated by trigger)
}

// ============================================================================
// Link Interface
// ============================================================================

/**
 * Bidirectional link between notes.
 */
export interface Link {
  id: string                    // UUID
  sourceNoteId: string          // UUID of source note
  targetNoteId: string          // UUID of target note
  linkType: LinkType            // Relationship type
  userId: string                // Supabase auth user ID
  createdAt: string             // ISO timestamp
}

// ============================================================================
// Request/Response Interfaces
// ============================================================================

/**
 * Request to create a new note.
 */
export interface CreateNoteRequest {
  title: string
  content?: string
  noteType: NoteType
  isPinned?: boolean
  metadata?: Partial<NoteMetadata>
}

/**
 * Request to update an existing note.
 */
export interface UpdateNoteRequest {
  id: string
  title?: string
  content?: string
  isPinned?: boolean
  metadata?: Partial<NoteMetadata>
}

/**
 * Request to create a new link.
 */
export interface CreateLinkRequest {
  sourceNoteId: string
  targetNoteId: string
  linkType: LinkType
}

// ============================================================================
// Helper Type Guards
// ============================================================================

/**
 * Type guard to check if a note is a journal entry.
 */
export function isJournalEntry(note: Note): boolean {
  return note.noteType === 'journal-entry'
}

/**
 * Type guard to check if a note is an ontology item.
 */
export function isOntologyNote(note: Note): boolean {
  return ['ontology-value', 'ontology-belief', 'ontology-aim'].includes(note.noteType)
}

/**
 * Type guard to check if a note is a reflection.
 */
export function isReflection(note: Note): boolean {
  return note.noteType === 'reflection'
}

/**
 * Type guard to check if a note is a custom user note.
 */
export function isCustomNote(note: Note): boolean {
  return note.noteType === 'custom'
}

// ============================================================================
// Legacy Types (for backward compatibility during migration)
// ============================================================================

/**
 * @deprecated Use Note with noteType: 'journal-entry' instead
 */
export interface JournalEntry {
  id: string
  date: string
  content: string
  lastModified: string
  isSample?: boolean
}

/**
 * @deprecated Legacy note type values
 */
export type LegacyNoteType = 'values' | 'beliefs' | 'aims' | 'regular'

/**
 * Maps legacy note types to new unified note types.
 */
export const LEGACY_TYPE_MAPPING: Record<LegacyNoteType, NoteType> = {
  values: 'ontology-value',
  beliefs: 'ontology-belief',
  aims: 'ontology-aim',
  regular: 'custom'
}
