# Story 1.8.2: CBT Distortions Helper Component - Brownfield Addition

**Story ID**: 1.8.2
**Epic**: Epic 1.8 - Helper System Enhancement
**Story Type**: Brownfield Enhancement
**Estimated Duration**: 3-4 days
**Priority**: High
**Status**: Ready for Implementation
**Created**: October 15, 2025

---

## User Story

**As a** journal user,
**I want** a CBT Cognitive Distortions helper in my journaling interface,
**So that** I can identify and reflect on cognitive distortions I experienced through structured starter text.

---

## Story Context

### Existing System Integration

**Integrates with:**
- **JournalStream Component** (`src/components/journal/JournalStream.tsx`) - Main journaling interface
- **SimpleRichEditor Component** (`src/components/editor/SimpleRichEditor.tsx`) - Rich text editor
- **Gentle Prompts System** (Story 1.7) - Progressive disclosure pattern reference
- **Auto-save System** - 2-second debounced content changes
- **Helper Database** (Story 1.8.1) - Usage tracking and preferences

**Technology:**
- Next.js 15.5.3 (App Router, Turbopack), React 19.1.0, TypeScript ^5
- Supabase (Postgres 17, Auth, Storage) with Row-Level Security
- shadcn/ui with Notebook theme (Card, Button, Checkbox, radix primitives)
- Playwright ^1.55 for E2E testing (Story 1.8.3)

**Follows pattern:**
- **Gentle Prompts UI Pattern** (Story 1.7): Progressive disclosure with expand/collapse, blue/indigo gradient
- **Component Styling**: shadcn/ui Card and Button components
- **Auto-save Pattern**: 2-second debounced `handleContentChange` function

**Touch points:**
1. JournalStream: Render helper below Gentle Prompt
2. SimpleRichEditor: Extend with `onInsertHelper` callback
3. Supabase helpers API: Log usage with `createHelperUsage`
4. Auto-save system: Trigger debounce after insertion
5. User preferences: Check dismissal state

---

## Acceptance Criteria

### Functional Requirements

1. **Display 10 CBT Cognitive Distortions** with names, descriptions, and examples:
   - All-or-Nothing Thinking
   - Overgeneralization
   - Mental Filter
   - Discounting the Positive
   - Jumping to Conclusions
   - Magnification/Minimization
   - Emotional Reasoning
   - Should Statements
   - Labeling
   - Personalization/Blame

2. **Progressive Disclosure UI**:
   - "Explore" button expands inline panel
   - Checkboxes for selecting multiple distortions
   - "Continue" button inserts selected items as plain paragraphs
   - "Clear" button deselects all checkboxes
   - Panel collapses after insertion
   - Blue/indigo gradient styling (distinct from amber Gentle Prompt)

3. **Structured Reflection Format**:
   ```
   Today I experienced {Distortion}. Here's what happened: ...
   ```
   - Plain paragraphs (not lists or formatted text)
   - Appended to end of journal entry
   - Triggers 2-second auto-save debounce

4. **Usage Tracking**:
   - Log all interactions to `helper_usage` table via `createHelperUsage`
   - Track events: helper_opened, helper_selection, helper_inserted, helper_cleared, helper_dismissed
   - Include metadata: selection count, distortion names, timestamps

5. **Accessibility (WCAG AA)**:
   - Keyboard navigation: Tab, Enter, Space, Escape
   - Focus management: Return focus to "Explore" button after collapse
   - Exact aria-live announcements:
     - "CBT Distortions helper expanded. 10 distortions available."
     - "Selected {distortion name}"
     - "Deselected {distortion name}"
     - "Inserted {count} distortion reflections"
     - "All selections cleared"
     - "CBT Distortions helper collapsed"

### Integration Requirements

