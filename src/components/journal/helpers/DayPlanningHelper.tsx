'use client'

/**
 * Day Planning Helper Component
 * Story 2.11: Evidence-based day planning with 7 structured sections
 *
 * Combines multiple interventions:
 * - Cognitive Offloading (Brain Dump): d=40-50% reduction in intrusive thoughts
 * - Implementation Intentions (Big Thing): d=0.65 (medium-large effect)
 * - Tiny Habits (First Step): 2-3x adherence increase
 * - Planning Fallacy Prevention (Time): 50% buffer reduces stress
 * - Temptation Bundling (Enjoyable): 29-51% engagement increase
 * - Mental Contrasting (Obstacles): Outperforms positive thinking
 * - Outcome Visualization (Future): Strong for motivation
 *
 * Features:
 * - 7 planning sections (2 required, 5 optional)
 * - Research-backed info icons for each section
 * - Natural prose output formatting
 * - Usage tracking with if-then and time detection
 * - Full WCAG AA accessibility compliance
 * - Blue gradient styling
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'
import { HelperContainer } from './HelperContainer'
import { HelperInfo } from './HelperInfo'
import { escapeHtml } from '@/utils/htmlEscape'

interface DayPlanningHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

interface DayPlanningFields {
  brainDump: string        // Section 1 - Required
  bigThing: string         // Section 2 - Required
  firstStep: string        // Section 3 - Optional
  timeCommitment: string   // Section 4 - Optional
  enjoyableElement: string // Section 5 - Optional
  obstaclePlan: string     // Section 6 - Optional
  futureVision: string     // Section 7 - Optional
}

/**
 * DayPlanningContent Component (Content only, no container)
 * Extracted for use in standalone contexts like NotesPage
 */
