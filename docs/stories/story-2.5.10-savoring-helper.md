# Story 2.5.10: Savoring Helper

**Status:** 📋 READY FOR DEVELOPMENT
**Created:** 2025-10-26
**Updated:** 2025-10-26
**Issue:** #66
**Parent Epic:** Phase 3: Future-Oriented & Meaning
**Prerequisites:**
- Story 2.5.5 (Gratitude Helper) ✅ Complete - Similar positive psychology focus
- Story 2.5.9 (Best Possible Self Helper) ✅ Complete
- shadcn/ui Card component (already available)

---

## Story

As a user,
I want a savoring helper that guides me through evidence-based strategies for amplifying positive experiences,
so that I can extract more joy and meaning from good moments in my life.

---

## Why This Matters

**Current State:**
- Users have gratitude helper (reflects on past positives)
- No helper for actively enhancing positive experiences in the present
- Users miss opportunities to deepen joy and satisfaction
- Missing evidence-based tool for positive emotion regulation

**Problems:**
- Positive experiences pass quickly without full appreciation
- Users don't know how to actively savor moments
- Hedonic adaptation diminishes joy over time
- Lack of structured savoring practice

**Benefits:**
- **Strong evidence**: d=0.32 effect size for well-being (Bryant meta-analysis)
- **Complements gratitude**: Gratitude = past, Savoring = present/future
- **Simple structure**: Choose strategy + reflect on application
- **Immediate applicability**: Can be used during or after positive events
- **Clinical applications**: Depression treatment, anhedonia (inability to feel pleasure)

---

## Scope

### In Scope
1. **Savoring Helper Component**
   - Dropdown to select savoring strategy (8 options)
   - Single text area to describe savoring experience
   - Based on Bryant & Veroff's savoring research
   - Follows Card pattern (progressive disclosure with Explore button)

2. **Eight Savoring Strategies**
   - **Sharing with others**: Tell someone about the good experience
   - **Memory building**: Take mental photograph or physical memento
   - **Self-congratulation**: Take credit for making it happen
   - **Sensory-perceptual sharpening**: Focus on senses (sight, sound, taste, touch, smell)
   - **Comparison**: Compare to less positive alternatives (counting blessings)
   - **Temporal awareness**: Remind yourself this won't last forever
   - **Absorption**: Get fully immersed, lose track of time
   - **Behavioral expression**: Show physical expressions of joy (smile, laugh, jump)

3. **Insert Behavior**
   - "Add to Journal Entry" button
   - Formats as HTML paragraphs with selected strategy + reflection
   - Prepends to TOP of journal entry (matches `JournalStream.tsx:424-425`)
   - Helper collapses after insert

4. **Integration**
   - Render in JournalStream for today's entry
   - Helper usage tracking (Supabase)
   - Mobile-responsive layout
   - Accessibility (WCAG AA)

### Out of Scope
- Multiple strategy selection (one at a time)
- Progress tracking across savoring exercises
- Reminders to savor scheduled positive events
- AI-suggested savoring strategies based on context
- Photo/media attachment for memory building

---

## Deliverables

### 1. Create SavoringHelper Component
**File:** `/src/components/journal/helpers/SavoringHelper.tsx`

**Implementation:**
```tsx
'use client'

/**
 * Savoring Helper Component
 * Story 2.5.10: Evidence-based positive experience amplification
 *
 * Based on Fred Bryant & Joseph Veroff's savoring research
 * "Savoring: A New Model of Positive Experience" (2007)
 */

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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

const SAVORING_STRATEGIES = [
  'Sharing with Others',
  'Memory Building',
  'Self-Congratulation',
  'Sensory-Perceptual Sharpening',
  'Comparison',
  'Temporal Awareness',
  'Absorption',
  'Behavioral Expression'
] as const

type SavoringStrategy = typeof SAVORING_STRATEGIES[number]

interface SavoringHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

export function SavoringHelper({ entryId, userId, onInsert }: SavoringHelperProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<SavoringStrategy | ''>('')
  const [reflection, setReflection] = useState('')
  const exploreButtonRef = useRef<HTMLButtonElement>(null)
  const [liveRegionMessage, setLiveRegionMessage] = useState('')
  const eventsRef = useRef<HelperEvent[]>([])

  // ... implementation details (follow CbtDistortions.tsx pattern)
}
```

