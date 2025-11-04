'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SimpleRichEditor } from '@/components/editor/SimpleRichEditor'
import { Note } from '@/types/note'
import { getNoteById, updateNote, deleteNote } from '@/lib/notes'
import { Calendar, Edit, Save, X, Trash2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { sanitizeHtml, useDOMPurifyReady } from '@/utils/sanitizeHtml'

interface NoteViewerProps {
  isOpen: boolean
  onClose: () => void
  noteId: string | null
  onNoteUpdated?: (note: Note) => void
  onNoteDeleted?: (noteId: string) => void
}

export function NoteViewer({
  isOpen,
  onClose,
  noteId,
  onNoteUpdated,
  onNoteDeleted
}: NoteViewerProps) {
  const router = useRouter()
  const { user } = useAuth()
  const isDOMPurifyReady = useDOMPurifyReady()
  const [note, setNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (noteId && isOpen && user) {
      let isActive = true

      getNoteById(noteId, user.id).then(foundNote => {
        // Only update state if this effect is still active (noteId hasn't changed)
        if (isActive) {
          if (foundNote) {
            setNote(foundNote)
            setEditTitle(foundNote.title)
            setEditContent(foundNote.content || '')
          } else {
            setNote(null)
          }
        }
      })

      // Cleanup function to prevent stale updates
      return () => {
        isActive = false
      }
    }
  }, [noteId, isOpen, user])

  const handleEdit = () => {
    // Navigate to the dedicated note page instead of editing in modal
    if (note) {
      onClose()
      router.push(`/notes/${note.id}`)
    }
  }

  const handleCancelEdit = () => {
    if (note) {
      setEditTitle(note.title)
      setEditContent(note.content || '')
    }
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!note || !editTitle.trim() || !user) return

    setIsSaving(true)
    try {
      const updatedNote = await updateNote(note.id, {
        title: editTitle.trim(),
        content: editContent
      }, user.id)

      if (updatedNote) {
        setNote(updatedNote)
        setIsEditing(false)
        onNoteUpdated?.(updatedNote)
      }
    } catch (error) {
      console.error('Error updating note:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!note || !user) return

    const confirmed = window.confirm(`Are you sure you want to delete "${note.title}"? This action cannot be undone.`)
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const success = await deleteNote(note.id, user.id)
      if (success) {
        onNoteDeleted?.(note.id)
        onClose()
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isEditing) {
      handleCancelEdit()
    } else if (e.key === 'Escape' && !isEditing) {
      onClose()
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isEditing) {
      e.preventDefault()
      handleSave()
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (!note) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Note Not Found</DialogTitle>
            <DialogDescription>This note could not be found. It may have been deleted.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 py-4">
            <p className="text-muted-foreground">This note could not be found. It may have been deleted.</p>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Note title..."
                  className="text-lg font-semibold border-0 px-0 shadow-none focus-visible:ring-0"
                  autoFocus
                />
              ) : (
                <DialogTitle
                  className="text-lg font-semibold cursor-pointer hover:text-primary transition-colors"
                  onClick={handleEdit}
                >
                  {note.title}
                </DialogTitle>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || !editTitle.trim()}
                    className="flex items-center gap-1"
                  >
                    <Save className="h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleEdit}
                    className="flex items-center"
                    aria-label="Edit note"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex items-center gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </>
              )}
            </div>
          </div>
          <DialogDescription className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Calendar className="h-3 w-3" />
            <span>Created: {formatDate(note.createdAt)}</span>
            {note.updatedAt && note.updatedAt !== note.createdAt && (
              <span>• Updated: {formatDate(note.updatedAt)}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex-1 overflow-y-auto py-4 cursor-pointer hover:bg-muted/30 transition-colors rounded-md"
          onClick={isEditing ? undefined : handleEdit}
        >
          {isEditing ? (
            <SimpleRichEditor
              value={editContent}
              placeholder="Write your note content here..."
              onChange={setEditContent}
              autoFocus={false}
            />
          ) : (
            <div className="prose prose-sm max-w-none">
              {note.content ? (
                isDOMPurifyReady ? (
                  <div
                    className="text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content) }}
                  />
                ) : (
                  <div className="text-muted-foreground">Loading content...</div>
                )
              ) : (
                <p className="text-muted-foreground italic">This note has no content.</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}