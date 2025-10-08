-- STEP 1b: Check your 5 notes (should be intact)
-- Expected: 5 notes with titles about Authenticity, Vulnerability, Work, Meditation, Conflict

SELECT
  id AS note_id,
  title,
  LEFT(content, 150) AS content_preview,
  LENGTH(content) AS content_length,
  created_at
FROM notes
WHERE user_id = '8b11b1c0-4c28-4fa5-9af5-a4bd981dadc6'
  AND note_type = 'custom'
ORDER BY created_at DESC
LIMIT 10;
