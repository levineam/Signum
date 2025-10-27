# Story 2.5.12: Loving-Kindness Meditation Helper

**Status:** 📋 READY FOR DEVELOPMENT
**Created:** 2025-10-26
**Updated:** 2025-10-26
**Issue:** #66
**Parent Epic:** Phase 3: Future-Oriented & Meaning
**Prerequisites:**
- Story 2.5.7 (Self-Compassion Helper) ✅ Complete - Related compassion practice
- Story 2.5.11 (PMR Helper) ✅ Complete
- shadcn/ui Card component (already available)

---

## Story

As a user,
I want a Loving-Kindness Meditation (LKM) helper that guides me through directing compassion toward different recipients,
so that I can cultivate positive emotions and social connection using metta meditation practice.

---

## Why This Matters

**Current State:**
- Users have self-compassion helper (compassion toward self)
- No helper for extending compassion to others
- Users struggle with difficult relationships
- Missing evidence-based tool for positive emotion cultivation

**Problems:**
- Social isolation and disconnection
- Difficulty feeling compassion for others (especially difficult people)
- Lack of structured compassion practice
- Missing intervention for negative social emotions

**Benefits:**
- **Strong evidence**: d=0.33 for positive emotions (Galante meta-analysis, 2014)
- **Complements self-compassion**: Self → Others progression
- **Simple structure**: 4 traditional recipients + traditional phrases
- **Social well-being**: Improves relationships and reduces prejudice
- **Clinical applications**: Depression, social anxiety, PTSD

---

## Scope

### In Scope
1. **Loving-Kindness Helper Component**
   - Dropdown to select recipient (Self, Loved One, Neutral Person, Difficult Person)
   - Optional text field to name the specific person
   - Auto-generated traditional metta phrases for selected recipient
   - Follows Card pattern (progressive disclosure with Explore button)

2. **Four Traditional Recipients** (classical metta progression)
   - **Self**: "May I be happy, may I be healthy, may I be safe, may I live with ease"
   - **Loved One**: Someone you care about deeply
   - **Neutral Person**: Someone you neither like nor dislike (cashier, neighbor)
   - **Difficult Person**: Someone you have conflict with (advanced practice)

3. **Traditional Metta Phrases** (adapted for each recipient)
   - May [recipient] be happy
   - May [recipient] be healthy
   - May [recipient] be safe
   - May [recipient] live with ease

4. **Insert Behavior**
   - "Add to Journal Entry" button
   - Formats as HTML paragraphs with recipient + four phrases
   - Prepends to TOP of journal entry (matches `JournalStream.tsx:424-425`)
   - Helper collapses after insert

5. **Integration**
   - Render in JournalStream for today's entry
   - Helper usage tracking (Supabase)
   - Mobile-responsive layout
   - Accessibility (WCAG AA)

### Out of Scope
- Guided audio meditation
- Timer functionality
- Custom phrase editing
- Progress tracking across recipients
- Multiple recipients per entry

---

## Deliverables

### 1. Create LovingKindnessHelper Component
**File:** `/src/components/journal/helpers/LovingKindnessHelper.tsx`

**Implementation:**
```tsx
'use client'

/**
 * Loving-Kindness Meditation Helper Component
 * Story 2.5.12: Evidence-based compassion cultivation
 *
 * Based on traditional Buddhist metta meditation
 * Research: Galante et al. (2014), Fredrickson et al. (2008)
 */

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown, ChevronUp } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createHelperUsage } from '@/lib/supabase/helpers'
import { HelperEvent } from '@/types/helper'

const RECIPIENTS = [
  'Self',
  'Loved One',
  'Neutral Person',
  'Difficult Person'
] as const

type Recipient = typeof RECIPIENTS[number]

interface LovingKindnessHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

export function LovingKindnessHelper({ entryId, userId, onInsert }: LovingKindnessHelperProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | ''>('')
  const [personName, setPersonName] = useState('')
  const exploreButtonRef = useRef<HTMLButtonElement>(null)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')
  const eventsRef = useRef<HelperEvent[]>([])

  // ... implementation details (follow CbtDistortions.tsx pattern)
}
```

