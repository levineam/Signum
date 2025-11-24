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

See `../docs/runbooks/local-testing-guide.md` for complete guide.

---

## Critical Gotchas

### HTML Formatting: Must Update BOTH Modes

When adding rich text formatting to SimpleRichEditor, you MUST update **both edit mode AND read-only mode** or DOMPurify will strip the formatting when displaying saved content.

**Required steps:**
1. Add button/logic to `SimpleRichEditor.tsx`
2. Add tag to whitelist in `/src/utils/sanitizeHtml.ts` → `ALLOWED_TAGS`
3. Add CSS to `.rich-editor-body` AND `.prose` in `globals.css`

**See:** `../docs/runbooks/html-formatting-guide.md` for step-by-step procedures, troubleshooting, and examples.

### Database Indexes: NEVER Drop Based on idx_scan = 0 Alone

The `idx_scan` metric counts index scans from SELECT/UPDATE/DELETE but **NOT constraint enforcement**. Unique constraints used in `INSERT ... ON CONFLICT` clauses or enforcing data integrity will show `idx_scan = 0` even when actively used.

**Required before dropping any index/constraint:**
1. Run query that excludes unique constraints (`pi.indisunique = FALSE`)
2. Complete 7-step manual verification checklist
3. Search codebase for ON CONFLICT usage, upsert logic, and plain INSERT relying on constraint

**See:** `../docs/runbooks/database-index-management.md` for required query, full checklist, real-world example (Epic 1.11), and decision tree.

**Browse all runbooks:** `../docs/runbooks/README.md`
