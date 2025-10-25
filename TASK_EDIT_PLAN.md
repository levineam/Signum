# Task Card UX Improvements - Implementation Plan

**Status:** 🔍 Awaiting Codex Review
**Story:** 1.2.1 (continued)
**Date:** 2025-10-25

## Problem Statement

### Issue 1: Task Card Clicks Exit Edit Mode
**Current Behavior:**
- User is editing a journal entry
- User clicks accept/edit/reject button on a TaskCard
- Click exits edit mode without performing the action
- User must click the button again to actually perform the action
- This makes the UI feel broken

**Root Cause:**
- TaskCards are rendered inside the journal entry `<Card>` component
- Click events bubble up and trigger the "exit edit mode" handler
- Task action handlers never execute on first click

### Issue 2: Task Editing Not Implemented
**Current Behavior:**
- Edit button shows toast: "Task editing coming soon!"
- User cannot modify task title or due date

**Expected Behavior:**
- Edit button opens inline editor or modal
- User can edit task title and due date
- Changes save to database and update UI

---

## Proposed Solutions

### Solution 1: Prevent Edit Mode Exit on TaskCard Clicks

**Approach A (Recommended): Event Propagation Control**
```typescript
// In JournalStream.tsx, update handleCardClick:
const handleCardClick = (entryId: string, event: React.MouseEvent) => {
  // Check if click originated from a TaskCard or its children
  const target = event.target as HTMLElement;
  const isTaskCardClick = target.closest('[data-task-card]');

  if (isTaskCardClick) {
    // Don't exit edit mode if clicking on task card
    return;
  }

  // Existing exit edit mode logic
  if (editingEntryId === entryId) {
    setEditingEntryId(null);
  } else {
    setEditingEntryId(entryId);
  }
};

// In TaskCard.tsx, add data attribute to Card:
<Card data-task-card className="...">
```

**Pros:**
- Minimal code changes
- No new state management
- Preserves existing edit mode behavior for rest of card

**Cons:**
- Relies on DOM inspection

**Approach B: Separate TaskCard Click Handler**
```typescript
// In JournalStream.tsx, pass separate handler to TaskCard:
<TaskCard
  {...props}
  onTaskCardClick={(e) => e.stopPropagation()}
/>

// In TaskCard.tsx, wrap entire card:
<Card onClick={onTaskCardClick}>
```

**Pros:**
- Explicit event handling
- Clear separation of concerns

**Cons:**
- Requires prop drilling
- More invasive changes

**Recommendation:** Use **Approach A** - simpler and less invasive.

---

### Solution 2: Implement Task Editing

