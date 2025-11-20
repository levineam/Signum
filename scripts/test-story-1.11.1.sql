-- Test Script for Story 1.11.1: Fix Database Function Security (search_path)
-- Purpose: Verify functions have explicit search_path set and work correctly
-- Story: #179
-- Epic: 1.11 - Database Security & Performance Optimization

-- ============================================================================
-- PART 1: Verify function definitions include search_path
-- ============================================================================

\echo '=== Checking increment_entity_centrality function definition ==='
\df+ increment_entity_centrality

\echo ''
\echo '=== Checking increment_term_frequency function definition ==='
\df+ increment_term_frequency

\echo ''
\echo 'Expected: Both functions should show "SET search_path = public" in their definitions'
\echo ''

-- ============================================================================
-- PART 2: Test entity centrality tracking
-- ============================================================================

\echo '=== Testing entity centrality increment ==='

-- Create test entity (if not exists)
INSERT INTO entities (id, user_id, entity_name, entity_type, centrality)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  (SELECT id FROM auth.users LIMIT 1),
  'Test Entity',
  'concept',
  0
)
ON CONFLICT (id) DO NOTHING;

-- Get current centrality
SELECT id, entity_name, centrality
FROM entities
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

-- Increment centrality
SELECT increment_entity_centrality('00000000-0000-0000-0000-000000000001'::uuid, 1);

-- Verify increment worked
SELECT id, entity_name, centrality
FROM entities
WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

\echo 'Expected: Centrality should have incremented by 1'
\echo ''

-- ============================================================================
-- PART 3: Test term frequency tracking
-- ============================================================================

\echo '=== Testing term frequency increment ==='

SELECT id AS test_user_id FROM auth.users LIMIT 1 \gset

-- Check current frequency for test term
SELECT user_id, term, period, frequency
FROM term_frequencies
WHERE user_id = :test_user_id::uuid
AND term = 'test'
AND period = 'all_time';

-- Increment term frequency
SELECT increment_term_frequency(
  :test_user_id::uuid,
  'test',
  CURRENT_DATE,
  'all_time'
);

-- Verify increment worked
SELECT user_id, term, period, frequency
FROM term_frequencies
WHERE user_id = :test_user_id::uuid
AND term = 'test'
AND period = 'all_time';

\echo 'Expected: Frequency should have incremented by 1'
\echo ''

-- ============================================================================
-- PART 4: Verify no PostgreSQL errors
-- ============================================================================

\echo '=== Checking PostgreSQL error log ==='
\echo 'If no errors appeared above, functions are working correctly'
\echo ''

-- ============================================================================
-- CLEANUP (optional)
-- ============================================================================

-- Uncomment to clean up test data:
-- DELETE FROM entities WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
-- DELETE FROM term_frequencies WHERE user_id = :test_user_id::uuid AND term = 'test';

\echo '=== Story 1.11.1 Test Complete ==='
\echo ''
\echo 'Acceptance Criteria Checklist:'
\echo '[ ] Both functions show SET search_path = public in \df+ output'
\echo '[ ] increment_entity_centrality executes without errors'
\echo '[ ] increment_term_frequency executes without errors'
\echo '[ ] Entity centrality incremented correctly'
\echo '[ ] Term frequency incremented correctly'
\echo '[ ] No PostgreSQL errors in output'
\echo ''
\echo 'Next: Run Supabase Database Linter and verify 0 warnings for lint 0011_function_search_path_mutable'
