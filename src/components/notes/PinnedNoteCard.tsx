'use client'

import { Note } from '@/types/note'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface PinnedNoteCardProps {
  note: Note
}

export function PinnedNoteCard({ note }: PinnedNoteCardProps) {
  const getCharCount = (content: string) => {
    // For aims notes, parse JSON and count both sections
    if (note.type === 'aims') {
      try {
        const parsed = JSON.parse(content)
        return (parsed.todos || '').length + (parsed.goals || '').length
      } catch {
        return content.length
      }
    }
    return content.length
  }

  const charCount = getCharCount(note.content)

  return (
    <Link href={`/notes/${note.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-2">{note.title}</h3>
          <p className="text-sm text-muted-foreground">
            {charCount === 0 ? 'Empty' : `${charCount} characters`}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}