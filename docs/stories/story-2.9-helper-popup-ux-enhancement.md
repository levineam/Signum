# Story 2.9: Helper Popup UX Enhancement

**Status:** 📋 PLANNED
**Created:** 2025-10-28
**Issue:** TBD
**Prerequisites:**
- Story 2.8: Tile-based helper UI ✅
- All existing helpers implemented (Stories 2.5.x) ✅

---

## Story

As a user,
I want to access helper information and functionality through direct popups instead of a sidebar,
so that I can quickly learn about helpers or use them without the sidebar taking up screen space.

---

## Why This Matters

**Current State (Story 2.8):**
- Clicking a helper tile opens a sidebar (Sheet on desktop, Dialog on mobile)
- Sidebar shows collapsed HelperContainer with:
  - Header text
  - Info icon (ℹ️) → Shows research/citation in popover
  - "Explore" button → Expands to show full helper content
- User must click "Explore" to see and use the helper

**Problems:**
1. **Extra click required**: Users must click "Explore" button to access helper functionality
2. **Sidebar UX**: Sheet takes up significant horizontal space on desktop
3. **No tile-level info access**: Users can't preview helper info before opening sidebar
4. **Progressive disclosure overhead**: The collapsed → expanded flow adds unnecessary friction

**Benefits:**
- **Faster access**: One click from tile to full helper functionality
- **Better information architecture**: Separate "learn" vs "use" paths
- **Tile-level previews**: Info icons on tiles let users explore without commitment
- **Cleaner popups**: Dialog-based approach feels more modern and direct
- **Reduced clicks**: Remove "Explore" button step entirely

---

## Scope

### In Scope

