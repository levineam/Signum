'use client'

/**
 * CBT Cognitive Distortions Helper Component
 * Issue #92: Refactored for tile-based modal UI
 *
 * Provides interface for selecting and inserting
 * CBT cognitive distortion reflection prompts into journal entries.
 * Now renders as modal content (no HelperContainer wrapper).
 *
 * Features:
 * - Multiple selection via checkboxes
 * - Usage tracking integration
 * - Full WCAG AA accessibility compliance
 * - Blue/indigo gradient styling
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { CBT_DISTORTIONS, formatMultipleReflections } from '@/data/cbtDistortions'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'

interface CbtDistortionsProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
  onClose?: () => void // Callback to close modal after insertion
}

export function CbtDistortions({ entryId, userId, onInsert, onClose }: CbtDistortionsProps) {
  const [selectedDistortions, setSelectedDistortions] = useState<Set<string>>(new Set())
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
    eventsRef.current = []

    // Close modal after insertion
    if (onClose) {
      onClose()
    }
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

      {/* Distortion checkboxes */}
      <div className="space-y-3 pr-2">
        {CBT_DISTORTIONS.map((distortion) => (
          <div
            key={distortion.id}
            className="flex items-start gap-3 p-3 rounded-md bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border border-blue-100 dark:border-blue-900"
          >
            <Checkbox
              id={`distortion-${distortion.id}`}
              checked={selectedDistortions.has(distortion.id)}
              onCheckedChange={() => handleSelect(distortion.id, distortion.name)}
              aria-label={`Select ${distortion.name}`}
              className="mt-1"
              data-testid={`distortion-${distortion.id}-checkbox`}
            />
            <label
              htmlFor={`distortion-${distortion.id}`}
              className="flex-1 cursor-pointer"
            >
              <div className="font-medium text-base text-blue-900 dark:text-blue-100 mb-1">
                {distortion.name}
              </div>
              <div className="text-sm text-blue-700/80 dark:text-blue-300/80 mb-1">
                {distortion.description}
              </div>
              <div className="text-sm text-blue-600/60 dark:text-blue-400/60 italic">
                Example: {distortion.example}
              </div>
            </label>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-4 border-t border-border">
        <Button
          onClick={handleInsert}
          disabled={selectedDistortions.size === 0}
          className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600"
          size="sm"
          data-testid="cbt-continue-button"
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
          data-testid="cbt-clear-button"
        >
          Clear
        </Button>
      </div>
    </>
  )
}
