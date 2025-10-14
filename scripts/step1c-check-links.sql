-- STEP 1c: Check links between journal and notes
-- Expected: 5 links showing journal entry → notes

SELECT
  l.id AS link_id,
  l.source_note_id,
  l.target_note_id,
  l.link_type,
  sn.title AS source_title,
  tn.title AS target_title,
  l.created_at
FROM links l
JOIN notes sn ON l.source_note_id = sn.id
JOIN notes tn ON l.target_note_id = tn.id
WHERE l.user_id = '8b11b1c0-4c28-4fa5-9af5-a4bd981dadc6'
ORDER BY l.created_at DESC
LIMIT 20;
