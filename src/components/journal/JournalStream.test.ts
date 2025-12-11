import { describe, it, expect } from 'vitest'
import { filterJournalEntries } from './JournalStream'
import { Note } from '@/types/note'

describe('filterJournalEntries', () => {
  it('retains all journal entries regardless of age or emptiness', () => {
    const notes: Note[] = [
      {
        id: 'old-empty',
        userId: 'u1',
        title: 'Journal Entry - 2025-12-09',
        content: '',
        noteType: 'journal-entry',
        isPinned: false,
        metadata: { journalDate: '2025-12-09' },
        createdAt: '2025-12-09T08:00:00Z',
        updatedAt: '2025-12-09T08:00:00Z'
      },
      {
        id: 'today',
        userId: 'u1',
        title: 'Journal Entry - 2025-12-11',
        content: '<p>Content</p>',
        noteType: 'journal-entry',
        isPinned: false,
        metadata: { journalDate: '2025-12-11' },
        createdAt: '2025-12-11T08:00:00Z',
        updatedAt: '2025-12-11T08:00:00Z'
      },
      {
        id: 'custom',
        userId: 'u1',
        title: 'Custom note',
        content: '',
        noteType: 'custom',
        isPinned: false,
        metadata: {},
        createdAt: '2025-12-10T08:00:00Z',
        updatedAt: '2025-12-10T08:00:00Z'
      }
    ]

    const result = filterJournalEntries(notes)
    expect(result.map(n => n.id)).toEqual(['old-empty', 'today'])
  })
})
