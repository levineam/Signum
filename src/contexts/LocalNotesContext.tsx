'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { Note } from '@/types/note'

interface LocalNotesContextType {
  localNotes: Record<string, Note>
  addLocalNote: (note: Note) => void
  getLocalNote: (id: string) => Note | undefined
}

const LocalNotesContext = createContext<LocalNotesContextType | undefined>(undefined)

export function LocalNotesProvider({ children }: { children: React.ReactNode }) {
  const [localNotes, setLocalNotes] = useState<Record<string, Note>>({})

  const addLocalNote = useCallback((note: Note) => {
    setLocalNotes(prev => ({
      ...prev,
      [note.id]: note
    }))
  }, [])

  const getLocalNote = useCallback((id: string) => {
    return localNotes[id]
  }, [localNotes])

  return (
    <LocalNotesContext.Provider value={{ localNotes, addLocalNote, getLocalNote }}>
      {children}
    </LocalNotesContext.Provider>
  )
}

export function useLocalNotes() {
  const context = useContext(LocalNotesContext)
  if (context === undefined) {
    throw new Error('useLocalNotes must be used within a LocalNotesProvider')
  }
  return context
}

