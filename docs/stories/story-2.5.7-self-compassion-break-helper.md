# Story 2.5.7: Self-Compassion Break Helper

**Status:** 📋 READY FOR DEVELOPMENT
**Created:** 2025-10-26
**Updated:** 2025-10-26
**Issue:** #66
**Parent Epic:** Phase 2: Self-Regulation & Clinical Tools
**Prerequisites:**
- Story 2.5.5 (Gratitude Helper) ✅ Complete
- Story 2.5.6 (Values Affirmation Helper) ✅ Complete
- shadcn/ui Card component (already available)

---

## Story

As a user,
I want a self-compassion break helper that guides me through Kristin Neff's three-step self-compassion practice,
so that I can respond to difficult moments with kindness instead of self-criticism.

---

## Why This Matters

**Current State:**
- Users have helpers for gratitude and values
- No helper for self-compassion practice (core ACT/mindfulness skill)
- Users struggle with self-criticism during difficult moments

**Problems:**
- Self-criticism amplifies emotional distress
- Users don't know how to practice self-compassion systematically
- Lack of structured intervention during difficult moments
- Missing evidence-based tool for emotional regulation

**Benefits:**
- **Strong clinical evidence**: d=0.47 effect size for well-being (Neff meta-analysis)
- **ACT alignment**: Self-compassion is foundational to psychological flexibility
- **Crisis intervention**: Provides immediate support during difficult moments
- **Simple structure**: 3-step process (mindfulness, common humanity, self-kindness)
- **Universal applicability**: Works for any difficult situation

---

## Scope

### In Scope
1. **Self-Compassion Break Helper Component**
   - 3-step guided process based on Kristin Neff's research
   - Single text area for describing difficult situation
   - Generated compassionate response with user's words integrated
   - Follows Card pattern (progressive disclosure with Explore button)

2. **Three-Step Structure**
   - **Step 1: Mindfulness** - "This is a moment of suffering"
   - **Step 2: Common Humanity** - "Suffering is part of life"
   - **Step 3: Self-Kindness** - "May I be kind to myself"

3. **Insert Behavior**
   - "Add to Journal Entry" button
   - Formats as HTML paragraphs with user's situation + 3-step response
   - Prepends to TOP of journal entry (matches `JournalStream.tsx:424-425`)
   - Helper collapses after insert

4. **Integration**
   - Render in JournalStream for today's entry
   - Helper usage tracking (Supabase)
   - Mobile-responsive layout
   - Accessibility (WCAG AA)

### Out of Scope
- Multiple difficulty levels or variations
- AI-generated compassionate phrases
- Progress tracking across compassion breaks
- Social sharing or community support
- Audio-guided meditation

---

## Deliverables

### 1. Create SelfCompassionHelper Component
**File:** `/src/components/journal/helpers/SelfCompassionHelper.tsx`

**Implementation:**
```tsx
'use client'

/**
 * Self-Compassion Break Helper Component
 * Story 2.5.7: Evidence-based self-compassion practice
 *
 * Based on Kristin Neff's Self-Compassion Break:
 * https://self-compassion.org/exercise-2-self-compassion-break/
 */

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'

interface SelfCompassionHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

export function SelfCompassionHelper({ entryId, userId, onInsert }: SelfCompassionHelperProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [situation, setSituation] = useState('')
  const exploreButtonRef = useRef<HTMLButtonElement>(null)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')
  const eventsRef = useRef<HelperEvent[]>([])

  // ... implementation details (follow CbtDistortions.tsx pattern)
}
```

**Acceptance:**
- ✅ Component renders with Card (warm orange/amber gradient: `bg-gradient-to-r from-orange-50 to-amber-50`)
- ✅ Progressive disclosure with Explore/Collapse button (follows CbtDistortions pattern)
- ✅ Single text area for describing difficult situation
- ✅ "Add to Journal Entry" button disabled if text area empty
- ✅ Form state management for 1 text input

---

### 2. Implement Formatted HTML Insert
**File:** `/src/components/journal/helpers/SelfCompassionHelper.tsx`

