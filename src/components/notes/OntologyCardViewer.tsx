'use client'

import Link from 'next/link'
import { Note } from '@/types/note'

interface OntologyCardViewerProps {
  note: Note
}

interface OntologyItem {
  name: string
  confidence: 'high' | 'medium' | 'low'
  excerpts: Array<{
    noteId: string
    noteTitle: string
    excerpt: string
  }>
}

export function OntologyCardViewer({ note }: OntologyCardViewerProps) {
  const items = (note.metadata?.items as OntologyItem[]) || []

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-12">
        <p className="text-lg font-medium mb-2">Empty</p>
        <p className="text-sm">
          Click &ldquo;Analyze My Notes&rdquo; on the Notes page to populate this card with AI-extracted insights.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {items.map((item, itemIndex) => (
        <div key={itemIndex} className="space-y-3">
          <h3 className="text-xl font-semibold text-foreground">
            {item.name}
          </h3>
          <ul className="space-y-4 pl-1">
            {item.excerpts.map((excerpt, excerptIndex) => (
              <li key={excerptIndex} className="text-sm leading-relaxed">
                <span className="text-muted-foreground italic">
                  &ldquo;{excerpt.excerpt}&rdquo;
                </span>
                {' '}
                <Link
                  href={`/notes/${excerpt.noteId}`}
                  className="text-primary hover:underline font-medium transition-colors"
                >
                  {excerpt.noteTitle}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
