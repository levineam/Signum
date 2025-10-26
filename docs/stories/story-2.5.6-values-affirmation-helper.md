# Story 2.5.6: Values Self-Affirmation Helper

**Status:** 📋 READY FOR DEVELOPMENT
**Created:** 2025-10-26
**Updated:** 2025-10-26
**Issue:** #66
**Parent Epic:** Phase 1: Foundation & High-Impact Basics
**Prerequisites:**
- Story 2.5.4 (CBT Helper) ✅ Complete
- Story 2.5.5 (Gratitude Helper) - Recommended (establishes pattern)
- `HelperContainer` component available

---

## Story

As a user,
I want a values affirmation helper that guides me through reflecting on my core values,
so that I can strengthen my sense of identity and buffer against stress through structured values work.

---

## Why This Matters

**Current State:**
- Users have helpers for gratitude and cognitive distortions
- No helper for values clarification (core ACT principle)
- Values reflection requires self-directed journaling

**Problems:**
- Users don't know which values to focus on
- Blank-page anxiety prevents values exploration
- Missing evidence-based stress buffering tool
- Values work not integrated into daily journaling

**Benefits:**
- **Perfect ACT alignment**: Values clarification is foundational to ACT therapy
- **Strong evidence**: d=0.20–0.40 effect size for stress buffering (Cohen meta-analysis)
- **Simple structure**: Dropdown + 2 text areas (low complexity)
- **Pairs with WOOP**: Sets up future goal-setting helper (Story 2.5.8)
- **Academic applications**: Reduces achievement gaps, improves performance

---

## Scope

### In Scope
1. **Values Affirmation Helper Component**
   - Dropdown selector with 9 pre-defined values
   - 2 text areas for reflection
   - Based on Sherman & Cohen (2006) self-integrity research

2. **Value Selection**
   - Pre-populated dropdown: Relationships, Creativity, Independence, Career, Health, Community, Learning, Spirituality, Other
   - Required field (cannot submit without selecting)
   - "Other" option with free-text fallback

3. **Structured Prompts**
   - "Why is this value important to you?"
   - "Describe a specific time you lived this value"
   - Guidance text for each prompt

4. **Insert Behavior**
   - "Add to Journal Entry" button
   - Formats as markdown with selected value as header
   - Helper collapses after insert

### Out of Scope
- Values ranking or prioritization
- Multiple values per entry
- Values assessment quiz
- Progress tracking across values
- AI-suggested values based on past entries

---

## Deliverables

### 1. Create ValuesAffirmationHelper Component
**File:** `/src/components/journal/helpers/ValuesAffirmationHelper.tsx`

**Implementation:**
```tsx
'use client'

/**
 * Values Self-Affirmation Helper Component
 * Story 2.5.6: Evidence-based values clarification
 *
 * Based on Sherman & Cohen (2006) self-integrity maintenance research
 */

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperContainer } from './HelperContainer'

const VALUES_OPTIONS = [
  'Relationships',
  'Creativity',
  'Independence',
  'Career',
  'Health',
  'Community',
  'Learning',
  'Spirituality',
  'Other'
] as const

type ValueOption = typeof VALUES_OPTIONS[number]

interface ValuesAffirmationHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

export function ValuesAffirmationHelper({ entryId, userId, onInsert }: ValuesAffirmationHelperProps) {
  const [selectedValue, setSelectedValue] = useState<ValueOption | ''>('')
  const [whyImportant, setWhyImportant] = useState('')
  const [specificTime, setSpecificTime] = useState('')
  const [liveRegionMessage, setLiveRegionMessage] = useState('')
  const collapseHelperRef = useRef<(() => void) | null>(null)

  // ... implementation details
}
```

**Acceptance:**
- ✅ Component renders with HelperContainer (purple variant)
- ✅ Values dropdown with 9 options
- ✅ 2 text areas with clear labels
- ✅ "Add to Journal Entry" button disabled if value not selected
- ✅ Form state management for 3 fields

---

### 2. Implement Values Dropdown
**File:** `/src/components/journal/helpers/ValuesAffirmationHelper.tsx`

**Dropdown Behavior:**
- Use shadcn/ui Select component
- Required field (cannot be empty)
- Clear placeholder: "Choose a core personal value"
- Options ordered by common usage
- "Other" triggers optional free-text input (future enhancement)

