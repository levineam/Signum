# Story 2.4.7: Hierarchical Execution Stack (Goals → Projects → Tasks)

**Epic:** 2 - AI-Powered Personal Ontology
**Status:** Draft
**Created:** 2025-11-25
**Related Issue:** TBD

## Story

**As a** reflective journaler using the Ontology feature,
**I want** to organize my Execution Stack as a 3-tier hierarchy (Goals → Projects → Tasks),
**so that** I can see which projects serve each goal and which tasks belong to each project, providing clearer alignment between my daily actions and long-term aspirations.

## Context

Currently, the Execution Stack displays three separate flat lists:
- **Goals** - High-level aspirations
- **Projects** - Active initiatives
- **Tasks** - Specific action items

**Problem:** There's no visual relationship showing how Tasks relate to Projects, or how Projects serve Goals. Users must mentally map these connections.

**Solution:** Implement a 3-tier hierarchical structure where:
1. Each column shows top-level items (Goals, Projects, Tasks)
2. Goals can contain multiple Projects
3. Projects can contain multiple Tasks
4. Visual nesting shows the parent-child relationships

## Acceptance Criteria

1. ✅ **Three-Column Layout Preserved**: Execution Stack maintains the current 3-column responsive layout (Goals | Projects | Tasks)

2. ✅ **Hierarchical Data Structure**:
   - Goals display as top-level items in the Goals column
   - Projects display beneath their parent Goal (with visual indentation/nesting)
   - Tasks display beneath their parent Project (with visual indentation/nesting)

3. ✅ **Parent Selection UX**:
   - When adding a new Project, user can select which Goal it serves (dropdown or select UI)
   - When adding a new Task, user can select which Project it belongs to (dropdown or select UI)
   - Option to create "unassigned" items (Projects without a Goal, Tasks without a Project)
   - **Unassigned Items Display**:
     - Show in collapsible "📦 Unassigned" section at top of Projects and Tasks columns
     - Visual separator (dashed border, muted background color)
     - Collapsed by default after migration (expandable on click)
     - Example: "📦 Unassigned Projects (3)" with count badge

4. ✅ **Visual Hierarchy Indicators**:
   - Clear visual distinction between parent and child items (indentation, connecting lines, or nested cards)
   - Expandable/collapsible sections for Goals (show/hide their Projects) and Projects (show/hide their Tasks)
   - Icon or indicator showing item type (Goal icon, Project icon, Task icon)

5. ✅ **Edit Mode Enhancements**:
   - Existing items can be reassigned to different parents via edit UI
   - Items can be reordered within their parent (drag-and-drop or up/down buttons)
   - **Parent Deletion Behavior**:
     - Show warning with child count (e.g., "This Goal has 3 Projects and 12 Tasks")
     - Deletion options (radio buttons):
       1. **"Make Unassigned"** (default) - Move children to top-level "Unassigned" section, preserves all data
       2. **"Delete All"** - Full cascade delete (Goal + all descendant Projects + all descendant Tasks)
       3. **"Reassign"** - Prompt to select new parent (applies recursively to all descendants)
       4. **"Cancel"** - Abort deletion
   - Order is per-parent: each Goal has independent Project ordering, each Project has independent Task ordering

6. ✅ **Data Migration**:
   - Existing Goals, Projects, and Tasks are preserved
   - Default behavior: existing items remain top-level (unassigned) until user explicitly assigns relationships
   - No data loss during migration

7. ✅ **Accessibility**:
   - Keyboard navigation through hierarchy (Tab, Enter/Space for expand/collapse, Arrow keys for list navigation)
   - Screen readers announce hierarchy level and relationships (e.g., "Goal: Build Signum, 3 projects, 12 tasks")
   - Semantic HTML with ARIA enhancements: `role="list"` for columns, `role="listitem"` for items, `aria-level` for nesting depth
   - Cross-column relationships via `aria-describedby` linking child items to parent items in adjacent columns

8. ✅ **Performance**:
   - Rendering optimized for hierarchies with up to 50 Goals, 200 Projects, 500 Tasks
   - Smooth expand/collapse animations (60fps target)

## Tasks / Subtasks

