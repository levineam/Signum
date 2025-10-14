-- Debug: Check ALL data for your user to see what exists

-- Check ALL notes (any type)
SELECT
  id,
  note_type,
  title,
  LEFT(content, 100) AS content_preview,
  LENGTH(content) AS content_length,
  created_at
FROM notes
WHERE user_id = '8b11b1c0-4c28-4fa5-9af5-a4bd981dadc6'
ORDER BY created_at DESC;

-- Check ALL links
SELECT
  l.id,
  l.source_note_id,
  l.target_note_id,
  l.link_type,
  l.created_at
FROM links l
WHERE l.user_id = '8b11b1c0-4c28-4fa5-9af5-a4bd981dadc6'
ORDER BY l.created_at DESC;
