export interface NoteLink {
  id: string
  text: string // The original text that was selected
  noteId: string // ID of the associated note
  entryId: string // ID of the journal entry containing the link
  createdAt: string
}

export interface CreateLinkRequest {
  text: string
  noteId: string
  entryId: string
}