**HTML Paragraph Format** (matching system behavior in `src/data/cbtDistortions.ts:98`):
```html
<p><strong>Self-Compassion Break</strong></p>
<p><br></p>
<p><strong>What's difficult right now:</strong></p>
<p>[User's situation]</p>
<p><br></p>
<p><strong>Mindfulness:</strong> This is a moment of suffering. It's okay to feel what I'm feeling.</p>
<p><br></p>
<p><strong>Common Humanity:</strong> Suffering is a part of life. I'm not alone in this. Others have felt this way too.</p>
<p><br></p>
<p><strong>Self-Kindness:</strong> May I be kind to myself in this moment. May I give myself the compassion I need.</p>
<p><br></p>
```

**Acceptance:**
- ✅ formatCompassionBreak() generates correct HTML paragraphs (NOT Markdown)
- ✅ User's situation text integrated into output
- ✅ Three-step structure clearly formatted
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
    <SelfCompassionHelper
      entryId={entry.id}
      userId={user.id}
      onInsert={(helperText) => handleHelperInsertion(entry.id, helperText)}
    />
  </>
)}
```

**Acceptance:**
- ✅ Helper renders below Values Affirmation helper for today's entry only
- ✅ handleHelperInsertion() receives formatted HTML text
- ✅ **Text prepends to TOP of entry** (matches system behavior at `JournalStream.tsx:424-425`)
- ✅ Entry auto-saves after insertion

---

### 4. Implement Helper Usage Tracking
**File:** `/src/components/journal/helpers/SelfCompassionHelper.tsx`

**Track Events:**
- `helper_opened`: When user expands helper
- `helper_inserted`: When user clicks "Add to Journal Entry"

**Acceptance:**
- ✅ Usage logged to `helper_usage` table
- ✅ Metadata includes: character count of situation description
- ✅ Non-blocking (doesn't prevent insertion if logging fails)
- ✅ RLS policies enforce user isolation

---

### 5. Accessibility & Mobile Responsiveness
**Files:** `/src/components/journal/helpers/SelfCompassionHelper.tsx`

**Accessibility:**
- ARIA labels for text area
- Live region announcements for state changes
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader tested

**Mobile:**
- Touch-friendly text area (min height)
- Responsive spacing (stacked on mobile)
- No horizontal scroll
- "Add to Journal Entry" button always visible

**Acceptance:**
- ✅ WCAG AA contrast ratios
- ✅ Keyboard-only navigation works
- ✅ Screen reader announces field label and instructions
- ✅ Mobile viewport (<768px) tested on real device

---

## Technical Implementation Notes

### Kristin Neff's Three Components

**1. Mindfulness:**
- Recognizing suffering without over-identifying with it
- "This is a moment of suffering" or "This is stressful"
- Acknowledging feelings without judgment

**2. Common Humanity:**
- Remembering suffering is part of the shared human experience
- "I'm not alone" or "Others feel this way too"
- Reduces isolation and shame

**3. Self-Kindness:**
- Treating yourself with warmth and understanding
- "May I be kind to myself" or "May I accept myself as I am"
- Active self-soothing and support

### Database Migration Required

⚠️ **BLOCKING**: Before implementing this story, the database CHECK constraint must be updated.

> Update 2025-10-26: Covered by consolidated migration across 2.5.5–2.5.8. If you have applied `supabase/migrations/20251026000000_extend_helper_types.sql`, no per‑story SQL is needed. Types are updated once in `src/types/helper.ts` (HelperType, labels, and `HelperUsageMetadata.situationCharacterCount`).

**Required Migration** (create new file: `supabase/migrations/YYYYMMDDHHMMSS_add_self_compassion_helper_type.sql`):
```sql
-- Add 'self-compassion' to helper_type CHECK constraint
ALTER TABLE helper_usage
DROP CONSTRAINT valid_helper_type;