**Acceptance:**
- ✅ Component renders with Card (rose/pink gradient: `bg-gradient-to-r from-rose-50 to-pink-50`)
- ✅ Progressive disclosure with Explore/Collapse button (follows CbtDistortions pattern)
- ✅ Dropdown with 4 recipient options
- ✅ Optional text input for person's name (except for "Self")
- ✅ Preview of generated metta phrases
- ✅ "Add to Journal Entry" button disabled if recipient not selected
- ✅ Form state management for dropdown + optional text input

---

### 2. Implement Recipient Selection & Name Input
**File:** `/src/components/journal/helpers/LovingKindnessHelper.tsx`

**Dropdown Behavior:**
- Use shadcn/ui Select component
- Required field (cannot be empty)
- Clear placeholder: "Choose a recipient for loving-kindness"
- Traditional progression order (Self → Loved → Neutral → Difficult)

**Name Input Behavior:**
- Optional Input field (shadcn/ui Input)
- Shows when recipient is not "Self"
- Placeholder changes based on recipient:
  - Loved One: "e.g., Mom, Alex, my partner"
  - Neutral Person: "e.g., the barista, my neighbor"
  - Difficult Person: "e.g., my colleague, [initials only for privacy]"
- Name is used in generated phrases if provided

**Acceptance:**
- ✅ Dropdown displays all 4 recipients
- ✅ Selection updates component state
- ✅ Name input appears for non-Self recipients
- ✅ Name input updates phrases dynamically (live preview)
- ✅ Screen reader announces selection and name input
- ✅ Keyboard navigation works (Arrow keys, Tab, Enter)

---

### 3. Implement Formatted HTML Insert
**File:** `/src/components/journal/helpers/LovingKindnessHelper.tsx`

**HTML Paragraph Format** (matching system behavior in `src/data/cbtDistortions.ts:98`):
```html
<p><strong>Loving-Kindness Meditation: [Recipient Name or Category]</strong></p>
<p><br></p>
<p>May [I/you/they] be happy.</p>
<p>May [I/you/they] be healthy.</p>
<p>May [I/you/they] be safe.</p>
<p>May [I/you/they] live with ease.</p>
<p><br></p>
```

**Pronoun Logic:**
- **Self**: "May I be happy..."
- **Loved One** (named): "May [Name] be happy..." or "May you be happy..."
- **Neutral Person** (named): "May [Name] be happy..." or "May you be happy..."
- **Difficult Person** (named): "May [Name] be happy..." or "May you be happy..."
- **Any recipient** (unnamed): "May they be happy..."

**Acceptance:**
- ✅ formatLovingKindness() generates correct HTML paragraphs (NOT Markdown)
- ✅ Recipient name or category in header
- ✅ Correct pronouns based on recipient and whether name provided
- ✅ All 4 traditional phrases included
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
    <ProgressiveMuscleRelaxationHelper {...} />
    <LovingKindnessHelper
      entryId={entry.id}
      userId={user.id}
      onInsert={(helperText) => handleHelperInsertion(entry.id, helperText)}
    />
  </>
)}
```

**Acceptance:**
- ✅ Helper renders below PMR helper for today's entry only
- ✅ handleHelperInsertion() receives formatted HTML text
- ✅ **Text prepends to TOP of entry** (matches system behavior at `JournalStream.tsx:424-425`)
- ✅ Entry auto-saves after insertion

---

### 5. Implement Helper Usage Tracking
**File:** `/src/components/journal/helpers/LovingKindnessHelper.tsx`

**Track Events:**
- `helper_opened`: When user expands helper
- `helper_selection`: When recipient is selected from dropdown
- `helper_inserted`: When user clicks "Add to Journal Entry"

**Metadata:**
- Selected recipient category (Self, Loved One, Neutral, Difficult)
- Whether person name was provided
- Character count of name (if provided)

**Acceptance:**
- ✅ Usage logged to `helper_usage` table
- ✅ Metadata includes: recipient category, whether named
- ✅ Non-blocking (doesn't prevent insertion if logging fails)
- ✅ RLS policies enforce user isolation

---

### 6. Accessibility & Mobile Responsiveness
**Files:** `/src/components/journal/helpers/LovingKindnessHelper.tsx`

**Accessibility:**
- ARIA labels for dropdown and name input
- Live region announcements for selection and phrase preview
- Keyboard navigation (Tab, Arrow keys, Enter, Escape)
- Screen reader tested

**Mobile:**
- Touch-friendly dropdown and input
- Responsive spacing (stacked on mobile)
- No horizontal scroll
- "Add to Journal Entry" button always visible

**Acceptance:**
- ✅ WCAG AA contrast ratios
- ✅ Keyboard-only navigation works
- ✅ Screen reader announces recipient selection and generated phrases
- ✅ Mobile viewport (<768px) tested on real device

---

## Technical Implementation Notes

### Traditional Metta Meditation Structure

**Classical Progression (in order of difficulty):**
1. **Self** - Easiest, foundation for extending to others
2. **Loved One** - Someone easy to feel compassion for
3. **Neutral Person** - Builds equanimity
4. **Difficult Person** - Most challenging, most transformative

**Why This Order:**
- Must cultivate self-compassion before extending to others
- Practice on easy targets before difficult ones
- Builds capacity gradually

### Metta Phrases Variations

**Traditional Four Phrases:**
- May [recipient] be happy
- May [recipient] be healthy
- May [recipient] be safe
- May [recipient] live with ease

**Alternative Phrases** (for future enhancement):
- May [recipient] be peaceful
- May [recipient] be strong
- May [recipient] be free from suffering
- May [recipient] be filled with loving-kindness

### Implementation Notes

**Pronoun Selection Logic:**
```typescript
function getPronoun(recipient: Recipient, hasName: boolean): string {
  if (recipient === 'Self') return 'I'
  if (hasName) return 'you' // Direct address when named
  return 'they' // Generic when unnamed
}