**Acceptance:**
- ✅ Dropdown displays all 9 value options
- ✅ Selection updates component state
- ✅ Screen reader announces selected value
- ✅ Keyboard navigation works (Arrow keys, Enter)

---

### 3. Implement Formatted Markdown Insert
**File:** `/src/components/journal/helpers/ValuesAffirmationHelper.tsx`

**Markdown Format:**
```markdown
## Values Affirmation: [Selected Value]

**Why this matters to me:**
[User's response]

**A time I lived this value:**
[User's response]
```

**Acceptance:**
- ✅ formatValuesEntry() generates correct markdown
- ✅ Selected value appears in header
- ✅ Empty text areas handled gracefully
- ✅ Special characters escaped properly

---

### 4. Add Helper to JournalStream
**File:** `/src/components/journal/JournalStream.tsx`

**Integration:**
```tsx
{isTodaysEntry && (
  <>
    <CbtDistortions {...} />
    <GratitudeHelper {...} />
    <ValuesAffirmationHelper
      entryId={entry.id}
      userId={userId}
      onInsert={handleHelperInsertion}
    />
  </>
)}
```

**Acceptance:**
- ✅ Helper renders below Gratitude helper for today's entry
- ✅ Insert behavior matches other helpers
- ✅ Entry auto-saves after insertion

---

### 5. Implement Helper Usage Tracking
**File:** `/src/components/journal/helpers/ValuesAffirmationHelper.tsx`

**Track Events:**
- `helper_opened`: When user expands helper
- `helper_selection`: When value is selected from dropdown
- `helper_inserted`: When user clicks "Add to Journal Entry"

**Metadata:**
- Selected value name
- Character counts for both text areas
- Field completion status

**Acceptance:**
- ✅ Usage logged to `helper_usage` table
- ✅ Metadata includes selected value and field completion
- ✅ Non-blocking logging
- ✅ RLS policies enforce user isolation

---

## Technical Implementation Notes

### Form State Management
```tsx
const [selectedValue, setSelectedValue] = useState<ValueOption | ''>('')
const [whyImportant, setWhyImportant] = useState('')
const [specificTime, setSpecificTime] = useState('')

// Button disabled if value not selected
const canSubmit = selectedValue !== '' && (whyImportant.trim() || specificTime.trim())
```

### Values List Rationale
Based on ACT values work and Cohen research:
- **Relationships**: Connection, love, family, friendship
- **Creativity**: Expression, innovation, art, problem-solving
- **Independence**: Autonomy, self-reliance, freedom
- **Career**: Achievement, contribution, professional growth
- **Health**: Physical/mental well-being, vitality
- **Community**: Service, belonging, civic engagement
- **Learning**: Growth, curiosity, knowledge, mastery
- **Spirituality**: Meaning, transcendence, faith
- **Other**: Catch-all for unlisted values

### Helper Types Extension
```typescript
// Add to src/types/helper.ts
export type HelperType =
  | 'cbt-distortions'
  | 'gratitude'
  | 'values-affirmation'  // 🆕 Story 2.5.6

export const HELPER_TYPE_LABELS: Record<HelperType, string> = {
  'cbt-distortions': 'CBT Cognitive Distortions',
  'gratitude': 'Three Good Things',
  'values-affirmation': 'Values Affirmation'  // 🆕
}
```

---

## Tasks

### Phase 1: Component Setup (1 hour)
- [ ] Create `/src/components/journal/helpers/ValuesAffirmationHelper.tsx`
- [ ] Add `'values-affirmation'` to HelperType union
- [ ] Set up component with HelperContainer (purple variant)
- [ ] Define VALUES_OPTIONS constant
- [ ] Initialize form state (selectedValue, whyImportant, specificTime)

### Phase 2: Form UI (2 hours)
- [ ] Implement values dropdown (shadcn/ui Select)
- [ ] Add "Why is this value important to you?" text area
- [ ] Add "Describe a specific time you lived this value" text area
- [ ] Add guidance text for each prompt
- [ ] Implement "Add to Journal Entry" button (disabled when incomplete)

### Phase 3: Markdown Formatting (30 min)
- [ ] Implement formatValuesEntry() function
- [ ] Handle edge cases (empty text areas)
- [ ] Test markdown rendering in journal editor

### Phase 4: Integration (1 hour)
- [ ] Add ValuesAffirmationHelper to JournalStream
- [ ] Wire onInsert to handleHelperInsertion
- [ ] Test insertion and collapse behavior
- [ ] Verify entry auto-save

