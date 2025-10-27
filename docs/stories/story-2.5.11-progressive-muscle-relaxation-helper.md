# Story 2.5.11: Progressive Muscle Relaxation Helper

**Status:** 📋 READY FOR DEVELOPMENT
**Created:** 2025-10-26
**Updated:** 2025-10-26
**Issue:** #66
**Parent Epic:** Phase 3: Future-Oriented & Meaning
**Prerequisites:**
- Story 2.5.4 (CBT Helper) ✅ Complete - Similar checkbox selection pattern
- Story 2.5.10 (Savoring Helper) ✅ Complete
- shadcn/ui Card component (already available)

---

## Story

As a user,
I want a Progressive Muscle Relaxation (PMR) helper that guides me through systematically tensing and relaxing muscle groups,
so that I can reduce physical tension and anxiety using Edmund Jacobson's evidence-based technique.

---

## Why This Matters

**Current State:**
- Users have cognitive helpers (CBT, self-compassion, WOOP)
- No helper for somatic/body-based stress reduction
- Users experience physical tension without knowing how to release it
- Missing evidence-based tool for anxiety management

**Problems:**
- Chronic muscle tension contributes to anxiety and stress
- Users don't recognize where they hold tension
- Lack of structured relaxation practice
- Missing body-mind connection in journaling

**Benefits:**
- **Strong clinical evidence**: d=0.38 for anxiety reduction (Manzoni et al., 2008)
- **Gold standard**: PMR is a clinical standard for anxiety treatment
- **Immediate relief**: Physical relaxation happens during practice
- **Simple structure**: Checklist of muscle groups + reflection
- **Somatic awareness**: Teaches body-mind connection

---

## Scope

### In Scope
1. **PMR Helper Component**
   - Checklist of 8 major muscle groups
   - Instructions for tense-release cycle
   - Optional reflection text area
   - Follows Card pattern (progressive disclosure with Explore button)

