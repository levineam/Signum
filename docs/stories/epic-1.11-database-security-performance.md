# Epic 1.11: Database Security & Performance Optimization

**Epic ID**: 1.11
**Epic Type**: Brownfield Enhancement (Infrastructure)
**Parent Epic**: Epic 1 (Foundation & Infrastructure)
**Related Issue**: [#177 - Database Security & Performance Issues](https://github.com/levineam/Signum/issues/177)
**Status**: ✅ Ready for Implementation
**Estimated Duration**: 10-16 hours (3 stories)
**Created**: November 12, 2025
**Priority**: HIGH (2 security vulnerabilities)

---

## Epic Goal

Address 2 critical security vulnerabilities and 21 performance issues identified by Supabase Database Linter to improve database security posture and query performance.

---

## Epic Description

### Existing System Context

**Current Database State:**
- **Functions**: 2 functions with mutable search_path (security vulnerability)
- **Foreign Keys**: 5 foreign key constraints without covering indexes (performance issue)
- **Indexes**: 16 unused indexes consuming storage and slowing writes

**Technology Stack:**
- PostgreSQL 17 (Supabase)
- Row Level Security (RLS) policies
- Database migrations via `supabase/migrations/`
- Supabase Database Linter for health checks

**Integration Points:**
1. **Database Functions**: `increment_entity_centrality`, `increment_term_frequency`
2. **Tables**: `links`, `tasks`, `entities`, `reminders`, `meters_daily`, `term_frequencies`, `paragraph_embeddings`, `journal_entries`, `journal_templates`, `ontology_updates`
3. **Query Performance**: JOIN operations, foreign key lookups
4. **Write Performance**: INSERT/UPDATE/DELETE operations affected by unused indexes

### Enhancement Details

**What's Being Fixed:**

#### Security Issues (CRITICAL)
**2 Functions with Mutable search_path**
- Risk: Privilege escalation, unexpected behavior via search_path manipulation
- Impact: Could allow attackers to inject malicious functions
- Fix: Set explicit `search_path` in function definitions

#### Performance Issues (HIGH/MEDIUM)
**5 Unindexed Foreign Keys**
- Risk: Table scans during JOINs, slow CASCADE operations
- Impact: Query performance degradation as data grows
- Fix: Add covering indexes on foreign key columns

**16 Unused Indexes**
- Risk: Wasted storage, slower write operations
- Impact: 16 indexes × (storage + write overhead) with zero benefit
- Fix: Safely remove after verification

**How It Integrates:**

1. **Security Integration**: Functions called by application code continue to work with explicit search_path
2. **Performance Integration**: Indexes improve existing queries without code changes
3. **Migration Integration**: Standard Supabase migration process
4. **Monitoring Integration**: Supabase Dashboard linter validates fixes

**Success Criteria:**

1. ✅ 2 functions have explicit search_path set (security fixed)
2. ✅ 5 foreign key indexes created (query performance improved)
3. ✅ 16 unused indexes removed (write performance improved, storage reduced)
4. ✅ Supabase Database Linter shows 0 warnings for these issues
5. ✅ No query performance regressions detected
6. ✅ All migrations run successfully on dev environment
7. ✅ Existing application functionality unchanged

---

## Stories

This epic consists of 3 sequential stories:

### Story 1.11.1: Fix Database Function Security (search_path) - 2-4 hours

**Goal**: Fix mutable search_path security vulnerabilities in database functions.

**Priority**: 🔴 CRITICAL

**Scope**:
- Fix `public.increment_entity_centrality` function
- Fix `public.increment_term_frequency` function
- Set explicit `search_path = public` in both functions
- Create migration file
- Test functions still work correctly

**Deliverables**:
- Migration: `supabase/migrations/[timestamp]_fix_function_search_path.sql`
- 2 functions updated with `SET search_path = public`
- Linter verification report: `docs/analysis/linter-story-1.11.1-[date].md`
  - Must include: Screenshot of Supabase linter showing 0 search_path warnings
  - Must include: Before/after comparison from linter CSV export
  - Owner: Story implementer

**Dependencies**: None (can start immediately)

**Acceptance Criteria**:
- ✅ Given migration runs successfully, when `\df+ increment_entity_centrality` executes, then function shows `SET search_path = public`
- ✅ Given migration runs successfully, when `\df+ increment_term_frequency` executes, then function shows `SET search_path = public`
- ✅ Given functions updated, when Supabase Database Linter runs, then reports 0 warnings for lint `0011_function_search_path_mutable`
- ✅ Given functions updated, when entity centrality is incremented via application, then operation succeeds without errors
- ✅ Given functions updated, when term frequency is incremented via application, then operation succeeds without errors

**Testing**:
**Environment**: Local dev database (`supabase db reset`)

**Test Script**: `scripts/test-story-1.11.1.sql`
```sql
-- Verify function definitions include search_path
\df+ increment_entity_centrality
\df+ increment_term_frequency

-- Test entity centrality tracking
SELECT increment_entity_centrality('test-entity-id'::uuid, 1);
SELECT centrality FROM entities WHERE id = 'test-entity-id'::uuid;

-- Test term frequency tracking
SELECT increment_term_frequency('test-user-id'::uuid, 'test', '2025-11-12'::date, 'all_time');
SELECT frequency FROM term_frequencies WHERE user_id = 'test-user-id'::uuid AND term = 'test';
```

**Expected Results**:
- Both functions return without errors
- Entity centrality increments by 1
- Term frequency increments correctly
- No PostgreSQL errors logged

**Linter Verification**:
```bash
# Run linter in Supabase Dashboard → Database → Linter
# Export results to CSV
# Verify: search_path warnings = 0
```

**GitHub Issue**: [#179](https://github.com/levineam/Signum/issues/179)

---

### Story 1.11.2: Add Missing Foreign Key Indexes - 4-6 hours

**Goal**: Add covering indexes for foreign key constraints to improve query performance.

**Priority**: 🟠 HIGH

**Scope**:
- Add index on `links.target_note_id`
- Add index on `tasks.person_id`
- Add index on `tasks.project_id`
- Add index on `tasks.source_entry_id`
- Add index on `tasks.value_id`
- Test query performance before/after
- Monitor index usage

**Deliverables**:
- Migration: `supabase/migrations/[timestamp]_add_foreign_key_indexes.sql`
- 5 indexes created (1 for links, 4 for tasks)
- Query performance report: `docs/analysis/perf-story-1.11.2-[date].md`
  - Must include: EXPLAIN ANALYZE before/after for all 5 test queries
  - Must include: Execution time deltas (ms), Seq Scan → Index Scan confirmations
  - Must include: `pg_stat_user_indexes` snapshots showing idx_scan > 0 after test load
  - Owner: Story implementer
- Linter verification report: `docs/analysis/linter-story-1.11.2-[date].md`
  - Must include: Screenshot showing 0 unindexed foreign key warnings
  - Owner: Story implementer

**Dependencies**: Story 1.11.1 (security fixes first)

**Acceptance Criteria**:
- ✅ Given migration runs, when `\di idx_links_target_note_id` executes, then index exists on `links(target_note_id)`
- ✅ Given migration runs, when `\di idx_tasks_person_id` executes, then index exists on `tasks(person_id)`
- ✅ Given migration runs, when `\di idx_tasks_project_id` executes, then index exists on `tasks(project_id)`
- ✅ Given migration runs, when `\di idx_tasks_source_entry_id` executes, then index exists on `tasks(source_entry_id)`
- ✅ Given migration runs, when `\di idx_tasks_value_id` executes, then index exists on `tasks(value_id)`
- ✅ Given indexes added, when Supabase Linter runs, then reports 0 warnings for lint `0001_unindexed_foreign_keys`
- ✅ Given test queries execute, when EXPLAIN ANALYZE runs, then all 5 queries use Index Scan (not Seq Scan)
- ✅ Given test load applied, when `pg_stat_user_indexes` queried, then all 5 new indexes show `idx_scan > 0`
- ✅ Given indexes added, when comparing before/after execution times, then no query regressed by >10%

**Testing**:
**Environment**: Local Supabase database reset with current migrations (`supabase db reset`).
  - This command recreates the database, runs all migrations, and loads any seed SQL embedded in the migrations.
  - If additional fixture data is required, create it using the provided test scripts (e.g., inserts in `scripts/test-story-1.11.2-before.sql`).

**Pre-Migration Baseline** (`scripts/test-story-1.11.2-before.sql`):
```sql
-- Capture BEFORE metrics
\timing on

-- Query 1: links JOIN notes
EXPLAIN ANALYZE
SELECT l.*, n.title FROM links l
JOIN notes n ON l.target_note_id = n.id
WHERE l.user_id = 'test-user-id'::uuid
LIMIT 100;

-- Query 2: tasks JOIN entities (person)
EXPLAIN ANALYZE
SELECT t.*, e.entity_name FROM tasks t
JOIN entities e ON t.person_id = e.id
WHERE t.user_id = 'test-user-id'::uuid
LIMIT 100;

-- Query 3: tasks JOIN entities (project)
EXPLAIN ANALYZE
SELECT t.*, e.entity_name FROM tasks t
JOIN entities e ON t.project_id = e.id
WHERE t.user_id = 'test-user-id'::uuid
LIMIT 100;

-- Query 4: tasks JOIN journal_entries (source)
EXPLAIN ANALYZE
SELECT t.*, j.content FROM tasks t
JOIN journal_entries j ON t.source_entry_id = j.id
WHERE t.user_id = 'test-user-id'::uuid
LIMIT 100;

-- Query 5: tasks JOIN entities (value)
EXPLAIN ANALYZE
SELECT t.*, e.entity_name FROM tasks t
JOIN entities e ON t.value_id = e.id
WHERE t.user_id = 'test-user-id'::uuid
LIMIT 100;
```

**Post-Migration Verification** (`scripts/test-story-1.11.2-after.sql`):
```sql
-- Run same queries as before, compare EXPLAIN plans
-- Expected: Seq Scan → Index Scan on all foreign key columns
-- Expected: Execution time ≤ baseline (or improved)

-- Verify index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE indexname IN (
  'idx_links_target_note_id',
  'idx_tasks_person_id',
  'idx_tasks_project_id',
  'idx_tasks_source_entry_id',
  'idx_tasks_value_id'
)
ORDER BY indexname;
-- Expected: idx_scan > 0 for all indexes after running test queries
```

**Performance Thresholds**:
- **Index Scan**: All 5 queries must use Index Scan (not Seq Scan)
- **Execution Time**: No query regression >10% from baseline
- **Index Usage**: All 5 indexes show `idx_scan > 0` after test load

**GitHub Issue**: [#180](https://github.com/levineam/Signum/issues/180)

---

### Story 1.11.3: Clean Up Unused Database Indexes - 4-6 hours

**Goal**: Remove unused indexes to reduce storage overhead and improve write performance.

**Priority**: 🟡 MEDIUM

**Scope**:
- Verify 16 indexes are truly unused (`pg_stat_user_indexes`)
- Create comprehensive removal migration
- Test query performance (ensure no regressions)
- Remove these specific indexes (from Supabase Linter report):

| # | Table | Index Name | Column(s) | Reason |
|---|-------|------------|-----------|--------|
| 1 | helper_usage | idx_helper_usage_helper_type | helper_type | idx_scan = 0 |
| 2 | tasks | idx_tasks_user_due | (user_id, due_at) | idx_scan = 0 |
| 3 | tasks | idx_tasks_is_query | is_query | idx_scan = 0 |
| 4 | entities | idx_entities_user_type | (user_id, entity_type) | idx_scan = 0 |
| 5 | entities | idx_entities_centrality | centrality | idx_scan = 0 |
| 6 | reminders | idx_reminders_user | user_id | idx_scan = 0 |
| 7 | meters_daily | idx_meters_daily_user_date | (user_id, date) | idx_scan = 0 |
| 8 | term_frequencies | idx_term_freq_user_term | (user_id, term) | idx_scan = 0 |
| 9 | term_frequencies | idx_term_freq_user_alltime | (user_id, period='all_time') | idx_scan = 0 |
| 10 | paragraph_embeddings | idx_paragraph_embeddings_vector | vector | idx_scan = 0 |
| 11 | paragraph_embeddings | idx_paragraph_embeddings_hash | content_hash | idx_scan = 0 |
| 12 | journal_entries | idx_journal_entries_created_at | created_at | idx_scan = 0 |
| 13 | journal_templates | idx_journal_templates_user_id | user_id | idx_scan = 0 |
| 14 | links | idx_links_user | user_id | idx_scan = 0 |
| 15 | links | idx_links_user_source | (user_id, source_note_id) | idx_scan = 0 |
| 16 | ontology_updates | idx_ontology_updates_created | created_at | idx_scan = 0 |

**Deliverables**:
- Index usage report: `docs/analysis/unused-indexes-report-story-1.11.3-[date].md`
  - Must include: Full `pg_stat_user_indexes` output for all 16 indexes (showing idx_scan = 0)
  - Must include: Usage window confirmation (e.g., "verified unused over 30-day production period")
  - Must include: Table showing each index with table, columns, size_bytes, idx_scan, idx_tup_read
  - Owner: Story implementer
- Migration: `supabase/migrations/[timestamp]_drop_unused_indexes.sql`
- Query performance report: `docs/analysis/perf-story-1.11.3-[date].md`
  - Must include: EXPLAIN ANALYZE before/after for 10 representative queries (one per affected table)
  - Must include: Confirmation that no query plan changed from Index Scan → Seq Scan
  - Must include: Execution time deltas (no regression >10%)
  - Owner: Story implementer
- Linter verification report: `docs/analysis/linter-story-1.11.3-[date].md`
  - Must include: Screenshot showing 0 unused index warnings
  - Owner: Story implementer

**Dependencies**: Story 1.11.2 (add needed indexes first)

**Acceptance Criteria**:
- ✅ Given `pg_stat_user_indexes` queried, when filtering for 16 target indexes, then all show `idx_scan = 0` over representative window (≥7 days)
- ✅ Given migration runs, when `\di [index_name]` executes for each of 16 indexes, then all return "Did not find any relation"
- ✅ Given migration runs, when Supabase Linter runs, then reports 0 warnings for lint `0005_unused_index`
- ✅ Given test queries execute, when EXPLAIN ANALYZE compares before/after, then no query changed from Index Scan → Seq Scan
- ✅ Given test queries execute, when comparing execution times, then no query regressed by >10%
- ✅ Given migration runs, when application smoke tests execute, then all features work without errors

**Testing**:
**Environment**: Local Supabase database reset with current migrations (`supabase db reset`).
  - This ensures a clean slate and loads all schema/data defined in migrations.
  - Populate any extra helper data using the verification scripts in this story before running performance comparisons.

**Step 1: Verify Unused** (`scripts/test-story-1.11.3-verify-unused.sql`):
```sql
-- Confirm indexes are unused
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE indexname IN (
  'idx_helper_usage_helper_type',
  'idx_tasks_user_due',
  'idx_tasks_is_query',
  'idx_entities_user_type',
  'idx_entities_centrality',
  'idx_reminders_user',
  'idx_meters_daily_user_date',
  'idx_term_freq_user_term',
  'idx_term_freq_user_alltime',
  'idx_paragraph_embeddings_vector',
  'idx_paragraph_embeddings_hash',
  'idx_journal_entries_created_at',
  'idx_journal_templates_user_id',
  'idx_links_user',
  'idx_links_user_source',
  'idx_ontology_updates_created'
)
ORDER BY tablename, indexname;
-- Expected: All 16 indexes show idx_scan = 0
-- Expected: Total size = sum of all index sizes (storage to be reclaimed)
```

**Step 2: Pre-Migration Baseline** (`scripts/test-story-1.11.3-before.sql`):
```sql
\timing on

-- Query 1: helper_usage by type
EXPLAIN ANALYZE SELECT * FROM helper_usage WHERE helper_type = 'gratitude' LIMIT 100;

-- Query 2: tasks by user and due date
EXPLAIN ANALYZE SELECT * FROM tasks WHERE user_id = 'test-user-id'::uuid AND due_at < NOW() LIMIT 100;

-- Query 3: entities by user and type
EXPLAIN ANALYZE SELECT * FROM entities WHERE user_id = 'test-user-id'::uuid AND entity_type = 'person' LIMIT 100;

-- Query 4: reminders by user
EXPLAIN ANALYZE SELECT * FROM reminders WHERE user_id = 'test-user-id'::uuid LIMIT 100;

-- Query 5: meters_daily by user and date
EXPLAIN ANALYZE SELECT * FROM meters_daily WHERE user_id = 'test-user-id'::uuid AND date = CURRENT_DATE;

-- Query 6: term_frequencies by user and term
EXPLAIN ANALYZE SELECT * FROM term_frequencies WHERE user_id = 'test-user-id'::uuid AND term = 'test' LIMIT 100;

-- Query 7: paragraph_embeddings by hash
EXPLAIN ANALYZE SELECT * FROM paragraph_embeddings WHERE content_hash = 'test-hash' LIMIT 1;

-- Query 8: journal_entries by created_at
EXPLAIN ANALYZE SELECT * FROM journal_entries WHERE user_id = 'test-user-id'::uuid ORDER BY created_at DESC LIMIT 50;

-- Query 9: links by user
EXPLAIN ANALYZE SELECT * FROM links WHERE user_id = 'test-user-id'::uuid LIMIT 100;

-- Query 10: ontology_updates by created
EXPLAIN ANALYZE SELECT * FROM ontology_updates WHERE user_id = 'test-user-id'::uuid ORDER BY created_at DESC LIMIT 50;

-- Capture all EXPLAIN plans and execution times
```

**Step 3: Post-Migration Verification** (`scripts/test-story-1.11.3-after.sql`):
```sql
-- Run same 10 queries, compare EXPLAIN plans
-- Expected: Same query plans (no Index Scan → Seq Scan regressions)
-- Expected: Execution times ≤ baseline + 10%

-- Verify indexes dropped
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
AND indexname IN (
  'idx_helper_usage_helper_type',
  'idx_tasks_user_due',
  'idx_tasks_is_query',
  'idx_entities_user_type',
  'idx_entities_centrality',
  'idx_reminders_user',
  'idx_meters_daily_user_date',
  'idx_term_freq_user_term',
  'idx_term_freq_user_alltime',
  'idx_paragraph_embeddings_vector',
  'idx_paragraph_embeddings_hash',
  'idx_journal_entries_created_at',
  'idx_journal_templates_user_id',
  'idx_links_user',
  'idx_links_user_source',
  'idx_ontology_updates_created'
);
-- Expected: 0 rows (all indexes dropped)
```

**Step 4: Application Smoke Test**:
```bash
# Run application locally
npm run dev

# Manual testing checklist:
# [ ] Create journal entry → success
# [ ] Create helper (gratitude) → success
# [ ] View ontology page → success
# [ ] Search notes → success
# [ ] View term frequencies → success
# [ ] No console errors
```

**Performance Thresholds**:
- **Query Plans**: No query changed from Index Scan → Seq Scan
- **Execution Time**: No query regression >10% from baseline
- **Application**: All smoke tests pass

**GitHub Issue**: [#181](https://github.com/levineam/Signum/issues/181)

---

## Compatibility Requirements

### Database Compatibility
- ✅ Migrations follow Supabase migration conventions
- ✅ Functions maintain same signatures (no API changes)
- ✅ Indexes added/removed without downtime
- ✅ RLS policies unaffected

### Application Compatibility
- ✅ No code changes required (pure database optimization)
- ✅ Existing queries continue to work
- ✅ Function calls continue to work
- ✅ No breaking changes to application logic

### Performance Compatibility
- ✅ Query performance improved (foreign key indexes added)
- ✅ Write performance improved (unused indexes removed)
- ✅ Storage reduced (16 indexes removed)
- ✅ No performance regressions detected

### Security Compatibility
- ✅ Functions hardened against search_path attacks
- ✅ RLS policies continue to enforce access control
- ✅ No new security vulnerabilities introduced

---

## Risk Mitigation

### Primary Risk: Query Performance Regression - MEDIUM

**Risk Description**: Removing unused indexes might break queries we didn't test.

**Likelihood**: Low (indexes marked "unused" by Supabase)

**Impact**: Medium (query slowdowns, user experience degradation)

**Mitigation**:
1. **Verify Usage First**: Check `pg_stat_user_indexes` for actual usage
2. **Test Representative Queries**: EXPLAIN ANALYZE on common query patterns
3. **Gradual Rollout**: Deploy to dev → test thoroughly → deploy to prod
4. **Monitor Performance**: Watch query execution times after deployment
5. **Document Rollback**: Keep migration files to recreate indexes if needed

**Operational Rollback Runbook** (Story 1.11.3):

**Detection**: Query execution time increased >20% or Seq Scan appears where Index Scan expected

**Step 1: Identify Affected Index**
```sql
-- Find slow queries in Supabase Dashboard → Database → Query Performance
-- OR check pg_stat_statements
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > [baseline + 20%]
ORDER BY mean_exec_time DESC LIMIT 10;
```

**Step 2: Quick Rollback (Recreate Index)**
```bash
# Connect to database
supabase db connect

# Create emergency rollback migration
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_rollback_index_[name].sql << 'EOF'
-- Emergency rollback: Recreate [index_name]
-- Reason: Query performance regression detected
-- Affected query: [paste query from step 1]

CREATE INDEX CONCURRENTLY idx_[name] ON [table]([column]);

-- Verify index created
SELECT indexname, tablename FROM pg_indexes
WHERE indexname = 'idx_[name]';
EOF

# Apply migration (CONCURRENTLY = no table lock)
supabase db push
```

**Step 3: Verify Fix**
```sql
-- Confirm index exists
\di idx_[name]

-- Re-run slow query with EXPLAIN ANALYZE
EXPLAIN ANALYZE [paste query];
-- Expected: Index Scan on idx_[name], execution time back to baseline

-- Monitor for 10 minutes
SELECT query, mean_exec_time FROM pg_stat_statements
WHERE query LIKE '%[affected_table]%'
ORDER BY mean_exec_time DESC LIMIT 5;
```

**Step 4: Update Documentation**
```bash
# Document why index was restored
echo "Index idx_[name] restored due to query regression on [date]" >> docs/analysis/index-rollback-log.md
```

**Statement Timeout Settings** (Prevent Lock Starvation):
```sql
-- Add to migration header
SET statement_timeout = '5s';      -- Individual statement max
SET lock_timeout = '2s';            -- Lock acquisition max
SET idle_in_transaction_session_timeout = '10s';

-- Then run DROP INDEX or CREATE INDEX
```

**Monitoring Hooks** (Supabase Dashboard):
1. **Query Performance** → Set alert: mean_exec_time > baseline + 20%
2. **Database Health** → Watch for Seq Scan increases
3. **Logs** → Filter for "duration: >[threshold]ms"

---

### Secondary Risk: Function Behavior Change - LOW

**Risk Description**: Setting explicit search_path might change function behavior.

**Likelihood**: Very Low (functions use fully qualified table names)

**Impact**: High (if functions break, features break)

**Mitigation**:
1. **Review Function Code**: Ensure tables use `public.` prefix or search_path = public works
2. **Test Thoroughly**: Test entity centrality and term frequency features
3. **Monitor Error Logs**: Watch for function call errors after deployment

**Operational Rollback Runbook** (Story 1.11.1):

**Detection**: Function errors in logs (Supabase Dashboard → Logs)

**Step 1: Identify Failing Function**
```sql
-- Check recent errors
SELECT * FROM pg_stat_user_functions
WHERE schemaname = 'public'
AND funcname IN ('increment_entity_centrality', 'increment_term_frequency');

-- Check error logs in Supabase Dashboard
-- Filter: "function" AND "error"
```

**Step 2: Quick Rollback (Restore Original Function)**
```bash
# Connect to database
supabase db connect

# Create rollback migration
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_rollback_function_search_path.sql << 'EOF'
-- Emergency rollback: Remove explicit search_path from functions
-- Reason: Function behavior regression detected

CREATE OR REPLACE FUNCTION increment_entity_centrality(...)
RETURNS void AS $$
BEGIN
  -- [original function body without SET search_path]
END;
$$ LANGUAGE plpgsql;
-- Note: Omit "SET search_path = public" line

CREATE OR REPLACE FUNCTION increment_term_frequency(...)
RETURNS void AS $$
BEGIN
  -- [original function body without SET search_path]
END;
$$ LANGUAGE plpgsql;
EOF

# Apply migration
supabase db push
```

**Step 3: Verify Fix**
```sql
-- Test function calls
SELECT increment_entity_centrality('test-id'::uuid, 1);
SELECT increment_term_frequency('test-user'::uuid, 'test', CURRENT_DATE, 'all_time');
-- Expected: No errors

-- Check function definition
\df+ increment_entity_centrality
-- Expected: No "SET search_path" line (if rolled back)
```

**Step 4: Root Cause Analysis**
```bash
# Document failure
cat >> docs/analysis/function-rollback-log.md << EOF
## Function Rollback: $(date)
- **Functions**: increment_entity_centrality, increment_term_frequency
- **Reason**: [error message from logs]
- **Root Cause**: [e.g., function uses dynamic table names, search_path needed]
- **Next Steps**: [e.g., refactor function to use qualified names, then retry]
EOF
```

---

### Tertiary Risk: Migration Failure - LOW

**Risk Description**: Migration might fail on production due to locks or conflicts.

**Likelihood**: Low (migrations tested locally first)

**Impact**: Medium (deployment blocked, rollback required)

**Mitigation**:
1. **Test Locally**: Run all migrations with `supabase db reset`
2. **Deploy Off-Peak**: Run migrations during low-traffic periods (e.g., 2-4 AM EST)
3. **Lock Timeout**: Set reasonable statement_timeout in migrations
4. **Use CONCURRENTLY**: For index operations (no table locks)

**Operational Rollback Runbook** (All Stories):

**Detection**: Migration fails during `supabase db push`

**Step 1: Capture Error Details**
```bash
# Migration output shows:
# ERROR:  [error message]
# Save full output to ticket

# Check migration status
supabase migration list
# Note: Which migration failed (timestamp)
```

**Step 2: Quick Rollback (Revert Migration File)**
```bash
# Option A: Remove migration file (if not yet applied)
rm supabase/migrations/[timestamp]_[description].sql

# Option B: Create revert migration (if partially applied)
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_revert_[original].sql << 'EOF'
-- Revert [original migration name]
-- Reason: Migration failed with [error]

-- For Story 1.11.1 (functions)
CREATE OR REPLACE FUNCTION [name](...) AS $$ ... $$ LANGUAGE plpgsql;

-- For Story 1.11.2 (add indexes)
DROP INDEX IF EXISTS idx_[name];

-- For Story 1.11.3 (drop indexes)
CREATE INDEX idx_[name] ON [table]([column]);
EOF

# Apply revert
supabase db push
```

**Step 3: Verify Database State**
```sql
-- Confirm revert successful
\df+ [function_name]  -- For Story 1.11.1
\di [index_name]      -- For Story 1.11.2 / 1.11.3

-- Check application still works
-- Run smoke tests from Story 1.11.3
```

**Step 4: Fix and Retry**
```bash
# Fix migration file
vim supabase/migrations/[timestamp]_[description].sql
# Address error (e.g., add IF EXISTS, fix syntax, add timeouts)

# Test locally first
supabase db reset  # Start clean
supabase db push   # Verify migration succeeds

# Retry deployment
git add supabase/migrations/
git commit -m "fix: migration syntax error"
git push
```

**Common Migration Errors & Fixes**:
- **Lock timeout**: Add `SET lock_timeout = '5s';` at top of migration
- **Index already exists**: Use `CREATE INDEX IF NOT EXISTS`
- **Function doesn't exist**: Use `CREATE OR REPLACE FUNCTION`
- **Constraint violation**: Check RLS policies, seed data compatibility

---

## Definition of Done

### Epic-Level DoD

- ✅ All 3 stories completed with acceptance criteria met
- ✅ 2 functions fixed (explicit search_path)
- ✅ 5 foreign key indexes added
- ✅ 16 unused indexes removed
- ✅ Supabase Database Linter shows 0 warnings (search_path, unindexed FKs, unused indexes)
- ✅ All migrations tested locally
- ✅ Query performance verified (EXPLAIN ANALYZE reports)
- ✅ No application functionality broken
- ✅ PR merged to `dev` branch
- ✅ Tested on Vercel preview (dev environment)
- ✅ PR merged to `main` after validation

### Per-Story DoD

Each story must meet:
- ✅ All story acceptance criteria met
- ✅ Migration file created and tested
- ✅ Supabase linter verification passed
- ✅ Local testing completed (`npm run dev`, database operations)
- ✅ PR created with description and linter screenshots
- ✅ Tested on Vercel preview deployment
- ✅ Code reviewed and approved
- ✅ User merges PR (not Claude)

---

## Timeline Estimate

### Optimistic (10 hours)
- Story 1.11.1: 2 hours (straightforward function updates)
- Story 1.11.2: 4 hours (indexes added, queries tested)
- Story 1.11.3: 4 hours (verification fast, no regressions)

### Realistic (13 hours) ⭐ RECOMMENDED
- Story 1.11.1: 3 hours (function testing takes longer)
- Story 1.11.2: 5 hours (performance testing iterations)
- Story 1.11.3: 5 hours (comprehensive query testing)

### Pessimistic (16 hours)
- Story 1.11.1: 4 hours (function behavior debugging)
- Story 1.11.2: 6 hours (query optimization discoveries)
- Story 1.11.3: 6 hours (regression found, indexes recreated selectively)

**Recommended Target**: 13 hours (realistic, 2 working days)

**Priority**: Start immediately (2 critical security vulnerabilities)

---

## Dependencies

### External Dependencies
- ✅ **Supabase Database Linter**: Available in Dashboard
- ✅ **PostgreSQL pg_stat_user_indexes**: Available for usage verification
- ✅ **Migration System**: `supabase/migrations/` established

### Internal Dependencies (Story Sequence)
1. **Story 1.11.1 → 1.11.2**: Fix security first, then optimize performance
2. **Story 1.11.2 → 1.11.3**: Add needed indexes before removing unused ones
3. **All stories → PR Merge**: All tests must pass before merge approval

**Note**: Stories must be done sequentially (security → performance → cleanup)

---

## Related Documentation

### Supabase Linter Reports
- **Original Reports**: CSV files from #177
  - `c916ead2-f9d6-4280-a95e-f421073aab4d.csv` (performance issues)
  - `aabc2bef-9926-49fb-b2da-2a641b74c5ed.csv` (security issues)

### Project Documentation
- **Issue #177**: [Database Security & Performance Issues](https://github.com/levineam/Signum/issues/177)
- **Story #179**: [Fix Function Security (search_path)](https://github.com/levineam/Signum/issues/179)
- **Story #180**: [Add Foreign Key Indexes](https://github.com/levineam/Signum/issues/180)
- **Story #181**: [Clean Up Unused Indexes](https://github.com/levineam/Signum/issues/181)
- **CLAUDE.md**: `.claude/CLAUDE.md` - PR workflow, Vercel testing requirements

### External References
- **Supabase Database Linter**: https://supabase.com/docs/guides/database/database-linter
- **Function search_path Security**: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable
- **Unindexed Foreign Keys**: https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys
- **Unused Indexes**: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index

---

## Validation Checklist

### Scope Validation
- ✅ Epic can be completed in 3 focused stories (10-16 hours)
- ✅ No architectural changes required (database optimization only)
- ✅ Integration complexity is low (pure database layer)
- ✅ Risk to existing system is low (no application code changes)

### Risk Assessment
- ✅ Risk to existing system is LOW (database migrations only)
- ✅ Rollback plan is feasible (revert migrations, restore functions/indexes)
- ✅ Testing approach covers critical paths (query performance, function calls)
- ✅ Security vulnerabilities identified and documented

### Completeness Check
- ✅ Epic goal is clear (fix 2 security issues + 21 performance issues)
- ✅ Stories are properly scoped (2-4h, 4-6h, 4-6h sequential)
- ✅ Success criteria are measurable (linter warnings = 0)
- ✅ Dependencies are identified (sequential: security → performance → cleanup)
- ✅ Priority is correct (CRITICAL security first)

---

**Epic Status**: ✅ **READY FOR IMPLEMENTATION**

**Next Action**: Dev can start Story 1.11.1 (#179) immediately to fix critical security vulnerabilities.

---

## Notes

### Why This Epic vs Individual Issues?

This enhancement qualified for epic treatment because:
- ✅ Multiple related issues (2 security + 21 performance)
- ✅ Single root cause (Supabase Database Linter report)
- ✅ Logical sequence required (security → performance → cleanup)
- ✅ Unified testing approach (linter verification)
- ✅ Shared migration strategy

### Supabase Database Linter Context

The Supabase Database Linter automatically scans databases for:
- **Security issues**: Function vulnerabilities, insecure RLS policies
- **Performance issues**: Missing indexes, unused indexes, slow queries
- **Best practices**: Schema design, naming conventions

This epic addresses **all 23 issues** flagged by the linter for a clean bill of health.

### Impact on Application

**No code changes required** - This is pure database optimization:
- Functions maintain same signatures
- Queries automatically benefit from new indexes
- Application continues to work unchanged

### Storage Savings

Removing 16 unused indexes will:
- Reduce database storage (exact savings depend on table sizes)
- Speed up INSERT/UPDATE/DELETE operations (16 fewer indexes to maintain)
- Simplify database maintenance (fewer indexes to monitor)

---

_This epic ensures Signum's database meets production security and performance standards by addressing all Supabase Database Linter findings._
