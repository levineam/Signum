/**
 * Notes CRUD operations using Supabase.
 * Story 2.4: Migrated from localStorage to Supabase.
 *
 * Uses fixed user ID for prototype phase (unauthenticated access).
 */

import {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest
} from '@/types/note'
import * as supabaseNotes from '@/lib/supabase/notes'

// Fixed user ID for prototype phase (unauthenticated access)
// TODO: Replace with real auth when ready for production
const PROTOTYPE_USER_ID = '00000000-0000-0000-0000-000000000000'

/**
 * Get all notes (calls Supabase)
 */
export async function getNotes(): Promise<Note[]> {
  try {
    const [journal, regular, ontology] = await Promise.all([
      supabaseNotes.getJournalEntries(PROTOTYPE_USER_ID),
      supabaseNotes.getRegularNotes(PROTOTYPE_USER_ID),
      supabaseNotes.getOntologyNotes(PROTOTYPE_USER_ID)
    ])
    return [...journal, ...regular, ...ontology]
  } catch (error) {
    console.error('Error loading notes from Supabase:', error)
    return []
  }
}

/**
 * Create a new note (calls Supabase)
 */
export async function createNote(request: CreateNoteRequest): Promise<Note> {
  return await supabaseNotes.createNote(request, PROTOTYPE_USER_ID)
}

/**
 * Update an existing note (calls Supabase)
 */
export async function updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
  try {
    const updateRequest: UpdateNoteRequest = {
      id,
      title: updates.title,
      content: updates.content,
      isPinned: updates.isPinned,
      metadata: updates.metadata
    }
    return await supabaseNotes.updateNote(updateRequest, PROTOTYPE_USER_ID)
  } catch (error) {
    console.error('Error updating note:', error)
    return null
  }
}

/**
 * Delete a note (calls Supabase)
 */
export async function deleteNote(id: string): Promise<boolean> {
  try {
    await supabaseNotes.deleteNote(id, PROTOTYPE_USER_ID)
    return true
  } catch (error) {
    console.error('Error deleting note:', error)
    return false
  }
}

/**
 * Get a single note by ID (calls Supabase)
 */
export async function getNoteById(id: string): Promise<Note | null> {
  try {
    return await supabaseNotes.getNoteById(id, PROTOTYPE_USER_ID)
  } catch (error) {
    console.error('Error fetching note:', error)
    return null
  }
}

/**
 * Initialize pinned ontology notes (Values, Beliefs, Aims)
 * Creates any missing ontology notes individually to recover from partial data
 */
export async function initializePinnedNotes(): Promise<void> {
  try {
    // Check which ontology notes exist
    const existingOntology = await supabaseNotes.getOntologyNotes(PROTOTYPE_USER_ID)
    const existingTypes = new Set(existingOntology.map(note => note.noteType))

    // Define required ontology notes
    const requiredNotes: Array<{
      type: 'ontology-value' | 'ontology-belief' | 'ontology-aim'
      title: string
      content: string
    }> = [
      { type: 'ontology-value', title: 'Values', content: '' },
      { type: 'ontology-belief', title: 'Beliefs', content: '' },
      { type: 'ontology-aim', title: 'Aims', content: JSON.stringify({ todos: '', goals: '' }) }
    ]

    // Create missing notes individually
    for (const noteConfig of requiredNotes) {
      if (!existingTypes.has(noteConfig.type)) {
        await createNote({
          title: noteConfig.title,
          content: noteConfig.content,
          noteType: noteConfig.type,
          isPinned: true,
          metadata: {}
        })
      }
    }
  } catch (error) {
    console.error('Error initializing pinned notes:', error)
  }
}

/**
 * Get pinned ontology notes (Values, Beliefs, Aims)
 */
export async function getPinnedNotes(): Promise<Note[]> {
  try {
    return await supabaseNotes.getOntologyNotes(PROTOTYPE_USER_ID)
  } catch (error) {
    console.error('Error fetching pinned notes:', error)
    return []
  }
}

/**
 * Get regular notes (excluding pinned ontology notes)
 */
export async function getRegularNotes(): Promise<Note[]> {
  try {
    return await supabaseNotes.getRegularNotes(PROTOTYPE_USER_ID)
  } catch (error) {
    console.error('Error fetching regular notes:', error)
    return []
  }
}

/**
 * Store ontology items (for AI extraction - Story 2.4)
 * Handles deduplication by title (case-insensitive)
 */
export async function storeOntologyItems(
  items: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>[],
  noteType: 'ontology-value' | 'ontology-belief' | 'ontology-aim'
): Promise<Note[]> {
  try {
    const existingNotes = await supabaseNotes.getOntologyNotes(PROTOTYPE_USER_ID)

    // Create map of existing ontology notes by lowercase title
    const existingMap = new Map<string, Note>()
    existingNotes
      .filter(note => note.noteType === noteType)
      .forEach(note => {
        existingMap.set(note.title.toLowerCase(), note)
      })

    const createdNotes: Note[] = []
    const updatedNotes: Note[] = []

    // Process each item
    for (const item of items) {
      const lowercaseTitle = item.title.toLowerCase()
      const existing = existingMap.get(lowercaseTitle)

      if (existing) {
        // Update existing note
        const updateRequest: UpdateNoteRequest = {
          id: existing.id,
          content: item.content,
          metadata: {
            ...existing.metadata,
            ...item.metadata
          }
        }
        const updated = await supabaseNotes.updateNote(updateRequest, PROTOTYPE_USER_ID)
        updatedNotes.push(updated)
      } else {
        // Create new note
        const createRequest: CreateNoteRequest = {
          title: item.title,
          content: item.content,
          noteType: item.noteType,
          isPinned: item.isPinned,
          metadata: item.metadata
        }
        const created = await supabaseNotes.createNote(createRequest, PROTOTYPE_USER_ID)
        createdNotes.push(created)
      }
    }

    return [...createdNotes, ...updatedNotes]
  } catch (error) {
    console.error('Error storing ontology items:', error)
    return []
  }
}
