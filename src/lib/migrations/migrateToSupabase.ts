/**
 * Migration script for Story 2.3.6: Unified Note Data Model
 *
 * Migrates localStorage data (journal entries + notes) to Supabase
 * with the unified notes table schema.
 *
 * Key fixes:
 * - existingTitles accumulator outside loop (prevents same-day collisions)
 * - Auto-generated titles for journal entries
 * - UUID generation with legacy ID preservation
 * - User ID assignment for all records
 */

import { createClient } from '@/lib/supabase'
import { generateJournalTitle } from '@/utils/generateJournalTitle'

// ============================================================================
// Type Definitions
// ============================================================================

export interface JournalEntry {
  id: string
  date: string
  content: string
  lastModified: string
  isSample?: boolean
}

export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  userId?: string
  type: 'values' | 'beliefs' | 'aims' | 'regular'
  isPinned: boolean
}

export interface Link {
  sourceId: string
  targetId: string
  linkType: string
  createdAt: string
}

export interface MigrationProgress {
  current: number
  total: number
  stage: 'journal' | 'notes' | 'links' | 'content' | 'cleanup'
}

export interface MigrationResult {
  success: boolean
  migratedCount: number
  idMapping: Map<string, string>
  errors: Array<{ record: any; error: string }>
}

// ============================================================================
// Main Migration Function
// ============================================================================

/**
 * Migrates all localStorage data to Supabase for a given user.
 *
 * @param userId - The authenticated Supabase user ID
 * @param onProgress - Optional callback for progress updates
 * @returns Migration result with success status, counts, and error details
 */
