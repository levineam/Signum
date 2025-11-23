# Database Index & Constraint Management

**Story:** Epic 1.11 - Database Security & Performance
**Last Updated:** 2025-11-23
**Owner:** Engineering

## Overview

PostgreSQL index analysis requires careful verification before dropping indexes. The `idx_scan = 0` metric is **misleading** - while it counts index scans from SELECT, UPDATE, and DELETE queries, it does NOT count constraint enforcement operations where unique indexes are critical.

## Quick Reference

| Constraint Type | Shows idx_scan = 0? | Safe to Drop? | Why |
|-----------------|---------------------|---------------|-----|
| Primary Key | ✅ Yes | ❌ NO | Critical for table integrity |
| Unique Constraint (ON CONFLICT) | ✅ Yes | ❌ NO | Required for upsert operations |
| Unique Constraint (Business Rule) | ✅ Yes | ❌ NO | Prevents duplicate data |
| Unique Constraint (Data Integrity) | ✅ Yes | ❌ NO | Prevents race conditions |
| Regular Index (unused) | ✅ Yes | ⚠️ Maybe | Verify no WHERE/JOIN usage |

## Critical Warning

⚠️ **NEVER use `idx_scan = 0` alone to identify unused indexes!**

The `idx_scan` metric in `pg_stat_user_indexes` counts index scans from SELECT, UPDATE, and DELETE queries. However, it does **NOT** count:
- Constraint enforcement operations (primary key, unique, foreign key checks)
- Indexes used in `INSERT ... ON CONFLICT` clauses (upserts) - the ON CONFLICT lookup is not counted
- Background processes that validate data integrity

This means unique indexes can show `idx_scan = 0` even when actively enforcing constraints on every INSERT/UPDATE.

## Step-by-Step Guide

### Step 1: Find Candidate Indexes

Use this query to find potentially unused indexes (automatically excludes unique constraints and primary keys):

```sql
-- Find truly unused indexes (excludes unique constraints and primary keys)
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan AS index_scans
FROM pg_stat_user_indexes pui
JOIN pg_index pi ON pui.indexrelid = pi.indexrelid
WHERE
  idx_scan = 0                 -- Zero scans
  AND pi.indisunique = FALSE   -- ✅ Exclude unique indexes/constraints
  AND pi.indisprimary = FALSE  -- ✅ Exclude primary keys
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Step 2: Manual Verification Checklist

Before dropping ANY index or constraint, verify ALL of the following:

#### For Unique Constraints

1. ✅ **Search for ON CONFLICT usage**
   ```bash
   grep -r "ON CONFLICT.*<column_names>" src/
   ```

2. ✅ **Check database functions**
   ```bash
   grep -r "ON CONFLICT" supabase/migrations/
   ```

3. ✅ **Verify upsert logic**
   ```bash
   grep -r "\.upsert.*onConflict" src/
   ```

4. ✅ **Check plain INSERT relying on constraint**
   - Code may use `.insert()` expecting constraint to reject duplicates
   - Example: `links_source_note_id_target_note_id_link_type_key` prevents duplicate graph edges
   - Look for `.insert()` without `.upsert()` in areas where uniqueness matters

5. ✅ **Assess business rule impact**
   - Is uniqueness a domain requirement? (e.g., "no duplicate entities", "no duplicate links")
   - Would duplicates violate the application's conceptual model?

6. ✅ **Consider data corruption risk**
   - Would duplicates corrupt application state or query results?
   - Would duplicate prevention need to move to application layer?

7. ✅ **Don't assume "application handles it"**
   - Database constraints are the last line of defense against:
     - Race conditions during concurrent inserts
     - Bugs in application deduplication logic
     - Import/migration scripts that bypass application layer
     - Direct database writes (admin tools, data fixes)

#### For Regular Indexes

1. ✅ **Check foreign key relationships**
   - May be needed for JOIN performance
   - Verify with: `\d <table_name>` in psql

2. ✅ **Verify not used in WHERE clauses**
   ```bash
   grep -r "WHERE.*<column_name>" src/
   ```

3. ✅ **Consider query plan changes**
   - Even if unused now, might be needed for future queries
   - Check with team before dropping

### Step 3: Create Migration

Create migration with clear documentation:

```sql
-- Epic X.X.X: Drop Unused Indexes
-- Total Unused Indexes: N (idx_scan = 0, excluding unique constraints)
-- Total Storage Reclaimed: ~X MB
-- Note: Preserved M unique constraints (all enforce critical data integrity):
--       - constraint_name_1 (reason)
--       - constraint_name_2 (reason)