**Approach A (Recommended): Inline Modal Editor**
```typescript
// New component: TaskEditModal.tsx
interface TaskEditModalProps {
  taskId: string;
  initialTitle: string;
  initialDueAt: string | null;
  initialRrule: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: { title: string; dueAt: string | null }) => void;
}

export function TaskEditModal({ ... }: TaskEditModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave}>
          <Input
            label="Task"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            label="Due Date"
            type="datetime-local"
            value={dueAtInput}
            onChange={(e) => setDueAtInput(e.target.value)}
          />
          <Button type="submit">Save</Button>
          <Button type="button" onClick={onClose}>Cancel</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

**API Changes:**
```typescript
// New endpoint: PATCH /api/tasks/[taskId]
export async function PATCH(request: NextRequest, { params }) {
  const { title, dueAt } = await request.json();

  // Update task in database
  const { error } = await supabase
    .from('tasks')
    .update({
      title,
      due_at: dueAt,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .eq('user_id', user.id);

  return NextResponse.json({ success: true });
}
```

**State Management:**
```typescript
// In JournalStream.tsx:
const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

<TaskCard
  onEdit={() => setEditingTaskId(task.id)}
/>

<TaskEditModal
  isOpen={editingTaskId === task.id}
  onClose={() => setEditingTaskId(null)}
  onSave={async (updates) => {
    // Call PATCH API
    // Update entryTasks state
    // Close modal
  }}
/>
```

**Pros:**
- Clean separation of concerns
- Reusable modal component
- Standard pattern for editing

**Cons:**
- Requires shadcn/ui Dialog component
- More complex than inline editing

**Approach B: Inline ContentEditable**
```typescript
// In TaskCard.tsx, make title editable:
const [isEditing, setIsEditing] = useState(false);

{isEditing ? (
  <input
    value={editedTitle}
    onChange={(e) => setEditedTitle(e.target.value)}
    onBlur={handleSave}
    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
  />
) : (
  <div onClick={() => setIsEditing(true)}>{title}</div>
)}
```

**Pros:**
- No modal required
- Quick editing

**Cons:**
- Harder to edit due date
- No validation UI
- Cluttered UX

**Recommendation:** Use **Approach A (Modal)** - better UX and validates input properly.

---

## Implementation Checklist

### Phase 1: Fix Edit Mode Exit (Issue 1)
- [ ] Add `data-task-card` attribute to TaskCard component
- [ ] Update `handleCardClick` to check for TaskCard clicks
- [ ] Test: Click accept/edit/reject while editing - should NOT exit edit mode
- [ ] Test: Click journal entry outside TaskCard - should still toggle edit mode

### Phase 2: Task Editing Modal (Issue 2)
- [ ] Create `TaskEditModal.tsx` component with Dialog
- [ ] Add form with title and due date inputs
- [ ] Implement PATCH /api/tasks/[taskId] endpoint (or extend existing)
- [ ] Update `entryTasks` state after successful save
- [ ] Add loading/error states to modal
- [ ] Test: Edit task title, save, verify UI updates
- [ ] Test: Edit due date, save, verify UI updates
- [ ] Test: Cancel edit, verify no changes persist

### Phase 3: Polish
- [ ] Add error handling for failed saves
- [ ] Add optimistic UI updates
- [ ] Add keyboard shortcuts (Esc to close modal)
- [ ] Validate task title is not empty
- [ ] Test with recurring tasks (rrule should be preserved)

---

## Testing Plan

### Manual Testing
1. **Edit Mode Persistence:**
   - Create journal entry with task
   - Enter edit mode
   - Click accept button → verify entry stays in edit mode AND task is accepted
   - Click edit button → verify modal opens AND entry stays in edit mode
   - Click delete button → verify task deletes AND entry stays in edit mode

2. **Task Editing:**
   - Accept a task
   - Click edit button → verify modal opens
   - Change title → save → verify title updates in TaskCard
   - Click edit again → change due date → save → verify date updates
   - Click edit → cancel → verify no changes saved

### Automated Testing
- Update existing Playwright tests to verify edit mode doesn't exit
- Add tests for task editing modal interactions

---

## Risk Assessment

### Low Risk
- Edit mode fix (Approach A) - minimal changes, easy to revert
- Task editing API endpoint - standard CRUD operation

### Medium Risk
- Modal UI integration - requires shadcn/ui Dialog setup
- State synchronization - must ensure entryTasks stays in sync with database

### Mitigation
- Test thoroughly on preview deployment before merging
- Add comprehensive error handling
- Keep changes incremental (can ship edit mode fix separately from editing feature)

---

## Timeline Estimate

- **Phase 1 (Edit Mode Fix):** 30 minutes
- **Phase 2 (Task Editing):** 2-3 hours
- **Phase 3 (Polish):** 1 hour
- **Testing:** 1 hour

**Total:** ~4-5 hours

---

## Questions for Review

1. **Should we support editing recurrence (rrule)?**
   - Complexity: High (requires rrule parser UI)
   - Recommendation: Defer to Story 1.4

2. **Should task editing update the journal entry text?**
   - Current: Task title is separate from paragraph text
   - Proposal: No - keep them decoupled
   - Reasoning: User might have edited paragraph after task was created

3. **Should we add "Save draft" for incomplete edits?**
   - Recommendation: No - modal pattern expects commit/cancel
   - Auto-save can be added later if needed

4. **Date picker vs text input for due date?**
   - Recommendation: Start with datetime-local input (native)
   - Can upgrade to fancy date picker later

---

## Approval Requested

@codex Please review this plan and provide feedback on:
1. Architecture approach (event propagation vs separate handlers)
2. Modal vs inline editing preference
3. Any edge cases or risks we should consider
4. Whether this should be one PR or split into two

Once approved, I'll proceed with implementation.
