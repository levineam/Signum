'use client'

import { Note } from '@/types/note'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { deleteNote } from '@/lib/notes'
import { useAuth } from '@/contexts/AuthContext'

interface RegularNoteCardProps {
  note: Note
  onDeleted?: (noteId: string) => void
}

export function RegularNoteCard({ note, onDeleted }: RegularNoteCardProps) {
  const { user } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPreview = (content: string, maxLength: number = 100) => {
    // Strip HTML tags for preview
    const text = content.replace(/<[^>]*>/g, '')
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const getOntologyPreview = () => {
    const items = (note.metadata?.items as Array<{ name: string }>) || []
    if (items.length === 0) return 'Empty'
    const names = items.map(item => item.name).join(', ')
    return names.length > 100 ? names.substring(0, 100) + '...' : names
  }

  const isOntologyCard = note.noteType === 'ontology-value' ||
                         note.noteType === 'ontology-belief' ||
                         note.noteType === 'ontology-aim'

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) return

    const confirmed = window.confirm(`Are you sure you want to delete "${note.title}"? This action cannot be undone.`)
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const success = await deleteNote(note.id, user.id)
      if (success) {
        onDeleted?.(note.id)
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mb-4 relative group">
      <Link href={`/notes/${note.id}`} className="block">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium mb-1 truncate">{note.title}</h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {isOntologyCard
                    ? getOntologyPreview()
                    : note.content
                      ? getPreview(note.content)
                      : 'No content'}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <time className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(note.createdAt)}
                </time>
                {/* Spacer for delete button to prevent layout shift */}
                <div className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      {/* Delete button positioned absolutely outside the link to avoid nested interactive elements */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity z-10 pointer-events-none group-hover:pointer-events-auto focus:pointer-events-auto"
        onClick={handleDelete}
        disabled={isDeleting}
        aria-label={`Delete note: ${note.title}`}
        tabIndex={0}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  )
}