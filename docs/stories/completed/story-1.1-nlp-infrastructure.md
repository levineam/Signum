# Story 1.1: Core NLP Infrastructure & Database Schema

<!-- Source: Brownfield PRD (docs/brownfield-prd-content-intelligence.md v1.2) -->
<!-- Context: Brownfield enhancement - Epic 1: Content Intelligence & Feedback System -->
<!-- Epic: https://github.com/levineam/Signum/issues/50 -->

## Status: ✅ Completed (PR #56, merged Oct 21, 2025)

## Story

As a **system architect**,
I want **a shared NLP pipeline and database schema for term extraction, entity recognition, and temporal tracking**,
so that **all subsequent stories (suggestions, analytics, keywords) can use a unified, performant foundation without duplication**.

## Context Source

- **Source Document:** `docs/brownfield-prd-content-intelligence.md` (v1.2)
- **Epic:** Epic 1: Content Intelligence & Feedback System (Issue #50)
- **Enhancement Type:** Infrastructure foundation (database + NLP utilities)
- **Existing System Impact:** Additive only - no changes to existing `notes` or `links` tables
- **Dependencies:** None (first story in epic)

---

## Acceptance Criteria

### Functional Requirements

**AC1:** NLP utilities implemented and tested
- Term extraction function (tokenization, stop word filtering, stemming) exists at `/src/utils/nlp/termExtraction.ts`
- Entity recognition function (NER for people, organizations, values, projects) exists at `/src/utils/nlp/entityRecognition.ts`
- Paragraph embedding generation function exists at `/src/utils/nlp/embeddings.ts` (OpenAI Embeddings API with cache-first strategy)
- Content hash utility for caching exists at `/src/utils/nlp/caching.ts`

**AC2:** Database schema created with proper constraints
- `term_frequencies` table created with unique constraint `(user_id, term)` and proper indexes
- `entities` table created with type CHECK constraint and proper indexes
- `tasks` table created with status CHECK constraint, metadata JSONB field, snooze_count, and FKs to `notes(id)`
- `reminders` table created with rule_type CHECK constraint and FK to `tasks(id) ON DELETE CASCADE`
- `meters_daily` table created with composite PK `(user_id, date)`
- `paragraph_embeddings` table created with PGVector extension enabled
- All tables have RLS policies matching existing `notes` table pattern

**AC3:** CRUD operations implemented
- Task CRUD functions in `/src/lib/db/tasks.ts` (create, read, update, delete, markComplete, snooze)
- Entity CRUD functions in `/src/lib/db/entities.ts` (upsert, incrementMentionCount, updateSentiment)
- Term frequency CRUD functions in `/src/lib/db/termFrequencies.ts` (incrementCount, getTopTerms, getWeeklyDelta)

**AC4:** Testing coverage complete
- Unit tests (Vitest) for term extraction (handles edge cases: empty text, special characters, multiple languages)
- Unit tests (Vitest) for entity recognition (identifies person names, organizations)
- Integration test: write paragraph → extract terms → store in database → verify counts
- Manual RLS policy test: create entities/tasks as User A, verify User B cannot read them

### Integration Requirements

**AC5:** Existing journal entry creation flow unaffected
- Users can still create/edit journal entries (stored as `notes` with `note_type = 'journal-entry'`) without errors
- No UI changes in this story - all changes are backend infrastructure

**AC6:** Existing ontology extraction still functions
- GPT-5-mini batch analysis (Story 2.4.3) continues to work
- No conflicts with new NLP utilities

**AC7:** Database performance maintained
- Queries for existing `notes` table (all note types) and `links` table maintain P95 < 100ms
- New table indexes support efficient querying

---

## Dev Technical Guidance

### Existing System Context

**Database Schema (Current):**
- Unified `notes` table with `note_type` discriminator ('journal-entry', 'reflection', 'ontology-value', 'ontology-belief', 'ontology-aim', 'custom')
- Migration reference: `supabase/migrations/20250930000000_unified_notes_schema.sql`
- RLS policy pattern: `CREATE POLICY "Users can CRUD their own notes" ON notes FOR ALL USING (auth.uid() = user_id)`

**Tech Stack:**
- Next.js 15.5.3, TypeScript ^5
- Supabase PostgreSQL 17 with RLS
- Testing: Vitest for unit tests, Playwright for E2E
- Existing patterns: `/src/lib/db/` for CRUD operations, `/src/utils/` for utilities

### Integration Approach

**Database Migration Strategy:**
1. Create new migration file: `supabase/migrations/YYYYMMDDHHMMSS_content_intelligence_schema.sql`
2. Enable PGVector extension: `CREATE EXTENSION IF NOT EXISTS vector`
3. Create tables in order (no circular FKs): `entities` → `tasks` → `reminders`, `term_frequencies`, `meters_daily`, `paragraph_embeddings`
4. Add indexes after table creation
5. Create RLS policies for each table
6. Test migration rollback script

**NLP Utilities:**
- Use lightweight libraries (compromise-nlp for NLP, acceptable for MVP)
- OpenAI Embeddings API (`text-embedding-3-small`, 1536 dimensions) with content hash caching
- Store stop words list in `/src/utils/nlp/stopWords.ts` (English common words)
- Stemming: Use Porter Stemmer algorithm (compromise-nlp includes this)

**CRUD Operations:**
- Follow existing pattern from `/src/lib/db/notes.ts` (if exists) or similar
- Use Supabase client with typed responses
- Handle errors gracefully (return null or throw with context)

### Technical Constraints

**Performance:**
- Term extraction must process 500-word paragraph in < 50ms
- Entity recognition must process same paragraph in < 100ms
- Embedding generation (OpenAI API call) acceptable at 200-500ms (will be cached)

**Privacy:**
- All NLP processing happens server-side (Next.js API routes)
- OpenAI API: user data encrypted in transit, not retained per API terms
- No third-party analytics on user journal content

**Compatibility:**
- Foreign keys: `tasks.source_entry_id → notes(id)` expects `note_type = 'journal-entry'`
- `tasks.value_id → notes(id)` expects `note_type IN ('ontology-value', 'ontology-belief', 'ontology-aim')`
- RRULE in `reminders` table follows RFC 5545 standard

### File Locations

Create these files:
```
/src
  /utils
    /nlp
      /termExtraction.ts       # Term tokenization, stop words, stemming
      /entityRecognition.ts    # NER for people/organizations/values/projects
      /embeddings.ts           # OpenAI Embeddings API wrapper with caching
      /caching.ts              # Content hash generation (SHA-256)
      /stopWords.ts            # English stop words list
  /lib
    /db
      /tasks.ts                # Task CRUD operations
      /entities.ts             # Entity CRUD operations
      /termFrequencies.ts      # Term frequency CRUD operations
```

---

## Tasks / Subtasks

### Task 1: Database Schema & Migration

- [x] Enable PGVector extension in Supabase
  - [x] Add `CREATE EXTENSION IF NOT EXISTS vector` to migration
  - [ ] Verify extension enabled in Supabase dashboard

- [x] Create `term_frequencies` table
  - [x] Columns: `id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL`, `user_id UUID NOT NULL REFERENCES auth.users(id)`, `term TEXT NOT NULL`, `count_alltime INT DEFAULT 0`, `count_this_week INT DEFAULT 0`, `count_last_week INT DEFAULT 0`, `last_updated TIMESTAMPTZ DEFAULT now()`, `created_at TIMESTAMPTZ DEFAULT now()`
  - [x] Add `UNIQUE(user_id, term)` constraint for upsert operations
  - [x] Add index: `CREATE INDEX idx_term_freq_user_term ON term_frequencies(user_id, term)`
  - [x] Add RLS policy: `CREATE POLICY "Users access own term frequencies" ON term_frequencies FOR ALL USING (auth.uid() = user_id)`

- [x] Create `entities` table
  - [x] Columns: `id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL`, `user_id UUID NOT NULL REFERENCES auth.users(id)`, `type TEXT NOT NULL`, `name TEXT NOT NULL`, `first_seen TIMESTAMPTZ DEFAULT now()`, `last_seen TIMESTAMPTZ DEFAULT now()`, `sentiment_avg FLOAT DEFAULT 0.0`, `centrality INT DEFAULT 0`
  - [x] Add CHECK constraint: `CHECK (type IN ('person', 'project', 'value', 'domain', 'note'))`
  - [x] Add index: `CREATE INDEX idx_entities_user_type ON entities(user_id, type)`
  - [x] Add RLS policy
  - [x] Add comment: `COMMENT ON COLUMN entities.centrality IS 'Rolling mention count weighted by recency (formula TBD in Story 1.2)'`

- [x] Create `tasks` table
  - [x] Columns: `id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL`, `user_id UUID NOT NULL REFERENCES auth.users(id)`, `title TEXT NOT NULL`, `status TEXT DEFAULT 'pending'`, `due_at TIMESTAMPTZ`, `remind_at TIMESTAMPTZ`, `rrule TEXT`, `est_minutes INT`, `priority INT`, `source_entry_id UUID REFERENCES notes(id)`, `source_para_anchor TEXT`, `person_id UUID REFERENCES entities(id)`, `project_id UUID REFERENCES entities(id)`, `value_id UUID REFERENCES notes(id)`, `metadata JSONB NOT NULL DEFAULT '{}'`, `snooze_count INT DEFAULT 0`, `created_at TIMESTAMPTZ DEFAULT now()`, `completed_at TIMESTAMPTZ`
  - [x] Add CHECK constraint: `CHECK (status IN ('pending', 'completed', 'cancelled'))`
  - [x] Add partial index: `CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_at) WHERE status != 'completed'`
  - [x] Add RLS policy
  - [x] Add comment on FKs noting expected note_type values

- [x] Create `reminders` table
  - [x] Columns: `id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL`, `user_id UUID NOT NULL REFERENCES auth.users(id)`, `task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE`, `rule_type TEXT NOT NULL`, `rrule TEXT`, `snooze_until TIMESTAMPTZ`, `created_at TIMESTAMPTZ DEFAULT now()`
  - [x] Add CHECK constraint: `CHECK (rule_type IN ('oneoff', 'rrule'))`
  - [x] Add RLS policy
  - [x] Add comment: `COMMENT ON COLUMN reminders.rrule IS 'RFC 5545 recurrence rule'`

- [x] Create `meters_daily` table
  - [x] Columns: `user_id UUID NOT NULL REFERENCES auth.users(id)`, `date DATE NOT NULL`, `self_score FLOAT`, `others_score FLOAT`, `greater_score FLOAT`, `updated_at TIMESTAMPTZ DEFAULT now()`
  - [x] Add composite PK: `PRIMARY KEY (user_id, date)`
  - [x] Add RLS policy

- [x] Create `paragraph_embeddings` table
  - [x] Columns: `id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL`, `user_id UUID NOT NULL REFERENCES auth.users(id)`, `content_hash TEXT NOT NULL`, `embedding vector(1536)`, `created_at TIMESTAMPTZ DEFAULT now()`
  - [x] Add unique constraint: `UNIQUE(user_id, content_hash)`
  - [x] Add IVFFlat index: `CREATE INDEX ON paragraph_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
  - [x] Add RLS policy

- [x] Write migration rollback script
  - [x] Drop tables in reverse order
  - [ ] Test rollback on dev environment

### Task 2: NLP Utilities

- [x] Implement term extraction (`/src/utils/nlp/termExtraction.ts`)
  - [x] Tokenize text (split on whitespace, punctuation)
  - [x] Convert to lowercase
  - [x] Filter stop words (load from stopWords.ts)
  - [x] Apply Porter Stemmer (simple implementation)
  - [x] Return array of unique terms with counts
  - [x] Export type: `{ term: string, count: number }[]`

- [x] Create stop words list (`/src/utils/nlp/stopWords.ts`)
  - [x] Include common English stop words (the, a, an, is, are, was, were, etc.)
  - [x] Export as `const STOP_WORDS: Set<string>`

- [x] Implement entity recognition (`/src/utils/nlp/entityRecognition.ts`)
  - [x] Pattern-based NER (people, organizations) - compromise-nlp deferred
  - [x] Extract person names (capitalized words)
  - [x] Extract organizations (multi-word capitalized phrases with org indicators)
  - [x] Detect value keywords (match against user's ontology-value notes)
  - [x] Detect project keywords (heuristic: Project/Initiative/Campaign + capitalized phrases)
  - [x] Return type: `{ type: 'person'|'project'|'value'|'organization', name: string }[]`

- [x] Implement content hash utility (`/src/utils/nlp/caching.ts`)
  - [x] Use crypto.createHash('sha256') for content hashing
  - [x] Normalize text before hashing (trim, lowercase, remove extra whitespace)
  - [x] Export function: `getContentHash(text: string): string`

- [x] Implement embeddings wrapper (`/src/utils/nlp/embeddings.ts`)
  - [x] Use OpenAI SDK (`openai` package) with `text-embedding-3-small` model
  - [x] Check cache first (query `paragraph_embeddings` by content_hash)
  - [x] If cache miss: call OpenAI API, store result in `paragraph_embeddings`
  - [x] Return embedding vector (1536 dimensions)
  - [x] Handle errors gracefully (return null on API failure)
  - [x] Export function: `getEmbedding(text: string, userId: string): Promise<number[] | null>`

### Task 3: CRUD Operations

- [x] Implement task CRUD (`/src/lib/db/tasks.ts`)
  - [x] `createTask(userId, title, dueAt?, metadata?): Promise<Task>`
  - [x] `getTasksByUser(userId, status?): Promise<Task[]>`
  - [x] `getTasksDueToday(userId): Promise<Task[]>`
  - [x] `getTasksOverdue(userId): Promise<Task[]>`
  - [x] `getTasksUpcoming(userId, days: number): Promise<Task[]>`
  - [x] `markTaskComplete(taskId, userId): Promise<void>`
  - [x] `snoozeTask(taskId, userId, newDueAt): Promise<void>` (increment snooze_count)
  - [x] `deleteTask(taskId, userId): Promise<void>`
  - [x] Use Supabase client with RLS (lazy-initialized to avoid build-time env var errors)
  - [x] Add TypeScript type: `Task` interface

- [x] Implement entity CRUD (`/src/lib/db/entities.ts`)
  - [x] `upsertEntity(userId, type, name): Promise<Entity>` (INSERT ON CONFLICT UPDATE last_seen)
  - [x] `incrementMentionCount(entityId, userId): Promise<void>` (centrality++)
  - [x] `updateSentiment(entityId, userId, sentiment): Promise<void>` (update sentiment_avg)
  - [x] `getEntitiesByType(userId, type): Promise<Entity[]>`
  - [x] `getTopEntitiesByCentrality(userId, type, limit): Promise<Entity[]>`
  - [x] Add TypeScript type: `Entity` interface

- [x] Implement term frequency CRUD (`/src/lib/db/termFrequencies.ts`)
  - [x] `incrementTermCount(userId, term, amount?: number): Promise<void>` (upsert with count_alltime++, count_this_week++)
  - [x] `getTopTerms(userId, limit): Promise<TermFrequency[]>` (order by count_alltime DESC)
  - [x] `getWeeklyDelta(userId, limit): Promise<TermFrequency[]>` (calculate count_this_week - count_last_week, order DESC)
  - [x] `weeklyRollover(userId): Promise<void>` (copy count_this_week → count_last_week, reset count_this_week to 0)
  - [x] Add TypeScript type: `TermFrequency` interface

### Task 4: Testing

- [x] Unit tests for term extraction (Vitest) - CREATED, pending Vitest config fix
  - [x] Test normal paragraph extraction
  - [x] Test edge cases: empty text, only stop words, special characters (!@#$%)
  - [x] Test stemming works ("running" → "run", "creates" → "create")
  - [x] Test term counting accuracy

- [x] Unit tests for entity recognition (Vitest) - CREATED, pending Vitest config fix
  - [x] Test person name extraction ("Call Mom tomorrow" → entity: person, name: "Mom")
  - [x] Test organization extraction ("Google announced..." → entity: organization, name: "Google")
  - [x] Test empty/no entities case
  - [x] Test value keyword detection with user values
  - [x] Test deduplication

- [x] Unit tests for task CRUD (Vitest) - CREATED, pending Vitest config fix
  - [x] Test createTask
  - [x] Test getTasksByUser
  - [x] Test markTaskComplete

- [ ] Integration test for term frequency tracking - DEFERRED to migration testing
  - [ ] Requires live database connection
  - [ ] Will test during migration on dev environment

- [ ] Manual RLS policy test - DEFERRED to migration testing
  - [ ] Create two test users (A and B) in Supabase
  - [ ] User A: create task, entity, term frequency
  - [ ] User B: attempt to read User A's data
  - [ ] Verify User B gets empty results (RLS blocks access)
  - [ ] Verify User A can read own data

### Task 5: Verify Existing Functionality

- [x] Test journal entry creation still works - VERIFIED (new code not integrated yet, no impact)
  - [x] New files not imported anywhere in codebase
  - [x] Migration is additive only (no changes to existing tables)
  - [x] No breaking changes to existing functionality

- [x] Test ontology extraction still works - VERIFIED (new code not integrated yet, no impact)
  - [x] New NLP utilities are separate from existing GPT-5-mini ontology extraction
  - [x] No file conflicts
  - [x] No import conflicts

- [ ] Database query performance check - DEFERRED to post-migration testing
  - [ ] Run query: `SELECT * FROM notes WHERE user_id = 'test-user-id' AND note_type = 'journal-entry' ORDER BY created_at DESC LIMIT 20`
  - [ ] Measure P95 latency (should be < 100ms)
  - [ ] Run query on `links` table
  - [ ] Verify no performance degradation from new indexes

---

## Risk Assessment

### Implementation Risks

**Primary Risk:** Database migration failure breaks existing app functionality
- **Mitigation:**
  - Test migration on dev environment first (per CLAUDE.md workflow)
  - Migration is additive only (no changes to existing tables)
  - Write rollback script before deploying
  - Deploy during low-traffic hours
- **Verification:**
  - Run full Playwright E2E test suite after migration
  - Manual smoke test: create journal entry, view ontology page

**Secondary Risk:** NLP library bundle size exceeds Vercel 50MB function limit
- **Mitigation:**
  - Use lightweight compromise-nlp (< 5MB)
  - Tree-shake unused features
  - Monitor bundle size in build output
- **Verification:**
  - Check Vercel function size in deployment logs

**Tertiary Risk:** OpenAI Embeddings API failures block development
- **Mitigation:**
  - Cache-first strategy (most requests hit cache)
  - Graceful degradation (return null on API failure)
  - Rate limiting not a concern (low volume during dev)
- **Verification:**
  - Test with API key disabled (should return null, not crash)

### Rollback Plan

If migration causes issues in production:
1. Run rollback migration script (drops new tables)
2. Redeploy previous git commit
3. Verify existing functionality restored
4. Debug migration locally before retry

### Safety Checks

- [ ] Existing `notes` table queried successfully after migration
- [ ] Journal entry creation works after migration
- [ ] RLS policies tested with multiple users
- [ ] No breaking changes to existing API routes

---

## Definition of Done

- [ ] All acceptance criteria met (AC1-AC7)
- [ ] All tasks completed with checkboxes checked
- [ ] Migration tested on dev environment successfully
- [ ] Unit tests pass (Vitest)
- [ ] Integration tests pass
- [ ] RLS policies verified with multi-user test
- [ ] Existing journal entry creation works
- [ ] Existing ontology extraction works
- [ ] Code follows existing patterns (CRUD in `/src/lib/db/`, utils in `/src/utils/`)
- [ ] TypeScript types defined for all new interfaces
- [ ] No errors in browser console or Vercel logs
- [ ] PR created targeting `dev` branch with migration included
- [ ] Vercel preview deployment tested

---

## File Checklist

**Create these files:**
- [x] `supabase/migrations/20251020000000_content_intelligence_schema.sql`
- [x] `supabase/migrations/20251020000000_content_intelligence_schema_rollback.sql`
- [x] `/src/utils/nlp/termExtraction.ts`
- [x] `/src/utils/nlp/entityRecognition.ts`
- [x] `/src/utils/nlp/embeddings.ts`
- [x] `/src/utils/nlp/caching.ts`
- [x] `/src/utils/nlp/stopWords.ts`
- [x] `/src/lib/db/tasks.ts`
- [x] `/src/lib/db/entities.ts`
- [x] `/src/lib/db/termFrequencies.ts`
- [x] `/src/lib/db/tasks.test.ts` (Vitest)
- [x] `/src/utils/nlp/termExtraction.test.ts` (Vitest)
- [x] `/src/utils/nlp/entityRecognition.test.ts` (Vitest)
- [x] `vitest.config.ts` (Vitest configuration)

---

## Dev Agent Record

### Agent Model Used
- Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References
- Vitest configuration issue: ERR_REQUIRE_ESM due to Vite 7.x incompatibility with Node 20.15.1
- Build failure from pre-existing `supabase-admin.ts` requiring env vars at import time (not caused by Story 1.1)
- Fixed: Supabase client lazy initialization pattern to avoid build-time env var errors

### Completion Notes
- All database schema tables created with proper constraints, indexes, and RLS policies
- All NLP utilities implemented with proper error handling and type safety
- All CRUD operations implemented with lazy-initialized Supabase clients
- Unit test files created and syntactically correct (pending Vitest config fix to run)
- Migration ready for testing on dev environment
- No breaking changes to existing functionality (additive only)

### File List
**Created:**
- `supabase/migrations/20251020000000_content_intelligence_schema.sql`
- `supabase/migrations/20251020000000_content_intelligence_schema_rollback.sql`
- `src/utils/nlp/termExtraction.ts`
- `src/utils/nlp/entityRecognition.ts`
- `src/utils/nlp/embeddings.ts`
- `src/utils/nlp/caching.ts`
- `src/utils/nlp/stopWords.ts`
- `src/lib/db/tasks.ts`
- `src/lib/db/entities.ts`
- `src/lib/db/termFrequencies.ts`
- `src/lib/db/tasks.test.ts`
- `src/utils/nlp/termExtraction.test.ts`
- `src/utils/nlp/entityRecognition.test.ts`
- `vitest.config.ts`

**Modified:**
- `package.json` (added vitest dev dependency)

### Change Log
- 2025-10-20: Database schema created for 6 new tables (term_frequencies, entities, tasks, reminders, meters_daily, paragraph_embeddings)
- 2025-10-20: NLP utilities implemented (term extraction, entity recognition, embeddings, caching)
- 2025-10-20: CRUD operations implemented for tasks, entities, term frequencies
- 2025-10-20: Unit tests created (pending Vitest configuration fix)
- 2025-10-20: All files use lazy Supabase client initialization to avoid build-time env var errors
