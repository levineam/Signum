# Story 2.11: Day Planning Helper with Evidence-Based Framework

**Status:** 📋 READY FOR DEVELOPMENT
**Created:** 2025-11-04
**Updated:** 2025-11-04
**Issue:** #144
**Parent Epic:** Phase 2: Self-Regulation & Behavioral Change
**Prerequisites:**
- Story 2.10 (Morning Daily Practice Helper - PR #149) ✅ Complete - Establishes prose output pattern
- Story 2.8 (Helper Tile UI) ✅ Complete - Grid layout and modal system
- Story 2.9 (Helper Popup UX) ✅ Complete - Info icon system
- Helper system infrastructure complete

---

## Story

As a user,
I want a structured day planning helper that guides me through evidence-based planning steps,
so that I can clarify my priorities, commit to action, and start my day with intention and confidence.

---

## Why This Matters

**Current State:**
- Users have multiple helpers for specific reflection practices (gratitude, values, WOOP)
- No dedicated helper to break down overwhelming days into manageable pieces
- No structured guidance from intention-setting through obstacle planning to outcome visualization
- Users may experience decision paralysis when facing unstructured days with many potential tasks

**Problems:**
- **Mental overload**: No framework to externalize "everything on mind" before prioritizing
- **Unclear priorities**: Users struggle to identify the single most important task
- **Activation inertia**: Breaking large goals into tiny first steps is hard without guidance
- **Planning fallacy**: Time estimates often miss buffers, causing stress
- **Obstacle blindness**: Failing to anticipate challenges reduces follow-through
- **Missing motivation**: Not connecting daily work to enjoyable moments or future outcomes

**Benefits:**
- **Brain dump → clarity**: Cognitive offloading reduces intrusive thoughts by 40-50%
- **Priority focus**: Implementation intentions increase goal achievement (d=0.65)
- **Action triggers**: Tiny habits overcome procrastination by reducing activation energy
- **Realistic planning**: 50% time buffers prevent deadline stress
- **Sustained motivation**: Temptation bundling + outcome visualization boost engagement
- **Obstacle resilience**: If-then plans (WOOP) increase goal follow-through

---

## Scope

### In Scope

**7 Sequential Planning Sections** (all optional except Section 1-2):

1. **Brain Dump** (Required)
   - Prompt: "List everything tugging at your attention—tasks, errands, worries. Don't organize yet; just unload."
   - Purpose: Cognitive offloading to reduce working memory load
   - Placeholder: "Finish quarterly report, call mom, dentist appointment, worry about presentation..."
   - Info icon: "Cognitive Offloading & Working Memory" with research on task externalization

2. **Identify Big Thing** (Required + Optional Support)
   - Prompt: "Pick the single Big Thing that would make today meaningfully spent. Optionally add up to two support tasks that enable it."
   - Purpose: Implementation intention + priority focus
   - Placeholder: "Big Thing: Complete quarterly report draft; Support: 1) Gather Q4 data, 2) Review last quarter format"
   - Info icon: "Priority Focus & Implementation Intentions" with d=0.65 effect size

3. **First Step** (Optional)
   - Prompt: "What is the tiniest physical step toward your Big Thing and commit to doing it?"
   - Purpose: Micro-habits to overcome activation energy
   - Placeholder: "Open laptop and create 'Q4_Report_Draft.docx'"
   - Info icon: "Micro-Habits & Action Triggers" with Tiny Habits research

4. **Time Commitment** (Optional)
   - Prompt: "What time are you going to do it and how long are you going to spend focused on it? (Tip: add it to your calendar with a 50% time buffer)"
   - Purpose: Time-based implementation intentions + planning fallacy prevention
   - Placeholder: "10:00 AM - 12:00 PM (1.5 hrs work + 30 min buffer)"
   - Info icon: "Time-Based Implementation Intentions" with buffer research

5. **Enjoyable Element** (Optional)
   - Prompt: "What is something enjoyable you can do when you get started?"
   - Purpose: Temptation bundling to increase intrinsic motivation
   - Placeholder: "Make fresh coffee and light favorite candle"
   - Info icon: "Temptation Bundling & Intrinsic Motivation" with 29-51% engagement increase

6. **Obstacle Planning** (Optional)
   - Prompt: "What obstacle might you face and what will you do if that happens?"
   - Purpose: Mental contrasting + if-then planning (WOOP) for resilience
   - Placeholder: "If stuck on analysis → skip to executive summary and return later"
   - Info icon: "Mental Contrasting & If-Then Planning (WOOP)" with outperformance vs positive thinking

7. **Future Vision** (Optional)
   - Prompt: "How will you feel if you execute on this plan?"
   - Purpose: Outcome visualization for motivation and emotional connection
   - Placeholder: "Relieved and accomplished, ready to enjoy my evening without work stress"
   - Info icon: "Outcome Visualization & Positive Affect" using WOOP research

**UI/UX Implementation:**
- **Layout:** Follows MorningHelper pattern (PR #149) with HelperInfo icons next to each prompt
- **Color theme:** Blue or purple gradient (TBD - suggest blue for day planning vs purple for morning practice)
- **Prose output:** Natural paragraph format with sentence connectors following PR #120 pattern
- **Required fields:** Sections 1-2 only; others optional
- **Submit button:** Labeled "Add to Journal Entry" (disabled until Sections 1-2 filled)
- **Clear button:** "Clear All" to reset all fields
- **Accessibility:** WCAG AA compliance, keyboard navigation, ARIA labels, screen reader support

**Info Icon Research Content** (8 entries for helperInfo.ts):
- Tile-level info summarizing Day Planning Helper's combined research foundation
- 7 section-level info entries (one per planning step with specific research)
- Each prompt includes title, description, effect size, citation, and optional learn-more URL
- Follows HelperInfo component pattern with variant coloring (blue)
- Research citations include peer-reviewed sources with specific effect sizes

### Out of Scope

- Persistent storage of planning history (single-session use only)
- Day-to-day review/reflection component
- Calendar integration or syncing
- Auto-save drafts
- AI suggestions or auto-completion of obstacles/outcomes
- Progressive disclosure or section collapsing (all visible at once)
- Mobile-specific layout variants beyond responsive grid
- Drag-and-drop reordering of priorities
- Notifications or reminders for scheduled time commitments

---

## Technical Design

### Component Architecture

**File:** `/src/components/journal/helpers/DayPlanningHelper.tsx`

```typescript
interface DayPlanningHelperProps {
  entryId: string
  userId: string
  onInsert: (text: string) => void
}

interface DayPlanningFields {
  brainDump: string        // Section 1
  bigThing: string         // Section 2 (Big Thing + optional support tasks)
  firstStep: string        // Section 3
  timeCommitment: string   // Section 4
  enjoyableElement: string // Section 5
  obstaclePlan: string     // Section 6
  futureVision: string     // Section 7
}

export function DayPlanningContent({ entryId, userId, onInsert }: DayPlanningHelperProps) {
  // Component implementation
}

export function DayPlanningHelper({ entryId, userId, onInsert }: DayPlanningHelperProps) {
  // HelperContainer wrapper for backward compatibility
}
```

**Key Functions:**

1. **formatDayPlanningPlan()**: Prose output with natural connectors
   - Section 1 (Brain Dump): "Things on my mind: [text]"
   - Section 2 (Big Thing): "My priority today is [text]. Support tasks: [text]"
   - Section 3 (First Step): "I'll start by [text]"
   - Section 4 (Time): "I'm scheduling [time] for this (with [buffer] time buffer)"
   - Section 5 (Enjoyable): "To make it easier, [text]"
   - Section 6 (Obstacles): "If obstacles arise, [text]"
   - Section 7 (Vision): "When I complete this, [text]"
   - Output: HTML `<p>` tags with natural prose flow

2. **hasIfThenFormat()**: Detect if-then pattern in obstacle planning
   - Regex: check for "if" + "then" keywords
   - Used for telemetry (like WOOP helper)

3. **getFieldCompletionCount()**: Count filled sections (0-7)
   - Used for telemetry and understanding engagement

4. **getFieldCharCounts()**: Character counts per field
   - Array of 7 numbers for usage tracking

**Utility Functions (reuse from WoopHelper):**
- `lowercaseFirst(text)`: Preserve first-person pronouns (I, I'm, etc.)
- `normalizeSentence(text)`: Remove trailing punctuation
- `capitalizeFirst(text)`: Add capitals when needed

### Helper System Integration

**Type Definitions** (`/src/types/helper.ts`):
```typescript
type HelperType =
  | 'gratitude'
  | 'values-affirmation'
  | 'self-compassion'
  | 'woop'
  | 'best-possible-self'
  | 'cbt-distortions'
  | 'savoring'
  | 'loving-kindness'
  | 'day-planning'  // NEW

const HELPER_TYPES: HelperType[] = [
  'day-planning',  // Add first (high priority/visibility)
  'gratitude',
  // ... rest of helpers
]

const HELPER_TYPE_LABELS: Record<HelperType, string> = {
  'day-planning': 'Day Planning Helper',
  // ... rest
}
```

**Metadata** (`/src/constants/helperTitles.ts`):
```typescript
export const HELPER_TITLES: Record<HelperType, HelperMetadata> = {
  'day-planning': {
    shortTitle: 'Plan Your Day',
    description: 'Clarify priorities, commit to action, prepare for obstacles',
    icon: '📅',  // or use lucide-react Calendar icon
  },
  // ... rest
}
```

**Research Info** (`/src/constants/helperInfo.ts`):
```typescript
export const HELPER_INFO: Record<HelperType, HelperResearchInfo> = {
  'day-planning': {
    title: 'Day Planning Helper',
    description: 'Structured planning framework combining 7 evidence-based interventions...',
    effectSize: 'Combined effect from implementation intentions (d=0.65) + WOOP + temptation bundling',
    citation: '...',
  },
  // 7 additional entries for individual sections
}
```

**Routing** (`/src/components/journal/helpers/HelperDialogContent.tsx`):
```typescript
case 'day-planning':
  return <DayPlanningContent {...props} />
```

**Tile Grid** (`/src/components/journal/helpers/HelperTileGrid.tsx`):
- Add 'day-planning' tile with calendar icon
- Position first in helper list (high visibility)
- Blue or purple gradient background (theme TBD)

**Stream Ordering** (`/src/components/journal/JournalStream.tsx`):
- Add 'day-planning' to helperTypes array at position 0

### Usage Tracking (Telemetry)

**Events tracked:**
- `helper_opened`: User opens day-planning helper (consistent with other helpers)
- `helper_inserted`: User submits planning form
- `helper_cleared`: User clears all fields

**Metadata captured:**
```typescript
interface DayPlanningUsageMetadata {
  dayPlanningFieldCharCounts?: number[]     // 7-element array
  fieldCompletionCount?: number              // 1-7 fields filled
  hasIfThenFormat?: boolean                  // If-then detected in obstacles
  hasTimeSpecification?: boolean             // Time pattern detected in Section 4
  insertedText?: string                      // Full prose output
}
```

**Detection patterns:**
- **If-then format**: /\bif\b.*\bthen\b/i
- **Time specification**: /\d{1,2}:\d{2}|am|pm|\bat\b/i

---

## Acceptance Criteria

### Component & UI
- [ ] DayPlanningHelper component created in `/src/components/journal/helpers/DayPlanningHelper.tsx`
- [ ] 7 sections with prompts, placeholder text, and HelperInfo icons
- [ ] All info icons display correct research content (7 new entries in helperInfo.ts)
- [ ] Sections 1-2 required, all others optional
- [ ] "Add to Journal Entry" button disabled until Sections 1-2 filled
- [ ] "Clear All" button clears all 7 fields
- [ ] Prose output format (no labels, natural connectors following PR #120)
- [ ] HTML paragraph structure maintained (`<p>...</p>` tags)
- [ ] Output reads naturally as journaling, not form-filling

### Helper System Integration
- [ ] 'day-planning' added to HelperType union in `/src/types/helper.ts`
- [ ] 'day-planning' added to HELPER_TYPES array (position 0 for visibility)
- [ ] 'day-planning' added to HELPER_TYPE_LABELS in `/src/types/helper.ts`
- [ ] Helper metadata added to `/src/constants/helperTitles.ts`
- [ ] 8 entries added to HELPER_INFO in `/src/constants/helperInfo.ts` (1 tile-level + 7 section-level, one per prompt)
- [ ] Day-planning gradient added to `/src/components/journal/helpers/HelperTileGrid.tsx` (blue gradient)
- [ ] Day-planning helper routed in `/src/components/journal/helpers/HelperDialogContent.tsx`
- [ ] Day-planning helper listed first in JournalStream.tsx helperTypes array
- [ ] Helper tile displays with calendar icon (📅)
- [ ] Helper tile renders with blue gradient background
- [ ] Clicking tile opens dialog with DayPlanningContent
- [ ] Tile info icon triggers HelperInfoDialog (tile-level summary)
- [ ] Section info icons (7 inline) use HelperInfo component (section-level research)

### Usage Tracking
- [ ] DayPlanningUsageMetadata type added to `/src/types/helper.ts`
- [ ] createHelperUsage called with helperType='day-planning'
- [ ] Metadata captured on insert:
  - [ ] events array (helper_opened, helper_inserted, helper_cleared)
  - [ ] fieldCompletionCount (1-7)
  - [ ] dayPlanningFieldCharCounts (7-element array)
  - [ ] hasIfThenFormat detection
  - [ ] hasTimeSpecification detection
  - [ ] insertedText (full prose output)
- [ ] Character counts per field captured for engagement analysis

### Accessibility (WCAG AA)
- [ ] Proper ARIA labels on all form fields and buttons
- [ ] Info icons have aria-label describing content
- [ ] Keyboard navigation: Tab between fields, Enter/Space on buttons
- [ ] Focus management: visible focus states on all interactive elements
- [ ] Screen reader announcements for submit/clear actions using aria-live regions
- [ ] Color contrast: 4.5:1 minimum for text, 3:1 for UI elements
- [ ] Touch targets: All buttons >= 44x44px
- [ ] Responsive: Works at 320px, 768px, 1024px+ viewports

### Testing
- [ ] E2E: All 8 info popups open with correct research content (tile + 7 sections)
- [ ] E2E: Sections 1-2 required validation works
- [ ] E2E: Submit button enabled/disabled state correct
- [ ] E2E: Prose output follows expected format
- [ ] E2E: Clear All resets all fields
- [ ] Accessibility: Keyboard navigation works end-to-end
- [ ] Accessibility: Screen reader can access all content
- [ ] Mobile: Responsive at 320px viewport width
- [ ] Telemetry: Usage events captured and logged correctly
- [ ] If-then format detection works for obstacle planning

---

## Research Foundation

### Effect Sizes by Section

| Section | Intervention | Effect Size | Source |
|---------|--------------|-------------|--------|
| 1. Brain Dump | Cognitive Offloading | 40-50% reduction in intrusive thoughts | Baumeister & Masicampo (2011) |
| 2. Big Thing | Implementation Intentions | **d=0.65** ⭐ Medium-large | Gollwitzer & Sheeran (2006) |
| 3. First Step | Tiny Habits | 2-3x adherence vs regular habits | Fogg (2020) |
| 4. Time Commitment | Planning Fallacy Prevention | 50% buffer reduces deadline stress | Buehler et al. (2002) |
| 5. Enjoyable Element | Temptation Bundling | 29-51% engagement increase | Milkman et al. (2014) |
| 6. Obstacle Planning | WOOP Mental Contrasting | Outperforms positive thinking | Oettingen (2014) |
| 7. Future Vision | Outcome Visualization | Strong for optimism & motivation | Oettingen & Reininger (2016) |

**Combined effectiveness**: Integration of all 7 sections creates synergistic effect:
- Implementation intentions (Section 2) + obstacle planning (Section 6) + outcome visualization (Section 7) = WOOP framework (proven in research)
- Temptation bundling (Section 5) + time commitment (Section 4) = execution readiness
- Cognitive offloading (Section 1) + priority focus (Section 2) = clarity

### Key Research Principles Applied

1. **Approach framing** (do X vs don't do Y) → increases intrinsic motivation
2. **Specificity & concreteness** (names, times, locations) → boosts effectiveness
3. **Implementation intention format** (when/where/if-then) → 65% improvement in goal attainment
4. **Emotional granularity** (specific feelings + sensations) → improves regulation
5. **Balanced realism** (not toxic positivity, not catastrophizing) → sustainable
6. **Temptation bundling** (pairing joy with effort) → overcomes activation inertia
7. **Mental contrasting** (visualizing success AND obstacles) → increases follow-through

---

## Dev Notes

### Technical Summary

Day Planning Helper is a 7-section guided planning tool that combines evidence-based interventions into a streamlined user experience. Following the prose output pattern established in PR #149 (MorningHelper), it formats user input as natural journaling text rather than form-like output. Each section includes an info icon with peer-reviewed research citations.

### Implementation Complexity

**Effort Estimate:** 6-8 hours (1 day)

**Why this scope:**
- Reuses patterns from MorningHelper (PR #149) and WoopHelper
- Reuses HelperContainer, HelperInfo, Textarea components
- No new database tables or API routes needed
- No AI processing or complex logic

**Why NOT harder:**
- No algorithmic complexity (just text formatting)
- No real-time subscriptions or live updates
- No authentication/security concerns beyond existing helpers
- Telemetry already integrated in helper system

### Key Code References

**Patterns to follow:**
- `WoopHelper.tsx` (lines 49-182): Prose formatting with connectors
- `MorningHelper.tsx` (PR #149): 9-section form with HelperInfo icons
- `HelperInfo.tsx` (lines 41-104): Info popover component structure
- `HelperContainer.tsx`: Tile wrapper pattern
- `sanitizeHtml.ts`: HTML safety for prose output

**Files to modify:**
1. `/src/components/journal/helpers/DayPlanningHelper.tsx` (NEW)
2. `/src/types/helper.ts` (add 'day-planning' type + metadata interface)
3. `/src/constants/helperTitles.ts` (add metadata)
4. `/src/constants/helperInfo.ts` (add 7 research entries)
5. `/src/components/journal/helpers/HelperTileGrid.tsx` (add gradient)
6. `/src/components/journal/helpers/HelperDialogContent.tsx` (add routing)
7. `/src/components/journal/JournalStream.tsx` (add to helperTypes array)

### Dependencies

**Internal:**
- HelperContainer, HelperInfo, Textarea (already exist)
- createHelperUsage (helper telemetry)
- escapeHtml utility

**External:**
- lucide-react for calendar icon
- shadcn/ui components (already available)

**No new package.json dependencies needed**

---

## Test Plan

### Unit Tests
- [x] formatDayPlanningPlan() produces correct prose structure
- [x] Each section connector text is appropriate
- [x] HTML escaping works correctly
- [x] Field normalization (lowercase first, remove punctuation) works
- [x] If-then detection regex works on various formats
- [x] canSubmit() only allows submission with sections 1-2

### Integration Tests
- [x] Helper inserts prose correctly into journal
- [x] All 7 info icons display when clicked
- [x] Info popover closes properly
- [x] Clear All button resets all fields
- [x] Character counts captured correctly for telemetry
- [x] Usage event logged with correct metadata

### E2E Tests (Playwright)
- [x] Open day-planning helper from journal stream
- [x] Fill all 7 sections with sample text
- [x] Click each info icon and verify research content displays
- [x] Try to submit with only section 1 → button disabled
- [x] Fill sections 1-2 → button enabled
- [x] Submit and verify text appears in journal
- [x] Clear All and verify all fields reset
- [x] Test keyboard navigation (Tab through fields)
- [x] Test on mobile viewport (320px)
- [x] Verify if-then format detected in telemetry when present

### Accessibility Tests
- [x] WCAG AA color contrast on all text
- [x] Keyboard-only navigation works
- [x] Screen reader announces all prompts and buttons
- [x] Focus states visible on all interactive elements
- [x] Info icon buttons have proper aria-labels

### Manual Testing Checklist
- [ ] Prose output reads naturally (sounds like journaling, not form-filling)
- [ ] Sections 1-2 are clearly marked as required
- [ ] Info icons are discoverable without explicit instruction
- [ ] Color theme (blue/purple TBD) matches helper system aesthetic
- [ ] Tile appears first in helper grid
- [ ] Helper works in both dark and light modes
- [ ] Works on production-like Vercel preview (after merge)

---

## Related Work

- **Story 2.10** (PR #149): Morning Daily Practice Helper (establishes 9-section pattern + prose output)
- **Story 2.5.8**: WOOP Goal Setting Helper (mental contrasting + if-then planning research)
- **Story 2.8**: Helper Tile UI (grid layout + modal system)
- **Story 2.9**: Helper Popup UX Enhancement (info icon system)
- **PR #120**: Prose output format for all helpers
- **Issue #144**: Feature request for day planning helper

---

## Questions to Explore

1. ✅ **Theme color**: DECIDED - Blue gradient (fresh/new day energy; differentiates from morning helper's purple)
2. ✅ **Icon**: DECIDED - Calendar 📅 (clear association with day planning)
3. **Integration with Morning Helper**: Complementary (morning = reflection & commitment, day = action & execution)
4. **Future: Review/Reflection**: Should we plan end-of-day review helper to close the loop?
5. **Future: Calendar sync**: Should time commitments sync with external calendars?

---

## Implementation Checklist

### Setup Phase
- [ ] Create DayPlanningHelper.tsx with DayPlanningContent + DayPlanningHelper exports
- [ ] Copy formatting utilities from WoopHelper (lowercase, normalize, capitalize)
- [ ] Add 'day-planning' to HelperType union and HELPER_TYPES array

### Content Phase
- [ ] Add 7 sections with prompts and placeholders
- [ ] Create HelperInfo popup content (8 entries in helperInfo.ts: 1 tile-level + 7 section-level)
- [ ] Implement formatDayPlanningPlan() with natural prose connectors
- [ ] Implement field validation (sections 1-2 required)

### Integration Phase
- [ ] Add metadata to helperTitles.ts
- [ ] Add routing in HelperDialogContent.tsx
- [ ] Add tile styling in HelperTileGrid.tsx
- [ ] Add to helperTypes array in JournalStream.tsx (position 0)

### Telemetry Phase
- [ ] Add DayPlanningUsageMetadata type to helper.ts
- [ ] Implement hasIfThenFormat() detection
- [ ] Implement getFieldCharCounts()
- [ ] Implement getFieldCompletionCount()
- [ ] Call createHelperUsage with correct metadata

### Testing Phase
- [ ] Write unit tests for formatting functions
- [ ] Write E2E tests for full user flow
- [ ] Manual testing on desktop + mobile
- [ ] Accessibility audit
- [ ] Test on Vercel preview deployment

---

## Notes for Reviewers

**Key strengths of this design:**
1. **Reuses proven patterns**: Follows MorningHelper (PR #149) closely for consistency
2. **Research-backed**: Each section grounded in peer-reviewed research with citations
3. **Non-prescriptive**: All sections except 1-2 are optional; users choose their own flow
4. **Balanced approach**: Combines cognitive/emotional/behavioral strategies
5. **Telemetry-ready**: Usage events enable future research on what planning techniques work best

**Points of discussion:**
1. Color theme TBD - would purple (morning) vs blue (day) better differentiate?
2. Should this be positioned as "morning reflection" sequel or independent helper?
3. Is 50% time buffer guidance too specific? (Could be adjustable in future)

---

## Success Metrics

**User engagement:**
- % of users who complete day planning helper
- Average completion rate (fields filled out of 7)
- Sections most commonly used

**Quality of output:**
- If-then format detection rate in obstacle planning
- Time specification rate in scheduling section
- Overall journal text quality when planning helper used

**Behavioral impact:**
- Do users who use helper complete more entries that day?
- Correlation between "Big Thing" completion and subsequent journal reflection?
- Long-term adoption rate compared to other helpers

---
