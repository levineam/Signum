'use client'

/**
 * Values Helper Component
 * Issue #92: Core values reflection helper
 *
 * Helps users identify and reflect on their core values through
 * Acceptance and Commitment Therapy (ACT) framework.
 *
 * Features:
 * - Common value categories with checkboxes
 * - Custom value input field
 * - Reflection prompt generation
 * - Usage tracking integration
 * - Purple/violet gradient styling
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'

interface ValuesProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
  onClose?: () => void
}

// Common ACT-based value categories
const VALUE_CATEGORIES = [
  { id: 'relationships', name: 'Relationships & Connection', description: 'Being a good friend, partner, parent, or family member' },
  { id: 'growth', name: 'Personal Growth', description: 'Learning, developing skills, self-improvement' },
  { id: 'health', name: 'Health & Well-being', description: 'Physical fitness, mental health, self-care' },
  { id: 'creativity', name: 'Creativity & Expression', description: 'Art, music, writing, making things' },
  { id: 'contribution', name: 'Contribution & Service', description: 'Helping others, making a difference' },
  { id: 'authenticity', name: 'Authenticity & Integrity', description: 'Being true to yourself, living by your principles' },
  { id: 'adventure', name: 'Adventure & Exploration', description: 'Trying new things, taking risks, discovery' },
  { id: 'spirituality', name: 'Spirituality & Meaning', description: 'Faith, purpose, connection to something greater' }
]

export function Values({ entryId, userId, onInsert, onClose }: ValuesProps) {
  const [selectedValues, setSelectedValues] = useState<Set<string>>(new Set())
  const [customValue, setCustomValue] = useState('')
  const [liveRegionMessage, setLiveRegionMessage] = useState('')

  // Track events for usage logging
  const eventsRef = useRef<HelperEvent[]>([])

  const addEvent = (event: HelperEvent) => {
    eventsRef.current.push(event)
  }

  const announce = (message: string) => {
    setLiveRegionMessage(message)
    setTimeout(() => setLiveRegionMessage(''), 1000)
  }

  const handleSelect = (valueId: string, valueName: string) => {
    const newSelection = new Set(selectedValues)

    if (newSelection.has(valueId)) {
      newSelection.delete(valueId)
      announce(`Deselected ${valueName}`)
    } else {
      newSelection.add(valueId)
      announce(`Selected ${valueName}`)

      addEvent({
        type: 'helper_selection',
        timestamp: new Date().toISOString(),
        data: {
          selectedCount: newSelection.size,
          selectedItems: Array.from(newSelection)
        }
      })
    }

    setSelectedValues(newSelection)
  }

  const handleClear = () => {
    const previousCount = selectedValues.size
    setSelectedValues(new Set())
    setCustomValue('')

    addEvent({
      type: 'helper_cleared',
      timestamp: new Date().toISOString(),
      data: { previousSelectionCount: previousCount }
    })

    announce('All selections cleared')
  }

  const handleInsert = async () => {
    const selected = VALUE_CATEGORIES.filter(v => selectedValues.has(v.id))
    const customValues = customValue.trim() ? [customValue.trim()] : []

    if (selected.length === 0 && customValues.length === 0) return

    // Format reflection prompts
    let formattedText = '<p><strong>Values Reflection:</strong></p>'

    if (selected.length > 0) {
      formattedText += '<p><em>My important values today:</em></p>'
      selected.forEach(value => {
        formattedText += `<p>• <strong>${value.name}</strong> - ${value.description}</p>`
      })
    }

    if (customValues.length > 0) {
      customValues.forEach(val => {
        formattedText += `<p>• <strong>${val}</strong></p>`
      })
    }

    formattedText += '<p><br /></p>'
    formattedText += '<p><em>Reflection:</em> How did I honor these values today? What actions aligned with what matters most to me?</p>'
    formattedText += '<p><br /></p>'

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
        helperType: 'values',
        entryId: entryId,
        selectedItems: [...Array.from(selectedValues), ...customValues],
        metadata: {
          events: eventsRef.current,
          selectionCount: selectedValues.size + customValues.length,
          insertedText: formattedText
        }
      }, userId)
    } catch (error) {
      console.error('Failed to log helper usage:', error)
    }

    announce(`Inserted ${selected.length + customValues.length} values`)
    onInsert(formattedText)

    // Reset state
    setSelectedValues(new Set())
    setCustomValue('')
    eventsRef.current = []

    // Close modal after insertion
    if (onClose) {
      onClose()
    }
  }

  const totalSelected = selectedValues.size + (customValue.trim() ? 1 : 0)

  return (
    <>
      {/* Screen reader live region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveRegionMessage}
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Values are what matter most to you - the qualities and principles that guide your life.
          Select the values that feel most important today.
        </p>

        {/* Value checkboxes */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {VALUE_CATEGORIES.map((value) => (
            <div
              key={value.id}
              className="flex items-start gap-3 p-3 rounded-md bg-purple-50/50 dark:bg-purple-900/20 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors border border-purple-100 dark:border-purple-900"
            >
              <Checkbox
                id={`value-${value.id}`}
                checked={selectedValues.has(value.id)}
                onCheckedChange={() => handleSelect(value.id, value.name)}
                aria-label={`Select ${value.name}`}
                className="mt-1"
                data-testid={`value-${value.id}-checkbox`}
              />
              <label
                htmlFor={`value-${value.id}`}
                className="flex-1 cursor-pointer"
              >
                <div className="font-medium text-base text-purple-900 dark:text-purple-100 mb-1">
                  {value.name}
                </div>
                <div className="text-sm text-purple-700/80 dark:text-purple-300/80">
                  {value.description}
                </div>
              </label>
            </div>
          ))}
        </div>

        {/* Custom value input */}
        <div className="space-y-2 pt-2 border-t border-border">
          <label htmlFor="custom-value" className="text-sm font-medium text-purple-900 dark:text-purple-100">
            Add your own value
          </label>
          <Input
            id="custom-value"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="e.g., Financial security, Independence, Fun..."
            className="bg-purple-50/50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
            data-testid="custom-value-input"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-4 border-t border-border">
          <Button
            onClick={handleInsert}
            disabled={totalSelected === 0}
            className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-600"
            size="sm"
            data-testid="values-insert-button"
          >
            Insert
            {totalSelected > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-purple-500 dark:bg-purple-800 rounded text-xs">
                {totalSelected}
              </span>
            )}
          </Button>
          <Button
            onClick={handleClear}
            disabled={totalSelected === 0}
            variant="ghost"
            size="sm"
            className="text-purple-700 hover:text-purple-900 hover:bg-purple-100 dark:text-purple-300 dark:hover:text-purple-100 dark:hover:bg-purple-900/50"
            data-testid="values-clear-button"
          >
            Clear
          </Button>
        </div>
      </div>
    </>
  )
}
