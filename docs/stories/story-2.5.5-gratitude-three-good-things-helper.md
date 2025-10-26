# Story 2.5.5: Gratitude / "Three Good Things" Helper

**Status:** 📋 READY FOR DEVELOPMENT
**Created:** 2025-10-26
**Updated:** 2025-10-26
**Issue:** #66
**Parent Epic:** Phase 1: Foundation & High-Impact Basics
**Prerequisites:**
- Story 2.5.4 (CBT Helper) ✅ Complete
- Helper usage tracking infrastructure
- shadcn/ui Card component (already available)

---

## Story

As a user,
I want a "Three Good Things" gratitude helper that guides me through reflecting on three positive events,
so that I can build a daily gratitude practice with structured prompts and see a complete journal entry appear when I'm done.

---

## Why This Matters

**Current State:**
- Users have CBT helper for cognitive distortions
- No helper for positive psychology interventions
- Gratitude journaling requires blank-page writing

**Problems:**
- Blank page intimidation prevents users from starting gratitude practice
- Lack of structure makes it unclear what to write about
- Users miss therapeutic benefits of systematic gratitude reflection

**Benefits:**
- **Highest user familiarity**: "Gratitude journaling" is widely recognized
- **Strong evidence**: d=0.31 effect size for well-being (Dickens, 2017)
- **Low cognitive load**: Simple structure → high completion rates
- **Clinical applications**: Burnout prevention, depression treatment
- **Immediate satisfaction**: Structured prompts → complete journal entry

---

## Scope

### In Scope
1. **Three Good Things Helper Component**
   - 3 sections, each with title + 3 text areas (9 inputs total)
   - Based on Greater Good in Action research (GGIA)
   - Follows CBT helper's Card pattern (progressive disclosure with Explore button)

2. **Structured Prompts**
   - Title field for each good thing
   - "What happened?" (detailed description)
   - "How did this make you feel?" (emotional reflection)
   - "Why did this happen?" (causal attribution)

3. **Insert Behavior**
   - "Add to Journal Entry" button
   - Formats all 3 good things as HTML paragraphs (`<p>text</p><p><br></p>`)
   - Prepends to TOP of journal entry (matches `JournalStream.tsx:424-425`)
   - Helper collapses after insert

4. **Integration**
   - Render in JournalStream for today's entry
   - Helper usage tracking (Supabase)
   - Mobile-responsive layout
   - Accessibility (WCAG AA)

### Out of Scope
- Multi-day tracking or streaks
- Helper toolbar (deferred to later story)
- AI-generated prompts or suggestions
- Social sharing of gratitude entries
- Gamification or rewards

---

## Deliverables

### 1. Create GratitudeHelper Component
**File:** `/src/components/journal/helpers/GratitudeHelper.tsx`

**Implementation:**
```tsx
'use client'

/**
 * Gratitude / "Three Good Things" Helper Component
 * Story 2.5.5: Evidence-based gratitude journaling
 *
 * Based on Greater Good in Action (GGIA) practice:
 * https://ggia.berkeley.edu/practice/three-good-things
 */

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'

interface GratitudeHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

interface GoodThing {
  title: string
  whatHappened: string
  howIFelt: string
  whyItHappened: string
}

export function GratitudeHelper({ entryId, userId, onInsert }: GratitudeHelperProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [goodThings, setGoodThings] = useState<[GoodThing, GoodThing, GoodThing]>([
    { title: '', whatHappened: '', howIFelt: '', whyItHappened: '' },
    { title: '', whatHappened: '', howIFelt: '', whyItHappened: '' },
    { title: '', whatHappened: '', howIFelt: '', whyItHappened: '' }
  ])
  const exploreButtonRef = useRef<HTMLButtonElement>(null)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')
  const eventsRef = useRef<HelperEvent[]>([])

  // ... implementation details (follow CbtDistortions.tsx pattern)
}
```

**Acceptance:**
- ✅ Component renders with Card (green/emerald gradient: `bg-gradient-to-r from-green-50 to-emerald-50`)
- ✅ Progressive disclosure with Explore/Collapse button (follows CbtDistortions pattern)
- ✅ 3 collapsible sections for good things
- ✅ Each section has 4 fields (title, what, feel, why)
- ✅ Form state management handles 9 text inputs
- ✅ "Add to Journal Entry" button disabled if all fields empty

---

### 2. Implement Formatted HTML Insert
**File:** `/src/components/journal/helpers/GratitudeHelper.tsx`

