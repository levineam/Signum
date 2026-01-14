'use client'

import { useEffect, useState } from 'react'
import { X, Info } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useOntologyWritingSpark } from '@/hooks/useOntologyWritingSpark'
import { ExerciseModal } from '@/components/exercises/ExerciseModal'

/**
 * OntologyInsightCard
 *
 * Guiding Principle: Spark writing inspiration that makes the user feel understood.
 * - Invitation, not instruction
 * - Questions, not statements
 * - Warm, not clinical
 * - Writing-focused (inspire journaling, not "complete ontology")
 * - Magical, not mechanical
 *
 * Anti-patterns (never do these):
 * - "Your X section is empty/incomplete"
 * - "You should update your Y"
 * - "Before doing Z, first do W"
 * - "It's been N days since you..."
 * - Any language that implies tasks, gaps, or deficiencies
 */

const ONTOLOGY_BLURB =
  "Your ontology is a living map of what you believe, what you value, and what you're moving toward. As it gets clearer, it becomes easier to notice what matters most — and find the right thing to write about today."

const AI_DISCLOSURE =
  "This prompt is personalized using AI based on your ontology data."

const DISMISS_KEY = 'signum-ontology-insight-dismissed-session'

export function OntologyInsightCard() {
  const [dismissed, setDismissed] = useState(false)
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const {
    text,
    loading,
    suggestedExercise,
    clearCache
  } = useOntologyWritingSpark()

  useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === 'true') {
        setDismissed(true)
      }
    } catch {
      // ignore
    }
  }, [])

  if (dismissed) return null

  const dispatchSeed = () => {
    if (loading) return
    window.dispatchEvent(
      new CustomEvent('seed-journal-entry', {
        detail: { text },
      })
    )
  }

  const handleExerciseComplete = () => {
    // Clear the session cache so the prompt will refresh with new ontology data
    clearCache()
    setExerciseModalOpen(false)
  }

  return (
    <>
      <Card
        spacing="compact"
        className="relative p-5 select-none ontology-insight-gold"
        data-ontology-insight-card
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 size-7 opacity-60 hover:opacity-100 bg-background/0 hover:bg-background/10"
          aria-label="Dismiss"
          onClick={(e) => {
            e.stopPropagation()
            try {
              sessionStorage.setItem(DISMISS_KEY, 'true')
            } catch {
              // ignore
            }
            setDismissed(true)
          }}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="mb-3 pr-8 flex items-center gap-2">
          <div className="text-lg leading-none font-semibold tracking-wide text-foreground/80">
            Inspired by your ontology
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setInfoModalOpen(true)
            }}
            className="text-foreground/50 hover:text-foreground/80 transition-colors"
            aria-label="Learn more about your ontology"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>

        {/* Writing prompt - clickable to seed journal */}
        <div
          role="button"
          tabIndex={0}
          className="cursor-pointer rounded-md p-2 -m-2 transition-colors hover:bg-foreground/5"
          onClick={dispatchSeed}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              if (e.key === ' ') {
                e.preventDefault()
              }
              dispatchSeed()
            }
          }}
          aria-label="Click to use this writing prompt in your journal"
        >
          <p className="text-lg leading-relaxed pr-8 text-foreground italic">
            {loading ? '…' : text}
          </p>
        </div>

        {/* AI disclosure for transparency */}
        <p className="text-xs text-foreground/50 mt-3 pr-8">
          {AI_DISCLOSURE}
        </p>

        {/* Exercise button - shown alongside prompt when an exercise is suggested */}
        {suggestedExercise && (
          <div className="mt-4 pt-4 border-t border-foreground/10">
            <div className="flex items-end justify-center gap-6">
              <p className="text-base text-foreground/60 leading-relaxed">
                Improve your ontology and gain deeper insight into yourself.
              </p>
              <Button
                variant="outline"
                size="sm"
                className=""
                onClick={(e) => {
                  e.stopPropagation()
                  setExerciseModalOpen(true)
                }}
              >
                Ontology Exercise
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Exercise Modal */}
      {suggestedExercise && (
        <ExerciseModal
          exerciseType={suggestedExercise}
          isOpen={exerciseModalOpen}
          onClose={() => setExerciseModalOpen(false)}
          onComplete={handleExerciseComplete}
        />
      )}

      {/* Info Modal */}
      <Dialog open={infoModalOpen} onOpenChange={setInfoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>About Your Ontology</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {ONTOLOGY_BLURB}
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}
