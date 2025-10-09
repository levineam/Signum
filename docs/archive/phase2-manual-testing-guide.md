# Phase 2 Manual Authenticated Testing Guide

**Date:** 2025-10-07
**Preview URL:** https://signum-git-story-241-auth-integration-levineams-projects.vercel.app/
**Branch:** `story-2.4.1-auth-integration`
**PR:** #7

---

## Testing Objective

Validate that all CRUD operations correctly use authenticated `user.id` instead of the prototype constant.

---

## Pre-Testing Setup

### Credentials
Use your test account credentials for Supabase Auth:
- Email: `[your-test-email]`
- Password: `[your-test-password]`

### What to Watch For
1. ✅ Data saves with correct `user_id` in Supabase
2. ✅ No errors in browser console
3. ✅ Operations complete successfully
4. ✅ UI updates correctly after operations

---

## Test 1: Authentication Flow

### Steps:
1. [ ] Open preview URL in browser: https://signum-git-story-241-auth-integration-levineams-projects.vercel.app/
2. [ ] Click "Sign Up" button in left sidebar
3. [ ] Complete Supabase auth flow (sign in or sign up)
4. [ ] Verify redirect back to app after authentication
5. [ ] Check that "Sign Up" button is replaced with user indicator

### Expected Results:
- ✅ Smooth authentication flow
- ✅ Redirect back to journal page
- ✅ User session persists on page refresh
- ✅ No console errors

### Browser Console Check:
- Open DevTools (F12)
- Check Console tab for errors
- Look for any auth-related warnings

### Status: ⬜ Not Started / ✅ Passed / ❌ Failed

**Notes:**
```
[Your observations here]
```

---

## Test 2: Create Journal Entry

### Steps:
1. [ ] On journal page, click in the prompt area or text editor
2. [ ] Type a test journal entry: "Test entry for Phase 2 auth integration - [timestamp]"
3. [ ] Wait for auto-save or click save if present
4. [ ] Verify entry appears in the journal stream

### Expected Results:
- ✅ Entry saves successfully
- ✅ Entry appears in journal list
- ✅ No console errors

### Supabase Verification:
1. Open Supabase Dashboard: https://supabase.com/dashboard/project/otyvmmgakowcdsxehwox
2. Go to Table Editor → `notes` table
3. Find your test entry
4. **Critical Check:** Verify `user_id` column is populated with YOUR user ID
5. **Critical Check:** Verify `user_id` is NOT `00000000-0000-0000-0000-000000000000`

### Status: ⬜ Not Started / ✅ Passed / ❌ Failed

**Entry ID from Supabase:**
```
[UUID here]
```

**User ID from Supabase:**
```
[UUID here]
```

**Notes:**
```
[Your observations here]
```

---

## Test 3: View Journal Entries

### Steps:
1. [ ] Verify your test entry from Test 2 is visible in journal stream
2. [ ] Create 2-3 more journal entries with different content
3. [ ] Verify all entries appear in the stream
4. [ ] Refresh the page (F5)
5. [ ] Verify entries persist after refresh

### Expected Results:
- ✅ All created entries visible
- ✅ Entries load after refresh
- ✅ Entries sorted correctly (newest first)
- ✅ No console errors

### Status: ⬜ Not Started / ✅ Passed / ❌ Failed

**Number of entries created:**
```
[Count here]
```

**Notes:**
```
[Your observations here]
```

---

## Test 4: Create Note from Journal

### Steps:
1. [ ] Navigate to Notes page (left sidebar → Notes)
2. [ ] If there's a way to create a note from journal, test it
3. [ ] Otherwise, navigate back to journal
4. [ ] Look for "Create Note" or similar functionality
5. [ ] Create a test note

### Expected Results:
- ✅ Note creates successfully
- ✅ Note appears in notes list
- ✅ No console errors

### Supabase Verification:
1. Go to Table Editor → `notes` table
2. Find your test note
3. **Critical Check:** Verify `user_id` is populated correctly
4. **Critical Check:** Verify `note_type` is set appropriately

### Status: ⬜ Not Started / ✅ Passed / ❌ Failed

**Note ID from Supabase:**
```
[UUID here]
```

**Notes:**
```
[Your observations here]
```

---

## Test 5: View Notes Page & Personal Ontology

### Steps:
1. [ ] Navigate to Notes page (left sidebar → Notes)
2. [ ] Verify "Personal Ontology" section is visible
3. [ ] Verify three ontology cards: Values, Beliefs, Aims
4. [ ] Verify "Analyze My Notes" button is present
5. [ ] Verify "All Notes" section shows your created notes

### Expected Results:
- ✅ Personal Ontology section renders
- ✅ Three ontology cards present (even if empty)
- ✅ Notes list shows created notes
- ✅ No console errors

### Status: ⬜ Not Started / ✅ Passed / ❌ Failed

**Notes:**
```
[Your observations here]
```

---

## Test 6: Edit Existing Note

### Steps:
1. [ ] On Notes page, click on one of your notes
2. [ ] Edit the content or title
3. [ ] Save the changes (auto-save or manual save)
4. [ ] Verify changes persist

### Expected Results:
- ✅ Note opens for editing
- ✅ Changes save successfully
- ✅ Updated content visible after save
- ✅ No console errors

