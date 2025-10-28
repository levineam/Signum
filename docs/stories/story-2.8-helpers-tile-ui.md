# Story 2.8: Convert Helpers to Compact Tile-Based UI

**Status:** 📋 DRAFT
**Created:** 2025-10-28
**Updated:** 2025-10-28
**Issue:** #92
**Prerequisites:**
- HelperContainer component (already available)
- All existing helpers implemented (Stories 2.5.x) ✅

---

## Story

As a user,
I want helpers displayed in a compact tile-based grid instead of full-width rows,
so that I can see all available helpers at once without excessive scrolling.

---

## Why This Matters

**Current State:**
- Each helper occupies full-width row with expand/collapse mechanism
- Helpers stack vertically, creating cluttered interface
- Users must scroll through many collapsed helpers
- No quick overview of all available helper types

**Problems:**
- Excessive vertical space consumption
- Difficult to scan available helpers at a glance
- Interface feels cluttered with 7+ helpers
- Each helper title/header takes up ~60px of vertical space

**Benefits:**
- **Reduced vertical space**: Grid layout vs stacked rows
- **Scannable overview**: See all helpers at once (3 per row on desktop)
- **Modern UI**: Tile-based cards are contemporary pattern
- **Maintains functionality**: Modal preserves full helper content
- **Better mobile experience**: Responsive grid (1-3 columns based on viewport)

---

## Scope

### In Scope
1. **Meta-Helper Container**
   - Wrapping container for all helper tiles
   - Header: "Need help journaling? Check out our helpers."
   - Grid layout: 3 tiles per row (desktop), responsive on mobile

2. **Helper Tiles**
   - Compact card design with shortened title
   - Click entire tile to open modal
   - Icon/visual indicator per helper type
   - Grid responsive: 3 cols (desktop), 2 cols (tablet), 1 col (mobile)

3. **Title Shortening**
   - "Have you experienced distorted thinking today?" → **"Distorted Thoughts"**
   - "What went well today?" → **"3 Good Things"**
   - "What matters most to you?" → **"Values"**
   - "Give yourself some kindness" → **"Self-Compassion"**
   - "Plan a goal with WOOP" → **"WOOP Goals"**
   - "Imagine your best possible self" → **"Best Possible Self"**
   - "Savor positive experiences" → **"Savoring"**

4. **Modal Implementation**
   - Opens when tile is clicked
   - Displays full helper content (existing HelperContainer children)
   - Close button (X) and backdrop click to dismiss
   - Keyboard navigation (Escape to close)

5. **Accessibility**
   - ARIA labels for tiles and modal
   - Keyboard navigation (Tab, Enter, Escape)
   - Focus management (trap focus in modal)
   - Screen reader announces modal open/close

### Out of Scope
- Reordering/customizing helper tiles
- Favoriting/pinning specific helpers
- Helper usage statistics in tiles
- Animated tile transitions
- Drag-and-drop tile reordering
- User preferences for grid layout

---

## Deliverables

### 1. Create HelperTileGrid Component
**File:** `/src/components/journal/helpers/HelperTileGrid.tsx`

**Implementation:**
```tsx
'use client'

/**
 * HelperTileGrid Component
 * Story 2.8: Tile-based helper UI
 *
 * Displays helpers as compact tiles in responsive grid.
 * Clicking tile opens modal with full helper content.
 */

import { ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { HelperType } from '@/types/helper'

export interface HelperTile {
  helperType: HelperType
  title: string           // Shortened title for tile display
  icon?: ReactNode        // Optional icon/emoji for visual identity
  variant: 'default' | 'blue' | 'green' | 'purple' | 'pink'
  content: ReactNode      // Full helper content (for modal)
}

interface HelperTileGridProps {
  tiles: HelperTile[]
  onTileClick: (tile: HelperTile) => void
}

export function HelperTileGrid({ tiles, onTileClick }: HelperTileGridProps) {
  // Grid: 3 cols desktop (lg), 2 cols tablet (sm-md), 1 col mobile
  // ... implementation
}
```

