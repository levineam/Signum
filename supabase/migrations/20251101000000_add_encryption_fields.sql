-- Migration: Add encryption fields to notes table
-- Story 2.10: End-to-End Encryption Phase 1
-- Description: Adds columns for client-side encryption support

-- Add encryption metadata columns to notes table
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS encryption_version INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS encrypted_title TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS title_iv TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS encrypted_content TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS content_iv TEXT DEFAULT NULL;

-- Make title and content nullable to support encrypted notes
-- When encryption is enabled, these columns are cleared and data is stored in encrypted_* columns
ALTER TABLE notes
ALTER COLUMN title DROP NOT NULL,
ALTER COLUMN content DROP NOT NULL;

-- Create index for querying encrypted vs plain text notes
CREATE INDEX IF NOT EXISTS idx_notes_encryption_version
ON notes(user_id, encryption_version);

-- Add documentation comments
COMMENT ON COLUMN notes.encryption_version IS
  'Encryption version: NULL = plain text (legacy), 1 = AES-256-GCM, future versions for algorithm updates';

COMMENT ON COLUMN notes.encrypted_title IS
  'Base64-encoded encrypted title (when encryption_version is not NULL)';

COMMENT ON COLUMN notes.title_iv IS
  'Base64-encoded initialization vector for title encryption';

COMMENT ON COLUMN notes.encrypted_content IS
  'Base64-encoded encrypted content (when encryption_version is not NULL)';

COMMENT ON COLUMN notes.content_iv IS
  'Base64-encoded initialization vector for content encryption';

COMMENT ON COLUMN notes.title IS
  'Plain text title (nullable after encryption migration). NULL when encryption_version is not NULL.';

COMMENT ON COLUMN notes.content IS
  'Plain text content (nullable after encryption migration). NULL when encryption_version is not NULL.';
