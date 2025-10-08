-- STEP 1a: Check your journal entry (should be corrupted)
-- Expected: content_length = 4, content = "<br>"

SELECT
  id AS journal_entry_id,
  title,
  content AS full_content,
  LENGTH(content) AS content_length,
  metadata,
  created_at
FROM notes
WHERE user_id = '8b11b1c0-4c28-4fa5-9af5-a4bd981dadc6'
  AND note_type = 'journal-entry'
ORDER BY created_at DESC
LIMIT 1;
