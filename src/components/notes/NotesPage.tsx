'use client'

import { useEffect, useState } from 'react'
import { getRegularNotes } from '@/lib/notes'
import { Note } from '@/types/note'
import { RegularNoteCard } from './RegularNoteCard'
import { useAuth } from '@/contexts/AuthContext'

export function NotesPage() {
  const { user } = useAuth()
  const [regularNotes, setRegularNotes] = useState<Note[]>([])

  const loadNotes = async () => {
    if (!user) return

    // Get all regular notes from Supabase (sorted by createdAt DESC)
    const allNotes = await getRegularNotes(user.id)

    setRegularNotes(allNotes)
  }

  useEffect(() => {
    if (!user) {
      // Clear notes when user signs out to prevent data leakage
      setRegularNotes([])
      return
    }

    loadNotes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <section>
        {regularNotes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No notes yet. Create notes from your journal entries.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {regularNotes.map((note) => (
              <RegularNoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
