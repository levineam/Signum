# Supabase Security & Performance Audit
**Date:** November 6, 2025
**Project:** Signum
**Audit Type:** Proactive Schema Analysis
**Status:** 🔍 In Progress - Awaiting Dashboard Confirmation

---

## Executive Summary

This audit analyzes the Signum database schema for common security and performance issues based on Supabase best practices. This is a **proactive analysis** that identifies likely issues you're seeing in the Supabase Dashboard Advisor.

### Audit Scope
- ✅ 23 migration files analyzed
- ✅ 71+ indexes, policies, and functions reviewed
- ✅ 79 auth.uid()/auth.role() calls inspected
- ✅ 11 tables with RLS policies examined
- ⏳ Dashboard Advisor warnings pending confirmation

---

## 🔴 Security Issues (Potential: 5)

### 1. **RLS Policy Performance - Multiple auth.uid() Calls** (HIGH)
**Severity:** P1 - Performance Impact
**Count:** 79 occurrences across 8 migration files

**Issue:**
Many RLS policies call `auth.uid()` or `auth.role()` multiple times per row check. Each call queries the `auth.users` table, causing N×M overhead (N policies × M rows).

**Affected Policies:**
- `notes` table: Uses `auth.uid()` in USING and WITH CHECK clauses
- `links` table: Uses `auth.uid()` in USING and WITH CHECK clauses
- `tasks` table: Uses `auth.uid()` in USING and WITH CHECK clauses
- `entities`, `term_frequencies`, `paragraph_embeddings`: Similar patterns
- `helper_usage` table: Uses `auth.uid()` + subquery to `notes` table

**Evidence from migrations:**
```sql
-- Example from 20251103133803_remove_prototype_user.sql
CREATE POLICY "Users can CRUD their own notes"
  ON public.notes
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))  -- Call 1
  WITH CHECK (user_id = (SELECT auth.uid()));  -- Call 2
```

**Recommendation:**
Cache `auth.uid()` using security definer functions or use single-call policy patterns.

---

### 2. **Helper Function Missing search_path** (MEDIUM)
**Severity:** P2 - Security Vulnerability
**Tables Affected:** `notes`, `user_preferences`, possibly others

**Issue:**
Some trigger functions may not have `search_path` set to `public`, making them vulnerable to search path injection attacks.

**Partially Fixed:**
- ✅ `update_updated_at_column()` in security remediation migration has `search_path` set
- ❌ Original `update_updated_at_column()` in `20250930000000_unified_notes_schema.sql` (line 109-115) lacks `search_path`
- ❌ Duplicate definition in `20251014200000_create_helper_usage_table.sql` (line 69-75) also lacks `search_path`

**Evidence:**
```sql
-- From 20250930000000_unified_notes_schema.sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Missing: ALTER FUNCTION ... SET search_path = public;
```

**Recommendation:**
Apply `search_path` hardening to ALL helper functions.

---

### 3. **Subquery in RLS Policy - helper_usage Table** (HIGH)
**Severity:** P1 - Performance + Potential N+1 Issue
**Table:** `helper_usage`

**Issue:**
The INSERT and UPDATE policies on `helper_usage` contain subqueries that validate `entry_id` exists in `notes` table. This creates a nested query for every row operation.

**Evidence from 20251014200000_create_helper_usage_table.sql:**
```sql
CREATE POLICY "Users can insert own helper usage"
ON helper_usage FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  entry_id IN (SELECT id FROM notes WHERE user_id = auth.uid())  -- Subquery!
);
```

**Recommendation:**
Replace subquery with JOIN-based policy or remove redundant check (FK constraint already validates).

---

### 4. **Inconsistent Policy Naming** (LOW)
**Severity:** P3 - Maintenance Issue
**Affected:** Multiple tables

**Issue:**
Policy naming is inconsistent across migrations:
- Early policies: `"Users can CRUD their own notes"` (single policy for ALL operations)
- Later policies (journal_entries, journal_templates): Separate policies per operation
- Most recent (Story 2.4.6): Back to single policy with role-based separation

