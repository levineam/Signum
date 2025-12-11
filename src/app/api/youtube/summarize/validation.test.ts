import { describe, it, expect, vi } from 'vitest'
import { shouldSkipEntryValidation, validateJournalEntryOwnership } from './route'

const buildSupabaseMock = (singleResult: { data: any; error: any }) => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(singleResult)
  }

  return {
    from: vi.fn().mockReturnValue(builder),
    builder
  }
}

describe('YouTube summarize entry validation', () => {
  it('skips validation for local, guest, or missing entry ids', () => {
    expect(shouldSkipEntryValidation(undefined)).toBe(true)
    expect(shouldSkipEntryValidation(null as unknown as string)).toBe(true)
    expect(shouldSkipEntryValidation('local-entry-123')).toBe(true)
    expect(shouldSkipEntryValidation('guest-entry')).toBe(true)
  })

  it('validates ownership against notes table', async () => {
    const { from } = buildSupabaseMock({ data: { id: 'note-1', note_type: 'journal-entry' }, error: null })

    const result = await validateJournalEntryOwnership(from, 'note-1', 'user-1')

    expect(result).toBe(true)
  })

  it('returns false when entry not found or wrong user', async () => {
    const { from } = buildSupabaseMock({ data: null, error: { message: 'not found' } })

    const result = await validateJournalEntryOwnership(from, 'note-2', 'user-1')

    expect(result).toBe(false)
  })
})
