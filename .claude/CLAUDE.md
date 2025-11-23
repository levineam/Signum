# Signum Project Instructions

# 🚨 MANDATORY PR-BASED WORKFLOW

This project uses PR-based deployment with auto-deploy to Vercel. You MUST follow this workflow for ALL changes.

## Workflow (MANDATORY)

1. **Create feature branch**: `git checkout -b story-X.X-description`
2. **Make changes & test locally**:
   - **UI/component changes**: `npm run dev:test` (fast iteration, no Supabase needed)
   - **Database changes**: Skip local testing, rely on Vercel preview
   - Verify functionality, run `npm run lint`
3. **Commit & push**: `git add [files] && git commit`, then `git push`
4. **Create PR**: `gh pr create` with description, test plan, screenshots. Apply appropriate labels (see GitHub Labels below).
5. **🚨 Codex review**: CI auto-comments `@codex review` after push. If not posted within ~30s, run manually: `gh pr comment [PR#] --body '@codex review'`
6. **Test on Vercel Preview**: Test thoroughly on preview URL
7. **User merges**: User reviews, approves, and merges (NOT Claude)

## Testing on Vercel Preview

**CRITICAL**: Test on Vercel preview before merging:
- API routes (OpenAI, Supabase, Stripe)
- Auth flows, RLS policies, DB migrations
- Real-time subscriptions, file uploads

Wait for Vercel bot to post preview URL (~2-3 min), then verify functionality and check console for errors.

## Environments

- **Dev** (`dev` branch): https://signum-im11dbdvv-levineams-projects.vercel.app - Persistent testing
- **Production** (`main` branch): https://ontology-mu.vercel.app - Stable releases
- **PR Previews**: Ephemeral URLs for testing before merge

## Branch Flow

Feature → `dev` (test) → `main` (production). Both `dev` and `main` are protected and require PR reviews.

## Rules

❌ NEVER commit/push to `main` directly
❌ NEVER merge PRs yourself
❌ NEVER skip PR process or local testing
✅ ALWAYS ensure Codex review is requested after EVERY push (CI auto-posts `@codex review`)
✅ ALWAYS verify new AI models/APIs with Context7 MCP first

## GitHub Labels

When creating issues, apply relevant labels:
- **Type**: `bug`, `enhancement`, `story`, `epic`, `refactor`, `documentation`, `question`
- **Feature**: `ai`, `ontology`, `helpers`, `journal`, `notes`, `editor`, `noticer`
- **Area**: `ui/ux`, `auth`, `security`, `testing`, `infrastructure`, `navigation`, `notifications`

---

## Project: Signum

Journaling-first social platform. Next.js 15.5.3, Supabase, shadcn/ui. See @docs/prd.md and @package.json.

**Commands**: `npm run dev:test` (UI work) | `npm run dev` (DB work) | `npm run build` | `npm run lint`

## Stack

Next.js 15.5.3 (Turbopack) • Supabase (Auth, DB, RLS) • shadcn/ui • TypeScript • Playwright

## Patterns

- TypeScript functional components with hooks
- `cn()` utility for Tailwind classes
- Server components for data, API routes for mutations
- Supabase Realtime for live updates

## Key Files

- `/src/components/editor/SimpleRichEditor.tsx` - Rich text editor
- `/src/components/journal/JournalStream.tsx` - Main journal UI
- `/src/utils/journalPrompts.ts` - ACT-inspired prompts
- `/src/utils/sanitizeHtml.ts` - HTML sanitization for security
- `/docs/prd.md` - Product requirements

## Local Development Modes

**ALWAYS use the appropriate mode for the change type:**

### Test Mode (Default for UI/Component Work)

**Command:** `npm run dev:test`

**What it does:**
- Auto-enables forced test user (no Supabase needed)
- Provides instant feedback (30-second iteration cycles)
- Shows "Test Mode Active" banner in sidebar
- All auth flows work without real authentication
- Data doesn't persist (resets on refresh)

**Use for:**
- UI changes (components, styling, layouts)
- Component interactions and state management
- E2E test development
- Quick iteration on non-DB logic

### Production Mode (For Database Testing)

**Command:** `npm run dev` (requires `.env.local`)

**Use for:**
- Database schema changes
- RLS policy testing
- Supabase-specific features

### Vercel Preview (Final Validation)

**When:** After pushing to GitHub

**Use for:**
- Database-dependent features
- Full integration testing
- Final validation before merge

