# Signum Project Instructions

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