**HTML Paragraph Format** (matching system behavior in `src/data/cbtDistortions.ts:98`):
```html
<p><strong>Three Good Things</strong></p>
<p><br></p>
<p><strong>[Title from #1]</strong></p>
<p>What happened: [User's response]</p>
<p><br></p>
<p>How I felt: [User's response]</p>
<p><br></p>
<p>Why it happened: [User's response]</p>
<p><br></p>
<p><br></p>
<p><strong>[Title from #2]</strong></p>
<p>What happened: [User's response]</p>
<p><br></p>
<p>How I felt: [User's response]</p>
<p><br></p>
<p>Why it happened: [User's response]</p>
<p><br></p>
<p><br></p>
<p><strong>[Title from #3]</strong></p>
<p>What happened: [User's response]</p>
<p><br></p>
<p>How I felt: [User's response]</p>
<p><br></p>
<p>Why it happened: [User's response]</p>
<p><br></p>
```

**Acceptance:**
- ✅ formatGratitudeEntry() generates correct HTML paragraphs (NOT Markdown)
- ✅ Empty fields handled gracefully (skip or placeholder)
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
    <GratitudeHelper
      entryId={entry.id}
      userId={user.id}
      onInsert={(helperText) => handleHelperInsertion(entry.id, helperText)}
    />
  </>
)}
```

**Acceptance:**
- ✅ Helper renders below CBT helper for today's entry only
- ✅ handleHelperInsertion() receives formatted HTML text
- ✅ **Text prepends to TOP of entry** (matches system behavior at `JournalStream.tsx:424-425`)
- ✅ Entry auto-saves after insertion

---

### 4. Implement Helper Usage Tracking
**File:** `/src/components/journal/helpers/GratitudeHelper.tsx`

**Track Events:**
- `helper_opened`: When user expands helper
- `helper_selection`: Not applicable (no multi-select)
- `helper_inserted`: When user clicks "Add to Journal Entry"
- `helper_cleared`: If "Clear All" button added (optional)

**Acceptance:**
- ✅ Usage logged to `helper_usage` table
- ✅ Metadata includes: field completion count, character counts
- ✅ Non-blocking (doesn't prevent insertion if logging fails)
- ✅ RLS policies enforce user isolation

---

### 5. Accessibility & Mobile Responsiveness
**Files:** `/src/components/journal/helpers/GratitudeHelper.tsx`

**Accessibility:**
- ARIA labels for all form fields
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

### Form State Management
```tsx
// Use array of 3 objects for clean state updates
const [goodThings, setGoodThings] = useState<[GoodThing, GoodThing, GoodThing]>([...])

// Update specific field
const updateGoodThing = (index: number, field: keyof GoodThing, value: string) => {
  const updated = [...goodThings]
  updated[index] = { ...updated[index], [field]: value }
  setGoodThings(updated as [GoodThing, GoodThing, GoodThing])
}
```

### GGIA Guidelines Integration
- **Time recommendation**: 10 minutes/day for at least 1 week
- **Flexibility**: Items can be small ("I got out of bed") or major ("Promotion")
- **No judgment**: Grammar/spelling don't matter
- **Gentle refocus**: If user writes negatively, prompt: "Try to refocus on the good event"

### Database Migration Required

⚠️ **BLOCKING**: Before implementing this story, the database CHECK constraint must be updated.

> Update 2025-10-26: Covered by consolidated migration across 2.5.5–2.5.8. If you have applied `supabase/migrations/20251026000000_extend_helper_types.sql`, no per‑story SQL is needed. Types are updated once in `src/types/helper.ts` (HelperType, labels, and gratitude telemetry fields).

**IMPORTANT - Migration Consolidation**: This story and Stories 2.5.6–2.5.13 each add new helper types to the database. **It is strongly recommended to consolidate all helper type additions into a single migration** to avoid multiple DROP/ADD constraint cycles. Consider creating one migration that adds all new types at once:

```sql
-- Recommended: Single migration for all new helpers (Stories 2.5.5-2.5.13)
ALTER TABLE helper_usage
DROP CONSTRAINT valid_helper_type;

ALTER TABLE helper_usage
ADD CONSTRAINT valid_helper_type CHECK (
  helper_type IN (
    'cbt-distortions',
    'gentle-prompt',
    'gratitude',              -- Story 2.5.5
    'values-affirmation',     -- Story 2.5.6
    'self-compassion',        -- Story 2.5.7
    'woop',                   -- Story 2.5.8
    'best-possible-self',     -- Story 2.5.9
    'savoring',               -- Story 2.5.10
    'pmr',                    -- Story 2.5.11
    'loving-kindness',        -- Story 2.5.12
    'mental-contrasting'      -- Story 2.5.13
  )
);
```

**Alternative: Individual Migration** (if implementing stories one at a time):
```sql
-- Story 2.5.5 only: Add 'gratitude' to helper_type CHECK constraint
ALTER TABLE helper_usage
DROP CONSTRAINT valid_helper_type;