2. **Eight Muscle Groups** (simplified from Jacobson's original 16)
   - Hands and forearms
   - Upper arms (biceps)
   - Shoulders and neck
   - Face (forehead, eyes, jaw)
   - Chest and back
   - Stomach
   - Hips and buttocks
   - Legs and feet

3. **Insert Behavior**
   - "Add to Journal Entry" button
   - Formats as HTML paragraphs with completed muscle groups + reflection
   - Prepends to TOP of journal entry (matches `JournalStream.tsx:424-425`)
   - Helper collapses after insert

4. **Integration**
   - Render in JournalStream for today's entry
   - Helper usage tracking (Supabase)
   - Mobile-responsive layout
   - Accessibility (WCAG AA)

### Out of Scope
- Guided audio for PMR practice
- Timer or pacing functionality
- Progress tracking across PMR sessions
- Custom muscle group selection
- Integration with wearables or biofeedback

---

## Deliverables

### 1. Create ProgressiveMuscleRelaxationHelper Component
**File:** `/src/components/journal/helpers/ProgressiveMuscleRelaxationHelper.tsx`

**Implementation:**
```tsx
'use client'

/**
 * Progressive Muscle Relaxation Helper Component
 * Story 2.5.11: Evidence-based somatic stress reduction
 *
 * Based on Edmund Jacobson's PMR technique (1938)
 * Simplified 8-group version for accessibility
 */

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'

interface MuscleGroup {
  id: string
  name: string
  description: string
}

const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: 'hands-forearms', name: 'Hands and Forearms', description: 'Make fists, then release' },
  { id: 'upper-arms', name: 'Upper Arms (Biceps)', description: 'Tense biceps, then release' },
  { id: 'shoulders-neck', name: 'Shoulders and Neck', description: 'Raise shoulders to ears, then drop' },
  { id: 'face', name: 'Face', description: 'Scrunch facial muscles, then release' },
  { id: 'chest-back', name: 'Chest and Back', description: 'Arch back, then relax' },
  { id: 'stomach', name: 'Stomach', description: 'Tighten abs, then release' },
  { id: 'hips-buttocks', name: 'Hips and Buttocks', description: 'Squeeze glutes, then release' },
  { id: 'legs-feet', name: 'Legs and Feet', description: 'Point toes, then flex and release' }
]

interface PMRHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

export function ProgressiveMuscleRelaxationHelper({ entryId, userId, onInsert }: PMRHelperProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [completedGroups, setCompletedGroups] = useState<Set<string>>(new Set())
  const [reflection, setReflection] = useState('')
  const exploreButtonRef = useRef<HTMLButtonElement>(null)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')
  const eventsRef = useRef<HelperEvent[]>([])

  // ... implementation details (follow CbtDistortions.tsx pattern)
}
```

**Acceptance:**
- ✅ Component renders with Card (teal/cyan gradient: `bg-gradient-to-r from-teal-50 to-cyan-50`)
- ✅ Progressive disclosure with Explore/Collapse button (follows CbtDistortions pattern)
- ✅ 8 checkboxes for muscle groups
- ✅ Brief instructions for each muscle group
- ✅ Optional reflection text area
- ✅ "Add to Journal Entry" button disabled if no muscle groups checked
- ✅ Form state management for checkboxes + text area

---

### 2. Implement Muscle Group Checklist
**File:** `/src/components/journal/helpers/ProgressiveMuscleRelaxationHelper.tsx`

**Checklist Behavior:**
- Use shadcn/ui Checkbox component (like CBT helper)
- Multiple selection (check all muscle groups completed)
- Each checkbox shows muscle group name + brief instruction
- Visual feedback when checked/unchecked
- Screen reader announces selection count

**Muscle Group Instructions:**
- **Hands and Forearms**: Make tight fists, hold 5 seconds, release
- **Upper Arms**: Tense biceps, hold 5 seconds, release
- **Shoulders and Neck**: Raise shoulders to ears, hold 5 seconds, drop
- **Face**: Scrunch all facial muscles, hold 5 seconds, release
- **Chest and Back**: Arch back slightly, hold 5 seconds, relax
- **Stomach**: Tighten abdominal muscles, hold 5 seconds, release
- **Hips and Buttocks**: Squeeze glutes, hold 5 seconds, release
- **Legs and Feet**: Point toes down, hold 5 seconds, flex up and release

**Acceptance:**
- ✅ All 8 muscle groups displayed with descriptions
- ✅ Multiple selection works (like CBT helper)
- ✅ Selection updates component state
- ✅ Screen reader announces selections
- ✅ Keyboard navigation works (Tab, Space to toggle)

---

### 3. Implement Formatted HTML Insert
**File:** `/src/components/journal/helpers/ProgressiveMuscleRelaxationHelper.tsx`

**HTML Paragraph Format** (matching system behavior in `src/data/cbtDistortions.ts:98`):
```html
<p><strong>Progressive Muscle Relaxation</strong></p>
<p><br></p>
<p>Today I practiced PMR with these muscle groups:</p>
<p><br></p>
<p>✓ Hands and Forearms</p>
<p>✓ Upper Arms (Biceps)</p>
<p>✓ Shoulders and Neck</p>
<p><br></p>
<p><strong>Reflection:</strong></p>
<p>[User's optional reflection]</p>
<p><br></p>
```

**Acceptance:**
- ✅ formatPMREntry() generates correct HTML paragraphs (NOT Markdown)
- ✅ All checked muscle groups listed with checkmark (✓)
- ✅ Optional reflection text integrated
- ✅ Empty reflection handled gracefully (omit section if empty)
- ✅ HTML renders correctly in SimpleRichEditor
- ✅ Format matches existing CBT helper pattern (`<p>text</p><p><br></p>`)

---

### 4. Add Helper to JournalStream
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
    <ProgressiveMuscleRelaxationHelper
      entryId={entry.id}
      userId={user.id}
      onInsert={(helperText) => handleHelperInsertion(entry.id, helperText)}
    />
  </>
)}
```

**Acceptance:**
- ✅ Helper renders below Savoring helper for today's entry only
- ✅ handleHelperInsertion() receives formatted HTML text
- ✅ **Text prepends to TOP of entry** (matches system behavior at `JournalStream.tsx:424-425`)
- ✅ Entry auto-saves after insertion

---

### 5. Implement Helper Usage Tracking
**File:** `/src/components/journal/helpers/ProgressiveMuscleRelaxationHelper.tsx`

**Track Events:**
- `helper_opened`: When user expands helper
- `helper_selection`: When muscle group is checked/unchecked
- `helper_inserted`: When user clicks "Add to Journal Entry"

**Metadata:**
- Number of muscle groups completed (0-8)
- Which muscle groups completed (array of IDs)
- Reflection character count (if provided)
- Whether full sequence completed (all 8 groups)

**Acceptance:**
- ✅ Usage logged to `helper_usage` table
- ✅ Metadata includes: muscle group count, muscle group names, reflection length
- ✅ Non-blocking (doesn't prevent insertion if logging fails)
- ✅ RLS policies enforce user isolation

---

### 6. Accessibility & Mobile Responsiveness
**Files:** `/src/components/journal/helpers/ProgressiveMuscleRelaxationHelper.tsx`

**Accessibility:**
- ARIA labels for all checkboxes and text area
- Live region announcements for selection count
- Keyboard navigation (Tab, Space to toggle checkboxes, Enter to submit)
- Screen reader tested

**Mobile:**
- Touch-friendly checkboxes (large tap targets)
- Responsive spacing (stacked on mobile)
- No horizontal scroll
- "Add to Journal Entry" button always visible

**Acceptance:**
- ✅ WCAG AA contrast ratios
- ✅ Keyboard-only navigation works
- ✅ Screen reader announces muscle group selections and count
- ✅ Mobile viewport (<768px) tested on real device

---

## Technical Implementation Notes

### PMR Technique Background

**Original Jacobson Method (1938):**
- 16-20 muscle groups
- 10-second tension, 15-20 second relaxation
- Complete session: 30-45 minutes

**Simplified 8-Group Version (for accessibility):**
- 8 major muscle groups
- 5-second tension, 10-second relaxation
- Complete session: 15-20 minutes
- Easier to remember and practice

### PMR Instructions (for UI guidance text)

**General Instructions:**
1. Find a quiet, comfortable place
2. For each muscle group:
   - Tense the muscles tightly (but not painfully)
   - Hold tension for 5 seconds
   - Release suddenly and completely
   - Notice the difference between tension and relaxation
   - Rest 10 seconds before moving to next group
3. Progress from hands up to head, then down to feet

### Database Migration Required

⚠️ **BLOCKING**: Before implementing this story, the database CHECK constraint must be updated.

**Required Migration** (create new file: `supabase/migrations/YYYYMMDDHHMMSS_add_pmr_helper_type.sql`):
```sql
-- Add 'pmr' to helper_type CHECK constraint
ALTER TABLE helper_usage
DROP CONSTRAINT valid_helper_type;

