'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SimpleRichEditor } from '@/components/editor/SimpleRichEditor'
import { createNote } from '@/lib/notes'
import { Note } from '@/types/note'
import { Save, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface NoteCreationModalProps {
  isOpen: boolean
  onClose: () => void
  initialTitle: string
  onNoteCreated?: (note: Note) => void
}

export function NoteCreationModal({
  isOpen,
  onClose,
  initialTitle,
  onNoteCreated
}: NoteCreationModalProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Update title when initialTitle changes
  useEffect(() => {
    if (isOpen && initialTitle) {
      setTitle(initialTitle)
    }
  }, [isOpen, initialTitle])

  const buildFallbackNote = (ownerId: string): Note => ({
    id: `local-note-${
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`
    }`,
    userId: ownerId,
    title: title.trim(),
    content: content.trim(),
    noteType: 'custom',
    isPinned: false,
    metadata: { isSample: true },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const handleSave = async () => {
    if (!title.trim()) return

    if (!user) {
      const guestNote = buildFallbackNote('guest-user')
      onNoteCreated?.(guestNote)
      handleClose()
      return
    }

    setIsSaving(true)
    try {
      const controller = new AbortController()
      const createTimeoutMs = 3000
      const createTimeoutPromise = new Promise<Note>((_, reject) => {
        setTimeout(() => {
          controller.abort()
          reject(new Error('createNote timeout exceeded'))
        }, createTimeoutMs)
      })
      const newNote = await Promise.race([
        createNote({
          title: title.trim(),
          content: content.trim(),
          noteType: 'custom' // Notes created from UI are custom notes
        }, user.id, controller.signal),
        createTimeoutPromise
      ])

      onNoteCreated?.(newNote)
      handleClose()
    } catch (error) {
      console.error('Error creating note:', error)
      const fallbackNote = buildFallbackNote(user.id)
      onNoteCreated?.(fallbackNote)
      handleClose()
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    setContent('')
    setIsSaving(false)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl max-h-[85vh] flex flex-col"
        onKeyDown={handleKeyDown}
        data-testid="note-modal"
      >
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="text-2xl">Create New Note</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
          <div className="flex-shrink-0 space-y-2">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title..."
              className="text-lg font-medium"
              autoFocus
            />
          </div>

          <div className="flex-1 flex flex-col min-h-[400px]">
            <div className="flex-1 overflow-y-auto">
              <SimpleRichEditor
                value={content}
                placeholder="Start writing your note content..."
                onChange={setContent}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
            className="flex items-center gap-2"
            data-testid="note-close-button"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="flex items-center gap-2"
            data-testid="note-create-button"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Creating...' : 'Create Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
