'use client'

import { Note } from '@/types/note'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

interface RegularNoteCardProps {
  note: Note
}

export function RegularNoteCard({ note }: RegularNoteCardProps) {
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

  return (
    <Link href={`/notes/${note.id}`} className="block mb-4">
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium mb-1 truncate">{note.title}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {note.content ? getPreview(note.content) : 'No content'}
              </p>
            </div>
            <time className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDate(note.createdAt)}
            </time>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}