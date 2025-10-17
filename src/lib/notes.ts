/**
 * Notes CRUD operations using Supabase.
 * Story 2.4.1: Authenticated data access with user-specific isolation.
 *
 * All functions require authenticated user ID from Supabase session.
 */

import {
  Note,
  CreateNoteRequest,
  UpdateNoteRequest
} from '@/types/note'
import * as supabaseNotes from '@/lib/supabase/notes'

/**
 * Get all notes for authenticated user (calls Supabase)
 */
export async function getNotes(userId: string): Promise<Note[]> {
  try {
    const [journal, regular, ontology] = await Promise.all([
      supabaseNotes.getJournalEntries(userId),
      supabaseNotes.getRegularNotes(userId),
      supabaseNotes.getOntologyNotes(userId)
    ])
    return [...journal, ...regular, ...ontology]
  } catch (error) {
    console.error('Error loading notes from Supabase:', error)
    return []
  }
}

/**
 * Create a new note for authenticated user (calls Supabase)
 */
export async function createNote(request: CreateNoteRequest, userId: string): Promise<Note> {
  return await supabaseNotes.createNote(request, userId)
}

/**
 * Update an existing note for authenticated user (calls Supabase)
 */
export async function updateNote(id: string, updates: Partial<Note>, userId: string): Promise<Note | null> {
  try {
    const updateRequest: UpdateNoteRequest = {
      id,
      title: updates.title,
      content: updates.content,
      isPinned: updates.isPinned,
      metadata: updates.metadata
    }
    return await supabaseNotes.updateNote(updateRequest, userId)
  } catch (error) {
    console.error('Error updating note:', error)
    return null
  }
}

/**
 * Delete a note for authenticated user (calls Supabase)
 */
export async function deleteNote(id: string, userId: string): Promise<boolean> {
  try {
    await supabaseNotes.deleteNote(id, userId)
    return true
  } catch (error) {
    console.error('Error deleting note:', error)
    return false
  }
}

/**
 * Get a single note by ID for authenticated user (calls Supabase)
 */
export async function getNoteById(id: string, userId: string): Promise<Note | null> {
  try {
    return await supabaseNotes.getNoteById(id, userId)
  } catch (error) {
    console.error('Error fetching note:', error)
    return null
  }
}

/**
 * Initialize pinned ontology notes (Values, Beliefs, Aims) for authenticated user
 * Creates any missing ontology notes individually to recover from partial data
 */
export async function initializePinnedNotes(userId: string): Promise<void> {
  try {
    // Check which ontology notes exist
    const existingOntology = await supabaseNotes.getOntologyNotes(userId)
    const existingTypes = new Set(existingOntology.map(note => note.noteType))

    // Define required ontology notes
    const requiredNotes: Array<{
      type: 'ontology-value' | 'ontology-belief' | 'ontology-aim'
      title: string
      content: string
    }> = [
      { type: 'ontology-value', title: 'Values', content: '' },
      { type: 'ontology-belief', title: 'Beliefs', content: '' },
      { type: 'ontology-aim', title: 'Goals', content: JSON.stringify({ todos: '', goals: '' }) }
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
        }, userId)
      }
    }
  } catch (error) {
    console.error('Error initializing pinned notes:', error)
  }
}

/**
 * Get pinned ontology notes (Values, Beliefs, Aims) for authenticated user
 */
export async function getPinnedNotes(userId: string): Promise<Note[]> {
  try {
    return await supabaseNotes.getOntologyNotes(userId)
  } catch (error) {
    console.error('Error fetching pinned notes:', error)
    return []
  }
}

/**
 * Get regular notes (excluding pinned ontology notes) for authenticated user
 */
export async function getRegularNotes(userId: string): Promise<Note[]> {
  try {
    return await supabaseNotes.getRegularNotes(userId)
  } catch (error) {
    console.error('Error fetching regular notes:', error)
    return []
  }
}

/**
 * Store ontology items (for AI extraction - Story 2.4.2) for authenticated user
 * Handles deduplication by title (case-insensitive)
 */
export async function storeOntologyItems(
  items: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>[],
  noteType: 'ontology-value' | 'ontology-belief' | 'ontology-aim',
  userId: string
): Promise<Note[]> {
  try {
    const existingNotes = await supabaseNotes.getOntologyNotes(userId)

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
        const updated = await supabaseNotes.updateNote(updateRequest, userId)
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
        const created = await supabaseNotes.createNote(createRequest, userId)
        createdNotes.push(created)
      }
    }

    return [...createdNotes, ...updatedNotes]
  } catch (error) {
    console.error('Error storing ontology items:', error)
    return []
  }
}
