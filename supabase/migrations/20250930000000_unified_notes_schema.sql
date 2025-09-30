-- Story 2.3.6: Unified Note Data Model & Supabase Migration
-- Creates the unified notes table that consolidates journal entries and notes
-- into a single table with a discriminator field (note_type)

-- ============================================================================
-- Drop existing tables if any (fresh start)
-- ============================================================================

DROP TABLE IF EXISTS links CASCADE;
DROP TABLE IF EXISTS notes CASCADE;

-- ============================================================================
-- Create notes table (unified model)
-- ============================================================================

CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  note_type TEXT NOT NULL CHECK (note_type IN (
    'journal-entry',    -- Daily journal entries (replaces JournalEntry)
    'reflection',       -- Notes created from highlighted text
    'ontology-value',   -- AI-extracted value
    'ontology-belief',  -- AI-extracted belief
    'ontology-aim',     -- AI-extracted aim
    'custom'            -- User-created standalone note (replaces 'regular')
  )),
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================================
-- Create indexes for performance
-- ============================================================================

-- Primary query patterns
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_note_type ON notes(note_type);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- Journal entries are queried by date
CREATE INDEX idx_notes_journal_date ON notes((metadata->>'journalDate'))
  WHERE note_type = 'journal-entry';

-- Ontology notes are filtered by pinned status
CREATE INDEX idx_notes_pinned ON notes(is_pinned)
  WHERE is_pinned = TRUE;

-- Full-text search on title and content
CREATE INDEX idx_notes_search ON notes USING gin(to_tsvector('english', title || ' ' || content));

-- ============================================================================
-- Create links table (bidirectional relationships)
-- ============================================================================

CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  target_note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN (
    'created_from',  -- Source journal entry → target note
    'references',    -- General reference relationship
    'related_to'     -- Bidirectional related content
  )),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- Prevent duplicate links
  UNIQUE(source_note_id, target_note_id, link_type)
);

-- Index for link traversal
CREATE INDEX idx_links_source ON links(source_note_id);
CREATE INDEX idx_links_target ON links(target_note_id);
CREATE INDEX idx_links_user ON links(user_id);

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Users can only access their own notes
CREATE POLICY "Users can CRUD their own notes"
  ON notes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable RLS on links table
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Users can only access their own links
CREATE POLICY "Users can CRUD their own links"
  ON links
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper functions
-- ============================================================================

-- Function to get journal entries for a user
CREATE OR REPLACE FUNCTION get_journal_entries(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  journal_date DATE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  is_sample BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.content,
    (n.metadata->>'journalDate')::DATE as journal_date,
    n.created_at,
    n.updated_at,
    COALESCE((n.metadata->>'isSample')::BOOLEAN, FALSE) as is_sample
  FROM notes n
  WHERE n.user_id = p_user_id
    AND n.note_type = 'journal-entry'
  ORDER BY (n.metadata->>'journalDate') DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get regular notes for a user
CREATE OR REPLACE FUNCTION get_regular_notes(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  note_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.content,
    n.note_type,
    n.created_at,
    n.updated_at
  FROM notes n
  WHERE n.user_id = p_user_id
    AND n.note_type IN ('custom', 'reflection')
  ORDER BY n.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get pinned ontology notes
CREATE OR REPLACE FUNCTION get_ontology_notes(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  note_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.content,
    n.note_type,
    n.created_at,
    n.updated_at
  FROM notes n
  WHERE n.user_id = p_user_id
    AND n.note_type IN ('ontology-value', 'ontology-belief', 'ontology-aim')
    AND n.is_pinned = TRUE
  ORDER BY
    CASE n.note_type
      WHEN 'ontology-value' THEN 1
      WHEN 'ontology-belief' THEN 2
      WHEN 'ontology-aim' THEN 3
    END;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE notes IS 'Unified table for all note types: journal entries, reflections, ontology items, and custom notes';
COMMENT ON COLUMN notes.note_type IS 'Discriminator field: journal-entry, reflection, ontology-value, ontology-belief, ontology-aim, custom';
COMMENT ON COLUMN notes.metadata IS 'JSONB field for type-specific data: journalDate, prompt, sourceNoteId, confidence, extractedFrom, aiReasoning, tags, isSample, legacyId';
COMMENT ON TABLE links IS 'Bidirectional relationships between notes';
COMMENT ON COLUMN links.link_type IS 'Relationship type: created_from (journal→note), references, related_to';
