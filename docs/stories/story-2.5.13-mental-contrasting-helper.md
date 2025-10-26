# Story 2.5.13: Mental Contrasting Helper

**Status:** 📋 READY FOR DEVELOPMENT
**Created:** 2025-10-26
**Updated:** 2025-10-26
**Issue:** #66
**Parent Epic:** Phase 4: Advanced & Specialized
**Prerequisites:**
- Story 2.5.8 (WOOP Helper) ✅ Complete - Related mental contrasting technique
- Story 2.5.12 (Loving-Kindness Helper) ✅ Complete
- shadcn/ui Card component (already available)

---

## Story

As a user,
I want a standalone Mental Contrasting helper for evaluating goals and decisions,
so that I can assess feasibility and commitment without the full WOOP process.

---

## Why This Matters

**Current State:**
- Users have WOOP helper (full 4-step goal planning)
- No helper for quick feasibility assessment
- Users need simpler tool for decision-making
- Missing streamlined intervention for goal evaluation

**Problems:**
- WOOP is comprehensive but can be too much for small decisions
- Users want to assess goal feasibility before committing to full planning
- Need standalone mental contrasting for decision exploration
- Missing tool for "should I pursue this?" questions

**Benefits:**
- **Same evidence as WOOP**: Mental contrasting is the core mechanism (Oettingen, 2014)
- **Faster**: 2 steps instead of 4 (Wish + Obstacle vs. full WOOP)
- **Decision support**: Helps determine if goal is worth pursuing
- **Complements WOOP**: Quick assessment → Full WOOP for chosen goals
- **Simple structure**: Desired future + internal obstacle

---

## Scope

### In Scope
1. **Mental Contrasting Helper Component**
   - 2 text areas: Desired Future + Internal Obstacle
   - Streamlined version of mental contrasting (no Outcome or Plan)
   - Based on Gabriele Oettingen's research
   - Follows Card pattern (progressive disclosure with Explore button)

2. **Two-Step Structure**
   - **Desired Future**: What would you like to happen? (specific, time-bound)
   - **Internal Obstacle**: What inside you might prevent this? (thoughts, feelings, habits)

3. **Insert Behavior**
   - "Add to Journal Entry" button
   - Formats as HTML paragraphs with both contrasting elements
   - Prepends to TOP of journal entry (matches `JournalStream.tsx:424-425`)
   - Helper collapses after insert

4. **Integration**
   - Render in JournalStream for today's entry
   - Helper usage tracking (Supabase)
   - Mobile-responsive layout
   - Accessibility (WCAG AA)

### Out of Scope
- Full WOOP integration (separate helper)
- Decision scoring or recommendation algorithm
- Progress tracking on contrasted goals
- AI-generated obstacle suggestions
- Automatic conversion to WOOP plan

---

## Deliverables

### 1. Create MentalContrastingHelper Component
**File:** `/src/components/journal/helpers/MentalContrastingHelper.tsx`

**Implementation:**
```tsx
'use client'

/**
 * Mental Contrasting Helper Component
 * Story 2.5.13: Streamlined goal feasibility assessment
 *
 * Based on Gabriele Oettingen's mental contrasting research
 * Simplified version of WOOP for decision-making
 */

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'

interface MentalContrastingHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

interface ContrastingSteps {
  desiredFuture: string
  internalObstacle: string
}

export function MentalContrastingHelper({ entryId, userId, onInsert }: MentalContrastingHelperProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [steps, setSteps] = useState<ContrastingSteps>({
    desiredFuture: '',
    internalObstacle: ''
  })
  const exploreButtonRef = useRef<HTMLButtonElement>(null)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')
  const eventsRef = useRef<HelperEvent[]>([])

  // ... implementation details (follow CbtDistortions.tsx pattern)
}
```

**Acceptance:**
- ✅ Component renders with Card (indigo/violet gradient: `bg-gradient-to-r from-indigo-50 to-violet-50`)
- ✅ Progressive disclosure with Explore/Collapse button (follows CbtDistortions pattern)
- ✅ 2 text areas for mental contrasting steps
- ✅ Clear distinction between Desired Future and Internal Obstacle
- ✅ "Add to Journal Entry" button disabled if both fields empty
- ✅ Form state management for 2 text inputs

---

### 2. Implement Formatted HTML Insert
**File:** `/src/components/journal/helpers/MentalContrastingHelper.tsx`

