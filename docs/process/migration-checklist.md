# Migration & Verification Checklist (Schema Changes)

Use this checklist for any PR that modifies the database (migrations, functions, indexes).

- [ ] Migrations run locally (`supabase db reset` or equivalent) without errors
- [ ] RLS policies updated if tables are added/renamed
- [ ] Test scripts aligned (`scripts/test-story-*.sql`)
  - [ ] Table and index names match current schema
  - [ ] Function signatures match (`\df function_name`)
  - [ ] Auth context handled (set `request.jwt.claim.sub` when using `auth.uid()`)
  - [ ] Fixtures loaded before verification (`\i scripts/test-fixtures.sql`)
- [ ] Schema validator passes (`psql -f scripts/validate-test-scripts.sql`)
- [ ] Epic docs updated (e.g., `docs/stories/epic-*.md` lists function signatures)
- [ ] CI green; schema validation job enabled when applicable