function formatPhrase(pronoun: string, wish: string): string {
  if (pronoun === 'I') {
    return `May I ${wish}.`
  }
  return `May ${pronoun} ${wish}.`
}
```

### Database Migration Required

⚠️ **BLOCKING**: Before implementing this story, the database CHECK constraint must be updated.

**Required Migration** (create new file: `supabase/migrations/YYYYMMDDHHMMSS_add_loving_kindness_helper_type.sql`):
```sql
-- Add 'loving-kindness' to helper_type CHECK constraint
ALTER TABLE helper_usage
DROP CONSTRAINT valid_helper_type;

ALTER TABLE helper_usage
ADD CONSTRAINT valid_helper_type CHECK (
  helper_type IN ('cbt-distortions', 'gentle-prompt', 'gratitude', 'values-affirmation', 'self-compassion', 'woop', 'best-possible-self', 'savoring', 'pmr', 'loving-kindness')
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
  | 'loving-kindness'  // 🆕 Story 2.5.12

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
  'loving-kindness': 'Loving-Kindness Meditation'  // 🆕
}

// STEP 3: Extend HelperUsageMetadata for loving-kindness-specific fields
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

  // 🆕 Loving-Kindness helper fields (Story 2.5.12)
  lkmRecipient?: 'Self' | 'Loved One' | 'Neutral Person' | 'Difficult Person'
  lkmPersonNamed?: boolean        // Whether user provided a name
  lkmNameLength?: number          // Character count of name (if provided)
}
```

---

## Tasks

### Phase 0: Database Migration (30 min) ⚠️ PREREQUISITE
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_loving_kindness_helper_type.sql`
- [ ] Add 'loving-kindness' to valid_helper_type CHECK constraint
- [ ] Test migration on local Supabase: `supabase db reset`
- [ ] Verify constraint allows 'loving-kindness' value
- [ ] Push migration to dev environment

### Phase 1: Type System Updates (30 min)
- [ ] Add `'loving-kindness'` to HelperType union in `/src/types/helper.ts`
- [ ] Add 'Loving-Kindness Meditation' to HELPER_TYPE_LABELS
- [ ] Extend HelperUsageMetadata interface with LKM fields:
  - `lkmRecipient?: 'Self' | 'Loved One' | 'Neutral Person' | 'Difficult Person'`
  - `lkmPersonNamed?: boolean`
  - `lkmNameLength?: number`
- [ ] Verify TypeScript compiles without errors

### Phase 2: Component Setup (1 hour)
- [ ] Create `/src/components/journal/helpers/LovingKindnessHelper.tsx`
- [ ] Set up component with Card (rose/pink gradient: `from-rose-50 to-pink-50`)
- [ ] Implement progressive disclosure UI (Explore/Collapse button) following `CbtDistortions.tsx:34-74`
- [ ] Define RECIPIENTS constant (4 recipients)
- [ ] Initialize form state (selectedRecipient, personName)

