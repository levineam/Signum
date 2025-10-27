'use client'

/**
 * Self-Compassion Break Helper Component
 * Story 2.5.7: Evidence-based self-compassion practice
 *
 * Based on Kristin Neff's Self-Compassion Break:
 * https://self-compassion.org/exercise-2-self-compassion-break/
 *
 * Three components of self-compassion:
 * 1. Mindfulness - Recognizing suffering without over-identifying
 * 2. Common Humanity - Remembering suffering is shared human experience
 * 3. Self-Kindness - Treating yourself with warmth and understanding
 *
 * Features:
 * - Single text area for describing difficult situation
 * - Generated compassionate response with 3-step structure
 * - HTML paragraph formatting for journal insertion
 * - Usage tracking integration
 * - Full WCAG AA accessibility compliance
 * - Orange/amber gradient styling
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'
import { HelperContainer } from './HelperContainer'

interface SelfCompassionHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

export function SelfCompassionHelper({ entryId, userId, onInsert }: SelfCompassionHelperProps) {
  const [situation, setSituation] = useState('')
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
      announce('Self-Compassion Break helper expanded. Describe a difficult moment.')
    } else {
      announce('Self-Compassion Break helper collapsed')
    }
  }

  // Check if form can be submitted
  const canSubmit = (): boolean => {
    return situation.trim() !== ''
  }

  // Format self-compassion break as HTML paragraphs
  const formatCompassionBreak = (): string => {
    const parts: string[] = []

    // Header
    parts.push('<p><strong>Self-Compassion Break</strong></p>')
    parts.push('<p><br></p>')

    // User's situation
    parts.push('<p><strong>What\'s difficult right now:</strong></p>')
    parts.push(`<p>${situation}</p>`)
    parts.push('<p><br></p>')

    // Step 1: Mindfulness
    parts.push('<p><strong>Mindfulness:</strong> This is a moment of suffering. It\'s okay to feel what I\'m feeling.</p>')
    parts.push('<p><br></p>')

    // Step 2: Common Humanity
    parts.push('<p><strong>Common Humanity:</strong> Suffering is a part of life. I\'m not alone in this. Others have felt this way too.</p>')
    parts.push('<p><br></p>')

    // Step 3: Self-Kindness
    parts.push('<p><strong>Self-Kindness:</strong> May I be kind to myself in this moment. May I give myself the compassion I need.</p>')
    parts.push('<p><br></p>')

    return parts.join('')
  }

  // Handle insert to journal
  const handleInsert = async () => {
    if (!canSubmit()) return

    // Format compassion break text
    const compassionText = formatCompassionBreak()

    // Track inserted event
    const insertedEvent: HelperEvent = {
      type: 'helper_inserted',
      timestamp: new Date().toISOString(),
      data: {
        insertedText: compassionText,
        fieldCompletionCount: 1
      }
    }
    addEvent(insertedEvent)

    // Log usage to database (non-blocking)
    try {
      await createHelperUsage({
        helperType: 'self-compassion',
        entryId: entryId,
        selectedItems: [],
        metadata: {
          events: eventsRef.current,
          selectionCount: 0,
          insertedText: compassionText,
          situationCharacterCount: situation.length
        }
      }, userId)
    } catch (error) {
      console.error('Failed to log helper usage:', error)
      // Don't block user interaction if logging fails
    }

    // Announce and callback
    announce('Inserted self-compassion break into journal')
    onInsert(compassionText)

    // Reset state
    setSituation('')
    eventsRef.current = []

    // Collapse the helper after insertion
    if (collapseHelperRef.current) {
      collapseHelperRef.current()
    }
  }

  // Handle clear field
  const handleClear = () => {
    setSituation('')

    // Track cleared event
    addEvent({
      type: 'helper_cleared',
      timestamp: new Date().toISOString(),
      data: { previousFieldCount: 1 }
    })

    announce('Field cleared')
  }

  return (
    <>
      {/* Screen reader live region for announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveRegionMessage}
      </div>

      <HelperContainer
        helperType="self-compassion"
        headerText="Need some self-compassion?"
        descriptionText="Take a moment to acknowledge a difficult situation with kindness."
        variant="default"
        onExpandChange={handleExpandChange}
        collapseRef={collapseHelperRef}
        showDismiss={false}
        defaultExpanded={false}
        testId="self-compassion"
        infoContent={{
          title: "Self-Compassion Break",
          description: "Kristin Neff's three-step practice for responding to difficult moments with kindness instead of self-criticism. Combines mindfulness, common humanity, and self-kindness to reduce suffering.",
          effectSize: "d=0.47 for well-being improvements",
          citation: "Neff, K. D., & Germer, C. K. (2013). A pilot study and randomized controlled trial of the mindful self-compassion program. Journal of Clinical Psychology, 69(1), 28-44.",
          learnMoreUrl: "https://self-compassion.org/exercise-2-self-compassion-break/"
        }}
      >
        {/* Self-Compassion Form */}
        <div className="space-y-4">
          {/* Situation Description */}
          <div>
            <label
              htmlFor="compassion-situation"
              className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2"
            >
              Describe what&apos;s difficult right now
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              What&apos;s happening that feels hard? Be as specific as you&apos;d like.
            </p>
            <Textarea
              id="compassion-situation"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="Right now, I&apos;m struggling with..."
              className="bg-white dark:bg-gray-950 min-h-[120px]"
              data-testid="compassion-situation"
            />
          </div>

          {/* Three-Step Preview */}
          <div className="p-4 rounded-md bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-900 dark:text-amber-100 mb-2">
              <strong>Three Steps of Self-Compassion:</strong>
            </p>
            <ol className="text-xs text-amber-800 dark:text-amber-200 space-y-1 list-decimal list-inside">
              <li><strong>Mindfulness:</strong> Acknowledge this is a moment of suffering</li>
              <li><strong>Common Humanity:</strong> Remember you&apos;re not alone</li>
              <li><strong>Self-Kindness:</strong> Offer yourself compassion</li>
            </ol>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-800 mt-4">
          <Button
            onClick={handleInsert}
            disabled={!canSubmit()}
            className="bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-700 dark:hover:bg-amber-600"
            size="sm"
            data-testid="compassion-insert-button"
          >
            Add to Journal Entry
          </Button>
          <Button
            onClick={handleClear}
            disabled={!situation}
            variant="ghost"
            size="sm"
            className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:text-amber-100 dark:hover:bg-amber-900/50"
            data-testid="compassion-clear-button"
          >
            Clear
          </Button>
        </div>
      </HelperContainer>
    </>
  )
}