**Acceptance:**
- ✅ Grid layout: 3 tiles per row on desktop (>=1024px)
- ✅ Grid layout: 2 tiles per row on tablet (768-1023px)
- ✅ Grid layout: 1 tile per column on mobile (<768px)
- ✅ Header text: "Need help journaling? Check out our helpers."
- ✅ Tiles are clickable (entire card is click target)
- ✅ Tiles display shortened titles
- ✅ Visual hover state on tiles

---

### 2. Create HelperModal Component
**File:** `/src/components/journal/helpers/HelperModal.tsx`

**Implementation:**
```tsx
'use client'

/**
 * HelperModal Component
 * Story 2.8: Modal for full helper content
 *
 * Opens when helper tile is clicked, displays full helper UI.
 */

import { ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HelperType } from '@/types/helper'

interface HelperModalProps {
  isOpen: boolean
  onClose: () => void
  helperType: HelperType
  title: string
  children: ReactNode
}

export function HelperModal({ isOpen, onClose, helperType, title, children }: HelperModalProps) {
  // Modal implementation with Dialog component
  // ... implementation
}
```

**Acceptance:**
- ✅ Modal opens on tile click
- ✅ Modal displays full helper content (HelperContainer children)
- ✅ Close button (X) in modal header
- ✅ Clicking backdrop closes modal
- ✅ Escape key closes modal
- ✅ Focus trapped in modal when open
- ✅ Focus returns to tile after modal closes

---

### 3. Update Helper Title Constants
**File:** `/src/types/helper.ts` or new `/src/constants/helperTitles.ts`

**Shortened Titles:**
```typescript
export const HELPER_SHORT_TITLES: Record<HelperType, string> = {
  'cbt-distortions': 'Distorted Thoughts',
  'gratitude': '3 Good Things',
  'values-affirmation': 'Values',
  'self-compassion': 'Self-Compassion',
  'woop': 'WOOP Goals',
  'best-possible-self': 'Best Possible Self',
  'savoring': 'Savoring',
}

export const HELPER_FULL_TITLES: Record<HelperType, string> = {
  'cbt-distortions': 'Have you experienced distorted thinking today?',
  'gratitude': 'What went well today?',
  'values-affirmation': 'What matters most to you?',
  'self-compassion': 'Give yourself some kindness',
  'woop': 'Plan a goal with WOOP',
  'best-possible-self': 'Imagine your best possible self',
  'savoring': 'Savor positive experiences',
}
```

**Acceptance:**
- ✅ Short titles defined for all helper types
- ✅ Full titles preserved for modal display
- ✅ Constants exported and used in components

---

### 4. Integrate Tile Grid in JournalStream
**File:** `/src/components/journal/JournalStream.tsx`

