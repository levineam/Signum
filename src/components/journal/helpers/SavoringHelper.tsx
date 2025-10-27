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

// Strategy descriptions for guidance
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

interface SavoringHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

export function SavoringHelper({ entryId, userId, onInsert }: SavoringHelperProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<SavoringStrategy | ''>('')
  const [reflection, setReflection] = useState('')
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
      announce('Savoring helper expanded. Choose a strategy to amplify positive experiences.')
    } else {
      announce('Savoring helper collapsed')
    }
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
    return selectedStrategy !== ''
  }

  // Format savoring entry as HTML paragraphs
  const formatSavoringEntry = (): string => {
    const parts: string[] = []

    // Header with selected strategy
    parts.push(`<p><strong>Savoring: ${escapeHtml(selectedStrategy)}</strong></p>`)
    parts.push('<p><br></p>')

    // User's reflection (optional)
    if (reflection.trim()) {
      // Split by newlines and convert each paragraph
      const paragraphs = reflection.trim().split('\n').filter(p => p.trim())
      paragraphs.forEach(paragraph => {
        parts.push(`<p>${escapeHtml(paragraph)}</p>`)
      })
      parts.push('<p><br></p>')
    }

    return parts.join('')
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

    // Log to database (non-blocking)
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

    // Announce success
    announce('Savoring entry added to journal')

    // Reset form
    setSelectedStrategy('')
    setReflection('')

    // Clear events for next usage
    eventsRef.current = []

    // Collapse helper
    if (collapseHelperRef.current) {
      collapseHelperRef.current()
    }
  }

  return (
    <HelperContainer
      title="Savoring Practice"
      variant="pink"
      onExpandChange={handleExpandChange}
      collapseRef={collapseHelperRef}
      infoContent={{
        title: "Savoring Practice",
        description: "Research-based strategies to amplify positive experiences and extract more joy from good moments.",
        effectSize: "d = 0.32 (Bryant meta-analysis)",
        citation: "Bryant, F. B., & Veroff, J. (2007). Savoring: A new model of positive experience. Psychology Press.",
        learnMoreUrl: "https://psycnet.apa.org/record/2007-01113-000"
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
        {/* Guidance text */}
        <p className="text-sm text-gray-700">
          Choose a strategy you used (or want to try) to savor a positive moment.
          Strategy selection alone has value—reflection enhances it.
        </p>

        {/* Strategy dropdown */}
        <div className="space-y-2">
          <label
            htmlFor="savoring-strategy"
            className="text-sm font-medium text-gray-700"
          >
            Savoring Strategy <span className="text-red-500">*</span>
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
              <SelectValue placeholder="Choose a savoring strategy" />
            </SelectTrigger>
            <SelectContent>
              {SAVORING_STRATEGIES.map((strategy) => (
                <SelectItem
                  key={strategy}
                  value={strategy}
                  className="cursor-pointer"
                >
                  <div>
                    <div className="font-medium">{strategy}</div>
                    <div className="text-xs text-gray-500">
                      {STRATEGY_DESCRIPTIONS[strategy]}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reflection text area (optional) */}
        <div className="space-y-2">
          <label
            htmlFor="savoring-reflection"
            className="text-sm font-medium text-gray-700"
          >
            How did you apply this strategy? (optional)
          </label>
          <Textarea
            id="savoring-reflection"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Describe your savoring experience..."
            className="min-h-[100px] resize-y"
            aria-label="Describe your savoring experience (optional)"
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
    </HelperContainer>
  )
}
