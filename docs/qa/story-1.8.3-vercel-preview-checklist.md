# Story 1.8.3: Vercel Preview Testing Checklist

**Story ID**: 1.8.3
**Test Date**: _To be filled in during testing_
**Tester**: _To be filled in during testing_
**Preview URL**: _To be filled in after PR creation_

---

## Testing Instructions

1. Create PR for Story 1.8.2 to `dev` branch
2. Wait for Vercel bot to comment with preview URL (~2-3 minutes)
3. Open preview URL in browser
4. Sign in with test account
5. Complete all checklist items below
6. Document any issues found
7. Take screenshots for visual verification

---

## Functionality (8 items)

- [ ] **1. Helper displays on today's entry only**
  - Navigate to journal page
  - Verify CBT Distortions helper appears on today's entry
  - Navigate to past entries (if any)
  - Verify helper does NOT appear on past entries
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **2. Explore button expands panel smoothly**
  - Click "Explore" button
  - Verify panel expands with smooth animation
  - Verify animation completes in ~200ms
  - Verify no janky frames during expansion
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **3. All 10 distortions displayed with descriptions and examples**
  - Expand helper panel
  - Count distortions (should be 10)
  - Verify each has: name, description, example
  - Verify text is readable and well-formatted
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **4. Checkbox selection works (single and multiple)**
  - Select a single distortion
  - Verify checkbox is checked
  - Verify Continue button shows "1" badge
  - Select 2 more distortions (3 total)
  - Verify all checkboxes are checked
  - Verify Continue button shows "3" badge
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **5. Continue button inserts correct plain paragraph format**
  - Select 2 distortions
  - Click Continue button
  - Verify text inserted into journal entry
  - Verify format: "Today I experienced {name}. Here's what happened:"
  - Verify plain paragraphs (no bullets, no lists)
  - Verify proper spacing between distortions
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **6. Clear button deselects all checkboxes**
  - Select 3 distortions
  - Verify Continue button is enabled
  - Click Clear button
  - Verify all checkboxes are unchecked
  - Verify Continue button is disabled
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **7. Panel collapses after insertion**
  - Select 1 distortion
  - Click Continue button
  - Verify panel collapses automatically
  - Verify Explore button is visible again
  - Verify collapse animation is smooth
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **8. Helper usage logged to Supabase**
  - Insert helper text (1+ distortions)
  - Open Supabase dashboard
  - Navigate to `helper_usage` table
  - Find most recent record
  - Verify: `helper_type` = "cbt-distortions"
  - Verify: `selected_items` contains selected distortion IDs
  - Verify: `metadata` contains events and timestamps
  - **Status**: ___________
  - **Notes**: ___________

---

## Integration (5 items)

