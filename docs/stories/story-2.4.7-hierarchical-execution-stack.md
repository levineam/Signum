# Story 2.4.7: Hierarchical Execution Stack (Goals → Projects → Tasks)

**Epic:** 2 - AI-Powered Personal Ontology
**Status:** In Progress
**Created:** 2025-11-25
**Related Issue:** TBD

## Story

**As a** reflective journaler using the Ontology feature,
**I want** to organize my Execution Stack as a 3-tier hierarchy (Goals → Projects → Tasks) in goal-centric columns,
**so that** I can see which projects serve each goal and which tasks belong to each project, keeping alignment visible inside each goal column.

## Context

Previously, the Execution Stack showed three separate flat lists. There was no visual relationship showing how tasks relate to projects or how projects serve goals; users had to mentally map these connections.

**Solution (shipped):** Present one column per Goal. Each column shows its Projects, and each Project nests its Tasks. Unassigned items are still supported via “None (Unassigned)” when creating/editing.

## Acceptance Criteria

1) ✅ **Goal-centric columns**: Each Goal renders as its own column with accurate project/task counts for that goal.
2) ✅ **Hierarchical data**: Projects carry `parentId` of a Goal; Tasks carry `parentId` of a Project; order is per parent and normalized on load/save.
3) ✅ **Parent selection**: Add/edit flows allow choosing a parent (Goal for Projects, Project for Tasks) or “None (Unassigned)”; reassignment works without data loss.
4) ✅ **Edit/delete/reorder**: Items can be renamed, reordered within parent, and deleted with options (unassign, cascade, reassign, cancel). Per-parent order is preserved.
5) ✅ **Accessibility**: Semantic list roles, aria labels on columns/items, and keyboard-focusable controls; screen reader announces column counts.
6) 🔄 **UI polish / declutter**: Action controls are hover/focus-only, spacing is consistent, button styles are unified, and redundant parent labels are removed or minimized.
7) 🔄 **Sample clarity**: Seeded example items (Story 2.4.8) are visually indicated as examples while remaining fully editable.

## Tasks / Subtasks

- [ ] **Task 1: Data + normalization** (AC: 2)
  - Ensure `id/parentId/order` normalization on load/save for all execution items; keep per-parent ordering intact.
  - Preserve unassigned handling via “None” in parent selectors.

- [ ] **Task 2: Goal-column UI** (AC: 1, 3, 4)
  - Maintain goal-per-column layout with accurate counts.
  - Reorder/edit/delete/reassign flows per item; deletion dialog supports unassign/cascade/reassign/cancel.

- [ ] **Task 3: UI polish & declutter** (AC: 6, 7)
  - Hover/focus-only action bar for edit/delete/reorder; align icons; consistent spacing.
  - Unify add buttons and card padding; reduce redundant parent labels; truncate long titles with tooltip.
  - Visual indicator for seeded sample items (Story 2.4.8) while keeping them fully editable.

- [ ] **Task 4: Accessibility** (AC: 5)
  - Semantic list roles and aria labels on columns/items; focus states; screen reader announcements for counts and hierarchy context.

- [ ] **Task 5: Testing**
  - Unit/integration tests for normalization and parent handling.
  - UI test for add/edit/reassign/delete within goal columns and for the hover action bar visibility.

## Dev Notes

*Sample seeding is covered in Story 2.4.8; UI should visually indicate seeded examples while keeping them editable.*

### Previous Story Insights

From Story 2.4.5 (Ontology Expandable Rows):
- Current ontology metadata structure stores items in `metadata.items` array with `{name, confidence, excerpts}`
- Each ontology category (goals, projects, tasks) uses separate pinned notes
- Expandable row pattern successfully implemented with URL params and localStorage state persistence
- Focus management critical for accessibility (keep focus on toggle button, use aria-live for announcements)

### Data Models

**Current Structure** [Source: src/types/note.ts, src/components/ontology/OntologyPage.tsx]:
```typescript
interface NoteMetadata {
  ontologyCategory?: 'goals' | 'projects' | 'tasks'
  items?: Array<{
    name: string
    confidence: 'high' | 'medium' | 'low'
    excerpts: Array<{
      noteId: string
      noteTitle: string
      excerpt: string
    }>
  }>
  meaningIndex?: number
}
```

**Proposed Enhanced Structure**:
```typescript
interface HierarchicalOntologyItem {
  id: string // Unique identifier (UUID) for this item
  name: string
  confidence: 'high' | 'medium' | 'low'
  parentId?: string // Cross-note reference: Projects → Goal.id, Tasks → Project.id
  order: number // For manual reordering within parent (per-parent ordering)
  excerpts: Array<{
    noteId: string
    noteTitle: string
    excerpt: string
  }>
}

interface NoteMetadata {
  ontologyCategory: 'goals' | 'projects' | 'tasks' // CANONICAL discriminator
  items?: HierarchicalOntologyItem[] // Contains ONLY items matching this category
  meaningIndex?: number
}
```

**Storage Model Clarification**:
- **Three separate pinned notes** (one per category: goals, projects, tasks) - UNCHANGED
- Each note's `metadata.items[]` contains ONLY items of that category
- `ontologyCategory` is **canonical** field for discriminating note type
- Hierarchy via cross-note `parentId` references:
  - Projects note: `items[].parentId` → references `Goals.items[].id`
  - Tasks note: `items[].parentId` → references `Projects.items[].id`
