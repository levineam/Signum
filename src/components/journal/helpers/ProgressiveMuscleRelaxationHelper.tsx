'use client'

/**
 * Progressive Muscle Relaxation Helper Component
 * Story 2.5.11: Evidence-based somatic stress reduction
 *
 * Based on Edmund Jacobson's PMR technique (1938)
 * Simplified 8-group version for accessibility
 *
 * Features:
 * - Checklist of 8 major muscle groups
 * - Brief instructions for tense-release cycle
 * - Optional reflection text area
 * - HTML paragraph formatting for journal insertion
 * - Usage tracking integration
 * - Full WCAG AA accessibility compliance
 * - Teal/cyan gradient styling
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'
import { HelperContainer } from './HelperContainer'
import { escapeHtml } from '@/utils/htmlEscape'

interface MuscleGroup {
  id: string
  name: string
  description: string
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 'hands-forearms', name: 'Hands and Forearms', description: 'Make tight fists, hold 5 seconds, release' },
  { id: 'upper-arms', name: 'Upper Arms (Biceps)', description: 'Tense biceps, hold 5 seconds, release' },
  { id: 'shoulders-neck', name: 'Shoulders and Neck', description: 'Raise shoulders to ears, hold 5 seconds, drop' },
  { id: 'face', name: 'Face', description: 'Scrunch all facial muscles, hold 5 seconds, release' },
  { id: 'chest-back', name: 'Chest and Back', description: 'Arch back slightly, hold 5 seconds, relax' },
  { id: 'stomach', name: 'Stomach', description: 'Tighten abdominal muscles, hold 5 seconds, release' },
  { id: 'hips-buttocks', name: 'Hips and Buttocks', description: 'Squeeze glutes, hold 5 seconds, release' },
  { id: 'legs-feet', name: 'Legs and Feet', description: 'Point toes down, hold 5 seconds, flex up and release' }
]

interface PMRHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

/**
 * PMRContent Component (Content only, no container)
 * Extracted for use in standalone contexts like NotesPage
 */