ALTER TABLE helper_usage
ADD CONSTRAINT valid_helper_type CHECK (
  helper_type IN ('cbt-distortions', 'gentle-prompt', 'gratitude', 'values-affirmation', 'self-compassion')
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
  | 'self-compassion'  // 🆕 Story 2.5.7

// STEP 2: Update labels
export const HELPER_TYPE_LABELS: Record<HelperType, string> = {
  'cbt-distortions': 'CBT Cognitive Distortions',
  'gratitude': 'Three Good Things',
  'values-affirmation': 'Values Affirmation',
  'self-compassion': 'Self-Compassion Break'  // 🆕
}

// STEP 3: Extend HelperUsageMetadata for self-compassion-specific fields
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

  // 🆕 Self-Compassion helper fields (Story 2.5.7)
  situationCharacterCount?: number  // Length of difficult situation description
}
```

---

## Tasks

### Phase 0: Database Migration (30 min) ⚠️ PREREQUISITE
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_self_compassion_helper_type.sql`
- [ ] Add 'self-compassion' to valid_helper_type CHECK constraint
- [ ] Test migration on local Supabase: `supabase db reset`
- [ ] Verify constraint allows 'self-compassion' value
- [ ] Push migration to dev environment

### Phase 1: Type System Updates (30 min)
- [ ] Add `'self-compassion'` to HelperType union in `/src/types/helper.ts`
- [ ] Add 'Self-Compassion Break' to HELPER_TYPE_LABELS
- [ ] Extend HelperUsageMetadata interface with `situationCharacterCount?: number`
- [ ] Verify TypeScript compiles without errors

### Phase 2: Component Setup (1 hour)
- [ ] Create `/src/components/journal/helpers/SelfCompassionHelper.tsx`
- [ ] Set up component with Card (orange/amber gradient: `from-orange-50 to-amber-50`)
- [ ] Implement progressive disclosure UI (Explore/Collapse button) following `CbtDistortions.tsx:34-74`
- [ ] Initialize form state (situation)

### Phase 3: Form UI (1-2 hours)
- [ ] Add descriptive header text explaining self-compassion break
- [ ] Add Textarea for difficult situation with placeholder: "Describe what's difficult right now..."
- [ ] Add guidance text: "Take a moment to acknowledge what you're going through."
- [ ] Implement "Add to Journal Entry" button (disabled when empty)

### Phase 4: HTML Formatting (1 hour)
- [ ] Implement formatCompassionBreak() function to generate HTML paragraphs
- [ ] Integrate user's situation text
- [ ] Add three-step compassion structure (mindfulness, common humanity, self-kindness)
- [ ] Follow existing pattern from `cbtDistortions.ts:formatDistortionReflection()`: `<p>text</p><p><br></p>`
- [ ] Test HTML rendering in SimpleRichEditor

### Phase 5: Integration (1 hour)
- [ ] Add SelfCompassionHelper to JournalStream (below Values Affirmation helper)
- [ ] Wire onInsert to handleHelperInsertion with entry ID: `(helperText) => handleHelperInsertion(entry.id, helperText)`
- [ ] **Test insertion prepends to TOP** (system behavior, not cursor insertion)
- [ ] Verify helper collapses after insertion
- [ ] Test entry auto-save after insertion

### Phase 6: Usage Tracking (1 hour)
- [ ] Track helper_opened event
- [ ] Track helper_inserted event with metadata
- [ ] Log character count of situation description
- [ ] Test non-blocking behavior (insertion works if logging fails)

### Phase 7: Accessibility & Testing (2 hours)
- [ ] Add ARIA labels to text area
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
- ✅ SelfCompassionHelper component renders in today's journal entry
- ✅ Single text area for describing difficult situation
- ✅ "Add to Journal Entry" button inserts formatted HTML paragraphs (NOT Markdown)
- ✅ HTML format matches system pattern (`<p>text</p><p><br></p>` from `cbtDistortions.ts`)
- ✅ Three-step structure included: Mindfulness, Common Humanity, Self-Kindness
- ✅ **Content prepends to TOP of entry** (matches `JournalStream.tsx:424-425`)
- ✅ Helper collapses after successful insertion
- ✅ Journal entry auto-saves after insertion

### Data Requirements
- ✅ Helper usage tracked in `helper_usage` table
- ✅ Metadata includes: situation character count
- ✅ User isolation enforced by RLS policies
- ✅ Non-blocking logging (insertion works if database fails)

