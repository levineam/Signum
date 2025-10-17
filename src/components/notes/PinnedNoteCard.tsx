'use client'

import { Note, getNoteDisplayTitle } from '@/types/note'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface PinnedNoteCardProps {
  note: Note
}

export function PinnedNoteCard({ note }: PinnedNoteCardProps) {
  const getPreviewText = () => {
    // Check if this is an ontology card with metadata.items
    const items = (note.metadata?.items as Array<{ name: string }>) || []
    if (items.length > 0) {
      const itemCount = items.length
      const preview = items.map(item => item.name).join(', ')
      return preview.length > 60 ? `${itemCount} items` : preview
    }

    // For aims notes with JSON content, parse and count
    const noteType = 'type' in note ? (note as { type: string }).type : note.noteType
    if (noteType === 'aims' || noteType === 'ontology-aim') {
      try {
        const parsed = JSON.parse(note.content)
        const todoLength = (parsed.todos || '').length
        const goalLength = (parsed.goals || '').length
        if (todoLength + goalLength > 0) {
          return `${todoLength + goalLength} characters`
        }
      } catch {
        // Fall through to content check
      }
    }

    // Default: check content length
    return note.content.length > 0 ? `${note.content.length} characters` : 'Empty'
  }

  return (
    <Link href={`/notes/${note.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-2">{getNoteDisplayTitle(note)}</h3>
          <p className="text-sm text-muted-foreground">
            {getPreviewText()}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}