1. **Info Icons on Helper Tiles**
   - Add info icon (ℹ️) to top-right corner of each tile
   - Clicking info icon opens info dialog (doesn't trigger tile click)
   - Icon matches tile theme color
   - Proper ARIA labels for accessibility

2. **Info Dialog**
   - Displays helper research information
   - Content: Title, description, effect size, citation
   - Triggered by clicking tile info icon
   - Uses Dialog component (not Sheet)

3. **Direct Helper Dialog (Use Mode)**
   - Clicking tile body opens helper immediately in expanded state
   - No HelperContainer wrapper (no collapsed state)
   - No "Explore" button - content visible immediately
   - Full helper functionality (checkboxes, forms, etc.)
   - Uses Dialog component (not Sheet)

4. **Helper Component Refactoring**
   - Extract content from HelperContainer into separate `*Content` components
   - Make helper content reusable without wrapper
   - All 10 helpers refactored:
     - CbtDistortions → CbtDistortionsContent
     - GratitudeHelper → GratitudeContent
     - ValuesAffirmationHelper → ValuesAffirmationContent
     - SelfCompassionHelper → SelfCompassionContent
     - WoopHelper → WoopContent
     - BestPossibleSelfHelper → BestPossibleSelfContent
     - SavoringHelper → SavoringContent
     - ProgressiveMuscleRelaxationHelper → PMRContent
     - LovingKindnessHelper → LovingKindnessContent
     - MentalContrastingHelper → MentalContrastingContent

5. **Centralized Helper Info**
   - Create `/src/constants/helperInfo.ts`
   - Extract all helper research data from scattered `infoContent` props
   - Single source of truth for helper metadata

6. **State Management Updates**
   - Add mode tracking: `'info' | 'use' | null`
   - Two click handlers: `onInfoClick` and `onTileClick`
   - URL state management for both modes

### Out of Scope

- Changing helper functionality (checkboxes, forms, validation logic)
- Adding new helpers
- Mobile-specific Sheet component (using Dialog for both desktop/mobile)
- Animation/transition effects beyond Dialog defaults

---

## Current Architecture

### Component Hierarchy (Story 2.8):
```
JournalStream
├── HelperTileGrid (10 tiles)
│   └── Tile Button
│       └── Card (icon, title, description)
└── HelperSheet (Sheet/Dialog wrapper)
    └── Helper Component (e.g., CbtDistortions)
        └── HelperContainer (progressive disclosure)
            ├── Header + Info Icon + Explore Button
            └── Helper Content (checkboxes, forms)
```

### Current User Flow:
```
Click Tile → Sheet Opens → See collapsed HelperContainer →
Click "Explore" → See full helper content → Interact → Insert
Click "ℹ️" (in sheet) → See research popover
```

---

## New Architecture

### Component Hierarchy:
```
JournalStream
├── HelperTileGrid (10 tiles)
│   └── Tile Card
│       ├── Tile Body Button (icon, title, description)
│       └── Info Icon Button (top-right corner)
└── Dialog (conditional)
    ├── HelperInfoDialog (mode: 'info')
    │   └── Research content (title, description, citation)
    └── HelperDialogContent (mode: 'use')
        └── Helper *Content component
            └── Helper UI (checkboxes, forms) - NO wrapper
```

### New User Flows:

**Path A: Learn About Helper**
```
Click info icon on tile →
Dialog opens →
Show research/citation →
Close dialog
```

**Path B: Use Helper**
```
Click tile body →
Dialog opens with full helper content →
Interact (checkboxes, forms, etc.) →
Insert to journal →
Dialog closes
```

---

## Technical Implementation

### 1. New Components

#### `/src/components/journal/helpers/HelperInfoDialog.tsx`
**Purpose:** Display helper research information in a dialog

```typescript
interface HelperInfoDialogProps {
  helperType: HelperType
}

export function HelperInfoDialog({ helperType }: HelperInfoDialogProps) {
  const tileData = HELPER_TILES[helperType]
  const infoData = HELPER_INFO[helperType]

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{tileData.fullTitle}</DialogTitle>
        <DialogDescription>{tileData.description}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div>
          <h3>Research Evidence</h3>
          <p>{infoData.description}</p>
        </div>

        <div>
          <strong>Effect Size:</strong> {infoData.effectSize}
        </div>

        <div>
          <strong>Citation:</strong>
          <p className="text-sm">{infoData.citation}</p>
        </div>
      </div>
    </DialogContent>
  )
}
```

#### `/src/components/journal/helpers/HelperDialogContent.tsx`
**Purpose:** Route to appropriate helper content based on type

```typescript
interface HelperDialogContentProps {
  helperType: HelperType
  entryId: string
  userId: string
  onInsert: (entryId: string, text: string) => void
}

export function HelperDialogContent(props: HelperDialogContentProps) {
  const tileData = HELPER_TILES[props.helperType]

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{tileData.fullTitle}</DialogTitle>
      </DialogHeader>

      {/* Route to appropriate helper content */}
      {props.helperType === 'cbt-distortions' && (
        <CbtDistortionsContent {...props} />
      )}
      {props.helperType === 'gratitude' && (
        <GratitudeContent {...props} />
      )}
      {/* ... other helpers */}
    </DialogContent>
  )
}
```

#### `/src/constants/helperInfo.ts`
**Purpose:** Centralize all helper research metadata

```typescript
export interface HelperResearchInfo {
  title: string
  description: string
  effectSize: string
  citation: string
}

export const HELPER_INFO: Record<HelperType, HelperResearchInfo> = {
  'cbt-distortions': {
    title: "CBT Cognitive Distortions",
    description: "Cognitive Behavioral Therapy identifies patterns of distorted thinking that contribute to emotional distress. Recognizing and reframing these patterns can reduce anxiety and depression.",
    effectSize: "d=0.80-1.00 for depression and anxiety",
    citation: "Hofmann, S. G., et al. (2012). The efficacy of cognitive behavioral therapy: A review of meta-analyses. Cognitive Therapy and Research, 36(5), 427-440."
  },
  gratitude: {
    title: "Three Good Things / Gratitude Practice",
    description: "The Three Good Things exercise involves reflecting on positive experiences from your day. This practice has been shown to increase happiness and life satisfaction.",
    effectSize: "d=0.31 for well-being",
    citation: "Seligman, M. E., et al. (2005). Positive psychology progress: empirical validation of interventions. American Psychologist, 60(5), 410-421."
  },
  // ... 8 more helpers
}
```

### 2. Component Updates

#### `/src/components/journal/helpers/HelperTileGrid.tsx`
**Changes:**
- Add info icon button to top-right of each tile Card
- Split click handling: `onInfoClick` and `onTileClick`
- Use `stopPropagation()` on info icon to prevent tile click
- Add ARIA labels for both buttons

```tsx
<Card className="relative ...">
  {/* Info Icon - Top Right */}
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation()
      onInfoClick(helperType)
    }}
    aria-label={`Learn more about ${tileData.fullTitle}`}
    className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/50"
  >
    <Info className="w-5 h-5" />
  </button>

  {/* Tile Content */}
  <button
    type="button"
    onClick={() => onTileClick(helperType)}
    aria-label={`Open ${tileData.fullTitle} helper`}
    className="w-full text-left"
  >
    {/* Icon, title, description */}
  </button>
</Card>
```

#### `/src/components/journal/JournalStream.tsx`
**Changes:**
- Add `activeHelperMode` state: `'info' | 'use' | null`
- Two handlers: `handleInfoClick` and `handleTileClick`
- Replace HelperSheet with Dialog + conditional rendering

```tsx
// State
const [activeHelper, setActiveHelper] = useState<HelperType | null>(null)
const [activeHelperMode, setActiveHelperMode] = useState<'info' | 'use' | null>(null)
const [activeEntryId, setActiveEntryId] = useState<string | null>(null)

// Handlers
const handleInfoClick = (helperType: HelperType) => {
  setActiveHelper(helperType)
  setActiveHelperMode('info')
}

const handleTileClick = (helperType: HelperType, entryId: string) => {
  setActiveHelper(helperType)
  setActiveHelperMode('use')
  setActiveEntryId(entryId)
}

const handleClose = () => {
  setActiveHelper(null)
  setActiveHelperMode(null)
  setActiveEntryId(null)
}

// Rendering
<HelperTileGrid
  helperTypes={ALL_HELPERS}
  onInfoClick={handleInfoClick}
  onTileClick={(type) => handleTileClick(type, entry.id)}
/>

{activeHelper && (
  <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
    {activeHelperMode === 'info' ? (
      <HelperInfoDialog helperType={activeHelper} />
    ) : (
      <HelperDialogContent
        helperType={activeHelper}
        entryId={activeEntryId!}
        userId={user.id}
        onInsert={handleHelperInsertion}
      />
    )}
  </Dialog>
)}
```

### 3. Helper Component Refactoring Pattern

**Before (Current):**
```tsx
export function CbtDistortions({ entryId, userId, onInsert }: Props) {
  const [selectedDistortions, setSelectedDistortions] = useState(...)
  // ... state and handlers ...

  return (
    <HelperContainer
      helperType="cbt-distortions"
      headerText="Have you experienced any distorted thinking today?"
      variant="blue"
      infoContent={{ title: "...", description: "...", ... }}
    >
      {/* Checkboxes, buttons, content */}
    </HelperContainer>
  )
}
```

**After (New):**
```tsx
// Keep original for backward compatibility
export function CbtDistortions({ entryId, userId, onInsert }: Props) {
  return (
    <HelperContainer /* ... */>
      <CbtDistortionsContent
        entryId={entryId}
        userId={userId}
        onInsert={onInsert}
      />
    </HelperContainer>
  )
}

// NEW: Extracted content component
export function CbtDistortionsContent({ entryId, userId, onInsert }: Props) {
  const [selectedDistortions, setSelectedDistortions] = useState(...)
  // ... ALL state and handlers (moved from parent) ...

  return (
    <>
      <div className="mb-4">
        <p className="text-sm text-gray-700">
          Have you experienced any distorted thinking today?
        </p>
      </div>

      {/* Checkboxes, buttons, content - NO HelperContainer */}
      <div className="space-y-3">
        {CBT_DISTORTIONS.map((distortion) => (
          <div key={distortion.id}>
            <Checkbox /* ... */ />
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <Button onClick={handleInsert}>Insert</Button>
        <Button onClick={handleClear}>Clear</Button>
      </div>
    </>
  )
}
```

---

## UI/UX Specifications

### Info Icon on Tiles
- **Icon:** `Info` from lucide-react (ℹ️ in circle)
- **Position:** Absolute positioned, `top-2 right-2`
- **Size:** `w-5 h-5` (20px)
- **Color:** Matches tile theme (blue text for CBT, green for gratitude, etc.)
- **Background:** `hover:bg-white/50 dark:hover:bg-gray-800/50`
- **Border radius:** `rounded-full`
- **Cursor:** `cursor-pointer`
- **Z-index:** Above tile card content
- **Click area:** Minimum 44x44px (WCAG touch target)

### Info Dialog
- **Width:** `max-w-2xl` (672px)
- **Padding:** Standard Dialog padding
- **Structure:**
  ```
  DialogHeader
    - DialogTitle: Helper full title (e.g., "Cognitive Distortions")
    - DialogDescription: Short description from HELPER_TILES

  Content Section
    - Research Evidence heading
    - Description paragraph
    - Effect Size (bold label + value)
    - Citation (smaller text, gray)

  Close Button (X in top-right)
  ```

### Helper Dialog (Use Mode)
- **Width:** `max-w-2xl` (can be larger for complex helpers like WOOP)
- **Padding:** Standard Dialog padding
- **Structure:**
  ```
  DialogHeader
    - DialogTitle: Helper full title
    - DialogDescription: Header text (e.g., "Have you experienced...")

  Helper Content
    - Checkboxes / Form inputs
    - Action buttons (Insert, Clear, Cancel)

  Close Button (X in top-right)
  ```
- **No scrolling needed** for most helpers (content fits in viewport)
- **Overflow:** `overflow-y-auto` if content exceeds viewport height

### Tile Click Behavior
- **Info icon click:**
  - `e.stopPropagation()` prevents tile click
  - Opens info dialog immediately
  - No loading state (data is static)

- **Tile body click:**
  - Opens helper dialog with full content
  - No intermediate collapsed state
  - Helper renders immediately (no "Explore" button)

### Accessibility
- **Info icon button:**
  - `aria-label="Learn more about [Helper Name]"`
  - `role="button"`
  - Keyboard accessible (Tab, Enter/Space)

- **Tile body button:**
  - `aria-label="Open [Helper Name] helper"`
  - `aria-haspopup="dialog"`
  - Keyboard accessible

- **Dialogs:**
  - Focus trapping (handled by Radix Dialog)
  - Escape key closes dialog
  - Return focus to trigger button on close
  - Proper heading hierarchy (h2 for DialogTitle)

---

## Implementation Phases

### Phase 1: Data & Constants ✅
**Goal:** Create centralized helper info data
**Files:**
- Create `/src/constants/helperInfo.ts`
- Extract research data from all 10 helpers

**Acceptance Criteria:**
- ✅ `HELPER_INFO` constant created with all 10 helpers
- ✅ TypeScript interface `HelperResearchInfo` defined
- ✅ Data matches existing `infoContent` props

---

### Phase 2: Info Dialog Component ✅
**Goal:** Implement standalone info dialog
**Files:**
- Create `/src/components/journal/helpers/HelperInfoDialog.tsx`

**Acceptance Criteria:**
- ✅ Component renders helper research info
- ✅ Displays title, description, effect size, citation
- ✅ Uses Dialog component with proper structure
- ✅ Can be tested in isolation with mock data

---

### Phase 3: Refactor Helper Components (1/10 per iteration)
**Goal:** Extract content from HelperContainer
**Files:** (All in `/src/components/journal/helpers/`)
- `CbtDistortions.tsx` → Extract to `CbtDistortionsContent`
- `GratitudeHelper.tsx` → Extract to `GratitudeContent`
- `ValuesAffirmationHelper.tsx` → Extract to `ValuesAffirmationContent`
- `SelfCompassionHelper.tsx` → Extract to `SelfCompassionContent`
- `WoopHelper.tsx` → Extract to `WoopContent`
- `BestPossibleSelfHelper.tsx` → Extract to `BestPossibleSelfContent`
- `SavoringHelper.tsx` → Extract to `SavoringContent`
- `ProgressiveMuscleRelaxationHelper.tsx` → Extract to `PMRContent`
- `LovingKindnessHelper.tsx` → Extract to `LovingKindnessContent`
- `MentalContrastingHelper.tsx` → Extract to `MentalContrastingContent`

**Per-Helper Acceptance Criteria:**
- ✅ Content component created and exported
- ✅ All state/handlers moved to content component
- ✅ Original component still works (backward compatibility)
- ✅ Content component works in isolation
- ✅ No HelperContainer in content component

**Testing:** Test each helper in isolation before moving to next

---

### Phase 4: Dialog Content Router ✅
**Goal:** Create component to route between helper contents
**Files:**
- Create `/src/components/journal/helpers/HelperDialogContent.tsx`

**Acceptance Criteria:**
- ✅ Component accepts helperType, entryId, userId, onInsert
- ✅ Switch/case routes to correct *Content component
- ✅ All 10 helpers have routes
- ✅ DialogHeader displays correct title
- ✅ Can be tested with each helper type

---

### Phase 5: Tile Grid Updates ✅
**Goal:** Add info icons to tiles
**Files:**
- Update `/src/components/journal/helpers/HelperTileGrid.tsx`

**Acceptance Criteria:**
- ✅ Info icon appears in top-right of each tile
- ✅ Info icon has proper positioning (absolute, top-2, right-2)
- ✅ Info icon matches tile theme color
- ✅ `onInfoClick` handler added to props
- ✅ Info icon click uses `stopPropagation()`
- ✅ Info icon has proper ARIA label
- ✅ Tile body button still has proper ARIA label
- ✅ Both buttons keyboard accessible
- ✅ Hover states work correctly

---

### Phase 6: JournalStream Integration ✅
**Goal:** Wire up new state management and dialog rendering
**Files:**
- Update `/src/components/journal/JournalStream.tsx`

**Changes:**
1. Add state: `activeHelperMode: 'info' | 'use' | null`
2. Add handlers: `handleInfoClick`, update `handleTileClick`
3. Pass `onInfoClick` to HelperTileGrid
4. Replace HelperSheet with Dialog + conditional rendering
5. Update URL state management (optional - see Open Questions)

**Acceptance Criteria:**
- ✅ Clicking info icon opens info dialog
- ✅ Clicking tile body opens helper dialog
- ✅ Info dialog displays correct research info
- ✅ Helper dialog displays full helper content
- ✅ Both dialogs can be closed (X button, Escape key)
- ✅ State clears properly on close
- ✅ No console errors

---

### Phase 7: Testing & Cleanup ✅
**Goal:** Comprehensive testing and remove deprecated code
**Tasks:**
1. Manual testing all 10 helpers (both modes)
2. Update Playwright tests
3. Remove HelperSheet component
4. Update Story 2.8 documentation
5. Take screenshots for documentation
6. Update acceptance criteria

**Acceptance Criteria:**
- ✅ All 10 helpers work in info mode
- ✅ All 10 helpers work in use mode
- ✅ Playwright tests pass
- ✅ No console warnings
- ✅ Accessibility audit passes (keyboard nav, screen reader)
- ✅ Documentation updated
- ✅ Screenshots captured

---

## Acceptance Criteria

### Info Icons on Tiles
- [ ] Each of 10 tiles has info icon in top-right corner
- [ ] Info icon is visually distinct and themed to tile color
- [ ] Clicking info icon does NOT trigger tile body click
- [ ] Info icon has proper ARIA label: `"Learn more about [Helper Name]"`
- [ ] Info icon keyboard accessible (Tab, Enter/Space)
- [ ] Hover state shows visual feedback

### Info Dialog
- [ ] Clicking tile info icon opens info dialog
- [ ] Dialog displays helper title (e.g., "Cognitive Distortions")
- [ ] Dialog displays helper description
- [ ] Dialog displays research evidence section
- [ ] Dialog displays effect size
- [ ] Dialog displays citation
- [ ] Dialog can be closed via X button
- [ ] Dialog can be closed via Escape key
- [ ] Focus returns to tile info icon after close

### Helper Dialog (Use Mode)
- [ ] Clicking tile body opens helper dialog
- [ ] Dialog displays helper title
- [ ] Dialog displays header text (e.g., "Have you experienced...")
- [ ] Helper content is fully expanded immediately
- [ ] No "Explore" button visible
- [ ] No collapsed state
- [ ] All helper interactions work (checkboxes, forms, etc.)
- [ ] Validation works correctly
- [ ] "Insert" button adds content to journal
- [ ] Dialog closes after successful insertion
- [ ] Dialog can be closed via X button
- [ ] Dialog can be closed via Escape key
- [ ] Focus returns to tile after close

### All 10 Helpers
- [ ] CBT Distortions works in both modes
- [ ] Three Good Things works in both modes
- [ ] Values Affirmation works in both modes
- [ ] Self-Compassion Break works in both modes
- [ ] WOOP Goal Planning works in both modes
- [ ] Best Possible Self works in both modes
- [ ] Savoring Practice works in both modes
- [ ] Progressive Muscle Relaxation works in both modes
- [ ] Loving-Kindness Meditation works in both modes
- [ ] Mental Contrasting works in both modes

### General Requirements
- [ ] No TypeScript errors
- [ ] No console errors or warnings
- [ ] No accessibility violations (WCAG AA)
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces correctly
- [ ] Dialog scroll behavior works (if content exceeds viewport)
- [ ] Mobile experience is acceptable (Dialog full-screen?)
- [ ] URL state management works (if implemented)

---

## Risk Assessment

### High Risk Items
1. **Helper Refactoring (10 components)**
   - **Risk:** Breaking existing functionality during extraction
   - **Mitigation:** Test each helper thoroughly before moving to next
   - **Rollback Plan:** Keep original components intact, add new exports

2. **State Management Complexity**
   - **Risk:** Mode switching adds complexity, potential for state bugs
   - **Mitigation:** Clear state model, comprehensive testing
   - **Rollback Plan:** Fallback to Sheet-based approach

### Medium Risk Items
1. **Accessibility Compliance**
   - **Risk:** New click targets and dialogs need proper ARIA
   - **Mitigation:** Follow Radix UI patterns, test with screen reader
   - **Testing:** Manual keyboard nav testing, automated a11y audit

2. **Click Target Separation**
   - **Risk:** Users accidentally clicking wrong target (info vs tile)
   - **Mitigation:** Proper `stopPropagation()`, sufficient click area size
   - **Testing:** Manual testing on mobile devices

### Low Risk Items
1. **Info Dialog Implementation**
   - **Risk:** Low - simple read-only component
   - **Mitigation:** Standard Dialog patterns

2. **Data Centralization**
   - **Risk:** Low - moving data, not changing structure
   - **Mitigation:** TypeScript ensures all helpers have data

---

## Open Questions & Decisions Needed

### 1. Info → Use Flow
**Question:** Should the info dialog have a "Use This Helper" button to transition from info mode to use mode?

**Option A:** Yes, add button
- **Pro:** Smooth transition, users can learn then use without closing
- **Con:** Adds complexity, requires mode switching logic

**Option B:** No button
- **Pro:** Simpler implementation, users can close and click tile
- **Con:** Requires extra click (close info, click tile)

**Recommendation:** Option B (no button) - Keep it simple

---

### 2. Bidirectional Info Access
**Question:** Should the helper dialog (use mode) have an info icon to view research while using the helper?

**Option A:** Yes, add info icon/link in helper dialog
- **Pro:** Users can reference research while using helper
- **Con:** Adds clutter, users already saw info icon on tile

**Option B:** No info access in use mode
- **Pro:** Cleaner UI, less clutter
- **Con:** Users can't easily revisit research

**Recommendation:** Option B (no info access in use mode) - Keep use mode focused

---

### 3. URL State Management
**Question:** What URL format should we use for state persistence?

**Option A:** `?helper=type&mode=info` vs `?helper=type&mode=use`
- **Pro:** Explicit mode tracking, deep linking works for both modes
- **Con:** Longer URLs, mode parameter not always needed

**Option B:** `?helper-info=type` vs `?helper=type`
- **Pro:** Shorter URLs, mode implicit in parameter name
- **Con:** Less consistent, harder to parse

**Option C:** `?helper=type` only (skip mode in URL)
- **Pro:** Simplest, mode is transient UI state
- **Con:** Can't deep link to info mode specifically

**Recommendation:** Option C (skip mode) - Mode is transient, not worth URL complexity

---

### 4. Mobile Dialog Behavior
**Question:** Should dialogs be full-screen on mobile or use standard Dialog sizing?

**Option A:** Full-screen on mobile (like current Dialog for small screens)
- **Pro:** More space for content, familiar pattern
- **Con:** Feels heavier, harder to dismiss

**Option B:** Standard Dialog on mobile (centered, with backdrop)
- **Pro:** Lighter feel, clear dismiss affordance
- **Con:** Less space for complex helpers

**Recommendation:** Option A (full-screen) - Helpers need space, especially on mobile

---

### 5. Implementation Priority
**Question:** Which helper should we implement first as proof-of-concept?

**Option A:** CBT Distortions (most complex)
- **Pro:** If this works, others will be easier
- **Con:** Highest risk for first implementation

**Option B:** Gratitude / Three Good Things (simplest)
- **Pro:** Low risk, fast to implement and test
- **Con:** May not reveal complexity issues

**Option C:** Do all 10 at once
- **Pro:** Faster overall delivery
- **Con:** High risk, no learning between iterations

**Recommendation:** Option B (Gratitude first) - Prove the pattern, then scale

---

## Success Metrics

### User Experience Metrics
- **Clicks to use helper:** Reduced from 3 clicks to 1 click
  - Old: Click tile → Click Explore → Interact
  - New: Click tile → Interact
- **Info discovery:** Users can preview helpers without opening
- **Screen space:** Dialog uses less horizontal space than Sheet

### Technical Metrics
- **Component reusability:** 10 helpers use same dialog pattern
- **Code maintainability:** Centralized helper info in constants
- **Bundle size:** Similar or smaller (removing Sheet complexity)

### Accessibility Metrics
- **WCAG AA compliance:** All interactions keyboard accessible
- **Screen reader support:** Proper ARIA labels and announcements
- **Touch target size:** All click targets ≥44x44px

---

## Related Documentation

- **Story 2.8:** Convert Helpers to Compact Tile-Based UI
- **Stories 2.5.x:** Individual helper implementations
- **Issue #18:** Unified Helper Framework (HelperContainer)

---

## Notes

- This story builds directly on Story 2.8 (tile-based UI)
- HelperContainer is kept for backward compatibility but not used in new flow
- All helper business logic remains unchanged (only presentation layer changes)
- Focus on UX improvement, not functionality changes

---

## Implementation Checklist

- [ ] Phase 1: Create HELPER_INFO constant
- [ ] Phase 2: Implement HelperInfoDialog
- [ ] Phase 3: Refactor helper #1 (Gratitude)
- [ ] Phase 3: Refactor helper #2-10 (remaining 9)
- [ ] Phase 4: Create HelperDialogContent router
- [ ] Phase 5: Add info icons to HelperTileGrid
- [ ] Phase 6: Update JournalStream state management
- [ ] Phase 6: Replace HelperSheet with Dialog
- [ ] Phase 7: Manual testing (all helpers, both modes)
- [ ] Phase 7: Update Playwright tests
- [ ] Phase 7: Accessibility audit
- [ ] Phase 7: Remove HelperSheet component
- [ ] Phase 7: Documentation and screenshots
- [ ] Phase 7: Create PR for review
