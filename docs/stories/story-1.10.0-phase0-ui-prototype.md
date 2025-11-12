# Story 1.10.0: Phase 0 - UI Design & Interactive Prototype

**Story ID**: 1.10.0
**Epic**: Epic 1.10 (Unified Tasks & Reminders System - Clean Rebuild)
**Type**: UI/UX Prototype
**Status**: ✅ COMPLETE
**Priority**: High
**Estimated Effort**: 1 day
**Actual Effort**: 1 day
**Created**: 2025-11-06
**Completed**: 2025-11-11
**Related PR**: #161

---

## Goal

Build interactive UI prototype for Tasks and Reminders widgets to validate design and user experience before implementing backend infrastructure.

---

## Acceptance Criteria

- [x] RemindersWidget component with collapsible header
- [x] TasksWidget component with collapsible header
- [x] Mock data service with realistic reminders and tasks
- [x] Widgets integrated above journal element on home page
- [x] Responsive layout (side-by-side on desktop, stacked on mobile)
- [x] Persistent expand/collapse state via localStorage
- [x] Badge counts showing pending items
- [x] Thin, compact headers with balanced padding
- [x] Perfect alignment with journal container
- [x] Accessibility (ARIA labels, keyboard navigation)
  - ✓ ARIA: `aria-expanded`, `aria-controls`, `aria-labelledby` on collapsible buttons
  - ✓ Keyboard: Tab navigation, Enter/Space to toggle expand/collapse
  - ✓ Screen reader: Role semantics (`<button>`, `<div role="region">`)
  - Note: Full accessibility audit (WCAG 2.1 AA, contrast checks) deferred to Phase 2
- [x] User approval of final UI/UX

---

## Implementation Summary

### Components Created

**1. Mock Data Service** (`src/lib/mock/temporalMockData.ts`)
- 3 mock reminders (including recurring items)
- 5 mock tasks (various priorities and statuses)
- `formatDueTime()` helper function ("in 2h", "3h overdue", etc.)
- TypeScript interfaces: `MockReminder`, `MockTask`

**2. RemindersWidget** (`src/components/widgets/RemindersWidget.tsx`)
- Collapsible header with Bell icon, title, and badge count
- localStorage persistence for expand/collapse state
- Empty state with "New Reminder" button
- Individual reminder rows with Complete and Snooze actions
- Recurrence badges for repeating reminders
- 300ms smooth collapse animation

**3. TasksWidget** (`src/components/widgets/TasksWidget.tsx`)
- Similar structure to RemindersWidget with CheckSquare icon
- Priority badges (high/medium/low with color coding)
- Task rows with Complete, Edit, and Delete actions
- Time estimate display (e.g., "30m")
- Keyboard accessibility (useId for ARIA relationships)

**4. Card Component Enhancement** (`src/components/ui/card.tsx`)
- Added `spacing` prop: `"default"` | `"compact"`
- `spacing="compact"` removes excessive vertical padding
- Solves shadcn Card's opinionated `py-6 gap-6` defaults
- Reusable pattern for future dense UI components

**5. Home Page Integration** (`src/app/page.tsx`)
- Widgets placed above JournalStream component
- Container matches journal width (`max-w-4xl mx-auto px-6`)
- Grid layout on desktop (2 columns), stacked on mobile
- Consistent `gap-6` spacing throughout

---

## Design Decisions

### Layout Challenges Resolved

**Problem**: Widget headers were too tall with excessive padding
**Root Cause**: shadcn Card component has `py-6` (24px) and `gap-6` (24px) baked in
**Solution**: Created `spacing="compact"` variant that overrides to `py-0 gap-0`

**Problem**: Top/bottom padding appeared unbalanced
**Root Cause**: Card's `gap-6` between children + CardHeader's conditional `pb-6`
**Solution**: Compact spacing removes all Card-level padding, delegates to button's `py-2 px-4`

### Spacing Variant Pattern (Reusable)

