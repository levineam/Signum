/**
 * Supabase CRUD operations for the unified notes table.
 * Story 2.3.6: Replaces localStorage-based operations.
 */

import { supabase } from '@/lib/supabase'
import {
  Note,
  Link,
  CreateNoteRequest,
  UpdateNoteRequest,
  CreateLinkRequest,
  NoteType
} from '@/types/note'
import { decryptNote, encryptNote } from '@/lib/crypto/encryption'
import { getUserEncryptionKey, hasEncryptionKey } from '@/lib/crypto/keyManagement'

const ENCRYPTION_FLAG_ENABLED = ['true', '1', 'yes'].includes(
  String(process.env.NEXT_PUBLIC_ENABLE_ENCRYPTION || '').toLowerCase()
)

let encryptionSchemaCheckPromise: Promise<boolean> | null = null
const encryptionFallbackNoticeShown = new Map<string, string>()

export async function isEncryptionSchemaAvailable(): Promise<boolean> {
  if (encryptionSchemaCheckPromise) {
    return encryptionSchemaCheckPromise
  }

  encryptionSchemaCheckPromise = (async () => {
    try {
      const { error } = await supabase
        .from('notes')
        .select('encrypted_title,title_iv,encrypted_content,content_iv,encryption_version')
        .limit(1)

      if (error) {
        const message = (error.message || '').toLowerCase()
        if (message.includes('column') || message.includes('does not exist') || error.code === 'PGRST204') {
          return false
        }
        console.warn('Unexpected error probing encryption columns, disabling encryption as precaution:', error)
        return false
      }

      return true
    } catch (probeError) {
      console.warn('Failed to probe encryption schema, disabling encryption as precaution:', probeError)
      return false
    }
  })()

  return encryptionSchemaCheckPromise
}

function logEncryptionFallback(userId: string, reason: string) {
  const key = `${userId}:${reason}`
  if (encryptionFallbackNoticeShown.has(key)) return
  console.warn(`[Encryption] Falling back to plaintext for user ${userId}: ${reason}`)
  encryptionFallbackNoticeShown.set(key, reason)
}

export async function resolveEncryptionMode(userId: string): Promise<{
  canEncrypt: boolean
  reason: 'flag-disabled' | 'no-key' | 'schema-missing' | 'ok'
  key?: Awaited<ReturnType<typeof getUserEncryptionKey>>
}> {
  if (!ENCRYPTION_FLAG_ENABLED) {
    return { canEncrypt: false, reason: 'flag-disabled' }
  }

  const hasKey = await hasEncryptionKey(userId)
  if (!hasKey) {
    return { canEncrypt: false, reason: 'no-key' }
  }

  const schemaAvailable = await isEncryptionSchemaAvailable()
  if (!schemaAvailable) {
    return { canEncrypt: false, reason: 'schema-missing' }
  }

  const key = await getUserEncryptionKey(userId)
  return { canEncrypt: true, reason: 'ok', key }
}

// ============================================================================
// Note CRUD Operations
// ============================================================================

/**
 * Get all journal entries for a user, sorted by journal date (newest first).
 */
export async function getJournalEntries(userId: string): Promise<Note[]> {
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

  return await mapDatabaseNotesToNotes(data || [], userId)
}

/**
 * Get regular notes (custom and reflection) for a user.
 * Excludes custom notes used as ontology scaffolding (those with ontologyCategory metadata).
 */
export async function getRegularNotes(userId: string): Promise<Note[]> {
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

  const notes = await mapDatabaseNotesToNotes(data || [], userId)
  // Filter out custom notes that are ontology scaffolding (have ontologyCategory in metadata)
  return notes.filter(note => !note.metadata?.ontologyCategory)
}

/**
 * Get pinned ontology notes (Values, Beliefs, Aims) for a user.
 */
export async function getOntologyNotes(userId: string): Promise<Note[]> {
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
  const notes = await mapDatabaseNotesToNotes(data || [], userId)
  return notes.sort((a, b) => {
    const order = ['ontology-value', 'ontology-belief', 'ontology-aim']
    return order.indexOf(a.noteType) - order.indexOf(b.noteType)
  })
}

