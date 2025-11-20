/**
 * Migration utilities for encrypting existing plain text notes
 * Story 2.10 AC6: Batch encryption with progress tracking and rollback
 */

import { supabase } from '@/lib/supabase'
import { encryptNote } from './encryption'
import { getUserEncryptionKey } from './keyManagement'

// interface MigrationProgress {
//   current: number
//   total: number
// }

interface PlainNoteRow {
  id: string
  title: string | null
  content: string | null
}

/**
 * Migrates all plain text notes for a user to encrypted format
 * @param userId - User ID
 * @param onProgress - Callback for progress updates
 */
export async function migrateAllUserNotes(
  userId: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  // Get user's encryption key
  const key = await getUserEncryptionKey(userId)

  // Get all plain text notes (include both title and content)
  const { data: notes, error } = await supabase
    .from('notes')
    .select('id, title, content')
    .eq('user_id', userId)
    .is('encryption_version', null)

  if (error) throw error
  if (!notes || notes.length === 0) return

  // Store original values for rollback
  const originalNotes = notes.map((n: PlainNoteRow) => ({
    id: n.id,
    title: n.title,
    content: n.content,
  }))

  try {
    // Migrate in batches (with rollback capability)
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i]

      // Guard against null/undefined - coalesce to empty string
      const title = note.title ?? ''
      const content = note.content ?? ''

      // Encrypt both title and content
      const encryptedTitle = await encryptNote(title, key)
      const encryptedContent = await encryptNote(content, key)

      // Update database
      const { error: updateError } = await supabase
        .from('notes')
        .update({
          encrypted_title: encryptedTitle.ciphertext,
          title_iv: encryptedTitle.iv,
          encrypted_content: encryptedContent.ciphertext,
          content_iv: encryptedContent.iv,
          encryption_version: 1,
          title: null, // Clear plain text
          content: null,
        })
        .eq('id', note.id)

      if (updateError) {
        throw new Error(
          `Failed to encrypt note ${note.id}: ${updateError.message}`
        )
      }

      // Report progress
      if (onProgress) {
        onProgress(i + 1, notes.length)
      }
    }
  } catch (error) {
    console.error('Migration failed, rolling back...', error)

    // Rollback: restore original plain text values
    for (const original of originalNotes) {
      await supabase
        .from('notes')
        .update({
          title: original.title,
          content: original.content,
          encrypted_title: null,
          title_iv: null,
          encrypted_content: null,
          content_iv: null,
          encryption_version: null,
        })
        .eq('id', original.id)
    }

    throw error // Re-throw to notify caller
  }
}

/**
 * Gets count of plain text notes for a user
 * @param userId - User ID
 * @returns Count of unmigrated notes
 */
export async function getPlainTextNoteCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('encryption_version', null)

  if (error) {
    console.error('Error counting plain text notes:', error)
    return 0
  }

  return count ?? 0
}

/**
 * Gets count of encrypted notes for a user
 * @param userId - User ID
 * @returns Count of encrypted notes
 */
export async function getEncryptedNoteCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('encryption_version', 1)

  if (error) {
    console.error('Error counting encrypted notes:', error)
    return 0
  }

  return count ?? 0
}
