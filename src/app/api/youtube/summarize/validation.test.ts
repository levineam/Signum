import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { shouldSkipEntryValidation, validateJournalEntryOwnership } from './route'

type BuilderResult = {
  data: { id: string; note_type: string } | null
  error: { message: string } | null
}

type MockSelectBuilder = {
  select: (columns: string) => MockSelectBuilder
  eq: (column: string, value: string) => MockSelectBuilder
  single: () => Promise<BuilderResult>
}

type MockSupabase = {
  from: (table: string) => MockSelectBuilder
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
  it('skips validation for local, guest, or missing entry ids', () => {
    expect(shouldSkipEntryValidation(undefined)).toBe(true)
    expect(shouldSkipEntryValidation(null as unknown as string)).toBe(true)
    expect(shouldSkipEntryValidation('local-entry-123')).toBe(true)
    expect(shouldSkipEntryValidation('guest-entry')).toBe(true)
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