/**
 * Get pinned ontology-related notes for the ontology page, including custom categories.
 */
export async function getOntologyDashboardNotes(userId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('is_pinned', true)
    .in('note_type', ['ontology-value', 'ontology-belief', 'ontology-aim', 'custom'])

  if (error) {
    console.error('Error fetching ontology dashboard notes:', error)
    throw error
  }

  const notes = await mapDatabaseNotesToNotes(data || [], userId)

  return notes.filter((note) =>
    ['ontology-value', 'ontology-belief', 'ontology-aim'].includes(note.noteType) ||
    Boolean(note.metadata?.ontologyCategory)
  )
}

/**
 * Get a single note by ID.
 */
export async function getNoteById(
  noteId: string,
  userId: string
): Promise<Note | null> {
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

  return await mapDatabaseNoteToNote(data, userId)
}

/**
 * Create a new note.
 * Automatically encrypts if user has encryption enabled.
 */
export async function createNote(
  request: CreateNoteRequest,
  userId: string,
  signal?: AbortSignal
): Promise<Note> {


  // Determine if encryption is safe to use for this user + schema
  const encryption = await resolveEncryptionMode(userId)

  let insertData: Record<string, unknown>

  if (encryption.canEncrypt && encryption.key) {
    // User has encryption enabled - encrypt the note
    const title = request.title ?? ''
    const content = request.content ?? ''

    const encryptedTitle = await encryptNote(title, encryption.key)
    const encryptedContent = await encryptNote(content, encryption.key)

    insertData = {
      user_id: userId,
      encrypted_title: encryptedTitle.ciphertext,
      title_iv: encryptedTitle.iv,
      encrypted_content: encryptedContent.ciphertext,
      content_iv: encryptedContent.iv,
      encryption_version: 1,
      note_type: request.noteType,
      is_pinned: request.isPinned || false,
      metadata: request.metadata || {},
      // Clear plaintext columns
      title: null,
      content: null,
    }
  } else {
    // User does not have encryption enabled - use plaintext
    insertData = {
      user_id: userId,
      title: request.title,
      content: request.content || '',
      note_type: request.noteType,
      is_pinned: request.isPinned || false,
      metadata: request.metadata || {},
    }

    logEncryptionFallback(userId, encryption.reason)
  }

  const builder = supabase
    .from('notes')
    .insert(insertData)
    .select()

  if (signal) {
    builder.abortSignal(signal)
  }

  const { data, error } = await builder.single()

  if (error) {
    console.error('Error creating note:', error)
    throw error
  }

  const note = await mapDatabaseNoteToNote(data, userId)
  if (!note) {
    throw new Error('Failed to create note: mapping failed')
  }
  return note
}

/**
 * Update an existing note.
 * Automatically encrypts if user has encryption enabled.
 */
export async function updateNote(
  request: UpdateNoteRequest,
  userId: string
): Promise<Note> {


  const updates: Record<string, string | number | boolean | object | null> = {}

  // Determine if encryption is safe to use for this user + schema
  const encryption = await resolveEncryptionMode(userId)

  // Handle title and content updates with encryption if enabled
  if (encryption.canEncrypt && encryption.key && (request.title !== undefined || request.content !== undefined)) {
    // User has encryption enabled - need to encrypt updates
    // Get current note to preserve unchanged fields
    const current = await getNoteById(request.id, userId)
    if (!current) {
      throw new Error('Note not found')
    }

    // Use updated values or fall back to current values
    const titleToEncrypt = request.title !== undefined ? request.title : current.title
    const contentToEncrypt = request.content !== undefined ? request.content : current.content

    // Encrypt both title and content
    const encryptedTitle = await encryptNote(titleToEncrypt ?? '', encryption.key)
    const encryptedContent = await encryptNote(contentToEncrypt ?? '', encryption.key)

    updates.encrypted_title = encryptedTitle.ciphertext
    updates.title_iv = encryptedTitle.iv
    updates.encrypted_content = encryptedContent.ciphertext
    updates.content_iv = encryptedContent.iv
    updates.encryption_version = 1
    // Clear plaintext
    updates.title = null
    updates.content = null
  } else {
    // User does not have encryption enabled - use plaintext
    if (request.title !== undefined) updates.title = request.title
    if (request.content !== undefined) updates.content = request.content
    logEncryptionFallback(userId, encryption.reason)
  }

  // Handle other fields (not encrypted)
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

  const note = await mapDatabaseNoteToNote(data, userId)
  if (!note) {
    throw new Error('Failed to update note: mapping failed')
  }
  return note
}