ALTER TABLE helper_usage
ADD CONSTRAINT valid_helper_type CHECK (
  helper_type IN ('cbt-distortions', 'gentle-prompt', 'gratitude')
);
```

### Helper Types Extension
```typescript
// Add to src/types/helper.ts

// STEP 1: Update HelperType union
export type HelperType =
  | 'cbt-distortions'
  | 'gratitude'  // 🆕 Story 2.5.5

// STEP 2: Update labels
export const HELPER_TYPE_LABELS: Record<HelperType, string> = {
  'cbt-distortions': 'CBT Cognitive Distortions',
  'gratitude': 'Three Good Things'  // 🆕
}

// STEP 3: Extend HelperUsageMetadata for gratitude-specific fields
export interface HelperUsageMetadata {
  events: HelperEvent[]
  selectionCount: number
  insertedText?: string
  distortionNames?: string[]     // CBT helper
  promptCategory?: string         // Gentle prompt helper

  // 🆕 Gratitude helper fields (Story 2.5.5)
  fieldCompletionCount?: number   // Number of non-empty fields (0-12)
  characterCounts?: {             // Character counts per field
    goodThing1?: { title: number, what: number, feel: number, why: number }
    goodThing2?: { title: number, what: number, feel: number, why: number }
    goodThing3?: { title: number, what: number, feel: number, why: number }
  }
}
```

**Why This Matters:**
- TypeScript union must match database CHECK constraint
- Without migration, Supabase will reject 'gratitude' helper_type
- HelperUsageMetadata extension prevents unsafe type casts

---

## Tasks

### Phase 0: Database Migration (30 min) ⚠️ PREREQUISITE
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_gratitude_helper_type.sql`
- [ ] Add 'gratitude' to valid_helper_type CHECK constraint
- [ ] Test migration on local Supabase: `supabase db reset`
- [ ] Verify constraint allows 'gratitude' value
- [ ] Push migration to dev environment

### Phase 1: Type System Updates (30 min)
- [ ] Add `'gratitude'` to HelperType union in `/src/types/helper.ts`
- [ ] Add 'Three Good Things' to HELPER_TYPE_LABELS
- [ ] Extend HelperUsageMetadata interface with gratitude fields:
  - `fieldCompletionCount?: number`
  - `characterCounts?: { goodThing1: {...}, goodThing2: {...}, goodThing3: {...} }`
- [ ] Verify TypeScript compiles without errors

### Phase 2: Component Setup (1-2 hours)
- [ ] Create `/src/components/journal/helpers/GratitudeHelper.tsx`
- [ ] Set up component with Card (green/emerald gradient: `from-green-50 to-emerald-50`)
- [ ] Implement progressive disclosure UI (Explore/Collapse button) following `CbtDistortions.tsx:34-74`
- [ ] Define GoodThing interface and state structure
- [ ] Implement updateGoodThing() helper function