-- Table: table_name
DROP INDEX IF EXISTS idx_unused_column;  -- ✅ Safe - not used in queries

-- NOTE: constraint_name MUST be kept - required for <reason>
-- DROP CONSTRAINT constraint_name;  -- ❌ CANNOT DROP
```

## Three Purposes of Unique Constraints

Understanding why unique constraints show `idx_scan = 0`:

### 1. ON CONFLICT Clauses

Enable upserts: `INSERT ... ON CONFLICT (col) DO UPDATE`

**Example:**
```typescript
const { error } = await supabase
  .from('paragraph_embeddings')
  .upsert({
    user_id: user.id,
    content_hash: contentHash,
    embedding
  }, {
    onConflict: 'user_id,content_hash',  // Requires unique_user_content_hash
  });
```

### 2. Business Rule Enforcement

Prevent duplicates via constraint errors (no ON CONFLICT needed):

**Example:**
```typescript
const { error } = await this.supabase.from('links').insert(linksToCreate);
// Plain insert - relies on constraint to reject duplicates
// If constraint is removed, silent duplicate creation corrupts graph
```

### 3. Data Integrity

General duplicate prevention across concurrent operations, race conditions, and bugs.

**All three show `idx_scan = 0` because they're used for WRITE operations, not reads!**

## Critical Insight

> **"Application logic could deduplicate" ≠ "Safe to remove database constraint"**

Even without ON CONFLICT clauses, constraints prevent silent data corruption from:
- Race conditions during concurrent inserts (two requests creating same entity simultaneously)
- Bugs in application deduplication logic (edge cases, refactoring mistakes)
- Import/migration scripts that bypass application layer
- Direct database writes (admin tools, data fixes, manual SQL)

## Real-World Example: Epic 1.11 Story 1.11.3

**Initial Analysis:** 19 indexes with `idx_scan = 0`
**After Manual Verification:** Only 15 were truly unused

**4 Unique Constraints Were Critical:**

| Constraint | Table | Why Critical |
|-----------|-------|-------------|
| `unique_user_term` | `term_frequencies` | Required by `increment_term_frequency` function's ON CONFLICT |
| `unique_user_type_name` | `entities` | Prevents duplicate entities (business rule from Story 1.1) |
| `unique_user_content_hash` | `paragraph_embeddings` | Required for embeddings upsert ON CONFLICT |
| `links_source_note_id_target_note_id_link_type_key` | `links` | Prevents duplicate graph edges (business rule enforcement) |

**Result:** Dropped 15 regular indexes, preserved 4 constraints, saved ~1.6 MB storage without compromising data integrity.

See `docs/analysis/unused-indexes-report-story-1.11.3-20251122.md` for full analysis.

## Decision Tree

```
Found index with idx_scan = 0?
├─ Is it a unique constraint or primary key?
│  ├─ YES → Run full manual verification checklist
│  │  ├─ Found ON CONFLICT usage? → KEEP
│  │  ├─ Found plain INSERT relying on it? → KEEP
│  │  ├─ Business rule requires uniqueness? → KEEP
│  │  └─ Passed all 7 checks? → Safe to drop
│  └─ NO → Regular index
│     ├─ Used in WHERE/JOIN clauses? → KEEP
│     ├─ Foreign key relationship? → KEEP
│     └─ Not used anywhere? → Safe to drop
```

## Troubleshooting

### Issue: Migration drops constraint, application breaks

**Symptoms:** Duplicate data appearing, upserts failing with "no unique or exclusion constraint"

**Fix:**
1. Rollback migration immediately
2. Run manual verification checklist again
3. Add constraint back with clear documentation
4. Update this runbook if new pattern discovered

### Issue: Unsure if constraint is used

**Steps:**
1. Check all 7 items in verification checklist
2. Search entire codebase (including test files)
3. Check Supabase dashboard for database functions
4. When in doubt, **keep the constraint** - storage cost is minimal compared to data corruption risk

### Issue: Need to confirm if index improves query performance

**Steps:**
1. Run `EXPLAIN ANALYZE` on relevant queries
2. Check if index is listed in query plan
3. If unsure, keep index and document reasoning
4. Monitor performance after deployment

## References

- PostgreSQL Index Types: https://www.postgresql.org/docs/current/indexes-types.html
- Understanding `idx_scan`: https://www.postgresql.org/docs/current/monitoring-stats.html
- Epic 1.11 Analysis: `docs/analysis/unused-indexes-report-story-1.11.3-20251122.md`
- Supabase Best Practices: https://supabase.com/docs/guides/database/postgres/indexes
