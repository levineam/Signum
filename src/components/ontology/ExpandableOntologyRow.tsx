'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Note, getNoteDisplayTitle } from '@/types/note'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { MicroExerciseModal } from '@/components/exercises/MicroExerciseModal'
import { getExerciseForSection, ExerciseResult } from '@/lib/exercises/types'
import { getExerciseDefinition } from '@/lib/exercises/content'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface ExpandableOntologyRowProps {
  note: Note
  isExpanded: boolean
  onToggle: () => void
  onItemsUpdated?: () => void
}

export function ExpandableOntologyRow({
  note,
  isExpanded,
  onToggle,
  onItemsUpdated
}: ExpandableOntologyRowProps) {
  const { user } = useAuth()
  const category = note.noteType.replace('ontology-', '')
  const contentId = `ontology-${category}-content`
  const buttonRef = useRef<HTMLButtonElement>(null)
  const liveRegionRef = useRef<HTMLDivElement>(null)
  const title = getNoteDisplayTitle(note)

  const [showExerciseModal, setShowExerciseModal] = useState(false)

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

  // Check if exercise is available for this section
  const exerciseType = getExerciseForSection(note.noteType)
  const exerciseDefinition = exerciseType ? getExerciseDefinition(exerciseType) : null
  const showDiscoverButton = items.length === 0 && exerciseDefinition !== null

  // Handle exercise completion
  const handleExerciseComplete = useCallback(async (result: ExerciseResult) => {
    // Trigger synthesis
    try {
      const response = await fetch('/api/exercises/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          exerciseType: result.exerciseType
        })
      })

      if (response.ok) {
        toast.success('Saved to your ontology!')
        onItemsUpdated?.()
      } else {
        toast.error('Failed to synthesize results')
      }
    } catch (error) {
      console.error('Synthesis error:', error)
      toast.error('Something went wrong')
    }

    setShowExerciseModal(false)
  }, [user?.id, onItemsUpdated])

  // Get friendly exercise label
  const exerciseLabel = exerciseType === 'values'
    ? 'Discover your values'
    : exerciseType === 'purpose'
      ? 'Discover your purpose'
      : `Discover your ${exerciseType}`

  return (
    <>
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
                    {items.map((item) => (
                      <li key={item.name}>• {item.name}</li>
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
            aria-labelledby={`${category}-heading`}
          >
            <CardContent className="px-6 pb-6 pt-0 space-y-6">
              {/* Auto-update notice */}
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4 text-sm text-amber-900 dark:text-amber-100">
                This note is automatically updated as you write in your journal.
              </div>

              {/* Concept sections with excerpts */}
              {items.map((item) => (
                <div key={item.name} className="space-y-3">
                  <h3
                    id={`${category}-heading`}
                    className="text-base font-semibold"
                  >
                    {item.name}
                  </h3>
                  <div className="space-y-2">
                    {item.excerpts.map((excerpt, idx) => (
                      <blockquote
                        key={idx}
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
              ))}

              {items.length === 0 && (
                <div className="text-center py-8 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    No items yet. Click &ldquo;Analyze My Notes&rdquo; to extract your {title.toLowerCase()}.
                  </p>

                  {/* Discover button */}
                  {showDiscoverButton && user && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowExerciseModal(true)
                      }}
                      className="gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      {exerciseLabel}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </div>
        )}
      </Card>

      {/* Exercise Modal */}
      {exerciseDefinition && user && (
        <MicroExerciseModal
          open={showExerciseModal}
          onOpenChange={setShowExerciseModal}
          exercise={exerciseDefinition}
          userId={user.id}
          onComplete={handleExerciseComplete}
        />
      )}
    </>
  )
}
