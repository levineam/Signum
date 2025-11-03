'use client'

/**
 * Loving-Kindness Meditation Helper Component
 * Story 2.5.12: Evidence-based compassion cultivation
 *
 * Based on traditional Buddhist metta meditation
 * Research: Galante et al. (2014), Fredrickson et al. (2008)
 *
 * Features:
 * - Dropdown to select recipient (Self, Loved One, Neutral, Difficult)
 * - Optional text field to name the specific person
 * - Auto-generated traditional metta phrases
 * - HTML paragraph formatting for journal insertion
 * - Usage tracking integration
 * - Full WCAG AA accessibility compliance
 * - Rose/pink gradient styling
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

const RECIPIENTS = [
  'Self',
  'Loved One',
  'Neutral Person',
  'Difficult Person'
] as const

type Recipient = typeof RECIPIENTS[number]

// Placeholders for name input based on recipient
const NAME_PLACEHOLDERS: Record<Exclude<Recipient, 'Self'>, string> = {
  'Loved One': 'e.g., Mom, Alex, my partner',
  'Neutral Person': 'e.g., the barista, my neighbor',
  'Difficult Person': 'e.g., my colleague, [initials only for privacy]'
}

interface LovingKindnessHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

/**
 * LovingKindnessContent Component (Content only, no container)
 * Extracted for use in standalone contexts like NotesPage
 */
