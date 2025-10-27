# Story 2.8: Fix WYSIWYG Editor Formatting Buttons in Edit Mode

**Issue:** #87
**Epic:** 2.x Accessibility & Polish
**Story Points:** 5
**Status:** Draft

---

## Story

As a user writing journal entries,
I need the WYSIWYG formatting buttons to work correctly when I highlight text,
So that I can format my text with bold, italic, underline, headings, and indents without exiting edit mode.

**Problem:** When highlighting text in a journal entry while in edit mode and attempting to use the WYSIWYG editor toolbar buttons (bold, italic, underline, heading, indent), the formatting does not apply and edit mode exits unexpectedly. Only the microphone button and "make note" button work correctly.

**Solution:** Fix the formatting button handlers in the WYSIWYG toolbar to properly apply formatting to selected text and prevent unintended edit mode exit.

---

## Acceptance Criteria

- [ ] Bold button applies bold formatting to selected text
- [ ] Italic button applies italic formatting to selected text
- [ ] Underline button applies underline formatting to selected text
- [ ] Heading buttons (H1, H2, H3) apply heading styles to selected text/lines
- [ ] Indent buttons apply indentation to selected text/lines
- [ ] Edit mode remains active after applying formatting
- [ ] Text selection is preserved or properly restored after formatting
- [ ] Microphone and make note buttons continue to work
- [ ] No regression in existing editor functionality

---

## Dev Notes

**Files to investigate:**
- `/src/components/editor/SimpleRichEditor.tsx` - Main rich text editor component
- WYSIWYG toolbar component (toolbar repositioned to bottom in Story 2.3.1)

**Technical context:**
- Editor uses contentEditable-based implementation
- Recent toolbar repositioning may have affected event handling
- Edit mode state management may be triggering on button clicks
- Selection/range handling may not be preserved during formatting operations

**Suspected issues:**
1. Button click handlers may be triggering blur/focus events that exit edit mode
2. `document.execCommand()` or custom formatting logic may not be preserving selection
3. Event propagation may need `preventDefault()` or `stopPropagation()`
4. Selection range may be lost before formatting is applied

**Investigation approach:**
1. Examine button click handlers in SimpleRichEditor.tsx
2. Check if buttons have proper event handling (preventDefault, stopPropagation)
3. Verify selection is saved/restored around formatting operations
4. Test if edit mode exit is triggered by focus changes
5. Compare working buttons (microphone, make note) with non-working formatting buttons

---

## Testing

### Manual Testing Checklist
- [ ] Open journal entry in edit mode
- [ ] Select text and apply bold formatting - verify it applies and edit mode stays active
- [ ] Select text and apply italic formatting - verify it applies and edit mode stays active
- [ ] Select text and apply underline formatting - verify it applies and edit mode stays active
- [ ] Select text/line and apply H1, H2, H3 - verify they apply and edit mode stays active
- [ ] Select text/line and apply indent - verify it applies and edit mode stays active
- [ ] Verify microphone button still works
- [ ] Verify make note button still works
- [ ] Test formatting with various text selections (partial word, multiple words, multiple lines)
- [ ] Test in both light and dark modes

### Edge Cases
- [ ] Apply formatting with no text selected (cursor only)
- [ ] Apply formatting at start/end of entry
- [ ] Apply multiple formatting options to same text
- [ ] Remove formatting from already-formatted text

---

## Tasks

- [ ] Investigate and identify root cause
  - [ ] Read SimpleRichEditor.tsx and toolbar implementation
  - [ ] Identify formatting button handlers
  - [ ] Compare with working buttons (microphone, make note)
  - [ ] Determine why edit mode exits
- [ ] Fix formatting button event handling
  - [ ] Add preventDefault/stopPropagation if needed
  - [ ] Fix selection preservation
  - [ ] Prevent edit mode exit on button clicks
- [ ] Test all formatting buttons
  - [ ] Verify bold, italic, underline work
  - [ ] Verify heading buttons work
  - [ ] Verify indent buttons work
  - [ ] Execute manual testing checklist
- [ ] Update story status to "Ready for Review"

---

## Dev Agent Record

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
None

### Completion Notes
None

### File List
None

### Change Log
None

---

**Dependencies:** None
**Blocked By:** None
**Blocking:** None