**HTML Paragraph Format** (matching system behavior in `src/data/cbtDistortions.ts:98`):
```html
<p><strong>Mental Contrasting</strong></p>
<p><br></p>
<p><strong>Desired Future:</strong></p>
<p>[User's desired future]</p>
<p><br></p>
<p><strong>Internal Obstacle:</strong></p>
<p>[User's internal obstacle]</p>
<p><br></p>
```

**Acceptance:**
- ✅ formatMentalContrasting() generates correct HTML paragraphs (NOT Markdown)
- ✅ Both contrasting elements clearly labeled
- ✅ Empty fields handled gracefully (require at least desired future to submit)
- ✅ HTML renders correctly in SimpleRichEditor
- ✅ Format matches existing CBT helper pattern (`<p>text</p><p><br></p>`)

---

### 3. Add Helper to JournalStream
**File:** `/src/components/journal/JournalStream.tsx`

**Integration:**
```tsx
{isTodayEntry && user && (
  <>
    <CbtDistortions {...} />
    <GratitudeHelper {...} />
    <ValuesAffirmationHelper {...} />
    <SelfCompassionHelper {...} />
    <WoopHelper {...} />
    <BestPossibleSelfHelper {...} />
    <SavoringHelper {...} />
    <ProgressiveMuscleRelaxationHelper {...} />
    <LovingKindnessHelper {...} />
    <MentalContrastingHelper
      entryId={entry.id}
      userId={user.id}
      onInsert={(helperText) => handleHelperInsertion(entry.id, helperText)}
    />
  </>
)}
```

**Acceptance:**
- ✅ Helper renders below Loving-Kindness helper for today's entry only
- ✅ handleHelperInsertion() receives formatted HTML text
- ✅ **Text prepends to TOP of entry** (matches system behavior at `JournalStream.tsx:424-425`)
- ✅ Entry auto-saves after insertion

---

### 4. Implement Helper Usage Tracking
**File:** `/src/components/journal/helpers/MentalContrastingHelper.tsx`

**Track Events:**
- `helper_opened`: When user expands helper
- `helper_inserted`: When user clicks "Add to Journal Entry"

**Metadata:**
- Character counts for both fields
- Whether both fields were filled (vs. just desired future)

