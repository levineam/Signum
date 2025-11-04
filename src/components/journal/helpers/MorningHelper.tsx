'use client'

/**
 * Morning Daily Practice Helper Component
 * Story 2.10: Comprehensive evidence-based daily practice
 *
 * Integrates 8 research-backed interventions into a streamlined flow:
 * 1. Values & Purpose (d=0.20-0.40)
 * 2. Implementation Intentions (d=0.65) ⭐ strongest
 * 3. Mental Contrasting WOOP (outperforms positive thinking)
 * 4. Emotional Awareness (d=0.50-0.70)
 * 5. Cognitive Reframing CBT (d=0.80-1.00)
 * 6. Social Connection & Loving-Kindness (r=0.30-0.50, d=0.33)
 * 7. Growth Mindset (d=0.05-0.10)
 * 8. Best Possible Self (strong for optimism)
 *
 * Features:
 * - 9 text input fields with research-optimized prompts
 * - Natural prose output (lowercase first, connector words) following PR #120 pattern
 * - 7 new + 1 reused (CBT) info popups
 * - Purple/violet gradient styling
 * - Full WCAG AA accessibility compliance
 * - Telemetry: implementation intentions & if-then detection
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'
import { HelperContainer } from './HelperContainer'
import { HelperInfo } from './HelperInfo'
import { escapeHtml } from '@/utils/htmlEscape'

interface MorningHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

interface MorningFields {
  section1: string // Values anchored goal or intention
  section2: string // Implementation intention (when/where/how)
  section3: string // Obstacle identification
  section4: string // Emotional awareness
  section5: string // Cognitive reframing
  section6: string // Social connection plan
  section7: string // Growth-oriented challenge
  section8: string // Loving-kindness wish
  section9: string // Best possible self vision
}

/**
 * MorningContent Component (Content only, no container)
 * Extracted for use in standalone contexts like NotesPage
 */