```tsx
// Card Component
<Card spacing="compact">  // Instead of className="py-0 gap-0"
  <CardHeader spacing="compact" className="p-0">
    <button className="py-2 px-4">  // Controls actual header height
```

**Benefits**:
- ✅ Clean, declarative API
- ✅ No brittle className overrides
- ✅ Reusable for future widgets
- ✅ Default Card behavior unchanged (backward compatible)

---

## Technical Debt / Follow-ups

None - this is a prototype with mock data. Phase 1 will replace inline task detection with widget-based workflows.

---

## Testing Notes

**Manual Testing Performed**:
- ✅ Expand/collapse state persists across page reloads
- ✅ Responsive layout works on desktop and mobile viewports
- ✅ Keyboard navigation (Tab, Enter, Space) works correctly
- ✅ Alignment matches journal container perfectly
- ✅ Badge counts update correctly based on pending items
- ✅ Empty states render when no items exist

**Browser & Device Testing**:
- ✓ Chrome on macOS (Vercel preview)
- ⚠️ Firefox, Safari, mobile browsers - Not tested (risk: layout may differ)
- ⚠️ Recommended: Cross-browser verification in Phase 2 before production release
- ✓ Mobile viewport (responsive grid to stacked layout confirmed in DevTools)

---

## Commits

1. `feat: Add mock temporal data service for prototype widgets`
2. `feat: Add RemindersWidget with collapse and localStorage`
3. `feat: Add TasksWidget with priority badges and actions`
4. `feat: Integrate widgets into home page above journal`
5. `fix: Align widgets with journal container and reduce height by 50%`
6. `fix: Override Card's default py-6 padding to create thin headers`
7. `fix: Remove Card's gap-6 to ensure symmetric padding`
8. `refactor: Add spacing variant to Card primitives`
9. `fix: remove implicit gap from compact headers`

---

## User Feedback

> "Looks great! Couple of minor pieces of feedback..."
> "Much better, but now there's a little more padding on the bottom than the top..."
> "Ok, we have finally resolved the issue about the widget height."
> **"I reviewed the Vercel preview and I approve the UI."** ✅

---

## How to Try the Prototype

**Live Preview**: [Vercel Preview URL](https://[pr-number]-signum.vercel.app/) (available during PR review)

**Local Testing**:
```bash
npm run dev
# Navigate to http://localhost:3000
# Widgets appear above the Journal element
# Click headers to expand/collapse
# Expand state persists across page reloads
```

**Feature Walkthrough**:
1. **Reminders Widget**: Shows "Call mom", "Doctor appointment", "Team standup"
   - Click to expand and see individual reminders
   - Each reminder shows due time and recurrence (if repeating)
   - Snooze and complete actions available
2. **Tasks Widget**: Shows 5 sample tasks with priorities
   - Click to expand and see task list
   - Priority color-coding (red=high, gray=medium, blue=low)
   - Edit, complete, and delete actions available
3. **Responsive Design**: Resize browser to see layout change (2 columns → 1 column on mobile)
4. **Persistence**: Expand widgets, refresh page, state persists via localStorage

---

## Spacing Variant Usage Guide

Created reusable `spacing="compact"` pattern for dense UI components.

**Usage**:
```tsx
// Default Card (wide spacing)
<Card>
  <CardHeader><h2>Title</h2></CardHeader>
  <CardContent>Content</CardContent>
</Card>

// Compact Card (thin headers, no vertical padding)
<Card spacing="compact">
  <CardHeader spacing="compact" className="p-0">
    <button>Collapsible Header</button>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

**When to Use**:
- `spacing="default"`: Standard panels, forms, content cards
- `spacing="compact"`: Collapsible widgets, sidebars, dense lists

For more details, see `/docs/components.md` (Component Library).

---

## Next Steps

- Proceed to **Story 1.10.1: Phase 1 - Clean Slate** (remove old tasks/reminders implementation)
- After Phase 1 complete, begin **Phase 2: PRD Schema Foundation** (new database tables)
