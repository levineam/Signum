-- Story 2.4.7: Ontology Update Notifications
-- Creates notification system to track when users view new ontology updates
-- GitHub Issue: #129

-- ============================================================================
-- Create ontology_updates table
-- ============================================================================

CREATE TABLE ontology_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL CHECK (update_type IN ('new_item', 'item_modified')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  viewed_at TIMESTAMP WITH TIME ZONE,

  -- Prevent duplicate update notifications for same timestamp
  -- Allow multiple updates for same note if created at different times
  UNIQUE(user_id, note_id, update_type, created_at)
);

-- ============================================================================
-- Create indexes for performance
-- ============================================================================

-- Primary query pattern: fetch unread updates for a user
CREATE INDEX idx_ontology_updates_user_viewed ON ontology_updates(user_id, viewed_at)
  WHERE viewed_at IS NULL;

-- Query by note_id for debugging/analytics
CREATE INDEX idx_ontology_updates_note ON ontology_updates(note_id);

-- Sort by created_at for chronological display
CREATE INDEX idx_ontology_updates_created ON ontology_updates(created_at DESC);

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on ontology_updates table
ALTER TABLE ontology_updates ENABLE ROW LEVEL SECURITY;

-- Users can only view their own ontology updates
CREATE POLICY "Users can view their own ontology updates"
  ON ontology_updates
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can only update their own ontology updates (for marking as viewed)
CREATE POLICY "Users can update their own ontology updates"
  ON ontology_updates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System can insert ontology updates (via trigger)
-- Note: Trigger runs with SECURITY DEFINER, so this policy allows inserts
CREATE POLICY "System can insert ontology updates"
  ON ontology_updates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Trigger function to create update records when ontology items change
-- ============================================================================

CREATE OR REPLACE FUNCTION create_ontology_update_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track ontology notes (values, beliefs, goals)
  -- Ignore journal entries, reflections, and custom notes
  IF NEW.note_type IN ('ontology-value', 'ontology-belief', 'ontology-aim')
     AND NEW.is_pinned = TRUE THEN

    -- INSERT: New ontology item created
    IF TG_OP = 'INSERT' THEN
      INSERT INTO ontology_updates (user_id, note_id, update_type)
      VALUES (NEW.user_id, NEW.id, 'new_item')
      ON CONFLICT (user_id, note_id, update_type, created_at) DO NOTHING;

    -- UPDATE: Existing ontology item modified (content changed)
    ELSIF TG_OP = 'UPDATE' AND (
      OLD.content != NEW.content OR
      OLD.metadata != NEW.metadata
    ) THEN
      INSERT INTO ontology_updates (user_id, note_id, update_type)
      VALUES (NEW.user_id, NEW.id, 'item_modified')
      ON CONFLICT (user_id, note_id, update_type, created_at) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Attach trigger to notes table
-- ============================================================================

CREATE TRIGGER ontology_update_notification_trigger
AFTER INSERT OR UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION create_ontology_update_notification();

-- ============================================================================
-- Verification queries (for testing)
-- ============================================================================

-- Count unread updates for a user
-- SELECT COUNT(*) FROM ontology_updates WHERE user_id = 'USER_ID' AND viewed_at IS NULL;

-- Mark all updates as viewed for a user
-- UPDATE ontology_updates SET viewed_at = now() WHERE user_id = 'USER_ID' AND viewed_at IS NULL;

-- View all updates for a user (debugging)
-- SELECT * FROM ontology_updates WHERE user_id = 'USER_ID' ORDER BY created_at DESC;
