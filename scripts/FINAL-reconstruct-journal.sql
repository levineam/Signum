-- ============================================================================
-- FINAL RECONSTRUCTION SCRIPT FOR DEV-TEST-1
-- ============================================================================
-- This will restore your journal entry with the 3 notes you created
-- User: dev-test-1@signum.dev (ID: 9022819a-e1d6-4cb4-b3e9-88025e5f2bc6)
--
-- INSTRUCTIONS:
-- 1. Copy this ENTIRE script
-- 2. Paste into Supabase SQL Editor
-- 3. Click "Run"
-- 4. Check the Messages tab for success notices
-- 5. Verify in the app
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID := '9022819a-e1d6-4cb4-b3e9-88025e5f2bc6';
  v_journal_entry_id UUID;
  v_note1_id UUID := '7f66a800-dc2f-48aa-8f57-aa5b7f36015d'; -- authenticity
  v_note2_id UUID := '4d2b4588-8e50-457b-bb27-647981c054e3'; -- meaningful relationships
  v_note3_id UUID := 'cf158bd6-9015-4d23-8467-ba86ffc0a046'; -- my career path
  v_reconstructed_content TEXT;
BEGIN
  -- Find the most recent journal entry (the corrupted one)
  SELECT id INTO v_journal_entry_id
  FROM notes
  WHERE user_id = v_user_id
    AND note_type = 'journal-entry'
  ORDER BY created_at DESC
  LIMIT 1;

  RAISE NOTICE 'Found journal entry: %', v_journal_entry_id;

  -- Reconstruct the full journal content with proper HTML links
  -- Based on the sample content from phase2-sample-journal-content.md
  v_reconstructed_content :=
    '<p>Today I''ve been reflecting on what really matters to me and where I want to go in life.</p>' ||
    '<p><a href="#" class="note-link text-primary hover:text-primary/80 underline cursor-pointer" data-note-id="' || v_note1_id || '" contenteditable="false">I realize that authenticity is incredibly important to me - being true to myself even when it''s uncomfortable or unpopular.</a> I''ve spent too much time trying to fit into others'' expectations, and it''s exhausting. Moving forward, I want to make decisions that align with who I really am, not who others think I should be.</p>' ||
    '<p><a href="#" class="note-link text-primary hover:text-primary/80 underline cursor-pointer" data-note-id="' || v_note2_id || '" contenteditable="false">I believe that meaningful relationships are built on vulnerability and honest communication.</a> When I look back at my closest friendships, they all started with moments where someone took a risk and shared something real. Surface-level conversations feel hollow now. I want to cultivate deeper connections by showing up as my authentic self.</p>' ||
    '<p>I''ve been thinking about my career path lately. <a href="#" class="note-link text-primary hover:text-primary/80 underline cursor-pointer" data-note-id="' || v_note3_id || '" contenteditable="false">My goal is to build work that has a positive impact on people''s mental health and well-being.</a> I''m tired of feeling like my work is just a paycheck. I want to wake up excited about what I''m creating and know that it''s helping people live better lives. Even if it means taking a pay cut or starting over, I think it''s worth it.</p>';

  -- Update the journal entry with reconstructed content
  UPDATE notes
  SET content = v_reconstructed_content,
      updated_at = now()
  WHERE id = v_journal_entry_id;

  RAISE NOTICE 'Journal entry updated successfully!';
  RAISE NOTICE 'Note 1 (Authenticity): %', v_note1_id;
  RAISE NOTICE 'Note 2 (Meaningful Relationships): %', v_note2_id;
  RAISE NOTICE 'Note 3 (My Career Path): %', v_note3_id;

  -- Ensure links exist in the links table
  -- Insert links if they don't exist (ON CONFLICT DO NOTHING prevents duplicates)
  INSERT INTO links (source_note_id, target_note_id, link_type, user_id)
  VALUES
    (v_journal_entry_id, v_note1_id, 'created_from', v_user_id),
    (v_journal_entry_id, v_note2_id, 'created_from', v_user_id),
    (v_journal_entry_id, v_note3_id, 'created_from', v_user_id)
  ON CONFLICT (source_note_id, target_note_id, link_type) DO NOTHING;

  RAISE NOTICE 'Links table updated!';
  RAISE NOTICE 'Reconstruction complete!';
END $$;

-- Verify the update worked
SELECT
  id,
  title,
  LEFT(content, 200) AS content_preview,
  LENGTH(content) AS content_length,
  updated_at
FROM notes
WHERE user_id = '9022819a-e1d6-4cb4-b3e9-88025e5f2bc6'
  AND note_type = 'journal-entry'
ORDER BY updated_at DESC
LIMIT 1;
