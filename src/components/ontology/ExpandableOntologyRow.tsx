'use client'

import { useRef, useEffect } from 'react'
import { Note, getNoteDisplayTitle } from '@/types/note'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ExpandableOntologyRowProps {
  note: Note
  isExpanded: boolean
  onToggle: () => void
}

export function ExpandableOntologyRow({ note, isExpanded, onToggle }: ExpandableOntologyRowProps) {
  const category = note.noteType.replace('ontology-', '')
  const contentId = `ontology-${category}-${note.id}-content`
  const sectionHeadingId = `${category}-section-heading-${note.id}`
  const buttonRef = useRef<HTMLButtonElement>(null)
  const liveRegionRef = useRef<HTMLDivElement>(null)
  const title = getNoteDisplayTitle(note)

  // Announce expansion state changes to screen readers
  useEffect(() => {
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = isExpanded
        ? `${title} expanded`
        : `${title} collapsed`
    }
  }, [isExpanded, title])

  // Extract items from metadata
  const items = (note.metadata?.items as Array<{
    name: string
    excerpts: Array<{
      noteId: string
      noteTitle: string
      excerpt: string
    }>
  }>) || []

  return (
    <Card className="w-full">
      <button
        ref={buttonRef}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className="w-full text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-t-lg"
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold mb-3">{title}</h2>
              {items.length > 0 && (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {items.map((item, index) => (
                    <li key={`${item.name}-${index}`}>• {item.name}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
          </div>
        </CardContent>
      </button>

      {/* Screen reader live region for announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {isExpanded && (
        <div
          id={contentId}
          className="expanded-content"
          role="region"
          aria-labelledby={sectionHeadingId}
        >
          <CardContent className="px-6 pb-6 pt-0 space-y-6">
            {/* Hidden heading for accessibility - labels the expanded region */}
            <h3 id={sectionHeadingId} className="sr-only">
              {title} details
            </h3>

            {/* Auto-update notice */}
            <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4 text-sm text-amber-900 dark:text-amber-100">
              This note is automatically updated as you write in your journal.
            </div>

            {/* Concept sections with excerpts */}
            {items.map((item, index) => {
              const itemSlug = item.name
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')
              const itemHeadingId = `${category}-${note.id}-item-${itemSlug || 'item'}-${index}-heading`

              return (
                <div key={`${item.name}-${index}`} className="space-y-3">
                  <h4 id={itemHeadingId} className="text-base font-semibold">
                    {item.name}
                  </h4>
                  <div className="space-y-2">
                    {item.excerpts.map((excerpt, idx) => (
                      <blockquote
                      key={excerpt.noteId}
                      className="border-l-4 border-muted pl-4 py-2 text-sm space-y-1"
                    >
                        <p className="text-foreground italic">&ldquo;{excerpt.excerpt}&rdquo;</p>
                        <cite className="text-xs text-muted-foreground not-italic">
                          {excerpt.noteTitle}
                        </cite>
                      </blockquote>
                    ))}
                  </div>
                </div>
              )
            })}

            {items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No items yet. Click &ldquo;Analyze My Notes&rdquo; to extract your {title.toLowerCase()}.
              </p>
            )}
          </CardContent>
        </div>
      )}
    </Card>
  )
}
