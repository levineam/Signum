# Story 2.9: Add Sidebar to Individual Note Pages

**Issue:** #95
**Epic:** 2.x Accessibility & Polish
**Story Points:** 3
**Status:** Draft

---

## Story

As a user viewing an individual note,
I need the navigation sidebar to remain visible,
So that I can easily navigate to other sections without using the browser back button.

**Problem:** The sidebar is missing on individual note pages (`/notes/[id]`). When viewing a specific note, users lose access to the main navigation (Journal, Notes, Ontology, Feedback, Articles, Meets, Karma) and must use the "Back to Notes" button to return before navigating elsewhere.

**Solution:** Add the Sidebar component to individual note pages, matching the layout pattern used on the Notes list page.

---

## Acceptance Criteria

- [ ] Sidebar is visible on individual note pages (`/notes/[id]`)
- [ ] Sidebar displays all 7 navigation items matching the existing Sidebar component (Journal, Notes, Ontology, Feedback, Articles, Meets, Karma)
- [ ] Sidebar shows user info and Sign Out button at bottom
- [ ] Sidebar styling and behavior match the Notes list page exactly
- [ ] No layout shift or flickering when navigating between Notes list and individual note
- [ ] Active section highlighting works correctly (Notes should be active on individual note pages)
- [ ] Sidebar navigation works from individual note page (clicking any section navigates correctly)
- [ ] Mobile responsive behavior maintained (drawer opens/closes correctly on mobile)

---

## Dev Notes

**Current State:**
- Notes list page (`/src/app/notes/page.tsx:26`) has `<Sidebar>` component with proper layout wrapper
- Individual note page (`/src/app/notes/[id]/page.tsx`) missing sidebar entirely
- Notes list uses pattern: `<Sidebar>` + `<main className="lg:pl-64">` for content offset

**Files to modify:**
- `/src/app/notes/[id]/page.tsx` - Add Sidebar component and layout wrapper

**Implementation approach:**
1. Import `Sidebar` and `AppHeader` components (like notes/page.tsx:5-7)
2. Add state for `activeSection` (set to 'notes')
3. Add `handleSectionChange` function for navigation
4. Wrap existing content in sidebar layout structure:
   ```tsx
   <div className="min-h-screen bg-background">
     <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
     <main className="lg:pl-64">
       <div className="flex min-h-screen flex-col">
         <AppHeader />
         <div className="flex-1">
           {/* Existing note content */}
         </div>
       </div>
     </main>
   </div>
   ```
5. Ensure existing note functionality (editing, linking, modals) remains unchanged

**Technical context:**
- Sidebar component: `/src/components/layout/Sidebar.tsx` (defines all 7 nav sections at lines 43-51)
- AppHeader component: `/src/components/layout/AppHeader.tsx`
- Layout uses Tailwind `lg:pl-64` to offset content for sidebar width
- Pattern already established in:
  - Notes list page: `/src/app/notes/page.tsx:26` ✅
  - Ontology page: `/src/app/ontology/page.tsx:26` ✅
  - Journal page: `/src/app/page.tsx` (root route) ✅

**Risk assessment:**
- Low risk - following established pattern
- Existing note functionality should be unaffected (only wrapping in layout)
- May need to verify z-index stacking for modals (NoteCreationModal, NoteViewer)

**Out of Scope:**
- This story does NOT modify the Sidebar component itself (`/src/components/layout/Sidebar.tsx`)
- The Sidebar component already defines all 7 navigation sections (lines 43-51)
- This story only adds the existing Sidebar to the individual note page layout
- No routing changes needed - Sidebar navigation handlers already defined

---

## Testing

### Manual Testing Checklist
- [ ] Navigate to Notes list page - verify sidebar present
- [ ] Click on a note to open individual note page
- [ ] Verify sidebar appears on individual note page
- [ ] Verify "Notes" is highlighted as active section
- [ ] Click each sidebar navigation item from individual note page
- [ ] Verify navigation works correctly from individual note page
- [ ] Test note editing functionality still works
- [ ] Test "Make Note" functionality (text selection → link creation)
- [ ] Test note viewer modal opens correctly
- [ ] Verify no z-index issues with modals over sidebar
- [ ] Test both light and dark modes
- [ ] Test responsive behavior on mobile/tablet sizes
- [ ] Verify no layout shift when navigating notes → note detail → notes

### Regression Testing
- [ ] Notes list page (`/notes`) sidebar unchanged
- [ ] Ontology page (`/ontology`) sidebar unchanged
- [ ] Journal page (`/` root) sidebar unchanged
- [ ] Note auto-save still works (2-second debounce)
- [ ] Note linking still works (Make Note feature + convertTextToLink)
- [ ] Back button navigation still works (Back to Notes / Back to Ontology)

---

## Tasks

- [ ] Add Sidebar to individual note page layout
  - [ ] Import Sidebar and AppHeader components
  - [ ] Add activeSection state management
  - [ ] Add handleSectionChange navigation function
  - [ ] Wrap content in sidebar layout structure
  - [ ] Test sidebar displays correctly
- [ ] Verify existing note functionality
  - [ ] Test note editing and auto-save
  - [ ] Test note linking (Make Note feature)
  - [ ] Test note viewer modal
  - [ ] Test back button navigation
- [ ] Execute full testing checklist
  - [ ] Manual testing in dev environment
  - [ ] Test on Vercel preview deployment
  - [ ] Regression testing on all pages with sidebar
  - [ ] Mobile responsive testing
- [ ] Update story status to "Ready for Review"

---

## Dev Agent Record

### Agent Model Used
_To be filled by dev agent_

### Debug Log References
_To be filled by dev agent_

### Completion Notes
_To be filled by dev agent_

### File List
_To be filled by dev agent_

### Change Log
_To be filled by dev agent_

---

**Dependencies:** None
**Blocked By:** None
**Blocking:** None