**Decision Rule:**
- UI change? → `npm run dev:test`
- DB change? → Vercel preview
- Unsure? → Start with `npm run dev:test`

See `docs/runbooks/local-testing-guide.md` for complete guide.

---

## CRITICAL: HTML Formatting in Edit & Read-Only Modes

When adding new HTML formatting features to SimpleRichEditor, you MUST ensure they work in BOTH modes:

### Edit Mode (SimpleRichEditor)
1. Add formatting button and logic to `SimpleRichEditor.tsx`
2. Add CSS styling in `globals.css` under `.rich-editor-body` class
3. Test formatting applies correctly in contentEditable

### Read-Only Mode (JournalStream)
1. **Add HTML tag to whitelist**: Update `ALLOWED_TAGS` in `/src/utils/sanitizeHtml.ts` - DOMPurify strips unlisted tags!
2. **Allow style attributes**: If using inline styles, update `styleFilterHook` in `sanitizeHtml.ts` to allow the specific CSS property
3. **Add CSS styling**: Add identical styling in `globals.css` under `.prose` class
4. Test formatted content displays correctly in read-only view

### Common Mistakes to Avoid
❌ Adding formatting without updating `sanitizeHtml.ts` → content stripped in read-only mode
❌ Only styling `.rich-editor-body` → no styling in read-only mode
❌ Using inline styles without whitelisting in `styleFilterHook` → styles stripped by DOMPurify

---

## CRITICAL: Database Migration & Index Management

### Analyzing Unused Indexes

**⚠️ NEVER use `idx_scan = 0` alone to identify unused indexes!**

The `idx_scan` metric in `pg_stat_user_indexes` **ONLY tracks READ operations** (SELECT queries). It does NOT capture:
- Indexes used in `INSERT ... ON CONFLICT` clauses (upserts)
- Unique constraints enforcing data integrity on writes
- Business rules preventing duplicate rows
- Indexes used for foreign key constraint enforcement

### Required Query for Unused Index Analysis

**ALWAYS use this query** (excludes unique constraints and primary keys):

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

### Mandatory Manual Verification Checklist

Before dropping ANY index or constraint, verify ALL of the following:

**For Unique Constraints:**
1. ✅ **Search for ON CONFLICT usage**: `grep -r "ON CONFLICT.*<column_names>" src/`
2. ✅ **Check database functions**: Search migrations for functions using the constraint
3. ✅ **Verify upsert logic**: `grep -r "\.upsert.*onConflict" src/`
4. ✅ **Check plain INSERT relying on constraint**: Code may use `.insert()` expecting constraint to reject duplicates
   - Example: `links_source_note_id_target_note_id_link_type_key` prevents duplicate graph edges
5. ✅ **Assess business rule impact**: Is uniqueness a domain requirement? (e.g., "no duplicate entities")
6. ✅ **Consider data corruption risk**: Would duplicates corrupt application state or query results?
7. ✅ **Don't assume "application handles it"**: Database constraints are the last line of defense against race conditions and bugs

**For Regular Indexes:**
1. ✅ **Check foreign key relationships**: May be needed for JOIN performance
2. ✅ **Verify not used in WHERE clauses**: Search codebase for column usage
3. ✅ **Consider query plan changes**: Even unused now, might be needed for future queries

### Unique Constraints Serve THREE Purposes

1. **ON CONFLICT clauses** - Enable upserts: `INSERT ... ON CONFLICT (col) DO UPDATE`
2. **Business rule enforcement** - Prevent duplicates via constraint errors (no ON CONFLICT needed)
3. **Data integrity** - General duplicate prevention across concurrent operations

**All three show `idx_scan = 0` because they're used for WRITE operations, not reads!**

### Critical Insight

> **"Application logic could deduplicate" ≠ "Safe to remove database constraint"**

Even without ON CONFLICT clauses, constraints prevent silent data corruption from:
- Race conditions during concurrent inserts
- Bugs in application deduplication logic
- Import/migration scripts that bypass application layer
- Direct database writes (admin tools, data fixes)

### Example: Epic 1.11 Story 1.11.3

See `docs/analysis/unused-indexes-report-story-1.11.3-20251122.md` for comprehensive analysis of this pattern.

**Result**: 19 indexes with `idx_scan = 0`, but **4 unique constraints were critical**:
- 3 used in ON CONFLICT clauses
- 1 used for business rule enforcement (preventing duplicate graph edges)

Only **15 indexes were safe to drop**.