ALTER TABLE helper_usage
ADD CONSTRAINT valid_helper_type CHECK (
  helper_type IN ('cbt-distortions', 'gentle-prompt', 'gratitude', 'values-affirmation', 'self-compassion', 'woop', 'best-possible-self', 'savoring', 'pmr')
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
  | 'pmr'  // 🆕 Story 2.5.11

// STEP 2: Update labels
export const HELPER_TYPE_LABELS: Record<HelperType, string> = {
  'cbt-distortions': 'CBT Cognitive Distortions',
  'gratitude': 'Three Good Things',
  'values-affirmation': 'Values Affirmation',
  'self-compassion': 'Self-Compassion Break',
  'woop': 'WOOP Goal Planning',
  'best-possible-self': 'Best Possible Self',
  'savoring': 'Savoring Practice',
  'pmr': 'Progressive Muscle Relaxation'  // 🆕
}

// STEP 3: Extend HelperUsageMetadata for PMR-specific fields
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

  // 🆕 PMR helper fields (Story 2.5.11)
  muscleGroupCount?: number            // Number of muscle groups completed (0-8)
  muscleGroupNames?: string[]          // Array of completed muscle group IDs
  completedFullSequence?: boolean      // Whether all 8 groups were done
  pmrReflectionLength?: number         // Character count of reflection
}
```

---

## Tasks

### Phase 0: Database Migration (30 min) ⚠️ PREREQUISITE
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_pmr_helper_type.sql`
- [ ] Add 'pmr' to valid_helper_type CHECK constraint
- [ ] Test migration on local Supabase: `supabase db reset`
- [ ] Verify constraint allows 'pmr' value
- [ ] Push migration to dev environment

### Phase 1: Type System Updates (30 min)
- [ ] Add `'pmr'` to HelperType union in `/src/types/helper.ts`
- [ ] Add 'Progressive Muscle Relaxation' to HELPER_TYPE_LABELS
- [ ] Extend HelperUsageMetadata interface with PMR fields:
  - `muscleGroupCount?: number`
  - `muscleGroupNames?: string[]`
  - `completedFullSequence?: boolean`
  - `pmrReflectionLength?: number`
- [ ] Verify TypeScript compiles without errors

