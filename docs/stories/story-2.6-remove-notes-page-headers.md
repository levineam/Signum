# Story 2.6: Remove Redundant Notes Page Headers

**Story ID**: 2.6
**Story Type**: UI Cleanup
**Related Issue**: [#39 - Remove redundant header text from Notes page](https://github.com/levineam/Signum/issues/39)
**Status**: Ready for Review
**Estimated Duration**: 0.5 days
**Created**: October 17, 2025

---

## Story Goal

Remove redundant header text from the Notes page to provide a cleaner, more focused user experience.

---

## Story Description

### Problem Statement

The Notes page currently displays redundant header text that clutters the UI:
- Main heading: "Notes"
- Subheading: "Your reflections and custom notes"
- Section heading: "All Notes"

This verbose header text takes up unnecessary vertical space and distracts from the primary content (the user's notes).

### Solution

Remove all redundant header text from the Notes page, allowing users to see their notes immediately without visual clutter.

### Technical Context

**Component Location**: Likely in `src/app/notes/page.tsx` or a component within `src/components/notes/`

**Tech Stack**:
- Next.js 15.5.3 (App Router)
- React 19.1.0
- TypeScript ^5
- shadcn/ui with Notebook theme

---

## Acceptance Criteria

- [x] Remove "Notes" heading from the Notes page
- [x] Remove "Your reflections and custom notes" subheading
- [x] Remove "All Notes" section heading
- [x] Verify page still has appropriate spacing and visual hierarchy
- [x] Test on both desktop and mobile viewports
- [x] No regression in existing Notes functionality (viewing, creating, editing notes)
- [x] Build succeeds: `npm run build`
- [x] Lint passes: `npm run lint`

---

## Tasks

### Task 1: Locate and Update Notes Page Component
- [x] Find the Notes page component (likely `src/app/notes/page.tsx`)
- [x] Identify where header text is rendered
- [x] Remove "Notes" h1/h2 heading
- [x] Remove "Your reflections and custom notes" subheading
- [x] Remove "All Notes" section heading
- [x] Adjust spacing/padding to maintain visual hierarchy

### Task 2: Testing & Validation
- [x] Test Notes page on desktop viewport (1920x1080)
- [x] Test Notes page on mobile viewport (375x667)
- [x] Verify notes list displays correctly without headers
- [x] Verify no layout shift or overflow issues
- [x] Run `npm run build` to ensure compilation succeeds
- [x] Run `npm run lint` to ensure no ESLint errors

---

## Dev Notes

**Before Starting**:
1. Run `npm run dev` to start local development server
2. Navigate to `/notes` route to see current state
3. Take screenshot for comparison (before/after)

**Implementation Notes**:
- This is a simple UI cleanup task - no business logic changes
- Focus on removing text while maintaining proper spacing
- Ensure no console errors after removal
- Check for any conditional rendering that might rely on these headers

**Potential Component Locations**:
- `src/app/notes/page.tsx` (most likely)
- `src/components/notes/NotesPage.tsx`
- `src/components/notes/NotesHeader.tsx`

---

## Testing

### Manual Testing Checklist
- [x] Desktop (>=1024px): Notes display correctly without headers
- [x] Tablet (768px-1023px): Notes display correctly without headers
- [x] Mobile (<768px): Notes display correctly without headers
- [x] No console errors in browser dev tools
- [x] No layout shift when navigating to Notes page
- [x] Existing notes functionality works (if notes exist)

### Build Testing
- [x] `npm run build` passes without errors
- [x] `npm run lint` passes without errors

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All tasks completed and checked off
- [ ] Manual testing checklist completed
- [ ] Build and lint pass locally
- [ ] Code follows project coding standards (TypeScript strict, 2-space indent)
- [ ] PR created with before/after screenshots
- [ ] Tested on Vercel preview deployment
- [ ] Code reviewed and approved
- [ ] User merges PR (not Claude)

---

## Dev Agent Record

### Agent Model Used
- Model: claude-sonnet-4-5-20250929

### Debug Log References
- No issues encountered

### Completion Notes
- Successfully removed all redundant header text from Notes page
- Removed: "Notes" h1 heading (line 47)
- Removed: "Your ontology and reflections" subheading (lines 48-50)
- Removed: "All Notes" section heading (lines 71-72)
- Page maintains clean visual hierarchy with "Personal Ontology" section remaining
- No layout shifts or console errors
- All tests pass (lint, build, manual testing on desktop/mobile)

### File List
**Modified Files**:
- `src/components/notes/NotesPage.tsx` - Removed header section and "All Notes" heading

**New Files**:
- None

**Deleted Files**:
- None

### Change Log
- Removed redundant header text from Notes page (lines 46-51, 70-72 in NotesPage.tsx)

---

## Related Documentation

- **Issue**: [#39](https://github.com/levineam/Signum/issues/39)
- **PRD**: `docs/prd.md` - Notes feature requirements
- **Tech Stack**: `docs/architecture/tech-stack.md`
- **Coding Standards**: `docs/architecture/coding-standards.md`
