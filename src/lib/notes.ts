import { Note, CreateNoteRequest } from '@/types/note'

const NOTES_STORAGE_KEY = 'signum-notes'
const PINNED_NOTE_IDS = {
  values: 'pinned-values',
  beliefs: 'pinned-beliefs',
  aims: 'pinned-aims'
}

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
    userId: '', // Will be set during migration
    title: request.title,
    content: request.content || '',
    noteType: request.noteType || 'custom',
    isPinned: request.isPinned || false,
    metadata: request.metadata || {},
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

export function initializePinnedNotes(): void {
  const existingNotes = getNotes()
  const now = new Date().toISOString()

  // Check if pinned notes already exist
  const hasValues = existingNotes.some(n => n.id === PINNED_NOTE_IDS.values)
  const hasBeliefs = existingNotes.some(n => n.id === PINNED_NOTE_IDS.beliefs)
  const hasAims = existingNotes.some(n => n.id === PINNED_NOTE_IDS.aims)

  const newNotes: Note[] = []

  if (!hasValues) {
    newNotes.push({
      id: PINNED_NOTE_IDS.values,
      userId: '',
      title: 'Values',
      content: '',
      noteType: 'ontology-value',
      isPinned: true,
      metadata: {},
      createdAt: now,
      updatedAt: now
    })
  }

  if (!hasBeliefs) {
    newNotes.push({
      id: PINNED_NOTE_IDS.beliefs,
      userId: '',
      title: 'Beliefs',
      content: '',
      noteType: 'ontology-belief',
      isPinned: true,
      metadata: {},
      createdAt: now,
      updatedAt: now
    })
  }

  if (!hasAims) {
    newNotes.push({
      id: PINNED_NOTE_IDS.aims,
      userId: '',
      title: 'Aims',
      content: JSON.stringify({ todos: '', goals: '' }),
      noteType: 'ontology-aim',
      isPinned: true,
      metadata: {},
      createdAt: now,
      updatedAt: now
    })
  }

  if (newNotes.length > 0) {
    saveNotes([...existingNotes, ...newNotes])
  }
}

export function getPinnedNotes(): Note[] {
  const notes = getNotes()
  return notes
    .filter(note => note.isPinned)
    .sort((a, b) => {
      const order = ['ontology-value', 'ontology-belief', 'ontology-aim']
      return order.indexOf(a.noteType) - order.indexOf(b.noteType)
    })
}

export function getRegularNotes(): Note[] {
  const notes = getNotes()
  return notes
    .filter(note => !note.isPinned)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}