### Phase 5: Usage Tracking (1 hour)
- [ ] Track helper_opened event
- [ ] Track helper_selection event (value chosen)
- [ ] Track helper_inserted event with metadata
- [ ] Log selected value and field completion
- [ ] Test non-blocking behavior

### Phase 6: Testing & Polish (2 hours)
- [ ] Add ARIA labels and live regions
- [ ] Test keyboard navigation (Tab, Arrow keys, Enter)
- [ ] Test screen reader (dropdown and text areas)
- [ ] Test mobile responsiveness
- [ ] Run ESLint and build verification

---

## Acceptance Criteria

### Functional Requirements
- ✅ ValuesAffirmationHelper renders for today's entry
- ✅ Dropdown with 9 value options
- ✅ 2 text areas with clear prompts
- ✅ "Add to Journal Entry" inserts formatted markdown
- ✅ Markdown format: "## Values Affirmation: [Value]"
- ✅ Helper collapses after insertion
- ✅ Entry auto-saves after insertion

### Data Requirements
- ✅ Helper usage tracked in `helper_usage` table
- ✅ Metadata includes: selected value, field completion
- ✅ User isolation via RLS

### UX Requirements
- ✅ Clear value options (no cognitive overload)
- ✅ Guidance text helps user understand prompts
- ✅ Satisfaction: complete entry appears after insertion

### Accessibility Requirements
- ✅ WCAG AA compliance
- ✅ Keyboard navigation (dropdown + text areas)
- ✅ Screen reader support
- ✅ Touch-friendly on mobile

### Quality Requirements
- ✅ No ESLint errors
- ✅ Successful build
- ✅ No console errors
- ✅ TypeScript strict mode

---

## Testing Checklist

### Manual Testing
- [ ] **Dropdown**: All 9 values appear, selection works
- [ ] **Text Areas**: Accept input, update state correctly
- [ ] **Insert**: Markdown appears with selected value in header
- [ ] **Collapse**: Helper collapses after insertion
- [ ] **Disabled State**: Button disabled until value selected
- [ ] **Empty Text**: Works if only one text area filled

### Accessibility Testing
- [ ] **Keyboard**: Tab through fields, Arrow keys in dropdown
- [ ] **Screen Reader**: Announces value selection and prompts
- [ ] **Touch Targets**: Easy to tap on mobile

### Automated Testing
- [ ] `npm run lint`: Pass
- [ ] `npm run build`: Success
- [ ] Browser console: No errors

---

## Evidence & References

### Scientific Evidence
- **Cohen et al. (meta-analysis)**: Reduces achievement gaps, buffers stress
- **Sherman & Cohen (2006)**: Self-integrity maintenance, d=0.20–0.40
- **Clinical applications**: Academic performance, health behavior, intergroup relations
- **ACT framework**: Values clarification is foundational to psychological flexibility

### Research Insights
- **Why it works**: Affirming core values strengthens sense of self-integrity
- **Stress buffering**: Acts as psychological shield during challenges
- **Achievement gaps**: Reduces stereotype threat in academic settings
- **Health behavior**: Improves adherence to health recommendations

---

## Definition of Done

### Story-Level DoD
- ✅ All tasks completed
- ✅ All acceptance criteria met
- ✅ ValuesAffirmationHelper component created
- ✅ Helper integrated into JournalStream
- ✅ Markdown insertion working
- ✅ Usage tracking implemented
- ✅ Responsive testing passed
- ✅ Accessibility validation (WCAG AA)
- ✅ No ESLint errors
- ✅ Production build successful
- ✅ PR created with screenshots
- ✅ Tested on Vercel preview

### File List
- **New Files:**
  - `/src/components/journal/helpers/ValuesAffirmationHelper.tsx`
- **Modified Files:**
  - `/src/types/helper.ts` - Add 'values-affirmation'
  - `/src/components/journal/JournalStream.tsx` - Integrate helper

---

## Related Documentation

- **Issue**: [#66 - Evidence-Based Journaling Helpers](https://github.com/levineam/Signum/issues/66)
- **Parent Epic**: Phase 1: Foundation & High-Impact Basics
- **Reference**: `/src/components/journal/helpers/GratitudeHelper.tsx` (Story 2.5.5)
- **Evidence**: Sherman & Cohen (2006), Cohen et al. meta-analysis
- **ACT Framework**: Values clarification as core therapeutic principle