**Current Implementation** (to replace):
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
  </>
)}
```

**New Implementation:**
```tsx
{isTodayEntry && user && (
  <HelperTileGrid
    tiles={[
      {
        helperType: 'cbt-distortions',
        title: 'Distorted Thoughts',
        variant: 'blue',
        content: <CbtDistortions entryId={entry.id} userId={user.id} onInsert={...} />
      },
      {
        helperType: 'gratitude',
        title: '3 Good Things',
        variant: 'green',
        content: <GratitudeHelper entryId={entry.id} userId={user.id} onInsert={...} />
      },
      // ... other helpers
    ]}
    onTileClick={(tile) => setActiveHelperModal(tile)}
  />

  {activeHelperModal && (
    <HelperModal
      isOpen={!!activeHelperModal}
      onClose={() => setActiveHelperModal(null)}
      helperType={activeHelperModal.helperType}
      title={activeHelperModal.title}
    >
      {activeHelperModal.content}
    </HelperModal>
  )}
)}
```

**Acceptance:**
- ✅ Replace individual helper components with HelperTileGrid
- ✅ All existing helpers render in tile grid
- ✅ Modal state management (activeHelperModal)
- ✅ Modal displays selected helper content
- ✅ Existing helper functionality preserved (onInsert callbacks work)

---

### 5. Remove HelperContainer Expand/Collapse UI
**Files:** All helper components (CbtDistortions, GratitudeHelper, etc.)

**Change:**
- Remove progressive disclosure (Explore/Collapse buttons) from HelperContainer
- HelperContainer becomes simple wrapper for modal content
- All content displayed by default when in modal

**Implementation Notes:**
- HelperContainer props still used (variant, headerText, etc.)
- Remove `isExpanded` state from HelperContainer
- Remove Explore/Collapse buttons
- Content always visible (modal handles show/hide)

**Acceptance:**
- ✅ HelperContainer simplified (no expand/collapse logic)
- ✅ Helper content always visible when in modal
- ✅ Existing helper logic preserved (form state, insertion, tracking)

---

### 6. Responsive Design & Mobile Testing
**Files:** HelperTileGrid, HelperModal

**Mobile Behavior:**
- Tiles: 1 column on mobile (<768px)
- Tiles: 2 columns on tablet (768-1023px)
- Tiles: 3 columns on desktop (>=1024px)
- Modal: Full-screen on mobile, centered on desktop
- Touch-friendly tile targets (min 44x44px)

**Acceptance:**
- ✅ Grid responsive at all breakpoints
- ✅ Tiles stack correctly on mobile
- ✅ Modal usable on mobile (full-screen)
- ✅ Touch targets meet accessibility standards
- ✅ No horizontal scroll at any viewport size

---

## Technical Implementation Notes

### Component Architecture

**Before:**
```
JournalStream
├── CbtDistortions (with HelperContainer expand/collapse)
├── GratitudeHelper (with HelperContainer expand/collapse)
├── ValuesAffirmationHelper (with HelperContainer expand/collapse)
└── ... other helpers
```

**After:**
```
JournalStream
├── HelperTileGrid
│   ├── Tile (CBT)
│   ├── Tile (Gratitude)
│   ├── Tile (Values)
│   └── ... other tiles
└── HelperModal (conditional)
    └── <HelperComponent /> (selected helper's full content)
```

### Helper Content Rendering

**Key Decision**: Each helper component (e.g., CbtDistortions) is instantiated when needed in modal, not pre-rendered.

**Rationale:**
- Avoid rendering 7+ helper components on every journal entry load
- Lazy-load helper content only when user clicks tile
- Reduce initial page weight and React tree size

**Implementation:**
```tsx
// In JournalStream, define helper definitions
const helperDefinitions = [
  {
    helperType: 'cbt-distortions',
    title: 'Distorted Thoughts',
    variant: 'blue',
    renderContent: () => <CbtDistortions entryId={entry.id} userId={user.id} onInsert={...} />
  },
  // ... other helpers
]

// Render only active modal's content
{activeHelperModal && (
  <HelperModal {...}>
    {activeHelperModal.renderContent()}
  </HelperModal>
)}
```

### Modal vs HelperContainer Relationship

**Option 1: Keep HelperContainer** (Recommended)
- Modal wraps HelperContainer (with simplified logic)
- HelperContainer provides theme/variant styling
- HelperContainer handles dismiss button
- Modal handles open/close and backdrop

**Option 2: Remove HelperContainer**
- Modal directly wraps helper content
- Theme/variant styling moved to modal
- More refactoring required

**Decision**: Option 1 (keep HelperContainer but simplify)

### Grid Layout Implementation

Use Tailwind grid utilities:
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {tiles.map(tile => (
    <Card
      key={tile.helperType}
      onClick={() => onTileClick(tile)}
      className="cursor-pointer hover:shadow-lg transition-shadow"
    >
      {/* Tile content */}
    </Card>
  ))}
</div>
```

---

## Tasks

### Phase 1: Create Base Components (2 hours)
- [ ] Create `/src/constants/helperTitles.ts` with HELPER_SHORT_TITLES and HELPER_FULL_TITLES
- [ ] Create `/src/components/journal/helpers/HelperTileGrid.tsx` component
- [ ] Implement grid layout (3/2/1 columns responsive)
- [ ] Add header text: "Need help journaling? Check out our helpers."
- [ ] Style tiles with hover states
- [ ] Make entire tile clickable

### Phase 2: Create Modal Component (2 hours)
- [ ] Create `/src/components/journal/helpers/HelperModal.tsx` component
- [ ] Use shadcn/ui Dialog component for modal
- [ ] Add close button (X) in modal header
- [ ] Implement backdrop click to close
- [ ] Add Escape key handler
- [ ] Implement focus trap (focus locked in modal when open)
- [ ] Return focus to tile after modal closes

### Phase 3: Update HelperContainer (1 hour)
- [ ] Simplify HelperContainer: remove expand/collapse logic
- [ ] Remove `isExpanded` state and Explore/Collapse buttons
- [ ] Keep variant/theme styling
- [ ] Content always rendered (no progressive disclosure)
- [ ] Update HelperContainer props interface (remove unused props)

### Phase 4: Integrate in JournalStream (3 hours)
- [ ] Import HelperTileGrid and HelperModal in JournalStream
- [ ] Define helper tile definitions array with all helpers
- [ ] Add modal state management (activeHelperModal)
- [ ] Replace individual helper components with HelperTileGrid
- [ ] Add HelperModal with conditional rendering
- [ ] Wire up tile click to open modal
- [ ] Test all helpers open in modal correctly
- [ ] Verify onInsert callbacks still work

### Phase 5: Update All Helper Components (2 hours)
- [ ] Update CbtDistortions: remove HelperContainer expand/collapse usage
- [ ] Update GratitudeHelper: remove expand/collapse
- [ ] Update ValuesAffirmationHelper: remove expand/collapse
- [ ] Update SelfCompassionHelper: remove expand/collapse
- [ ] Update WoopHelper: remove expand/collapse
- [ ] Update BestPossibleSelfHelper: remove expand/collapse
- [ ] Update SavoringHelper: remove expand/collapse

### Phase 6: Accessibility Testing (2 hours)
- [ ] Test keyboard navigation: Tab through tiles
- [ ] Test Enter key opens modal from tile
- [ ] Test Escape key closes modal
- [ ] Test focus trap in modal (Tab cycles within modal)
- [ ] Test focus returns to tile after modal closes
- [ ] Add ARIA labels to tiles (`aria-label="Open [helper name] helper"`)
- [ ] Add ARIA labels to modal (`aria-labelledby`, `role="dialog"`)
- [ ] Test with screen reader (announce tile names, modal open/close)

### Phase 7: Responsive & Mobile Testing (2 hours)
- [ ] Test 3-column grid on desktop (>=1024px)
- [ ] Test 2-column grid on tablet (768-1023px)
- [ ] Test 1-column stack on mobile (<768px)
- [ ] Test modal full-screen on mobile
- [ ] Test touch targets on mobile (tiles, close button)
- [ ] Verify no horizontal scroll at all viewport sizes
- [ ] Test on real mobile device (iOS/Android)

### Phase 8: Quality Assurance (1 hour)
- [ ] Run ESLint: `npm run lint`
- [ ] Build verification: `npm run build`
- [ ] Test all helpers function correctly in modals
- [ ] Test helper insertion still works (prepends to journal entry)
- [ ] Test helper tracking still logs to database
- [ ] Verify no console errors or warnings
- [ ] Check TypeScript strict mode passes

---

## Acceptance Criteria

### Functional Requirements
- ✅ Helpers displayed as tiles in grid (3/2/1 columns responsive)
- ✅ Header: "Need help journaling? Check out our helpers."
- ✅ Tiles use shortened titles (e.g., "Distorted Thoughts")
- ✅ Clicking tile opens modal with full helper content
- ✅ Modal displays full helper title and functionality
- ✅ Close button (X) and backdrop click close modal
- ✅ Escape key closes modal
- ✅ All existing helper functionality preserved (insertion, tracking)

### UX Requirements
- ✅ Reduced vertical space compared to current stacked layout
- ✅ Scannable overview of all helpers at once
- ✅ Hover state on tiles provides visual feedback
- ✅ Modal displays helper content clearly
- ✅ Smooth transitions (tile hover, modal open/close)

### Accessibility Requirements
- ✅ WCAG AA contrast ratios on tiles and modal
- ✅ Keyboard navigation: Tab through tiles, Enter to open, Escape to close
- ✅ Focus trap in modal
- ✅ Focus returns to tile after modal closes
- ✅ Screen reader announces tile names and modal state
- ✅ Touch targets >= 44x44px on mobile

### Responsive Requirements
- ✅ 3 columns on desktop (>=1024px)
- ✅ 2 columns on tablet (768-1023px)
- ✅ 1 column on mobile (<768px)
- ✅ Modal full-screen on mobile, centered on desktop
- ✅ No horizontal scroll at any viewport

### Quality Requirements
- ✅ No ESLint errors (`npm run lint`)
- ✅ Successful production build (`npm run build`)
- ✅ No console errors or warnings
- ✅ TypeScript strict mode passes
- ✅ Existing helper tests still pass (if any)

---

## Testing Checklist

### Manual Testing
- [ ] **Grid Layout**: 3 columns desktop, 2 tablet, 1 mobile
- [ ] **Tiles**: All 7 helpers display with shortened titles
- [ ] **Tile Click**: Opens modal with correct helper content
- [ ] **Modal Close**: X button, backdrop click, Escape key all work
- [ ] **Helper Functionality**: Each helper works in modal (forms, insertion, etc.)
- [ ] **Insertion**: "Add to Journal Entry" still prepends content correctly
- [ ] **Collapse**: Modal closes after insertion (optional behavior)

### Accessibility Testing
- [ ] **Keyboard Navigation**: Tab through all tiles
- [ ] **Enter Key**: Opens modal from focused tile
- [ ] **Escape Key**: Closes modal
- [ ] **Focus Trap**: Tab cycles within modal (doesn't leave)
- [ ] **Focus Return**: Focus returns to tile after modal closes
- [ ] **Screen Reader**: Announces tile names and modal open/close

### Responsive Testing
- [ ] **Desktop** (>=1024px): 3-column grid
- [ ] **Tablet** (768-1023px): 2-column grid
- [ ] **Mobile** (<768px): 1-column stack
- [ ] **Modal Mobile**: Full-screen on mobile
- [ ] **Touch Targets**: Easy to tap on mobile device
- [ ] **No Horizontal Scroll**: All viewport sizes

### Automated Testing
- [ ] `npm run lint`: Pass
- [ ] `npm run build`: Success
- [ ] Browser console: No errors
- [ ] TypeScript: No type errors

---

## Definition of Done

### Story-Level DoD
- ✅ All tasks completed and checkboxes marked [x]
- ✅ All acceptance criteria met
- ✅ HelperTileGrid and HelperModal components created
- ✅ All helpers display in tile grid
- ✅ Modal opens/closes correctly with full helper content
- ✅ Existing helper functionality preserved (insertion, tracking)
- ✅ Responsive testing passed at all breakpoints
- ✅ Accessibility validation (WCAG AA)
- ✅ No ESLint errors (`npm run lint`)
- ✅ Production build successful (`npm run build`)
- ✅ No console errors in browser
- ✅ Code follows project coding standards
- ✅ PR created with screenshots (desktop, tablet, mobile)
- ✅ Tested on Vercel preview deployment

### File List
- **New Files:**
  - `/src/components/journal/helpers/HelperTileGrid.tsx`
  - `/src/components/journal/helpers/HelperModal.tsx`
  - `/src/constants/helperTitles.ts` (or updated `/src/types/helper.ts`)
- **Modified Files:**
  - `/src/components/journal/JournalStream.tsx` - Integrate tile grid and modal
  - `/src/components/journal/helpers/HelperContainer.tsx` - Simplify (remove expand/collapse)
  - All helper components (remove expand/collapse usage)

---

## Related Documentation

- **Issue**: [#92 - Convert helpers to compact tile-based UI](https://github.com/levineam/Signum/issues/92)
- **Reference**: HelperContainer component (Story 2.5.x pattern)
- **Existing Helpers**: Stories 2.5.5 - 2.5.10 (all helpers to be included in grid)
- **shadcn/ui Dialog**: Used for modal implementation

---

## Dev Agent Record

### Agent Model Used
- Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
- None yet

### Completion Notes
- None yet

### Change Log
- 2025-10-28: Story created from GitHub issue #92

---

## QA Results

- **Gate:** PENDING
- **Review Date:** TBD
- **Notes:** Story pending review before development starts
