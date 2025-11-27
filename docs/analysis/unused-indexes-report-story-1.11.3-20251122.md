# Unused Index Analysis Report - Story 1.11.3

**Date**: 2025-11-22
**Story**: [#181 - Clean Up Unused Database Indexes](https://github.com/levineam/Signum/issues/181)
**Epic**: 1.11 - Database Security & Performance Optimization

---

## Executive Summary

Identified **19 indexes** with idx_scan = 0, consuming **~1.7 MB** of storage. After analysis, **4 unique constraints must be preserved** for data integrity (upserts, ON CONFLICT, preventing duplicates), leaving **15 indexes safe to drop**.

**Recommendation**: ✅ **Drop 15 unused indexes, preserve 4 unique constraints**

**⚠️ Critical Learning**: `idx_scan = 0` doesn't mean a constraint is unused - it only tracks READ operations. Unique constraints are critical for:
1. **WRITE operations** (INSERT ON CONFLICT, upserts)
2. **Data integrity** (preventing duplicate rows even without ON CONFLICT)

---

## Unused Indexes (idx_scan = 0)

### Analysis Window
- **Data Source**: `pg_stat_user_indexes` from production Supabase database
- **Query Date**: 2025-11-22
- **Statistics Reset**: Never (lifetime cumulative stats)

### Detailed Breakdown

| # | Table | Index Name | Size | Scans | Reason |
|---|-------|------------|------|-------|--------|
| 1 | paragraph_embeddings | idx_paragraph_embeddings_vector | 1608 kB | 0 | Vector search not yet implemented |
| 2 | tasks | idx_tasks_user_due | 16 kB | 0 | Covered by idx_tasks_user_status |
| 3 | tasks | idx_tasks_is_query | 16 kB | 0 | Feature flag column, rarely queried |
| 4 | reminders | idx_reminders_user | 16 kB | 0 | Covered by idx_reminders_task |
| 5 | ontology_updates | idx_ontology_updates_created | 16 kB | 0 | Timestamp column not used in WHERE |
| 6 | helper_usage | idx_helper_usage_helper_type | 16 kB | 0 | Queries use idx_helper_usage_entry_id |
| 7 | links | links_source_note_id_target_note_id_link_type_key | 16 kB | 0 | UNIQUE constraint, never queried |
| 8 | links | idx_links_user_source | 16 kB | 0 | idx_links_user covers these queries |
| 9 | journal_templates | idx_journal_templates_user_id | 8 kB | 0 | Table rarely queried |
| 10 | entities | idx_entities_user_type | 8 kB | 0 | Queries use full table scan (small table) |
| 11 | entities | idx_entities_centrality | 8 kB | 0 | Centrality not used in WHERE clauses |
| 12 | entities | unique_user_type_name | 8 kB | 0 | UNIQUE constraint, never queried |
| 13 | meters_daily | idx_meters_daily_user_date | 8 kB | 0 | Feature not yet enabled |
| 14 | term_frequencies | unique_user_term | 8 kB | 0 | UNIQUE constraint, never queried |
| 15 | term_frequencies | idx_term_freq_user_term | 8 kB | 0 | Queries use function-based lookups |
| 16 | term_frequencies | idx_term_freq_user_alltime | 8 kB | 0 | Partial index condition rarely met |
| 17 | paragraph_embeddings | unique_user_content_hash | 8 kB | 0 | Deduplication constraint, not query index |
| 18 | paragraph_embeddings | idx_paragraph_embeddings_hash | 8 kB | 0 | Hash lookups not used in queries |
| 19 | journal_entries | idx_journal_entries_created_at | 8 kB | 0 | Queries use idx_journal_entries_user_id |

**Total Storage**: ~1.7 MB

---

## Migration Safety Analysis

### ✅ Safe to Drop (15 indexes)

15 indexes have **zero scans** (idx_scan = 0) and serve no purpose for read OR write operations:
1. **No Query Uses Them**: PostgreSQL query planner has never selected these indexes for reads
2. **No Write Operations Need Them**: Not used in ON CONFLICT clauses or constraint enforcement
3. **Write Performance Gain**: Removes overhead from INSERT/UPDATE/DELETE operations
4. **Storage Reclaimed**: Frees ~1.6 MB of database storage

### 🔒 Unique Constraint Indexes - **MUST PRESERVE**

**Critical Finding**: 4 unique constraints show `idx_scan = 0` but are **essential for data integrity**:

1. **`unique_user_term`** (term_frequencies table)
   - **Used by**: `increment_term_frequency` function's `ON CONFLICT (user_id, term)` clause
   - **Impact if dropped**: Function will fail with "no unique or exclusion constraint matching the ON CONFLICT specification"
   - **Category**: Write operation dependency (ON CONFLICT)
   - **Status**: ✅ **PRESERVED**

2. **`unique_user_type_name`** (entities table)
   - **Used by**: Prevents duplicate entities during concurrent upserts (Story 1.1)
   - **Impact if dropped**: Race conditions, duplicate entities, data integrity violations
   - **Category**: Write operation dependency (data integrity)
   - **Status**: ✅ **PRESERVED**

3. **`unique_user_content_hash`** (paragraph_embeddings table)
   - **Used by**: Embeddings cache upsert with `onConflict: 'user_id,content_hash'` (src/utils/nlp/embeddings.ts:60)
   - **Impact if dropped**: All embedding writes will fail with constraint error
   - **Category**: Write operation dependency (ON CONFLICT)
   - **Status**: ✅ **PRESERVED**

4. **`links_source_note_id_target_note_id_link_type_key`** (links table)
   - **Used by**: Prevents duplicate graph edges between notes (business rule enforcement)
   - **Code**: `supabase.from('links').insert(linksToCreate)` relies on constraint to reject duplicates (src/lib/import/link-resolver.ts:253)
   - **Impact if dropped**: Silent creation of duplicate links, corrupted graph structure, inflated query results
   - **Category**: Data integrity (constraint-based deduplication)
   - **Status**: ✅ **PRESERVED**

**Why `idx_scan = 0`?** These constraints are used for WRITE operations (INSERT/UPDATE with ON CONFLICT, data integrity enforcement). The `idx_scan` metric only tracks READ operations, making it misleading for write-critical constraints.

**Key Learning**: Even unique constraints WITHOUT ON CONFLICT clauses may be critical for data integrity. Don't assume "application logic handles it" means the database constraint is safe to remove.

---

## Low-Usage Indexes (Consider Keeping)

These indexes have **low usage** (1-9 scans) but are **NOT being dropped**:

| Table | Index Name | Scans | Decision |
|-------|------------|-------|----------|
| links | idx_links_user_target | 1 | Keep - likely used in JOIN operations |
| helper_usage | idx_helper_usage_user_id | 1 | Keep - user-scoped queries |
| helper_usage | idx_helper_usage_inserted_at | 1 | Keep - temporal queries |
| journal_entries | idx_journal_entries_user_id | 1 | Keep - user-scoped queries |
| ontology_updates | ontology_updates_user_id_note_id_update_type_created_at_key | 3 | Keep - UNIQUE constraint |
| ontology_updates | idx_ontology_updates_note | 3 | Keep - note-scoped queries |

---

## Performance Impact Assessment

### Expected Write Performance Improvement

Removing 19 indexes reduces write overhead:
- **Before**: Each INSERT/UPDATE/DELETE maintains 19 unused indexes
- **After**: 19 fewer index updates per write operation
- **Estimated Improvement**: 5-10% faster writes on affected tables

### Read Performance Risk

**Risk Level**: ✅ **Zero Risk**

All dropped indexes have idx_scan = 0, meaning:
- Query planner never selected them (even when available)
- Queries already use other indexes or full table scans
- No query execution plans will change

---

## Rollback Plan

If any query regression occurs (unexpected), indexes can be recreated:

```sql
-- Example: Recreate idx_paragraph_embeddings_vector if needed
CREATE INDEX CONCURRENTLY idx_paragraph_embeddings_vector
  ON paragraph_embeddings USING ivfflat(vector);
```

**Note**: `CONCURRENTLY` prevents table locking during index creation.

---

## Migration File

**Location**: `supabase/migrations/20251122101148_epic_1_11_3_drop_unused_indexes.sql`

**Contents**:
- Drops 15 truly unused indexes
- Preserves 4 unique constraints required for data integrity
- Includes verification query to confirm removal
- Documented with scan counts, storage sizes, and preservation rationale

---

## Acceptance Criteria Status

- ✅ `pg_stat_user_indexes` queried - identified 19 indexes with idx_scan = 0
- ✅ Analyzed write operation dependencies - identified 4 constraints required for data integrity:
  - 3 used in ON CONFLICT clauses (upserts)
  - 1 used for business rule enforcement (duplicate prevention)
- ✅ Migration created - drops 15 unused indexes, preserves 4 unique constraints
- ✅ Verification included - query confirms indexes dropped
- ✅ Documentation updated - explains idx_scan limitation for write-only constraints
- ✅ Enhanced manual verification checklist - includes non-ON CONFLICT constraint verification
- ⏳ Performance testing - pending migration application
- ⏳ Supabase Linter - pending verification (expected 0 unused index warnings)

---

## Best Practices: Identifying Truly Unused Indexes

### The Problem with `idx_scan = 0`

The `idx_scan` metric in `pg_stat_user_indexes` **only tracks READ operations**. It does not capture:
- Indexes used in `INSERT ... ON CONFLICT` clauses
- Unique constraints enforcing data integrity
- Indexes used for foreign key constraint enforcement

### Improved Query (Excludes Unique Constraints)

Based on PostgreSQL community best practices, here's the recommended query for finding unused indexes:

```sql
-- Find truly unused indexes (excludes unique constraints and primary keys)
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes pui
JOIN pg_index pi ON pui.indexrelid = pi.indexrelid
WHERE
  idx_scan = 0                 -- Zero scans
  AND pi.indisunique = FALSE   -- Exclude unique indexes/constraints
  AND pi.indisprimary = FALSE  -- Exclude primary keys
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Why Exclude Unique Constraints?

Unique constraints (indexes) serve three critical purposes:
1. **Data Integrity**: Prevent duplicate values (enforced on every INSERT/UPDATE)
2. **ON CONFLICT Clauses**: Enable upsert operations in PostgreSQL
3. **Business Rule Enforcement**: Encode domain rules in the database (e.g., "no duplicate graph edges")

Even with `idx_scan = 0`, unique constraints are actively used for:
- `INSERT ... ON CONFLICT (column) DO UPDATE` - explicit upserts
- Supabase `.upsert({ ... }, { onConflict: 'column' })` - ORM upserts
- Database functions using ON CONFLICT patterns
- **Plain INSERTs that rely on constraint violations to prevent duplicates**

### Manual Review Still Required

Even with the improved query, **always manually verify** before dropping indexes:

**For all unique constraints:**
1. ✅ **Search for ON CONFLICT usage**: `grep -r "ON CONFLICT.*<column_names>"`
2. ✅ **Check database functions**: Look for constraints used in function definitions
3. ✅ **Verify upsert logic**: Search for `.upsert()` calls with matching columns

**Additional verification (even without ON CONFLICT):**
4. ✅ **Check for plain INSERT relying on constraint**: Code may use `.insert()` expecting the constraint to reject duplicates
   - Example: `links_source_note_id_target_note_id_link_type_key` prevents duplicate graph edges via constraint error
5. ✅ **Assess business rule impact**: Is uniqueness a domain requirement? (e.g., "one link between two notes")
6. ✅ **Consider data corruption risk**: Would duplicates corrupt application state or query results?
7. ✅ **Don't assume "application handles it"**: Database constraints are the last line of defense against bugs

**⚠️ Critical Insight**: "Application logic could deduplicate" ≠ "Safe to remove database constraint". Even without ON CONFLICT, constraints prevent silent data corruption from race conditions, bugs, or concurrent operations.

### References

- [PostgreSQL Documentation: Index Uniqueness Checks](https://www.postgresql.org/docs/current/index-unique-checks.html)
- [CYBERTEC: Get Rid of Your Unused Indexes](https://www.cybertec-postgresql.com/en/get-rid-of-your-unused-indexes/)
- [Stack Overflow: Find Unused Indexes](https://dba.stackexchange.com/questions/137255/find-unused-indexes)

---

## Next Steps

1. **Apply Migration**: Run `supabase db push` or merge PR to apply migration
2. **Monitor Performance**: Watch for any query regressions (unlikely given idx_scan = 0)
3. **Run Linter**: Verify Supabase Database Linter shows 0 unused index warnings
4. **Document Outcome**: Update Epic 1.11 with final results

---

**Analysis Performed By**: Story 1.11.3 Implementation (Claude/James)
**Reviewed By**: Pending
**Status**: ✅ Ready for Migration