### UX Requirements
- ✅ User sees structured three-step framework (not blank page)
- ✅ Placeholder text provides guidance
- ✅ Satisfaction moment: complete compassion break appears after clicking button
- ✅ Mobile-friendly: works on phone/tablet

### Accessibility Requirements
- ✅ WCAG AA contrast ratios
- ✅ Keyboard navigation works (Tab, Enter, Escape)
- ✅ Screen reader announces field and state changes
- ✅ Touch targets >= 44x44px on mobile

### Quality Requirements
- ✅ No ESLint errors (`npm run lint`)
- ✅ Successful production build (`npm run build`)
- ✅ No console errors or warnings
- ✅ TypeScript strict mode passes

---

## Testing Checklist

### Manual Testing
- [ ] **Render Test**: Helper appears below Values Affirmation helper for today's entry
- [ ] **Form Interaction**: Text area accepts input and updates state
- [ ] **Insert Test**: Click "Add to Journal Entry" → HTML paragraphs appear in editor
- [ ] **HTML Rendering**: Journal entry displays formatted self-compassion break in SimpleRichEditor
- [ ] **Prepend Behavior**: Content appears at TOP of entry, not at cursor
- [ ] **Three-Step Structure**: Mindfulness, Common Humanity, Self-Kindness all present
- [ ] **Collapse Test**: Helper collapses after insertion
- [ ] **Empty State**: Button disabled when text area empty

### Responsive Testing
- [ ] **Desktop (>=1280px)**: Helper fits without horizontal scroll
- [ ] **Tablet (768px-1279px)**: Text area readable, button accessible
- [ ] **Mobile (<768px)**: Content stacks vertically, no overflow

### Accessibility Testing
- [ ] **Keyboard Navigation**: Tab through field, Enter to submit
- [ ] **Screen Reader**: VoiceOver/NVDA announces label and instructions
- [ ] **Focus Indicators**: Visible on all interactive elements
- [ ] **Touch Targets**: Tap buttons easily on mobile device

### Automated Testing
- [ ] `npm run lint`: No errors
- [ ] `npm run build`: Successful build
- [ ] Browser console: No errors or warnings

---

## Evidence & References

### Scientific Evidence
- **Neff (2003)**: Foundational self-compassion research
- **Meta-analysis**: d=0.47 effect size for well-being
- **Clinical applications**: Depression, anxiety, trauma, eating disorders
- **ACT framework**: Self-compassion supports psychological flexibility

### Kristin Neff's Self-Compassion Break
**Source**: https://self-compassion.org/exercise-2-self-compassion-break/

**Instructions**:
1. Think of a situation that's causing stress
2. Say to yourself: "This is a moment of suffering" (Mindfulness)
3. Say: "Suffering is part of life" (Common Humanity)
4. Say: "May I be kind to myself" (Self-Kindness)

**Key Insight**: You can customize phrases to feel natural. Examples:
- Mindfulness: "This is stressful" / "This hurts"
- Common Humanity: "I'm not alone" / "Everyone struggles"
- Self-Kindness: "May I accept myself as I am" / "May I be patient"

---

## Definition of Done

### Story-Level DoD
- ✅ All tasks completed and checkboxes marked [x]
- ✅ All acceptance criteria met
- ✅ SelfCompassionHelper component created and working
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
  - `/src/components/journal/helpers/SelfCompassionHelper.tsx` - Main component
- **Modified Files:**
  - `/src/types/helper.ts` - Add 'self-compassion' to HelperType union
  - `/src/components/journal/JournalStream.tsx` - Integrate SelfCompassionHelper

---

## Related Documentation

- **Issue**: [#66 - Evidence-Based Journaling Helpers Roadmap](https://github.com/levineam/Signum/issues/66)
- **Parent Epic**: Phase 2: Self-Regulation & Clinical Tools
- **Reference Implementation**: `/src/components/journal/helpers/CbtDistortions.tsx`
- **Helper Types**: `/src/types/helper.ts`
- **Kristin Neff's Practice**: https://self-compassion.org/exercise-2-self-compassion-break/
- **Evidence**: Neff (2003), meta-analysis showing d=0.47 effect size
