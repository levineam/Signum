# Story 2.5.8: WOOP Goal-Setting Helper

**Status:** 📋 READY FOR DEVELOPMENT
**Created:** 2025-10-26
**Updated:** 2025-10-26
**Issue:** #66
**Parent Epic:** Phase 2: Self-Regulation & Clinical Tools
**Prerequisites:**
- Story 2.5.6 (Values Affirmation Helper) ✅ Complete - Establishes values foundation
- Story 2.5.7 (Self-Compassion Helper) ✅ Complete
- shadcn/ui Card component (already available)

---

## Story

As a user,
I want a WOOP goal-setting helper that guides me through Gabriele Oettingen's evidence-based planning framework,
so that I can set realistic goals and prepare for obstacles using mental contrasting.

---

## Why This Matters

**Current State:**
- Users have values affirmation helper (identifies what matters)
- No helper for translating values into actionable goals
- Users set vague goals without obstacle planning
- Missing bridge between values and behavior change

**Problems:**
- Positive visualization alone doesn't improve goal achievement
- Users don't anticipate obstacles, leading to failure
- Lack of implementation intentions reduces follow-through
- Goals disconnected from deeper values

**Benefits:**
- **Strong evidence**: Outperforms positive thinking alone (Oettingen, 2014)
- **Values alignment**: Pairs with Story 2.5.6 (Values Affirmation)
- **Behavior change**: Creates if-then plans that trigger action
- **Realistic optimism**: Balances hope with obstacle preparation
- **Simple structure**: 4 steps (Wish, Outcome, Obstacle, Plan)

---

## Scope

### In Scope
1. **WOOP Helper Component**
   - 4-step guided process (Wish, Outcome, Obstacle, Plan)
   - 4 text areas with clear prompts
   - Based on Gabriele Oettingen's WOOP method
   - Follows Card pattern (progressive disclosure with Explore button)

2. **Four-Step Structure**
   - **Wish**: What do you want to accomplish? (specific, achievable)
   - **Outcome**: What's the best result if you achieve it? (visualize benefit)
   - **Obstacle**: What internal obstacle might prevent this? (be honest)
   - **Plan**: If [obstacle], then I will [action] (if-then implementation intention)

3. **Insert Behavior**
   - "Add to Journal Entry" button
   - Formats as HTML paragraphs with all 4 WOOP steps
   - Prepends to TOP of journal entry (matches `JournalStream.tsx:424-425`)
   - Helper collapses after insert

4. **Integration**
   - Render in JournalStream for today's entry
   - Helper usage tracking (Supabase)
   - Mobile-responsive layout
   - Accessibility (WCAG AA)

### Out of Scope
- Progress tracking on goals over time
- Reminders or notifications for if-then plans
- AI-generated obstacle suggestions
- Goal library or templates
- Social accountability features

---

## Deliverables

### 1. Create WoopHelper Component
**File:** `/src/components/journal/helpers/WoopHelper.tsx`

**Implementation:**
```tsx
'use client'

/**
 * WOOP Goal-Setting Helper Component
 * Story 2.5.8: Evidence-based goal planning
 *
 * Based on Gabriele Oettingen's WOOP method (Mental Contrasting):
 * https://woopmylife.org/
 */

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'

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
  const [isExpanded, setIsExpanded] = useState(false)
  const [steps, setSteps] = useState<WoopSteps>({
    wish: '',
    outcome: '',
    obstacle: '',
    plan: ''
  })
  const exploreButtonRef = useRef<HTMLButtonElement>(null)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')
  const eventsRef = useRef<HelperEvent[]>([])

  // ... implementation details (follow CbtDistortions.tsx pattern)
}
```

**Acceptance:**
- ✅ Component renders with Card (blue/sky gradient: `bg-gradient-to-r from-blue-50 to-sky-50`)
- ✅ Progressive disclosure with Explore/Collapse button (follows CbtDistortions pattern)
- ✅ 4 text areas for WOOP steps (Wish, Outcome, Obstacle, Plan)
- ✅ **Button Enablement Rule**: "Add to Journal Entry" button is disabled UNLESS:
  - Wish field has content (Outcome, Obstacle, and Plan are optional)
- ✅ Form state management for 4 text inputs

---

### 2. Implement Formatted HTML Insert
**File:** `/src/components/journal/helpers/WoopHelper.tsx`

**HTML Paragraph Format** (matching system behavior in `src/data/cbtDistortions.ts:98`):
```html
<p><strong>WOOP Goal Plan</strong></p>
<p><br></p>
<p><strong>Wish:</strong> [User's wish]</p>
<p><br></p>
<p><strong>Outcome:</strong> [User's best outcome]</p>
<p><br></p>
<p><strong>Obstacle:</strong> [User's internal obstacle]</p>
<p><br></p>
<p><strong>Plan:</strong> If [obstacle], then I will [action]</p>
<p><br></p>
```

