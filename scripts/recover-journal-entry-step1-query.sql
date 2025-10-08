-- ============================================================================
-- STEP 1: IDENTIFY YOUR DATA
-- ============================================================================
-- Purpose: This script shows you what data exists so you can verify it before
--          running the reconstruction script.
--
-- Instructions:
-- 1. Copy this ENTIRE file
-- 2. Paste into Supabase SQL Editor
-- 3. Click "Run" (runs all 3 queries)
-- 4. Review the 3 result tables below
-- 5. Verify your data matches expectations (see checklist below)
-- 6. If everything looks good, proceed to step 2 reconstruction script
-- ============================================================================

-- User: dev-test-3@signum.dev (ID: 8b11b1c0-4c28-4fa5-9af5-a4bd981dadc6)


-- ============================================================================
-- QUERY 1: Find your journal entry (should be corrupted)
-- ============================================================================

SELECT
  id AS journal_entry_id,
  title,
  LEFT(content, 200) AS content_preview,
  LENGTH(content) AS content_length,
  metadata,
  created_at
FROM notes
WHERE user_id = '8b11b1c0-4c28-4fa5-9af5-a4bd981dadc6'
  AND note_type = 'journal-entry'
ORDER BY created_at DESC
LIMIT 5;

-- ✅ WHAT TO CHECK:
--    - Should show 1-2 journal entries (most recent is today's)
--    - The most recent one should have SHORT content_length (corrupted)
--    - Content_preview should show only "authenticity is incredibly important" or similar
--    - Note the journal_entry_id (you'll need this if auto-matching fails in step 2)


-- ============================================================================
-- QUERY 2: Find your 5 notes (should be intact, not corrupted)
-- ============================================================================

SELECT
  id AS note_id,
  title,
  LEFT(content, 100) AS content_preview,
  created_at
FROM notes
WHERE user_id = '8b11b1c0-4c28-4fa5-9af5-a4bd981dadc6'
  AND note_type = 'custom'
ORDER BY created_at DESC
LIMIT 10;

-- ✅ WHAT TO CHECK:
--    - Should show 5 notes (possibly more if you created others)
--    - Titles should be related to: Authenticity, Vulnerability, Meaningful Work,
--      Meditation, Conflict Avoidance (or similar wording)
--    - Content_preview should show the beginning of each note's content
--    - Notes should be INTACT (not corrupted) - only the journal entry is corrupted
--    - Note the note_ids if you want to manually verify matching in step 2


-- ============================================================================
-- QUERY 3: Check existing links between journal entry and notes
-- ============================================================================

SELECT
  l.id AS link_id,
  l.source_note_id,
  l.target_note_id,
  l.link_type,
  sn.title AS source_title,
  tn.title AS target_title
FROM links l
JOIN notes sn ON l.source_note_id = sn.id
JOIN notes tn ON l.target_note_id = tn.id
WHERE l.user_id = '8b11b1c0-4c28-4fa5-9af5-a4bd981dadc6'
ORDER BY l.created_at DESC
LIMIT 20;

-- ✅ WHAT TO CHECK:
--    - Should show 5 links (one for each note you created)
--    - source_title should be "Journal Entry - [date]"
--    - target_title should match your 5 note titles
--    - link_type should be 'created_from'
--    - If this table is EMPTY, that's a problem - let me know


-- ============================================================================
-- ✅ FINAL CHECKLIST BEFORE PROCEEDING TO STEP 2:
-- ============================================================================
--
-- [ ] Query 1 shows my corrupted journal entry with short content
-- [ ] Query 2 shows my 5 intact notes with correct titles
-- [ ] Query 3 shows 5 links connecting journal entry to notes
--
-- If all 3 boxes are checked, you're ready for step 2!
-- If something looks wrong, stop and let me know what you see.
--
-- ============================================================================