6. **Existing Gentle Prompt continues to work unchanged** - No interference with Story 1.7 functionality
7. **New helper follows progressive disclosure pattern** - Consistent with Gentle Prompt UX
8. **Integration with SimpleRichEditor maintains current behavior** - No API changes needed (uses DOM manipulation like link creation)
9. **Auto-save coordination respects existing 2-second debounce** - Uses `creatingLink` flag to prevent conflicts
10. **Link rehydration unaffected by helper insertion** - Verified in Story 1.8.3 Playwright tests

### Quality Requirements

11. **TypeScript strict mode compliance** - No type errors in `npm run build`
12. **ESLint passes** - No errors in `npm run lint`
13. **Component is covered by Playwright tests** (Story 1.8.3) - 10 test scenarios
14. **No regression in existing journaling functionality** - Verified via manual testing and Playwright
15. **No console errors in browser or terminal** - Clean logs in dev and production

---

## Technical Implementation

### Phase 1: Static Data & Review APIs (0.5 days)

#### Create CBT Distortions Data File

**File:** `src/data/cbtDistortions.ts`

```typescript
export interface CbtDistortion {
  id: string
  name: string
  description: string
  example: string
}

export const CBT_DISTORTIONS: CbtDistortion[] = [
  {
    id: 'all-or-nothing',
    name: 'All-or-Nothing Thinking',
    description: 'Viewing things in black-and-white categories...',
    example: 'If I'm not perfect, I'm a total failure.'
  },
  // ... 9 more distortions
]
```

**Source:** Issue #17, Comment 3 (Codex Integration) - exact CBT table data

#### Review Existing APIs (No Changes Needed)

**File:** `src/components/editor/SimpleRichEditor.tsx`

**Current API (already sufficient):**

```typescript
interface SimpleRichEditorProps {
  value?: string           // Current content (controlled)
  onChange?: (content: string) => void
  // ... other existing props
}
```

**Why no changes needed:**
- Helper insertion will use the same DOM manipulation pattern as link creation
- JournalStream already has direct DOM access via `document.querySelector`
- This avoids adding new API surface to SimpleRichEditor
- Maintains backward compatibility (no breaking changes)

### Phase 2: Component Implementation (2 days)

#### Create CbtDistortions Component

**File:** `src/components/journal/helpers/CbtDistortions.tsx`

**Component Structure:**

```typescript
interface CbtDistortionsProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

export function CbtDistortions({ entryId, userId, onInsert }: CbtDistortionsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [selectedDistortions, setSelectedDistortions] = useState<Set<string>>(new Set())

  // Event handlers: handleExpand, handleSelect, handleInsert, handleClear
  // Usage tracking: Log all events to helper_usage table
  // Accessibility: aria-live announcements, keyboard handlers
}
```

**UI Features:**
- Blue/indigo gradient Card (distinct from Gentle Prompt)
- Checkboxes for each distortion (shadcn/ui Checkbox component)
- Expand/collapse animation (smooth transition)
- Button states: Continue disabled if no selections, Clear disabled if no selections

#### (Optional) Create HelperContainer Abstraction

**File:** `src/components/journal/helpers/HelperContainer.tsx`

