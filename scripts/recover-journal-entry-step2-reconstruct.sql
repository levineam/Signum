-- Step 2: Reconstruct the corrupted journal entry with proper note links
-- Run this AFTER running step1-query.sql to identify the correct journal_entry_id
-- User: dev-test-3@signum.dev (ID: 8b11b1c0-4c28-4fa5-9af5-a4bd981dadc6)

-- Replace these values based on step1 query results:
-- JOURNAL_ENTRY_ID: The ID of the corrupted journal entry (from step 1, query 1)
-- NOTE1_ID through NOTE5_ID: The IDs of your 5 notes (from step 1, query 2)

DO $$
DECLARE
  v_user_id UUID := '8b11b1c0-4c28-4fa5-9af5-a4bd981dadc6';
  v_journal_entry_id UUID; -- Will be found automatically
  v_note1_id UUID; -- Authenticity note
  v_note2_id UUID; -- Vulnerability note
  v_note3_id UUID; -- Meaningful work note
  v_note4_id UUID; -- Meditation note
  v_note5_id UUID; -- Conflict avoidance note
  v_reconstructed_content TEXT;
BEGIN
  -- Find the most recent journal entry (likely today's entry)
  SELECT id INTO v_journal_entry_id
  FROM notes
  WHERE user_id = v_user_id
    AND note_type = 'journal-entry'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Find notes by matching title keywords (adjust if your titles are different)
  -- Note: If these don't match, you'll need to manually set the note IDs above
  SELECT id INTO v_note1_id FROM notes
  WHERE user_id = v_user_id
    AND note_type = 'custom'
    AND (title ILIKE '%authenticity%' OR content LIKE '%authenticity is incredibly important%')
  ORDER BY created_at DESC LIMIT 1;

  SELECT id INTO v_note2_id FROM notes
  WHERE user_id = v_user_id
    AND note_type = 'custom'
    AND (title ILIKE '%vulnerability%' OR title ILIKE '%relationship%' OR content LIKE '%meaningful relationships%')
  ORDER BY created_at DESC LIMIT 1;

  SELECT id INTO v_note3_id FROM notes
  WHERE user_id = v_user_id
    AND note_type = 'custom'
    AND (title ILIKE '%work%' OR title ILIKE '%career%' OR title ILIKE '%impact%' OR content LIKE '%mental health and well-being%')
  ORDER BY created_at DESC LIMIT 1;

  SELECT id INTO v_note4_id FROM notes
  WHERE user_id = v_user_id
    AND note_type = 'custom'
    AND (title ILIKE '%meditation%' OR content LIKE '%daily meditation practice%')
  ORDER BY created_at DESC LIMIT 1;

  SELECT id INTO v_note5_id FROM notes
  WHERE user_id = v_user_id
    AND note_type = 'custom'
    AND (title ILIKE '%conflict%' OR content LIKE '%avoid conflict%')
  ORDER BY created_at DESC LIMIT 1;

  -- Reconstruct the full journal content with proper HTML links
  v_reconstructed_content :=
    '<p>Today I''ve been reflecting on what really matters to me and where I want to go in life.</p>' ||
    '<p><a href="#" class="note-link text-primary hover:text-primary/80 underline cursor-pointer" data-note-id="' || v_note1_id || '" contenteditable="false">I realize that authenticity is incredibly important to me - being true to myself even when it''s uncomfortable or unpopular.</a> I''ve spent too much time trying to fit into others'' expectations, and it''s exhausting. Moving forward, I want to make decisions that align with who I really am, not who others think I should be.</p>' ||
    '<p><a href="#" class="note-link text-primary hover:text-primary/80 underline cursor-pointer" data-note-id="' || v_note2_id || '" contenteditable="false">I believe that meaningful relationships are built on vulnerability and honest communication.</a> When I look back at my closest friendships, they all started with moments where someone took a risk and shared something real. Surface-level conversations feel hollow now. I want to cultivate deeper connections by showing up as my authentic self.</p>' ||
    '<p>I''ve been thinking about my career path lately. <a href="#" class="note-link text-primary hover:text-primary/80 underline cursor-pointer" data-note-id="' || v_note3_id || '" contenteditable="false">My goal is to build work that has a positive impact on people''s mental health and well-being.</a> I''m tired of feeling like my work is just a paycheck. I want to wake up excited about what I''m creating and know that it''s helping people live better lives. Even if it means taking a pay cut or starting over, I think it''s worth it.</p>' ||
    '<p>On a more practical level, <a href="#" class="note-link text-primary hover:text-primary/80 underline cursor-pointer" data-note-id="' || v_note4_id || '" contenteditable="false">I''m committed to establishing a daily meditation practice for at least 20 minutes.</a> I''ve tried this before and failed, but I know it helps me stay grounded and present. This time I''m going to set a specific time (7am before work) and treat it like a non-negotiable appointment with myself.</p>' ||
    '<p><a href="#" class="note-link text-primary hover:text-primary/80 underline cursor-pointer" data-note-id="' || v_note5_id || '" contenteditable="false">I''ve noticed that I tend to avoid conflict, even when speaking up would lead to better outcomes.</a> This pattern shows up everywhere - in my relationships, at work, even with my family. I end up resentful because I don''t advocate for myself. I need to practice stating my needs clearly and respectfully, even when it feels uncomfortable. It''s not about being aggressive; it''s about respecting myself enough to have a voice.</p>';

  -- Update the journal entry with reconstructed content
  UPDATE notes
  SET content = v_reconstructed_content,
      updated_at = now()
  WHERE id = v_journal_entry_id;

  -- Verify and show results
  RAISE NOTICE 'Journal entry updated: %', v_journal_entry_id;
  RAISE NOTICE 'Note 1 (Authenticity): %', v_note1_id;
  RAISE NOTICE 'Note 2 (Vulnerability): %', v_note2_id;
  RAISE NOTICE 'Note 3 (Meaningful Work): %', v_note3_id;
  RAISE NOTICE 'Note 4 (Meditation): %', v_note4_id;
  RAISE NOTICE 'Note 5 (Conflict): %', v_note5_id;

  -- Check if any note IDs are NULL (indicating matching failed)
  IF v_note1_id IS NULL OR v_note2_id IS NULL OR v_note3_id IS NULL OR
     v_note4_id IS NULL OR v_note5_id IS NULL THEN
    RAISE EXCEPTION 'Failed to find one or more notes. Please check titles and adjust matching logic.';
  END IF;

  -- Ensure links exist in the links table
  -- Insert links if they don't exist (ON CONFLICT DO NOTHING prevents duplicates)
  INSERT INTO links (source_note_id, target_note_id, link_type, user_id)
  VALUES
    (v_journal_entry_id, v_note1_id, 'created_from', v_user_id),
    (v_journal_entry_id, v_note2_id, 'created_from', v_user_id),
    (v_journal_entry_id, v_note3_id, 'created_from', v_user_id),
    (v_journal_entry_id, v_note4_id, 'created_from', v_user_id),
    (v_journal_entry_id, v_note5_id, 'created_from', v_user_id)
  ON CONFLICT (source_note_id, target_note_id, link_type) DO NOTHING;

  RAISE NOTICE 'Reconstruction complete! Links table updated.';
END $$;

-- Verify the update
SELECT
  id,
  title,
  LEFT(content, 200) AS content_preview,
  LENGTH(content) AS content_length,
  updated_at
FROM notes
WHERE user_id = '8b11b1c0-4c28-4fa5-9af5-a4bd981dadc6'
  AND note_type = 'journal-entry'
ORDER BY updated_at DESC
LIMIT 1;