- [ ] **Task 1: Update Metadata Schema** (AC: 2, 6)
  - [ ] Extend `metadata.items` structure to include:
    - `id: string` (UUID) for cross-note referencing
    - `parentId?: string` for Projects (→ Goal.id) and Tasks (→ Project.id)
    - `order: number` for per-parent ordering (default: array index)
  - [ ] Update TypeScript interfaces for hierarchical ontology items
  - [ ] Write data migration utility:
    - Generate UUIDs for existing items
    - Assign `order = array index`
    - Set `parentId = undefined` (all items start unassigned)
    - Preserve all existing data (name, confidence, excerpts)

- [ ] **Task 2: Implement Hierarchical Data Structure** (AC: 2, 6)
  - [ ] Update `OntologyPage.tsx` state management to track parent-child relationships
  - [ ] Create utility functions to build hierarchy tree from flat metadata items
  - [ ] Implement filtering logic to separate Goals, Projects (with parent Goals), Tasks (with parent Projects)
  - [ ] Add handling for "unassigned" items (no parentId)

- [ ] **Task 3: Create Hierarchical UI Components** (AC: 1, 4)
  - [ ] Design `HierarchicalOntologyColumn` component with expandable sections
  - [ ] Add visual nesting indicators (indentation, connecting lines, or nested cards)
  - [ ] Implement expand/collapse state management per item
  - [ ] Add icons for item types (Flag for Goals, Target for Projects, ListChecks for Tasks)
  - [ ] Create "📦 Unassigned" section at top of Projects and Tasks columns
    - [ ] Collapsible with count badge (e.g., "Unassigned Projects (3)")
    - [ ] Visual separator (dashed border, muted background)
    - [ ] Collapsed by default after migration
  - [ ] Ensure responsive layout preserves 3-column grid on desktop, stacks on mobile

- [ ] **Task 4: Build Parent Selection UI** (AC: 3, 5)
  - [ ] Add "Parent Goal" dropdown when adding/editing Projects
  - [ ] Add "Parent Project" dropdown when adding/editing Tasks
  - [ ] Include "None (Top-level)" option for unassigned items
  - [ ] Implement reassignment UI for existing items
  - [ ] Add reordering controls (drag-and-drop or up/down buttons)

- [ ] **Task 5: Handle Parent Deletion Logic** (AC: 5)
  - [ ] Detect descendant count when parent is deleted (e.g., "3 Projects, 12 Tasks")
  - [ ] Show confirmation dialog with radio button options:
    1. "Make Unassigned" (default) - Move to "Unassigned" section
    2. "Delete All" - Full cascade delete
    3. "Reassign" - Prompt for new parent (recursive for all descendants)
    4. "Cancel" - Abort deletion
  - [ ] Implement each deletion strategy (unassign, cascade, reassign)
  - [ ] Update all affected notes (Goals, Projects, Tasks) atomically

- [ ] **Task 6: Accessibility Implementation** (AC: 7)
  - [ ] Add semantic list structure (`role="list"`, `role="listitem"`, `aria-level` for nesting depth)
  - [ ] Implement cross-column relationships via `aria-describedby` (link Tasks → Projects → Goals)
  - [ ] Add screen reader announcements for hierarchy level and child counts (e.g., "Goal: Build Signum, 3 projects, 12 tasks")
  - [ ] Implement keyboard navigation (Tab for next item, Enter/Space for expand/collapse, Arrow keys for list navigation)
  - [ ] Test with VoiceOver (macOS) and NVDA (Windows)

- [ ] **Task 7: Performance Optimization** (AC: 8)
  - [ ] Virtualize long lists if needed (react-window or similar)
  - [ ] Optimize re-renders with React.memo for hierarchy items
  - [ ] Add GPU-accelerated CSS animations for expand/collapse
  - [ ] Profile with Chrome DevTools to ensure 60fps target

- [ ] **Task 8: Testing** (AC: All)
  - [ ] Write Playwright E2E test for creating hierarchical structure
  - [ ] Test parent selection and reassignment flows
  - [ ] Test parent deletion with orphan handling
  - [ ] Test keyboard navigation and screen reader announcements
  - [ ] Test data migration with existing ontology data

## Dev Notes

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
