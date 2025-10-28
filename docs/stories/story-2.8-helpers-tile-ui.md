# Story 2.8: Convert Helpers to Compact Tile-Based UI

**Status:** 📋 DRAFT
**Created:** 2025-10-28
**Updated:** 2025-10-28 (GPT-5 review incorporated)
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
   - Semantic header (h2): "Need help journaling? Check out our helpers."
   - Grid layout: 3-4 tiles per row (desktop), responsive on mobile
   - Grid: 4 cols (xl), 3 cols (lg), 2 cols (md), 1 col (sm)

2. **Helper Tiles**
   - Proper button semantics (`<button>` element with `aria-haspopup="dialog"`)
   - Shortened title + icon + 1-line description (8-12 words)
   - Icon/visual indicator per helper type (not color-only differentiation)
   - Standardized tile height with text truncation (line-clamp-2)
   - Visible focus states for keyboard navigation
   - Subtle hover elevation
   - Touch-friendly (>=44x44px targets)

3. **Title & Description Pairs**
   - "Thinking Traps" + "Identify unhelpful thought patterns" (icon: 🧠)
   - "3 Good Things" + "Reflect on what went well today" (icon: ✨)
   - "Values" + "Clarify what matters most to you" (icon: 🎯)
   - "Self-Compassion" + "Give yourself kindness when struggling" (icon: 💚)
   - "WOOP Goals" + "Plan goals with evidence-based strategy" (icon: 🎯)
   - "Best Possible Self" + "Envision your ideal future" (icon: 🌟)
   - "Savoring" + "Amplify positive experiences" (icon: 🌸)

4. **Sheet/Dialog Implementation**
   - **Desktop (>=lg)**: Sheet component (right-side panel) keeps journal context visible
   - **Mobile (<lg)**: Full-screen Dialog
   - Close button (X), backdrop click, and Escape key to dismiss
   - Body scroll lock when open
   - URL state: `?helper=woop` for deep linking
   - Focus returns to invoking tile on close

5. **Accessibility & Performance**
   - Proper ARIA: `aria-haspopup="dialog"`, `aria-controls`, `aria-label`
   - Keyboard: Tab, Enter, Space, Escape
   - Focus trap in sheet/dialog
   - Dynamic imports with next/dynamic per helper
   - Prefetch on hover/focus to reduce latency
   - Loading skeleton during helper load

### Out of Scope
- Reordering/customizing helper tiles
- Favoriting/pinning specific helpers
- Helper usage statistics in tiles
- Complex animated transitions (micro-transitions like hover/opacity OK)
- Drag-and-drop tile reordering
- User preferences for grid layout
- Personalized helper recommendations (define events for future)

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

### 2. Create HelperSheet/Dialog Component
**File:** `/src/components/journal/helpers/HelperSheet.tsx`

**Implementation:**
```tsx
'use client'

/**
 * HelperSheet Component
 * Story 2.8: Sheet (desktop) / Dialog (mobile) for helper content
 *
 * Uses Sheet on >=lg screens (keeps journal context visible)
 * Uses full-screen Dialog on mobile
 */

import { ReactNode, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HelperType } from '@/types/helper'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface HelperSheetProps {
  isOpen: boolean
  onClose: () => void
  helperType: HelperType
  title: string
  children: ReactNode
}

export function HelperSheet({ isOpen, onClose, helperType, title, children }: HelperSheetProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Update URL with ?helper=type on open
  useEffect(() => {
    if (isOpen) {
      const url = new URL(window.location.href)
      url.searchParams.set('helper', helperType)
      window.history.pushState({}, '', url)
    } else {
      const url = new URL(window.location.href)
      url.searchParams.delete('helper')
      window.history.pushState({}, '', url)
    }
  }, [isOpen, helperType])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Desktop: Sheet (side panel), Mobile: Full-screen Dialog
  // ... implementation
}
```

**Acceptance:**
- ✅ Desktop (>=1024px): Right-side Sheet preserves journal context
- ✅ Mobile (<1024px): Full-screen Dialog
- ✅ URL updates with ?helper=type on open
- ✅ Body scroll locked when open
- ✅ Close button (X), backdrop click, Escape key all close
- ✅ Focus trapped in sheet/dialog when open
- ✅ Focus returns to tile after close

---

### 3. Update Helper Title & Description Constants
**File:** `/src/constants/helperTitles.ts`