### Phase 3: Form UI (2-3 hours)
- [ ] Create 3 collapsible sections (Good Thing #1, #2, #3)
- [ ] Add title Input field for each section
- [ ] Add 3 Textarea fields per section (what, feel, why)
- [ ] Add placeholder text and labels based on GGIA
- [ ] Implement "Add to Journal Entry" button (disabled when empty)
- [ ] Optional: Add "Clear All" button

### Phase 4: HTML Formatting (1 hour)
- [ ] Implement formatGratitudeEntry() function to generate HTML paragraphs
- [ ] Handle empty fields gracefully (skip or use placeholder)
- [ ] Follow existing pattern from `cbtDistortions.ts:formatDistortionReflection()`: `<p>text</p><p><br></p>`
- [ ] Test HTML rendering in SimpleRichEditor

### Phase 5: Integration (1-2 hours)
- [ ] Add GratitudeHelper to JournalStream (below CBT helper)
- [ ] Wire onInsert to handleHelperInsertion with entry ID: `(helperText) => handleHelperInsertion(entry.id, helperText)`
- [ ] **Test insertion prepends to TOP** (system behavior, not cursor insertion)
- [ ] Verify helper collapses after insertion
- [ ] Test entry auto-save after insertion

### Phase 6: Usage Tracking (1 hour)
- [ ] Track helper_opened event
- [ ] Track helper_inserted event with metadata
- [ ] Calculate field completion percentage
- [ ] Log character counts per field
- [ ] Test non-blocking behavior (insertion works if logging fails)

### Phase 7: Accessibility & Testing (2-3 hours)
- [ ] Add ARIA labels to all form fields
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
- ✅ GratitudeHelper component renders in today's journal entry
- ✅ 3 sections with 4 fields each (12 total fields: 3 titles + 9 text areas)
- ✅ "Add to Journal Entry" button inserts formatted HTML paragraphs (NOT Markdown)
- ✅ HTML format matches system pattern (`<p>text</p><p><br></p>` from `cbtDistortions.ts`)
- ✅ **Content prepends to TOP of entry** (matches `JournalStream.tsx:424-425`)
- ✅ Helper collapses after successful insertion
- ✅ Journal entry auto-saves after insertion

### Data Requirements
- ✅ Helper usage tracked in `helper_usage` table
- ✅ Metadata includes: field completion count, character counts
- ✅ User isolation enforced by RLS policies
- ✅ Non-blocking logging (insertion works if database fails)

### UX Requirements
- ✅ User sees structured prompts (not blank page)
- ✅ Placeholder text provides examples (GGIA guidelines)
- ✅ Satisfaction moment: complete journal entry appears after clicking button
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
- [ ] **Render Test**: Helper appears below CBT helper for today's entry
- [ ] **Form Interaction**: All 12 fields accept input and update state
- [ ] **Insert Test**: Click "Add to Journal Entry" → HTML paragraphs appear in editor
- [ ] **HTML Rendering**: Journal entry displays formatted "Three Good Things" in SimpleRichEditor
- [ ] **Prepend Behavior**: Content appears at TOP of entry, not at cursor
- [ ] **Collapse Test**: Helper collapses after insertion
- [ ] **Empty State**: Button disabled when all fields empty
- [ ] **Partial Fill**: Works if user only fills 1-2 good things (graceful degradation)

### Responsive Testing
- [ ] **Desktop (>=1280px)**: Helper fits without horizontal scroll
- [ ] **Tablet (768px-1279px)**: Text areas readable, button accessible
- [ ] **Mobile (<768px)**: Sections stack vertically, no overflow

### Accessibility Testing
- [ ] **Keyboard Navigation**: Tab through all fields, Enter to submit
- [ ] **Screen Reader**: VoiceOver/NVDA announces labels and instructions
- [ ] **Focus Indicators**: Visible on all interactive elements
- [ ] **Touch Targets**: Tap buttons easily on mobile device

### Automated Testing
- [ ] `npm run lint`: No errors
- [ ] `npm run build`: Successful build
- [ ] Browser console: No errors or warnings

---

## Evidence & References

### Scientific Evidence
- **Seligman et al. (2005)**: Positive psychology interventions, 6-month happiness boost
- **Dickens (2017)**: Meta-analysis showing d=0.31 effect size for well-being
- **GGIA Research**: 10 min/day × 1 week minimum for benefits
- **Clinical Use**: Burnout prevention in healthcare workers

### GGIA Practice Guidelines
**Source**: https://ggia.berkeley.edu/practice/three-good-things

**Time Required**: 10 minutes/day for at least one week

**Instructions**:
1. Write down three things that went well today
2. Provide an explanation for why they went well
3. Create a physical record (not just mental)
4. Items can be small ("I got out of bed") or major milestones
5. Write before bed for routine consistency

**Key Insight**: If focusing on negative feelings, refocus on the good event and positive feelings (takes effort but gets easier with practice)

---

## Definition of Done

### Story-Level DoD
- ✅ All tasks completed and checkboxes marked [x]
- ✅ All acceptance criteria met
- ✅ GratitudeHelper component created and working
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
  - `/src/components/journal/helpers/GratitudeHelper.tsx` - Main component
- **Modified Files:**
  - `/src/types/helper.ts` - Add 'gratitude' to HelperType union
  - `/src/components/journal/JournalStream.tsx` - Integrate GratitudeHelper

---

## Related Documentation

- **Issue**: [#66 - Evidence-Based Journaling Helpers Roadmap](https://github.com/levineam/Signum/issues/66)
- **Parent Epic**: Phase 1: Foundation & High-Impact Basics
- **Reference Implementation**: `/src/components/journal/helpers/CbtDistortions.tsx`
- **Helper Container**: `/src/components/journal/helpers/HelperContainer.tsx`
- **Helper Types**: `/src/types/helper.ts`
- **GGIA Practice**: https://ggia.berkeley.edu/practice/three-good-things
- **Evidence**: Seligman (2005), Dickens (2017) meta-analysis
