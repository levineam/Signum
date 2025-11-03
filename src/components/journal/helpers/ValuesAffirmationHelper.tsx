'use client'

/**
 * Values Self-Affirmation Helper Component
 * Story 2.5.6: Evidence-based values clarification
 *
 * Based on Sherman & Cohen (2006) self-integrity maintenance research.
 * Core ACT principle: Values clarification strengthens psychological flexibility.
 *
 * Features:
 * - Dropdown selector with 9 pre-defined values
 * - 2 structured reflection prompts
 * - HTML paragraph formatting for journal insertion
 * - Usage tracking integration
 * - Full WCAG AA accessibility compliance
 * - Purple/violet gradient styling
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'
import { HelperContainer } from './HelperContainer'
import { escapeHtml } from '@/utils/htmlEscape'

// Evidence-based values list from ACT framework and Cohen research
export const VALUES_OPTIONS = [
  'Relationships',
  'Creativity',
  'Independence',
  'Career',
  'Health',
  'Community',
  'Learning',
  'Spirituality',
  'Other'
] as const

export type ValueOption = typeof VALUES_OPTIONS[number]

interface ValuesAffirmationHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

/**
 * ValuesAffirmationContent Component
 * Story 2.9: Extracted content for use in dialog (without HelperContainer wrapper)
 */