**Tile Data Structure:**
```typescript
export interface HelperTileData {
  shortTitle: string        // For tile display
  description: string       // 8-12 words, shown on tile
  fullTitle: string         // For sheet/dialog header
  icon: string              // Emoji for visual identity
}

export const HELPER_TILES: Record<HelperType, HelperTileData> = {
  'cbt-distortions': {
    shortTitle: 'Thinking Traps',
    description: 'Identify unhelpful thought patterns',
    fullTitle: 'Cognitive Distortions',
    icon: '🧠',
  },
  'gratitude': {
    shortTitle: '3 Good Things',
    description: 'Reflect on what went well today',
    fullTitle: 'Gratitude Practice',
    icon: '✨',
  },
  'values-affirmation': {
    shortTitle: 'Values',
    description: 'Clarify what matters most to you',
    fullTitle: 'Values Affirmation',
    icon: '🎯',
  },
  'self-compassion': {
    shortTitle: 'Self-Compassion',
    description: 'Give yourself kindness when struggling',
    fullTitle: 'Self-Compassion Break',
    icon: '💚',
  },
  'woop': {
    shortTitle: 'WOOP Goals',
    description: 'Plan goals with evidence-based strategy',
    fullTitle: 'WOOP Goal Planning',
    icon: '🎯',
  },
  'best-possible-self': {
    shortTitle: 'Best Possible Self',
    description: 'Envision your ideal future',
    fullTitle: 'Best Possible Self Exercise',
    icon: '🌟',
  },
  'savoring': {
    shortTitle: 'Savoring',
    description: 'Amplify positive experiences',
    fullTitle: 'Savoring Practice',
    icon: '🌸',
  },
}
```

**Acceptance:**
- ✅ Short titles, descriptions, full titles, and icons defined for all helpers
- ✅ Descriptions are 8-12 words for consistency
- ✅ Icons provide non-color visual differentiation
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
│   ├── button (CBT) with icon + title + description
│   ├── button (Gratitude) with icon + title + description
│   ├── button (Values) with icon + title + description
│   └── ... other tiles
└── HelperSheet (conditional, responsive: Sheet on desktop / Dialog on mobile)
    └── dynamic(() => import('./helpers/CbtDistortions')) (lazy-loaded)
```

### Helper Content Rendering & Performance

**Key Decision**: Use Next.js dynamic imports with prefetch on hover/focus.

**Rationale:**
- Avoid rendering 7+ helper components on every journal entry load
- Lazy-load helper content only when user clicks tile
- Prefetch on hover/focus reduces perceived latency
- Code-split each helper into separate chunks

**Implementation:**
```tsx
import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Define dynamic imports with loading skeletons
const CbtDistortionsHelper = dynamic(
  () => import('./helpers/CbtDistortions').then(mod => mod.CbtDistortions),
  { loading: () => <HelperSkeleton /> }
)

const helperComponents: Record<HelperType, ComponentType<HelperProps>> = {
  'cbt-distortions': CbtDistortionsHelper,
  'gratitude': GratitudeHelperDynamic,
  // ... other helpers
}

// Prefetch on tile hover/focus
const handleTileFocus = (helperType: HelperType) => {
  // Prefetch the helper component
  helperComponents[helperType].preload?.()
}
```

**Deep Linking:**
```tsx
// On mount, check URL params for ?helper=type
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const helperParam = params.get('helper') as HelperType | null
  if (helperParam && helperParam in HELPER_TILES) {
    setActiveHelper(helperParam)
  }
}, [])
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

### Phase 1: Create Constants & Base Components (3 hours)
- [ ] Create `/src/constants/helperTitles.ts` with HELPER_TILES (title, description, icon, fullTitle)
- [ ] Create `/src/components/journal/helpers/HelperTileGrid.tsx` component
- [ ] Implement semantic header (h2): "Need help journaling? Check out our helpers."
- [ ] Implement responsive grid: 4 cols (xl), 3 cols (lg), 2 cols (md), 1 col (sm)
- [ ] Create tiles as `<button type="button">` with proper ARIA (`aria-haspopup="dialog"`)
- [ ] Add icon + title + description (line-clamp-2) to each tile
- [ ] Style tiles: visible focus states, hover elevation, standardized height
- [ ] Ensure touch targets >= 44x44px

### Phase 2: Create Sheet/Dialog Component (3 hours)
- [ ] Check if shadcn/ui Sheet component is available (if not, install)
- [ ] Create `/src/components/journal/helpers/HelperSheet.tsx` component
- [ ] Implement responsive: Sheet on desktop (>=1024px), Dialog on mobile
- [ ] Add close button (X), backdrop click, Escape key handlers
- [ ] Implement focus trap (focus locked when open)
- [ ] Return focus to invoking tile after close
- [ ] Add URL state management (?helper=type on open, remove on close)
- [ ] Add body scroll lock when open
- [ ] Create HelperSkeleton component for loading state

### Phase 3: Update HelperContainer (1 hour)
- [ ] Simplify HelperContainer: remove expand/collapse logic
- [ ] Remove `isExpanded` state and Explore/Collapse buttons
- [ ] Keep variant/theme styling
- [ ] Content always rendered (no progressive disclosure)
- [ ] Update HelperContainer props interface (remove unused props)

