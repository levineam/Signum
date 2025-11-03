'use client'

/**
 * Savoring Helper Component
 * Story 2.5.10: Evidence-based positive experience amplification
 *
 * Based on Fred Bryant & Joseph Veroff's savoring research
 * "Savoring: A New Model of Positive Experience" (2007)
 *
 * Features:
 * - Dropdown selector with 8 evidence-based savoring strategies
 * - Single text area for describing savoring experience
 * - HTML paragraph formatting for journal insertion
 * - Usage tracking integration
 * - Full WCAG AA accessibility compliance
 * - Pink/rose gradient styling
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

// Eight savoring strategies from Bryant & Veroff (2007)
export const SAVORING_STRATEGIES = [
  'Sharing with Others',
  'Memory Building',
  'Sensory-Perceptual Sharpening',
  'Behavioral Expression',
  'Self-Congratulation',
  'Absorption',
  'Temporal Awareness',
  'Comparison'
] as const

export type SavoringStrategy = typeof SAVORING_STRATEGIES[number]

// Short descriptions shown in dropdown menu
const STRATEGY_DESCRIPTIONS: Record<SavoringStrategy, string> = {
  'Sharing with Others': 'Tell someone about this positive experience',
  'Memory Building': 'Create a mental snapshot or keep a memento',
  'Sensory-Perceptual Sharpening': 'Focus on what you see, hear, smell, taste, or touch',
  'Behavioral Expression': 'Let yourself smile, laugh, or physically express joy',
  'Self-Congratulation': 'Acknowledge your role in making this happen',
  'Absorption': 'Lose yourself completely in the experience',
  'Temporal Awareness': 'Remind yourself this moment is fleeting',
  'Comparison': 'Think about how this could have been less positive'
}

// Placeholder text for the reflection field based on selected strategy
const STRATEGY_PLACEHOLDERS: Record<SavoringStrategy, string> = {
  'Sharing with Others': 'Describe sharing this positive experience with someone...',
  'Memory Building': 'Describe the mental snapshot or memento you created...',
  'Sensory-Perceptual Sharpening': 'Think of what you saw, heard, smelled, tasted, or felt when something good happened.',
  'Behavioral Expression': 'Describe how you physically expressed your joy (smile, laugh, etc.)...',
  'Self-Congratulation': 'Describe your role in making this good thing happen...',
  'Absorption': 'Describe how you lost yourself completely in the experience...',
  'Temporal Awareness': 'Reflect on this fleeting moment and why it matters...',
  'Comparison': 'Think about how this could have been less positive...'
}

interface SavoringHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

/**
 * SavoringContent Component (Content only, no container)
 * Extracted for use in standalone contexts like NotesPage
 */