### Phase 2: Component Setup (1 hour)
- [ ] Create `/src/components/journal/helpers/ProgressiveMuscleRelaxationHelper.tsx`
- [ ] Set up component with Card (teal/cyan gradient: `from-teal-50 to-cyan-50`)
- [ ] Implement progressive disclosure UI (Explore/Collapse button) following `CbtDistortions.tsx:34-74`
- [ ] Define MUSCLE_GROUPS constant (8 groups with descriptions)
- [ ] Initialize form state (completedGroups Set, reflection)

### Phase 3: Form UI (2-3 hours)
- [ ] Add descriptive header explaining PMR technique
- [ ] Add general instructions (tense 5 sec, release, notice difference)
- [ ] Create 8 checkboxes with muscle group names
- [ ] Add brief instruction for each muscle group
- [ ] Add optional Textarea for reflection with placeholder: "How do you feel after this practice?"
- [ ] Implement "Add to Journal Entry" button (disabled when no groups checked)

### Phase 4: HTML Formatting (1 hour)
- [ ] Implement formatPMREntry() function to generate HTML paragraphs
- [ ] List all checked muscle groups with checkmarks (✓)
- [ ] Include optional reflection section
- [ ] Follow existing pattern from `cbtDistortions.ts:formatDistortionReflection()`: `<p>text</p><p><br></p>`
- [ ] Test HTML rendering in SimpleRichEditor

### Phase 5: Integration (1 hour)
- [ ] Add ProgressiveMuscleRelaxationHelper to JournalStream (below Savoring helper)
- [ ] Wire onInsert to handleHelperInsertion with entry ID: `(helperText) => handleHelperInsertion(entry.id, helperText)`
- [ ] **Test insertion prepends to TOP** (system behavior, not cursor insertion)
- [ ] Verify helper collapses after insertion
- [ ] Test entry auto-save after insertion

### Phase 6: Usage Tracking (1 hour)
- [ ] Track helper_opened event
- [ ] Track helper_selection event (muscle group checked/unchecked)
- [ ] Track helper_inserted event with metadata
- [ ] Calculate muscle group count (0-8)
- [ ] Log muscle group names (array of IDs)
- [ ] Detect full sequence completion (all 8 groups)
- [ ] Log reflection character count (if provided)
- [ ] Test non-blocking behavior (insertion works if logging fails)

### Phase 7: Accessibility & Testing (2 hours)
- [ ] Add ARIA labels to all checkboxes and text area
- [ ] Implement live region for announcements (follow `CbtDistortions.tsx:37-52`)
- [ ] Add Explore button ref and focus management (follow `CbtDistortions.tsx:36, 70-73`)
- [ ] Test keyboard navigation (Tab, Space to toggle, Enter to submit)
- [ ] Test Escape key collapses helper (follow `CbtDistortions.tsx` pattern if implemented)
- [ ] Test screen reader (checkbox selection announcements)
- [ ] Test mobile responsiveness (<768px)
- [ ] Test touch targets on mobile device
- [ ] Run ESLint: `npm run lint`
- [ ] Build verification: `npm run build`

---

## Acceptance Criteria

### Functional Requirements
- ✅ ProgressiveMuscleRelaxationHelper component renders in today's journal entry
- ✅ 8 checkboxes for muscle groups with brief instructions
- ✅ Optional reflection text area
- ✅ **Button Enablement Rule**: "Add to Journal Entry" button is disabled UNLESS:
  - At least ONE muscle group is checked
- ✅ "Add to Journal Entry" inserts formatted HTML paragraphs (NOT Markdown)
- ✅ HTML format matches system pattern (`<p>text</p><p><br></p>` from `cbtDistortions.ts`)
- ✅ Checked muscle groups listed with checkmarks (✓)
- ✅ **Content prepends to TOP of entry** (matches `JournalStream.tsx:424-425`)
- ✅ Helper collapses after successful insertion
- ✅ Journal entry auto-saves after insertion

### Data Requirements
- ✅ Helper usage tracked in `helper_usage` table
- ✅ Metadata includes: muscle group count, muscle group names, full sequence flag, reflection length
- ✅ User isolation enforced by RLS policies
- ✅ Non-blocking logging (insertion works if database fails)

### UX Requirements
- ✅ Clear instructions for PMR technique
- ✅ Brief guidance for each muscle group
- ✅ Checklist pattern familiar from CBT helper
- ✅ Satisfaction moment: formatted entry appears after clicking button
- ✅ Mobile-friendly: works on phone/tablet

### Accessibility Requirements
- ✅ WCAG AA contrast ratios
- ✅ Keyboard navigation works (Tab, Space, Enter, Escape)
- ✅ Screen reader announces checkbox selections and count
- ✅ Touch targets >= 44x44px on mobile

