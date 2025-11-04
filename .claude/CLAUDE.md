# Signum Project Instructions

# 🚨 MANDATORY PR-BASED WORKFLOW

This project uses PR-based deployment with auto-deploy to Vercel. You MUST follow this workflow for ALL changes.

## Workflow (MANDATORY)

1. **Create feature branch**: `git checkout -b story-X.X-description`
2. **Make changes & test locally**: `npm run build`, verify functionality
3. **Commit & push**: `git add [files] && git commit` with `Co-Authored-By: Claude <noreply@anthropic.com>`, then `git push`
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

**Commands**: `npm run dev` | `npm run build` | `npm run lint`

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