export function MorningContent({ entryId, userId, onInsert }: MorningHelperProps) {
  const [fields, setFields] = useState<MorningFields>({
    section1: '',
    section2: '',
    section3: '',
    section4: '',
    section5: '',
    section6: '',
    section7: '',
    section8: '',
    section9: '',
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
    // Clear after announcement
    setTimeout(() => setLiveRegionMessage(''), 1000)
  }

  // Update a specific field
  const updateField = (fieldName: keyof MorningFields, value: string) => {
    setFields(prev => ({ ...prev, [fieldName]: value }))
  }

  // Check if form can be submitted (only section1 is mandatory, others optional)
  const canSubmit = (): boolean => {
    return fields.section1.trim() !== ''
  }

  // Get field completion count
  const getFieldCompletionCount = (): number => {
    return Object.values(fields).filter(field => field.trim() !== '').length
  }

  // Get character counts for telemetry
  const getFieldCharCounts = (): number[] => {
    return [
      fields.section1.length,
      fields.section2.length,
      fields.section3.length,
      fields.section4.length,
      fields.section5.length,
      fields.section6.length,
      fields.section7.length,
      fields.section8.length,
      fields.section9.length,
    ]
  }

  // Detect implementation intentions (time-based cues in Section 2)
  const hasImplementationIntention = (): boolean => {
    const text = fields.section2.toLowerCase()
    // Time-based cues: specific times, time phrases
    const timePatterns = [
      /\b\d{1,2}:\d{2}\b/, // 8:00, 10:30
      /\b\d{1,2}\s?(am|pm)\b/, // 8am, 10 pm
      /\b(morning|afternoon|evening|night)\b/,
      /\b(before|after|during)\s+\w+/, // before breakfast, after lunch
      /\b(when|while|as soon as)\b/, // when I wake up, while commuting
    ]
    return timePatterns.some(pattern => pattern.test(text))
  }

  // Detect if-then format (Section 3 or elsewhere)
  const hasIfThenFormat = (): boolean => {
    const allText = Object.values(fields).join(' ').toLowerCase()
    return allText.includes('if') && allText.includes('then')
  }

  // Utility: Lowercase first character (but preserve first-person pronouns)
  const lowercaseFirst = (text: string): string => {
    if (!text) return text

    // Preserve first-person pronouns at the start of text
    // These should stay capitalized: I, I'm, I've, I'll, I'd
    const firstPersonPronouns = /^I('m|'ve|'ll|'d)?\s/
    if (firstPersonPronouns.test(text)) {
      return text // Keep as-is
    }

    return text.charAt(0).toLowerCase() + text.slice(1)
  }

  // Utility: Normalize sentence ending (prevent double periods)
  const normalizeSentence = (text: string): string => {
    const trimmed = text.trim()
    if (!trimmed) return trimmed
    // Remove trailing punctuation if exists
    const withoutPunctuation = trimmed.replace(/[.!?]+$/, '')
    return withoutPunctuation
  }

  // Format morning practice as natural prose (one paragraph, separate sentences)
  const formatMorningPractice = (): string => {
    const sentences: string[] = []

    // Section 1: Values-anchored goal (keep as-is, capitalize first)
    if (fields.section1.trim()) {
      sentences.push(`${escapeHtml(normalizeSentence(fields.section1))}.`)
    }

    // Section 2: Implementation intention (add contextual prefix)
    if (fields.section2.trim()) {
      sentences.push(`To make this happen, ${escapeHtml(lowercaseFirst(normalizeSentence(fields.section2)))}.`)
    }

    // Section 3: Obstacle identification (add contextual prefix)
    if (fields.section3.trim()) {
      sentences.push(`If obstacles arise, ${escapeHtml(lowercaseFirst(normalizeSentence(fields.section3)))}.`)
    }

    // Section 4: Emotional awareness (keep as-is if starts with "I", else add prefix)
    if (fields.section4.trim()) {
      const text = normalizeSentence(fields.section4)
      // Check if user already included "I'm feeling" or similar
      if (text.match(/^I('m| am)/i)) {
        sentences.push(`${escapeHtml(text)}.`)
      } else {
        sentences.push(`Right now I'm feeling ${escapeHtml(lowercaseFirst(text))}.`)
      }
    }

    // Section 5: Cognitive reframing (add contextual prefix)
    if (fields.section5.trim()) {
      sentences.push(`When I notice unhelpful thoughts, ${escapeHtml(lowercaseFirst(normalizeSentence(fields.section5)))}.`)
    }

    // Section 6: Social connection (keep as-is, capitalize first)
    if (fields.section6.trim()) {
      sentences.push(`${escapeHtml(normalizeSentence(fields.section6))}.`)
    }

    // Section 7: Growth challenge (add contextual prefix)
    if (fields.section7.trim()) {
      sentences.push(`I'll challenge myself by ${escapeHtml(lowercaseFirst(normalizeSentence(fields.section7)))}.`)
    }

    // Section 8: Loving-kindness (keep as-is if starts with "I wish", else add prefix)
    if (fields.section8.trim()) {
      const text = normalizeSentence(fields.section8)
      // Check if user already included "I wish"
      if (text.match(/^I wish/i)) {
        sentences.push(`${escapeHtml(text)}.`)
      } else {
        sentences.push(`I wish ${escapeHtml(lowercaseFirst(text))}.`)
      }
    }

    // Section 9: Best possible self (add contextual prefix)
    if (fields.section9.trim()) {
      sentences.push(`I envision ${escapeHtml(lowercaseFirst(normalizeSentence(fields.section9)))}.`)
    }

    // Join all sentences into one paragraph with spaces
    if (sentences.length > 0) {
      return `<p>${sentences.join(' ')}</p><p><br></p>`
    }

    return ''
  }

  // Handle insert to journal
  const handleInsert = async () => {
    if (!canSubmit()) return

    // Format morning practice text
    const morningText = formatMorningPractice()

    // Track inserted event
    const insertedEvent: HelperEvent = {
      type: 'helper_inserted',
      timestamp: new Date().toISOString(),
      data: {
        insertedText: morningText,
        fieldCompletionCount: getFieldCompletionCount()
      }
    }
    addEvent(insertedEvent)

    // Log usage to database (non-blocking)
    try {
      await createHelperUsage({
        helperType: 'morning',
        entryId: entryId,
        selectedItems: [],
        metadata: {
          events: eventsRef.current,
          selectionCount: 0,
          insertedText: morningText,
          morningFieldCharCounts: getFieldCharCounts(),
          hasImplementationIntention: hasImplementationIntention(),
          hasIfThenFormat: hasIfThenFormat()
        }
      }, userId)
    } catch (error) {
      console.error('Failed to log helper usage:', error)
      // Don't block user interaction if logging fails
    }

    // Announce and callback
    announce('Inserted morning practice into journal')
    onInsert(morningText)

    // Reset state
    setFields({
      section1: '',
      section2: '',
      section3: '',
      section4: '',
      section5: '',
      section6: '',
      section7: '',
      section8: '',
      section9: '',
    })
    eventsRef.current = []
  }

  // Handle clear all fields
  const handleClear = () => {
    setFields({
      section1: '',
      section2: '',
      section3: '',
      section4: '',
      section5: '',
      section6: '',
      section7: '',
      section8: '',
      section9: '',
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
          Complete your daily practice with evidence-based reflection across 9 dimensions.
        </p>
      </div>

      {/* Morning Practice Form */}
      <div className="space-y-4">
        {/* Section 1: Values Anchored Goal/Intention */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="morning-section1"
              className="text-sm font-medium text-purple-800 dark:text-purple-200"
            >
              What goal, intention, or action matters most to you today?
            </label>
            <HelperInfo
              content={{
                title: "Goals, Purpose & Transcendence",
                description: "Having a sense of purpose and connection to something larger than yourself is linked to better health, longevity, and resilience. Even brief awe experiences (transcendent moments) boost well-being and prosocial behavior.",
                effectSize: "d=0.20-0.40 with well-being; protective against dementia",
                citation: "Kim, E. S., et al. (2022). Sense of purpose in life and subsequent physical, behavioral, and psychosocial health. American Journal of Health Promotion. Chirico, A., et al. (2018). Awe enhances creative thinking. Creativity Research Journal."
              }}
              variant="purple"
            />
          </div>
          <Textarea
            id="morning-section1"
            value={fields.section1}
            onChange={(e) => updateField('section1', e.target.value)}
            placeholder="Example: I want to deepen my relationships by being more present and curious with loved ones"
            className="bg-white dark:bg-gray-950 min-h-[80px]"
            data-testid="morning-section1"
          />
        </div>

        {/* Section 2: Implementation Intention */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="morning-section2"
              className="text-sm font-medium text-purple-800 dark:text-purple-200"
            >
              When, where, or how will you take action on this today?
            </label>
            <HelperInfo
              content={{
                title: "Implementation Intentions",
                description: "Pre-planning the specific when/where/how of a goal-directed behavior dramatically increases follow-through. This technique works by creating an automatic if-then link between situational cues and desired actions.",
                effectSize: "d=0.65 (medium-to-large effect across domains)",
                citation: "Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. Advances in Experimental Social Psychology, 38, 69-119.",
                learnMoreUrl: "https://psycnet.apa.org/record/2006-20133-002"
              }}
              variant="purple"
            />
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
            Hint: Include a specific time or situation (e.g., &quot;during breakfast,&quot; &quot;at 7pm,&quot; &quot;when I get home&quot;)
          </p>
          <Textarea
            id="morning-section2"
            value={fields.section2}
            onChange={(e) => updateField('section2', e.target.value)}
            placeholder="Example: during dinner tonight, I'll put my phone away and ask each person one open-ended question about their day"
            className="bg-white dark:bg-gray-950 min-h-[80px]"
            data-testid="morning-section2"
          />
        </div>

        {/* Section 3: Obstacle Identification */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="morning-section3"
              className="text-sm font-medium text-purple-800 dark:text-purple-200"
            >
              What internal obstacle might get in the way? (a thought, feeling, or habit)
            </label>
            <HelperInfo
              content={{
                title: "Mental Contrasting (WOOP)",
                description: "Combining positive goal visualization with realistic obstacle planning (mental contrasting) significantly boosts goal achievement compared to positive thinking alone. Creating if-then plans for obstacles increases success rates.",
                effectSize: "Outperforms positive thinking alone; if-then plans d=0.65",
                citation: "Oettingen, G. (2014). Rethinking Positive Thinking: Inside the New Science of Motivation. Current Directions in Psychological Science.",
                learnMoreUrl: "https://woopmylife.org/"
              }}
              variant="purple"
            />
          </div>
          <p className="text-xs text-purple-600 dark:text-purple-400 mb-2">
            Be kind to yourself as you name this obstacle. What will you do if it arises?
          </p>
          <Textarea
            id="morning-section3"
            value={fields.section3}
            onChange={(e) => updateField('section3', e.target.value)}
            placeholder="Example: I might feel the urge to check my phone, but I'll remind myself that presence is a gift I can give"
            className="bg-white dark:bg-gray-950 min-h-[80px]"
            data-testid="morning-section3"
          />
        </div>

        {/* Section 4: Emotional Awareness */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="morning-section4"
              className="text-sm font-medium text-purple-800 dark:text-purple-200"
            >
              Name your current emotion(s) and where you feel it in your body
            </label>
            <HelperInfo
              content={{
                title: "Affect Labeling & Emotional Granularity",
                description: "Naming emotions with precision (emotional granularity) reduces their intensity and improves emotion regulation. The simple act of labeling feelings activates prefrontal regulatory circuits and downregulates amygdala reactivity.",
                effectSize: "d=0.50-0.70 for emotion regulation improvements",
                citation: "Lieberman, M. D., et al. (2007). Putting feelings into words: Affect labeling disrupts amygdala activity in response to affective stimuli. Psychological Science, 18(5), 421-428. Torre, J. B., & Lieberman, M. D. (2018). Putting feelings into words: Affect labeling as implicit emotion regulation. Emotion Review, 10(2), 116-124."
              }}
              variant="purple"
            />
          </div>
          <Textarea
            id="morning-section4"
            value={fields.section4}
            onChange={(e) => updateField('section4', e.target.value)}
            placeholder="Example: a mix of hopefulness and nervousness—hopeful as a lightness in my chest, and nervous as tension in my shoulders"
            className="bg-white dark:bg-gray-950 min-h-[80px]"
            data-testid="morning-section4"
          />
        </div>

        {/* Section 5: Cognitive Reframing */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="morning-section5"
              className="text-sm font-medium text-purple-800 dark:text-purple-200"
            >
              If a negative thought arises today, how will you reframe it?
            </label>
            <HelperInfo
              content={{
                title: "Cognitive Reframing (CBT)",
                description: "Cognitive Behavioral Therapy teaches that thoughts, feelings, and behaviors are interconnected. Identifying and reframing distorted thinking patterns reduces anxiety and depression more effectively than many other interventions.",
                effectSize: "d=0.80-1.00 for depression and anxiety",
                citation: "Hofmann, S. G., et al. (2012). The efficacy of cognitive behavioral therapy: A review of meta-analyses. Cognitive Therapy and Research, 36(5), 427-440."
              }}
              variant="purple"
            />
          </div>
          <Textarea
            id="morning-section5"
            value={fields.section5}
            onChange={(e) => updateField('section5', e.target.value)}
            placeholder="Example: I'll catch all-or-nothing thinking and remind myself that small steps still matter"
            className="bg-white dark:bg-gray-950 min-h-[80px]"
            data-testid="morning-section5"
          />
        </div>

        {/* Section 6: Social Connection */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="morning-section6"
              className="text-sm font-medium text-purple-800 dark:text-purple-200"
            >
              Who will you connect with today, and how?
            </label>
            <HelperInfo
              content={{
                title: "Social Connection & Loving-Kindness",
                description: "Social support is one of the strongest predictors of well-being and resilience. Planning social connections increases follow-through on reaching out. Combining this with loving-kindness (wishing others well) enhances prosocial behavior and positive emotions.",
                effectSize: "r=0.30-0.50 with well-being (social support); d=0.33 for positive emotions (loving-kindness)",
                citation: "Holt-Lunstad, J., et al. (2010). Social relationships and mortality risk. PLoS Medicine, 7(7). Galante, J., et al. (2014). Loving-kindness meditation effects. Journal of Clinical Psychology, 70(9), 794-807.",
                learnMoreUrl: "https://www.apa.org/monitor/2023/06/cover-story-social-support"
              }}
              variant="purple"
            />
          </div>
          <Textarea
            id="morning-section6"
            value={fields.section6}
            onChange={(e) => updateField('section6', e.target.value)}
            placeholder="Example: I'll text my friend to check in about their job interview"
            className="bg-white dark:bg-gray-950 min-h-[80px]"
            data-testid="morning-section6"
          />
        </div>

        {/* Section 7: Growth-Oriented Challenge */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="morning-section7"
              className="text-sm font-medium text-purple-800 dark:text-purple-200"
            >
              What&apos;s one small stretch or learning opportunity? (Use -ing form: &quot;trying...&quot;, &quot;learning...&quot;)
            </label>
            <HelperInfo
              content={{
                title: "Growth Mindset",
                description: "Viewing challenges as opportunities for learning (growth mindset) rather than fixed judgments of ability improves resilience, persistence, and achievement. Framing setbacks as informative rather than defining is a core skill.",
                effectSize: "d=0.05-0.10 (small but meaningful, especially for at-risk populations)",
                citation: "Dweck, C. S. (2006). Mindset: The New Psychology of Success. Random House. Yeager, D. S., & Dweck, C. S. (2012). Mindsets that promote resilience. Educational Psychologist, 47(4), 302-314."
              }}
              variant="purple"
            />
          </div>
          <Textarea
            id="morning-section7"
            value={fields.section7}
            onChange={(e) => updateField('section7', e.target.value)}
            placeholder="Example: trying a new recipe even if it doesn't turn out perfectly"
            className="bg-white dark:bg-gray-950 min-h-[80px]"
            data-testid="morning-section7"
          />
        </div>

        {/* Section 8: Loving-Kindness Wish */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="morning-section8"
              className="text-sm font-medium text-purple-800 dark:text-purple-200"
            >
              Complete this: &quot;I wish...&quot; (for yourself or someone else)
            </label>
            <HelperInfo
              content={{
                title: "Social Connection & Loving-Kindness",
                description: "Social support is one of the strongest predictors of well-being and resilience. Planning social connections increases follow-through on reaching out. Combining this with loving-kindness (wishing others well) enhances prosocial behavior and positive emotions.",
                effectSize: "r=0.30-0.50 with well-being (social support); d=0.33 for positive emotions (loving-kindness)",
                citation: "Holt-Lunstad, J., et al. (2010). Social relationships and mortality risk. PLoS Medicine, 7(7). Galante, J., et al. (2014). Loving-kindness meditation effects. Journal of Clinical Psychology, 70(9), 794-807.",
                learnMoreUrl: "https://www.apa.org/monitor/2023/06/cover-story-social-support"
              }}
              variant="purple"
            />
          </div>
          <Textarea
            id="morning-section8"
            value={fields.section8}
            onChange={(e) => updateField('section8', e.target.value)}
            placeholder="Example: for my colleague to feel supported as they navigate this transition"
            className="bg-white dark:bg-gray-950 min-h-[80px]"
            data-testid="morning-section8"
          />
        </div>

        {/* Section 9: Best Possible Self */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="morning-section9"
              className="text-sm font-medium text-purple-800 dark:text-purple-200"
            >
              Imagine your best possible self—what do you see?
            </label>
            <HelperInfo
              content={{
                title: "Best Possible Self",
                description: "Visualizing your ideal future self across life domains increases optimism, well-being, and life satisfaction. This exercise helps clarify values and long-term goals while boosting positive emotions in the present.",
                effectSize: "d=0.28 for well-being improvements",
                citation: "King, L. A. (2001). The health benefits of writing about life goals. Personality and Social Psychology Bulletin, 27(7), 798-807."
              }}
              variant="purple"
            />
          </div>
          <Textarea
            id="morning-section9"
            value={fields.section9}
            onChange={(e) => updateField('section9', e.target.value)}
            placeholder="Example: someone who approaches each day with curiosity and contributes meaningfully to my community"
            className="bg-white dark:bg-gray-950 min-h-[80px]"
            data-testid="morning-section9"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-4 border-t border-purple-200 dark:border-purple-800 mt-4">
        <Button
          onClick={handleInsert}
          disabled={!canSubmit()}
          className="bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-600"
          size="sm"
          data-testid="morning-insert-button"
        >
          Add to Journal Entry
        </Button>
        <Button
          onClick={handleClear}
          disabled={getFieldCompletionCount() === 0}
          variant="ghost"
          size="sm"
          className="text-purple-700 hover:text-purple-900 hover:bg-purple-100 dark:text-purple-300 dark:hover:text-purple-100 dark:hover:bg-purple-900/50"
          data-testid="morning-clear-button"
        >
          Clear All
        </Button>
      </div>
    </>
  )
}

/**
 * MorningHelper Component (Original with HelperContainer)
 * Kept for backward compatibility
 */
export function MorningHelper({ entryId, userId, onInsert }: MorningHelperProps) {
  const collapseHelperRef = useRef<(() => void) | null>(null)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')

  const announce = (message: string) => {
    setLiveRegionMessage(message)
    setTimeout(() => setLiveRegionMessage(''), 1000)
  }

  const handleExpandChange = (isExpanded: boolean) => {
    if (isExpanded) {
      announce('Morning Practice helper expanded. Complete 9 evidence-based reflection prompts.')
    } else {
      announce('Morning Practice helper collapsed')
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
        helperType="morning"
        headerText="Start your day with purpose"
        descriptionText="Complete your daily practice with evidence-based reflection across 9 dimensions."
        variant="purple"
        onExpandChange={handleExpandChange}
        collapseRef={collapseHelperRef}
        showDismiss={false}
        defaultExpanded={false}
        testId="morning"
      >
        <MorningContent entryId={entryId} userId={userId} onInsert={onInsert} />
      </HelperContainer>
    </>
  )
}