**Acceptance:**
- ✅ formatWoopPlan() generates correct HTML paragraphs (NOT Markdown)
- ✅ Wish field always included in output
- ✅ Outcome, Obstacle, and Plan fields included only if provided
- ✅ If-then plan clearly formatted when present
- ✅ Empty optional fields handled gracefully (omit sections for empty fields)
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
    <WoopHelper
      entryId={entry.id}
      userId={user.id}
      onInsert={(helperText) => handleHelperInsertion(entry.id, helperText)}
    />
  </>
)}
```

**Acceptance:**
- ✅ Helper renders below Self-Compassion helper for today's entry only
- ✅ handleHelperInsertion() receives formatted HTML text
- ✅ **Text prepends to TOP of entry** (matches system behavior at `JournalStream.tsx:424-425`)
- ✅ Entry auto-saves after insertion

---

### 4. Implement Helper Usage Tracking
**File:** `/src/components/journal/helpers/WoopHelper.tsx`

**Track Events:**
- `helper_opened`: When user expands helper
- `helper_inserted`: When user clicks "Add to Journal Entry"

**Metadata:**
- Field completion count (0-4)
- Character counts for each step
- Whether if-then plan format was used

**Acceptance:**
- ✅ Usage logged to `helper_usage` table
- ✅ Metadata includes: field completion count, character counts per step
- ✅ Non-blocking (doesn't prevent insertion if logging fails)
- ✅ RLS policies enforce user isolation

---

### 5. Accessibility & Mobile Responsiveness
**Files:** `/src/components/journal/helpers/WoopHelper.tsx`

**Accessibility:**
- ARIA labels for all text areas
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
- ✅ Screen reader announces all field labels and instructions
- ✅ Mobile viewport (<768px) tested on real device

---

## Technical Implementation Notes

### WOOP Method Details

**W - Wish:**
- Make it specific and achievable within a time frame
- Example: "I want to exercise 3 times this week"
- Avoid vague wishes like "be healthier"

**O - Outcome:**
- Visualize the best possible result
- How will you feel? What will change?
- Example: "I'll feel energized and proud of myself"

**O - Obstacle:**
- INTERNAL obstacle only (thoughts, feelings, behaviors)
- NOT external obstacles (weather, other people)
- Example: "I'll feel too tired after work" or "I'll tell myself I don't have time"

**P - Plan:**
- If-then format: "If [obstacle], then I will [action]"
- Specific action to overcome obstacle
- Example: "If I feel too tired, then I will do just 10 minutes instead of my full workout"

### Why Mental Contrasting Works

- **Positive fantasy alone**: Decreases effort and achievement
- **Mental contrasting**: Increases commitment and goal attainment
- **Implementation intentions**: Triple goal success rates (Gollwitzer research)
- **Realistic optimism**: Acknowledges obstacles while maintaining hope

### Database Migration Required

⚠️ **BLOCKING**: Before implementing this story, the database CHECK constraint must be updated.

> Update 2025-10-26: Covered by consolidated migration across 2.5.5–2.5.8. If you have applied `supabase/migrations/20251026000000_extend_helper_types.sql`, no per‑story SQL is needed. Types are updated once in `src/types/helper.ts` (HelperType, labels, and `HelperUsageMetadata.woopStepCounts`/`hasIfThenFormat`).

**Required Migration** (create new file: `supabase/migrations/YYYYMMDDHHMMSS_add_woop_helper_type.sql`):
```sql
-- Add 'woop' to helper_type CHECK constraint
ALTER TABLE helper_usage
DROP CONSTRAINT valid_helper_type;

ALTER TABLE helper_usage
ADD CONSTRAINT valid_helper_type CHECK (
  helper_type IN ('cbt-distortions', 'gentle-prompt', 'gratitude', 'values-affirmation', 'self-compassion', 'woop')
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
  | 'woop'  // 🆕 Story 2.5.8

// STEP 2: Update labels
export const HELPER_TYPE_LABELS: Record<HelperType, string> = {
  'cbt-distortions': 'CBT Cognitive Distortions',
  'gratitude': 'Three Good Things',
  'values-affirmation': 'Values Affirmation',
  'self-compassion': 'Self-Compassion Break',
  'woop': 'WOOP Goal Planning'  // 🆕
}

// STEP 3: Extend HelperUsageMetadata for WOOP-specific fields
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

  // 🆕 WOOP helper fields (Story 2.5.8)
  woopStepCounts?: {  // Character counts per WOOP step
    wish?: number
    outcome?: number
    obstacle?: number
    plan?: number
  }
  hasIfThenFormat?: boolean  // Whether plan uses "If...then..." structure
}
```

---

## Tasks

### Phase 0: Database Migration (30 min) ⚠️ PREREQUISITE
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_woop_helper_type.sql`
- [ ] Add 'woop' to valid_helper_type CHECK constraint
- [ ] Test migration on local Supabase: `supabase db reset`
- [ ] Verify constraint allows 'woop' value
- [ ] Push migration to dev environment