### Phase 3: Form UI (2-3 hours)
- [ ] Add descriptive header explaining loving-kindness meditation
- [ ] Implement recipient dropdown (shadcn/ui Select) with 4 options
- [ ] Add conditional Input field for person name (shows for non-Self recipients)
- [ ] Implement live preview of generated metta phrases
- [ ] Add guidance text explaining traditional progression (Self → Loved → Neutral → Difficult)
- [ ] Implement "Add to Journal Entry" button (disabled until recipient selected)

### Phase 4: HTML Formatting (1 hour)
- [ ] Implement formatLovingKindness() function to generate HTML paragraphs
- [ ] Implement pronoun selection logic (I/you/they)
- [ ] Include recipient name or category in header
- [ ] Generate all 4 traditional metta phrases
- [ ] Follow existing pattern from `cbtDistortions.ts:formatDistortionReflection()`: `<p>text</p><p><br></p>`
- [ ] Test HTML rendering in SimpleRichEditor

### Phase 5: Integration (1 hour)
- [ ] Add LovingKindnessHelper to JournalStream (below PMR helper)
- [ ] Wire onInsert to handleHelperInsertion with entry ID: `(helperText) => handleHelperInsertion(entry.id, helperText)`
- [ ] **Test insertion prepends to TOP** (system behavior, not cursor insertion)
- [ ] Verify helper collapses after insertion
- [ ] Test entry auto-save after insertion

### Phase 6: Usage Tracking (1 hour)
- [ ] Track helper_opened event
- [ ] Track helper_selection event (recipient chosen)
- [ ] Track helper_inserted event with metadata
- [ ] Log selected recipient category
- [ ] Log whether person was named
- [ ] Log name character count (if provided)
- [ ] Test non-blocking behavior (insertion works if logging fails)

### Phase 7: Accessibility & Testing (2 hours)
- [ ] Add ARIA labels to dropdown and name input
- [ ] Implement live region for announcements (follow `CbtDistortions.tsx:37-52`)
- [ ] Add Explore button ref and focus management (follow `CbtDistortions.tsx:36, 70-73`)
- [ ] Test keyboard navigation (Tab, Arrow keys, Enter, Escape)
- [ ] Test Escape key collapses helper (follow `CbtDistortions.tsx` pattern if implemented)
- [ ] Test screen reader (dropdown, name input, phrase preview)
- [ ] Test mobile responsiveness (<768px)
- [ ] Test touch targets on mobile device
- [ ] Run ESLint: `npm run lint`
- [ ] Build verification: `npm run build`

---

## Acceptance Criteria

### Functional Requirements
- ✅ LovingKindnessHelper component renders in today's journal entry
- ✅ Dropdown with 4 recipient options (Self, Loved One, Neutral Person, Difficult Person)
- ✅ Optional name input field (appears for non-Self recipients)
- ✅ Live preview of generated metta phrases
- ✅ **Button Enablement Rule**: "Add to Journal Entry" button is disabled UNLESS:
  - A recipient is selected from dropdown (name is optional)
- ✅ "Add to Journal Entry" inserts formatted HTML paragraphs (NOT Markdown)
- ✅ HTML format matches system pattern (`<p>text</p><p><br></p>` from `cbtDistortions.ts`)
- ✅ Correct pronouns used (I/you/they) based on recipient and whether named
- ✅ All 4 traditional metta phrases included
- ✅ **Content prepends to TOP of entry** (matches `JournalStream.tsx:424-425`)
- ✅ Helper collapses after successful insertion
- ✅ Journal entry auto-saves after insertion

### Data Requirements
- ✅ Helper usage tracked in `helper_usage` table
- ✅ Metadata includes: recipient category, whether named, name length
- ✅ User isolation enforced by RLS policies
- ✅ Non-blocking logging (insertion works if database fails)

### UX Requirements
- ✅ Clear recipient options (traditional progression order)
- ✅ Optional name field for personalization
- ✅ Live preview shows generated phrases before insertion
- ✅ Guidance explains traditional metta progression
- ✅ Satisfaction moment: formatted meditation appears after clicking button
- ✅ Mobile-friendly: works on phone/tablet

