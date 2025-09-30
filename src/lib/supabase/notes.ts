/**
 * Supabase CRUD operations for the unified notes table.
 * Story 2.3.6: Replaces localStorage-based operations.
 */

import { createClient } from '@/lib/supabase'
import {
  Note,
  Link,
  CreateNoteRequest,
  UpdateNoteRequest,
  CreateLinkRequest,
  NoteType
} from '@/types/note'

// ============================================================================
// Note CRUD Operations
// ============================================================================

/**
 * Get all journal entries for a user, sorted by journal date (newest first).
 */
export async function getJournalEntries(userId: string): Promise<Note[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('note_type', 'journal-entry')
    .order('metadata->>journalDate', { ascending: false })

  if (error) {
    console.error('Error fetching journal entries:', error)
    throw error
  }

  return mapDatabaseNotesToNotes(data || [])
}

/**
 * Get regular notes (custom and reflection) for a user.
 */
export async function getRegularNotes(userId: string): Promise<Note[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .in('note_type', ['custom', 'reflection'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching regular notes:', error)
    throw error
  }

  return mapDatabaseNotesToNotes(data || [])
}

/**
 * Get pinned ontology notes (Values, Beliefs, Aims) for a user.
 */
export async function getOntologyNotes(userId: string): Promise<Note[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .in('note_type', ['ontology-value', 'ontology-belief', 'ontology-aim'])
    .eq('is_pinned', true)

  if (error) {
    console.error('Error fetching ontology notes:', error)
    throw error
  }

  // Sort manually: values → beliefs → aims
  const notes = mapDatabaseNotesToNotes(data || [])
  return notes.sort((a, b) => {
    const order = ['ontology-value', 'ontology-belief', 'ontology-aim']
    return order.indexOf(a.noteType) - order.indexOf(b.noteType)
  })
}

/**
 * Get a single note by ID.
 */
export async function getNoteById(
  noteId: string,
  userId: string
): Promise<Note | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null
    }
    console.error('Error fetching note:', error)
    throw error
  }

  return mapDatabaseNoteToNote(data)
}

/**
 * Create a new note.
 */
export async function createNote(
  request: CreateNoteRequest,
  userId: string
): Promise<Note> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title: request.title,
      content: request.content || '',
      note_type: request.noteType,
      is_pinned: request.isPinned || false,
      metadata: request.metadata || {}
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating note:', error)
    throw error
  }

  return mapDatabaseNoteToNote(data)
}

/**
 * Update an existing note.
 */
export async function updateNote(
  request: UpdateNoteRequest,
  userId: string
): Promise<Note> {
  const supabase = createClient()

  const updates: Record<string, any> = {}

  if (request.title !== undefined) updates.title = request.title
  if (request.content !== undefined) updates.content = request.content
  if (request.isPinned !== undefined) updates.is_pinned = request.isPinned
  if (request.metadata !== undefined) {
    // Merge metadata instead of replacing
    const current = await getNoteById(request.id, userId)
    if (current) {
      updates.metadata = {
        ...current.metadata,
        ...request.metadata
      }
    }
  }

  const { data, error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', request.id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating note:', error)
    throw error
  }

  return mapDatabaseNoteToNote(data)
}

/**
 * Delete a note.
 */
export async function deleteNote(
  noteId: string,
  userId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting note:', error)
    throw error
  }
}

// ============================================================================
// Link CRUD Operations
// ============================================================================

/**
 * Get all links for a specific note (both source and target).
 */
export async function getLinksForNote(
  noteId: string,
  userId: string
): Promise<Link[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', userId)
    .or(`source_note_id.eq.${noteId},target_note_id.eq.${noteId}`)

  if (error) {
    console.error('Error fetching links:', error)
    throw error
  }

  return mapDatabaseLinksToLinks(data || [])
}

/**
 * Get all links where a note is the source.
 */
export async function getOutgoingLinks(
  noteId: string,
  userId: string
): Promise<Link[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', userId)
    .eq('source_note_id', noteId)

  if (error) {
    console.error('Error fetching outgoing links:', error)
    throw error
  }

  return mapDatabaseLinksToLinks(data || [])
}

/**
 * Get all links where a note is the target.
 */
export async function getIncomingLinks(
  noteId: string,
  userId: string
): Promise<Link[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', userId)
    .eq('target_note_id', noteId)

  if (error) {
    console.error('Error fetching incoming links:', error)
    throw error
  }

  return mapDatabaseLinksToLinks(data || [])
}

/**
 * Create a new link between two notes.
 */
export async function createLink(
  request: CreateLinkRequest,
  userId: string
): Promise<Link> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('links')
    .insert({
      source_note_id: request.sourceNoteId,
      target_note_id: request.targetNoteId,
      link_type: request.linkType,
      user_id: userId
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating link:', error)
    throw error
  }

  return mapDatabaseLinkToLink(data)
}

/**
 * Delete a link by ID.
 */
export async function deleteLink(
  linkId: string,
  userId: string
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', linkId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting link:', error)
    throw error
  }
}

// ============================================================================
// Helper Functions: Database → App Type Mapping
// ============================================================================

/**
 * Maps database column names to app-friendly camelCase.
 */
function mapDatabaseNoteToNote(dbNote: any): Note {
  return {
    id: dbNote.id,
    userId: dbNote.user_id,
    title: dbNote.title,
    content: dbNote.content,
    noteType: dbNote.note_type as NoteType,
    isPinned: dbNote.is_pinned,
    metadata: dbNote.metadata || {},
    createdAt: dbNote.created_at,
    updatedAt: dbNote.updated_at
  }
}

function mapDatabaseNotesToNotes(dbNotes: any[]): Note[] {
  return dbNotes.map(mapDatabaseNoteToNote)
}

function mapDatabaseLinkToLink(dbLink: any): Link {
  return {
    id: dbLink.id,
    sourceNoteId: dbLink.source_note_id,
    targetNoteId: dbLink.target_note_id,
    linkType: dbLink.link_type,
    userId: dbLink.user_id,
    createdAt: dbLink.created_at
  }
}

function mapDatabaseLinksToLinks(dbLinks: any[]): Link[] {
  return dbLinks.map(mapDatabaseLinkToLink)
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Initialize pinned ontology notes for a new user.
 * Creates empty Values, Beliefs, and Aims notes.
 */
export async function initializeOntologyNotes(userId: string): Promise<void> {
  const supabase = createClient()

  const ontologyNotes = [
    {
      user_id: userId,
      title: 'Values',
      content: '',
      note_type: 'ontology-value',
      is_pinned: true,
      metadata: {}
    },
    {
      user_id: userId,
      title: 'Beliefs',
      content: '',
      note_type: 'ontology-belief',
      is_pinned: true,
      metadata: {}
    },
    {
      user_id: userId,
      title: 'Aims',
      content: JSON.stringify({ todos: '', goals: '' }),
      note_type: 'ontology-aim',
      is_pinned: true,
      metadata: {}
    }
  ]

  const { error } = await supabase.from('notes').insert(ontologyNotes)

  if (error) {
    console.error('Error initializing ontology notes:', error)
    throw error
  }
}

/**
 * Check if user has any journal entries.
 */
export async function hasJournalEntries(userId: string): Promise<boolean> {
  const supabase = createClient()

  const { count, error } = await supabase
    .from('notes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('note_type', 'journal-entry')

  if (error) {
    console.error('Error checking journal entries:', error)
    return false
  }

  return (count || 0) > 0
}
