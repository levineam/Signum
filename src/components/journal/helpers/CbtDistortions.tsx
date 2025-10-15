'use client'

/**
 * CBT Cognitive Distortions Helper Component
 * Story 1.8.2: Helper System Enhancement
 *
 * Provides a progressive disclosure interface for selecting and inserting
 * CBT cognitive distortion reflection prompts into journal entries.
 *
 * Features:
 * - Progressive disclosure UI (expand/collapse)
 * - Multiple selection via checkboxes
 * - Usage tracking integration
 * - Full WCAG AA accessibility compliance
 * - Blue/indigo gradient styling (distinct from Gentle Prompt)
 */

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { CBT_DISTORTIONS, formatMultipleReflections } from '@/data/cbtDistortions'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'

interface CbtDistortionsProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

export function CbtDistortions({ entryId, userId, onInsert }: CbtDistortionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedDistortions, setSelectedDistortions] = useState<Set<string>>(new Set())
  const exploreButtonRef = useRef<HTMLButtonElement>(null)
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

  // Handle expand/collapse
  const handleExpand = () => {
    const newExpandedState = !isExpanded
    setIsExpanded(newExpandedState)

    if (newExpandedState) {
      // Track helper opened event
      addEvent({
        type: 'helper_opened',
        timestamp: new Date().toISOString(),
        data: { triggerSource: 'manual' }
      })
      announce('CBT Distortions helper expanded. 10 distortions available.')
    } else {
      announce('CBT Distortions helper collapsed')
      // Return focus to Explore button
      setTimeout(() => {
        exploreButtonRef.current?.focus()
      }, 100)
    }
  }

  // Handle checkbox selection
  const handleSelect = (distortionId: string, distortionName: string) => {
    const newSelection = new Set(selectedDistortions)

    if (newSelection.has(distortionId)) {
      newSelection.delete(distortionId)
      announce(`Deselected ${distortionName}`)
    } else {
      newSelection.add(distortionId)
      announce(`Selected ${distortionName}`)

      // Track selection event
      addEvent({
        type: 'helper_selection',
        timestamp: new Date().toISOString(),
        data: {
          selectedCount: newSelection.size,
          selectedItems: Array.from(newSelection)
        }
      })
    }

    setSelectedDistortions(newSelection)
  }

  // Handle clear all selections
  const handleClear = () => {
    const previousCount = selectedDistortions.size
    setSelectedDistortions(new Set())

    // Track cleared event
    addEvent({
      type: 'helper_cleared',
      timestamp: new Date().toISOString(),
      data: { previousSelectionCount: previousCount }
    })

    announce('All selections cleared')
  }

  // Handle insert reflections
  const handleInsert = async () => {
    if (selectedDistortions.size === 0) return

    // Get selected distortion objects
    const selected = CBT_DISTORTIONS.filter(d => selectedDistortions.has(d.id))

    // Format reflection text
    const reflectionText = formatMultipleReflections(selected)

    // Track inserted event
    const insertedEvent: HelperEvent = {
      type: 'helper_inserted',
      timestamp: new Date().toISOString(),
      data: {
        insertedText: reflectionText,
        distortionCount: selected.length
      }
    }
    addEvent(insertedEvent)

    // Log usage to database (non-blocking)
    try {
      await createHelperUsage({
        helperType: 'cbt-distortions',
        entryId: entryId,
        selectedItems: Array.from(selectedDistortions),
        metadata: {
          events: eventsRef.current,
          selectionCount: selectedDistortions.size,
          insertedText: reflectionText,
          distortionNames: selected.map(d => d.name)
        }
      }, userId)
    } catch (error) {
      console.error('Failed to log helper usage:', error)
      // Don't block user interaction if logging fails
    }

    // Announce and callback
    announce(`Inserted ${selected.length} distortion reflections`)
    onInsert(reflectionText)

    // Reset state
    setSelectedDistortions(new Set())
    setIsExpanded(false)
    eventsRef.current = []

    // Return focus to Explore button
    setTimeout(() => {
      exploreButtonRef.current?.focus()
    }, 100)
  }

  // Keyboard handlers
  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Escape closes the expanded panel
    if (event.key === 'Escape' && isExpanded) {
      event.preventDefault()
      setIsExpanded(false)
      announce('CBT Distortions helper collapsed')
      exploreButtonRef.current?.focus()
    }
  }

  return (
    <div onKeyDown={handleKeyDown}>
      {/* Screen reader live region for announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveRegionMessage}
      </div>

      <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-800">
        <div className="p-4">
          {/* Header with Explore button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                CBT Cognitive Distortions
              </span>
            </div>
            <Button
              ref={exploreButtonRef}
              onClick={handleExpand}
              variant="ghost"
              size="sm"
              className="text-blue-700 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-300 dark:hover:text-blue-100 dark:hover:bg-blue-900/50"
              aria-expanded={isExpanded}
              aria-controls="cbt-distortions-panel"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Explore
                </>
              )}
            </Button>
          </div>

          {/* Expanded panel with distortions */}
          {isExpanded && (
            <div
              id="cbt-distortions-panel"
              className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
                Select distortions you experienced today to add reflection prompts to your journal.
              </p>

              {/* Distortion checkboxes */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {CBT_DISTORTIONS.map((distortion) => (
                  <div
                    key={distortion.id}
                    className="flex items-start gap-3 p-3 rounded-md bg-white/50 dark:bg-gray-900/50 hover:bg-white/80 dark:hover:bg-gray-900/80 transition-colors"
                  >
                    <Checkbox
                      id={`distortion-${distortion.id}`}
                      checked={selectedDistortions.has(distortion.id)}
                      onCheckedChange={() => handleSelect(distortion.id, distortion.name)}
                      aria-label={`Select ${distortion.name}`}
                      className="mt-1"
                    />
                    <label
                      htmlFor={`distortion-${distortion.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-1">
                        {distortion.name}
                      </div>
                      <div className="text-xs text-blue-700/80 dark:text-blue-300/80 mb-1">
                        {distortion.description}
                      </div>
                      <div className="text-xs text-blue-600/60 dark:text-blue-400/60 italic">
                        Example: {distortion.example}
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 pt-4 border-t border-blue-200 dark:border-blue-800">
                <Button
                  onClick={handleInsert}
                  disabled={selectedDistortions.size === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600"
                  size="sm"
                >
                  Continue
                  {selectedDistortions.size > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-blue-500 dark:bg-blue-800 rounded text-xs">
                      {selectedDistortions.size}
                    </span>
                  )}
                </Button>
                <Button
                  onClick={handleClear}
                  disabled={selectedDistortions.size === 0}
                  variant="ghost"
                  size="sm"
                  className="text-blue-700 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-300 dark:hover:text-blue-100 dark:hover:bg-blue-900/50"
                >
                  Clear
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