**Purpose:** Reusable wrapper for future helper types (Issue #18 compatibility)

**Features:**
- Handles expand/collapse state
- Manages aria-live announcements
- Provides consistent styling (gradient, card, spacing)

**Decision:** Defer to Story 1.8.3 if time allows, or keep as future enhancement

### Phase 3: JournalStream Integration (1 day)

#### Integrate into JournalStream

**File:** `src/components/journal/JournalStream.tsx`

**Implementation (following link creation pattern):**

```typescript
function JournalStream() {
  // ... existing code (already has creatingLink flag and entries state)

  const handleHelperInsertion = async (entryId: string, helperText: string) => {
    if (!user) {
      return
    }

    console.log('📝 Inserting helper text', { entryId, helperText })

    // Set flag to prevent content change interference (same as link creation)
    setCreatingLink(true)

    try {
      // Find the editor element for this entry using DOM query
      const editorElement = document.querySelector(
        `[data-entry-id="${entryId}"] [contenteditable]`
      ) as HTMLElement

      if (!editorElement) {
        console.error('❌ Could not find editor element for entry:', entryId)
        toast.error('Failed to insert helper text: editor not found')
        setCreatingLink(false)
        return
      }

      // Read current content from DOM
      const currentContent = editorElement.innerHTML || ''

      // Append helper text to end (plain paragraphs)
      const updatedContent = currentContent + helperText

      // Update DOM directly
      editorElement.innerHTML = updatedContent

      // Wait for DOM to settle, then read the actual content
      setTimeout(() => {
        const finalContent = editorElement.innerHTML

        // Update state with the content that includes the helper text
        setEntries(prev => prev.map(entry => {
          if (entry.id === entryId) {
            return { ...entry, content: finalContent, lastModified: new Date().toISOString() }
          }
          return entry
        }))

        // Persist to Supabase
        updateNoteInDb(entryId, { content: finalContent }, user.id)
          .then(() => console.log('💾 Persisted helper insertion to Supabase'))
          .catch(error => console.error('Error persisting helper insertion:', error))

        setCreatingLink(false)
      }, 50)
    } catch (error) {
      console.error('❌ Error inserting helper text:', error)
      toast.error('Failed to insert helper text. Please try again.')
      setCreatingLink(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* ... existing header ... */}

      {/* Existing Gentle Prompt */}
      {showPrompt && currentPrompt && (
        <Card className="p-6 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          {/* ... existing Gentle Prompt UI ... */}
        </Card>
      )}

      {/* Journal Entries - render helper inside the today entry card */}
      <div className="space-y-4">
        {entries.map((entry) => {
          const isEditingThis = editingEntryId === entry.id
          const isTodayEntry = isToday(entry.date)

          return (
            <Card key={entry.id} data-entry-id={entry.id} className="...">
              {/* ... existing entry header ... */}

              {/* NEW: CBT Distortions Helper (only on today's entry, above editor) */}
              {isTodayEntry && (
                <CbtDistortions
                  entryId={entry.id}
                  userId={user.id}
                  onInsert={(helperText) => handleHelperInsertion(entry.id, helperText)}
                />
              )}

              {/* Existing editor section */}
              <div onClick={() => setEditingEntryId(entry.id)} className="...">
                {isEditingThis ? (
                  <SimpleRichEditor
                    value={entry.content}  // NOTE: value, not content
                    placeholder={isTodayEntry ? "What's on your mind today?" : "Continue your thoughts..."}
                    onChange={(content) => handleContentChange(entry.id, content)}  // NOTE: passes entry.id
                    onBlur={...}
                    onMakeNote={handleMakeNote}
                    autoFocus
                  />
                ) : (
                  // ... read-only view ...
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* ... existing modals ... */}
    </div>
  )
}
```

**Auto-save Coordination:**
- Uses existing `creatingLink` flag to prevent interference (same as link creation)
- Directly manipulates DOM via `document.querySelector` (same pattern as link rehydration)
- Reads updated content after 50ms timeout (same as link creation)
- Updates state via `setEntries` and persists with `updateNoteInDb` (same as link creation)
- No new props needed on SimpleRichEditor (backward compatible)

---

## Technical Notes

### Integration Approach

1. **No Editor API Changes Needed:**
   - Use DOM manipulation pattern (same as link creation)
   - Find editor via `document.querySelector` with `data-entry-id`
   - Directly manipulate `innerHTML` (same as link creation)
   - SimpleRichEditor remains unchanged (fully backward compatible)

2. **Reuse Existing Patterns:**
   - Use `creatingLink` flag to prevent auto-save interference
   - Use 50ms timeout to read updated content after DOM manipulation
   - Update state via `setEntries` and persist with `updateNoteInDb`
   - Same pattern as link creation (lines 271-363 in JournalStream)

3. **Follow Gentle Prompt Pattern:**
   - Progressive disclosure UI
   - Same expand/collapse behavior
   - Blue/indigo gradient (distinct from amber Gentle Prompt)

4. **Usage Tracking Integration:**
   - Use existing `createHelperUsage` from Story 1.8.1
   - Log all events with metadata
   - No blocking operations (async)

### Existing Pattern References

- **Gentle Prompts UI** (Story 1.7): `src/components/journal/GentlePrompt.tsx`
- **Auto-save System**: `src/components/journal/JournalStream.tsx` (`handleContentChange`)
- **RLS Policies**: `supabase/migrations/20251014200000_create_helper_usage_table.sql`
- **shadcn/ui Components**: `src/components/ui/card.tsx`, `src/components/ui/button.tsx`, `src/components/ui/checkbox.tsx`

### Key Constraints

- **No breaking changes:** SimpleRichEditor requires NO modifications (uses DOM manipulation pattern)
- **No UI blocking:** Helper expansion/collapse must not freeze UI
- **No auto-save conflicts:** Uses `creatingLink` flag to prevent interference (same as link creation)
- **No console errors:** All TypeScript and runtime errors resolved
- **WCAG AA compliance:** Keyboard navigation and screen reader announcements required

---

## Definition of Done

- [ ] **Functional requirements met:**
  - [ ] 10 CBT distortions displayed with descriptions and examples
  - [ ] Progressive disclosure UI works (expand, select, insert, clear, collapse)
  - [ ] Structured reflection format inserts correctly
  - [ ] Usage tracking logs all events to helper_usage table
  - [ ] Accessibility meets WCAG AA (keyboard nav, focus, aria-live)

- [ ] **Integration requirements verified:**
  - [ ] Existing Gentle Prompt continues to work
  - [ ] New helper follows progressive disclosure pattern
  - [ ] SimpleRichEditor unchanged (no API modifications needed)
  - [ ] Auto-save coordination uses `creatingLink` flag correctly
  - [ ] Link rehydration unaffected (verify manually, test in 1.8.3)

- [ ] **Code quality:**
  - [ ] TypeScript strict mode passes (`npm run build`)
  - [ ] ESLint passes (`npm run lint`)
  - [ ] No console errors in dev or production
  - [ ] Code follows project coding standards (2-space indent, etc.)

- [ ] **Testing:**
  - [ ] Manual testing completed on localhost
  - [ ] PR created with detailed description and screenshots
  - [ ] Tested on Vercel preview deployment
  - [ ] No regression in existing journaling flow

- [ ] **Documentation:**
  - [ ] Code comments added for complex logic
  - [ ] Dev Agent Record updated in story file
  - [ ] Story 1.8.2 marked as complete

- [ ] **Deployment:**
  - [ ] PR merged to `dev` branch (by user, not Claude)
  - [ ] Tested on persistent dev environment

---

## Risk Assessment

### Primary Risk: Auto-save Coordination Conflicts

**Risk Description:** Helper insertion might interfere with existing auto-save logic or link rehydration, causing data loss or UI glitches.

**Likelihood:** Medium (JournalStream has complex timing with auto-save debounce and link rehydration)

**Impact:** High (could cause lost journal content or broken links)

**Mitigation:**
1. **Use Existing handleContentChange:** Helper insertion calls the same function that typing does
2. **Read Editor Content After Insertion:** Wait 50ms for DOM to settle, then read `editor.innerHTML`
3. **Test Link Rehydration Compatibility:** Manually verify, then add Playwright test in Story 1.8.3
4. **Flag-Based Protection:** Apply same `creatingLink` pattern if conflicts occur

**Rollback Plan:** If auto-save conflicts occur:
1. Disable helper component by removing from JournalStream
2. Remove `handleHelperInsertion` function from JournalStream
3. No other changes needed (SimpleRichEditor was never modified)
4. Helper usage data remains in database for future fixes

### Secondary Risk: Accessibility Non-Compliance

**Risk Description:** Screen reader users can't use helper effectively or aria-live announcements don't work.

**Likelihood:** Low (comprehensive accessibility spec provided in Issue #17)

**Impact:** Medium (WCAG AA non-compliance, poor UX for screen reader users)

**Mitigation:**
1. **Exact aria-live Specification:** Follow Issue #17, Comment 3 format exactly
2. **Keyboard Navigation:** Implement Tab, Enter, Space, Escape handlers
3. **Focus Management:** Return focus to "Explore" button after collapse
4. **Manual Testing:** Test with VoiceOver (Mac) or NVDA (Windows) in Story 1.8.3

**Rollback Plan:** If accessibility issues found:
1. Keep helper visible but mark as "experimental" in UI
2. Fix accessibility issues in follow-up PR
3. Re-test with screen reader before promoting to stable

---

## Validation Checklist

### Scope Validation

- [x] Story scope is clear (CBT Distortions component implementation)
- [x] Integration approach is straightforward (follows Gentle Prompt pattern)
- [x] Follows existing patterns (progressive disclosure, auto-save coordination)
- [x] Estimated at 3-4 days (realistic timeline)

### Clarity Check

- [x] Story requirements are unambiguous (15 acceptance criteria)
- [x] Integration points are clearly specified (5 touch points)
- [x] Success criteria are testable (manual + Playwright in Story 1.8.3)
- [x] Rollback approach is simple (remove component, revert editor)

### Dependencies Check

- [x] Story 1.8.1 (Helper Database Infrastructure) is complete
- [x] Issue #17 specifications are comprehensive (4,000+ lines of docs)
- [x] Gentle Prompts System (Story 1.7) is deployed and working
- [x] Auto-save system is stable and tested

---

## Related Documentation

### Issue #17 Documentation (4,000+ lines)

1. **Original Issue:** [#17](https://github.com/levineam/Signum/issues/17) - UX requirements, accessibility, CBT table
2. **Architecture Review:** [Comment 1](https://github.com/levineam/Signum/issues/17#issuecomment-3403300313) - 9 recommendations, gaps analysis
3. **Updated Specification:** [Comment 2](https://github.com/levineam/Signum/issues/17#issuecomment-3403427651) - Database schema, TypeScript types (1,100+ lines)
4. **Codex Integration:** [Comment 3](https://github.com/levineam/Signum/issues/17#issuecomment-3403523034) - Deterministic specs, exact aria-live format, CBT data

### Project Documentation

- **PRD:** `docs/prd.md` - Product requirements, Story 1.7 context
- **Epic 1.8:** `docs/stories/epic-1.8-helper-system-enhancement.md` - Full epic specification
- **Story 1.8.1:** `docs/stories/story-1.8.1-helper-database-infrastructure.md` - Database foundation (COMPLETE)
- **Tech Stack:** `docs/architecture/tech-stack.md` - Next.js 15.5.3, Supabase, shadcn/ui
- **Coding Standards:** `docs/architecture/coding-standards.md` - TypeScript strict, 2-space indent
- **CLAUDE.md:** `.claude/CLAUDE.md` - PR-based workflow, Vercel preview testing

---

## Dev Agent Record

_This section will be updated by the Dev Agent during implementation._

### Files Created/Modified

- [ ] `src/data/cbtDistortions.ts` - Static CBT distortions data (NEW)
- [ ] `src/components/journal/helpers/CbtDistortions.tsx` - Component implementation (NEW)
- [ ] `src/components/journal/helpers/HelperContainer.tsx` - (Optional) Abstraction (NEW)
- [ ] `src/components/journal/JournalStream.tsx` - Add `handleHelperInsertion` function (MODIFIED)

**Note:** SimpleRichEditor requires NO changes - helper insertion uses DOM manipulation pattern from link creation.

### Test Results

_To be completed after manual testing and Vercel preview deployment._

### Change Log

_Chronological log of significant changes during implementation._

### Status

**Current Status:** Ready for Implementation
**Blockers:** None (Story 1.8.1 complete)
**Next Steps:** Begin Phase 1 (Static Data & Types)

---

**Story Status:** ✅ **READY FOR IMPLEMENTATION**

**Next Action:** Dev Agent to begin implementation with Phase 1 (Static Data & Types).