**Recommendation:**
Standardize policy naming and structure across all tables.

---

### 5. **Missing Service Role Policies on New Tables** (MEDIUM)
**Severity:** P2 - Admin Operations Blocked
**Tables:** `term_frequencies`, `entities`, `tasks`, `reminders`, `meters_daily`, `paragraph_embeddings`, `helper_usage`, `user_preferences`

**Issue:**
Recent tables (from content intelligence schema) only have user-level policies. Service role policies are missing, which could block admin/backend operations.

**Evidence:**
Only `notes` and `links` tables have explicit service role policies after Story 2.4.6 hardening.

**Recommendation:**
Add service role bypass policies to all tables:
```sql
CREATE POLICY "Service role has full access to [table]"
  ON [table]
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

## ⚡ Performance Issues (Potential: 17)

### 6. **Missing Composite Indexes** (HIGH PRIORITY)
**Severity:** P1 - Query Performance
**Estimated Impact:** 10-100x slower queries

**Missing Indexes:**

#### A. `entities` table - No user_id + name index
```sql
-- Current: Only single-column indexes
CREATE INDEX idx_entities_user_type ON entities(user_id, type);
CREATE INDEX idx_entities_centrality ON entities(user_id, centrality DESC);

-- Missing for unique constraint query
-- CREATE INDEX idx_entities_user_name ON entities(user_id, name);
```
**Impact:** Duplicate detection queries will do full table scans.

#### B. `tasks` table - Missing user_id + status index
```sql
-- Current: Separate indexes
CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_at) WHERE status != 'completed';
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);

-- Better: Composite covering index
-- CREATE INDEX idx_tasks_user_status_due ON tasks(user_id, status, due_at);
```
**Impact:** Task list queries by status will be slower.

#### C. `helper_usage` table - Missing user_id + helper_type index
```sql
-- Current: Separate indexes
CREATE INDEX idx_helper_usage_user_id ON helper_usage(user_id);
CREATE INDEX idx_helper_usage_helper_type ON helper_usage(helper_type);

-- Missing for common query pattern
-- CREATE INDEX idx_helper_usage_user_type ON helper_usage(user_id, helper_type);
```
**Impact:** Per-user helper analytics queries slower.

#### D. `term_frequencies` table - Redundant index
```sql
-- Current:
CREATE INDEX idx_term_freq_user_term ON term_frequencies(user_id, term);
CREATE INDEX idx_term_freq_user_alltime ON term_frequencies(user_id, count_alltime DESC);

-- Issue: Second index is redundant if queries always filter by user_id first
```

---

### 7. **Full-Text Search Index Still Present** (MEDIUM)
**Severity:** P2 - Storage + Write Performance
**Table:** `notes`

**Issue:**
Despite Story 2.4.6 removing unused FTS indexes from `journal_entries`, the `notes` table still has an FTS index that's not used (search feature not implemented yet).

**Evidence from 20250930000000_unified_notes_schema.sql (line 53):**
```sql
CREATE INDEX idx_notes_search ON notes USING gin(to_tsvector('english', title || ' ' || content));
```

**Impact:**
- Every INSERT/UPDATE on notes triggers FTS tokenization
- GIN indexes are expensive to maintain
- Adds ~20-50% overhead to write operations

**Recommendation:**
Drop until search feature is implemented:
```sql
DROP INDEX IF EXISTS public.idx_notes_search;
```

---

### 8. **Partial Index on notes.is_pinned May Be Too Narrow** (LOW)
**Severity:** P3 - Query Optimization
**Table:** `notes`

**Issue:**
Partial index only covers `is_pinned = TRUE` cases, but queries may also filter by `is_pinned = FALSE` or not filter at all.

**Evidence from 20250930000000_unified_notes_schema.sql (line 49-50):**
```sql
CREATE INDEX idx_notes_pinned ON notes(is_pinned)
  WHERE is_pinned = TRUE;