**Acceptance:**
- ✅ Usage logged to `helper_usage` table
- ✅ Metadata includes: character counts per field, both fields filled
- ✅ Non-blocking (doesn't prevent insertion if logging fails)
- ✅ RLS policies enforce user isolation

---

### 5. Accessibility & Mobile Responsiveness
**Files:** `/src/components/journal/helpers/MentalContrastingHelper.tsx`

**Accessibility:**
- ARIA labels for both text areas
- Live region announcements for state changes
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader tested

**Mobile:**
- Touch-friendly text areas (min height)
- Responsive spacing (stacked on mobile)
- No horizontal scroll
- "Add to Journal Entry" button always visible

**Acceptance:**
- ✅ WCAG AA contrast ratios
- ✅ Keyboard-only navigation works
- ✅ Screen reader announces field labels and instructions
- ✅ Mobile viewport (<768px) tested on real device

---

## Technical Implementation Notes

### Mental Contrasting vs. WOOP

**Mental Contrasting (This Story):**
- 2 steps: Desired Future + Internal Obstacle
- Purpose: Assess feasibility, increase/decrease commitment
- Use case: Decision-making, goal evaluation
- Outcome: Energy increases if feasible, decreases if not (adaptive response)

**WOOP (Story 2.5.8):**
- 4 steps: Wish + Outcome + Obstacle + Plan
- Purpose: Full goal planning with implementation intention
- Use case: Committed goals requiring action plans
- Outcome: Concrete if-then plan for action

**Relationship:**
- Mental Contrasting → "Should I pursue this?"
- WOOP → "How will I pursue this?"
- Mental Contrasting can lead to WOOP for chosen goals

### Research Background

**Oettingen's Findings:**
- **Positive fantasy alone**: Decreases effort (energy sapping)
- **Negative dwelling alone**: Increases anxiety (unproductive)
- **Mental contrasting**: Adaptive energization based on feasibility
  - High feasibility → Energy increases
  - Low feasibility → Energy decreases, lets go gracefully

**Why This Works:**
- Contrasting creates realistic assessment
- Energizes feasible goals
- Helps disengage from infeasible goals
- Reduces cognitive dissonance

### Button Enablement Logic

**Rule**: Disabled until at least desired future is filled
**Rationale**: Can do mental contrasting with just future (obstacle helps but not required)
**User Experience**: Allows exploration even if obstacle not yet identified

### Database Migration Required

⚠️ **BLOCKING**: Before implementing this story, the database CHECK constraint must be updated.

**Required Migration** (create new file: `supabase/migrations/YYYYMMDDHHMMSS_add_mental_contrasting_helper_type.sql`):
```sql
-- Add 'mental-contrasting' to helper_type CHECK constraint
ALTER TABLE helper_usage
DROP CONSTRAINT valid_helper_type;

ALTER TABLE helper_usage
ADD CONSTRAINT valid_helper_type CHECK (
  helper_type IN ('cbt-distortions', 'gentle-prompt', 'gratitude', 'values-affirmation', 'self-compassion', 'woop', 'best-possible-self', 'savoring', 'pmr', 'loving-kindness', 'mental-contrasting')
);
```

### Helper Types Extension
```typescript
// Add to src/types/helper.ts

// STEP 1: Update HelperType union
export type HelperType =
  | 'cbt-distortions'
  | 'gratitude'
  | 'values-affirmation'
  | 'self-compassion'
  | 'woop'
  | 'best-possible-self'
  | 'savoring'
  | 'pmr'
  | 'loving-kindness'
  | 'mental-contrasting'  // 🆕 Story 2.5.13

// STEP 2: Update labels
export const HELPER_TYPE_LABELS: Record<HelperType, string> = {
  'cbt-distortions': 'CBT Cognitive Distortions',
  'gratitude': 'Three Good Things',
  'values-affirmation': 'Values Affirmation',
  'self-compassion': 'Self-Compassion Break',
  'woop': 'WOOP Goal Planning',
  'best-possible-self': 'Best Possible Self',
  'savoring': 'Savoring Practice',
  'pmr': 'Progressive Muscle Relaxation',
  'loving-kindness': 'Loving-Kindness Meditation',
  'mental-contrasting': 'Mental Contrasting'  // 🆕
}

// STEP 3: Extend HelperUsageMetadata for mental-contrasting-specific fields
export interface HelperUsageMetadata {
  events: HelperEvent[]
  selectionCount: number
  insertedText?: string
  distortionNames?: string[]
  promptCategory?: string
  fieldCompletionCount?: number
  characterCounts?: { ... }
  selectedValue?: string
  reflectionCharacterCounts?: { ... }
  situationCharacterCount?: number
  woopStepCounts?: { ... }
  hasIfThenFormat?: boolean
  visionCharacterCount?: number
  visionWordCount?: number
  savoringStrategy?: string
  reflectionCharacterCount?: number
  hasReflection?: boolean
  muscleGroupCount?: number
  muscleGroupNames?: string[]
  completedFullSequence?: boolean
  pmrReflectionLength?: number
  lkmRecipient?: string
  lkmPersonNamed?: boolean
  lkmNameLength?: number

  // 🆕 Mental Contrasting helper fields (Story 2.5.13)
  mcStepCounts?: {
    desiredFuture?: number      // Character count of desired future
    internalObstacle?: number   // Character count of internal obstacle
  }
  mcBothFieldsFilled?: boolean  // Whether both fields were completed
}
```

---

## Tasks

### Phase 0: Database Migration (30 min) ⚠️ PREREQUISITE
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_mental_contrasting_helper_type.sql`
- [ ] Add 'mental-contrasting' to valid_helper_type CHECK constraint
- [ ] Test migration on local Supabase: `supabase db reset`
- [ ] Verify constraint allows 'mental-contrasting' value
- [ ] Push migration to dev environment

### Phase 1: Type System Updates (30 min)
- [ ] Add `'mental-contrasting'` to HelperType union in `/src/types/helper.ts`
- [ ] Add 'Mental Contrasting' to HELPER_TYPE_LABELS
- [ ] Extend HelperUsageMetadata interface with mental contrasting fields:
  - `mcStepCounts?: { desiredFuture, internalObstacle }`
  - `mcBothFieldsFilled?: boolean`
- [ ] Verify TypeScript compiles without errors

### Phase 2: Component Setup (1 hour)
- [ ] Create `/src/components/journal/helpers/MentalContrastingHelper.tsx`
- [ ] Set up component with Card (indigo/violet gradient: `from-indigo-50 to-violet-50`)
- [ ] Implement progressive disclosure UI (Explore/Collapse button) following `CbtDistortions.tsx:34-74`
- [ ] Define ContrastingSteps interface and state structure

### Phase 3: Form UI (1-2 hours)
- [ ] Add descriptive header explaining mental contrasting
- [ ] Add Textarea for Desired Future with prompt: "What would you like to happen?"
- [ ] Add Textarea for Internal Obstacle with prompt: "What inside you might prevent this?"
- [ ] Add guidance text explaining difference from WOOP (simpler, for decision-making)
- [ ] Add note: "After contrasting, notice if you feel energized (pursue) or relieved (let go)"
- [ ] Implement "Add to Journal Entry" button (disabled when desired future empty)

### Phase 4: HTML Formatting (30 min)
- [ ] Implement formatMentalContrasting() function to generate HTML paragraphs
- [ ] Include both contrasting elements with clear labels
- [ ] Handle partial completion (desired future only)
- [ ] Follow existing pattern from `cbtDistortions.ts:formatDistortionReflection()`: `<p>text</p><p><br></p>`
- [ ] Test HTML rendering in SimpleRichEditor

### Phase 5: Integration (1 hour)
- [ ] Add MentalContrastingHelper to JournalStream (below Loving-Kindness helper)
- [ ] Wire onInsert to handleHelperInsertion with entry ID: `(helperText) => handleHelperInsertion(entry.id, helperText)`
- [ ] **Test insertion prepends to TOP** (system behavior, not cursor insertion)
- [ ] Verify helper collapses after insertion
- [ ] Test entry auto-save after insertion

### Phase 6: Usage Tracking (1 hour)
- [ ] Track helper_opened event
- [ ] Track helper_inserted event with metadata
- [ ] Log character counts for both fields
- [ ] Log whether both fields were filled
- [ ] Test non-blocking behavior (insertion works if logging fails)

### Phase 7: Accessibility & Testing (2 hours)
- [ ] Add ARIA labels to both text areas
- [ ] Implement live region for announcements (follow `CbtDistortions.tsx:37-52`)
- [ ] Add Explore button ref and focus management (follow `CbtDistortions.tsx:36, 70-73`)
- [ ] Test keyboard navigation (Tab, Enter, Escape)
- [ ] Test Escape key collapses helper (follow `CbtDistortions.tsx` pattern if implemented)
- [ ] Test screen reader (macOS VoiceOver or NVDA)
- [ ] Test mobile responsiveness (<768px)
- [ ] Test touch targets on mobile device
- [ ] Run ESLint: `npm run lint`
- [ ] Build verification: `npm run build`

---

## Acceptance Criteria

### Functional Requirements
- ✅ MentalContrastingHelper component renders in today's journal entry
- ✅ 2 text areas for contrasting steps (Desired Future, Internal Obstacle)
- ✅ Clear guidance on mental contrasting purpose
- ✅ **Button Enablement Rule**: "Add to Journal Entry" button is disabled UNLESS:
  - Desired Future field has content (obstacle is optional but recommended)
- ✅ "Add to Journal Entry" inserts formatted HTML paragraphs (NOT Markdown)
- ✅ HTML format matches system pattern (`<p>text</p><p><br></p>` from `cbtDistortions.ts`)
- ✅ Both contrasting elements clearly labeled in output
- ✅ **Content prepends to TOP of entry** (matches `JournalStream.tsx:424-425`)
- ✅ Helper collapses after successful insertion
- ✅ Journal entry auto-saves after insertion

### Data Requirements
- ✅ Helper usage tracked in `helper_usage` table
- ✅ Metadata includes: character counts per field, both fields filled
- ✅ User isolation enforced by RLS policies
- ✅ Non-blocking logging (insertion works if database fails)

### UX Requirements
- ✅ Clear distinction between desired future and obstacle
- ✅ Guidance explains mental contrasting vs. WOOP
- ✅ Note about noticing energy response (pursue vs. let go)
- ✅ Satisfaction moment: formatted contrasting appears after clicking button
- ✅ Mobile-friendly: works on phone/tablet

### Accessibility Requirements
- ✅ WCAG AA contrast ratios
- ✅ Keyboard navigation works (Tab, Enter, Escape)
- ✅ Screen reader announces field labels and instructions
- ✅ Touch targets >= 44x44px on mobile

### Quality Requirements
- ✅ No ESLint errors (`npm run lint`)
- ✅ Successful production build (`npm run build`)
- ✅ No console errors or warnings
- ✅ TypeScript strict mode passes

---

## Testing Checklist

### Manual Testing
- [ ] **Render Test**: Helper appears below Loving-Kindness helper for today's entry
- [ ] **Form Interaction**: Both text areas accept input and update state
- [ ] **Insert Test**: Click "Add to Journal Entry" → HTML paragraphs appear in editor
- [ ] **HTML Rendering**: Journal entry displays formatted mental contrasting
- [ ] **Prepend Behavior**: Content appears at TOP of entry, not at cursor
- [ ] **Collapse Test**: Helper collapses after insertion
- [ ] **Disabled State**: Button disabled when desired future empty
- [ ] **Partial Completion**: Works if user fills only desired future (obstacle optional)

### Responsive Testing
- [ ] **Desktop (>=1280px)**: Helper fits without horizontal scroll
- [ ] **Tablet (768px-1279px)**: Text areas readable, button accessible
- [ ] **Mobile (<768px)**: Text areas stack vertically, no overflow

### Accessibility Testing
- [ ] **Keyboard Navigation**: Tab through fields, Enter to submit
- [ ] **Screen Reader**: Announces field labels and instructions
- [ ] **Focus Indicators**: Visible on all interactive elements
- [ ] **Touch Targets**: Tap buttons easily on mobile

### Automated Testing
- [ ] `npm run lint`: No errors
- [ ] `npm run build`: Successful build
- [ ] Browser console: No errors or warnings

---

## Evidence & References

### Scientific Evidence
- **Oettingen (2014)**: "Rethinking Positive Thinking" - Mental contrasting research
- **Same evidence as WOOP**: Mental contrasting is the core mechanism
- **Adaptive energization**: Feasible goals → energy up, infeasible → energy down
- **Clinical applications**: Goal pursuit, decision-making, behavior change

### Mental Contrasting Research
**Source**: Oettingen, G. (2014). *Rethinking positive thinking: Inside the new science of motivation.* Current.

**Key Findings**:
- Positive fantasy alone: Relaxes, decreases effort
- Mental contrasting: Increases commitment to feasible goals
- Mental contrasting: Helps disengage from infeasible goals
- Most effective when obstacle is **internal** (not external barriers)

**When to Use Mental Contrasting vs. WOOP**:
- **Mental Contrasting**: "Should I pursue this?" (assessment)
- **WOOP**: "How will I pursue this?" (implementation)
- **Progression**: Mental Contrasting → WOOP for chosen goals

---

## Definition of Done

### Story-Level DoD
- ✅ All tasks completed and checkboxes marked [x]
- ✅ All acceptance criteria met
- ✅ MentalContrastingHelper component created and working
- ✅ Helper integrated into JournalStream
- ✅ HTML paragraph insertion working (prepends to top)
- ✅ Helper usage tracking implemented
- ✅ Responsive testing passed at all breakpoints
- ✅ Accessibility validation (WCAG AA)
- ✅ No ESLint errors (`npm run lint`)
- ✅ Production build successful (`npm run build`)
- ✅ No console errors in browser
- ✅ Code follows project coding standards
- ✅ PR created with screenshots
- ✅ Tested on Vercel preview deployment

### File List
- **New Files:**
  - `/src/components/journal/helpers/MentalContrastingHelper.tsx` - Main component
- **Modified Files:**
  - `/src/types/helper.ts` - Add 'mental-contrasting' to HelperType union
  - `/src/components/journal/JournalStream.tsx` - Integrate MentalContrastingHelper

---

## Related Documentation

- **Issue**: [#66 - Evidence-Based Journaling Helpers Roadmap](https://github.com/levineam/Signum/issues/66)
- **Parent Epic**: Phase 4: Advanced & Specialized
- **Reference Implementation**: `/src/components/journal/helpers/CbtDistortions.tsx`
- **Related Story**: Story 2.5.8 (WOOP) - Full 4-step goal planning with mental contrasting
- **Helper Types**: `/src/types/helper.ts`
- **Evidence**: Oettingen (2014)
- **Complements**: Story 2.5.8 (WOOP) - mental contrasting → WOOP for chosen goals
