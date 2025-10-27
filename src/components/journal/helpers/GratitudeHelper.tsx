'use client'

/**
 * Gratitude / "Three Good Things" Helper Component
 * Story 2.5.5: Evidence-based gratitude journaling
 *
 * Based on Greater Good in Action (GGIA) practice:
 * https://ggia.berkeley.edu/practice/three-good-things
 *
 * Features:
 * - 3 sections with structured prompts (what/feel/why)
 * - HTML paragraph formatting for journal insertion
 * - Usage tracking integration
 * - Full WCAG AA accessibility compliance
 * - Green/emerald gradient styling
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'
import { HelperContainer } from './HelperContainer'
import { escapeHtml } from '@/utils/htmlEscape'

interface GratitudeHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

interface GoodThing {
  title: string
  whatHappened: string
  howIFelt: string
  whyItHappened: string
}

export function GratitudeHelper({ entryId, userId, onInsert }: GratitudeHelperProps) {
  const [goodThings, setGoodThings] = useState<[GoodThing, GoodThing, GoodThing]>([
    { title: '', whatHappened: '', howIFelt: '', whyItHappened: '' },
    { title: '', whatHappened: '', howIFelt: '', whyItHappened: '' },
    { title: '', whatHappened: '', howIFelt: '', whyItHappened: '' }
  ])
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
      announce('Three Good Things helper expanded. Fill in at least one good thing.')
    } else {
      announce('Three Good Things helper collapsed')
    }
  }

  // Update a specific field in a good thing
  const updateGoodThing = (index: number, field: keyof GoodThing, value: string) => {
    const updated = [...goodThings]
    updated[index] = { ...updated[index], [field]: value }
    setGoodThings(updated as [GoodThing, GoodThing, GoodThing])
  }

  // Check if at least one good thing has content
  const hasContent = () => {
    return goodThings.some(thing =>
      thing.title.trim() || thing.whatHappened.trim() || thing.howIFelt.trim() || thing.whyItHappened.trim()
    )
  }

  // Format gratitude entry as HTML paragraphs
  const formatGratitudeEntry = (): string => {
    const parts: string[] = ['<p><strong>Three Good Things</strong></p>', '<p><br></p>']

    goodThings.forEach((thing, index) => {
      // Skip empty good things
      if (!thing.title.trim() && !thing.whatHappened.trim() && !thing.howIFelt.trim() && !thing.whyItHappened.trim()) {
        return
      }

      // Add good thing number and title
      if (thing.title.trim()) {
        parts.push(`<p><strong>${escapeHtml(thing.title)}</strong></p>`)
      } else {
        parts.push(`<p><strong>Good Thing #${index + 1}</strong></p>`)
      }

      // Add what happened
      if (thing.whatHappened.trim()) {
        parts.push(`<p>What happened: ${escapeHtml(thing.whatHappened)}</p>`)
        parts.push('<p><br></p>')
      }

      // Add how I felt
      if (thing.howIFelt.trim()) {
        parts.push(`<p>How I felt: ${escapeHtml(thing.howIFelt)}</p>`)
        parts.push('<p><br></p>')
      }

      // Add why it happened
      if (thing.whyItHappened.trim()) {
        parts.push(`<p>Why it happened: ${escapeHtml(thing.whyItHappened)}</p>`)
        parts.push('<p><br></p>')
      }

      // Add spacing between good things
      parts.push('<p><br></p>')
    })

    return parts.join('')
  }

  // Calculate field completion count
  const getFieldCompletionCount = (): number => {
    return goodThings.reduce((count, thing) => {
      return count +
        (thing.title.trim() ? 1 : 0) +
        (thing.whatHappened.trim() ? 1 : 0) +
        (thing.howIFelt.trim() ? 1 : 0) +
        (thing.whyItHappened.trim() ? 1 : 0)
    }, 0)
  }

  // Get character counts for telemetry
  const getCharacterCounts = () => {
    return {
      goodThing1: {
        title: goodThings[0].title.length,
        what: goodThings[0].whatHappened.length,
        feel: goodThings[0].howIFelt.length,
        why: goodThings[0].whyItHappened.length
      },
      goodThing2: {
        title: goodThings[1].title.length,
        what: goodThings[1].whatHappened.length,
        feel: goodThings[1].howIFelt.length,
        why: goodThings[1].whyItHappened.length
      },
      goodThing3: {
        title: goodThings[2].title.length,
        what: goodThings[2].whatHappened.length,
        feel: goodThings[2].howIFelt.length,
        why: goodThings[2].whyItHappened.length
      }
    }
  }

  // Handle insert to journal
  const handleInsert = async () => {
    if (!hasContent()) return

    // Format reflection text
    const reflectionText = formatGratitudeEntry()

    // Track inserted event
    const insertedEvent: HelperEvent = {
      type: 'helper_inserted',
      timestamp: new Date().toISOString(),
      data: {
        insertedText: reflectionText,
        fieldCompletionCount: getFieldCompletionCount()
      }
    }
    addEvent(insertedEvent)

    // Log usage to database (non-blocking)
    try {
      const charCounts = getCharacterCounts()
      await createHelperUsage({
        helperType: 'gratitude',
        entryId: entryId,
        selectedItems: [],
        metadata: {
          events: eventsRef.current,
          selectionCount: 0,
          insertedText: reflectionText,
          gratitudeFieldsCompleted: getFieldCompletionCount(),
          gratitudeFieldCharCounts: [
            charCounts.goodThing1.title, charCounts.goodThing1.what, charCounts.goodThing1.feel, charCounts.goodThing1.why,
            charCounts.goodThing2.title, charCounts.goodThing2.what, charCounts.goodThing2.feel, charCounts.goodThing2.why,
            charCounts.goodThing3.title, charCounts.goodThing3.what, charCounts.goodThing3.feel, charCounts.goodThing3.why
          ]
        }
      }, userId)
    } catch (error) {
      console.error('Failed to log helper usage:', error)
      // Don't block user interaction if logging fails
    }

    // Announce and callback
    announce('Inserted Three Good Things reflection into journal')
    onInsert(reflectionText)

    // Reset state
    setGoodThings([
      { title: '', whatHappened: '', howIFelt: '', whyItHappened: '' },
      { title: '', whatHappened: '', howIFelt: '', whyItHappened: '' },
      { title: '', whatHappened: '', howIFelt: '', whyItHappened: '' }
    ])
    eventsRef.current = []

    // Collapse the helper after insertion
    if (collapseHelperRef.current) {
      collapseHelperRef.current()
    }
  }

  // Handle clear all fields
  const handleClear = () => {
    const previousCompletionCount = getFieldCompletionCount()
    setGoodThings([
      { title: '', whatHappened: '', howIFelt: '', whyItHappened: '' },
      { title: '', whatHappened: '', howIFelt: '', whyItHappened: '' },
      { title: '', whatHappened: '', howIFelt: '', whyItHappened: '' }
    ])

    // Track cleared event
    addEvent({
      type: 'helper_cleared',
      timestamp: new Date().toISOString(),
      data: { previousFieldCount: previousCompletionCount }
    })

    announce('All fields cleared')
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
        helperType="gratitude"
        headerText="What went well today?"
        descriptionText="Reflect on three good things that happened today. They can be big or small!"
        variant="green"
        onExpandChange={handleExpandChange}
        collapseRef={collapseHelperRef}
        showDismiss={false}
        defaultExpanded={false}
        testId="gratitude"
        infoContent={{
          title: "Three Good Things",
          description: "A gratitude practice where you identify three positive events from your day and reflect on why they happened. Regular practice strengthens well-being and life satisfaction.",
          effectSize: "d=0.31 for well-being improvements",
          citation: "Dickens, L. (2017). Using gratitude to promote positive change. Journal of Positive Psychology.",
          learnMoreUrl: "https://ggia.berkeley.edu/practice/three-good-things"
        }}
      >
        {/* Good Things Form */}
        <div className="space-y-6">
          {goodThings.map((thing, index) => (
            <div
              key={index}
              className="p-4 rounded-md bg-white/50 dark:bg-gray-900/50 border border-green-200 dark:border-green-800"
            >
              <h4 className="font-medium text-green-900 dark:text-green-100 mb-3">
                Good Thing #{index + 1}
              </h4>

              {/* Title */}
              <div className="mb-3">
                <label
                  htmlFor={`gratitude-title-${index}`}
                  className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1"
                >
                  Give it a title (optional)
                </label>
                <Input
                  id={`gratitude-title-${index}`}
                  value={thing.title}
                  onChange={(e) => updateGoodThing(index, 'title', e.target.value)}
                  placeholder="e.g., Coffee with a friend"
                  className="bg-white dark:bg-gray-950"
                  data-testid={`gratitude-title-${index}`}
                />
              </div>

              {/* What happened */}
              <div className="mb-3">
                <label
                  htmlFor={`gratitude-what-${index}`}
                  className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1"
                >
                  What happened?
                </label>
                <Textarea
                  id={`gratitude-what-${index}`}
                  value={thing.whatHappened}
                  onChange={(e) => updateGoodThing(index, 'whatHappened', e.target.value)}
                  placeholder="Describe what happened in detail..."
                  className="bg-white dark:bg-gray-950 min-h-[80px]"
                  data-testid={`gratitude-what-${index}`}
                />
              </div>

              {/* How I felt */}
              <div className="mb-3">
                <label
                  htmlFor={`gratitude-feel-${index}`}
                  className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1"
                >
                  How did this make you feel?
                </label>
                <Textarea
                  id={`gratitude-feel-${index}`}
                  value={thing.howIFelt}
                  onChange={(e) => updateGoodThing(index, 'howIFelt', e.target.value)}
                  placeholder="Describe your emotions..."
                  className="bg-white dark:bg-gray-950 min-h-[60px]"
                  data-testid={`gratitude-feel-${index}`}
                />
              </div>

              {/* Why it happened */}
              <div>
                <label
                  htmlFor={`gratitude-why-${index}`}
                  className="block text-sm font-medium text-green-800 dark:text-green-200 mb-1"
                >
                  Why did this happen?
                </label>
                <Textarea
                  id={`gratitude-why-${index}`}
                  value={thing.whyItHappened}
                  onChange={(e) => updateGoodThing(index, 'whyItHappened', e.target.value)}
                  placeholder="What caused this good thing to happen?"
                  className="bg-white dark:bg-gray-950 min-h-[60px]"
                  data-testid={`gratitude-why-${index}`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-4 border-t border-green-200 dark:border-green-800 mt-4">
          <Button
            onClick={handleInsert}
            disabled={!hasContent()}
            className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
            size="sm"
            data-testid="gratitude-insert-button"
          >
            Add to Journal Entry
          </Button>
          <Button
            onClick={handleClear}
            disabled={!hasContent()}
            variant="ghost"
            size="sm"
            className="text-green-700 hover:text-green-900 hover:bg-green-100 dark:text-green-300 dark:hover:text-green-100 dark:hover:bg-green-900/50"
            data-testid="gratitude-clear-button"
          >
            Clear All
          </Button>
        </div>
      </HelperContainer>
    </>
  )
}