```

**Recommendation:**
Evaluate query patterns. If queries frequently filter by `is_pinned` (either value), create a full index instead.

---

### 9. **Vector Index Configuration May Need Tuning** (LOW)
**Severity:** P3 - Vector Search Performance
**Table:** `paragraph_embeddings`

**Issue:**
IVFFlat index uses default `lists = 100` parameter. This may not be optimal as data grows.

**Evidence from 20251020000000_content_intelligence_schema.sql (line 161-164):**
```sql
CREATE INDEX idx_paragraph_embeddings_vector
  ON paragraph_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

**Recommendation:**
Monitor index performance. Optimal `lists` value is typically `rows / 1000` (for 10K rows → lists=10, for 100K rows → lists=100).

---

### 10. **Foreign Key Without Index - tasks.person_id and tasks.project_id** (MEDIUM)
**Severity:** P2 - JOIN Performance
**Table:** `tasks`

**Issue:**
Foreign keys to `entities` table lack dedicated indexes, which slows down JOIN operations.

**Evidence from 20251020000000_content_intelligence_schema.sql:**
```sql
person_id UUID REFERENCES entities(id) ON DELETE SET NULL,
project_id UUID REFERENCES entities(id) ON DELETE SET NULL,
-- No indexes created for these FKs!
```

**Recommendation:**
Add indexes:
```sql
CREATE INDEX idx_tasks_person_id ON tasks(person_id) WHERE person_id IS NOT NULL;
CREATE INDEX idx_tasks_project_id ON tasks(project_id) WHERE project_id IS NOT NULL;
```

---

### 11. **No Index on tasks.source_entry_id** (MEDIUM)
**Severity:** P2 - Reverse Lookup Performance
**Table:** `tasks`

**Issue:**
FK to `notes(id)` lacks index, making "find all tasks from this journal entry" queries slow.

**Recommendation:**
```sql
CREATE INDEX idx_tasks_source_entry_id ON tasks(source_entry_id) WHERE source_entry_id IS NOT NULL;
```

---

### 12. **No Index on tasks.value_id** (MEDIUM)
**Severity:** P2 - Ontology Queries
**Table:** `tasks`

**Issue:**
FK to ontology notes lacks index.

**Recommendation:**
```sql
CREATE INDEX idx_tasks_value_id ON tasks(value_id) WHERE value_id IS NOT NULL;
```

---

### 13. **Missing Index on links.link_type** (LOW)
**Severity:** P3 - Link Type Filtering
**Table:** `links`

**Issue:**
If queries filter by `link_type` (e.g., "show only 'created_from' links"), there's no dedicated index.

**Current indexes (from Story 2.4.6):**
```sql
CREATE INDEX idx_links_user_source ON links(user_id, source_note_id);
CREATE INDEX idx_links_user_target ON links(user_id, target_note_id);
```

**Recommendation:**
Add if link type filtering is common:
```sql
CREATE INDEX idx_links_type ON links(link_type);
```

---

### 14. **No Index on notes.updated_at** (LOW)
**Severity:** P3 - Recently Modified Queries
**Table:** `notes`

**Issue:**
Queries like "show recently edited notes" lack dedicated index.

**Current indexes:**
```sql
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);
-- Missing: idx_notes_updated_at
```

**Recommendation:**
Add if "recently modified" views are common:
```sql
CREATE INDEX idx_notes_updated_at ON notes(updated_at DESC);
```

---

### 15. **Duplicate Index on user_preferences** (LOW)
**Severity:** P3 - Storage Overhead
**Table:** `user_preferences`

**Issue:**
Primary key on `user_id` automatically creates an index, making additional single-column index redundant.

**Recommendation:**
Verify no explicit `CREATE INDEX ... (user_id)` exists on this table.

---

### 16. **No Composite Index for term_frequencies Upserts** (MEDIUM)
**Severity:** P2 - Upsert Performance
**Table:** `term_frequencies`