export function DayPlanningContent({ entryId, userId, onInsert }: DayPlanningHelperProps) {
  const [fields, setFields] = useState<DayPlanningFields>({
    brainDump: '',
    bigThing: '',
    firstStep: '',
    timeCommitment: '',
    enjoyableElement: '',
    obstaclePlan: '',
    futureVision: ''
  })
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

  // Update a specific field
  const updateField = (fieldName: keyof DayPlanningFields, value: string) => {
    setFields(prev => ({ ...prev, [fieldName]: value }))
  }

  // Check if form can be submitted (Sections 1-2 required)
  const canSubmit = (): boolean => {
    return fields.brainDump.trim() !== '' && fields.bigThing.trim() !== ''
  }

  // Get field completion count (1-7)
  const getFieldCompletionCount = (): number => {
    return Object.values(fields).filter(field => field.trim() !== '').length
  }

  // Get character counts for telemetry (7-element array)
  const getFieldCharCounts = (): number[] => {
    return [
      fields.brainDump.length,
      fields.bigThing.length,
      fields.firstStep.length,
      fields.timeCommitment.length,
      fields.enjoyableElement.length,
      fields.obstaclePlan.length,
      fields.futureVision.length
    ]
  }

  // Detect if-then format in obstacle planning (Section 6)
  const hasIfThenFormat = (): boolean => {
    const text = fields.obstaclePlan.toLowerCase()
    return text.includes('if') && text.includes('then')
  }

  // Detect time specification in time commitment (Section 4)
  const hasTimeSpecification = (): boolean => {
    const text = fields.timeCommitment.toLowerCase()
    const timePatterns = [
      /\b\d{1,2}:\d{2}\b/,           // 8:00, 10:30
      /\b\d{1,2}\s?(am|pm)\b/,       // 8am, 10 pm
      /\b(morning|afternoon|evening|night)\b/,
      /\b(before|after|during)\s+\w+/, // before breakfast
      /\b(at|from|until)\b/           // at 9am, from 2-4pm
    ]
    return timePatterns.some(pattern => pattern.test(text))
  }

  // Helper function to lowercase first character (preserve I, I'm, etc.)
  const lowercaseFirst = (text: string): string => {
    if (!text) return text
    // Preserve first-person pronouns
    if (/^I('m|'ve|'ll|'d)?\s/.test(text)) {
      return text
    }
    return text.charAt(0).toLowerCase() + text.slice(1)
  }

  // Helper function to normalize sentence (remove trailing punctuation)
  const normalizeSentence = (text: string): string => {
    const trimmed = text.trim()
    if (!trimmed) return trimmed
    return trimmed.replace(/[.!?]+$/, '')
  }

  // Format day planning as natural prose
  const formatDayPlanningPlan = (): string => {
    const sentences: string[] = []

    // Section 1: Brain Dump (required)
    if (fields.brainDump.trim()) {
      sentences.push(`Things on my mind: ${escapeHtml(normalizeSentence(fields.brainDump))}.`)
    }

    // Section 2: Big Thing (required)
    if (fields.bigThing.trim()) {
      sentences.push(`My priority today is ${escapeHtml(lowercaseFirst(normalizeSentence(fields.bigThing)))}.`)
    }

    // Section 3: First Step (optional)
    if (fields.firstStep.trim()) {
      sentences.push(`I'll start by ${escapeHtml(lowercaseFirst(normalizeSentence(fields.firstStep)))}.`)
    }

    // Section 4: Time Commitment (optional)
    if (fields.timeCommitment.trim()) {
      sentences.push(`I'm scheduling ${escapeHtml(lowercaseFirst(normalizeSentence(fields.timeCommitment)))}.`)
    }

    // Section 5: Enjoyable Element (optional)
    if (fields.enjoyableElement.trim()) {
      sentences.push(`To make it easier, ${escapeHtml(lowercaseFirst(normalizeSentence(fields.enjoyableElement)))}.`)
    }

    // Section 6: Obstacle Plan (optional)
    if (fields.obstaclePlan.trim()) {
      sentences.push(`If obstacles arise, ${escapeHtml(lowercaseFirst(normalizeSentence(fields.obstaclePlan)))}.`)
    }

    // Section 7: Future Vision (optional)
    if (fields.futureVision.trim()) {
      sentences.push(`When I complete this, ${escapeHtml(lowercaseFirst(normalizeSentence(fields.futureVision)))}.`)
    }

    // Join all sentences into one paragraph with space between
    if (sentences.length > 0) {
      return `<p>${sentences.join(' ')}</p><p><br></p>`
    }

    return ''
  }

  // Handle insert to journal
  const handleInsert = async () => {
    if (!canSubmit()) return

    // Format day planning text
    const planningText = formatDayPlanningPlan()

    // Track inserted event
    const insertedEvent: HelperEvent = {
      type: 'helper_inserted',
      timestamp: new Date().toISOString(),
      data: {
        insertedText: planningText,
        fieldCompletionCount: getFieldCompletionCount()
      }
    }
    addEvent(insertedEvent)

    // Log usage to database (non-blocking, skip in guest mode)
    if (userId !== 'guest' && entryId !== 'guest-entry') {
      try {
        await createHelperUsage({
          helperType: 'day-planning',
          entryId: entryId,
          selectedItems: [],
          metadata: {
            events: eventsRef.current,
            selectionCount: 0,
            insertedText: planningText,
            dayPlanningFieldCharCounts: getFieldCharCounts(),
            fieldCompletionCount: getFieldCompletionCount(),
            hasIfThenFormat: hasIfThenFormat(),
            hasTimeSpecification: hasTimeSpecification()
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
    announce('Inserted day planning into journal')
    onInsert(planningText)

    // Reset state
    setFields({
      brainDump: '',
      bigThing: '',
      firstStep: '',
      timeCommitment: '',
      enjoyableElement: '',
      obstaclePlan: '',
      futureVision: ''
    })
    eventsRef.current = []
  }

  // Handle clear all fields
  const handleClear = () => {
    setFields({
      brainDump: '',
      bigThing: '',
      firstStep: '',
      timeCommitment: '',
      enjoyableElement: '',
      obstaclePlan: '',
      futureVision: ''
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

      {/* Description */}
      <div className="mb-4">
        <p className="text-gray-700 dark:text-gray-300">
          Plan your day with evidence-based strategies to clarify priorities, commit to action, and prepare for success.
        </p>
      </div>

      {/* Day Planning Form - 7 Sections */}
      <div className="space-y-4">
        {/* Section 1: Brain Dump (Required) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="day-planning-brain-dump"
              className="text-sm font-medium text-blue-800 dark:text-blue-200"
            >
              1. Brain Dump <span className="text-red-500">*</span>
            </label>
            <HelperInfo
              content={{
                title: "Cognitive Offloading & Working Memory",
                description: "Writing down thoughts and tasks reduces cognitive load, freeing up mental resources for focused work. This 'brain dump' technique is a core component of GTD (Getting Things Done) and helps prevent intrusive thoughts from disrupting concentration.",
                effectSize: "Reduces intrusive thoughts by 40-50% during focused work",
                citation: "Baumeister, R. F., & Masicampo, E. J. (2011). Consider it done! Plan making can eliminate the cognitive effects of unfulfilled goals. Journal of Personality and Social Psychology, 101(4), 667-683."
              }}
              variant="blue"
            />
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
            List everything tugging at your attention—tasks, errands, worries. Don't organize yet; just unload.
          </p>
          <Textarea
            id="day-planning-brain-dump"
            value={fields.brainDump}
            onChange={(e) => updateField('brainDump', e.target.value)}
            placeholder="Example: Finish quarterly report, call mom, dentist appointment, worry about presentation, fix leaky faucet..."
            className="bg-white dark:bg-gray-950 min-h-[80px]"
            data-testid="day-planning-brain-dump"
          />
        </div>

        {/* Section 2: Big Thing (Required) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="day-planning-big-thing"
              className="text-sm font-medium text-blue-800 dark:text-blue-200"
            >
              2. Big Thing <span className="text-red-500">*</span>
            </label>
            <HelperInfo
              content={{
                title: "Priority Focus & Implementation Intentions",
                description: "Identifying a single most important task (MIT) dramatically increases goal achievement rates. This approach aligns with implementation intention research showing that concrete, specific plans lead to 65% higher completion rates than vague goals.",
                effectSize: "d=0.65 for goal achievement (medium-large effect)",
                citation: "Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. Advances in Experimental Social Psychology, 38, 69-119."
              }}
              variant="blue"
            />
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
            Pick the single Big Thing that would make today meaningfully spent. Optionally add up to two support tasks.
          </p>
          <Textarea
            id="day-planning-big-thing"
            value={fields.bigThing}
            onChange={(e) => updateField('bigThing', e.target.value)}
            placeholder="Example: Complete first draft of quarterly report. Support: 1) Gather Q4 data, 2) Review last quarter's format"
            className="bg-white dark:bg-gray-950 min-h-[80px]"
            data-testid="day-planning-big-thing"
          />
        </div>

        {/* Section 3: First Step (Optional) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="day-planning-first-step"
              className="text-sm font-medium text-blue-800 dark:text-blue-200"
            >
              3. First Step
            </label>
            <HelperInfo
              content={{
                title: "Micro-Habits & Action Triggers",
                description: "Breaking goals into the smallest possible first step reduces activation energy and overcomes procrastination. This aligns with BJ Fogg's Tiny Habits research showing that making behaviors 'ridiculously easy' increases follow-through by making them feel less threatening.",
                effectSize: "Tiny habits increase long-term behavior change adherence by 2-3x",
                citation: "Fogg, B. J. (2020). Tiny Habits: The Small Changes That Change Everything. Houghton Mifflin Harcourt.",
                learnMoreUrl: "https://tinyhabits.com/"
              }}
              variant="blue"
            />
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
            What is the tiniest physical step toward your Big Thing?
          </p>
          <Textarea
            id="day-planning-first-step"
            value={fields.firstStep}
            onChange={(e) => updateField('firstStep', e.target.value)}
            placeholder="Example: Open laptop and create new document titled 'Q4_Report_Draft.docx'"
            className="bg-white dark:bg-gray-950 min-h-[80px]"
            data-testid="day-planning-first-step"
          />
        </div>

        {/* Section 4: Time Commitment (Optional) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="day-planning-time-commitment"
              className="text-sm font-medium text-blue-800 dark:text-blue-200"
            >
              4. Time Commitment
            </label>
            <HelperInfo
              content={{
                title: "Time-Based Implementation Intentions",
                description: "Specifying exactly when and where you'll do a task creates a powerful psychological trigger. Adding time buffers prevents the planning fallacy—our tendency to underestimate how long tasks take—which improves follow-through and reduces stress from unrealistic schedules.",
                effectSize: "d=0.65 for goal achievement; 50% buffer reduces deadline stress",
                citation: "Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement. Buehler, R., et al. (2002). Planning, personality, and prediction: The role of future focus in optimistic time predictions. Organizational Behavior and Human Decision Processes."
              }}
              variant="blue"
            />
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
            What time and how long will you work on this? (Tip: add a 50% time buffer)
          </p>
          <Textarea
            id="day-planning-time-commitment"
            value={fields.timeCommitment}
            onChange={(e) => updateField('timeCommitment', e.target.value)}
            placeholder="Example: 10:00 AM - 12:00 PM (1.5 hours work + 30 min buffer)"
            className="bg-white dark:bg-gray-950 min-h-[80px]"
            data-testid="day-planning-time-commitment"
          />
        </div>

        {/* Section 5: Enjoyable Element (Optional) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="day-planning-enjoyable-element"
              className="text-sm font-medium text-blue-800 dark:text-blue-200"
            >
              5. Enjoyable Element
            </label>
            <HelperInfo
              content={{
                title: "Temptation Bundling & Intrinsic Motivation",
                description: "Pairing enjoyable activities with challenging tasks (temptation bundling) makes starting easier and increases intrinsic motivation. This technique leverages reward-based learning to build positive associations with difficult work, reducing procrastination over time.",
                effectSize: "Increases task engagement by 29-51% in behavioral studies",
                citation: "Milkman, K. L., et al. (2014). Holding the Hunger Games hostage at the gym: An evaluation of temptation bundling. Management Science, 60(2), 283-299."
              }}
              variant="blue"
            />
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
            What is something enjoyable you can do when you get started?
          </p>
          <Textarea
            id="day-planning-enjoyable-element"
            value={fields.enjoyableElement}
            onChange={(e) => updateField('enjoyableElement', e.target.value)}
            placeholder="Example: Make a fresh cup of coffee and light my favorite candle"
            className="bg-white dark:bg-gray-950 min-h-[80px]"
            data-testid="day-planning-enjoyable-element"
          />
        </div>

        {/* Section 6: Obstacle Plan (Optional) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="day-planning-obstacle-plan"
              className="text-sm font-medium text-blue-800 dark:text-blue-200"
            >
              6. Obstacle Planning
            </label>
            <HelperInfo
              content={{
                title: "Mental Contrasting & If-Then Planning (WOOP)",
                description: "Anticipating obstacles and creating if-then plans (implementation intentions) significantly increases goal achievement. Mental contrasting—visualizing both success AND obstacles—outperforms positive thinking alone by preparing concrete responses to challenges.",
                effectSize: "Significantly outperforms positive thinking alone; if-then plans increase success rates",
                citation: "Oettingen, G. (2014). Rethinking Positive Thinking: Inside the New Science of Motivation. Current Directions in Psychological Science. Gollwitzer, P. M. (1999). Implementation intentions: Strong effects of simple plans. American Psychologist, 54(7), 493-503.",
                learnMoreUrl: "https://woopmylife.org/"
              }}
              variant="blue"
            />
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
            What obstacle might you face and what will you do if that happens?
          </p>
          <Textarea
            id="day-planning-obstacle-plan"
            value={fields.obstaclePlan}
            onChange={(e) => updateField('obstaclePlan', e.target.value)}
            placeholder="Example: If I get stuck on data analysis → skip to executive summary and return later"
            className="bg-white dark:bg-gray-950 min-h-[80px]"
            data-testid="day-planning-obstacle-plan"
          />
        </div>

        {/* Section 7: Future Vision (Optional) */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="day-planning-future-vision"
              className="text-sm font-medium text-blue-800 dark:text-blue-200"
            >
              7. Future Vision
            </label>
            <HelperInfo
              content={{
                title: "Outcome Visualization & Positive Affect",
                description: "Visualizing the positive emotional outcomes of completing tasks enhances motivation and follow-through. This technique, part of WOOP (Wish-Outcome-Obstacle-Plan), helps connect present actions to future benefits, increasing the perceived value of effort.",
                effectSize: "Part of WOOP framework that outperforms positive thinking alone",
                citation: "Oettingen, G., & Reininger, K. M. (2016). The power of prospection: Mental contrasting and behavior change. Social and Personality Psychology Compass, 10(11), 591-604."
              }}
              variant="blue"
            />
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
            How will you feel if you execute on this plan?
          </p>
          <Textarea
            id="day-planning-future-vision"
            value={fields.futureVision}
            onChange={(e) => updateField('futureVision', e.target.value)}
            placeholder="Example: Relieved and accomplished, ready to enjoy my evening without work stress"
            className="bg-white dark:bg-gray-950 min-h-[80px]"
            data-testid="day-planning-future-vision"
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
          data-testid="day-planning-insert-button"
        >
          Add to Journal Entry
        </Button>
        <Button
          onClick={handleClear}
          disabled={Object.values(fields).every(field => !field)}
          variant="ghost"
          size="sm"
          className="text-blue-700 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-300 dark:hover:text-blue-100 dark:hover:bg-blue-900/50"
          data-testid="day-planning-clear-button"
        >
          Clear All
        </Button>
      </div>
    </>
  )
}

/**
 * DayPlanningHelper Component (Original with HelperContainer)
 * Kept for backward compatibility
 */
export function DayPlanningHelper({ entryId, userId, onInsert }: DayPlanningHelperProps) {
  const collapseHelperRef = useRef<(() => void) | null>(null)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')

  const announce = (message: string) => {
    setLiveRegionMessage(message)
    setTimeout(() => setLiveRegionMessage(''), 1000)
  }

  const handleExpandChange = (isExpanded: boolean) => {
    if (isExpanded) {
      announce('Day Planning helper expanded. Start by listing what\'s on your mind.')
    } else {
      announce('Day Planning helper collapsed')
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
        helperType="day-planning"
        headerText="Ready to plan your day?"
        descriptionText="Clarify priorities, commit to action, and prepare for obstacles with evidence-based strategies."
        variant="blue"
        onExpandChange={handleExpandChange}
        collapseRef={collapseHelperRef}
        showDismiss={false}
        defaultExpanded={false}
        testId="day-planning"
        infoContent={{
          title: "Day Planning Helper",
          description: "A comprehensive planning framework combining 7 evidence-based interventions from cognitive offloading to outcome visualization. Each section addresses a specific barrier to goal achievement, creating a synergistic effect when used together.",
          effectSize: "Combined effect from implementation intentions (d=0.65), WOOP, temptation bundling, and cognitive offloading",
          citation: "Integrates research from Gollwitzer & Sheeran (2006), Oettingen (2014), Fogg (2020), Baumeister & Masicampo (2011), and Milkman et al. (2014)."
        }}
      >
        <DayPlanningContent entryId={entryId} userId={userId} onInsert={onInsert} />
      </HelperContainer>
    </>
  )
}
