# Signum Content Intelligence & Feedback System - Brownfield Enhancement PRD

**Date:** October 19, 2025
**Status:** Planning Phase - Ready for Story Manager Handoff
**Version:** 1.2 (Schema Consistency Review Applied)
**Enhancement Type:** Major Feature Addition (Issues #25 + #48 Consolidation)

**Revision History:**
- v1.2 (Oct 19, 2025): Applied GPT-5-Codex schema consistency review - corrected all references from non-existent `journal_entries` table to unified `notes` table with `note_type = 'journal-entry'`, fixed foreign key `source_entry_id → notes(id)` with note_type expectations, updated Integration Verification sections to reflect actual schema (migration 20250930000000), fixed remaining path reference from `/src/app/notes/page.tsx` to `/src/app/ontology/page.tsx`
- v1.1 (Oct 19, 2025): Applied GPT-5 technical review corrections - fixed route paths, resolved NFR8/embeddings contradiction, enhanced database schema with constraints/FKs, added PGVector extension details, clarified performance strategy, updated testing framework to Vitest, added proposed defaults for open questions
- v1.0 (Oct 19, 2025): Initial PRD created from consolidated Issues #25 + #48

---

## Intro Project Analysis and Context

### Analysis Source
- **Primary Sources:** GitHub Issues #25 and #48
- **Supporting Documentation:**
  - Existing PRD at `docs/prd.md` (v3.0)
  - Project Brief at `docs/project-brief.md`
  - Architecture docs in `docs/architecture/`
- **Analysis Type:** IDE-based with comprehensive existing documentation

### Current Project State

**Project:** Signum - Journaling-first social platform for meaning-making
**Production URL:** https://ontology-mu.vercel.app
**Tech Stack:** Next.js 15.5.3, Supabase (PostgreSQL + Auth), shadcn/ui, Vercel hosting

**Current Functionality:**
- ✅ WYSIWYG journal editor with rich text formatting
- ✅ Text selection and note creation from highlights
- ✅ Bidirectional linking between entries and notes
- ✅ Notes Page with Personal Ontology UI (Values, Beliefs, Aims)
- ✅ AI Personal Ontology Extraction with GPT-5-mini (Story 2.4.3 completed)
- ✅ Supabase-backed data persistence with RLS policies
- 🎯 **Current Priority:** Story 2.4.4 - Incremental AI Ontology Analysis

**Key Integration Points:**
- Journal editor (`/src/components/editor/SimpleRichEditor.tsx`)
- Journal stream page (`/src/app/page.tsx`)
- Journal stream component (`/src/components/journal/JournalStream.tsx`)
- Notes system (Supabase `notes` table with type: 'value'|'belief'|'aim')
- Ontology page (`/src/app/ontology/page.tsx`)
- Ontology component (`/src/components/ontology/OntologyPage.tsx`)
- OpenAI integration (existing GPT-5-mini implementation)

### Available Documentation Analysis

✅ **Available Documentation:**
- ✅ Tech Stack Documentation (`docs/architecture/tech-stack.md`)
- ✅ Source Tree/Architecture (`docs/architecture/project-structure.md`)
- ✅ Coding Standards (`docs/architecture/coding-standards.md`)
- ✅ Comprehensive PRD with 100+ requirements (`docs/prd.md`)
- ✅ API Documentation (Supabase schema, OpenAI integration docs)
- ✅ External API Documentation (`docs/openai-gpt5-api.md`)
- ⚠️ UX/UI Guidelines (partial - shadcn/ui Notebook theme mentioned)
- ⚠️ Technical Debt Documentation (mentioned in PRD change log)

**Assessment:** Existing documentation is comprehensive and current. No need to run document-project task.

### Enhancement Scope Definition

#### Enhancement Type
- ✅ **New Feature Addition** (primary)
- ✅ **Integration with New Systems** (NLP pipeline, embedding service)
- ✅ **Performance/Scalability Improvements** (real-time suggestions, caching strategy)

#### Enhancement Description

This enhancement consolidates GitHub Issues #25 (weighted Keywords section) and #48 (paragraph-level feedback loops) into a unified **Content Intelligence & Feedback System**.

The system will:
1. **Extract and track keywords/terms** from journal entries and notes with temporal and all-time frequency weighting
2. **Provide real-time paragraph-level suggestions** for next steps, relationships, and note connections
3. **Enable journal-native task/reminder creation** with natural language date parsing
4. **Display temporal analytics** (weekly snapshots, rising themes) and identity analytics (all-time keywords)
5. **Track engagement through C3 progress bars** (Self, Others, Greater) for value-aligned journaling

This creates three feedback loops:
- **Loop A (Instant):** Write paragraph → AI suggestion → Add to notes/tasks
- **Loop B (Near-term):** Tasks/reminders → Today header → Weekly snapshot
- **Loop C (Long-term):** Accumulated patterns → Ontology enrichment → Keywords visualization

#### Impact Assessment
- ☑️ **Major Impact (architectural changes required)**
  - New NLP/text analysis service infrastructure
  - Database schema extensions (tasks, reminders, entities, term_frequencies)
  - Paragraph boundary detection in journal editor
  - Real-time suggestion API with performance targets (P95 < 200ms)
  - Embedding/vector similarity infrastructure (PGVector or similar)

### Goals and Background Context

#### Goals

1. **Lower friction for new/light users** by providing immediate value after each paragraph written
2. **Create instant payoff loop** - one useful suggestion per completed paragraph (tasks, connections, or relationship nudges)
3. **Build durable structure over time** through accumulated tasks, reminders, entity tracking, and keyword patterns
4. **Enrich long-term Ontology insights** by connecting micro-actions (suggestions accepted) to macro-patterns (Values, Beliefs, Aims)
5. **Maintain system integrity** while adding complex NLP/AI features without degrading existing journal performance
6. **Establish temporal + cumulative analytics** showing both "what's on my mind lately" (weekly) and "who am I" (all-time)

#### Background Context

**Problem:** New and light users currently feel little immediate payoff from journaling. Insights only accrue after significant writing volume (20+ notes for ontology extraction). This creates a cold-start problem where users must invest substantial effort before seeing value.

**Solution:** Create a continuum of payoff from instant (paragraph suggestions) to near-term (daily task management) to long-term (ontology + keyword identity reflection). Each paragraph written now returns concrete, actionable feedback rather than requiring users to wait for batch processing.

**Consolidation Rationale:** Issues #25 and #48 share critical technical infrastructure:
- Both require **term/keyword extraction** with stop word filtering and stemming
- Both need **temporal frequency tracking** (weekly deltas for #48, all-time for #25)
- Both benefit from **entity recognition** (people, projects, values, domains)
- Both use **semantic similarity** (embeddings for suggestions, keyword clustering)

Building separately would duplicate this infrastructure. A unified approach creates synergy: paragraph-level term extraction feeds both real-time suggestions AND weekly/all-time analytics.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-10-19 | 1.0 | Initial brownfield PRD created from consolidated Issues #25 + #48 | BMad Master |

---

## Requirements

### Functional Requirements

**FR1:** System shall detect paragraph boundaries in journal editor based on blank line detection or Enter + 1.2s idle time

**FR2:** System shall extract and tokenize text from completed paragraphs using lightweight NLP (not LLM-based for performance)

**FR3:** System shall perform named entity recognition (NER) on paragraph text to identify people, organizations, projects, and values

**FR4:** System shall generate ONE suggestion card per paragraph when confidence score ≥ threshold, selecting from: next step (actionable task), person nudge (relationship follow-up), or link suggestion (connection to existing note/theme)

**FR5:** System shall display suggestion cards with two-button UI (Add/Later) and one-line plain English rationale for "why" this suggestion

**FR6:** System shall achieve P95 latency < 200ms for paragraph suggestion generation (no LLM per paragraph, rules + NER + embeddings only)

**FR7:** Users shall be able to create tasks and reminders using natural language in journal entries (e.g., "remind me in 10 days", "next Fri 8a", "every Mon")

**FR8:** System shall parse natural language dates using Chrono/duckling-like parser supporting relative ("in 10 days"), absolute ("next Fri 8a"), and recurring ("every Mon") formats

**FR9:** System shall display "Today Header" at top of daily journal entry showing: due tasks (max 5), one overdue item, one upcoming item, one C3 suggestion

**FR10:** Users shall be able to mark tasks as Done or Snooze inline from Today Header cards

**FR11:** System shall implement midnight/first-open rollover logic to move unfinished tasks forward with one-line audit trail

**FR12:** System shall generate Weekly Snapshot on first open each week showing: completed tasks (grouped by project/person), slipped tasks (moved ≥2 times or >7 days late), focus suggestion (one active project with rising centrality), rising themes (top Δ term counts vs prior week)

**FR13:** Users shall be able to export Weekly Snapshot to Markdown format

**FR14:** System shall maintain term frequency tracking with timestamps supporting both all-time counts (for Keywords) and weekly deltas (for Rising Themes)

**FR15:** System shall display weighted Keywords section on Ontology page beneath Beliefs/Values/Goals cards, with visual weighting by frequency (size, opacity, or color intensity)

**FR16:** System shall update keywords automatically as user creates new notes/entries without manual refresh

**FR17:** System shall display C3 progress bars (Self, Others, Greater) providing quiet feedback that updates as user writes

**FR18:** System shall calculate C3 scores based on: Self (value-aligned paragraphs/tasks rolling 7-day), Others (positive people mentions × recency × connection degree), Greater (paragraphs/tasks mapped to domains: nature/service/faith/art/learning)

**FR19:** System shall support clickable keywords that filter/navigate to related notes and weekly snapshots (future enhancement placeholder)

**FR20:** System shall throttle pasted text processing to first 3 paragraphs with queued processing for remainder to avoid overwhelming suggestion system

### Non-Functional Requirements

**NFR1:** Paragraph suggestion API shall maintain P95 response time < 200ms under normal load (1-5 concurrent users)

**NFR2:** Today Header shall load in < 300ms including database queries for tasks/reminders

**NFR3:** System shall embed each paragraph exactly once using content hash caching to avoid redundant processing

**NFR4:** System shall use ANN (Approximate Nearest Neighbor) index (PGVector/FAISS) for similarity searches to maintain performance with growing corpus

**NFR5:** System shall maintain existing journal editor performance characteristics - no perceptible latency increase when typing

**NFR6:** Database migrations shall be backward compatible, allowing rollback without data loss

**NFR7:** System shall handle 100+ notes and 500+ journal entries efficiently for keyword/analytics computation

**NFR8:** All NLP processing shall happen server-side (Next.js API routes). OpenAI Embeddings API may be used for paragraph embeddings with strict content-hash caching and privacy controls (user data encrypted in transit, not retained by OpenAI per API terms). Local embedding alternatives (sentence-transformers) acceptable with performance tradeoffs.

**NFR9:** System shall gracefully degrade when suggestion confidence is low - show nothing rather than poor suggestions

**NFR10:** Weekly Snapshot generation shall complete in < 5 seconds for users with 1000+ entries

### Compatibility Requirements

**CR1: Existing Journal Editor Compatibility** - New paragraph detection must not interfere with existing typing/editing experience. No changes to core contentEditable behavior in SimpleRichEditor component.

**CR2: Database Schema Backward Compatibility** - New tables (tasks, reminders, entities, term_frequencies, meters_daily) must not break existing Supabase RLS policies or queries. Existing `notes` table (unified schema with `note_type` discriminator: 'journal-entry', 'reflection', 'ontology-value', 'ontology-belief', 'ontology-aim', 'custom') and `links` table remain unchanged except for optional new columns. **Note:** No separate `journal_entries` table exists—journal entries are stored as `notes` with `note_type = 'journal-entry'` per migration 20250930000000.

**CR3: UI/UX Design System Consistency** - All new UI components (suggestion cards, Today Header, Weekly Snapshot, Keywords section, C3 bars) must follow shadcn/ui Notebook theme patterns and use existing component primitives.

**CR4: OpenAI API Integration Compatibility** - Suggestion system must coexist with existing GPT-5-mini ontology extraction without interfering with batch analysis workflows or exceeding API rate limits.

**CR5: Vercel Deployment Compatibility** - New API routes must deploy as serverless functions within Vercel's execution time limits (10s hobby, 60s pro). No long-running processes.

---

## User Interface Enhancement Goals

### Integration with Existing UI

**Design System:** All new components will use shadcn/ui primitives following the Notebook theme aesthetic (cream backgrounds, serif typography, subtle borders).

**Component Reuse:**
- Suggestion cards → Similar pattern to existing "Make Note" popup (see `SimpleRichEditor.tsx` line ~200)
- Today Header → Card-based layout like Ontology page cards
- Weekly Snapshot → Markdown export similar to journal entry export
- Keywords section → Card grid layout matching Values/Beliefs/Aims cards on Ontology page
- C3 progress bars → Subtle, always-visible UI in sidebar or header (TBD with user)

**Interaction Patterns:**
- Two-button actions (Add/Later, Done/Snooze) consistent with existing "Save/Cancel" patterns
- Inline editing for task snoozing (similar to note editing)
- Click-to-navigate for keywords/links (existing hyperlink behavior)

### Modified/New Screens and Views

**Modified Screens:**
1. **Journal Stream Page** (`/src/app/page.tsx`)
   - Add Today Header component at top of daily entry
   - Add paragraph boundary detection + suggestion card overlay in editor
   - Add starter paragraph prompt (gentle, one box) for empty entries

2. **Ontology Page** (`/src/app/ontology/page.tsx`)
   - Add Keywords section beneath existing Beliefs/Values/Goals cards
   - Add C3 progress bars in sidebar (minimal visual prominence)

**New Screens:**
3. **Weekly Snapshot Modal/Page**
   - Triggered on first open each week
   - Displays done/slipped/focus/rising themes
   - Export to Markdown button

**New Components:**
4. **Suggestion Card Overlay** (journal editor)
5. **Today Header Component** (daily tasks/reminders)
6. **Keywords Visualization Component** (weighted tag cloud or list)
7. **C3 Progress Bars Component** (Self/Others/Greater feedback)
8. **Weekly Snapshot Component** (analytics summary)

### UI Consistency Requirements

**Visual Consistency:**
- Use existing color palette (cream backgrounds, dark text, subtle accent colors)
- Match existing card shadow/border styles from Ontology cards
- Use Lucide icons consistent with existing UI iconography
- Maintain existing typography hierarchy (serif for content, sans-serif for UI labels)

**Interaction Consistency:**
- Keyboard shortcuts follow existing patterns (Escape to dismiss, Enter to confirm)
- Loading states use existing spinner/skeleton patterns
- Error states use existing toast notification system (sonner)
- Animations match existing subtle transitions (no jarring motion)

**Accessibility:**
- All interactive elements keyboard navigable
- ARIA labels for screen readers
- Sufficient color contrast for WCAG AA compliance
- Focus indicators visible and clear

---

## Technical Constraints and Integration Requirements

### Existing Technology Stack

**Languages:** TypeScript ^5, SQL (PostgreSQL 17)
**Frontend Framework:** Next.js 15.5.3 (App Router), React 19.1.0, TailwindCSS ^4
**Backend/Database:** Supabase (PostgreSQL, Auth, RLS policies), `@supabase/supabase-js` ^2.57.x, `@supabase/ssr`
**UI Components:** Radix UI primitives, shadcn/ui, Lucide Icons, CMDK, clsx, cva, sonner
**AI/ML:** OpenAI API (GPT-5-mini for ontology extraction)
**Build/Deploy:** Turbopack (dev/build), Vercel (serverless functions)
**Testing:** Playwright ^1.55 for E2E tests

**Constraints:**
- Must use Supabase for all data persistence (no external databases)
- Must deploy on Vercel (serverless architecture, no persistent servers)
- Must use existing OpenAI account/API keys (watch rate limits)
- Must maintain RLS policies for all user data (multi-tenant security)

### Integration Approach

**Database Integration Strategy:**
- **New Tables:** Create `tasks`, `reminders`, `entities`, `term_frequencies`, `links` (enhancement to existing), `meters_daily` with proper RLS policies
- **Schema Extensions:** Add optional `metadata` JSONB column to existing `notes` table if needed for entity associations
- **Migration Strategy:** Use Supabase migrations with rollback scripts, test on dev environment first
- **Indexing:** Add indexes for `term_frequencies.user_id + term`, `tasks.user_id + due_at`, `entities.user_id + type` for query performance

**API Integration Strategy:**
- **New API Routes:**
  - `POST /api/suggestions/paragraph` - Generate suggestion card (P95 < 200ms target)
  - `POST /api/tasks/parse` - Parse natural language task/reminder
  - `GET /api/tasks/today` - Fetch Today Header data (< 300ms target)
  - `GET /api/analytics/weekly` - Generate Weekly Snapshot
  - `GET /api/keywords/all-time` - Fetch weighted keywords for Ontology page
  - `POST /api/metrics/c3` - Update C3 progress bars
- **Rate Limiting:** Implement per-user rate limits (e.g., 30 suggestions/min) to prevent abuse
- **Caching Strategy:** Use paragraph content hash to cache embeddings, term extraction results
- **Error Handling:** Graceful degradation - if suggestion API fails, journal editor continues working normally

**Frontend Integration Strategy:**
- **Editor Modifications:** Add paragraph boundary detection to `SimpleRichEditor.tsx` without breaking existing functionality
  - Use `MutationObserver` or `onInput` event with debouncing (1.2s idle time)
  - Maintain existing selection/formatting behavior
  - Test extensively with existing E2E Playwright tests
- **State Management:** Use React Context or Zustand for suggestion card state, task list state (avoid prop drilling)
- **Real-time Updates:** Use Supabase Realtime subscriptions for Today Header task updates (when tasks marked done by user)
- **Component Isolation:** Build new components in `/src/components/intelligence/` directory to avoid polluting existing structure

**Testing Integration Strategy:**
- **Unit Tests:** Vitest for NLP utilities (term extraction, date parsing, scoring algorithms) - lightweight alternative to Jest
- **Integration Tests:** Playwright for suggestion card flow, task creation, Today Header interactions
- **Performance Tests:** Lighthouse CI for page metrics + custom profiling logger for typing latency (render/update times on suggestion display)
- **Manual Testing Checklist:**
  - Paragraph detection accuracy (blank lines, idle time)
  - Suggestion quality (relevance, confidence threshold)
  - Task parsing coverage (relative, absolute, recurring dates)
  - Today Header rollover logic (midnight transition)
  - Keywords visual weighting accuracy

### Code Organization and Standards

**File Structure Approach:**
```
/src
  /components
    /intelligence          # New directory for content intelligence features
      /SuggestionCard.tsx
      /TodayHeader.tsx
      /KeywordsSection.tsx
      /C3ProgressBars.tsx
      /WeeklySnapshot.tsx
  /app
    /api
      /suggestions
        /paragraph/route.ts
      /tasks
        /parse/route.ts
        /today/route.ts
      /analytics
        /weekly/route.ts
      /keywords
        /all-time/route.ts
      /metrics
        /c3/route.ts
  /utils
    /nlp                   # New directory for NLP utilities
      /termExtraction.ts   # Tokenization, stop words, stemming
      /entityRecognition.ts # NER for people/projects/values
      /dateParser.ts       # Natural language date parsing
      /embeddings.ts       # Paragraph embedding generation
      /scoring.ts          # Suggestion confidence scoring
  /lib
    /db
      /tasks.ts            # Task/reminder CRUD operations
      /entities.ts         # Entity tracking CRUD
      /termFrequencies.ts  # Keyword/term tracking CRUD
```

**Naming Conventions:**
- Use existing camelCase for functions, PascalCase for components
- Database tables: snake_case (Supabase convention)
- API routes: kebab-case directories, route.ts files (Next.js App Router pattern)

**Coding Standards:**
- Follow existing ESLint config (`eslint-config-next`)
- Use TypeScript strict mode with proper type definitions
- Prefer functional components with hooks (no class components)
- Use `clsx` and `tailwind-merge` via `cn()` utility for className composition
- Document complex NLP algorithms with inline comments + JSDoc
- Keep API route handlers under 200 lines (extract logic to `/utils` or `/lib`)

**Documentation Standards:**
- Update `docs/architecture/project-structure.md` with new directories
- Create `docs/nlp-pipeline.md` documenting term extraction, scoring algorithms
- Add JSDoc comments to all public NLP utility functions
- Include example usage in comments for complex APIs (date parser, scoring)

### Deployment and Operations

**Build Process Integration:**
- New API routes automatically built as Vercel serverless functions (no changes needed)
- NLP utilities bundled into serverless function code (watch bundle size - Vercel 50MB limit)
- Database migrations run manually via Supabase CLI before deploying PR preview
- Test on Vercel PR preview deployment before merging (per CLAUDE.md workflow)

**Deployment Strategy:**
1. Create feature branch (`content-intelligence-system`)
2. Implement in phases (6 stories, see Epic Structure below)
3. Each story = separate PR with Vercel preview testing
4. Database migrations included in PR with rollback scripts
5. Merge to `dev` branch first for integration testing on dev environment
6. After validation on dev, create PR to `main` for production release

**Monitoring and Logging:**
- Add Vercel Analytics tracking for suggestion card acceptance rate
- Log suggestion API latency (P50, P95, P99) to Vercel Logs
- Track keyword computation time for performance monitoring
- Monitor OpenAI API usage to avoid unexpected costs
- Set up Supabase Dashboard alerts for failed RLS policy checks

**Configuration Management:**
- Store OpenAI API keys in Vercel environment variables (existing pattern)
- Add new env vars:
  - `SUGGESTION_CONFIDENCE_THRESHOLD` (default 0.5)
  - `PARAGRAPH_IDLE_TIMEOUT_MS` (default 1200)
  - `MAX_SUGGESTIONS_PER_MINUTE` (default 30)
  - `ENABLE_C3_TRACKING` (feature flag, default false for phased rollout)
- Use Supabase environment for database connection (existing pattern)

### Risk Assessment and Mitigation

**Technical Risks:**

1. **Performance Degradation in Journal Editor**
   - *Risk:* Paragraph detection + suggestion API calls slow down typing experience
   - *Mitigation:*
     - Debounce paragraph detection (1.2s idle, not on every keystroke)
     - Make suggestion API non-blocking (fire-and-forget, display when ready)
     - Cache embeddings aggressively by content hash
     - Set strict P95 < 200ms SLA, monitor in production, rollback if exceeded

2. **NLP Accuracy - Poor Suggestion Quality**
   - *Risk:* Low-confidence suggestions annoy users, erode trust in AI features
   - *Mitigation:*
     - Use confidence threshold (don't show suggestions below 0.5 score)
     - A/B test threshold values with early users
     - Provide "Later" button to dismiss suggestions (collect feedback)
     - Track acceptance rate metric - if <20%, re-tune scoring algorithm

3. **Database Query Performance at Scale**
   - *Risk:* Term frequency queries, Today Header aggregations slow down with 1000+ entries
   - *Mitigation:*
     - Add database indexes on critical query columns
     - Use incremental updates (update term counts on write, not batch recompute)
     - Implement query result caching (Redis if needed, or Vercel KV)
     - Load test with synthetic data (5000 entries, 500 tasks)

4. **Serverless Function Bundle Size**
   - *Risk:* NLP libraries (tokenizers, stemmers) exceed Vercel 50MB function limit
   - *Mitigation:*
     - Use lightweight libraries (compromise-nlp vs spaCy)
     - Tree-shake unused NLP features
     - Split into multiple API routes if needed (separate functions)
     - Monitor bundle size in CI/CD pipeline

**Integration Risks:**

1. **Breaking Existing Journal Editor**
   - *Risk:* Paragraph detection interferes with cursor position, text selection, formatting
   - *Mitigation:*
     - Thoroughly test with existing Playwright E2E test suite
     - Add new E2E tests for suggestion flow before modifying editor
     - Use feature flag to disable suggestions in production if issues arise
     - Code review focus on editor changes (high-risk area)

2. **RLS Policy Conflicts**
   - *Risk:* New tables (tasks, entities) leak data between users if RLS policies incorrect
   - *Mitigation:*
     - Copy existing RLS pattern from `notes` table (user_id column check)
     - Manual security audit of all RLS policies before production deploy
     - Test with multiple test users in dev environment
     - Supabase Dashboard RLS policy checker review

3. **OpenAI API Rate Limits**
   - *Risk:* Embedding generation for suggestions hits rate limits, blocks journal usage
   - *Mitigation:*
     - Embeddings are optional (fall back to keyword similarity if embedding fails)
     - Implement client-side rate limiting (max 30 suggestions/minute per user)
     - Cache embeddings aggressively (reuse for duplicate text)
     - Monitor OpenAI usage dashboard, set up billing alerts

**Deployment Risks:**

1. **Database Migration Failure**
   - *Risk:* Migration fails in production, blocking app access
   - *Mitigation:*
     - Test migrations on dev environment first (per CLAUDE.md workflow)
     - Write rollback migration scripts before deploying
     - Use Supabase migration versioning (applied in order)
     - Deploy during low-traffic hours, have rollback plan ready

2. **Vercel Preview URL Testing Incomplete**
   - *Risk:* Edge cases not caught in preview testing, break in production
   - *Mitigation:*
     - Comprehensive manual testing checklist for each story PR
     - Test with multiple browsers (Chrome, Safari, Firefox)
     - Test with different user data volumes (0 notes, 10 notes, 100 notes)
     - Peer review by user before merging to main

**Mitigation Strategies Summary:**
- **Phased Rollout:** Feature flags for C3 tracking, suggestion cards (enable gradually)
- **Monitoring:** Track P95 latency, acceptance rates, error rates in Vercel Analytics
- **Rollback Plan:** Each story PR includes rollback migration + feature flag disable
- **Testing Rigor:** E2E tests, manual preview testing, dev environment validation before production

---

## Epic and Story Structure

### Epic Approach

**Epic Structure Decision:** Single comprehensive epic titled **"Content Intelligence & Feedback System"**

**Rationale:** Despite the scope of Issues #25 + #48, these features share a unified technical foundation (NLP pipeline, term tracking, entity recognition) and user experience flow (write → feedback → structure). Splitting into multiple epics would:
- Duplicate infrastructure work (term extraction built twice)
- Create awkward dependencies (Keywords section depends on term tracking from Suggestions)
- Fragment the user experience (suggestions without analytics feel incomplete)

A single epic with 6 sequenced stories allows incremental delivery while maintaining architectural coherence. Each story builds on the previous, enabling early validation of core tech (NLP pipeline in Story 1) before expanding to full feature set.

---

## Epic 1: Content Intelligence & Feedback System

**Epic Goal:** Transform Signum from batch-only AI insights (ontology extraction) to a real-time feedback system that provides immediate value per paragraph, daily task management, and temporal + identity analytics, while enriching long-term ontology understanding.

**Integration Requirements:**
- Must not degrade existing journal editor typing performance
- Must coexist with existing GPT-5-mini ontology extraction workflow
- Must maintain Supabase RLS security for all new data tables
- Must follow shadcn/ui design system and existing component patterns
- Must achieve P95 < 200ms for suggestion API, < 300ms for Today Header

---

### Story 1.1: Core NLP Infrastructure & Database Schema

**As a** system architect,
**I want** a shared NLP pipeline and database schema for term extraction, entity recognition, and temporal tracking,
**so that** all subsequent stories (suggestions, analytics, keywords) can use a unified, performant foundation without duplication.

#### Acceptance Criteria

1. **NLP Utilities Implemented:**
   - Term extraction function (tokenization, stop word filtering, stemming) in `/src/utils/nlp/termExtraction.ts`
   - Entity recognition function (NER for people, organizations, values, projects) in `/src/utils/nlp/entityRecognition.ts`
   - Paragraph embedding generation function (OpenAI Embeddings API or local) in `/src/utils/nlp/embeddings.ts`
   - Content hash utility for caching in `/src/utils/nlp/caching.ts`

2. **Database Schema Created:**
   - `term_frequencies` table:
     - Columns: `id`, `user_id`, `term`, `count_alltime`, `count_this_week`, `count_last_week`, `last_updated`, `created_at`
     - Unique constraint: `UNIQUE(user_id, term)` for upsert operations
     - Index: `CREATE INDEX idx_term_freq_user_term ON term_frequencies(user_id, term)`
   - `entities` table:
     - Columns: `id`, `user_id`, `type`, `name`, `first_seen`, `last_seen`, `sentiment_avg`, `centrality`
     - Type constraint: `CHECK (type IN ('person', 'project', 'value', 'domain', 'note'))`
     - Index: `CREATE INDEX idx_entities_user_type ON entities(user_id, type)`
     - Note: `centrality` computed as rolling mention count weighted by recency (define formula in Story 1.2)
   - `tasks` table:
     - Columns: `id`, `user_id`, `title`, `status`, `due_at`, `remind_at`, `rrule`, `est_minutes`, `priority`, `source_entry_id`, `source_para_anchor`, `person_id`, `project_id`, `value_id`, `metadata`, `snooze_count`, `created_at`, `completed_at`
     - Status constraint: `CHECK (status IN ('pending', 'completed', 'cancelled'))`
     - Metadata: `metadata JSONB NOT NULL DEFAULT '{}'` for rollover audit trail
     - Foreign keys: `source_entry_id → notes(id)` (expects `note_type = 'journal-entry'`), `person_id → entities(id)`, `project_id → entities(id)`, `value_id → notes(id)` (expects `note_type IN ('ontology-value', 'ontology-belief', 'ontology-aim')`)
     - Index: `CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_at) WHERE status != 'completed'`
   - `reminders` table:
     - Columns: `id`, `user_id`, `task_id`, `rule_type`, `rrule`, `snooze_until`, `created_at`
     - Rule type constraint: `CHECK (rule_type IN ('oneoff', 'rrule'))`
     - RRULE follows RFC 5545 standard
     - Foreign key: `task_id → tasks(id) ON DELETE CASCADE`
   - `meters_daily` table:
     - Columns: `user_id`, `date`, `self_score`, `others_score`, `greater_score`, `updated_at`
     - Composite primary key: `PRIMARY KEY (user_id, date)` to avoid duplicates
   - **PGVector Extension:**
     - Enable pgvector extension in Supabase: `CREATE EXTENSION IF NOT EXISTS vector`
     - Add `paragraph_embeddings` table: `id`, `user_id`, `content_hash`, `embedding vector(1536)`, `created_at`
     - Index: `CREATE INDEX ON paragraph_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
   - All tables have RLS policies matching existing `notes` table pattern (user_id check)
   - Include concrete RLS policy examples in migration (e.g., `CREATE POLICY "Users can only access own tasks" ON tasks FOR ALL USING (auth.uid() = user_id)`)

3. **CRUD Operations:**
   - Task CRUD functions in `/src/lib/db/tasks.ts` (create, read, update, delete, markComplete, snooze)
   - Entity CRUD functions in `/src/lib/db/entities.ts` (upsert entity, increment mention count, update sentiment)
   - Term frequency CRUD functions in `/src/lib/db/termFrequencies.ts` (increment count, get top N terms, get weekly delta)

4. **Testing:**
   - Unit tests for term extraction (handles edge cases: empty text, special characters, multiple languages)
   - Unit tests for entity recognition (identifies person names, organizations)
   - Integration test: write paragraph → extract terms → store in database → verify counts
   - Manual RLS policy test: create entities/tasks as User A, verify User B cannot read them

#### Integration Verification

**IV1:** Existing journal entry creation flow unaffected - users can still create/edit entries (stored as `notes` with `note_type = 'journal-entry'`) without errors
**IV2:** Existing ontology extraction (GPT-5-mini batch analysis) still functions - no conflicts with new NLP utilities
**IV3:** Database queries for existing `notes` table (all note types) and `links` table maintain same performance (< 100ms P95)

---

### Story 1.2: Natural Language Task/Reminder Parsing

**As a** journaling user,
**I want** to write "remind me in 10 days to call Mom" in my journal and have it automatically create a reminder,
**so that** I can capture tasks naturally without leaving my writing flow.

#### Acceptance Criteria

1. **Date Parser Utility:**
   - Date parsing function in `/src/utils/nlp/dateParser.ts`
   - Supports relative dates: "in 10 days", "tomorrow", "next week"
   - Supports absolute dates: "next Fri 8a", "Oct 25", "2025-11-01"
   - Supports recurring dates: "every Mon", "daily", "every 2 weeks"
   - Returns `{ dueAt: Date, rrule?: string }` or `null` if no date detected
   - Uses lightweight library (chrono-node or similar)

2. **Task Detection in Paragraphs:**
   - Task detection function in `/src/utils/nlp/taskDetection.ts`
   - Identifies task keywords: "remind me", "todo", "task", "need to", "should", "must"
   - Extracts task title (text between keyword and date phrase)
   - Calls date parser to extract due date
   - Returns `{ title: string, dueAt: Date, rrule?: string }` or `null`

3. **Task Creation API:**
   - `POST /api/tasks/parse` endpoint created
   - Accepts `{ paragraphText: string, userId: string, entryId: string }`
   - Calls task detection utility
   - Creates task record in `tasks` table with `source_entry_id` linking to journal entry
   - Creates reminder record in `reminders` table if due date detected
   - Returns created task: `{ id: string, title: string, dueAt: Date }`

4. **Inline Task Indication (Optional MVP):**
   - After task created, highlight task text in journal editor (subtle background color)
   - Add `data-task-id` attribute to task span (similar to existing link implementation)
   - Clicking task text opens task detail popover (defer full UI to Story 1.4)

5. **Unit Tests:**
   - Test date parser with 20+ date format variations
   - Test task detection with various sentence structures
   - Test edge cases: no date, multiple dates, ambiguous phrasing

#### Integration Verification

**IV1:** Existing "Make Note" text selection flow unaffected - users can still create notes from highlights
**IV2:** Journal entry saving still works - task creation happens asynchronously, doesn't block save
**IV3:** No errors in browser console when writing paragraphs without task keywords

---

### Story 1.3: Paragraph Detection & Suggestion Card UI (Task Suggestions Only)

**As a** journaling user,
**I want** to receive a task suggestion after I finish writing a paragraph that mentions an action,
**so that** I get immediate value from my journaling without waiting for batch processing.

**Note:** This story focuses on **task-only suggestions** to validate the core feedback loop. Person/link suggestions are deferred to a follow-up story after acceptance rates are validated.

#### Acceptance Criteria

1. **Paragraph Boundary Detection:**
   - `SimpleRichEditor.tsx` modified to detect paragraph completion via blank line or Enter + 1.2s idle
   - Detection uses debounced `onInput` handler (1200ms debounce, non-blocking)
   - Explicitly define conditions: trigger on `\n\n` (double newline) OR single `\n` + 1.2s no input (avoids soft line breaks)
   - Pasted text blocks: segment by `\n\n`, process first 3 paragraphs immediately, queue remainder for async processing
   - Extracts paragraph text (plain text via `textContent`, no HTML) when boundary detected
   - Does NOT interfere with cursor position, text selection, or existing formatting (preserve current contentEditable model)

2. **Suggestion API Route (Task-Only Initial Scope):**
   - `POST /api/suggestions/paragraph` endpoint created
   - Accepts `{ paragraphText: string, userId: string, entryId: string }`
   - Calls NLP utilities: term extraction, entity recognition (NO embeddings in MVP - defer to phase 2)
   - **Simplified Scoring for Task Suggestions:**
     - Intent detection: rule-based matching for action verbs ("should", "need to", "want to", "plan to")
     - Recency boost: check if paragraph mentions entities seen in last 7 days
     - Confidence threshold: ≥ 0.5 to display suggestion
   - Returns task suggestion if confidence ≥ 0.5, else returns `null`
   - Response format: `{ type: 'task', title: string, rationale: string, confidence: number }`
   - Fallback on timeout/error: return `null` (graceful degradation)
   - Server-side rate limiting: max 30 suggestions per user per minute (store counter in Supabase with 60s TTL or Vercel KV)

3. **Suggestion Card Component:**
   - `SuggestionCard.tsx` component in `/src/components/intelligence/`
   - Displays suggestion `title` and `rationale` in shadcn/ui Card with Notebook theme styling
   - Two buttons: "Add" (primary), "Later" (secondary)
   - "Add" button calls `/api/tasks/parse` from Story 1.2 with embedded date in `paragraphText`
   - "Later" button dismisses card, logs dismissal for analytics
   - Card appears as overlay near paragraph cursor position (non-modal)
   - Card auto-dismisses after 30 seconds if no interaction

4. **Acceptance Rate Tracking:**
   - Track "Add" vs "Later" button clicks in Vercel Analytics
   - Store suggestion logs in `suggestions_log` table (optional: `id`, `user_id`, `suggestion_type`, `accepted`, `created_at`)

#### Integration Verification

**IV1:** Existing journal editor functionality intact - formatting toolbar, text selection, "Make Note" popup all work
**IV2:** Typing performance unchanged - no perceptible lag when typing (Lighthouse performance score ≥90)
**IV3:** Existing E2E tests pass - no regressions in journal entry creation flow

#### Future Enhancements (Deferred)

- **Person/Link Suggestions:** Add after task suggestion acceptance rate ≥ 25%
- **Embedding-Based Similarity:** Add PGVector similarity scoring after validating keyword-based approach
- **Suggestion Calibration Controls:** User settings for frequency, opt-out, quiet mode (see Recommended Follow-Up Stories)

---

### Story 1.4: Today Header & Task Management UI

**As a** journaling user,
**I want** to see my due tasks at the top of today's journal entry when I open the app,
**so that** I'm reminded of commitments without leaving my journaling context.

#### Acceptance Criteria

1. **Today Header Component:**
   - `TodayHeader.tsx` component in `/src/components/intelligence/`
   - Displays at top of journal stream page (above today's entry)
   - Shows 4 sections: Due Today (max 5 tasks), Overdue (1 task), Upcoming (1 task), C3 Suggestion (1 item)
   - Each task card shows: title, due time (if specified), two buttons (Done/Snooze)
   - Styled with shadcn/ui Card, matches Notebook theme

2. **Today Header Data API:**
   - `GET /api/tasks/today` endpoint created
   - Accepts `userId` from auth session
   - Queries `tasks` table for:
     - Due today: `due_at >= today 00:00 AND due_at < tomorrow 00:00 AND status != 'completed'` (limit 5)
     - Overdue: `due_at < today 00:00 AND status != 'completed'` (limit 1, oldest first)
     - Upcoming: `due_at >= tomorrow 00:00 AND due_at < tomorrow + 7 days AND status != 'completed'` (limit 1, soonest first)
   - Returns `{ dueToday: Task[], overdue: Task[], upcoming: Task[] }`
   - Achieves < 300ms P95 latency

3. **Task Actions:**
   - "Done" button calls `PATCH /api/tasks/:id` with `{ status: 'completed', completedAt: now }`
   - "Snooze" button shows inline date picker (1 day, 3 days, 1 week, custom)
   - Snoozing calls `PATCH /api/tasks/:id` with `{ dueAt: newDate, snoozeCount: snoozeCount + 1 }`
   - UI updates optimistically (immediate feedback), rolls back on error

4. **Rollover Logic:**
   - Nightly cron job (Vercel Cron) or first-open trigger moves unfinished tasks
   - Unfinished tasks from yesterday get audit note: "Rolled over from [date]"
   - Audit stored in `tasks.metadata` JSONB column: `{ rollovers: [{ date: '2025-10-18', reason: 'not completed' }] }`

5. **Real-time Updates:**
   - Use Supabase Realtime subscription on `tasks` table
   - When task marked done by user, Today Header updates immediately (no page refresh)

6. **Empty State:**
   - If no due tasks, show encouraging message: "No tasks due today. Enjoy your journaling!"
   - Show C3 suggestion or starter prompt instead

#### Integration Verification

**IV1:** Journal entry creation flow unaffected - users can still write entries with Today Header present
**IV2:** Page load performance acceptable - Today Header adds < 300ms to initial page render
**IV3:** Existing journal stream scroll behavior maintained - header doesn't interfere with scrolling to past entries

---

### Story 1.5: Weekly Snapshot & Rising Themes Analytics

**As a** journaling user,
**I want** to see a weekly summary of what I accomplished, what slipped, and what themes are rising,
**so that** I gain insight into my patterns and priorities without manual review.

#### Acceptance Criteria

1. **Weekly Snapshot Component:**
   - `WeeklySnapshot.tsx` component in `/src/components/intelligence/`
   - Displays modal/page on first open each Monday (detected via localStorage last-seen timestamp)
   - 4 sections: Done (completed tasks grouped by project/person), Slipped (tasks moved ≥2 times or >7 days late), Focus Next Week (one active project with rising centrality), Rising Themes (top Δ term counts vs prior week)

2. **Weekly Analytics API:**
   - `GET /api/analytics/weekly` endpoint created
   - Accepts `userId`, `weekStartDate` (defaults to last Monday)
   - Queries:
     - Done: `tasks WHERE status = 'completed' AND completed_at >= weekStart AND completed_at < weekEnd`
     - Slipped: `tasks WHERE snooze_count >= 2 OR (due_at < now - 7 days AND status != 'completed')`
     - Rising themes: `term_frequencies WHERE user_id = X` → calculate `delta = count_this_week - count_last_week` → top 5 by delta
     - Focus project: `entities WHERE type = 'project'` → order by centrality (mention count) → top 1
   - Returns `{ done: Task[], slipped: Task[], risingThemes: Term[], focusProject: Entity }`

3. **Weekly Rollover Job:**
   - Cron job (Vercel Cron or scheduled Edge Function) runs every Monday 00:00
   - Copies `count_this_week` → `count_last_week` for all term_frequencies records
   - Resets `count_this_week` to 0
   - Logs rollover in `weekly_rollover_log` table (audit trail)

4. **Markdown Export:**
   - "Export to Markdown" button on Weekly Snapshot modal
   - Generates markdown summary:
     ```markdown
     # Weekly Snapshot - Week of Oct 14, 2025

     ## ✅ Done (15 tasks)
     - **Work:** Finished proposal deck, reviewed PR #42
     - **Personal:** Called Mom, scheduled dentist

     ## ⚠️ Slipped (3 tasks)
     - "Update resume" (moved 3 times)
     - "Research vacation spots" (overdue 8 days)

     ## 🎯 Focus Next Week
     - **Project:** Launch campaign (mentioned 12 times this week)

     ## 📈 Rising Themes
     - "launch" (+8 mentions)
     - "design" (+5 mentions)
     - "feedback" (+4 mentions)
     ```
   - Copies to clipboard and/or downloads as `.md` file

5. **First-Open Detection:**
   - Check localStorage `lastWeeklySnapshotSeen` timestamp
   - If last seen < last Monday 00:00, show modal
   - Update timestamp after user dismisses modal

#### Integration Verification

**IV1:** Existing journal/notes pages unaffected - modal only appears once per week, can be dismissed
**IV2:** Performance acceptable - analytics query completes in < 5 seconds for users with 1000+ entries
**IV3:** No conflicts with existing Ontology page - both can coexist without data corruption

---

### Story 1.6: Keywords Visualization & C3 Progress Bars

**As a** reflective journaling user,
**I want** to see a weighted visualization of my all-time keywords on the Ontology page and subtle progress bars tracking my alignment with Self/Others/Greater,
**so that** I gain long-term identity insight and motivation to continue journaling.

#### Acceptance Criteria

1. **Keywords Section Component:**
   - `KeywordsSection.tsx` component in `/src/components/intelligence/`
   - Added to Ontology page (`/src/app/ontology/page.tsx`) beneath Beliefs/Values/Goals cards
   - Displays top 30 keywords weighted by `count_alltime` from `term_frequencies` table
   - Visual weighting options (user preference or default):
     - Option A: Tag cloud with font size proportional to count
     - Option B: Weighted list with color intensity gradient
     - Option C: Bar chart with horizontal bars
   - Keywords clickable (placeholder - future enhancement to filter notes)

2. **Keywords API:**
   - `GET /api/keywords/all-time` endpoint created
   - Accepts `userId`, optional `limit` (default 30)
   - Queries `term_frequencies WHERE user_id = X ORDER BY count_alltime DESC LIMIT 30`
   - Returns `{ keywords: [{ term: string, count: number, weight: number }] }`
   - Weight normalized 0-1 for UI rendering

3. **Auto-Update on Write:**
   - When paragraph processed (Story 1.2), increment `count_alltime` and `count_this_week` for extracted terms
   - Use upsert pattern: `INSERT ... ON CONFLICT (user_id, term) DO UPDATE SET count_alltime = count_alltime + 1`
   - Keywords section refetches data on page load (no real-time required, batch update acceptable)

4. **C3 Progress Bars Component:**
   - `C3ProgressBars.tsx` component in `/src/components/intelligence/`
   - Displays 3 horizontal progress bars: Self, Others, Greater
   - Positioned in sidebar or header (TBD with user - low visual prominence)
   - Each bar shows 0-100% fill based on rolling 7-day score
   - Tooltip on hover explains score calculation:
     - Self: "Value-aligned paragraphs written this week"
     - Others: "Positive mentions of people in your network"
     - Greater: "Contributions to nature, service, learning, art, faith"

5. **C3 Metrics Calculation:**
   - `POST /api/metrics/c3` endpoint (called after paragraph processed)
   - Calculates scores:
     - Self: count paragraphs with terms matching user's Values from `notes WHERE type = 'value'` (last 7 days)
     - Others: count positive sentiment mentions of `entities WHERE type = 'person'` (last 7 days, weighted by recency)
     - Greater: count paragraphs with domain keywords (nature, service, learning, art, faith) from predefined list
   - Stores daily score in `meters_daily` table
   - Returns `{ self: number, others: number, greater: number }` (0-100 scale)

6. **Performance:**
   - Keywords section loads in < 2 seconds
   - C3 bars update asynchronously (don't block page render)
   - Use SWR or React Query for caching/background revalidation

#### Integration Verification

**IV1:** Existing Ontology page loads normally - Beliefs/Values/Goals cards still render, Keywords section additive
**IV2:** No visual clutter - C3 bars subtle, not distracting from journaling experience
**IV3:** Keywords accurate - manual spot check that top keywords match actual writing patterns

---

## Story Dependencies & Sequencing

**Updated sequence (v1.3) - reordered to fix circular dependency:**

```
Story 1.1 (Infrastructure)
    ↓
Story 1.2 (Task Parsing) ← depends on 1.1 database schema (tasks table)
    ↓
Story 1.3 (Suggestions - Task-Only) ← depends on 1.1 NLP utilities, 1.2 API endpoint
    ↓
Story 1.4 (Today Header) ← depends on 1.2 task creation
    ↓
Story 1.5 (Weekly Snapshot) ← depends on 1.1 term tracking, 1.4 task completion data
    ↓
Story 1.6 (Keywords + C3) ← depends on 1.1 term tracking, 1.5 analytics foundation
```

**Original Epic Sequence (1.1-1.6):** 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6

**Recommended Phased Rollout (per Codex feedback):**

**Phase 1 (High Priority - Core Feedback Loop):**
1. Story 1.1: NLP Infrastructure
2. Story 1.2: Task Parsing
3. Story 1.3: Suggestions (Task-Only)
4. **Story 1.7: Calibration & Controls** ← **Ship early to build trust**

**Phase 2 (Medium Priority - Near-Term Reinforcement):**
5. Story 1.4: Today Header
6. Story 1.5: Weekly Snapshot
7. Story 1.8: Onboarding & Empty States

**Phase 3 (Lower Priority - Long-Term Identity):**
8. Story 1.6: Keywords + C3 (C3 behind feature flag, defer if Today Header/Weekly Snapshot adoption weak)
9. Story 1.9: Keyword Click-to-Filter
10. Story 1.10: Person/Link Suggestions (requires Story 1.3 acceptance ≥25%)
11. Story 1.11: Advanced Keyword Viz (requires Story 1.9 engagement ≥40%)

**Rationale for Early Calibration (Story 1.7):**
- Codex feedback: "Add calibration/controls soon after first two stories to sustain trust and reduce fatigue"
- Ships suggestion controls (frequency toggle, mute options) before Today Header
- Allows measurement of acceptance/dismissal baseline before expanding feature set
- Can ship Today Header (1.4) in parallel if needed, but calibration should not wait until after full epic

**v1.3 Change:** Swapped Stories 1.2 ↔ 1.3 to fix circular dependency (originally 1.2 was Suggestions, 1.3 was Task Parsing). New order ensures suggestions can call task parsing API.

---

## Definition of Done (Epic Level)

- ✅ All 6 stories completed with acceptance criteria met
- ✅ Existing journal editor functionality verified - no regressions in typing, formatting, note creation
- ✅ Performance targets met: P95 < 200ms for suggestions, < 300ms for Today Header, < 5s for Weekly Snapshot
- ✅ Integration verified on Vercel preview deployments for each story PR
- ✅ Database migrations tested on dev environment, rollback scripts ready
- ✅ Manual testing checklist completed:
  - [ ] Suggestion cards appear after paragraphs with >0.5 confidence
  - [ ] Task parsing handles 10+ date format variations correctly
  - [ ] Today Header shows due/overdue/upcoming tasks accurately
  - [ ] Weekly Snapshot displays done/slipped/rising themes correctly
  - [ ] Keywords section shows weighted visualization matching writing patterns
  - [ ] C3 progress bars update as user writes value-aligned content
- ✅ E2E Playwright tests added for:
  - [ ] Suggestion card acceptance flow
  - [ ] Task creation from natural language
  - [ ] Today Header task completion
  - [ ] Keywords section rendering
- ✅ Documentation updated:
  - [ ] `docs/architecture/project-structure.md` reflects new directories
  - [ ] `docs/nlp-pipeline.md` created documenting NLP algorithms
  - [ ] API routes documented in code comments (JSDoc)
- ✅ Acceptance rate ≥20% for suggestion cards (validate product-market fit)
- ✅ No increase in Vercel error rate or function timeouts
- ✅ No RLS policy violations (tested with multiple test users)
- ✅ User feedback collected on Weekly Snapshot value (informal survey)

---

## Success Metrics (Post-Launch)

**Engagement Metrics:**
- ≥30% of active users interact with suggestion cards weekly
- ≥50% of users create at least 1 task per week via natural language
- ≥40% of users view Today Header on days they journal

**Quality Metrics:**
- Suggestion acceptance rate ≥20% (indicates relevance)
- Task completion rate ≥60% for tasks created via NL parsing
- Weekly Snapshot export rate ≥10% (indicates value)

**Performance Metrics:**
- P95 suggestion API latency < 200ms maintained in production
- P95 Today Header load time < 300ms maintained in production
- No increase in journal editor page load time (baseline ~1.2s)

**Retention Impact:**
- 7-day retention ≥70% for users who accept ≥3 suggestions (vs ~50% baseline)
- 30-day retention ≥40% for users with ≥5 completed tasks (vs ~25% baseline)

---

## Open Questions - Proposed Defaults (Based on GPT-5 Review)

**These defaults can be overridden by user preference. Feedback welcome before Story Manager handoff.**

1. **C3 Progress Bars Placement:**
   - **Default:** Ontology page sidebar (minimal visual prominence)
   - **Future:** Add user setting to optionally show on journal view

2. **Suggestion Card Frequency:**
   - **Default:** Cap at 10 suggestions per day with per-session cooldown (prevent fatigue)
   - **Future:** Make user-configurable in settings

3. **Keywords Visualization Style:**
   - **Default:** Weighted list (accessible, compact, easier to scan than tag cloud)
   - **Future:** Add tag cloud as preference option in settings

4. **Weekly Snapshot Timing:**
   - **Default:** First open on Monday
   - **Future:** Add preference for custom start-of-week day once feature stable

5. **Task Management UI:**
   - **Default:** Keep journal-native only (no separate task list view)
   - **Condition:** Revisit dedicated tasks page if Today Header adoption >50% after 4 weeks

6. **Embedding Provider:**
   - **Default:** OpenAI Embeddings API (per NFR8 clarification) with strict content-hash caching
   - **Tradeoff Accepted:** Higher cold-path latency (200-500ms) mitigated by precomputation strategy
   - **Cost:** ~$0.0001 per paragraph (~$0.10 per 1000 paragraphs, manageable at current scale)
   - **Alternative:** Local sentence-transformers if privacy concerns override performance (requires Story 1.1 adjustment)

---

## Recommended Follow-Up Stories

Based on strategic feedback, these stories extend the core epic with calibration, controls, and enhancements. **Story 1.4 (Calibration) is high-priority and should ship soon after Stories 1.2-1.3 to build trust and reduce fatigue.**

### Story 1.7: Suggestion Calibration & User Controls

**Goal:** Build trust and reduce suggestion fatigue by giving users control over suggestion behavior.

**Scope:**
- User settings page: suggestion frequency (low/medium/high), opt-out toggle
- Feedback collection: thumbs up/down on suggestions (track acceptance by type)
- A/B test confidence thresholds (0.3, 0.5, 0.7) to optimize acceptance rate
- "Quiet mode" toggle to disable suggestions for focused writing sessions

**Success Criteria:**
- Reduced dismissal rate (from baseline after Story 1.3)
- User satisfaction survey shows ≥70% "helpful, not intrusive" rating

**Dependencies:** Story 1.3 (Suggestions - Task-Only) must be validated first

---

### Story 1.8: Onboarding & Empty States

**Goal:** Reduce surprise and set expectations for new users encountering suggestion cards and empty analytics views.

**Scope:**
- First-time explainer modal: "Signum now suggests tasks as you write. Dismiss or add as needed."
- Starter prompts for empty journal entries (gentle, ACT-inspired)
- Empty state designs for Today Header, Weekly Snapshot, Keywords section (show sample data)
- Progressive disclosure: explain C3 progress bars on first hover

**Success Criteria:**
- Reduced suggestion card dismissal rate for new users (vs. existing users)
- ≥60% of new users interact with at least 1 suggestion in first session

**Dependencies:** Story 1.3 (Suggestions), Story 1.4 (Today Header)

---

### Story 1.9: Keyword Click-to-Filter

**Goal:** Make Keywords section actionable by allowing users to filter journal entries by keyword.

**Scope:**
- Click any keyword → filter journal stream to entries containing that term
- Keyword filter UI: clear "X" button, show filtered count
- URL state: `/ontology?keyword=gratitude` for shareable/bookmarkable filters
- Performance: indexed keyword lookups (< 100ms for 1000+ entries)

**Success Criteria:**
- ≥30% of users who view Keywords section click on at least 1 keyword
- Average session depth increases when using keyword filters

**Dependencies:** Story 1.6 (Keywords section must exist first)

---

### Story 1.10: Person/Link Suggestions (Phase 2)

**Goal:** Expand suggestion types from task-only to person nudges and note connections.

**Prerequisites:** Story 1.3 task suggestion acceptance rate ≥ 25% validated in production

**Scope:**
- Person suggestions: detect person entity mentions, suggest follow-ups
- Link suggestions: add PGVector embedding similarity scoring for note connections
- Embedding-based scoring: enable `paragraph_embeddings` table, cache-first strategy
- UI updates: support 3 suggestion types (task, person, link) in SuggestionCard

**Success Criteria:**
- Combined acceptance rate ≥ 20% across all suggestion types
- Person suggestions show higher acceptance for entities mentioned in last 7 days

**Dependencies:** Story 1.1 (PGVector schema), Story 1.2 (Task parsing API), Story 1.3 (Suggestion infrastructure)

---

### Story 1.11: Advanced Keyword Visualizations

**Goal:** Add tag cloud, trend charts, and keyword co-occurrence graphs for power users.

**Prerequisites:** Story 1.9 (Click-to-filter) validated, Keywords section engagement ≥ 40%

**Scope:**
- Tag cloud visualization with font size based on frequency
- Trend charts: keyword frequency over time (weekly/monthly view)
- Co-occurrence graph: show related keywords mentioned together
- Export keywords as CSV for external analysis

**Success Criteria:**
- ≥15% of users who engage with Keywords section use advanced visualizations
- User feedback shows value for reflection/insight generation

**Dependencies:** Story 1.6 (Keywords section), Story 1.9 (Click-to-filter)

---

## Next Steps

1. **User Review:** Please review this PRD and confirm:
   - Epic scope aligns with your vision for Issues #25 + #48
   - Story sequence makes sense (1.1 → 1.6)
   - Acceptance criteria are clear and testable
   - Open questions answered (or defer to implementation)
   - Recommended follow-up stories prioritization

2. **Story Validation:** Stories 1.1-1.6 are now ready for development. Follow-up stories (1.7-1.11) should be prioritized based on:
   - Story 1.3 acceptance rate (≥25% threshold for Story 1.10)
   - Story 1.6 engagement (≥40% for Story 1.11)
   - User feedback on controls/onboarding needs (Stories 1.7-1.8)

3. **Development Workflow:** Follow 10-step PR-based workflow from CLAUDE.md for each story.

---

**End of Brownfield PRD (v1.3)**

**Version History:**
- v1.0: Initial PRD with 6 stories
- v1.1: Incorporated GPT-5 technical corrections (routes, NFRs, schema, testing)
- v1.2: Incorporated GPT-5-Codex schema consistency fixes (notes table references)
- v1.3: Reordered Stories 1.2 ↔ 1.3, trimmed Story 1.3 to task-only suggestions, added recommended follow-up stories