- Query pattern: Load all three notes, join on `parentId` to build hierarchy tree

**Ordering Rules**:
- `order` is per-parent: each Goal has independent Project ordering, each Project has independent Task ordering
- Default sort: `order ASC`, then alphabetical by `name`
- Migration assigns `order = array index` for existing items
- Top-level items (no parent): sorted by `order` within "Unassigned" section

### Component Specifications

**Primary Files to Modify** [Source: docs/architecture/project-structure.md]:
- `src/components/ontology/OntologyPage.tsx` - Main ontology page layout
- **NEW:** `src/components/ontology/HierarchicalOntologyColumn.tsx` - Hierarchical column component
- **NEW:** `src/components/ontology/OntologyItemEditor.tsx` - Parent selection UI component

**UI Pattern** [Source: Story 2.4.5]:
- Reuse expandable row pattern from Story 2.4.5
- Maintain shadcn/ui Notebook theme styling
- Use Lucide icons for visual indicators (Flag, Target, ListChecks)

### File Locations

[Source: docs/architecture/project-structure.md]
- Components: `src/components/ontology/`
- Types: `src/types/note.ts` (extend existing NoteMetadata)
- Utilities: `src/lib/ontology/` (new hierarchy utils)
- Tests: `tests/ontology-hierarchy.test.ts`

### Testing Requirements

**Test File Location**: `tests/ontology-hierarchy.test.ts`

**Testing Standards** [Source: docs/architecture/coding-standards.md]:
- Playwright for E2E testing
- Name tests by flow (e.g., "ontology-hierarchy-creation.test.ts")
- Keep scenarios focused and deterministic
- Test keyboard navigation and screen reader announcements

**Test Scenarios**:
1. Create Goal → Add Project under Goal → Add Task under Project
2. Reassign Project from one Goal to another
3. Delete Goal with cascade/reassign dialog
4. Keyboard navigation through hierarchy
5. Expand/collapse performance with 50 Goals, 200 Projects, 500 Tasks

### Technical Constraints

**Stack** [Source: docs/architecture/tech-stack.md]:
- Next.js 15.5.3 with App Router
- React 19.1.0, TypeScript ^5
- Supabase for data persistence
- shadcn/ui components, Lucide icons

**Performance Targets** [Source: Story 2.4.5]:
- 60fps on desktop, 30fps minimum on mobile
- < 300ms total duration for expand/collapse
- GPU-accelerated CSS animations with `prefers-reduced-motion` fallback

### Data Migration Strategy

1. **Backward Compatible Schema**: Add new fields (`id`, `itemType`, `parentId`, `order`) without breaking existing data
2. **Default Values**: Existing items get:
   - Auto-generated `id` (UUID)
   - `itemType` inferred from `ontologyCategory`
   - `parentId` = `undefined` (top-level/unassigned)
   - `order` = array index
3. **No Data Loss**: All existing Goals, Projects, Tasks preserved
4. **User Opt-in**: Hierarchy relationships only created when user explicitly assigns parents

### Security Considerations

- RLS policies already exist for notes table [Source: Supabase migrations]
- All ontology data scoped to `user_id`
- No additional security changes required

### Accessibility Requirements

[Source: Story 2.4.5 Accessibility Implementation + Codex Review]

**ARIA Pattern:** Nested Lists (NOT tree/treegrid)
- Each column uses semantic `<ul role="list">` with `<li role="listitem">`
- Nesting depth indicated via `aria-level="1|2|3"` on list items
- Cross-column relationships via `aria-describedby`:
  - Task item: `aria-describedby="project-uuid goal-uuid"` (links to parent Project and grandparent Goal)
  - Project item: `aria-describedby="goal-uuid"` (links to parent Goal)

**Why NOT ARIA Tree?**
- Problem: Single `role="tree"` can't span three separate columns
- Problem: Three independent trees break cross-column parent/child semantics
- Solution: Semantic lists with ARIA relationships preserve structure without invalid markup

**Keyboard Navigation:**
- Tab: Navigate to next interactive element (expand/collapse buttons, edit buttons)
- Enter/Space: Expand/collapse sections
- Arrow keys: Navigate within lists (Up/Down)
- Screen readers: Announce "Goal: Build Signum, level 1, 3 projects, 12 tasks"

**Focus Management:**
- Keep focus on interactive elements after expand/collapse
- Use `aria-live="polite"` regions for state change announcements
- Test with VoiceOver (macOS) and NVDA (Windows)

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-11-25 | 1.1 | **CODEX REVIEW UPDATES** - Fixed 5 critical issues: (1) Changed ARIA pattern from invalid tree to semantic nested lists with aria-describedby, (2) Specified parent deletion with 4 options (Make Unassigned default, Delete All, Reassign, Cancel), (3) Defined per-parent ordering rules and migration defaults, (4) Added "Unassigned" section UI spec with collapsible design, (5) Clarified storage model (3 separate notes, ontologyCategory canonical, cross-note parentId references). Removed redundant itemType field. Updated all ACs, tasks, and Dev Notes. | BMad Master |
| 2025-11-25 | 1.0 | Initial story draft created | BMad Master |

## Dev Agent Record

### Agent Model Used
_To be completed during implementation_

### Debug Log References
_To be completed during implementation_

### Completion Notes
_To be completed during implementation_

### File List
_To be completed during implementation_

## QA Results
_To be completed after implementation_