- [ ] **9. Gentle Prompt still visible and functional**
  - Navigate to journal page
  - Verify Gentle Prompt (amber card) is visible
  - Verify it's positioned above CBT Distortions helper
  - Click Gentle Prompt "Include" button
  - Verify prompt text is inserted
  - Verify Gentle Prompt still works correctly
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **10. Helper doesn't interfere with Gentle Prompt interactions**
  - Expand CBT Distortions helper
  - Without collapsing, click Gentle Prompt "Include" button
  - Verify both helpers work independently
  - Verify no UI conflicts or overlaps
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **11. Auto-save triggers after helper insertion (2 seconds)**
  - Type some content in journal entry
  - Wait for auto-save (2 seconds)
  - Insert helper text
  - Wait 2.5 seconds
  - Refresh page
  - Verify both typed content and helper text persisted
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **12. Link creation still works correctly**
  - Type "test link" in journal entry
  - Select the text "test link"
  - Click "Make Note" button
  - Create note with title "Test Note"
  - Verify link is created and styled correctly
  - Verify link is clickable
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **13. Link rehydration after page refresh works**
  - Create a note link (from test #12)
  - Refresh page
  - Verify link is still present and styled correctly
  - Verify link is still clickable
  - Click link and verify note viewer opens
  - Insert helper text
  - Refresh page
  - Verify both link and helper text are still present
  - **Status**: ___________
  - **Notes**: ___________

---

## Accessibility (6 items)

- [ ] **14. Keyboard navigation: Tab, Enter, Space, Escape work correctly**
  - Use Tab key to navigate to Explore button
  - Press Enter to expand panel
  - Verify panel expands
  - Use Tab to navigate to first checkbox
  - Press Space to select checkbox
  - Verify checkbox is checked
  - Press Escape
  - Verify panel collapses
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **15. Focus management: Focus returns to Explore button after collapse**
  - Expand panel
  - Select a distortion
  - Click Continue button
  - Wait for panel to collapse
  - Verify focus is on Explore button (blue outline)
  - Press Enter (without Tab)
  - Verify panel expands (confirming focus was on button)
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **16. Screen reader (VoiceOver): Announces "Inserted {count} distortion reflections"**
  - Enable VoiceOver (Cmd + F5 on Mac)
  - Navigate to CBT Distortions helper
  - Expand panel
  - Select 2 distortions
  - Click Continue button
  - **Listen for announcement**: "Inserted 2 distortion reflections"
  - Verify exact text is announced
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **17. Screen reader: All checkboxes announce distortion names correctly**
  - Enable VoiceOver
  - Navigate to helper panel
  - Tab through checkboxes
  - Verify each checkbox announces full distortion name
  - Example: "Select All-or-Nothing Thinking"
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **18. Screen reader: Button states announced (enabled/disabled)**
  - Enable VoiceOver
  - Navigate to Continue button with no selections
  - Verify announced as "Continue button, disabled"
  - Select a distortion
  - Verify announced as "Continue button"
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **19. Color contrast meets WCAG AA (blue/indigo gradient readable)**
  - Use browser DevTools contrast checker
  - Check blue text on gradient background
  - Verify contrast ratio ≥ 4.5:1 for normal text
  - Verify contrast ratio ≥ 3:1 for large text
  - Check in dark mode as well
  - **Status**: ___________
  - **Notes**: ___________

---

## Security (2 items)

- [ ] **20. Multi-user RLS: User A can't access User B's helper_usage**
  - Sign in as User A
  - Insert helper text
  - Note the `helper_usage.id` from Supabase dashboard
  - Sign out
  - Sign in as User B
  - Open Supabase dashboard
  - Try to query User A's `helper_usage` record
  - Expected: 0 rows returned (RLS blocks access)
  - Run SQL: `SELECT * FROM helper_usage WHERE user_id != auth.uid()`
  - Expected: 0 rows (RLS policy prevents cross-user access)
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **21. Entry ownership: Can only insert helpers into own entries**
  - Sign in as User A
  - Navigate to journal
  - Verify helper is visible on own entries
  - (This test validates RLS on entries table)
  - **Status**: ___________
  - **Notes**: ___________

---

## Visual & Responsiveness (3 items)

- [ ] **22. Blue/indigo gradient distinct from amber Gentle Prompt**
  - View journal page
  - Verify Gentle Prompt uses amber/yellow colors
  - Verify CBT Distortions helper uses blue/indigo colors
  - Verify the two helpers are visually distinct
  - Verify gradients render smoothly (no banding)
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **23. Responsive on mobile (iPhone 12/13 Pro viewport)**
  - Resize browser to 390x844 (iPhone 13 Pro)
  - Or use DevTools device emulation
  - Navigate to journal page
  - Verify helper displays correctly
  - Expand helper panel
  - Verify all 10 distortions are readable
  - Verify Continue and Clear buttons are accessible
  - Verify no horizontal scroll
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **24. Responsive on tablet (iPad viewport)**
  - Resize browser to 768x1024 (iPad)
  - Navigate to journal page
  - Verify helper displays correctly
  - Expand helper panel
  - Verify layout is optimized for tablet size
  - Verify no overflow or clipping
  - **Status**: ___________
  - **Notes**: ___________

---

## Console & Performance (3 items)

- [ ] **25. No console errors in browser (F12 DevTools)**
  - Open browser DevTools (F12)
  - Switch to Console tab
  - Clear console
  - Navigate to journal page
  - Interact with CBT Distortions helper (expand, select, insert)
  - Verify no red error messages in console
  - Verify no warnings about missing props or keys
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **26. No terminal errors during helper usage**
  - Monitor Vercel deployment logs (if accessible)
  - Or monitor local terminal (if testing on localhost)
  - Interact with CBT Distortions helper
  - Verify no server-side errors
  - Verify no database connection errors
  - **Status**: ___________
  - **Notes**: ___________

- [ ] **27. Helper expansion/collapse animation smooth (no janky frames)**
  - Open browser DevTools Performance tab
  - Start recording
  - Expand helper panel
  - Collapse helper panel
  - Stop recording
  - Verify no dropped frames during animation
  - Verify frame rate stays at 60fps
  - **Status**: ___________
  - **Notes**: ___________

---

## Summary

**Total Items**: 27
**Passed**: _____
**Failed**: _____
**Blocked**: _____

**Overall Status**: ___________

**Critical Issues Found**: ___________

**Notes**: ___________

---

## Sign-off

**Tester Signature**: ___________
**Date**: ___________
**Ready for Merge**: ⬜ Yes ⬜ No (if no, explain above)