### Accessibility Requirements
- ✅ WCAG AA contrast ratios
- ✅ Keyboard navigation works (Tab, Arrow keys, Enter, Escape)
- ✅ Screen reader announces recipient selection and generated phrases
- ✅ Touch targets >= 44x44px on mobile

### Quality Requirements
- ✅ No ESLint errors (`npm run lint`)
- ✅ Successful production build (`npm run build`)
- ✅ No console errors or warnings
- ✅ TypeScript strict mode passes

---

## Testing Checklist

### Manual Testing
- [ ] **Dropdown**: All 4 recipients appear, selection works
- [ ] **Name Input**: Appears for non-Self recipients, updates phrases
- [ ] **Live Preview**: Phrases update when recipient or name changes
- [ ] **Pronoun Logic**: Correct pronouns (I/you/they) for each scenario
- [ ] **Insert**: HTML paragraphs appear with correct phrases
- [ ] **HTML Rendering**: Journal entry displays formatted meditation
- [ ] **Prepend Behavior**: Content appears at TOP of entry, not at cursor
- [ ] **Collapse**: Helper collapses after insertion
- [ ] **Disabled State**: Button disabled until recipient selected
- [ ] **Name Optional**: Works with or without name provided

### Accessibility Testing
- [ ] **Keyboard**: Tab through dropdown and input, Arrow keys in dropdown
- [ ] **Screen Reader**: Announces recipient, name input, and phrase preview
- [ ] **Touch Targets**: Easy to tap on mobile

### Automated Testing
- [ ] `npm run lint`: Pass
- [ ] `npm run build`: Success
- [ ] Browser console: No errors

---

## Evidence & References

### Scientific Evidence
- **Galante et al. (2014)**: Meta-analysis showing d=0.33 for positive emotions
- **Fredrickson et al. (2008)**: LKM builds positive emotions and social resources
- **Clinical applications**: Depression, social anxiety, PTSD, chronic pain
- **Social benefits**: Reduces implicit bias, increases prosocial behavior

### Loving-Kindness Meditation Research
**Source**: Galante, J., et al. (2014). Loving-kindness meditation for chronic pain. *Trials*, 15(1), 285.

**Key Findings**:
- Increases positive emotions (d=0.33)
- Improves social connections
- Reduces self-criticism
- Effective with 10-15 minutes daily practice
- Progressive difficulty (Self → Difficult Person)

**Traditional Structure**:
- Start with self (foundation)
- Extend to loved ones (easy)
- Practice on neutral people (equanimity)
- Eventually include difficult people (advanced)

**Four Classical Phrases**:
- May [recipient] be happy
- May [recipient] be healthy
- May [recipient] be safe
- May [recipient] live with ease

---

## Definition of Done

### Story-Level DoD
- ✅ All tasks completed and checkboxes marked [x]
- ✅ All acceptance criteria met
- ✅ LovingKindnessHelper component created and working
- ✅ Helper integrated into JournalStream
- ✅ HTML paragraph insertion working (prepends to top)
- ✅ Pronoun logic working correctly
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
  - `/src/components/journal/helpers/LovingKindnessHelper.tsx` - Main component
- **Modified Files:**
  - `/src/types/helper.ts` - Add 'loving-kindness' to HelperType union
  - `/src/components/journal/JournalStream.tsx` - Integrate LovingKindnessHelper

---

## Related Documentation

- **Issue**: [#66 - Evidence-Based Journaling Helpers Roadmap](https://github.com/levineam/Signum/issues/66)
- **Parent Epic**: Phase 3: Future-Oriented & Meaning
- **Reference Implementation**: `/src/components/journal/helpers/CbtDistortions.tsx`
- **Similar Pattern**: Story 2.5.6 (Values Affirmation) - dropdown + generated output
- **Helper Types**: `/src/types/helper.ts`
- **Evidence**: Galante et al. (2014), Fredrickson et al. (2008)
- **Complements**: Story 2.5.7 (Self-Compassion) - extends compassion to others

---

## QA Results

- **Gate:** PASS
- **Review Date:** 2025-10-26
- **Notes:** Dropdown + optional name input reuse existing helper patterns; inline gradients remain acceptable. Telemetry fields (`lkmRecipient`, `lkmPersonNamed`, `lkmNameLength`) are already covered by the consolidated helper migration (`20251026093000_extend_helper_types_phase2.sql`) and the expanded TypeScript definitions, so implementation can begin without further DB updates.
