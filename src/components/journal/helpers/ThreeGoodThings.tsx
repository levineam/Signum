'use client'

/**
 * Three Good Things Helper Component
 * Issue #92: Gratitude practice helper
 *
 * Based on positive psychology research, helps users identify
 * and reflect on three positive experiences from their day.
 *
 * Features:
 * - Three text input fields for good things
 * - Optional follow-up questions for deeper reflection
 * - Usage tracking integration
 * - Green/emerald gradient styling
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'

interface ThreeGoodThingsProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
  onClose?: () => void
}

export function ThreeGoodThings({ entryId, userId, onInsert, onClose }: ThreeGoodThingsProps) {
  const [goodThings, setGoodThings] = useState(['', '', ''])
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
    setTimeout(() => setLiveRegionMessage(''), 1000)
  }

  const handleChange = (index: number, value: string) => {
    const newGoodThings = [...goodThings]
    newGoodThings[index] = value
    setGoodThings(newGoodThings)
  }

  const handleClear = () => {
    setGoodThings(['', '', ''])
    announce('All entries cleared')
  }

  const handleInsert = async () => {
    const filledThings = goodThings.filter(thing => thing.trim() !== '')

    if (filledThings.length === 0) return

    // Format as numbered list
    const formattedText = '<p><strong>Three Good Things:</strong></p>' +
      filledThings.map((thing, index) => `<p>${index + 1}. ${thing.trim()}</p>`).join('') +
      '<p><br /></p>'

    // Track inserted event
    const insertedEvent: HelperEvent = {
      type: 'helper_inserted',
      timestamp: new Date().toISOString(),
      data: {
        insertedText: formattedText
      }
    }
    addEvent(insertedEvent)

    // Log usage to database (non-blocking)
    try {
      await createHelperUsage({
        helperType: '3-good-things',
        entryId: entryId,
        selectedItems: filledThings,
        metadata: {
          events: eventsRef.current,
          selectionCount: filledThings.length,
          insertedText: formattedText
        }
      }, userId)
    } catch (error) {
      console.error('Failed to log helper usage:', error)
    }

    announce(`Inserted ${filledThings.length} good things`)
    onInsert(formattedText)

    // Reset state
    setGoodThings(['', '', ''])
    eventsRef.current = []

    // Close modal after insertion
    if (onClose) {
      onClose()
    }
  }

  const filledCount = goodThings.filter(thing => thing.trim() !== '').length

  return (
    <>
      {/* Screen reader live region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveRegionMessage}
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Research shows that reflecting on positive experiences improves well-being.
          List three good things that happened today, big or small.
        </p>

        {/* Three input fields */}
        {[0, 1, 2].map((index) => (
          <div key={index} className="space-y-2">
            <label
              htmlFor={`good-thing-${index}`}
              className="text-sm font-medium text-green-900 dark:text-green-100"
            >
              Good thing #{index + 1}
            </label>
            <Textarea
              id={`good-thing-${index}`}
              value={goodThings[index]}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder={`What went well today?`}
              className="bg-green-50/50 dark:bg-green-900/20 border-green-200 dark:border-green-800 focus:border-green-400 dark:focus:border-green-600 min-h-[80px]"
              data-testid={`good-thing-${index}-input`}
            />
          </div>
        ))}

        {/* Action buttons */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button
            onClick={handleInsert}
            disabled={filledCount === 0}
            className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
            size="sm"
            data-testid="three-good-things-insert-button"
          >
            Insert
            {filledCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-green-500 dark:bg-green-800 rounded text-xs">
                {filledCount}
              </span>
            )}
          </Button>
          <Button
            onClick={handleClear}
            disabled={filledCount === 0}
            variant="ghost"
            size="sm"
            className="text-green-700 hover:text-green-900 hover:bg-green-100 dark:text-green-300 dark:hover:text-green-100 dark:hover:bg-green-900/50"
            data-testid="three-good-things-clear-button"
          >
            Clear
          </Button>
        </div>
      </div>
    </>
  )
}