**Acceptance:**
- ✅ Component renders with Card (pink/rose gradient: `bg-gradient-to-r from-pink-50 to-rose-50`)
- ✅ Progressive disclosure with Explore/Collapse button (follows CbtDistortions pattern)
- ✅ Dropdown with 8 savoring strategies
- ✅ Text area for describing savoring experience
- ✅ "Add to Journal Entry" button disabled if strategy not selected
- ✅ Form state management for dropdown + text area

---

### 2. Implement Savoring Strategy Dropdown
**File:** `/src/components/journal/helpers/SavoringHelper.tsx`

**Dropdown Behavior:**
- Use shadcn/ui Select component
- Required field (cannot be empty)
- Clear placeholder: "Choose a savoring strategy"
- Options ordered by commonality/ease

**Strategy Descriptions** (show on hover or in guidance text):
- **Sharing with Others**: Tell someone about this positive experience
- **Memory Building**: Create a mental snapshot or keep a memento
- **Self-Congratulation**: Acknowledge your role in making this happen
- **Sensory Sharpening**: Focus on what you see, hear, smell, taste, or touch
- **Comparison**: Think about how this could have been less positive
- **Temporal Awareness**: Remind yourself this moment is fleeting
- **Absorption**: Lose yourself completely in the experience
- **Behavioral Expression**: Let yourself smile, laugh, or physically express joy

**Acceptance:**
- ✅ Dropdown displays all 8 strategies
- ✅ Selection updates component state
- ✅ Screen reader announces selected strategy
- ✅ Keyboard navigation works (Arrow keys, Enter)

---

### 3. Implement Formatted HTML Insert
**File:** `/src/components/journal/helpers/SavoringHelper.tsx`

**HTML Paragraph Format** (matching system behavior in `src/data/cbtDistortions.ts:98`):
```html
<p><strong>Savoring: [Selected Strategy]</strong></p>
<p><br></p>
<p>[User's reflection]</p>
<p><br></p>
```

