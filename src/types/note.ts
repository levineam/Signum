export interface Note {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  userId?: string // Optional for now since we're using localStorage
}

export interface CreateNoteRequest {
  title: string
  content?: string
}

export interface UpdateNoteRequest {
  id: string
  title?: string
  content?: string
}