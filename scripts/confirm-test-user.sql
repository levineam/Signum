-- Confirm test user in Supabase Auth
-- Run this in Supabase SQL Editor

-- User: dev-test-3@signum.dev
-- User ID: 8b11b1c0-4c28-4fa5-9af5-a4bd981dadc6

UPDATE auth.users
SET
  email_confirmed_at = NOW(),
  confirmed_at = NOW()
WHERE id = '8b11b1c0-4c28-4fa5-9af5-a4bd981dadc6';

-- Verify the update
SELECT
  id,
  email,
  email_confirmed_at,
  confirmed_at,
  created_at
FROM auth.users
WHERE id = '8b11b1c0-4c28-4fa5-9af5-a4bd981dadc6';