/**
 * Delete a note.
 */
export async function deleteNote(
  noteId: string,
  userId: string
): Promise<void> {


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


  const { data, error } = await supabase
    .from('links')
    .insert({
      source_note_id: request.sourceNoteId,
      target_note_id: request.targetNoteId,
      link_type: request.linkType,
      user_id: userId,
      metadata: request.metadata || {}
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
 * Handles both encrypted and plain text notes.
 */
async function mapDatabaseNoteToNote(
  dbNote: {
    id: string
    user_id: string
    title: string | null
    content: string | null
    encrypted_title?: string | null
    title_iv?: string | null
    encrypted_content?: string | null
    content_iv?: string | null
    encryption_version?: number | null
    note_type: string
    is_pinned: boolean
    metadata: Record<string, unknown>
    created_at: string
    updated_at: string
  },
  userId: string
): Promise<Note | null> {
  try {
    // Check if note is encrypted
    if (dbNote.encryption_version && dbNote.encrypted_title && dbNote.encrypted_content) {
      // Decrypt encrypted note
      const key = await getUserEncryptionKey(userId)

      const title = await decryptNote(
        {
          ciphertext: dbNote.encrypted_title,
          iv: dbNote.title_iv!,
          version: dbNote.encryption_version,
        },
        key
      )

      const content = await decryptNote(
        {
          ciphertext: dbNote.encrypted_content,
          iv: dbNote.content_iv!,
          version: dbNote.encryption_version,
        },
        key
      )

      return {
        id: dbNote.id,
        userId: dbNote.user_id,
        title,
        content,
        noteType: dbNote.note_type as NoteType,
        isPinned: dbNote.is_pinned,
        metadata: dbNote.metadata || {},
        createdAt: dbNote.created_at,
        updatedAt: dbNote.updated_at,
      }
    }

    // Handle plain text note (backward compatibility)
    return {
      id: dbNote.id,
      userId: dbNote.user_id,
      title: dbNote.title ?? '',
      content: dbNote.content ?? '',
      noteType: dbNote.note_type as NoteType,
      isPinned: dbNote.is_pinned,
      metadata: dbNote.metadata || {},
      createdAt: dbNote.created_at,
      updatedAt: dbNote.updated_at,
    }
  } catch (error) {
    console.error('Error mapping database note:', error)
    return null
  }
}

async function mapDatabaseNotesToNotes(
  dbNotes: Array<{
    id: string
    user_id: string
    title: string | null
    content: string | null
    encrypted_title?: string | null
    title_iv?: string | null
    encrypted_content?: string | null
    content_iv?: string | null
    encryption_version?: number | null
    note_type: string
    is_pinned: boolean
    metadata: Record<string, unknown>
    created_at: string
    updated_at: string
  }>,
  userId: string
): Promise<Note[]> {
  const notes = await Promise.all(
    dbNotes.map((note) => mapDatabaseNoteToNote(note, userId))
  )
  return notes.filter((note): note is Note => note !== null)
}

function mapDatabaseLinkToLink(dbLink: {
  id: string
  source_note_id: string
  target_note_id: string
  link_type: string
  user_id: string
  metadata?: Record<string, unknown>
  created_at: string
}): Link {
  return {
    id: dbLink.id,
    sourceNoteId: dbLink.source_note_id,
    targetNoteId: dbLink.target_note_id,
    linkType: dbLink.link_type as import('@/types/note').LinkType,
    userId: dbLink.user_id,
    metadata: dbLink.metadata || {},
    createdAt: dbLink.created_at
  }
}

function mapDatabaseLinksToLinks(dbLinks: Array<{
  id: string
  source_note_id: string
  target_note_id: string
  link_type: string
  user_id: string
  metadata?: Record<string, unknown>
  created_at: string
}>): Link[] {
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