**Acceptance:**
- ✅ formatSavoringEntry() generates correct HTML paragraphs (NOT Markdown)
- ✅ Selected strategy appears in header
- ✅ User's reflection text integrated
- ✅ Empty text area handled gracefully (allow insertion with just strategy selection)
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
    <SavoringHelper
      entryId={entry.id}
      userId={user.id}
      onInsert={(helperText) => handleHelperInsertion(entry.id, helperText)}
    />
  </>
)}
```

**Acceptance:**
- ✅ Helper renders below Best Possible Self helper for today's entry only
- ✅ handleHelperInsertion() receives formatted HTML text
- ✅ **Text prepends to TOP of entry** (matches system behavior at `JournalStream.tsx:424-425`)
- ✅ Entry auto-saves after insertion

---

### 5. Implement Helper Usage Tracking
**File:** `/src/components/journal/helpers/SavoringHelper.tsx`

**Track Events:**
- `helper_opened`: When user expands helper
- `helper_selection`: When savoring strategy is selected from dropdown
- `helper_inserted`: When user clicks "Add to Journal Entry"

**Metadata:**
- Selected strategy name
- Character count of reflection
- Whether reflection field was filled (vs. strategy-only insertion)

**Acceptance:**
- ✅ Usage logged to `helper_usage` table
- ✅ Metadata includes: selected strategy, reflection character count
- ✅ Non-blocking (doesn't prevent insertion if logging fails)
- ✅ RLS policies enforce user isolation

---

### 6. Accessibility & Mobile Responsiveness
**Files:** `/src/components/journal/helpers/SavoringHelper.tsx`

**Accessibility:**
- ARIA labels for dropdown and text area
- Live region announcements for state changes
- Keyboard navigation (Tab, Arrow keys, Enter, Escape)
- Screen reader tested

**Mobile:**
- Touch-friendly dropdown and text area
- Responsive spacing (stacked on mobile)
- No horizontal scroll
- "Add to Journal Entry" button always visible

**Acceptance:**
- ✅ WCAG AA contrast ratios
- ✅ Keyboard-only navigation works
- ✅ Screen reader announces dropdown options and field labels
- ✅ Mobile viewport (<768px) tested on real device

---

## Technical Implementation Notes

### Bryant & Veroff's Savoring Strategies

**Research-Based Categories:**

1. **Sharing with Others** - Social savoring increases joy
2. **Memory Building** - Creating lasting reminders
3. **Self-Congratulation** - Acknowledging personal agency
4. **Sensory-Perceptual Sharpening** - Mindful attention to sensations
5. **Comparison** - Appreciating through contrast
6. **Temporal Awareness** - Recognizing impermanence
7. **Absorption** - Full immersion in experience
8. **Behavioral Expression** - Physical manifestation of joy

### Implementation Strategy

**Button Enablement Rule:**
- Disabled: No strategy selected
- Enabled: Strategy selected (reflection optional)
- Rationale: Strategy selection alone has value, reflection enhances it

**Strategy Ordering:**
Most accessible/common first:
1. Sharing with Others
2. Memory Building
3. Sensory-Perceptual Sharpening
4. Behavioral Expression
5. Self-Congratulation
6. Absorption
7. Temporal Awareness
8. Comparison

### Database Migration Required

⚠️ **BLOCKING**: Before implementing this story, the database CHECK constraint must be updated.

**Required Migration** (create new file: `supabase/migrations/YYYYMMDDHHMMSS_add_savoring_helper_type.sql`):
```sql
-- Add 'savoring' to helper_type CHECK constraint
ALTER TABLE helper_usage
DROP CONSTRAINT valid_helper_type;

ALTER TABLE helper_usage
ADD CONSTRAINT valid_helper_type CHECK (
  helper_type IN ('cbt-distortions', 'gentle-prompt', 'gratitude', 'values-affirmation', 'self-compassion', 'woop', 'best-possible-self', 'savoring')
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
  | 'savoring'  // 🆕 Story 2.5.10

// STEP 2: Update labels
export const HELPER_TYPE_LABELS: Record<HelperType, string> = {
  'cbt-distortions': 'CBT Cognitive Distortions',
  'gratitude': 'Three Good Things',
  'values-affirmation': 'Values Affirmation',
  'self-compassion': 'Self-Compassion Break',
  'woop': 'WOOP Goal Planning',
  'best-possible-self': 'Best Possible Self',
  'savoring': 'Savoring Practice'  // 🆕
}

// STEP 3: Extend HelperUsageMetadata for savoring-specific fields
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

  // 🆕 Savoring helper fields (Story 2.5.10)
  savoringStrategy?: string           // Which strategy was chosen
  reflectionCharacterCount?: number   // Length of reflection (if provided)
  hasReflection?: boolean             // Whether user wrote reflection or just selected strategy
}
```

---

## Tasks

### Phase 0: Database Migration (30 min) ⚠️ PREREQUISITE
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_savoring_helper_type.sql`
- [ ] Add 'savoring' to valid_helper_type CHECK constraint
- [ ] Test migration on local Supabase: `supabase db reset`
- [ ] Verify constraint allows 'savoring' value
- [ ] Push migration to dev environment

### Phase 1: Type System Updates (30 min)
- [ ] Add `'savoring'` to HelperType union in `/src/types/helper.ts`
- [ ] Add 'Savoring Practice' to HELPER_TYPE_LABELS
- [ ] Extend HelperUsageMetadata interface with savoring fields:
  - `savoringStrategy?: string`
  - `reflectionCharacterCount?: number`
  - `hasReflection?: boolean`
