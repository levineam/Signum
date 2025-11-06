-- Verification Script for Security Warnings Remediation
-- Run this script AFTER applying 20251106000000_security_warnings_remediation.sql
-- Created: 2025-11-06

\echo '========================================================================'
\echo 'Security Warnings Remediation - Verification Report'
\echo '========================================================================'
\echo ''

-- ============================================================================
-- TEST 1: Verify all functions have search_path set
-- ============================================================================
\echo '1. CHECKING FUNCTION SEARCH_PATH CONFIGURATION'
\echo '------------------------------------------------'

SELECT
  p.proname AS function_name,
  CASE
    WHEN pg_get_functiondef(p.oid) LIKE '%SET search_path%' THEN '✅ FIXED'
    ELSE '❌ MISSING search_path'
  END AS status,
  pg_get_function_identity_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
  'update_updated_at_column',
  'increment_term_frequency',
  'increment_entity_centrality',
  'create_ontology_update_notification'
)
ORDER BY p.proname;

\echo ''
\echo 'Expected: All functions should show ✅ FIXED'
\echo ''

-- ============================================================================
-- TEST 2: Verify vector extension is in extensions schema
-- ============================================================================
\echo '2. CHECKING VECTOR EXTENSION SCHEMA'
\echo '-------------------------------------'

SELECT
  e.extname AS extension_name,
  n.nspname AS schema_name,
  CASE
    WHEN n.nspname = 'extensions' THEN '✅ CORRECT (extensions schema)'
    WHEN n.nspname = 'public' THEN '⚠️  WARNING (still in public schema)'
    ELSE '❓ UNKNOWN SCHEMA'
  END AS status
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE e.extname = 'vector';

\echo ''
\echo 'Expected: vector extension should be in "extensions" schema'
\echo ''

-- ============================================================================
-- TEST 3: Verify paragraph_embeddings table exists and is accessible
-- ============================================================================
\echo '3. CHECKING PARAGRAPH_EMBEDDINGS TABLE'
\echo '---------------------------------------'

SELECT
  t.tablename AS table_name,
  COUNT(c.column_name) AS column_count,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_attribute a
      JOIN pg_class cl ON a.attrelid = cl.oid
      JOIN pg_namespace n ON cl.relnamespace = n.oid
      WHERE n.nspname = 'public'
      AND cl.relname = 'paragraph_embeddings'
      AND a.attname = 'embedding'
    ) THEN '✅ TABLE EXISTS'
    ELSE '❌ TABLE MISSING'
  END AS status
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
AND t.table_name = 'paragraph_embeddings'
GROUP BY t.tablename;

\echo ''
\echo 'Expected: Table should exist with embedding column'
\echo ''

-- ============================================================================
-- TEST 4: Verify RLS policies on paragraph_embeddings
-- ============================================================================
\echo '4. CHECKING RLS POLICIES ON PARAGRAPH_EMBEDDINGS'
\echo '--------------------------------------------------'

SELECT
  tablename,
  policyname,
  roles::text AS applies_to,
  CASE
    WHEN cmd = '*' THEN 'ALL'
    ELSE cmd
  END AS operation
FROM pg_policies
WHERE tablename = 'paragraph_embeddings'
ORDER BY policyname;

\echo ''
\echo 'Expected: At least 2 policies (user access + service role)'
\echo ''

-- ============================================================================
-- TEST 5: Verify indexes on paragraph_embeddings
-- ============================================================================
\echo '5. CHECKING INDEXES ON PARAGRAPH_EMBEDDINGS'
\echo '---------------------------------------------'

SELECT
  indexname,
  indexdef,
  CASE
    WHEN indexdef LIKE '%ivfflat%' THEN '✅ Vector index (IVFFlat)'
    WHEN indexdef LIKE '%content_hash%' THEN '✅ Cache lookup index'
    ELSE '✅ Index exists'
  END AS index_type
FROM pg_indexes
WHERE tablename = 'paragraph_embeddings'
AND schemaname = 'public'
ORDER BY indexname;

\echo ''
\echo 'Expected: At least 2 indexes (vector + content_hash)'
\echo ''

-- ============================================================================
-- TEST 6: Verify function definitions contain search_path (detailed)
-- ============================================================================
\echo '6. DETAILED FUNCTION DEFINITIONS (search_path check)'
\echo '------------------------------------------------------'

DO $$
DECLARE
  func_def TEXT;
  func_name TEXT;
BEGIN
  FOR func_name IN
    SELECT proname
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND proname IN ('update_updated_at_column', 'increment_term_frequency', 'increment_entity_centrality')
  LOOP
    SELECT pg_get_functiondef(p.oid) INTO func_def
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = func_name
    LIMIT 1;

    RAISE NOTICE '';
    RAISE NOTICE 'Function: %', func_name;
    IF func_def LIKE '%SET search_path = public%' OR func_def LIKE '%SET search_path=public%' THEN
      RAISE NOTICE 'Status: ✅ search_path is set';
    ELSE
      RAISE NOTICE 'Status: ❌ search_path is MISSING';
    END IF;
  END LOOP;
END $$;

\echo ''

-- ============================================================================
-- TEST 7: Count total security issues remaining
-- ============================================================================
\echo '7. SUMMARY - REMAINING SECURITY ISSUES'
\echo '----------------------------------------'

WITH function_issues AS (
  SELECT COUNT(*) AS count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN (
    'update_updated_at_column',
    'increment_term_frequency',
    'increment_entity_centrality',
    'create_ontology_update_notification'
  )
  AND NOT (pg_get_functiondef(p.oid) LIKE '%SET search_path%')
),
extension_issues AS (
  SELECT COUNT(*) AS count
  FROM pg_extension e
  JOIN pg_namespace n ON e.extnamespace = n.oid
  WHERE e.extname = 'vector'
  AND n.nspname = 'public'
)
SELECT
  (SELECT count FROM function_issues) AS functions_missing_search_path,
  (SELECT count FROM extension_issues) AS extensions_in_public_schema,
  (SELECT count FROM function_issues) + (SELECT count FROM extension_issues) AS total_issues_remaining;

\echo ''
\echo 'Expected: total_issues_remaining = 0'
\echo ''
\echo '========================================================================'
\echo 'Verification Complete'
\echo '========================================================================'
\echo ''
\echo 'If all tests show ✅ FIXED/CORRECT, all 5 security warnings are resolved.'
\echo 'If any tests show ❌ or ⚠️, review the migration and re-apply if needed.'
\echo ''
