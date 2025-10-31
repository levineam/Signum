/**
 * Encrypted note CRUD operations
 * Story 2.10: End-to-End Encryption Phase 1
 * Handles encryption/decryption for note operations with backward compatibility
 */

import { supabase } from '@/lib/supabase'
import { Note, NoteType } from '@/types/note'
import { encryptNote, decryptNote } from './encryption'
import { getUserEncryptionKey, hasEncryptionKey } from './keyManagement'

interface DatabaseNote {
  id: string
  user_id: string
  title: string | null
  content: string | null
  encrypted_title: string | null
  title_iv: string | null
  encrypted_content: string | null
  content_iv: string | null
  encryption_version: number | null
  note_type: string
  is_pinned: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

/**
 * Saves a note with encryption
 * @param note - Note data to save
 * @param userId - User ID
 * @returns Saved note ID
 */
export async function saveEncryptedNote(
  note: {
    id?: string
    title: string
    content: string
    noteType: NoteType
    isPinned?: boolean
    metadata?: Record<string, unknown>
  },
  userId: string
): Promise<string> {
  // Check if user has encryption enabled
  const hasKey = await hasEncryptionKey(userId)

  if (!hasKey) {
    // Fall back to plain text if encryption not enabled
    return await savePlainTextNote(note, userId)
  }

  // Get user's encryption key
  const key = await getUserEncryptionKey(userId)

  // Guard against null/undefined - coalesce to empty string
  const title = note.title ?? ''
  const content = note.content ?? ''

  // Encrypt title and content separately (different IVs)
  const encryptedTitle = await encryptNote(title, key)
  const encryptedContent = await encryptNote(content, key)

  // Save to database
  const { data, error } = await supabase
    .from('notes')
    .upsert({
      id: note.id,
      user_id: userId,
      encrypted_title: encryptedTitle.ciphertext,
      title_iv: encryptedTitle.iv,
      encrypted_content: encryptedContent.ciphertext,
      content_iv: encryptedContent.iv,
      encryption_version: 1,
      note_type: note.noteType,
      is_pinned: note.isPinned ?? false,
      metadata: note.metadata ?? {},
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

/**
 * Retrieves and decrypts a note
 * @param noteId - Note ID
 * @param userId - User ID
 * @returns Decrypted note or null if not found
 */
export async function getDecryptedNote(
  noteId: string,
  userId: string
): Promise<Note | null> {
  // Fetch note from database
  const { data: note, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single()

  if (error || !note) {
    return null
  }

  return mapDatabaseNoteToNote(note as DatabaseNote, userId)
}

/**
 * Retrieves all notes for a user (with decryption)
 * @param userId - User ID
 * @returns Array of decrypted notes
 */
export async function getAllDecryptedNotes(userId: string): Promise<Note[]> {
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching notes:', error)
    return []
  }

  if (!notes) return []

  // Decrypt all notes
  const decryptedNotes = await Promise.all(
    notes.map((note) => mapDatabaseNoteToNote(note as DatabaseNote, userId))
  )

  return decryptedNotes.filter((note): note is Note => note !== null)
}

/**
 * Maps a database note to a Note object (handles decryption)
 * @param dbNote - Database note record
 * @param userId - User ID
 * @returns Decrypted Note object
 */
async function mapDatabaseNoteToNote(
  dbNote: DatabaseNote,
  userId: string
): Promise<Note | null> {
  try {
    // Handle legacy plain text notes (backward compatibility)
    if (!dbNote.encryption_version) {
      return {
        id: dbNote.id,
        userId: dbNote.user_id,
        title: dbNote.title ?? '',
        content: dbNote.content ?? '',
        noteType: dbNote.note_type as NoteType,
        isPinned: dbNote.is_pinned,
        metadata: dbNote.metadata,
        createdAt: dbNote.created_at,
        updatedAt: dbNote.updated_at,
      }
    }

    // Decrypt encrypted notes
    const key = await getUserEncryptionKey(userId)

    const title = await decryptNote(
      {
        ciphertext: dbNote.encrypted_title!,
        iv: dbNote.title_iv!,
        version: dbNote.encryption_version,
      },
      key
    )

    const content = await decryptNote(
      {
        ciphertext: dbNote.encrypted_content!,
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
      metadata: dbNote.metadata,
      createdAt: dbNote.created_at,
      updatedAt: dbNote.updated_at,
    }
  } catch (error) {
    console.error('Error decrypting note:', error)
    return null
  }
}

/**
 * Saves a note as plain text (fallback when encryption not enabled)
 * @param note - Note data
 * @param userId - User ID
 * @returns Saved note ID
 */
async function savePlainTextNote(
  note: {
    id?: string
    title: string
    content: string
    noteType: NoteType
    isPinned?: boolean
    metadata?: Record<string, unknown>
  },
  userId: string
): Promise<string> {
  const { data, error } = await supabase
    .from('notes')
    .upsert({
      id: note.id,
      user_id: userId,
      title: note.title,
      content: note.content,
      note_type: note.noteType,
      is_pinned: note.isPinned ?? false,
      metadata: note.metadata ?? {},
      updated_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id
}

/**
 * Deletes a note
 * @param noteId - Note ID
 * @param userId - User ID
 */
export async function deleteEncryptedNote(
  noteId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId)

  if (error) throw error
}
