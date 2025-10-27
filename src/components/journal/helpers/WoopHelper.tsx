'use client'

/**
 * WOOP Goal-Setting Helper Component
 * Story 2.5.8: Evidence-based goal planning with mental contrasting
 *
 * Based on Gabriele Oettingen's WOOP method:
 * https://woopmylife.org/
 *
 * WOOP = Wish, Outcome, Obstacle, Plan
 * Mental contrasting (visualizing both success and obstacles) increases
 * goal achievement rates compared to positive thinking alone.
 *
 * Features:
 * - 4-step guided process (W.O.O.P.)
 * - 4 text areas with clear prompts
 * - If-then implementation intentions in Plan step
 * - HTML paragraph formatting for journal insertion
 * - Usage tracking integration
 * - Full WCAG AA accessibility compliance
 * - Blue/sky gradient styling
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'
import { HelperContainer } from './HelperContainer'
import { escapeHtml } from '@/utils/htmlEscape'

interface WoopHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

interface WoopSteps {
  wish: string
  outcome: string
  obstacle: string
  plan: string
}

export function WoopHelper({ entryId, userId, onInsert }: WoopHelperProps) {
  const [steps, setSteps] = useState<WoopSteps>({
    wish: '',
    outcome: '',
    obstacle: '',
    plan: ''
  })
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
      announce('WOOP Goal Planning helper expanded. Start with your wish.')
    } else {
      announce('WOOP Goal Planning helper collapsed')
    }
  }

  // Update a specific step
  const updateStep = (step: keyof WoopSteps, value: string) => {
    setSteps(prev => ({ ...prev, [step]: value }))
  }

  // Check if form can be submitted (only Wish is required)
  const canSubmit = (): boolean => {
    return steps.wish.trim() !== ''
  }

  // Detect if Plan contains if-then format
  const hasIfThenFormat = (): boolean => {
    const plan = steps.plan.toLowerCase()
    return plan.includes('if') && plan.includes('then')
  }

  // Format WOOP plan as HTML paragraphs
  const formatWoopPlan = (): string => {
    const parts: string[] = []

    // Header
    parts.push('<p><strong>WOOP Goal Plan</strong></p>')
    parts.push('<p><br></p>')

    // Wish (always included, it's required)
    parts.push(`<p><strong>Wish:</strong> ${escapeHtml(steps.wish)}</p>`)
    parts.push('<p><br></p>')

    // Outcome (optional)
    if (steps.outcome.trim()) {
      parts.push(`<p><strong>Outcome:</strong> ${escapeHtml(steps.outcome)}</p>`)
      parts.push('<p><br></p>')
    }

    // Obstacle (optional)
    if (steps.obstacle.trim()) {
      parts.push(`<p><strong>Obstacle:</strong> ${escapeHtml(steps.obstacle)}</p>`)
      parts.push('<p><br></p>')
    }

    // Plan (optional)
    if (steps.plan.trim()) {
      parts.push(`<p><strong>Plan:</strong> ${escapeHtml(steps.plan)}</p>`)
      parts.push('<p><br></p>')
    }

    return parts.join('')
  }

  // Get character counts for telemetry
  const getStepCounts = () => {
    return {
      wish: steps.wish.length,
      outcome: steps.outcome.length,
      obstacle: steps.obstacle.length,
      plan: steps.plan.length
    }
  }

  // Get field completion count
  const getFieldCompletionCount = (): number => {
    return [
      steps.wish.trim(),
      steps.outcome.trim(),
      steps.obstacle.trim(),
      steps.plan.trim()
    ].filter(Boolean).length
  }

  // Handle insert to journal
  const handleInsert = async () => {
    if (!canSubmit()) return

    // Format WOOP plan text
    const woopText = formatWoopPlan()

    // Track inserted event
    const insertedEvent: HelperEvent = {
      type: 'helper_inserted',
      timestamp: new Date().toISOString(),
      data: {
        insertedText: woopText,
        fieldCompletionCount: getFieldCompletionCount()
      }
    }
    addEvent(insertedEvent)

    // Log usage to database (non-blocking)
    try {
      await createHelperUsage({
        helperType: 'woop',
        entryId: entryId,
        selectedItems: [],
        metadata: {
          events: eventsRef.current,
          selectionCount: 0,
          insertedText: woopText,
          woopStepCounts: getStepCounts(),
          hasIfThenFormat: hasIfThenFormat()
        }
      }, userId)
    } catch (error) {
      console.error('Failed to log helper usage:', error)
      // Don't block user interaction if logging fails
    }

    // Announce and callback
    announce('Inserted WOOP goal plan into journal')
    onInsert(woopText)

    // Reset state
    setSteps({
      wish: '',
      outcome: '',
      obstacle: '',
      plan: ''
    })
    eventsRef.current = []

    // Collapse the helper after insertion
    if (collapseHelperRef.current) {
      collapseHelperRef.current()
    }
  }

  // Handle clear all fields
  const handleClear = () => {
    setSteps({
      wish: '',
      outcome: '',
      obstacle: '',
      plan: ''
    })

    // Track cleared event
    addEvent({
      type: 'helper_cleared',
      timestamp: new Date().toISOString(),
      data: { previousFieldCount: getFieldCompletionCount() }
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
        helperType="woop"
        headerText="Ready to plan a goal?"
        descriptionText="Use mental contrasting to set realistic goals and prepare for obstacles."
        variant="blue"
        onExpandChange={handleExpandChange}
        collapseRef={collapseHelperRef}
        showDismiss={false}
        defaultExpanded={false}
        testId="woop"
        infoContent={{
          title: "WOOP Goal Planning",
          description: "Mental contrasting combines positive visualization with obstacle planning. This evidence-based method increases goal achievement rates by creating realistic if-then plans that trigger action when obstacles arise.",
          effectSize: "Significantly outperforms positive thinking alone",
          citation: "Oettingen, G. (2014). Rethinking Positive Thinking: Inside the New Science of Motivation. Current Directions in Psychological Science.",
          learnMoreUrl: "https://woopmylife.org/"
        }}
      >
        {/* WOOP Form */}
        <div className="space-y-4">
          {/* Wish */}
          <div>
            <label
              htmlFor="woop-wish"
              className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1"
            >
              W - Wish <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              What do you want to accomplish? Be specific and realistic.
            </p>
            <Textarea
              id="woop-wish"
              value={steps.wish}
              onChange={(e) => updateStep('wish', e.target.value)}
              placeholder="I want to..."
              className="bg-white dark:bg-gray-950 min-h-[80px]"
              data-testid="woop-wish"
            />
          </div>

          {/* Outcome */}
          <div>
            <label
              htmlFor="woop-outcome"
              className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1"
            >
              O - Outcome
            </label>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              What&apos;s the best result if you achieve it? How will you feel?
            </p>
            <Textarea
              id="woop-outcome"
              value={steps.outcome}
              onChange={(e) => updateStep('outcome', e.target.value)}
              placeholder="The best outcome would be..."
              className="bg-white dark:bg-gray-950 min-h-[80px]"
              data-testid="woop-outcome"
            />
          </div>

          {/* Obstacle */}
          <div>
            <label
              htmlFor="woop-obstacle"
              className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1"
            >
              O - Obstacle
            </label>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              What internal obstacle might prevent this? (Your thoughts, feelings, or behaviors)
            </p>
            <Textarea
              id="woop-obstacle"
              value={steps.obstacle}
              onChange={(e) => updateStep('obstacle', e.target.value)}
              placeholder="The main obstacle in me is..."
              className="bg-white dark:bg-gray-950 min-h-[80px]"
              data-testid="woop-obstacle"
            />
          </div>

          {/* Plan */}
          <div>
            <label
              htmlFor="woop-plan"
              className="block text-sm font-medium text-blue-800 dark:text-blue-200 mb-1"
            >
              P - Plan
            </label>
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
              If-then plan: &quot;If [obstacle], then I will [specific action]&quot;
            </p>
            <Textarea
              id="woop-plan"
              value={steps.plan}
              onChange={(e) => updateStep('plan', e.target.value)}
              placeholder="If [obstacle occurs], then I will..."
              className="bg-white dark:bg-gray-950 min-h-[80px]"
              data-testid="woop-plan"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-4 border-t border-blue-200 dark:border-blue-800 mt-4">
          <Button
            onClick={handleInsert}
            disabled={!canSubmit()}
            className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700 dark:hover:bg-blue-600"
            size="sm"
            data-testid="woop-insert-button"
          >
            Add to Journal Entry
          </Button>
          <Button
            onClick={handleClear}
            disabled={!steps.wish && !steps.outcome && !steps.obstacle && !steps.plan}
            variant="ghost"
            size="sm"
            className="text-blue-700 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-300 dark:hover:text-blue-100 dark:hover:bg-blue-900/50"
            data-testid="woop-clear-button"
          >
            Clear All
          </Button>
        </div>
      </HelperContainer>
    </>
  )
}