### Supabase Verification:
1. Go to Table Editor → `notes` table
2. Find the edited note by ID
3. **Critical Check:** Verify `updated_at` timestamp updated
4. **Critical Check:** Verify content matches your edits
5. **Critical Check:** Verify `user_id` still matches your user ID

### Status: ⬜ Not Started / ✅ Passed / ❌ Failed

**Notes:**
```
[Your observations here]
```

---

## Test 7: Ontology Analysis (Critical Test)

### Prerequisites:
- Need at least 5 journal entries for meaningful extraction

### Steps:
1. [ ] Ensure you have 5+ journal entries created
2. [ ] Navigate to Notes page
3. [ ] Click "Analyze My Notes" button
4. [ ] Wait for analysis to complete (may take 10-30 seconds)
5. [ ] Verify toast notification shows success message
6. [ ] Verify Personal Ontology cards populate with extracted items

### Expected Results:
- ✅ Analysis completes without errors
- ✅ Toast shows: "Ontology updated! Analyzed X entries. Found Y values, Z beliefs, W aims"
- ✅ Values card shows extracted values
- ✅ Beliefs card shows extracted beliefs
- ✅ Aims card shows extracted aims
- ✅ No console errors

### Supabase Verification:
1. Go to Table Editor → `notes` table
2. Filter by `note_type`: `ontology-value`, `ontology-belief`, `ontology-aim`
3. **Critical Check:** Verify `user_id` on all three ontology notes
4. **Critical Check:** Verify `metadata` column contains extracted items
5. **Critical Check:** Verify `updated_at` timestamp is recent

### Status: ⬜ Not Started / ✅ Passed / ❌ Failed

**Analysis Results:**
```
Values found: [count]
Beliefs found: [count]
Aims found: [count]
```

**Supabase ontology note IDs:**
```
Values note: [UUID]
Beliefs note: [UUID]
Aims note: [UUID]
```

**Notes:**
```
[Your observations here]
```

---

## Test 8: Delete Note

### Steps:
1. [ ] On Notes page, select a test note
2. [ ] Look for delete button/option
3. [ ] Delete the note
4. [ ] Verify note removed from list
5. [ ] Refresh page
6. [ ] Verify note still deleted (not just hidden)

### Expected Results:
- ✅ Delete operation completes
- ✅ Note removed from UI
- ✅ Deletion persists after refresh
- ✅ No console errors

### Supabase Verification:
1. Go to Table Editor → `notes` table
2. **Critical Check:** Verify deleted note no longer exists
3. Or verify note marked as deleted if soft-delete implemented

### Status: ⬜ Not Started / ✅ Passed / ❌ Failed

**Notes:**
```
[Your observations here]
```

---

## Test 9: Multi-User Isolation (Optional)

**Note:** This test is technically Phase 4 (RLS), but worth checking now.

### Steps:
1. [ ] Open Supabase Table Editor
2. [ ] Note your current user_id from any created note
3. [ ] Sign out of the app
4. [ ] Sign in with a DIFFERENT test account (if available)
5. [ ] Verify you DON'T see the first user's notes/entries
6. [ ] Create a note with second user
7. [ ] Verify user_id is different from first user

### Expected Results:
- ✅ Second user sees empty journal/notes
- ✅ Second user's data has different user_id
- ⚠️ **May fail** - RLS policies not yet enforced (Phase 4)

### Status: ⬜ Not Started / ✅ Passed / ❌ Failed / ⏸️ Skipped

**Notes:**
```
[Your observations here]
```

---

## Critical Data Verification Checklist

After completing all tests, verify in Supabase:

### Notes Table Verification:
- [ ] All test entries have `user_id` populated
- [ ] No entries have `user_id` = `00000000-0000-0000-0000-000000000000`
- [ ] Journal entries have `note_type` = `journal-entry`
- [ ] Regular notes have `note_type` = `custom` or appropriate type
- [ ] Ontology notes have `note_type` = `ontology-value`, `ontology-belief`, `ontology-aim`
- [ ] All entries have `created_at` and `updated_at` timestamps
- [ ] Edited notes have `updated_at` > `created_at`

### Console Errors Check:
- [ ] No errors in browser console during any test
- [ ] No 401/403 errors in Network tab
- [ ] No TypeScript errors in console
- [ ] No Supabase client errors

---

## Known Issues / Expected Behavior

### Expected for Phase 2:
- ⚠️ Unauthenticated users can still access pages (Phase 3 will fix)
- ⚠️ Multi-user data isolation may not work yet (Phase 4 - RLS policies)
- ⚠️ API routes may not enforce auth (Phase 5 will fix)

### Not Blocking Phase 2 Merge:
- Minor UX issues (empty toast notifications)
- Missing loading states
- UI polish items

---

## Final Decision

### Test Results Summary:
- Tests Passed: __ / 9
- Tests Failed: __ / 9
- Tests Skipped: __ / 9

### Critical Issues Found:
```
[List any blocking issues here]
```

### Non-Critical Issues Found:
```
[List minor issues here]
```

### Recommendation:
⬜ **APPROVE** - Ready to merge PR #7
⬜ **NEEDS FIXES** - Address critical issues first
⬜ **NEEDS DISCUSSION** - Unclear behavior needs clarification

---

## Sign-Off

**Tester:** [Your name]
**Date:** [Test date]
**Duration:** [Time spent testing]

**Overall Assessment:**
```
[Your summary here]
```
