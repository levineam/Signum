import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { shouldSkipEntryValidation, validateJournalEntryOwnership } from './validation'

type BuilderResult = {
  data: { id: string; note_type: string } | null
  error: { message: string } | null
}

type MockSelectBuilder = {
  select: (columns: string) => MockSelectBuilder
  eq: (column: string, value: string) => MockSelectBuilder
  single: () => Promise<BuilderResult>
}

const buildSupabaseMock = (singleResult: BuilderResult): { client: SupabaseClient; builder: MockSelectBuilder } => {
  const builder: MockSelectBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(singleResult)
  }

  const client = {
    from: vi.fn().mockReturnValue(builder)
  } as unknown as SupabaseClient

  return { client, builder }
}

describe('YouTube summarize entry validation', () => {
  it('skips validation for local entries, local notes, guest entries, or missing IDs', () => {
    // Missing/null IDs
    expect(shouldSkipEntryValidation(undefined)).toBe(true)
    expect(shouldSkipEntryValidation(null as unknown as string)).toBe(true)

    // Local entry IDs (test mode journal entries)
    expect(shouldSkipEntryValidation('local-entry-123')).toBe(true)
    expect(shouldSkipEntryValidation('local-entry-abc-def')).toBe(true)

    // Local note IDs (test mode notes)
    expect(shouldSkipEntryValidation('local-note-123')).toBe(true)
    expect(shouldSkipEntryValidation('local-note-abc-def')).toBe(true)

    // Guest entry
    expect(shouldSkipEntryValidation('guest-entry')).toBe(true)
  })

  it('requires validation for real database IDs', () => {
    // UUIDs should require validation
    expect(shouldSkipEntryValidation('550e8400-e29b-41d4-a716-446655440000')).toBe(false)
    // Other IDs that don't match skip patterns
    expect(shouldSkipEntryValidation('note-123')).toBe(false)
    expect(shouldSkipEntryValidation('entry-456')).toBe(false)
  })

  it('validates ownership against notes table', async () => {
    const { client } = buildSupabaseMock({ data: { id: 'note-1', note_type: 'journal-entry' }, error: null })

    const result = await validateJournalEntryOwnership(client, 'note-1', 'user-1')

    expect(result).toBe(true)
  })

  it('returns false when entry not found or wrong user', async () => {
    const { client } = buildSupabaseMock({ data: null, error: { message: 'not found' } })

    const result = await validateJournalEntryOwnership(client, 'note-2', 'user-1')

    expect(result).toBe(false)
  })
})