### Quality Requirements
- ✅ No ESLint errors (`npm run lint`)
- ✅ Successful production build (`npm run build`)
- ✅ No console errors or warnings
- ✅ TypeScript strict mode passes

---

## Testing Checklist

### Manual Testing
- [ ] **Render Test**: Helper appears below Savoring helper for today's entry
- [ ] **Checkbox Interaction**: All 8 checkboxes work, multiple selection
- [ ] **Insert Test**: Click "Add to Journal Entry" → HTML paragraphs appear in editor
- [ ] **HTML Rendering**: Journal entry displays formatted PMR log with checkmarks
- [ ] **Prepend Behavior**: Content appears at TOP of entry, not at cursor
- [ ] **Muscle Group List**: All checked groups appear in output
- [ ] **Collapse Test**: Helper collapses after insertion
- [ ] **Empty State**: Button disabled when no muscle groups checked
- [ ] **Partial Completion**: Works if user only checks some groups (not all 8)
- [ ] **Reflection Optional**: Works with or without reflection text

### Responsive Testing
- [ ] **Desktop (>=1280px)**: Helper fits without horizontal scroll
- [ ] **Tablet (768px-1279px)**: Checkboxes readable, button accessible
- [ ] **Mobile (<768px)**: Checkboxes stack vertically, large tap targets

### Accessibility Testing
- [ ] **Keyboard Navigation**: Tab through checkboxes, Space to toggle
- [ ] **Screen Reader**: Announces muscle group names and selection count
- [ ] **Focus Indicators**: Visible on all checkboxes and button
- [ ] **Touch Targets**: Easy to tap checkboxes on mobile

### Automated Testing
- [ ] `npm run lint`: No errors
- [ ] `npm run build`: Successful build
- [ ] Browser console: No errors or warnings

---

## Evidence & References

### Scientific Evidence
- **Jacobson (1938)**: Original PMR technique development
- **Manzoni et al. (2008)**: Meta-analysis showing d=0.38 for anxiety reduction
- **Clinical standard**: PMR is gold standard for anxiety/stress management
- **Applications**: Generalized anxiety, panic disorder, insomnia, chronic pain

### Progressive Muscle Relaxation Research
**Source**: Manzoni, G. M., et al. (2008). Relaxation training for anxiety: A ten-years systematic review with meta-analysis. *BMC Psychiatry*, 8(1), 41.

**Key Findings**:
- PMR reduces state anxiety (d=0.38)
- Comparable to other relaxation techniques
- Most effective with regular practice (3+ times per week)
- Teaches somatic awareness (recognizing tension)
- Provides immediate anxiety relief

**Mechanism**:
- Activates parasympathetic nervous system
- Teaches discrimination between tension and relaxation
- Interrupts stress response cycle
- Increases body-mind awareness

---

## Definition of Done

### Story-Level DoD
- ✅ All tasks completed and checkboxes marked [x]
- ✅ All acceptance criteria met
- ✅ ProgressiveMuscleRelaxationHelper component created and working
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
  - `/src/components/journal/helpers/ProgressiveMuscleRelaxationHelper.tsx` - Main component
- **Modified Files:**
  - `/src/types/helper.ts` - Add 'pmr' to HelperType union
  - `/src/components/journal/JournalStream.tsx` - Integrate ProgressiveMuscleRelaxationHelper

---

## Related Documentation

- **Issue**: [#66 - Evidence-Based Journaling Helpers Roadmap](https://github.com/levineam/Signum/issues/66)
- **Parent Epic**: Phase 3: Future-Oriented & Meaning
- **Reference Implementation**: `/src/components/journal/helpers/CbtDistortions.tsx` - Checkbox pattern
- **Helper Types**: `/src/types/helper.ts`
- **Evidence**: Jacobson (1938), Manzoni et al. (2008)
- **Complements**: Story 2.5.7 (Self-Compassion) - mental + physical stress relief

---

## QA Results

- **Gate:** PASS
- **Review Date:** 2025-10-26
- **Notes:** Checklist + optional reflection follow the established Card-based helper pattern; inline Tailwind gradients are fine on this branch. Telemetry requirements (`muscleGroupCount`, `muscleGroupNames`, `completedFullSequence`, `pmrReflectionLength`) already land in the consolidated helper migration (`20251026093000_extend_helper_types_phase2.sql`) and updated TypeScript types, so dev can proceed without extra schema prep.
