# Prevent Repeat Codex Review Comments - Industry-Aligned Plan

## Industry Standards Summary
Research shows modern teams use:
- **CI/CD schema validation** (Flyway/Liquibase patterns)
- **pgTAP for unit testing** PostgreSQL schemas
- **Automated drift detection** in pipelines
- **Test fixtures over conditional skips** (repeatability > flakiness)
- **Documentation-first migration checklists**

---

## Phase 1: Immediate Verification ✅
**Status**: Mostly complete (commits 84799bae, 1cbd8fa4, 942b9b0b, ad910591)

- [ ] Verify all 5 test scripts (`test-story-1.11.*-{before,after}.sql`) run cleanly
- [ ] Confirm Codex review threads are resolved
- [x] Added schema validator (`scripts/validate-test-scripts.sql`)
- [x] Added minimal fixtures (`scripts/test-fixtures.sql`)
- [x] Added migration checklist (`docs/process/migration-checklist.md`)

---

## Phase 2: Automated Schema Validation (STANDARD PRACTICE)

### 2.1 CI Schema Drift Check
Add to `.github/workflows/continuous-testing.yml`:
```yaml
- name: Schema Drift Detection
  run: |
    # Compare test scripts with actual schema
    psql -f scripts/validate-test-scripts.sql
```

### 2.2 Test Script Validator
Create `scripts/validate-test-scripts.sql`:
- Query `pg_tables` for current table names
- Query `pg_indexes` for current index names
- Fail if test scripts reference non-existent tables/indexes
- Output: "✅ All test scripts aligned" or "❌ Drift detected in {script}"

**Industry Alignment**: Schema monitoring tools (Atlas, Liquibase) run automated drift detection in CI.

---

## Phase 3: Test Data Strategy (FIXTURES)

### Adopt Test Fixtures Pattern
**Why**: Research shows fixtures provide repeatability > conditional skips (which mask test failures).

Create `scripts/test-fixtures.sql`:
```sql
-- Seed minimal data for Epic 1.11 tests
INSERT INTO auth.users (id, email) VALUES ('test-uuid', 'test@example.com');
INSERT INTO _deprecated_tasks (user_id, person_id, ...) VALUES (...);
INSERT INTO links (user_id, target_note_id, ...) VALUES (...);
```

Update test scripts:
```sql
-- Load fixtures first
\i scripts/test-fixtures.sql

-- Then run queries (no conditional skips needed)
EXPLAIN ANALYZE SELECT * FROM _deprecated_tasks WHERE person_id = :person_id;
```

**Industry Alignment**: Rails testing guide, pytest fixtures, pgTAP all recommend fixtures for database tests.

---

## Phase 4: Documentation Standards

### 4.1 Migration Checklist Template
Add to `docs/process/migration-checklist.md`:
```markdown
## Pre-Merge Checklist (Required for All Schema PRs)

- [ ] Migration SQL tested locally
- [ ] RLS policies updated (if table renamed/added)
- [ ] **Test scripts updated** (`scripts/test-story-*.sql`)
  - [ ] Table names match current schema
  - [ ] Index names verified with `\di`
  - [ ] Function signatures match (`\df function_name`)
- [ ] Epic documentation updated (`docs/stories/epic-*.md`)
- [ ] Test fixtures seeded (if new tables/columns added)
- [ ] Schema validator passes in CI
```

### 4.2 Function Signature Documentation
In `docs/stories/epic-*.md`, document:
```markdown
## Database Functions

### `increment_entity_centrality(entity_id uuid)`
**Parameters**: 1 (entity_id uuid)
**Returns**: void
**Test Script**: `test-story-1.11.1-after.sql:45`
```

**Industry Alignment**: Database migration checklists (Lumenalta, Datafold) emphasize structured pre-flight checks and cross-team documentation.

---

## Phase 5: Process Integration

### Workflow Update
1. **Developer makes schema change** → Run migration locally
2. **Before committing** → Run `scripts/validate-test-scripts.sql`
3. **Update test scripts** → Align with new schema
4. **Update epic docs** → Document changes (use checklist)
5. **Push to PR** → CI runs schema validator
6. **Codex reviews** → Automated check catches drift
7. **User merges** → No repeat comments

**Industry Alignment**: CI/CD-integrated schema validation (Flyway checks, Atlas monitoring) prevents drift from reaching production.

---

## Success Metrics
- **Zero Codex comments** about schema mismatches in next 5 PRs
- **CI fails fast** if test scripts drift (< 30s feedback)
- **100% test coverage** with fixtures (no skipped queries)

---

## Differences from Original Plan
1. **Added automated CI validation** (industry standard, was "optional" before)
2. **Chose fixtures over conditional skips** (research shows better repeatability)
3. **Added migration checklist template** (standard practice across teams)
4. **Simplified to 5 phases** (removed redundant "process improvements" phase)

---

## References
- [Database Migration Testing Best Practices](https://www.browserstack.com/guide/data-migration-testing-guide)
- [PostgreSQL Schema Evolution Manager](https://github.com/mbryzek/schema-evolution-manager)
- [pgTAP: Unit Testing for PostgreSQL](https://pgtap.org/)
- [Schema Drift Detection with Atlas](https://atlasgo.io/monitoring/drift-detection)
- [Liquibase Database Drift](https://www.liquibase.com/blog/database-drift)
- [Database Migration Checklist 2025](https://lumenalta.com/insights/database-migration-checklist)
