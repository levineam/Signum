'use client'

/**
 * Best Possible Self Helper Component
 * Story 2.5.9: Evidence-based future visualization
 *
 * Based on Laura King (2001) research on imagining best possible selves.
 * Participants who write about their best possible future self for 20 minutes
 * show increased well-being and life satisfaction.
 *
 * Citation: King, L. A. (2001). The health benefits of writing about life goals.
 * Personality and Social Psychology Bulletin, 27(7), 798-807.
 *
 * Features:
 * - Single text area for future vision (5-10 years)
 * - Guidance on three life domains (personal, professional, relational)
 * - HTML paragraph formatting for journal insertion
 * - Usage tracking integration
 * - Full WCAG AA accessibility compliance
 * - Yellow/amber gradient styling
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'
import { HelperContainer } from './HelperContainer'
import { escapeHtml } from '@/utils/htmlEscape'

interface BestPossibleSelfHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

/**
 * BestPossibleSelfContent Component
 * Story 2.9: Extracted content for use in dialog (without HelperContainer wrapper)
 */
export function BestPossibleSelfContent({ entryId, userId, onInsert }: BestPossibleSelfHelperProps) {
  const [vision, setVision] = useState('')
  const [liveRegionMessage, setLiveRegionMessage] = useState('')

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

  // Check if form can be submitted
  const canSubmit = (): boolean => {
    return vision.trim() !== ''
  }

  // Count words in vision
  const getWordCount = (): number => {
    return vision.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  // Format best possible self as HTML paragraphs
  const formatBestSelf = (): string => {
    const parts: string[] = []

    // Header
    parts.push('<p><strong>My Best Possible Self</strong></p>')
    parts.push('<p><br></p>')

    // Split vision into paragraphs (preserve user's line breaks)
    const paragraphs = vision.split('\n').filter(p => p.trim())
    paragraphs.forEach(paragraph => {
      parts.push(`<p>${escapeHtml(paragraph)}</p>`)
      parts.push('<p><br></p>')
    })

    return parts.join('')
  }

  // Handle insert to journal
  const handleInsert = async () => {
    if (!canSubmit()) return

    // Format vision text
    const visionText = formatBestSelf()

    // Track inserted event
    const insertedEvent: HelperEvent = {
      type: 'helper_inserted',
      timestamp: new Date().toISOString(),
      data: {
        insertedText: visionText,
        fieldCompletionCount: 1
      }
    }
    addEvent(insertedEvent)

    // Log usage to database (non-blocking)
    try {
      await createHelperUsage({
        helperType: 'best-possible-self',
        entryId: entryId,
        selectedItems: [],
        metadata: {
          events: eventsRef.current,
          selectionCount: 0,
          insertedText: visionText,
          visionCharacterCount: vision.length,
          visionWordCount: getWordCount()
        }
      }, userId)
    } catch (error) {
      console.error('Failed to log helper usage:', error)
      // Don't block user interaction if logging fails
    }

    // Announce and callback
    announce('Inserted best possible self vision into journal')
    onInsert(visionText)

    // Reset state
    setVision('')
    eventsRef.current = []
  }

  // Handle clear field
  const handleClear = () => {
    setVision('')

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

      {/* Header */}
      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300">
          Visualize yourself 5-10 years from now, having achieved your most important goals.
        </p>
      </div>

      {/* Best Possible Self Form */}
      <div className="space-y-4">
        {/* Instructions */}
        <div className="p-4 rounded-md bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-900 dark:text-yellow-100 mb-2">
            <strong>Instructions:</strong>
          </p>
          <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">
            Imagine yourself 5-10 years from now. Everything has gone as well as it realistically could.
            You&apos;ve worked toward your goals and made meaningful progress.
          </p>
          <p className="text-xs text-yellow-800 dark:text-yellow-200">
            Consider: <strong>Personal growth</strong> (What have you learned?),
            <strong> Professional life</strong> (What are you doing?), and
            <strong> Relationships</strong> (Who are you close to?). Write in detail about what you see.
          </p>
        </div>

        {/* Vision Text Area */}
        <div>
          <label
            htmlFor="best-self-vision"
            className="block text-sm font-medium text-green-800 dark:text-green-200 mb-2"
          >
            Your best possible self
          </label>
          <Textarea
            id="best-self-vision"
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            placeholder="In 5-10 years, I see myself..."
            className="bg-white dark:bg-gray-950 min-h-[200px]"
            data-testid="best-self-vision"
          />
          {vision.length > 0 && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              {getWordCount()} words
            </p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-4 border-t border-green-200 dark:border-green-800 mt-4">
        <Button
          onClick={handleInsert}
          disabled={!canSubmit()}
          className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
          size="sm"
          data-testid="best-self-insert-button"
        >
          Add to Journal Entry
        </Button>
        <Button
          onClick={handleClear}
          disabled={!vision}
          variant="ghost"
          size="sm"
          className="text-green-700 hover:text-green-900 hover:bg-green-100 dark:text-green-300 dark:hover:text-green-100 dark:hover:bg-green-900/50"
          data-testid="best-self-clear-button"
        >
          Clear
        </Button>
      </div>
    </>
  )
}

/**
 * BestPossibleSelfHelper Component (Original with HelperContainer)
 * Kept for backward compatibility
 */
export function BestPossibleSelfHelper({ entryId, userId, onInsert }: BestPossibleSelfHelperProps) {
  const collapseHelperRef = useRef<(() => void) | null>(null)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')

  const announce = (message: string) => {
    setLiveRegionMessage(message)
    setTimeout(() => setLiveRegionMessage(''), 1000)
  }

  const handleExpandChange = (isExpanded: boolean) => {
    if (isExpanded) {
      announce('Best Possible Self helper expanded. Imagine your ideal future.')
    } else {
      announce('Best Possible Self helper collapsed')
    }
  }

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveRegionMessage}
      </div>

      <HelperContainer
        helperType="best-possible-self"
        headerText="Imagine your best possible future"
        descriptionText="Visualize yourself 5-10 years from now, having achieved your most important goals."
        variant="green"
        onExpandChange={handleExpandChange}
        collapseRef={collapseHelperRef}
        showDismiss={false}
        defaultExpanded={false}
        testId="best-possible-self"
        infoContent={{
          title: "Best Possible Self",
          description: "Writing about your ideal future self increases well-being, optimism, and life satisfaction. Focus on a realistic best-case scenario across personal, professional, and relational domains.",
          effectSize: "d=0.28 for well-being improvements",
          citation: "King, L. A. (2001). The health benefits of writing about life goals. Personality and Social Psychology Bulletin, 27(7), 798-807."
        }}
      >
        <BestPossibleSelfContent entryId={entryId} userId={userId} onInsert={onInsert} />
      </HelperContainer>
    </>
  )
}