- [ ] Verify TypeScript compiles without errors

### Phase 2: Component Setup (1 hour)
- [ ] Create `/src/components/journal/helpers/SavoringHelper.tsx`
- [ ] Set up component with Card (pink/rose gradient: `from-pink-50 to-rose-50`)
- [ ] Implement progressive disclosure UI (Explore/Collapse button) following `CbtDistortions.tsx:34-74`
- [ ] Define SAVORING_STRATEGIES constant (8 strategies)
- [ ] Initialize form state (selectedStrategy, reflection)

### Phase 3: Form UI (2 hours)
- [ ] Add descriptive header explaining savoring practice
- [ ] Implement strategy dropdown (shadcn/ui Select) with all 8 options
- [ ] Add brief descriptions for each strategy (tooltip or guidance text)
- [ ] Add Textarea for reflection with placeholder: "How did you apply this strategy?"
- [ ] Add guidance text: "Choose a strategy you used (or want to try) to savor a positive moment"
- [ ] Implement "Add to Journal Entry" button (disabled until strategy selected)

### Phase 4: HTML Formatting (30 min)
- [ ] Implement formatSavoringEntry() function to generate HTML paragraphs
- [ ] Include strategy name in header
- [ ] Handle optional reflection text
- [ ] Follow existing pattern from `cbtDistortions.ts:formatDistortionReflection()`: `<p>text</p><p><br></p>`
- [ ] Test HTML rendering in SimpleRichEditor

### Phase 5: Integration (1 hour)
- [ ] Add SavoringHelper to JournalStream (below Best Possible Self helper)
- [ ] Wire onInsert to handleHelperInsertion with entry ID: `(helperText) => handleHelperInsertion(entry.id, helperText)`
- [ ] **Test insertion prepends to TOP** (system behavior, not cursor insertion)
- [ ] Verify helper collapses after insertion
- [ ] Test entry auto-save after insertion

### Phase 6: Usage Tracking (1 hour)
- [ ] Track helper_opened event
- [ ] Track helper_selection event (strategy chosen)
- [ ] Track helper_inserted event with metadata
- [ ] Log selected strategy name
- [ ] Log reflection character count (if provided)
- [ ] Log whether reflection was written
- [ ] Test non-blocking behavior (insertion works if logging fails)

### Phase 7: Accessibility & Testing (2 hours)
- [ ] Add ARIA labels to dropdown and text area
- [ ] Implement live region for announcements (follow `CbtDistortions.tsx:37-52`)
- [ ] Add Explore button ref and focus management (follow `CbtDistortions.tsx:36, 70-73`)
- [ ] Test keyboard navigation (Tab, Arrow keys, Enter, Escape)
- [ ] Test Escape key collapses helper (follow `CbtDistortions.tsx` pattern if implemented)
- [ ] Test screen reader (dropdown and text area)
- [ ] Test mobile responsiveness (<768px)
- [ ] Test touch targets on mobile device
- [ ] Run ESLint: `npm run lint`
- [ ] Build verification: `npm run build`

---

## Acceptance Criteria

### Functional Requirements
- ✅ SavoringHelper component renders in today's journal entry
- ✅ Dropdown with 8 savoring strategies
- ✅ Text area for optional reflection
- ✅ **Button Enablement Rule**: "Add to Journal Entry" button is disabled UNLESS:
  - A strategy is selected from dropdown (reflection is optional)
- ✅ "Add to Journal Entry" inserts formatted HTML paragraphs (NOT Markdown)
- ✅ HTML format matches system pattern (`<p>text</p><p><br></p>` from `cbtDistortions.ts`)
- ✅ **Content prepends to TOP of entry** (matches `JournalStream.tsx:424-425`)
- ✅ Helper collapses after successful insertion
- ✅ Journal entry auto-saves after insertion

