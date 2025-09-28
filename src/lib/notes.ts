import { Note, CreateNoteRequest } from '@/types/note'

const NOTES_STORAGE_KEY = 'signum-notes'

export function generateNoteId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function getNotes(): Note[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(NOTES_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading notes from localStorage:', error)
    return []
  }
}

export function saveNotes(notes: Note[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes))
  } catch (error) {
    console.error('Error saving notes to localStorage:', error)
  }
}

export function createNote(request: CreateNoteRequest): Note {
  const now = new Date().toISOString()
  const newNote: Note = {
    id: generateNoteId(),
    title: request.title,
    content: request.content || '',
    createdAt: now,
    updatedAt: now
  }

  const existingNotes = getNotes()
  const updatedNotes = [newNote, ...existingNotes]
  saveNotes(updatedNotes)

  return newNote
}

export function updateNote(id: string, updates: Partial<Note>): Note | null {
  const notes = getNotes()
  const noteIndex = notes.findIndex(note => note.id === id)

  if (noteIndex === -1) {
    return null
  }

  const updatedNote: Note = {
    ...notes[noteIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  }

  notes[noteIndex] = updatedNote
  saveNotes(notes)

  return updatedNote
}

export function deleteNote(id: string): boolean {
  const notes = getNotes()
  const filteredNotes = notes.filter(note => note.id !== id)

  if (filteredNotes.length === notes.length) {
    return false // Note not found
  }

  saveNotes(filteredNotes)
  return true
}

export function getNoteById(id: string): Note | null {
  const notes = getNotes()
  return notes.find(note => note.id === id) || null
}