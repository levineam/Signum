'use client'

import { useEffect, useState } from 'react'
import { initializePinnedNotes, getPinnedNotes } from '@/lib/notes'
import { Note } from '@/types/note'
import { PinnedNoteCard } from '../notes/PinnedNoteCard'
import { OntologyAnalysisButton } from '../notes/OntologyAnalysisButton'
import { useAuth } from '@/contexts/AuthContext'

export function OntologyPage() {
  const { user } = useAuth()
  const [pinnedNotes, setPinnedNotes] = useState<Note[]>([])

  const loadNotes = async () => {
    if (!user) return
    setPinnedNotes(await getPinnedNotes(user.id))
  }

  useEffect(() => {
    if (!user) {
      // Clear notes when user signs out to prevent data leakage
      setPinnedNotes([])
      return
    }

    // Initialize pinned notes if they don't exist, then load all notes
    (async () => {
      await initializePinnedNotes(user.id)
      await loadNotes()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Ontology Cards Section */}
      <section>
        <div className="flex items-center justify-end mb-4">
          <OntologyAnalysisButton onComplete={loadNotes} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pinnedNotes.map((note) => (
            <PinnedNoteCard key={note.id} note={note} />
          ))}
        </div>
      </section>
    </div>
  )
}
