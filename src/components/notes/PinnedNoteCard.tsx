'use client'

import { Note, getNoteDisplayTitle } from '@/types/note'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface PinnedNoteCardProps {
  note: Note
}

export function PinnedNoteCard({ note }: PinnedNoteCardProps) {
  const MAX_PREVIEW_ITEMS = 5

  const renderPreview = () => {
    // Check if this is an ontology card with metadata.items
    const items = (note.metadata?.items as Array<{ name: string }>) || []
    if (items.length > 0) {
      const displayItems = items.slice(0, MAX_PREVIEW_ITEMS)
      const remaining = items.length - displayItems.length

      return (
        <div className="space-y-1.5">
          {displayItems.map((item, idx) => (
            <div key={idx} className="text-sm text-muted-foreground truncate">
              • {item.name}
            </div>
          ))}
          {remaining > 0 && (
            <div className="text-sm text-muted-foreground/70 italic">
              ... and {remaining} more
            </div>
          )}
        </div>
      )
    }

    // For aims notes with JSON content, parse and count
    const noteType = 'type' in note ? (note as { type: string }).type : note.noteType
    if (noteType === 'aims' || noteType === 'ontology-aim') {
      try {
        const parsed = JSON.parse(note.content)
        const todoLength = (parsed.todos || '').length
        const goalLength = (parsed.goals || '').length
        if (todoLength + goalLength > 0) {
          return (
            <p className="text-sm text-muted-foreground">
              {todoLength + goalLength} characters
            </p>
          )
        }
      } catch {
        // Fall through to content check
      }
    }

    // Default: check content length
    return (
      <p className="text-sm text-muted-foreground">
        {note.content.length > 0 ? `${note.content.length} characters` : 'Empty'}
      </p>
    )
  }

  return (
    <Link href={`/notes/${note.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-2">{getNoteDisplayTitle(note)}</h3>
          {renderPreview()}
        </CardContent>
      </Card>
    </Link>
  )
}