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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
    clearCache,
    prewrittenText,
    aiText,
  } = useOntologyWritingSpark()

  // Check if we're in comparison mode (both prompts available)
  const isComparisonMode = !!prewrittenText && !!aiText

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

        {/* Writing prompts - comparison mode shows both */}
        {isComparisonMode ? (
          <div className="space-y-4">
            {/* Pre-written prompt */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 p-3">
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">
                Pre-written Prompt
              </div>
              <p className="text-lg leading-relaxed italic text-foreground/90">
                {loading ? '…' : prewrittenText}
              </p>
            </div>

            {/* AI-generated prompt */}
            <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 p-3">
              <div className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2 uppercase tracking-wide">
                AI-Generated (GPT-5-mini)
              </div>
              <p className="text-lg leading-relaxed italic text-foreground/90">
                {loading ? '…' : aiText}
              </p>
            </div>
          </div>
        ) : (
          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger asChild>
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
                  <p className="text-xl leading-relaxed pr-8 italic magical-prompt">
                    {loading ? '…' : text}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {AI_DISCLOSURE}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Exercise button - shown alongside prompt when an exercise is suggested */}
        {suggestedExercise && (
          <div className="mt-4">
            <div className="flex justify-center">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setExerciseModalOpen(true)
                      }}
                    >
                      Ontology Exercise
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Improve your ontology and gain deeper insight into yourself.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
