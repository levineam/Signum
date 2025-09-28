import { NoteLink, CreateLinkRequest } from '@/types/link'

const LINKS_STORAGE_KEY = 'signum-links'

export function generateLinkId(): string {
  return `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function getLinks(): NoteLink[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(LINKS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading links from localStorage:', error)
    return []
  }
}

export function saveLinks(links: NoteLink[]): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(links))
  } catch (error) {
    console.error('Error saving links to localStorage:', error)
  }
}

export function createLink(request: CreateLinkRequest): NoteLink {
  const newLink: NoteLink = {
    id: generateLinkId(),
    text: request.text,
    noteId: request.noteId,
    entryId: request.entryId,
    createdAt: new Date().toISOString()
  }

  const existingLinks = getLinks()
  const updatedLinks = [...existingLinks, newLink]
  saveLinks(updatedLinks)

  return newLink
}

export function getLinksByEntryId(entryId: string): NoteLink[] {
  const links = getLinks()
  return links.filter(link => link.entryId === entryId)
}

export function getLinkByNoteId(noteId: string): NoteLink | null {
  const links = getLinks()
  return links.find(link => link.noteId === noteId) || null
}

export function deleteLink(linkId: string): boolean {
  const links = getLinks()
  const filteredLinks = links.filter(link => link.id !== linkId)

  if (filteredLinks.length === links.length) {
    return false // Link not found
  }

  saveLinks(filteredLinks)
  return true
}