export function SavoringContent({ entryId, userId, onInsert }: SavoringHelperProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<SavoringStrategy | ''>('')
  const [reflection, setReflection] = useState('')
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

  // Handle strategy selection
  const handleStrategySelect = (strategy: SavoringStrategy) => {
    setSelectedStrategy(strategy)
    announce(`Selected strategy: ${strategy}`)

    // Track selection event
    addEvent({
      type: 'helper_selection',
      timestamp: new Date().toISOString(),
      data: {
        selectedCount: 1,
        selectedItems: [strategy]
      }
    })
  }

  // Check if form can be submitted
  const canSubmit = (): boolean => {
    return selectedStrategy !== '' && reflection.trim() !== ''
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

  // Format savoring entry as prose (no header)
  const formatSavoringEntry = (): string => {
    if (!reflection.trim()) return ''

    // Split by newlines and convert each paragraph to prose
    const paragraphs = reflection.trim().split('\n').filter(p => p.trim())

    const formattedParagraphs = paragraphs.map(paragraph => {
      const cleaned = cleanSentence(paragraph)
      const capitalized = capitalizeFirst(cleaned)
      return `<p>${escapeHtml(capitalized)}.</p>`
    })

    return formattedParagraphs.join('')
  }

  // Handle insert to journal
  const handleInsert = async () => {
    if (!canSubmit()) return

    // Format savoring entry text
    const savoringText = formatSavoringEntry()

    // Track inserted event
    const insertedEvent: HelperEvent = {
      type: 'helper_inserted',
      timestamp: new Date().toISOString(),
      data: {
        insertedText: savoringText,
        fieldCompletionCount: reflection.trim() ? 1 : 0
      }
    }
    addEvent(insertedEvent)

    // Insert into journal
    onInsert(savoringText)

    // Log to database (non-blocking, skip in guest mode)
    if (userId !== 'guest' && entryId !== 'guest-entry') {
      try {
        await createHelperUsage({
          helperType: 'savoring',
          entryId,
          selectedItems: [selectedStrategy],
          metadata: {
            events: [...eventsRef.current],
            selectionCount: 1,
            insertedText: savoringText,
            savoringStrategy: selectedStrategy,
            reflectionCharacterCount: reflection.length,
            hasReflection: reflection.trim().length > 0
          }
        }, userId)
      } catch (error) {
        console.error('Failed to log savoring helper usage:', error)
        // Continue anyway - logging failure shouldn't block user
      }
    } else {
      console.log('[Guest Mode] Skipping helper usage logging')
    }

    // Announce success
    announce('Savoring entry added to journal')

    // Reset form
    setSelectedStrategy('')
    setReflection('')

    // Clear events for next usage
    eventsRef.current = []
  }

  return (
    <>
      {/* Live region for screen reader announcements */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveRegionMessage}
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300">
          Savor a good experience you recently had.
        </p>
      </div>

      <div className="space-y-4">
        {/* Strategy dropdown */}
        <div className="space-y-2">
          <label
            htmlFor="savoring-strategy"
            className="text-sm font-medium text-gray-700"
          >
            Savoring Strategy
          </label>
          <Select
            value={selectedStrategy}
            onValueChange={handleStrategySelect}
          >
            <SelectTrigger
              id="savoring-strategy"
              className="w-full"
              aria-label="Choose a savoring strategy"
            >
              <SelectValue placeholder="Choose a savoring strategy">
                {selectedStrategy || "Choose a savoring strategy"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SAVORING_STRATEGIES.map((strategy) => (
                <SelectItem
                  key={strategy}
                  value={strategy}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{strategy}</span>
                    <span className="text-xs text-gray-500">
                      {STRATEGY_DESCRIPTIONS[strategy]}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reflection text area (required) */}
        <div className="space-y-2">
          <label
            htmlFor="savoring-reflection"
            className="text-sm font-medium text-gray-700"
          >
            Apply this strategy
          </label>
          <Textarea
            id="savoring-reflection"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder={selectedStrategy ? STRATEGY_PLACEHOLDERS[selectedStrategy] : "Choose a strategy first..."}
            className="min-h-[100px] resize-y"
            aria-label="Apply this savoring strategy"
          />
        </div>

        {/* Add to Journal button */}
        <Button
          onClick={handleInsert}
          disabled={!canSubmit()}
          className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-medium"
          aria-label="Add savoring entry to journal"
        >
          Add to Journal Entry
        </Button>
      </div>
    </>
  )
}

/**
 * SavoringHelper Component (Original with HelperContainer)
 * Kept for backward compatibility
 */
export function SavoringHelper({ entryId, userId, onInsert }: SavoringHelperProps) {
  const collapseHelperRef = useRef<(() => void) | null>(null)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')

  const announce = (message: string) => {
    setLiveRegionMessage(message)
    setTimeout(() => setLiveRegionMessage(''), 1000)
  }

  const handleExpandChange = (isExpanded: boolean) => {
    if (isExpanded) {
      announce('Savoring helper expanded. Choose a strategy to amplify positive experiences.')
    } else {
      announce('Savoring helper collapsed')
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
        helperType="savoring"
        headerText="Amplify a positive moment"
        descriptionText="Savor a good experience you recently had."
        variant="pink"
        onExpandChange={handleExpandChange}
        collapseRef={collapseHelperRef}
        showDismiss={false}
        defaultExpanded={false}
        testId="savoring"
        infoContent={{
          title: "Savoring Practice",
          description: "Research-based strategies to amplify positive experiences and extract more joy from good moments.",
          effectSize: "d = 0.32 (Bryant meta-analysis)",
          citation: "Bryant, F. B., & Veroff, J. (2007). Savoring: A new model of positive experience. Psychology Press.",
          learnMoreUrl: "https://psycnet.apa.org/record/2007-01113-000"
        }}
      >
        <SavoringContent entryId={entryId} userId={userId} onInsert={onInsert} />
      </HelperContainer>
    </>
  )
}
