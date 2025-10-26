# Story 2.5.5: Gratitude / "Three Good Things" Helper

**Status:** 📋 READY FOR DEVELOPMENT
**Created:** 2025-10-26
**Updated:** 2025-10-26
**Issue:** #66
**Parent Epic:** Phase 1: Foundation & High-Impact Basics
**Prerequisites:**
- Story 2.5.4 (CBT Helper) ✅ Complete
- `HelperContainer` component available
- Helper usage tracking infrastructure

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
   - Follows CBT helper's HelperContainer pattern

2. **Structured Prompts**
   - Title field for each good thing
   - "What happened?" (detailed description)
   - "How did this make you feel?" (emotional reflection)
   - "Why did this happen?" (causal attribution)

3. **Insert Behavior**
   - "Add to Journal Entry" button
   - Formats all 3 good things as markdown
   - Inserts at cursor position in journal entry
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'
import { HelperContainer } from './HelperContainer'

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
  const [goodThings, setGoodThings] = useState<[GoodThing, GoodThing, GoodThing]>([
    { title: '', whatHappened: '', howIFelt: '', whyItHappened: '' },
    { title: '', whatHappened: '', howIFelt: '', whyItHappened: '' },
    { title: '', whatHappened: '', howIFelt: '', whyItHappened: '' }
  ])
  const [liveRegionMessage, setLiveRegionMessage] = useState('')
  const collapseHelperRef = useRef<(() => void) | null>(null)
  const eventsRef = useRef<HelperEvent[]>([])

  // ... implementation details
}
```

**Acceptance:**
- ✅ Component renders with HelperContainer (green variant)
- ✅ 3 collapsible sections for good things
- ✅ Each section has 4 fields (title, what, feel, why)
- ✅ Form state management handles 9 text inputs
- ✅ "Add to Journal Entry" button disabled if all fields empty

---

### 2. Implement Formatted Markdown Insert
**File:** `/src/components/journal/helpers/GratitudeHelper.tsx`

**Markdown Format:**
```markdown
## Three Good Things

### [Title from #1]
**What happened:** [User's response]

**How I felt:** [User's response]

**Why it happened:** [User's response]

---

### [Title from #2]
**What happened:** [User's response]

**How I felt:** [User's response]

**Why it happened:** [User's response]

---

### [Title from #3]
**What happened:** [User's response]

**How I felt:** [User's response]

**Why it happened:** [User's response]
```

**Acceptance:**
- ✅ formatGratitudeEntry() generates correct markdown
- ✅ Empty fields handled gracefully (skip or placeholder)
- ✅ Special characters escaped properly
- ✅ Markdown preview renders correctly in journal

---

### 3. Add Helper to JournalStream
**File:** `/src/components/journal/JournalStream.tsx`

**Integration:**
```tsx
{isTodaysEntry && (
  <>
    <CbtDistortions {...} />
    <GratitudeHelper
      entryId={entry.id}
      userId={userId}
      onInsert={handleHelperInsertion}
    />
  </>
)}
```

**Acceptance:**
- ✅ Helper renders below CBT helper for today's entry only
- ✅ handleHelperInsertion() receives formatted text
- ✅ Text inserts at cursor position (or end if no cursor)
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

### Helper Types Extension
```typescript
// Add to src/types/helper.ts
export type HelperType =
  | 'cbt-distortions'
  | 'gratitude'  // 🆕 Story 2.5.5

export const HELPER_TYPE_LABELS: Record<HelperType, string> = {
  'cbt-distortions': 'CBT Cognitive Distortions',
  'gratitude': 'Three Good Things'  // 🆕
}
```

---

## Tasks

### Phase 1: Component Setup (1-2 hours)
- [ ] Create `/src/components/journal/helpers/GratitudeHelper.tsx`
- [ ] Add `'gratitude'` to HelperType union in `/src/types/helper.ts`
- [ ] Set up component with HelperContainer (green variant)
- [ ] Define GoodThing interface and state structure
- [ ] Implement updateGoodThing() helper function

### Phase 2: Form UI (2-3 hours)
- [ ] Create 3 collapsible sections (Good Thing #1, #2, #3)
- [ ] Add title Input field for each section
- [ ] Add 3 Textarea fields per section (what, feel, why)
- [ ] Add placeholder text and labels based on GGIA
- [ ] Implement "Add to Journal Entry" button (disabled when empty)
- [ ] Optional: Add "Clear All" button

### Phase 3: Markdown Formatting (1 hour)
- [ ] Implement formatGratitudeEntry() function
- [ ] Handle empty fields gracefully (skip or use placeholder)
- [ ] Escape special markdown characters if needed
- [ ] Test markdown rendering in journal editor

### Phase 4: Integration (1-2 hours)
- [ ] Add GratitudeHelper to JournalStream (below CBT helper)
- [ ] Wire onInsert to handleHelperInsertion
- [ ] Test insertion at cursor position
- [ ] Verify helper collapses after insertion
- [ ] Test entry auto-save after insertion

### Phase 5: Usage Tracking (1 hour)
- [ ] Track helper_opened event
- [ ] Track helper_inserted event with metadata
- [ ] Calculate field completion percentage
- [ ] Log character counts per field
- [ ] Test non-blocking behavior (insertion works if logging fails)

### Phase 6: Accessibility & Testing (2-3 hours)
- [ ] Add ARIA labels to all form fields
- [ ] Implement live region for announcements
- [ ] Test keyboard navigation (Tab, Enter, Escape)
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
- ✅ "Add to Journal Entry" button inserts formatted markdown
- ✅ Markdown format matches specification (## Three Good Things, ### titles, etc.)
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
- [ ] **Insert Test**: Click "Add to Journal Entry" → markdown appears in editor
- [ ] **Markdown Rendering**: Journal entry displays formatted "Three Good Things"
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
- ✅ Markdown insertion working correctly
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