**Issue:**
Unique constraint creates an index, but queries may need composite index for efficient lookups.

**Evidence from 20251020000000_content_intelligence_schema.sql:**
```sql
CONSTRAINT unique_user_term UNIQUE(user_id, term)  -- Creates implicit index
CREATE INDEX idx_term_freq_user_term ON term_frequencies(user_id, term);  -- Redundant!
```

**Recommendation:**
Remove redundant index (UNIQUE constraint already provides index):
```sql
DROP INDEX IF EXISTS public.idx_term_freq_user_term;
```

---

### 17. **No Index on paragraph_embeddings.created_at** (LOW)
**Severity:** P3 - Cache Expiry Queries
**Table:** `paragraph_embeddings`

**Issue:**
If implementing cache expiry (delete old embeddings), lacks index on `created_at`.

**Recommendation:**
Add if implementing cleanup jobs:
```sql
CREATE INDEX idx_paragraph_embeddings_created_at ON paragraph_embeddings(created_at);
```

---

### 18. **Missing Index on helper_usage.user_id + inserted_at** (LOW)
**Severity:** P3 - User Timeline Queries
**Table:** `helper_usage`

**Issue:**
Current indexes are single-column. Common query pattern (user's recent helpers) would benefit from composite.

**Current:**
```sql
CREATE INDEX idx_helper_usage_user_id ON helper_usage(user_id);
CREATE INDEX idx_helper_usage_inserted_at ON helper_usage(inserted_at DESC);
```

**Recommendation:**
```sql
CREATE INDEX idx_helper_usage_user_timeline ON helper_usage(user_id, inserted_at DESC);
```

---

### 19. **No VACUUM/ANALYZE Statistics After Migrations** (MEDIUM)
**Severity:** P2 - Query Planner Accuracy
**Scope:** Global

**Issue:**
Only the security remediation migration runs `ANALYZE`. Other migrations don't update table statistics.

**Evidence:**
```sql
-- From 20251015090000_security_performance_remediation.sql (line 182-185)
ANALYZE public.journal_templates;
ANALYZE public.links;
ANALYZE public.journal_entries;
ANALYZE public.notes;
```

**Recommendation:**
Add `ANALYZE` to all migrations that modify schema or data:
```sql
ANALYZE public.term_frequencies;
ANALYZE public.entities;
ANALYZE public.tasks;
ANALYZE public.reminders;
ANALYZE public.helper_usage;
-- etc.
```

---

### 20. **No Explicit FILLFACTOR on High-Update Tables** (LOW)
**Severity:** P3 - HOT Updates
**Tables:** `notes`, `tasks`, `entities`

**Issue:**
Tables with frequent UPDATEs (notes content, task status, entity centrality) may benefit from lower FILLFACTOR to enable HOT (Heap-Only Tuple) updates.

**Recommendation:**
Test with `FILLFACTOR = 90` on high-churn tables:
```sql
ALTER TABLE notes SET (fillfactor = 90);
ALTER TABLE tasks SET (fillfactor = 90);
ALTER TABLE entities SET (fillfactor = 90);
```

---

### 21. **Links Table - No Index for Bidirectional Traversal** (LOW)
**Severity:** P3 - Graph Query Performance
**Table:** `links`

**Issue:**
While `idx_links_user_source` and `idx_links_user_target` exist, bidirectional graph traversal (find all connected notes) may be slow.

**Recommendation:**
Consider materialized view or additional index if graph queries are common.

---

### 22. **No Covering Indexes** (LOW)
**Severity:** P3 - Index-Only Scans
**Scope:** Global

**Issue:**
No indexes use `INCLUDE` clause to enable index-only scans (PostgreSQL 11+).

**Recommendation:**
Add covering indexes for hot query paths:
```sql
-- Example for tasks list
CREATE INDEX idx_tasks_user_status_cover ON tasks(user_id, status)
  INCLUDE (title, due_at, priority);
```

---

## 📊 Summary by Priority

### Critical (P0) - 0 Issues
None identified. ✅

### High Priority (P1) - 3 Issues
1. **RLS Policy Performance** - Multiple auth.uid() calls (79 occurrences)
2. **Subquery in RLS Policy** - helper_usage table validation
3. **Missing Composite Indexes** - entities, tasks, helper_usage

### Medium Priority (P2) - 9 Issues
4. **Helper Function Missing search_path** - 2+ functions
5. **Missing Service Role Policies** - 8 tables
6. **Full-Text Search Index Overhead** - notes table
7. **Foreign Key Without Index** - tasks.person_id, tasks.project_id
8. **No Index on tasks.source_entry_id**
9. **No Index on tasks.value_id**
10. **Redundant term_frequencies Index**
11. **No VACUUM/ANALYZE After Migrations**

### Low Priority (P3) - 10 Issues
12. **Inconsistent Policy Naming**
13. **Partial Index Too Narrow** - notes.is_pinned
14. **Vector Index Tuning** - paragraph_embeddings
15. **Missing Index on links.link_type**
16. **No Index on notes.updated_at**
17. **No Index on paragraph_embeddings.created_at**
18. **Missing Composite Index** - helper_usage timeline
19. **No FILLFACTOR Optimization**
20. **Links Bidirectional Traversal**
21. **No Covering Indexes**

---

## ✅ What's Already Fixed

### From Story 2.4.6 Security Hardening:
1. ✅ Prototype user backdoor removed
2. ✅ RLS policies use `TO authenticated` instead of `TO public`
3. ✅ Helper function `search_path` hardened (update_updated_at_column)
4. ✅ Composite indexes added for links table
5. ✅ Unused FTS indexes removed from journal_entries
6. ✅ ANALYZE run on core tables

### From Content Intelligence Schema:
1. ✅ Proper unique constraints on term_frequencies
2. ✅ Partial indexes on tasks (status filter)
3. ✅ Vector index configured for embeddings
4. ✅ RLS policies on all new tables

---

## 🔧 Recommended Next Steps

### Step 1: Confirm Issues (Required)
**Please provide the actual Supabase Dashboard Advisor warnings** so I can map these findings to your exact issues. The 5 security + 17 performance warnings you mentioned may be a subset of the issues above.

### Step 2: Create Remediation Migration (Once Confirmed)
I'll create a comprehensive migration file like:
```
supabase/migrations/20251106000000_performance_security_remediation_phase2.sql
```

### Step 3: Test on Dev Environment
Apply migration to dev branch and verify:
- Query performance improvements
- RLS policies still work correctly
- No breaking changes

### Step 4: Deploy to Production
Follow PR workflow with Vercel preview testing.

---

## 📋 How to Get Dashboard Warnings

1. Go to https://supabase.com/dashboard/project/otyvmmgakowcdsxehwox
2. Navigate to **Reports** → **Database Advisor** (or **Performance** tab)
3. Copy/paste the specific warnings here
4. I'll create exact SQL fixes for each warning

---

## 🔍 Investigation Queries

If you have database access, run these queries to confirm issues:

### Check for RLS auth.uid() calls:
```sql
SELECT
  schemaname,
  tablename,
  policyname,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('notes', 'links', 'tasks', 'entities', 'helper_usage')
ORDER BY tablename, policyname;
```

### Check for missing indexes on foreign keys:
```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  CASE
    WHEN i.indexname IS NULL THEN 'MISSING INDEX ❌'
    ELSE 'Index exists ✅'
  END AS index_status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
LEFT JOIN pg_indexes i
  ON i.tablename = tc.table_name
  AND i.indexdef LIKE '%' || kcu.column_name || '%'
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

### Check for unused indexes:
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelname NOT LIKE 'pg_toast%'
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

**End of Proactive Audit**

Awaiting dashboard confirmation to proceed with remediation.