export function LovingKindnessContent({ entryId, userId, onInsert }: LovingKindnessHelperProps) {
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | ''>('')
  const [personName, setPersonName] = useState('')
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

  // Handle recipient selection
  const handleRecipientSelect = (recipient: Recipient) => {
    setSelectedRecipient(recipient)
    // Clear name when selecting Self
    if (recipient === 'Self') {
      setPersonName('')
    }
    announce(`Selected recipient: ${recipient}`)

    // Track selection event
    addEvent({
      type: 'helper_selection',
      timestamp: new Date().toISOString(),
      data: {
        selectedCount: 1,
        selectedItems: [recipient]
      }
    })
  }

  // Check if form can be submitted
  const canSubmit = (): boolean => {
    return selectedRecipient !== ''
  }

  // Generate metta phrases for preview (returns array for UI display)
  const generateMettaPhrases = (): string[] => {
    if (selectedRecipient === 'Self') {
      return [
        'May I be happy.',
        'May I be healthy.',
        'May I be safe.',
        'May I live with ease.'
      ]
    }

    const pronoun = personName.trim() ? escapeHtml(personName.trim()) : 'they'
    return [
      `May ${pronoun} be happy.`,
      `May ${pronoun} be healthy.`,
      `May ${pronoun} be safe.`,
      `May ${pronoun} live with ease.`
    ]
  }

  // Format loving-kindness entry as HTML paragraphs (prose format)
  const formatLovingKindness = (): string => {
    // Join phrases into single prose paragraph
    const phrases = generateMettaPhrases()
    return `<p>${phrases.join(' ')}</p>`
  }

  // Handle insert to journal
  const handleInsert = async () => {
    if (!canSubmit()) return

    // Format loving-kindness entry text
    const lkmText = formatLovingKindness()

    // Track inserted event
    const insertedEvent: HelperEvent = {
      type: 'helper_inserted',
      timestamp: new Date().toISOString(),
      data: {
        insertedText: lkmText,
        fieldCompletionCount: 1
      }
    }
    addEvent(insertedEvent)

    // Insert into journal
    onInsert(lkmText)

    // Log to database (non-blocking, skip in guest mode)
    if (userId !== 'guest' && entryId !== 'guest-entry') {
      try {
        await createHelperUsage({
          helperType: 'loving-kindness',
          entryId,
          selectedItems: [selectedRecipient],
          metadata: {
            events: [...eventsRef.current],
            selectionCount: 1,
            insertedText: lkmText,
            lkmRecipient: selectedRecipient as Recipient, // Type assertion safe here due to canSubmit() check
            lkmPersonNamed: personName.trim().length > 0,
            lkmNameLength: personName.trim().length
          }
        }, userId)
      } catch (error) {
        console.error('Failed to log loving-kindness helper usage:', error)
        // Continue anyway - logging failure shouldn't block user
      }
    } else {
      console.log('[Guest Mode] Skipping helper usage logging')
    }

    // Announce success
    announce('Loving-kindness meditation added to journal')

    // Reset form
    setSelectedRecipient('')
    setPersonName('')

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
          Direct loving-kindness toward yourself or others using traditional metta meditation.
        </p>
      </div>

      <div className="space-y-4">
        {/* Recipient dropdown */}
        <div className="space-y-2">
          <label
            htmlFor="lkm-recipient"
            className="text-sm font-medium text-gray-700"
          >
            Choose a recipient
          </label>
          <Select
            value={selectedRecipient}
            onValueChange={handleRecipientSelect}
          >
            <SelectTrigger
              id="lkm-recipient"
              className="w-full"
              aria-label="Choose a recipient for loving-kindness"
            >
              <SelectValue placeholder="Choose a recipient for loving-kindness">
                {selectedRecipient || "Choose a recipient for loving-kindness"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {RECIPIENTS.map((recipient) => (
                <SelectItem
                  key={recipient}
                  value={recipient}
                  className="cursor-pointer"
                >
                  {recipient}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Name input (shown for non-Self recipients) */}
        {selectedRecipient && selectedRecipient !== 'Self' && (
          <div className="space-y-2">
            <label
              htmlFor="lkm-person-name"
              className="text-sm font-medium text-gray-700"
            >
              Person&apos;s name (optional)
            </label>
            <Input
              id="lkm-person-name"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder={NAME_PLACEHOLDERS[selectedRecipient as Exclude<Recipient, 'Self'>]}
              className="w-full"
              aria-label="Person's name (optional)"
            />
          </div>
        )}

        {/* Preview of metta phrases */}
        {selectedRecipient && (
          <div className="p-3 rounded-md bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800">
            <p className="text-xs font-medium text-pink-900 dark:text-pink-100 mb-2">
              Preview:
            </p>
            <div className="space-y-1 text-sm text-pink-800 dark:text-pink-200">
              {generateMettaPhrases().map((phrase, index) => (
                <p key={index}>{phrase}</p>
              ))}
            </div>
          </div>
        )}

        {/* Add to Journal button */}
        <Button
          onClick={handleInsert}
          disabled={!canSubmit()}
          className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-medium"
          aria-label="Add loving-kindness meditation to journal"
        >
          Add to Journal Entry
        </Button>
      </div>
    </>
  )
}

/**
 * LovingKindnessHelper Component (Original with HelperContainer)
 * Kept for backward compatibility
 */
export function LovingKindnessHelper({ entryId, userId, onInsert }: LovingKindnessHelperProps) {
  const collapseHelperRef = useRef<(() => void) | null>(null)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')

  const announce = (message: string) => {
    setLiveRegionMessage(message)
    setTimeout(() => setLiveRegionMessage(''), 1000)
  }

  const handleExpandChange = (isExpanded: boolean) => {
    if (isExpanded) {
      announce('Loving-Kindness Meditation helper expanded. Choose a recipient for compassion practice.')
    } else {
      announce('Loving-Kindness Meditation helper collapsed')
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
        helperType="loving-kindness"
        headerText="Cultivate compassion"
        descriptionText="Direct loving-kindness toward yourself or others using traditional metta meditation."
        variant="pink"
        onExpandChange={handleExpandChange}
        collapseRef={collapseHelperRef}
        showDismiss={false}
        defaultExpanded={false}
        testId="loving-kindness"
        infoContent={{
          title: "Loving-Kindness Meditation",
          description: "Traditional Buddhist metta practice for cultivating compassion and positive emotions toward self and others.",
          effectSize: "d = 0.33 for positive emotions (Galante et al., 2014)",
          citation: "Galante, J., et al. (2014). Loving-kindness meditation for chronic pain. Journal of Clinical Psychology, 70(9), 794-807.",
          learnMoreUrl: "https://www.mindful.org/a-guide-to-loving-kindness-meditation/"
        }}
      >
        <LovingKindnessContent entryId={entryId} userId={userId} onInsert={onInsert} />
      </HelperContainer>
    </>
  )
}
