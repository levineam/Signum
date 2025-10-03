# Signum Project Instructions

# 🚨 MANDATORY PR-BASED WORKFLOW

This project uses PR-based deployment with auto-deploy to Vercel. You MUST follow this workflow for ALL changes.

## 10-Step Workflow (MANDATORY)

1. **Create feature branch**: `git checkout -b story-X.X-description`
2. **Make code changes**: Implement features, fix bugs, etc.
3. **Test locally**: Verify compilation (`npm run build`), run app, test functionality
4. **Stage changes**: `git add [files]`
5. **Commit with message**: Include descriptive message + `Co-Authored-By: Claude <noreply@anthropic.com>`
6. **Push to remote**: `git push -u origin [branch-name]`
7. **Create PR**: Use `gh pr create` with detailed description, test plan, and screenshots
8. **Test on Vercel Preview**: Wait for Vercel bot to comment with preview URL, then test thoroughly
9. **Wait for review**: User reviews PR and approves after preview testing passes
10. **User merges**: User merges PR (NOT Claude)
11. **Auto-deploy**: Vercel automatically deploys to production

## Testing on Vercel Preview Deployments

**CRITICAL**: Always test features on Vercel preview deployment before merging, especially:
- ✅ API routes with external services (OpenAI, Supabase, Stripe)
- ✅ Authentication flows and RLS policies
- ✅ Environment-dependent functionality
- ✅ Database migrations and schema changes
- ✅ Real-time subscriptions
- ✅ File uploads to Supabase Storage

**How to test:**
1. Create PR (step 7 in workflow above)
2. Wait for Vercel bot to comment on PR with preview URL (usually ~2-3 minutes)
3. Test full functionality on preview deployment
4. Verify all API integrations work in production-like environment
5. Check browser console for errors
6. Test with production-like data volumes
7. Only approve PR after preview testing passes

**Why this matters:**
- Local `localhost` doesn't test serverless function behavior
- Environment variables may behave differently
- CORS, authentication, and external API calls need production-like testing
- AI APIs (OpenAI) have different rate limits and behaviors in production

## When to Create a Dedicated Dev Branch

**Currently**: Using PR preview deployments only (sufficient for solo development)

**Create a dedicated `dev` branch when:**
- Multiple developers need a shared staging environment
- Multiple features need integration testing together before production
- Client demos require a persistent staging URL
- Complex database migrations need extended testing periods

**If needed**: Ask user before creating dev branch. Then configure Vercel for dev branch deployment with separate environment variables.

## NEVER Do This

❌ NEVER commit directly to main branch
❌ NEVER push to main branch
❌ NEVER merge PRs yourself
❌ NEVER skip the PR process "to save time"
❌ NEVER assume small changes don't need PRs
❌ NEVER deploy without testing locally first
❌ NEVER merge to production without testing on Vercel preview first
❌ NEVER assume new AI models/APIs don't exist - verify with Context7 MCP or documentation first

---

## Project Overview
Signum is a journaling-first social platform built with Next.js 15.5.3, Supabase, and shadcn/ui. See @docs/prd.md for complete requirements and @package.json for available commands.

## Commands
- `npm run dev`: Start development server with Turbopack
- `npm run build`: Production build with Turbopack
- `npm run lint`: Run ESLint checks
- `npm start`: Start production server

## Tech Stack
- **Framework**: Next.js 15.5.3 with Turbopack
- **Database**: Supabase (PostgreSQL + Auth)
- **UI**: shadcn/ui with Notebook theme (@components/ui/*)
- **Rich Text**: Custom SimpleRichEditor component (contentEditable-based)
- **Testing**: Playwright for E2E tests (@tests/*)

## Code Style
- Use TypeScript for all new code
- Prefer functional components with hooks
- Use `clsx` and `tailwind-merge` via `cn()` utility
- Follow shadcn/ui patterns for component structure
- Store utilities in `/src/utils/`, components in `/src/components/`

## Architecture Patterns
- **Auth**: Supabase Auth with Row-Level Security (RLS) policies
- **Data Fetching**: Supabase client in server components, API routes for mutations
- **Real-time**: Supabase Realtime subscriptions for live updates
- **Storage**: Mix of Supabase database (user data) and localStorage (UI state)

## Important Files
- `/src/components/editor/SimpleRichEditor.tsx` - Rich text editor component
- `/src/components/journal/JournalStream.tsx` - Main journaling interface
- `/src/utils/journalPrompts.ts` - ACT-inspired prompt rotation system
- `/docs/prd.md` - Complete product requirements and roadmap

## Current Focus
- ✅ Story 2.3.5: Notes Page UI Foundation (COMPLETED)
- 🎯 Story 2.4: AI Personal Ontology Extraction with GPT-5 (NEXT)

## Testing
- Run `npx playwright test` for E2E tests
- Test against local development (localhost:3000)
- Manual testing checklist in PRD for each story

## Deployment
- Production: https://ontology-mu.vercel.app
- Auto-deploy via GitHub → Vercel integration
- Environment variables managed in Vercel dashboard