### Data Requirements
- ✅ Helper usage tracked in `helper_usage` table
- ✅ Metadata includes: selected strategy, reflection character count, hasReflection flag
- ✅ User isolation enforced by RLS policies
- ✅ Non-blocking logging (insertion works if database fails)

### UX Requirements
- ✅ Clear strategy options (8 research-based strategies)
- ✅ Guidance text helps user understand each strategy
- ✅ Reflection is optional (strategy selection alone has value)
- ✅ Satisfaction moment: formatted entry appears after clicking button
- ✅ Mobile-friendly: works on phone/tablet

### Accessibility Requirements
- ✅ WCAG AA contrast ratios
- ✅ Keyboard navigation works (Tab, Arrow keys, Enter, Escape)
- ✅ Screen reader announces dropdown options and labels
- ✅ Touch targets >= 44x44px on mobile

### Quality Requirements
- ✅ No ESLint errors (`npm run lint`)
- ✅ Successful production build (`npm run build`)
- ✅ No console errors or warnings
- ✅ TypeScript strict mode passes

---

## Testing Checklist

### Manual Testing
- [ ] **Dropdown**: All 8 strategies appear, selection works
- [ ] **Reflection**: Text area is optional, works when filled or empty
- [ ] **Insert**: HTML paragraphs appear with strategy name in header
- [ ] **HTML Rendering**: Journal entry displays formatted savoring entry
- [ ] **Prepend Behavior**: Content appears at TOP of entry, not at cursor
- [ ] **Collapse**: Helper collapses after insertion
- [ ] **Disabled State**: Button disabled until strategy selected
- [ ] **Strategy Only**: Works if user selects strategy but doesn't write reflection

### Accessibility Testing
- [ ] **Keyboard**: Tab through dropdown and text area, Arrow keys in dropdown
- [ ] **Screen Reader**: Announces strategy selection and field labels
- [ ] **Touch Targets**: Easy to tap on mobile

### Automated Testing
- [ ] `npm run lint`: Pass
- [ ] `npm run build`: Success
- [ ] Browser console: No errors

---

## Evidence & References

### Scientific Evidence
- **Bryant & Veroff (2007)**: "Savoring: A New Model of Positive Experience"
- **Meta-analysis**: d=0.32 effect size for well-being
- **Clinical applications**: Depression, anhedonia, life satisfaction
- **Complements gratitude**: Gratitude (past), Savoring (present/future)

### Savoring Strategies Research
**Source**: Bryant, F. B., & Veroff, J. (2007). *Savoring: A new model of positive experience.* Psychology Press.

**Key Findings**:
- Different strategies work for different people
- Combining strategies increases effectiveness
- Sharing with others is most powerful for many people
- Temporal awareness creates bittersweet appreciation
- Behavioral expression amplifies positive emotions

---

## Definition of Done

### Story-Level DoD
- ✅ All tasks completed and checkboxes marked [x]
- ✅ All acceptance criteria met
- ✅ SavoringHelper component created and working
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
  - `/src/components/journal/helpers/SavoringHelper.tsx` - Main component
- **Modified Files:**
  - `/src/types/helper.ts` - Add 'savoring' to HelperType union
  - `/src/components/journal/JournalStream.tsx` - Integrate SavoringHelper

---

## Related Documentation

- **Issue**: [#66 - Evidence-Based Journaling Helpers Roadmap](https://github.com/levineam/Signum/issues/66)
- **Parent Epic**: Phase 3: Future-Oriented & Meaning
- **Reference Implementation**: `/src/components/journal/helpers/CbtDistortions.tsx`
- **Similar Pattern**: Story 2.5.6 (Values Affirmation) - dropdown + text area
- **Helper Types**: `/src/types/helper.ts`
- **Evidence**: Bryant & Veroff (2007)
- **Complements**: Story 2.5.5 (Gratitude) - gratitude = past, savoring = present