export function ValuesAffirmationContent({ entryId, userId, onInsert }: ValuesAffirmationHelperProps) {
  const [selectedValue, setSelectedValue] = useState<ValueOption | ''>('')
  const [whyImportant, setWhyImportant] = useState('')
  const [specificTime, setSpecificTime] = useState('')
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

  // Handle value selection
  const handleValueSelect = (value: ValueOption) => {
    setSelectedValue(value)
    announce(`Selected value: ${value}`)

    // Track selection event
    addEvent({
      type: 'helper_selection',
      timestamp: new Date().toISOString(),
      data: {
        selectedCount: 1,
        selectedItems: [value]
      }
    })
  }

  // Check if form can be submitted
  const canSubmit = (): boolean => {
    return selectedValue !== '' && (whyImportant.trim() !== '' || specificTime.trim() !== '')
  }

  // Helper function to lowercase first character for prose flow
  const lowercaseFirst = (text: string): string => {
    if (!text) return text
    return text.charAt(0).toLowerCase() + text.slice(1)
  }

  // Helper function to capitalize first character
  const capitalizeFirst = (text: string): string => {
    if (!text) return text
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  // Helper function to strip trailing punctuation
  const cleanSentence = (text: string): string => {
    const trimmed = text.trim()
    return trimmed.replace(/[.!?]+$/, '')
  }

  // Smart formatting for "why important" field
  const formatWhyImportant = (rawText: string): string => {
    const trimmed = rawText.trim()

    // Check if user wrote complete sentence starting with common patterns
    if (trimmed.match(/^(This matters|It matters|This is important|This value)/i)) {
      return capitalizeFirst(trimmed)
    }

    // Check if user already included "because"
    if (trimmed.toLowerCase().startsWith('because ')) {
      const withoutBecause = trimmed.substring(8).trim()
      return `This matters to me because ${lowercaseFirst(withoutBecause)}`
    }

    // Default: add connector
    return `This matters to me because ${lowercaseFirst(trimmed)}`
  }

  // Smart formatting for "specific time" field
  const formatSpecificTime = (rawText: string): string => {
    const trimmed = rawText.trim()

    // Check if user wrote complete sentence starting with common patterns
    if (trimmed.match(/^(A time|One time|I lived|I demonstrated|I showed|I acted|When I)/i)) {
      return capitalizeFirst(trimmed)
    }

    // Check if user already included "when"
    if (trimmed.toLowerCase().startsWith('when ')) {
      const withoutWhen = trimmed.substring(5).trim()
      return `A time I lived this value was when ${lowercaseFirst(withoutWhen)}`
    }

    // Default: add connector
    return `A time I lived this value was ${lowercaseFirst(trimmed)}`
  }

  // Format values entry as HTML paragraphs (prose format)
  const formatValuesEntry = (): string => {
    const sentences: string[] = []

    // Start with affirmation statement
    sentences.push(`Today I'm affirming the value of ${escapeHtml(selectedValue.toLowerCase())}`)

    // Why this matters - apply smart formatting BEFORE escaping
    if (whyImportant.trim()) {
      const formatted = formatWhyImportant(whyImportant)
      const cleaned = cleanSentence(formatted)
      sentences.push(escapeHtml(cleaned))
    }

    // Specific time lived this value - apply smart formatting BEFORE escaping
    if (specificTime.trim()) {
      const formatted = formatSpecificTime(specificTime)
      const cleaned = cleanSentence(formatted)
      sentences.push(escapeHtml(cleaned))
    }

    // Join all sentences with periods
    return `<p>${sentences.join('. ')}.</p>`
  }

  // Handle insert to journal
  const handleInsert = async () => {
    if (!canSubmit()) return

    // Format reflection text
    const reflectionText = formatValuesEntry()

    // Track inserted event
    const insertedEvent: HelperEvent = {
      type: 'helper_inserted',
      timestamp: new Date().toISOString(),
      data: {
        insertedText: reflectionText,
        fieldCompletionCount: (whyImportant.trim() ? 1 : 0) + (specificTime.trim() ? 1 : 0)
      }
    }
    addEvent(insertedEvent)

    // Log usage to database (non-blocking, skip in guest mode)
    if (userId !== 'guest' && entryId !== 'guest-entry') {
      try {
        await createHelperUsage({
          helperType: 'values-affirmation',
          entryId: entryId,
          selectedItems: [selectedValue as string],
          metadata: {
            events: eventsRef.current,
            selectionCount: 1,
            insertedText: reflectionText,
            valuesSelectedValue: selectedValue as string,
            valuesFieldCharCounts: [
              whyImportant.length,
              specificTime.length
            ]
          }
        }, userId)
      } catch (error) {
        console.error('Failed to log helper usage:', error)
        // Don't block user interaction if logging fails
      }
    } else {
      console.log('[Guest Mode] Skipping helper usage logging')
    }

    // Announce and callback
    announce(`Inserted values affirmation for ${selectedValue} into journal`)
    onInsert(reflectionText)

    // Reset state
    setSelectedValue('')
    setWhyImportant('')
    setSpecificTime('')
    eventsRef.current = []
  }

  // Handle clear all fields
  const handleClear = () => {
    setSelectedValue('')
    setWhyImportant('')
    setSpecificTime('')

    // Track cleared event
    addEvent({
      type: 'helper_cleared',
      timestamp: new Date().toISOString(),
      data: { previousFieldCount: 3 }
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

      {/* Header */}
      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300">
          Reflect on a core personal value and why it&apos;s important to you.
        </p>
      </div>

      {/* Values Selection Form */}
      <div className="space-y-4">
          {/* Value Dropdown */}
          <div>
            <label
              htmlFor="value-select"
              className="block text-sm font-medium text-purple-800 dark:text-purple-200 mb-2"
            >
              Choose a core personal value
            </label>
            <Select
              value={selectedValue}
              onValueChange={(value) => handleValueSelect(value as ValueOption)}
            >
              <SelectTrigger
                id="value-select"
                className="bg-white dark:bg-gray-950"
                data-testid="values-select"
              >
                <SelectValue placeholder="Select a value..." />
              </SelectTrigger>
              <SelectContent>
                {VALUES_OPTIONS.map((value) => (
                  <SelectItem
                    key={value}
                    value={value}
                    data-testid={`values-option-${value.toLowerCase()}`}
                  >
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Why Important */}
          <div>
            <label
              htmlFor="why-important"
              className="block text-sm font-medium text-purple-800 dark:text-purple-200 mb-2"
            >
              Why is this value important to you?
            </label>
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
              What does this value mean to you? How does it connect to who you are or want to be?
            </p>
            <Textarea
              id="why-important"
              value={whyImportant}
              onChange={(e) => setWhyImportant(e.target.value)}
              placeholder="This value is important to me because..."
              className="bg-white dark:bg-gray-950 min-h-[100px]"
              data-testid="values-why-important"
            />
          </div>

          {/* Specific Time */}
          <div>
            <label
              htmlFor="specific-time"
              className="block text-sm font-medium text-purple-800 dark:text-purple-200 mb-2"
            >
              Describe a specific time you lived this value
            </label>
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
              Think of a moment when you acted in line with this value. What happened?
            </p>
            <Textarea
              id="specific-time"
              value={specificTime}
              onChange={(e) => setSpecificTime(e.target.value)}
              placeholder="A time I lived this value was when..."
              className="bg-white dark:bg-gray-950 min-h-[100px]"
              data-testid="values-specific-time"
            />
          </div>
        </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-4 border-t border-purple-200 dark:border-purple-800 mt-4">
        <Button
          onClick={handleInsert}
          disabled={!canSubmit()}
          className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-600"
          size="sm"
          data-testid="values-insert-button"
        >
          Add to Journal Entry
        </Button>
        <Button
          onClick={handleClear}
          disabled={!selectedValue && !whyImportant && !specificTime}
          variant="ghost"
          size="sm"
          className="text-purple-700 hover:text-purple-900 hover:bg-purple-100 dark:text-purple-300 dark:hover:text-purple-100 dark:hover:bg-purple-900/50"
          data-testid="values-clear-button"
        >
          Clear All
        </Button>
      </div>
    </>
  )
}

/**
 * ValuesAffirmationHelper Component (Original with HelperContainer)
 * Kept for backward compatibility
 */
export function ValuesAffirmationHelper({ entryId, userId, onInsert }: ValuesAffirmationHelperProps) {
  const collapseHelperRef = useRef<(() => void) | null>(null)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')

  const announce = (message: string) => {
    setLiveRegionMessage(message)
    setTimeout(() => setLiveRegionMessage(''), 1000)
  }

  const handleExpandChange = (isExpanded: boolean) => {
    if (isExpanded) {
      announce('Values Affirmation helper expanded. Select a core value to explore.')
    } else {
      announce('Values Affirmation helper collapsed')
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
        helperType="values-affirmation"
        headerText="What matters most to you?"
        descriptionText="Reflect on a core personal value and why it's important to you."
        variant="purple"
        onExpandChange={handleExpandChange}
        collapseRef={collapseHelperRef}
        showDismiss={false}
        defaultExpanded={false}
        testId="values"
        infoContent={{
          title: "Values Self-Affirmation",
          description: "Reflecting on your core values strengthens your sense of self-integrity and acts as a psychological buffer against stress. This practice is foundational to ACT (Acceptance and Commitment Therapy).",
          effectSize: "d=0.20-0.40 for stress buffering",
          citation: "Sherman, D. K., & Cohen, G. L. (2006). The psychology of self-defense: Self-affirmation theory. Advances in Experimental Social Psychology, 38, 183-242."
        }}
      >
        <ValuesAffirmationContent entryId={entryId} userId={userId} onInsert={onInsert} />
      </HelperContainer>
    </>
  )
}
