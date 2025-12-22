'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useOntologyWritingSpark } from '@/hooks/useOntologyWritingSpark'

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

const DISMISS_KEY = 'signum-ontology-insight-dismissed-session'

export function OntologyInsightCard() {
  const [dismissed, setDismissed] = useState(false)
  const { text, loading } = useOntologyWritingSpark()

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
    window.dispatchEvent(
      new CustomEvent('seed-journal-entry', {
        detail: { text },
      })
    )
  }

  return (
    <Card
      spacing="compact"
      role="button"
      tabIndex={0}
      className="relative p-5 cursor-pointer select-none transition-colors ontology-insight-gold"
      onClick={dispatchSeed}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (e.key === ' ') {
            e.preventDefault()
          }
          dispatchSeed()
        }
      }}
      aria-label={text}
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

      <div className="mb-2 pr-8">
        <div className="text-lg leading-none font-semibold tracking-wide text-foreground/80">
          Inspired by your ontology
        </div>
      </div>

      <p className="text-sm leading-relaxed text-foreground/75 mb-3 pr-8">
        {ONTOLOGY_BLURB}
      </p>

      <p className="text-base leading-relaxed pr-8 text-foreground">
        {loading ? '…' : text}
      </p>
    </Card>
  )
}

