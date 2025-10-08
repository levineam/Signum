# Journal Entry Data Recovery Guide

## Problem
Your journal entry was corrupted during note creation - only "authenticity is incredibly important" remained instead of the full content with 5 note links.

## Solution
Use these SQL scripts to restore your journal entry with all 5 note links properly reconnected.

## Quick Overview (Read This First!)

**What you're going to do:**
1. **Step 1 (Look)**: Run a query to see your corrupted data - NO CHANGES made
2. **Step 2 (Fix)**: Run a script to restore your journal entry - WILL UPDATE database
3. **Step 3 (Verify)**: Check the app to make sure everything works

**Time needed:** ~5 minutes

**Risk level:** Low - the reconstruction script is automated and includes validation

---

## Recovery Steps

### Step 1: Identify Your Data (Verification Only - No Changes Made)

Run these 3 queries **one at a time** in Supabase SQL Editor:

#### Step 1a: Check Your Journal Entry

1. Open `scripts/step1a-check-journal.sql`
2. Copy the contents and paste into Supabase SQL Editor
3. Click **Run**

**Expected result:**
- `journal_entry_id`: 9a8eac30-b3a2-46ff-912f-3dd83d2a538b ✅ (confirmed from your screenshot)
- `content_length`: 4 ✅ (confirmed - only has `<br>`)
- This confirms the journal is corrupted

#### Step 1b: Check Your 5 Notes

1. Open `scripts/step1b-check-notes.sql`
2. Copy and paste into Supabase SQL Editor
3. Click **Run**

**Expected result:**
- Should show 5 notes with titles about: Authenticity, Vulnerability, Meaningful Work, Meditation, Conflict Avoidance
- `content_length` should be much longer (notes should be intact)
- Take a screenshot and share it

#### Step 1c: Check Links

1. Open `scripts/step1c-check-links.sql`
2. Copy and paste into Supabase SQL Editor
3. Click **Run**

**Expected result:**
- Should show 5 links
- `source_title` = "Journal Entry - 2025-10-07"
- `target_title` = your 5 note titles
- Take a screenshot and share it

**⚠️ These queries make NO changes to your data**

### Step 2: Reconstruct Your Journal Entry (This WILL Make Changes)

Run `recover-journal-entry-step2-reconstruct.sql` in Supabase SQL Editor:

1. Copy and paste the **ENTIRE** contents of `recover-journal-entry-step2-reconstruct.sql`
2. Click **Run**
3. Watch the **Messages** tab for output:
   - Should show: `NOTICE: Journal entry updated: [uuid]`
   - Should show: `NOTICE: Note 1 (Authenticity): [uuid]`
   - Should show: `NOTICE: Note 2 (Vulnerability): [uuid]`
   - Should show: `NOTICE: Note 3 (Meaningful Work): [uuid]`
   - Should show: `NOTICE: Note 4 (Meditation): [uuid]`
   - Should show: `NOTICE: Note 5 (Conflict): [uuid]`
   - Should show: `NOTICE: Reconstruction complete! Links table updated.`
4. Check the **Results** tab - should show your journal entry with `content_length` much longer now (restored)

**⚠️ This step WILL UPDATE your journal entry in the database**

**If the script fails with an error:**
- Check the error message - it will tell you which note couldn't be matched
- Look at your note titles from Step 1
- Manually edit the matching logic in the script (see "If Something Goes Wrong" section below)

### Step 3: Verify in the App

1. Sign in to the app with dev-test-3@signum.dev
2. Navigate to Journal page
3. Your journal entry should now show the full content with 5 blue underlined links
4. Click each link to verify it opens the correct note
5. Navigate to Notes page to verify notes still exist

---

## What This Fixes

- ✅ Restores full journal entry content (all paragraphs)
- ✅ Re-creates HTML `<a data-note-id="...">` links for all 5 notes
- ✅ Ensures `links` table has proper relationships
- ✅ Preserves all note content (notes were never corrupted, only the journal entry)

---

## If Something Goes Wrong

If the reconstruction script fails:

1. **Check note titles**: Run step 1 query again and verify note titles
2. **Manual reconstruction**: If auto-matching fails, you can manually edit the script:
   - Find the `DECLARE` section
   - Uncomment and set the note IDs manually:
     ```sql
     v_note1_id UUID := 'your-note-1-uuid-here';
     v_note2_id UUID := 'your-note-2-uuid-here';
     -- etc.
     ```
   - Comment out the auto-matching SELECT statements
   - Re-run the script

3. **Rollback**: If you need to undo the change:
   ```sql
   -- Find the previous version
   SELECT * FROM notes
   WHERE user_id = '8b11b1c0-4c28-4fa5-9af5-a4bd981dadc6'
     AND note_type = 'journal-entry'
   ORDER BY updated_at DESC;
   ```

---

## Technical Details

### Root Cause of the Bug

The bug occurred in `JournalStream.tsx:handleNoteCreated()`:

1. User highlighted text and created a note
2. Function tried to read `editorElement.innerHTML` after creating link
3. Editor was in a corrupted state (possibly due to modal focus)
4. Only the selected text was read instead of full content
5. Corrupted content was persisted to Supabase

### What Was Fixed in PR #7

- P1 Issue: Link position bug with repeated text
- P1 Issue: Journal entries visible after sign-out
- P1 Issue: Notes visible after sign-out

The data corruption happened **before** these fixes were merged, which is why your data needs manual recovery.

---

## Prevention

The bug that caused this corruption has been fixed. Future note creations will:
- Read the full editor content after DOM settles
- Properly validate content before persisting
- Place links at the correct position (even with repeated text)
