'use client'

/**
 * Mental Contrasting Helper Component
 * Story 2.5.13: Streamlined goal feasibility assessment
 *
 * Based on Gabriele Oettingen's mental contrasting research
 * Simplified version of WOOP for decision-making
 *
 * Features:
 * - 2 text areas: Desired Future + Internal Obstacle
 * - Streamlined goal evaluation (no full WOOP)
 * - HTML paragraph formatting for journal insertion
 * - Usage tracking integration
 * - Full WCAG AA accessibility compliance
 * - Indigo/violet gradient styling
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'
import { HelperContainer } from './HelperContainer'
import { escapeHtml } from '@/utils/htmlEscape'

interface MentalContrastingHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

interface ContrastingSteps {
  desiredFuture: string
  internalObstacle: string
}

export function MentalContrastingHelper({ entryId, userId, onInsert }: MentalContrastingHelperProps) {
  const [steps, setSteps] = useState<ContrastingSteps>({
    desiredFuture: '',
    internalObstacle: ''
  })
  const [liveRegionMessage, setLiveRegionMessage] = useState('')

  // Ref to access HelperContainer's collapse function
  const collapseHelperRef = useRef<(() => void) | null>(null)

  // Track events for usage logging
  const eventsRef = useRef<HelperEvent[]>([])

  // Helper function to add event to tracking
  const addEvent = (event: HelperEvent) => {
    eventsRef.current.push(event)
  }

  // Helper function to announce to screen readers
  const announce = (message: string) => {
    setLiveRegionMessage(message)
    // Clear after announcement
    setTimeout(() => setLiveRegionMessage(''), 1000)
  }

  // Handle expand/collapse from HelperContainer
  const handleExpandChange = (isExpanded: boolean) => {
    if (isExpanded) {
      // Track helper opened event
      addEvent({
        type: 'helper_opened',
        timestamp: new Date().toISOString(),
        data: { triggerSource: 'manual' }
      })
      announce('Mental Contrasting helper expanded. Contrast your desired future with potential obstacles.')
    } else {
      announce('Mental Contrasting helper collapsed')
    }
  }

  // Handle step changes
  const handleStepChange = (field: keyof ContrastingSteps, value: string) => {
    setSteps(prev => ({ ...prev, [field]: value }))
  }

  // Check if form can be submitted
  const canSubmit = (): boolean => {
    return steps.desiredFuture.trim() !== ''
  }

  // Format mental contrasting entry as HTML paragraphs
  const formatMentalContrasting = (): string => {
    const parts: string[] = []

    // Header
    parts.push('<p><strong>Mental Contrasting</strong></p>')
    parts.push('<p><br></p>')

    // Desired Future
    if (steps.desiredFuture.trim()) {
      parts.push('<p><strong>Desired Future:</strong></p>')
      // Split by newlines and convert each paragraph
      const futureParagraphs = steps.desiredFuture.trim().split('\n').filter(p => p.trim())
      futureParagraphs.forEach(paragraph => {
        parts.push(`<p>${escapeHtml(paragraph)}</p>`)
      })
      parts.push('<p><br></p>')
    }

    // Internal Obstacle
    if (steps.internalObstacle.trim()) {
      parts.push('<p><strong>Internal Obstacle:</strong></p>')
      // Split by newlines and convert each paragraph
      const obstacleParagraphs = steps.internalObstacle.trim().split('\n').filter(p => p.trim())
      obstacleParagraphs.forEach(paragraph => {
        parts.push(`<p>${escapeHtml(paragraph)}</p>`)
      })
      parts.push('<p><br></p>')
    }

    return parts.join('')
  }

  // Handle insert to journal
  const handleInsert = async () => {
    if (!canSubmit()) return

    // Format mental contrasting entry text
    const mcText = formatMentalContrasting()

    // Track inserted event
    const insertedEvent: HelperEvent = {
      type: 'helper_inserted',
      timestamp: new Date().toISOString(),
      data: {
        insertedText: mcText,
        fieldCompletionCount: (steps.desiredFuture.trim() ? 1 : 0) + (steps.internalObstacle.trim() ? 1 : 0)
      }
    }
    addEvent(insertedEvent)

    // Insert into journal
    onInsert(mcText)

    // Log to database (non-blocking)
    try {
      await createHelperUsage({
        helperType: 'mental-contrasting',
        entryId,
        selectedItems: [],
        metadata: {
          events: [...eventsRef.current],
          selectionCount: 0,
          insertedText: mcText,
          mcStepCounts: {
            desiredFuture: steps.desiredFuture.trim().length,
            internalObstacle: steps.internalObstacle.trim().length
          },
          mcBothFieldsFilled: steps.desiredFuture.trim() !== '' && steps.internalObstacle.trim() !== ''
        }
      }, userId)
    } catch (error) {
      console.error('Failed to log mental contrasting helper usage:', error)
      // Continue anyway - logging failure shouldn't block user
    }

    // Announce success
    announce('Mental contrasting added to journal')

    // Reset form
    setSteps({
      desiredFuture: '',
      internalObstacle: ''
    })

    // Clear events for next usage
    eventsRef.current = []

    // Collapse helper
    if (collapseHelperRef.current) {
      collapseHelperRef.current()
    }
  }

  return (
    <HelperContainer
      helperType="mental-contrasting"
      headerText="Evaluate a goal or decision"
      descriptionText="Contrast your desired future with potential obstacles to assess feasibility and commitment."
      variant="blue"
      onExpandChange={handleExpandChange}
      collapseRef={collapseHelperRef}
      showDismiss={false}
      defaultExpanded={false}
      testId="mental-contrasting"
      infoContent={{
        title: "Mental Contrasting",
        description: "Gabriele Oettingen's evidence-based technique for evaluating goal feasibility by contrasting desired outcomes with potential obstacles.",
        effectSize: "Same mechanism as WOOP (d = 0.34-0.65 across studies)",
        citation: "Oettingen, G. (2014). Rethinking positive thinking: Inside the new science of motivation. Current Directions in Psychological Science, 21(6), 537-541.",
        learnMoreUrl: "https://woopmylife.org/en/science"
      }}
    >
      {/* Live region for screen reader announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveRegionMessage}
      </div>

      <div className="space-y-4">
        {/* Instructions */}
        <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-900/20">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>How it works:</strong> Visualize your desired future, then identify the internal obstacle
            that might prevent it. This contrast helps you assess if the goal is worth pursuing and how committed you feel.
          </p>
        </div>

        {/* Desired Future */}
        <div className="space-y-2">
          <label
            htmlFor="mc-desired-future"
            className="text-sm font-medium text-gray-700"
          >
            Desired Future
          </label>
          <Textarea
            id="mc-desired-future"
            value={steps.desiredFuture}
            onChange={(e) => handleStepChange('desiredFuture', e.target.value)}
            placeholder="What would you like to happen? Be specific and time-bound. (e.g., 'In 3 months, I'll have launched my side project and gained 100 users.')"
            className="min-h-[100px] resize-y"
            aria-label="Desired future - what you want to happen"
          />
        </div>

        {/* Internal Obstacle */}
        <div className="space-y-2">
          <label
            htmlFor="mc-internal-obstacle"
            className="text-sm font-medium text-gray-700"
          >
            Internal Obstacle (optional)
          </label>
          <Textarea
            id="mc-internal-obstacle"
            value={steps.internalObstacle}
            onChange={(e) => handleStepChange('internalObstacle', e.target.value)}
            placeholder="What inside you might prevent this? Think about thoughts, feelings, or habits. (e.g., 'My tendency to procrastinate when I feel overwhelmed.')"
            className="min-h-[100px] resize-y"
            aria-label="Internal obstacle - what inside you might prevent this (optional)"
          />
        </div>

        {/* Add to Journal button */}
        <Button
          onClick={handleInsert}
          disabled={!canSubmit()}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-medium"
          aria-label="Add mental contrasting to journal"
        >
          Add to Journal Entry
        </Button>
      </div>
    </HelperContainer>
  )
}