export async function migrateLocalStorageToSupabase(
  userId: string,
  onProgress?: (progress: MigrationProgress) => void
): Promise<MigrationResult> {
  const supabase = createClient()
  const result: MigrationResult = {
    success: false,
    migratedCount: 0,
    idMapping: new Map(),
    errors: []
  }

  try {
    // Load all localStorage data
    const journalEntries = getLocalStorageJournalEntries()
    const notes = getLocalStorageNotes()
    const links = getLocalStorageLinks()
    const total = journalEntries.length + notes.length

    // ========================================================================
    // Stage 1: Migrate Journal Entries
    // ========================================================================
    // CRITICAL: Keep existingTitles outside loop to prevent same-day collisions
    const existingTitles: string[] = []
    let current = 0

    for (const entry of journalEntries) {
      try {
        const newId = await migrateJournalEntry(
          entry,
          userId,
          existingTitles,
          supabase
        )
        result.idMapping.set(entry.id, newId)
        result.migratedCount++
        onProgress?.({ current: ++current, total, stage: 'journal' })
      } catch (error) {
        result.errors.push({
          record: entry,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // ========================================================================
    // Stage 2: Migrate Notes
    // ========================================================================
    for (const note of notes) {
      try {
        const newId = await migrateNote(note, userId, supabase)
        result.idMapping.set(note.id, newId)
        result.migratedCount++
        onProgress?.({ current: ++current, total, stage: 'notes' })
      } catch (error) {
        result.errors.push({
          record: note,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    // ========================================================================
    // Stage 3: Migrate Links
    // ========================================================================
    onProgress?.({ current, total, stage: 'links' })
    await migrateLinks(links, result.idMapping, userId, supabase)

    // ========================================================================
    // Stage 4: Update Content References
    // ========================================================================
    onProgress?.({ current, total, stage: 'content' })
    await updateContentReferences(result.idMapping, userId, supabase)

    // ========================================================================
    // Stage 5: Cleanup
    // ========================================================================
    onProgress?.({ current, total, stage: 'cleanup' })

    // Only clear localStorage if migration was successful
    if (result.errors.length === 0) {
      clearLocalStorage()
      localStorage.setItem('migration-completed', 'true')
      localStorage.setItem(
        'migration-id-mapping',
        JSON.stringify(Array.from(result.idMapping.entries()))
      )
      result.success = true
    } else {
      console.error('Migration completed with errors:', result.errors)
    }
  } catch (error) {
    console.error('Migration failed:', error)
    result.errors.push({
      record: null,
      error: error instanceof Error ? error.message : String(error)
    })
  }

  return result
}

// ============================================================================
// Migration Helpers
// ============================================================================

/**
 * Migrates a single journal entry to Supabase notes table.
 * Generates title and assigns UUID.
 */
async function migrateJournalEntry(
  entry: JournalEntry,
  userId: string,
  existingTitles: string[],
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  // Generate title using hybrid strategy
  const title = generateJournalTitle(entry, {
    useContentPreview: true,
    existingTitles
  })

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title,
      content: entry.content,
      note_type: 'journal-entry',
      is_pinned: false,
      metadata: {
        journalDate: entry.date,
        legacyId: entry.id,
        isSample: entry.isSample || false
      },
      created_at: entry.lastModified,
      updated_at: entry.lastModified
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to migrate journal entry ${entry.id}: ${error.message}`)
  }

  // Accumulate title to prevent collisions
  existingTitles.push(title)

  return data.id
}

/**
 * Migrates a single note to Supabase notes table.
 * Maps legacy 'type' field to new 'note_type' field.
 */
async function migrateNote(
  note: Note,
  userId: string,
  supabase: ReturnType<typeof createClient>
): Promise<string> {
  // Map legacy type to new noteType
  const noteTypeMapping: Record<string, string> = {
    regular: 'custom',
    values: 'ontology-value',
    beliefs: 'ontology-belief',
    aims: 'ontology-aim'
  }

  const noteType = noteTypeMapping[note.type] || 'custom'

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title: note.title,
      content: note.content,
      note_type: noteType,
      is_pinned: note.isPinned,
      metadata: {
        legacyId: note.id,
        legacyType: note.type
      },
      created_at: note.createdAt,
      updated_at: note.updatedAt
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to migrate note ${note.id}: ${error.message}`)
  }

  return data.id
}

/**
 * Migrates links table with updated UUID references.
 */
async function migrateLinks(
  links: Link[],
  idMapping: Map<string, string>,
  userId: string,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  for (const link of links) {
    const sourceId = idMapping.get(link.sourceId)
    const targetId = idMapping.get(link.targetId)

    // Skip if either ID wasn't migrated
    if (!sourceId || !targetId) {
      console.warn(`Skipping link ${link.sourceId} -> ${link.targetId}: Missing mapped IDs`)
      continue
    }

    const { error } = await supabase.from('links').insert({
      source_note_id: sourceId,
      target_note_id: targetId,
      link_type: link.linkType || 'created_from',
      user_id: userId,
      created_at: link.createdAt
    })

    if (error) {
      console.error(`Failed to migrate link ${link.sourceId} -> ${link.targetId}:`, error)
    }
  }
}

/**
 * Updates HTML content to replace legacy note IDs with new UUIDs.
 * Fixes data-note-id attributes in hyperlinks.
 */
async function updateContentReferences(
  idMapping: Map<string, string>,
  userId: string,
  supabase: ReturnType<typeof createClient>
): Promise<void> {
  // Fetch all notes that might contain links
  const { data: notes, error } = await supabase
    .from('notes')
    .select('id, content')
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to fetch notes for content update:', error)
    return
  }

  // Update each note's content with new UUIDs
  for (const note of notes || []) {
    const updatedContent = updateHtmlLinkReferences(note.content, idMapping)

    // Only update if content changed
    if (updatedContent !== note.content) {
      const { error: updateError } = await supabase
        .from('notes')
        .update({ content: updatedContent })
        .eq('id', note.id)

      if (updateError) {
        console.error(`Failed to update content for note ${note.id}:`, updateError)
      }
    }
  }
}

/**
 * Replaces data-note-id attributes in HTML with new UUIDs.
 */
function updateHtmlLinkReferences(
  content: string,
  idMapping: Map<string, string>
): string {
  return content.replace(
    /data-note-id="([^"]+)"/g,
    (match, legacyId) => {
      const newUuid = idMapping.get(legacyId)
      return newUuid ? `data-note-id="${newUuid}"` : match
    }
  )
}

// ============================================================================
// localStorage Access Functions
// ============================================================================

function getLocalStorageJournalEntries(): JournalEntry[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem('journal-entries')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading journal entries from localStorage:', error)
    return []
  }
}

function getLocalStorageNotes(): Note[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem('signum-notes')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading notes from localStorage:', error)
    return []
  }
}

function getLocalStorageLinks(): Link[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem('signum-links')
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading links from localStorage:', error)
    return []
  }
}

function clearLocalStorage(): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem('journal-entries')
  localStorage.removeItem('signum-notes')
  localStorage.removeItem('signum-links')
}

// ============================================================================
// Helper: Check if Migration Needed
// ============================================================================

/**
 * Checks if the current user has localStorage data that needs migration.
 */
export function needsMigration(): boolean {
  if (typeof window === 'undefined') return false

  const hasMigrated = localStorage.getItem('migration-completed')
  if (hasMigrated) return false

  const hasJournalEntries = !!localStorage.getItem('journal-entries')
  const hasNotes = !!localStorage.getItem('signum-notes')

  return hasJournalEntries || hasNotes
}