export function PMRContent({ entryId, userId, onInsert }: PMRHelperProps) {
  const [completedGroups, setCompletedGroups] = useState<Set<string>>(new Set())
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

  // Handle muscle group toggle
  const handleGroupToggle = (groupId: string, checked: boolean) => {
    const newCompletedGroups = new Set(completedGroups)
    if (checked) {
      newCompletedGroups.add(groupId)
    } else {
      newCompletedGroups.delete(groupId)
    }
    setCompletedGroups(newCompletedGroups)

    const groupName = MUSCLE_GROUPS.find(g => g.id === groupId)?.name || groupId
    announce(`${checked ? 'Checked' : 'Unchecked'} ${groupName}. ${newCompletedGroups.size} of 8 muscle groups completed.`)

    // Track selection event
    addEvent({
      type: 'helper_selection',
      timestamp: new Date().toISOString(),
      data: {
        selectedCount: newCompletedGroups.size,
        selectedItems: Array.from(newCompletedGroups)
      }
    })
  }

  // Check if form can be submitted
  const canSubmit = (): boolean => {
    return completedGroups.size > 0
  }

  // Format PMR entry as HTML paragraphs
  const formatPMREntry = (): string => {
    const parts: string[] = []

    // Header
    parts.push('<p><strong>Progressive Muscle Relaxation</strong></p>')
    parts.push('<p><br></p>')
    parts.push('<p>Today I practiced PMR with these muscle groups:</p>')
    parts.push('<p><br></p>')

    // List completed muscle groups
    MUSCLE_GROUPS.forEach(group => {
      if (completedGroups.has(group.id)) {
        parts.push(`<p>✓ ${escapeHtml(group.name)}</p>`)
      }
    })

    // Optional reflection
    if (reflection.trim()) {
      parts.push('<p><br></p>')
      parts.push('<p><strong>Reflection:</strong></p>')
      // Split by newlines and convert each paragraph
      const paragraphs = reflection.trim().split('\n').filter(p => p.trim())
      paragraphs.forEach(paragraph => {
        parts.push(`<p>${escapeHtml(paragraph)}</p>`)
      })
    }

    parts.push('<p><br></p>')

    return parts.join('')
  }

  // Handle insert to journal
  const handleInsert = async () => {
    if (!canSubmit()) return

    // Format PMR entry text
    const pmrText = formatPMREntry()

    // Track inserted event
    const insertedEvent: HelperEvent = {
      type: 'helper_inserted',
      timestamp: new Date().toISOString(),
      data: {
        insertedText: pmrText,
        fieldCompletionCount: completedGroups.size
      }
    }
    addEvent(insertedEvent)

    // Insert into journal
    onInsert(pmrText)

    // Log to database (non-blocking)
    try {
      const muscleGroupNames = MUSCLE_GROUPS
        .filter(g => completedGroups.has(g.id))
        .map(g => g.name)

      await createHelperUsage({
        helperType: 'pmr',
        entryId,
        selectedItems: Array.from(completedGroups),
        metadata: {
          events: [...eventsRef.current],
          selectionCount: completedGroups.size,
          insertedText: pmrText,
          muscleGroupCount: completedGroups.size,
          muscleGroupNames,
          completedFullSequence: completedGroups.size === 8,
          pmrReflectionLength: reflection.length
        }
      }, userId)
    } catch (error) {
      console.error('Failed to log PMR helper usage:', error)
      // Continue anyway - logging failure shouldn't block user
    }

    // Announce success
    announce('PMR entry added to journal')

    // Reset form
    setCompletedGroups(new Set())
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
          Systematically tense and relax muscle groups to reduce stress and anxiety.
        </p>
      </div>

      <div className="space-y-4">
        {/* Instructions */}
        <div className="p-3 rounded-md bg-gray-50 dark:bg-gray-900">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <strong>Instructions:</strong> For each muscle group, tense tightly for 5 seconds, then release suddenly.
            Notice the difference between tension and relaxation. Check off each group as you complete it.
          </p>
        </div>

        {/* Muscle group checklist */}
        <div className="space-y-3">
          {MUSCLE_GROUPS.map((group) => (
            <div key={group.id} className="flex items-start space-x-3">
              <Checkbox
                id={`pmr-${group.id}`}
                checked={completedGroups.has(group.id)}
                onCheckedChange={(checked) => handleGroupToggle(group.id, checked === true)}
                className="mt-1"
                aria-label={`${group.name}: ${group.description}`}
              />
              <label
                htmlFor={`pmr-${group.id}`}
                className="flex-1 cursor-pointer"
              >
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {group.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {group.description}
                </div>
              </label>
            </div>
          ))}
        </div>

        {/* Selection count */}
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {completedGroups.size} of 8 muscle groups completed
        </div>

        {/* Optional reflection text area */}
        <div className="space-y-2">
          <label
            htmlFor="pmr-reflection"
            className="text-sm font-medium text-gray-700"
          >
            Reflection (optional)
          </label>
          <Textarea
            id="pmr-reflection"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="How do you feel after practicing PMR? Notice any changes in tension or relaxation..."
            className="min-h-[80px] resize-y"
            aria-label="PMR reflection (optional)"
          />
        </div>

        {/* Add to Journal button */}
        <Button
          onClick={handleInsert}
          disabled={!canSubmit()}
          className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-medium"
          aria-label="Add PMR entry to journal"
        >
          Add to Journal Entry
        </Button>
      </div>
    </>
  )
}

/**
 * ProgressiveMuscleRelaxationHelper Component (Original with HelperContainer)
 * Kept for backward compatibility
 */
export function ProgressiveMuscleRelaxationHelper({ entryId, userId, onInsert }: PMRHelperProps) {
  const collapseHelperRef = useRef<(() => void) | null>(null)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')

  const announce = (message: string) => {
    setLiveRegionMessage(message)
    setTimeout(() => setLiveRegionMessage(''), 1000)
  }

  const handleExpandChange = (isExpanded: boolean) => {
    if (isExpanded) {
      announce('Progressive Muscle Relaxation helper expanded. Check muscle groups as you complete them.')
    } else {
      announce('Progressive Muscle Relaxation helper collapsed')
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
        helperType="pmr"
        headerText="Release physical tension"
        descriptionText="Systematically tense and relax muscle groups to reduce stress and anxiety."
        variant="default"
        onExpandChange={handleExpandChange}
        collapseRef={collapseHelperRef}
        showDismiss={false}
        defaultExpanded={false}
        testId="pmr"
        infoContent={{
          title: "Progressive Muscle Relaxation",
          description: "Edmund Jacobson's evidence-based technique for reducing physical tension and anxiety through systematic muscle relaxation.",
          effectSize: "d = 0.38 for anxiety reduction (Manzoni et al., 2008)",
          citation: "Manzoni, G. M., et al. (2008). Relaxation training for anxiety: A ten-years systematic review. BMC Psychiatry, 8(1), 41.",
          learnMoreUrl: "https://www.apa.org/topics/mindfulness/meditation-relaxation"
        }}
      >
        <PMRContent entryId={entryId} userId={userId} onInsert={onInsert} />
      </HelperContainer>
    </>
  )
}
