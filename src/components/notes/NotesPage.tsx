'use client'

import { useEffect, useState } from 'react'
import { initializePinnedNotes, getPinnedNotes, getRegularNotes } from '@/lib/notes'
import { Note } from '@/types/note'
import { PinnedNoteCard } from './PinnedNoteCard'
import { RegularNoteCard } from './RegularNoteCard'

export function NotesPage() {
  const [pinnedNotes, setPinnedNotes] = useState<Note[]>([])
  const [regularNotes, setRegularNotes] = useState<Note[]>([])

  useEffect(() => {
    // Initialize pinned notes if they don't exist
    initializePinnedNotes()

    // Load notes
    setPinnedNotes(getPinnedNotes())
    setRegularNotes(getRegularNotes())
  }, [])

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Notes</h1>
        <p className="text-muted-foreground">
          Your ontology and reflections
        </p>
      </div>

      {/* Pinned Notes Section */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Pinned
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pinnedNotes.map((note) => (
            <PinnedNoteCard key={note.id} note={note} />
          ))}
        </div>
      </section>

      {/* Regular Notes Section */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          All Notes
        </h2>
        {regularNotes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No notes yet. Create notes from your journal entries.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {regularNotes.map((note) => (
              <RegularNoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}