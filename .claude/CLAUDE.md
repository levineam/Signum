# Signum Project Instructions

# 🚨 MANDATORY PR-BASED WORKFLOW

This project uses PR-based deployment with auto-deploy to Vercel. You MUST follow this workflow for ALL changes.

## Workflow (MANDATORY)

1. **Create feature branch**: `git checkout -b story-X.X-description`
2. **Make changes & test locally**: `npm run build`, verify functionality
3. **Commit & push**: `git add [files] && git commit` with `Co-Authored-By: Claude <noreply@anthropic.com>`, then `git push`
4. **Create PR** (first time): `gh pr create` with description, test plan, screenshots
5. **🚨 ALWAYS request Codex review after push**: `echo '<CHORUS_TAG>codex</CHORUS_TAG> review' | gh pr comment [PR#] --body-file -`
6. **Test on Vercel Preview**: Test thoroughly on preview URL
7. **User merges**: User reviews, approves, and merges (NOT Claude)

**⚠️ CRITICAL**: After pushing ANY commit to a PR (initial or additional), you MUST immediately run step 5 to request Codex review.

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
❌ NEVER push without immediately requesting Codex review
✅ ALWAYS run `echo '<CHORUS_TAG>codex</CHORUS_TAG> review' | gh pr comment [PR#] --body-file -` after EVERY push
✅ ALWAYS verify new AI models/APIs with Context7 MCP first

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
- `/docs/prd.md` - Product requirements