### Phase 1: Type System Updates (30 min)
- [ ] Add `'woop'` to HelperType union in `/src/types/helper.ts`
- [ ] Add 'WOOP Goal Planning' to HELPER_TYPE_LABELS
- [ ] Extend HelperUsageMetadata interface with WOOP fields:
  - `woopStepCounts?: { wish, outcome, obstacle, plan }`
  - `hasIfThenFormat?: boolean`
- [ ] Verify TypeScript compiles without errors

### Phase 2: Component Setup (1 hour)
- [ ] Create `/src/components/journal/helpers/WoopHelper.tsx`
- [ ] Set up component with Card (blue/sky gradient: `from-blue-50 to-sky-50`)
- [ ] Implement progressive disclosure UI (Explore/Collapse button) following `CbtDistortions.tsx:34-74`
- [ ] Define WoopSteps interface and state structure

### Phase 3: Form UI (2-3 hours)
- [ ] Add descriptive header explaining WOOP method
- [ ] Add Textarea for Wish with prompt: "What do you want to accomplish?" (REQUIRED - mark as such)
- [ ] Add Textarea for Outcome with prompt: "What's the best result if you achieve it?" (optional)
- [ ] Add Textarea for Obstacle with prompt: "What internal obstacle might prevent this?" (optional)
- [ ] Add Textarea for Plan with prompt: "If [obstacle], then I will..." (optional)
- [ ] Add guidance text for each step (explain internal vs external obstacles)
- [ ] Implement "Add to Journal Entry" button (disabled when Wish is empty)

### Phase 4: HTML Formatting (1 hour)
- [ ] Implement formatWoopPlan() function to generate HTML paragraphs
- [ ] Include all 4 WOOP steps with labels
- [ ] Handle empty fields gracefully (require at least wish)
- [ ] Follow existing pattern from `cbtDistortions.ts:formatDistortionReflection()`: `<p>text</p><p><br></p>`
- [ ] Test HTML rendering in SimpleRichEditor

### Phase 5: Integration (1 hour)
- [ ] Add WoopHelper to JournalStream (below Self-Compassion helper)
- [ ] Wire onInsert to handleHelperInsertion with entry ID: `(helperText) => handleHelperInsertion(entry.id, helperText)`
- [ ] **Test insertion prepends to TOP** (system behavior, not cursor insertion)
- [ ] Verify helper collapses after insertion
- [ ] Test entry auto-save after insertion

### Phase 6: Usage Tracking (1 hour)
- [ ] Track helper_opened event
- [ ] Track helper_inserted event with metadata
- [ ] Calculate field completion count (0-4)
- [ ] Log character counts for each WOOP step
- [ ] Detect if-then format in plan field: case-insensitive regex `/if\s+.+\s+then/i`
- [ ] Test non-blocking behavior (insertion works if logging fails)

### Phase 7: Accessibility & Testing (2 hours)
- [ ] Add ARIA labels to all text areas
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
- ✅ WoopHelper component renders in today's journal entry
- ✅ 4 text areas for WOOP steps (Wish required, others optional)
- ✅ **Button Enablement Rule**: "Add to Journal Entry" button is disabled UNLESS:
  - Wish field has content (other fields are optional)
- ✅ "Add to Journal Entry" button inserts formatted HTML paragraphs (NOT Markdown)
- ✅ HTML format matches system pattern (`<p>text</p><p><br></p>` from `cbtDistortions.ts`)
- ✅ Wish always included in output; other steps included only if provided
- ✅ **Content prepends to TOP of entry** (matches `JournalStream.tsx:424-425`)
- ✅ Helper collapses after successful insertion
- ✅ Journal entry auto-saves after insertion

### Data Requirements
- ✅ Helper usage tracked in `helper_usage` table
- ✅ Metadata includes: field completion count, character counts per step, if-then detection
- ✅ User isolation enforced by RLS policies
- ✅ Non-blocking logging (insertion works if database fails)

### UX Requirements
- ✅ User sees structured 4-step framework (not blank page)
- ✅ Placeholder text and guidance for each step
- ✅ Clear distinction between Wish, Outcome, Obstacle, Plan
- ✅ Satisfaction moment: complete WOOP plan appears after clicking button
- ✅ Mobile-friendly: works on phone/tablet

### Accessibility Requirements
- ✅ WCAG AA contrast ratios
- ✅ Keyboard navigation works (Tab, Enter, Escape)
- ✅ Screen reader announces all fields and state changes
- ✅ Touch targets >= 44x44px on mobile

