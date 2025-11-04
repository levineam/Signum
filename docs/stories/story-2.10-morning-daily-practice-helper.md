# Story 2.10: Morning Daily Practice Helper

**Status:** 📋 READY FOR DEVELOPMENT
**Created:** 2025-11-03
**Updated:** 2025-11-03
**Issue:** #100
**Parent Epic:** Phase 2: Self-Regulation & Clinical Tools
**Prerequisites:**
- Story 2.8 (Helpers Tile UI) ✅ Complete
- Story 2.9 (Helper Popup UX) ✅ Complete
- PR #120 (Prose Output Format) 🚧 In Progress - Establishes prose format pattern
- HelperContainer component (already available)
- All existing helper infrastructure (Stories 2.5.x)

---

## Story

As a user,
I want a comprehensive "Morning" helper that guides me through evidence-based daily planning,
so that I can start my day with clarity about my values, goals, emotions, and social connections in one streamlined flow.

---

## Why This Matters

**Current State:**
- 8 individual helpers available (WOOP, Values, Loving-Kindness, CBT, etc.)
- Each helper addresses one specific need
- Users must switch between helpers for comprehensive daily planning
- No unified "daily practice" flow

**Problems:**
- Cognitive overhead of deciding which helpers to use
- Time-consuming to use multiple helpers sequentially
- Missing integration between related practices (values → goals → obstacles)
- No helper addresses transcendence/awe/purpose explicitly
- Users may skip important dimensions if scattered across helpers