### Phase 4: Dynamic Imports & Prefetch (2 hours)
- [ ] Set up dynamic imports for each helper using next/dynamic
- [ ] Create loading skeleton component (HelperSkeleton)
- [ ] Map helper types to dynamic components in JournalStream
- [ ] Implement prefetch on tile hover/focus
- [ ] Test lazy loading works correctly
- [ ] Verify code-splitting in build output

### Phase 5: Integrate in JournalStream (3 hours)
- [ ] Import HelperTileGrid and HelperSheet in JournalStream
- [ ] Define helper tile definitions array with all helpers (from HELPER_TILES)
- [ ] Add sheet state management (activeHelper, setActiveHelper)
- [ ] Implement deep linking: Check ?helper=type on mount
- [ ] Replace individual helper components with HelperTileGrid
- [ ] Add HelperSheet with conditional rendering
- [ ] Wire up tile click to open sheet
- [ ] Test all helpers open in sheet correctly
- [ ] Verify onInsert callbacks still work

### Phase 6: Update All Helper Components (2 hours)
- [ ] Update CbtDistortions: remove HelperContainer expand/collapse usage
- [ ] Update GratitudeHelper: remove expand/collapse
- [ ] Update ValuesAffirmationHelper: remove expand/collapse
- [ ] Update SelfCompassionHelper: remove expand/collapse
- [ ] Update WoopHelper: remove expand/collapse
- [ ] Update BestPossibleSelfHelper: remove expand/collapse
- [ ] Update SavoringHelper: remove expand/collapse

### Phase 7: Accessibility Testing (2 hours)
- [ ] Test keyboard navigation: Tab through tiles
- [ ] Test Enter AND Space keys open sheet from tile
- [ ] Test Escape key closes sheet
- [ ] Test focus trap in sheet (Tab cycles within sheet)
- [ ] Test focus returns to tile after sheet closes
- [ ] Verify ARIA: `aria-haspopup="dialog"`, `aria-controls`, `aria-label`
- [ ] Test with screen reader (announce tile names, sheet open/close)
- [ ] Verify visible focus states on all interactive elements

### Phase 8: Responsive & Mobile Testing (2 hours)
- [ ] Test 4-column grid on xl screens (>=1280px)
- [ ] Test 3-column grid on lg screens (1024-1279px)
- [ ] Test 2-column grid on md screens (768-1023px)
- [ ] Test 1-column stack on sm screens (<768px)
- [ ] Test Sheet on desktop (side panel, journal context visible)
- [ ] Test Dialog on mobile (full-screen)
- [ ] Test touch targets on mobile (tiles, close button)
- [ ] Verify no horizontal scroll at all viewport sizes
- [ ] Test on real mobile device (iOS/Android)

### Phase 9: URL State & Analytics (2 hours)
- [ ] Test deep linking: ?helper=woop opens WOOP helper on mount
- [ ] Test URL updates when sheet opens
- [ ] Test URL clears when sheet closes
- [ ] Test browser back/forward with URL state
- [ ] Add analytics events: tile_click, helper_opened (define for future use)
- [ ] Verify events include helper type in metadata

### Phase 10: Quality Assurance (1 hour)
- [ ] Run ESLint: `npm run lint`
- [ ] Build verification: `npm run build`
- [ ] Verify code-splitting in build output (check chunk sizes)
- [ ] Test all helpers function correctly in sheet
- [ ] Test helper insertion still works (prepends to journal entry)
- [ ] Test helper tracking still logs to database
- [ ] Verify no console errors or warnings
- [ ] Check TypeScript strict mode passes
- [ ] Test dark mode contrast (WCAG AA)

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

## GPT-5 Review (2025-10-28)

### Verdict
Solid, user-friendly direction. Moving helpers into a compact, scannable grid with just-in-time detail via sheet/dialog is a sensible modernization that reduces vertical clutter while preserving depth.

### Key Recommendations Incorporated
✅ **Sheet on desktop, Dialog on mobile** - Keeps journal context visible on desktop
✅ **True button semantics** - Tiles as `<button>` with `aria-haspopup="dialog"`
✅ **Lightweight affordance** - Icon + title + description (8-12 words) per tile
✅ **Deep linking** - Support ?helper=woop to open specific helper
✅ **Code-split and prefetch** - next/dynamic with hover/focus prefetch
✅ **Keyboard polish** - Space/Enter open, visible focus states, Escape everywhere
✅ **Visual hierarchy** - Standardized height, line-clamp-2, hover elevation
✅ **Non-color cues** - Icons paired with colors for differentiation
✅ **Analytics foundation** - Define events for future personalization

### UX Improvements
- Changed "Distorted Thoughts" → "Thinking Traps" (more user-friendly)
- Added 1-line descriptions for recognition over recall
- Expanded grid to 4 columns on xl screens for large monitors
- Added body scroll lock and URL state management

---

## QA Results

- **Gate:** PENDING
- **Review Date:** TBD
- **Notes:** GPT-5 review incorporated. Story ready for development after user approval.
