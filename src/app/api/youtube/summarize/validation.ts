/**
 * Validation helpers for YouTube summarization API
 *
 * These functions are exported separately from the route to allow:
 * 1. Testing without importing the route module
 * 2. Compliance with Next.js route export restrictions
 */

import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Determines if entry validation should be skipped.
 * Returns true for local/test entries, guest entries, or when no entryId is provided.
 *
 * Local IDs that skip validation:
 * - local-entry-* : Local journal entries in test mode
 * - local-note-*  : Local notes in test mode
 * - guest-entry   : Guest mode entries
 */
export function shouldSkipEntryValidation(entryId?: string | null): boolean {
  if (!entryId) return true
  return (
    entryId.startsWith('local-entry-') ||
    entryId.startsWith('local-note-') ||
    entryId === 'guest-entry'
  )
}

/**
 * Validates that the given journal entry belongs to the specified user.
 * Queries the notes table to verify ownership and correct note type.
 */
export async function validateJournalEntryOwnership(
  supabaseClient: SupabaseClient,
  entryId: string,
  userId: string
): Promise<boolean> {
  const { data: entry, error: entryError } = await supabaseClient
    .from('notes')
    .select('id, note_type')
    .eq('id', entryId)
    .eq('user_id', userId)
    .eq('note_type', 'journal-entry')
    .single()

  if (entryError || !entry) {
    return false
  }
  return true
}