### Quality Requirements
- ✅ No ESLint errors (`npm run lint`)
- ✅ Successful production build (`npm run build`)
- ✅ No console errors or warnings
- ✅ TypeScript strict mode passes

---

## Testing Checklist

### Manual Testing
- [ ] **Render Test**: Helper appears below Self-Compassion helper for today's entry
- [ ] **Form Interaction**: All 4 text areas accept input and update state
- [ ] **Insert Test**: Click "Add to Journal Entry" → HTML paragraphs appear in editor
- [ ] **HTML Rendering**: Journal entry displays formatted WOOP plan in SimpleRichEditor
- [ ] **Prepend Behavior**: Content appears at TOP of entry, not at cursor
- [ ] **Wish Only**: Works with just Wish filled (other steps optional)
- [ ] **Partial Fill**: Gracefully handles any combination of filled fields
- [ ] **If-Then Detection**: Test with plan like "If I feel tired, then I will do 10 minutes" - should detect format
- [ ] **Collapse Test**: Helper collapses after insertion
- [ ] **Empty State**: Button disabled when Wish is empty
- [ ] **Full WOOP**: All 4 steps work when all filled

### Responsive Testing
- [ ] **Desktop (>=1280px)**: Helper fits without horizontal scroll
- [ ] **Tablet (768px-1279px)**: Text areas readable, button accessible
- [ ] **Mobile (<768px)**: Sections stack vertically, no overflow

### Accessibility Testing
- [ ] **Keyboard Navigation**: Tab through all fields, Enter to submit
- [ ] **Screen Reader**: VoiceOver/NVDA announces labels and instructions for each step
- [ ] **Focus Indicators**: Visible on all interactive elements
- [ ] **Touch Targets**: Tap buttons easily on mobile device

### Automated Testing
- [ ] `npm run lint`: No errors
- [ ] `npm run build`: Successful build
- [ ] Browser console: No errors or warnings

---

## Evidence & References

### Scientific Evidence
- **Oettingen (2014)**: "Rethinking Positive Thinking" - Mental contrasting research
- **Implementation intentions**: Triple goal success rates (Gollwitzer & Sheeran, 2006)
- **Positive fantasy paradox**: Positive visualization alone decreases achievement
- **Meta-analysis**: Mental contrasting + implementation intentions most effective

### WOOP Method
**Source**: https://woopmylife.org/

**Key Research Findings**:
- Positive fantasies alone: Relax the mind, decrease blood pressure, reduce effort
- Mental contrasting: Energizes when goal is feasible, lets go when infeasible
- If-then plans: Automatic trigger for action, bypasses willpower depletion
- Combined approach: Most effective for behavior change

**Applications**:
- Health behaviors (exercise, diet, sleep)
- Academic performance
- Career goals
- Relationship improvement
- Habit formation

---

## Definition of Done

### Story-Level DoD
- ✅ All tasks completed and checkboxes marked [x]
- ✅ All acceptance criteria met
- ✅ WoopHelper component created and working
- ✅ Helper integrated into JournalStream
- ✅ HTML paragraph insertion working correctly (prepends to top)
- ✅ Helper usage tracking implemented
- ✅ Responsive testing passed at all breakpoints
- ✅ Accessibility validation passed (WCAG AA)
- ✅ No ESLint errors (`npm run lint`)
- ✅ Production build successful (`npm run build`)
- ✅ No console errors in browser
- ✅ Code follows project coding standards
- ✅ PR created with screenshots
- ✅ Tested on Vercel preview deployment

### File List
- **New Files:**
  - `/src/components/journal/helpers/WoopHelper.tsx` - Main component
- **Modified Files:**
  - `/src/types/helper.ts` - Add 'woop' to HelperType union
  - `/src/components/journal/JournalStream.tsx` - Integrate WoopHelper

---

## Related Documentation

- **Issue**: [#66 - Evidence-Based Journaling Helpers Roadmap](https://github.com/levineam/Signum/issues/66)
- **Parent Epic**: Phase 2: Self-Regulation & Clinical Tools
- **Reference Implementation**: `/src/components/journal/helpers/CbtDistortions.tsx`
- **Helper Types**: `/src/types/helper.ts`
- **WOOP Website**: https://woopmylife.org/
- **Evidence**: Oettingen (2014), Gollwitzer & Sheeran (2006)
- **Pairs with**: Story 2.5.6 (Values Affirmation) - translates values into goals

---

## QA Results

- **Gate:** PASS
- **Review Date:** 2025-10-26
- **Notes:** Card-based helper flow and inline gradient styling are consistent with current implementations. Telemetry requirements (`woopStepCounts`, `hasIfThenFormat`) align with the consolidated helper migration (`20251026000000_extend_helper_types.sql`) and the latest TypeScript updates covering stories 2.5.5–2.5.13, so no additional schema prep is needed.
