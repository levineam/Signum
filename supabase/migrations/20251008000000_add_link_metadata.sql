-- ============================================================================
-- Add metadata field to links table for link resilience
-- Story 2.4.2: Migrate Links to Supabase (MVP)
-- ============================================================================

-- Add metadata JSONB column to store link context
ALTER TABLE links
ADD COLUMN metadata JSONB DEFAULT '{}';

-- Add comment explaining metadata structure
COMMENT ON COLUMN links.metadata IS 'Stores link context for resilience: { snippet, contextBefore, contextAfter, textContentPos }';