**Benefits:**
- **Comprehensive coverage**: Combines values, goals, emotions, cognition, social connection, challenge, and visualization
- **Streamlined flow**: 9 sections in one helper (faster than using 5+ separate helpers)
- **Evidence-based**: Every section backed by research (d=0.65 for implementation intentions!)
- **Fills transcendence gap**: Adds awe/purpose components missing from individual helpers
- **First tile**: Prime position reinforces daily practice habit
- **Natural prose output**: Reads like journaling, not form-filling (per PR #120 pattern)
- **7 new + 1 reused info popup**: All research-backed with effect sizes and citations

---

## Scope

### In Scope

1. **Morning Helper Component**
   - 9-section guided flow
   - No section headers (just prompts + info icons + text fields)
   - "Co-authoring a paragraph" UX (simple, conversational)
   - Prose output format (following PR #120 pattern)
   - HTML paragraph structure for editor compatibility

2. **9 Sections with Research-Backed Prompts**

   **Section 1: Goals & Purpose**
   - Prompt: "What do you hope to accomplish today?"
   - Example text: `e.g., "Be present with my kids" (value), "Help my team succeed" (mission), "Finish the proposal" (concrete goal)`
   - Info icon → Goals, Values & Purpose popup
   - Additional example (values-anchored): `Top value: craftsmanship. Today I’ll embody it by shipping a clean draft by 10 and doing one quality pass.`

   **Section 2: Action Step**
   - Prompt: "What's something you can do today that will move you one step closer to your goal?"
   - Example text: `e.g., "At 2pm, I'll block 90 minutes and draft the executive summary" or "After breakfast, I'll call Sarah to ask about her templates"`
   - Info icon → Implementation Intentions & Committed Action popup
   - Hint: If you named a value above, write how you'll embody it today with a specific time and place.

   **Section 3: Obstacles & Plan**
   - Prompt: "What obstacle or obstacles might stand in your way? If that happens, then what will you do?"
   - Example text: `e.g., "I might get pulled into meetings. If that happens, then I'll decline non-urgent invites and protect my focus block" or "I might feel anxious and procrastinate. If so, I'll start with just 10 minutes"`
   - Info icon → WOOP (Mental Contrasting & Implementation Intentions) popup
   - Optional self-compassion nudge: `This task is tough; lots of people find it tough; I’ll start with five focused minutes.`

   **Section 4: Emotional Awareness**
   - Prompt: "Are you feeling any persistent emotions? What are they? Do you feel them in any specific parts of your body?"
   - Example text: `e.g., "Anxious—tight chest and shallow breathing" or "Excited—buzzy energy in my arms" or "Frustrated—heat in my face and jaw clenching"`
   - Info icon → Emotional Awareness & Embodiment popup

   **Section 5: Cognitive Reframing**
   - Prompt: "Are you having any irrational thoughts? What are they and can you 'smooth them out' by articulating them more rationally?"
   - Example text: `e.g., "I'll never finish this → I've finished hard things before, and I have a plan" or "Everyone will judge me → Most people are focused on themselves, and one presentation doesn't define me"`
   - Info icon → CBT Cognitive Distortions popup (reuse existing)

   **Section 6: Social Support & Kindness**
   - Prompt: "Who is someone you might help accomplish their goals, or who might help you accomplish yours? Write something kind about them and consider making a reach-out part of your plan for today."
   - Example text: `e.g., "My colleague Jamie—she's great at presentations and always willing to help. I'll ask her to review my slides" or "My friend Alex—he's been stressed. I'll text to check in and offer to help with his move"`
   - Info icon → Social Connection & Loving-Kindness popup

   **Section 7: Alternative Connection**
   - Prompt: "If not them, is there someone else you want to connect with today?"
   - Example text: `e.g., "My partner—just to say hi and connect" or "My mom—I'll call her on my lunch break"`
   - Info icon → Social Connection & Loving-Kindness popup (same as Section 6)

   **Section 8: Challenge Levels**
   - Prompt: "What is an easy challenge for you to accomplish today? What's a challenge that will really push you (but you won't be mad if you fail)?"
   - Example text: `Easy: "Send the budget email" | Stretch: "Record a practice pitch and watch it back (even if it's cringey!)"`
   - Info icon → Growth Mindset & Stretch Goals popup

   **Section 9: Best Possible Day**
   - Prompt: "Describe how you could make today amazing!"
   - Example text: `e.g., "I'll feel proud finishing my presentation, energized by a midday walk, and connected after dinner with my partner" or "I'll help my team solve that bug, laugh with my coworker, and go to bed feeling accomplished"`
   - Info icon → Best Possible Self / Positive Visualization popup

3. **Info Popups (HelperInfo component)**
   - 7 unique info content objects needed:
     1. Goals, Values & Purpose (Section 1)
     2. Implementation Intentions & Committed Action (Section 2)
     3. WOOP: Mental Contrasting & Implementation Intentions (Section 3)
     4. Emotional Awareness & Embodiment (Section 4)
     5. Growth Mindset & Stretch Goals (Section 8)
     6. Social Connection & Loving-Kindness (Sections 6-7, shared)
     7. Best Possible Self / Positive Visualization (Section 9)
   - Reuse existing popup:
     - CBT Cognitive Distortions (Section 5)

4. **Prose Output Format**
   - Follow PR #120 pattern: natural flowing paragraphs
   - No bold labels or section headers in output
   - Natural connectors between sections
   - Lowercase first character of user input for prose flow
   - **Recommended formatting:** Two paragraphs for better pacing
     - Paragraph 1: Sections 1-5 (goals, action, obstacles, emotions, thoughts)
     - Paragraph 2: Sections 6-9 (social support, challenges, best day)
     - Break provides visual breathing room and logical separation
   - Example output (two-paragraph format):
     ```html
     <p>Today I hope to accomplish being present with my kids and finishing the proposal. At 2pm, I'll block 90 minutes and draft the executive summary. I might get pulled into meetings. If that happens, then I'll decline non-urgent invites and protect my focus block. I'm feeling anxious with a tight chest and shallow breathing. I notice the thought that I'll never finish this, but more rationally, I've finished hard things before, and I have a plan.</p>
     <p><br></p>
     <p>My colleague Jamie is great at presentations and always willing to help. I'll ask her to review my slides. I also want to connect with my partner just to say hi. An easy challenge for today is sending the budget email, and a stretch goal is recording a practice pitch and watching it back (even if it's cringey!). To make today amazing, I'll feel proud finishing my presentation, energized by a midday walk, and connected after dinner with my partner.</p>
     <p><br></p>
     ```

5. **Helper Metadata**
   - Type: `'morning'` (add to HelperType union)
   - Tile data in `/src/constants/helperTitles.ts`:
     ```typescript
     'morning': {
       shortTitle: 'Morning',
       description: 'Complete your daily practice with evidence-based reflection',
       fullTitle: 'Morning',
       icon: '☀️',
     }
     ```
   - **Position: First helper tile** (top left in HelperTileGrid array)

6. **Component Structure**
   - File: `/src/components/journal/helpers/MorningHelper.tsx`
   - Export both:
     - `MorningContent` - content only (for dialog/sheet use)
     - `MorningHelper` - with HelperContainer wrapper (backward compatibility)
   - State management for 9 text fields
   - Usage tracking integration (`createHelperUsage`)
   - Accessibility compliance (WCAG AA)

7. **Usage Tracking Metadata**
   - Track field completion count (0-9)
   - Track character counts per field
   - Track implementation intention format detection (Section 2) - time-based cues via regex
   - Track if-then format detection (Section 3) - if/then pattern via regex
   - Store events array (helper_selection, helper_inserted, helper_cleared)

### Out of Scope
- Progressive disclosure / wizard UI (ship with all 9 sections visible)
- Section collapsing / optional fields (all fields always visible, but only Section 1 required)
- Auto-save drafts (single-session use only)
- AI suggestions or auto-completion
- Time tracking or reminders
- Integration with calendar or task systems
- Changing existing helpers to prose format (handled in PR #120/#103)

---

## Research Foundation

### Effect Sizes by Section

| Section | Intervention | Effect Size | Source |
|---------|--------------|-------------|--------|
| 2. Action Step | Implementation Intentions | **d=0.65** ⭐ | Gollwitzer & Sheeran (2006) |
| 1. Goals & Purpose | Purpose in Life | d=0.20-0.40 | Kim et al. (2022) |
| 3. Obstacles & Plan | Mental Contrasting (WOOP) | Outperforms positive thinking | Oettingen (2014) |
| 4. Emotional Awareness | Affect Labeling | Improves regulation | Barrett et al. (2001) |
| 5. Cognitive Reframing | CBT | d=0.80-1.00 | Hofmann et al. (2012) |
| 6-7. Social Support | Social Connection | r=0.30-0.50 with well-being | Holt-Lunstad et al. (2010) |
| 8. Challenge Levels | Growth Mindset | d=0.05-0.10 (context-dependent) | Yeager et al. (2019) |
| 9. Best Possible Day | Best Possible Self | Strong for optimism | King (2001) |

**Strongest intervention:** Implementation Intentions (Section 2) with d=0.65 (medium-large effect)

### Key Research Principles Applied

1. **Approach framing** (do X) over avoidance (don't do Y) - increases intrinsic motivation
2. **Specificity & concreteness** (names, times, locations) - boosts effectiveness
3. **Implementation intention format** (when/where/if-then) - 65% improvement in goal attainment
4. **Emotional granularity** (specific feeling words + body locations) - improves regulation
5. **Balanced realism** (not toxic positivity, not catastrophizing) - sustainable
6. **Prosocial orientation** (helping + being helped) - increases positive emotions
7. **Self-compassion tone** (growth mindset, not harsh) - reduces shame, increases persistence

---

## Technical Design

### Component Architecture

```typescript
// /src/components/journal/helpers/MorningHelper.tsx

interface MorningHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

interface MorningFields {
  goalsPurpose: string
  actionStep: string
  obstaclesPlan: string
  emotions: string
  thoughts: string
  socialSupport: string
  alternativeConnection: string
  challenges: string
  bestPossibleDay: string
}

export function MorningContent({ entryId, userId, onInsert }: MorningHelperProps) {
  const [fields, setFields] = useState<MorningFields>({
    goalsPurpose: '',
    actionStep: '',
    obstaclesPlan: '',
    emotions: '',
    thoughts: '',
    socialSupport: '',
    alternativeConnection: '',
    challenges: '',
    bestPossibleDay: ''
  })

  // Utility to lowercase first character for natural prose flow
  const lowercaseFirst = (text: string): string => {
    if (!text) return text
    return text.charAt(0).toLowerCase() + text.slice(1)
  }

  // Utility to normalize sentences (prevent double punctuation)
  const normalizeSentence = (text: string): string => {
    const trimmed = text.trim()
    // Remove trailing period/punctuation before composition
    return trimmed.replace(/[.!?]+$/, '')
  }

  // Format as prose following PR #120 pattern (two-paragraph structure)
  const formatMorningPractice = (): string => {
    const parts: string[] = []

    // Paragraph 1: Goals, action, obstacles, emotions, thoughts (Sections 1-5)
    const paragraph1: string[] = []

    if (fields.goalsPurpose.trim()) {
      paragraph1.push(`Today I hope to accomplish ${lowercaseFirst(normalizeSentence(escapeHtml(fields.goalsPurpose)))}`)
    }

    if (fields.actionStep.trim()) {
      paragraph1.push(normalizeSentence(escapeHtml(fields.actionStep))) // Often has timing/location
    }

    if (fields.obstaclesPlan.trim()) {
      paragraph1.push(normalizeSentence(escapeHtml(fields.obstaclesPlan)))
    }

    if (fields.emotions.trim()) {
      paragraph1.push(`I'm feeling ${lowercaseFirst(normalizeSentence(escapeHtml(fields.emotions)))}`)
    }

    if (fields.thoughts.trim()) {
      paragraph1.push(normalizeSentence(escapeHtml(fields.thoughts)))
    }

    // Add paragraph 1 if any content
    if (paragraph1.length > 0) {
      parts.push(`<p>${paragraph1.join('. ')}.</p>`)
      parts.push('<p><br></p>')
    }

    // Paragraph 2: Social support, challenges, best day (Sections 6-9)
    const paragraph2: string[] = []

    if (fields.socialSupport.trim()) {
      paragraph2.push(normalizeSentence(escapeHtml(fields.socialSupport)))
    }

    if (fields.alternativeConnection.trim()) {
      paragraph2.push(normalizeSentence(escapeHtml(fields.alternativeConnection)))
    }

    if (fields.challenges.trim()) {
      paragraph2.push(normalizeSentence(escapeHtml(fields.challenges)))
    }

    if (fields.bestPossibleDay.trim()) {
      paragraph2.push(`To make today amazing, ${lowercaseFirst(normalizeSentence(escapeHtml(fields.bestPossibleDay)))}`)
    }

    // Add paragraph 2 if any content
    if (paragraph2.length > 0) {
      parts.push(`<p>${paragraph2.join('. ')}.</p>`)
      parts.push('<p><br></p>')
    }

    return parts.join('')
  }

  // Telemetry detection heuristics
  const hasImplementationIntention = (): boolean => {
    const text = fields.actionStep.toLowerCase()
    // Detect time references: "2pm", "at 3:00", "after breakfast", "by noon"
    return /\b(\d{1,2}(:\d{2})?\s?(am|pm))\b|\b(at|before|after|by)\s+\b/.test(text)
  }

  const hasIfThenFormat = (): boolean => {
    const text = fields.obstaclesPlan.toLowerCase()
    return /\bif\b.*\bthen\b/i.test(text)
  }

  // Submit only requires Section 1 (goalsPurpose)
  const canSubmit = (): boolean => {
    return fields.goalsPurpose.trim() !== ''
  }

  // Render with data-testid attributes for Playwright stability
  return (
    <>
      <Textarea
        id="morning-goalsPurpose"
        data-testid="morning-field-goalsPurpose"
        value={fields.goalsPurpose}
        onChange={(e) => updateField('goalsPurpose', e.target.value)}
        // ... rest of props
      />
      {/* Repeat pattern for all 9 fields:
          morning-field-actionStep
          morning-field-obstaclesPlan
          morning-field-emotions
          morning-field-thoughts
          morning-field-socialSupport
          morning-field-alternativeConnection
          morning-field-challenges
          morning-field-bestPossibleDay
      */}

      <Button
        onClick={handleInsert}
        data-testid="morning-insert-button"
        disabled={!canSubmit()}
      >
        Add to Journal Entry
      </Button>

      <Button
        onClick={handleClear}
        data-testid="morning-clear-button"
      >
        Clear All
      </Button>
    </>
  )
}

// Tile-level info content (top-level helper summary)
const morningTileLevelInfo: HelperInfoContent = {
  title: 'Morning Practice',
  description: 'A comprehensive evidence-based daily practice combining values, goals, emotional awareness, social connection, and positive visualization. Integrates the most effective interventions from psychology research into one streamlined flow.',
  effectSize: 'd=0.65 for implementation intentions (strongest component)',
  citation: 'Integrates research from Gollwitzer (2006), Oettingen (2014), Kim et al. (2022), and others.',
  learnMoreUrl: 'https://github.com/levineam/Signum/issues/100'
}

export function MorningHelper({ entryId, userId, onInsert }: MorningHelperProps) {
  // Wrapper with HelperContainer for backward compatibility
  return (
    <HelperContainer
      helperType="morning"
      headerText="Start your day with intention"
      descriptionText="Complete your daily practice with evidence-based reflection"
      variant="purple" // Using existing variant (gold/amber not supported in HelperContainer)
      infoContent={morningTileLevelInfo} // Tile-level summary (separate from section info)
      // ... rest of props
    >
      <MorningContent entryId={entryId} userId={userId} onInsert={onInsert} />
    </HelperContainer>
  )
}
```

### Info Popup Content Objects

#### 1. Goals, Values & Purpose
```typescript
{
  title: "Goals, Values & Purpose",
  description: "Connecting daily goals to personal values and larger purpose creates psychological flexibility and increases goal achievement. This integrates ACT values work with purpose-in-life interventions.",
  effectSize: "Purpose: d=0.20-0.40 for well-being; Values: foundational to ACT effectiveness",
  citation: "Kim, E. S., et al. (2022). Sense of purpose in life and subsequent physical, behavioral, and psychosocial health. American Journal of Health Promotion, 36(1), 137-147.",
  learnMoreUrl: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6923189/"
}
```

#### 2. Implementation Intentions & Committed Action
```typescript
{
  title: "Implementation Intentions & Committed Action",
  description: "Specifying when, where, and how you'll take action dramatically increases follow-through. Implementation intentions ('If X, then I will Y') create automatic goal-directed responses.",
  effectSize: "d=0.65 for goal attainment (medium-to-large effect)",
  citation: "Gollwitzer, P. M., & Sheeran, P. (2006). Implementation intentions and goal achievement: A meta-analysis of effects and processes. Advances in Experimental Social Psychology, 38, 69-119.",
  learnMoreUrl: "https://www.researchgate.net/publication/37367696_Implementation_Intentions_and_Goal_Achievement_A_Meta-Analysis_of_Effects_and_Processes"
}
```

#### 3. WOOP: Mental Contrasting & Implementation Intentions
```typescript
{
  title: "WOOP: Mental Contrasting & Implementation Intentions",
  description: "Mental contrasting combines positive visualization with obstacle planning. This evidence-based method increases goal achievement by creating realistic if-then plans that trigger action when obstacles arise.",
  effectSize: "Significantly outperforms positive thinking alone",
  citation: "Oettingen, G. (2014). Rethinking Positive Thinking: Inside the New Science of Motivation. Current Directions in Psychological Science.",
  learnMoreUrl: "https://woopmylife.org/"
}
```

#### 4. Emotional Awareness & Embodiment
```typescript
{
  title: "Emotional Awareness & Embodiment",
  description: "Identifying emotions in the body enhances emotional regulation and reduces stress. This practice comes from mindfulness-based stress reduction (MBSR) and somatic psychology.",
  effectSize: "d=0.50-0.70 for emotional regulation",
  citation: "Kabat-Zinn, J. (2003). Mindfulness-based interventions in context. Clinical Psychology: Science and Practice, 10(2), 144-156.",
  learnMoreUrl: "https://www.mindful.org/body-scan-meditation/"
}
```

#### 5. Growth Mindset & Stretch Goals
```typescript
{
  title: "Growth Mindset & Stretch Goals",
  description: "Balancing easy wins with challenging stretch goals builds confidence while promoting growth. Easy challenges provide motivation and success experiences, while stretch goals encourage learning and development without fear of failure.",
  effectSize: "d=0.05-0.10 for achievement; larger effects in supportive contexts",
  citation: "Yeager, D. S., et al. (2019). A national experiment reveals where a growth mindset improves achievement. Nature, 573, 364-369.",
  learnMoreUrl: "https://www.nature.com/articles/s41586-019-1466-y"
}
```

#### 6. Social Connection & Loving-Kindness
```typescript
{
  title: "Social Connection & Loving-Kindness",
  description: "Social support is one of the strongest predictors of well-being and resilience. Planning social connections increases follow-through on reaching out. Combining this with loving-kindness (wishing others well) enhances prosocial behavior and positive emotions.",
  effectSize: "r=0.30-0.50 with well-being (social support); d=0.33 for positive emotions (loving-kindness)",
  citation: "Holt-Lunstad, J., et al. (2010). Social relationships and mortality risk. PLoS Medicine, 7(7). Galante, J., et al. (2014). Loving-kindness meditation effects. Journal of Clinical Psychology, 70(9), 794-807.",
  learnMoreUrl: "https://www.apa.org/monitor/2023/06/cover-story-social-support"
}
```

#### 7. Best Possible Self / Positive Visualization
```typescript
{
  title: "Best Possible Self Exercise",
  description: "Visualizing your ideal day or best possible self increases optimism and positive affect. This exercise has been shown to be more powerful than gratitude interventions for enhancing well-being.",
  effectSize: "Particularly strong for optimism enhancement",
  citation: "King, L. A. (2001). The health benefits of writing about life goals. Personality and Social Psychology Bulletin, 27(7), 798-807.",
  learnMoreUrl: "https://positivepsychology.com/best-possible-self/"
}
```

### Visual Theme

**Color variant:** `purple` (reusing existing variant)
- **Rationale:** gold/amber variants don't exist in HelperContainer (only default/blue/green/purple/pink supported)
- **Alternative:** Could extend HelperContainer/HelperInfo to support 'yellow' or 'orange' variants for sunrise theme
- **Decision:** Use purple for MVP, consider adding yellow/orange in future enhancement

---

## GPT-5 Review & Corrections

### Key Issues Identified & Resolved

#### 1. ✅ Theme Variant Mismatch
- **Issue:** Story specified gold/amber, but HelperContainer only supports: default/blue/green/purple/pink
- **Resolution:** Use `purple` variant for MVP
- **Files affected:** HelperContainer.tsx line 47, HelperInfo.tsx line 22

#### 2. ✅ Info Component Clarification
- **Issue:** Story conflated HelperInfo (inline section popovers) with HelperInfoDialog (tile modal)
- **Resolution:**
  - **Tile info icon** → Opens HelperInfoDialog with tile-level summary
  - **Section info icons** (9 inline) → Use HelperInfo component for each section's research popup
  - **File:** HelperDialogContent.tsx must route 'morning' → `<MorningContent />`

#### 3. ✅ Type Integration Points Enumerated
**Files requiring updates:**
- `/src/types/helper.ts`
  - Add `'morning'` to HelperType union (line 17-26)
  - Add to HELPER_TYPES array (line 308-317)
  - Add to HELPER_TYPE_LABELS (line 323-332)
  - Add morning-specific fields to HelperUsageMetadata (line 112-178):
    ```typescript
    // Story 2.10 — Morning Helper
    morningFieldCharCounts?: number[]  // 9 field character counts
    fieldCompletionCount?: number      // Reuse existing (1-9)
    hasImplementationIntention?: boolean  // Section 2 detection
    hasIfThenFormat?: boolean          // Section 3 detection (already exists for WOOP)
    ```

- `/src/constants/helperTitles.ts`
  - Add `'morning'` tile metadata

- `/src/constants/helperInfo.ts`
  - Add `'morning'` tile-level info (top-level helper summary)
  - Example:
    ```typescript
    morning: {
      title: 'Morning Practice',
      description: 'A comprehensive evidence-based daily practice combining values, goals, emotional awareness, social connection, and positive visualization. Integrates the most effective interventions from psychology research into one streamlined flow.',
      effectSize: 'd=0.65 for implementation intentions (strongest component)',
      citation: 'Integrates research from Gollwitzer (2006), Oettingen (2014), Kim et al. (2022), and others.',
      learnMoreUrl: 'https://github.com/levineam/Signum/issues/100'
    }
    ```

- `/src/components/journal/helpers/HelperTileGrid.tsx`
  - Add `'morning'` to theme gradient map (around line 26)
  - Use purple gradient (matching variant in HelperContainer):
    ```typescript
    const getGradientClasses = (helperType: HelperType): string => {
      const gradients: Record<HelperType, string> = {
        'morning': 'from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30',
        'cbt-distortions': 'from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30',
        // ... rest
      }
      return gradients[helperType] || 'from-gray-100 to-slate-100 dark:from-gray-900/30 dark:to-slate-900/30'
    }
    ```

- `/src/components/journal/helpers/HelperDialogContent.tsx`
  - Add `case 'morning': return <MorningContent ... />`

- `/src/components/journal/JournalStream.tsx` (line 960)
  - Update helperTypes array to list 'morning' FIRST:
    ```typescript
    helperTypes={[
      'morning',  // NEW - first position
      'cbt-distortions',
      'gratitude',
      // ... rest
    ]}
    ```

#### 4. ✅ Prose Punctuation Safety
- **Issue:** `sentences.join('. ') + '.'` creates double periods if input ends in punctuation
- **Resolution:** Add normalizeSentence utility:
  ```typescript
  const normalizeSentence = (text: string): string => {
    const trimmed = text.trim()
    // Remove trailing period/punctuation before composition
    return trimmed.replace(/[.!?]+$/, '')
  }

  // Usage in formatMorningPractice:
  const sentences: string[] = []
  if (fields.goalsPurpose.trim()) {
    sentences.push(normalizeSentence(fields.goalsPurpose))
  }
  // ... collect all sentences

  // Join and add single period at end
  return `<p>${sentences.join('. ')}.</p><p><br></p>`
  ```

#### 5. ✅ A11Y: Labels vs. Section Headers
- **Issue:** Story says "no section headers" but needs accessible labels for textareas
- **Resolution:**
  - Visual: Prompt text serves as visible label (no h2/h3 section headers)
  - Accessible: Use `<label htmlFor="field-id">` for each textarea
  - Pattern: `<label className="block text-sm font-medium mb-2">Prompt text</label>`
  - Keep sr-only pattern available if needed for edge cases

#### 6. ✅ Telemetry Detection Heuristics
**Time-based cues (Section 2):**
```typescript
const hasImplementationIntention = (): boolean => {
  const text = fields.actionStep.toLowerCase()
  // Detect time references: "2pm", "at 3:00", "after breakfast", "by noon"
  return /\b(\d{1,2}(:\d{2})?\s?(am|pm))\b|\b(at|before|after|by)\s+\b/.test(text)
}
```

**If-then format (Section 3):**
```typescript
const hasIfThenFormat = (): boolean => {
  const text = fields.obstaclesPlan.toLowerCase()
  return /\bif\b.*\bthen\b/i.test(text)
}
```

#### 7. ✅ Research Citation Refinement
- **Section 4 (Emotional Awareness):** Consider adding Lieberman et al. (2007) for affect labeling
  - Current: Kabat-Zinn (2003) for MBSR context ✓
  - Enhancement: "Lieberman, M. D., et al. (2007). Putting feelings into words: Affect labeling disrupts amygdala activity in response to affective stimuli. Psychological Science, 18(5), 421-428."
  - **Decision:** Keep Kabat-Zinn for MVP (more accessible), add Lieberman as optional enhancement

#### 8. ✅ Testability
- Add data-testid attributes to all fields:
  - `morning-field-goalsPurpose`
  - `morning-field-actionStep`
  - `morning-field-obstaclesPlan`
  - `morning-field-emotions`
  - `morning-field-thoughts`
  - `morning-field-socialSupport`
  - `morning-field-alternativeConnection`
  - `morning-field-challenges`
  - `morning-field-bestPossibleDay`
  - `morning-insert-button`
  - `morning-clear-button`

- Add Playwright E2E test mirroring `tests/cbt-distortions-helper.spec.ts`

### Open Questions (Answered)

**Q: Should Morning also expose a single tile info summary distinct from section-level popovers?**
- **A: YES** - Add to `/src/constants/helperInfo.ts` as shown above

**Q: Theme - prefer adding yellow/orange or reuse existing?**
- **A: Reuse `purple`** for MVP - sunrise theme can be added later if desired

**Q: Regex heuristics acceptable for telemetry?**
- **A: YES** - Simple pattern matching is fine for telemetry (not user-facing validation)
- **A: Privacy-safe** - heuristics detect patterns, don't expose content

---

## Acceptance Criteria

### Functional Requirements
- [ ] MorningHelper component created in `/src/components/journal/helpers/MorningHelper.tsx`
- [ ] 9 sections with prompts + example text + info icons
- [ ] All info icons open correct popup (7 new + 1 reused)
- [ ] Section 1 (goalsPurpose) is required, all others optional
- [ ] "Add to Journal Entry" button disabled until Section 1 filled
- [ ] "Clear All" button clears all 9 fields
- [ ] Prose output format (no labels, natural connectors)
- [ ] Output follows PR #120 pattern (lowercase first character, sentence connectors)
- [ ] HTML paragraph structure maintained (`<p>...</p>`)
- [ ] Values-to-action hint shown across Sections 1–2
- [ ] Optional self-compassion nudge hint visible in Section 3

### Helper System Integration
- [ ] 'morning' added to HelperType union in `/src/types/helper.ts` (line 17-26)
- [ ] 'morning' added to HELPER_TYPES array in `/src/types/helper.ts` (line 308-317)
- [ ] 'morning' added to HELPER_TYPE_LABELS in `/src/types/helper.ts` (line 323-332)
- [ ] Helper metadata added to `/src/constants/helperTitles.ts`
- [ ] Tile-level info added to `/src/constants/helperInfo.ts` (HELPER_INFO['morning'])
- [ ] Morning gradient added to `/src/components/journal/helpers/HelperTileGrid.tsx` theme map
- [ ] Morning helper routed in `/src/components/journal/helpers/HelperDialogContent.tsx`
- [ ] Morning helper listed FIRST in JournalStream.tsx helperTypes array (line 960)
- [ ] Helper tile displays with ☀️ icon
- [ ] Helper tile renders with purple gradient background
- [ ] Clicking tile opens dialog with MorningContent
- [ ] Tile info icon triggers HelperInfoDialog (tile-level summary)
- [ ] Section info icons (9 inline) use HelperInfo component (section-level research)

### Usage Tracking
- [ ] Morning-specific fields added to HelperUsageMetadata in `/src/types/helper.ts`:
  - `morningFieldCharCounts?: number[]` (9 field character counts)
  - `fieldCompletionCount?: number` (reuse existing, 1-9)
  - `hasImplementationIntention?: boolean` (Section 2 detection)
  - `hasIfThenFormat?: boolean` (Section 3 detection, already exists)
- [ ] createHelperUsage called with helperType='morning'
- [ ] Metadata captured on insert:
  - events array (helper_selection, helper_inserted, helper_cleared)
  - selectionCount: 0 (no multi-select in this helper)
  - insertedText: full prose output
  - fieldCompletionCount: 1-9
  - morningFieldCharCounts: array of 9 character counts
  - hasImplementationIntention: detected via regex (time references)
  - hasIfThenFormat: detected via regex (if...then pattern)

### Accessibility (WCAG AA)
- [ ] All text fields have accessible `<label htmlFor="field-id">` associations
- [ ] Prompt text serves as visible label (no h2/h3 section headers)
- [ ] Pattern: `<label className="block text-sm font-medium mb-2">`
- [ ] Info icons have aria-label attributes (e.g., "Learn about implementation intentions")
- [ ] Screen reader live region announces state changes
- [ ] Keyboard navigation works (Tab through fields, info icons)
- [ ] Focus management correct (focus field after error)
- [ ] Buttons have clear focus indicators
- [ ] All data-testid attributes added for Playwright stability

### Responsive Design
- [ ] Works on mobile (320px+)
- [ ] Works on tablet (768px+)
- [ ] Works on desktop (1024px+)
- [ ] Text fields expand appropriately in sheet/dialog
- [ ] No horizontal scrolling required
- [ ] Touch targets ≥44px for info icons

### Code Quality
- [ ] TypeScript with no type errors
- [ ] Follows existing helper component patterns
- [ ] Exports both MorningContent and MorningHelper
- [ ] Uses escapeHtml for all user input BEFORE HTML assembly
- [ ] normalizeSentence utility prevents double punctuation
- [ ] Prose output adds `<p><br></p>` spacing (matches existing helpers)
- [ ] Error handling for createHelperUsage (non-blocking)
- [ ] Comments explain research-backed design choices
- [ ] Detection heuristics implemented (hasImplementationIntention, hasIfThenFormat)

### Testing
- [ ] Build passes without errors (`npm run build`)
- [ ] Dev server runs without errors (`npm run dev`)
- [ ] Manual testing completed:
  - Fill all 9 fields
  - Verify prose output in journal
  - Test with only Section 1 filled
  - Test Clear All button
  - Test each info icon
  - Test on mobile/tablet/desktop
- [ ] Playwright E2E test added (optional, follow existing helper test pattern)

---

## Implementation Plan

### Phase 1: Component Structure (2 hours)
1. Create `/src/components/journal/helpers/MorningHelper.tsx`
2. Set up MorningFields interface and state
3. Create 9 text field sections with prompts and example text
4. Add info icon placeholders
5. Implement canSubmit() validation (Section 1 required)

### Phase 2: Info Popups (1.5 hours)
1. Create 6 new info content objects
2. Wire up info icons to HelperInfoDialog
3. Reuse existing CBT and Social Connection popups
4. Test all popup triggers

### Phase 3: Prose Output (2 hours)
1. Implement formatMorningPractice() following PR #120 pattern
2. Add lowercaseFirst() helper function
3. Create natural language connectors for each section
4. Handle optional fields gracefully (skip if empty)
5. Test prose output quality

### Phase 4: Helper System Integration (1 hour)
1. Add 'morning' to HelperType union
2. Add helper metadata to helperTitles.ts
3. Update HelperTileGrid to list 'morning' first
4. Test tile display and dialog opening

### Phase 5: Usage Tracking (1 hour)
1. Implement handleInsert with createHelperUsage call
2. Add metadata collection (char counts, pattern detection)
3. Test usage logging (check Supabase)

### Phase 6: Polish & Testing (1.5 hours)
1. Add Clear All functionality
2. Implement screen reader announcements
3. Test accessibility (keyboard nav, focus management)
4. Test responsive design
5. Manual testing on all devices
6. Fix any bugs

**Total Estimated Time:** 9 hours (1-1.5 days)

---

## Testing Strategy

### Manual Testing Checklist

#### Basic Functionality
- [ ] Open journal page
- [ ] Click Morning helper tile (first tile, top left)
- [ ] Verify dialog opens with 9 sections
- [ ] Fill Section 1 only → "Add to Journal Entry" enabled
- [ ] Click "Add to Journal Entry" → verify prose output
- [ ] Verify output has no bold labels or section headers
- [ ] Verify prose flows naturally with connectors

#### All Sections Test
- [ ] Fill all 9 sections with example text
- [ ] Click "Add to Journal Entry"
- [ ] Verify output includes all sections in order
- [ ] Verify lowercase first character in appropriate places
- [ ] Verify natural sentence flow

#### Info Icons Test
- [ ] Click info icon for Section 1 → Goals, Values & Purpose popup
- [ ] Click info icon for Section 2 → Implementation Intentions popup
- [ ] Click info icon for Section 3 → WOOP popup
- [ ] Click info icon for Section 4 → Emotional Awareness popup
- [ ] Click info icon for Section 5 → CBT popup (reused)
- [ ] Click info icon for Section 6 → Social Connection popup
- [ ] Click info icon for Section 7 → Social Connection popup (same as 6)
- [ ] Click info icon for Section 8 → Growth Mindset popup
- [ ] Click info icon for Section 9 → Best Possible Self popup

#### Edge Cases
- [ ] Fill only Section 1, leave others empty → verify clean output
- [ ] Fill only Sections 1, 5, 9 → verify skipped sections don't create gaps
- [ ] Fill all with very long text → verify no overflow issues
- [ ] Clear All → verify all fields reset
- [ ] Fill fields, Clear All, fill again, submit → verify works

#### Accessibility
- [ ] Tab through all fields → verify focus order
- [ ] Tab to info icons → verify focus visible
- [ ] Press Enter on info icon → verify popup opens
- [ ] Screen reader announces field labels
- [ ] Screen reader announces "Add to Journal Entry" success

#### Responsive
- [ ] Test on mobile (iPhone simulator or real device)
- [ ] Test on tablet (iPad simulator or real device)
- [ ] Test on desktop at various widths (1024px, 1440px, 1920px)
- [ ] Verify no horizontal scrolling
- [ ] Verify touch targets ≥44px on mobile

---

## Dependencies

### Existing Code
- HelperContainer component (Story 2.5.6)
- HelperInfoDialog component (Story 2.9)
- HelperInfo component (Story 2.9)
- createHelperUsage function (Story 1.8.1)
- escapeHtml utility function
- Textarea component (shadcn/ui)
- Button component (shadcn/ui)

### New Code
- MorningHelper.tsx (new file)
- 6 new info content objects
- 'morning' HelperType addition
- Helper metadata in helperTitles.ts
- HelperTileGrid array update

---

## Success Metrics

### User Engagement
- Morning helper used by 30%+ of daily active users
- Average session time 5-8 minutes (indicates thoughtful completion)
- 70%+ complete at least 5 of 9 sections
- 40%+ complete all 9 sections

### Quality Indicators
- Users return to Morning helper 3+ times per week
- Journal entries with Morning helper output are 2x longer than average
- Morning helper output is rarely deleted/edited after insertion
- Users who use Morning helper have higher journal entry consistency

### Research Validation
- Section 2 (Implementation Intentions) shows 60%+ time-based cues
- Section 3 (Obstacles) shows 70%+ if-then format usage
- Section 4 (Emotions) shows 50%+ body location specificity
- Section 5 (Thoughts) shows 60%+ reframing attempts

---

## Related Issues & PRs

- Issue #100: Feature: Daily Practice Uber-Helper (First Helper Tile)
- Issue #103: Refactor: Convert All Helpers to Prose Output Format
- PR #120: refactor: Convert all helpers to prose output format (#103)
- Story 2.8: Convert Helpers to Compact Tile-Based UI
- Story 2.9: Helper Popup UX Enhancement
- Story 2.5.8: WOOP Goal-Setting Helper
- Story 2.5.6: Values Affirmation Helper

---

## Notes

### Design Rationale: 9 Sections vs. More Granular

We consolidated WOOP's 4 steps (Wish, Outcome, Obstacle, Plan) into 3 sections:
1. Goals & Purpose (combines Wish + values/mission)
2. Action Step (implementation intention)
3. Obstacles & Plan (combines Obstacle + Plan)

This reduces from 11 potential sections to 9, making it faster while maintaining all evidence-based components.

### Design Rationale: Section 1 Only Required

Making only Section 1 (Goals & Purpose) required allows:
- Quick daily use (minimum 1 field)
- Flexibility for different days' needs
- Reduced pressure (not overwhelming)
- Users naturally expand usage over time

Research shows implementation intentions (Section 2) have the highest effect size (d=0.65), but requiring it might reduce adoption. Better to encourage through example text and positioning.

### Design Rationale: Prose Output

PR #120 established prose format for all helpers. Benefits:
- Reads like natural journaling, not form submission
- Reduces cognitive load on review
- Eliminates visual clutter from bold labels
- Creates narrative flow across days
- Aligns with "co-authoring a paragraph" UX goal

### Future Enhancements (Not in Scope)
- Time-of-day variations (Morning vs Evening helper)
- Optional section collapsing/expansion
- AI suggestions based on past entries
- Weekly summary of Morning practices
- Integration with Ontology extraction
- Reminders/notifications for daily practice
- Template customization (reorder sections)
