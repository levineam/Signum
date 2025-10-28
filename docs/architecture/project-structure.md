# Source Tree

This repository uses a standard Next.js layout with consolidated application code under `src/`.

## Top-Level
- `src/` – application code
  - `app/` – App Router pages/routes
  - `components/` – shared UI components
  - `contexts/` – React providers and state
  - `lib/` and `utils/` – data helpers, utilities
- `public/` – static assets
- `docs/` – documentation (PRDs, runbooks, issue PRDs)
- `tests/` and `test-*.js` – Playwright specs and helpers
- `test-results/` – generated artifacts from Playwright runs
- `supabase/` – SQL migrations and functions (if present)
- `scripts/` – maintenance and tooling scripts

## Conventions
- Import shared code via `@/` alias.
- Co-locate styles and tests with components when practical.
- Keep Playwright flows focused; store expected screenshots in `test-results/`.

## Shared Components Architecture

### Rich Text Editor (`SimpleRichEditor`)
- **Location**: `src/components/editor/SimpleRichEditor.tsx`
- **Used by**:
  - Journal entries (`src/components/journal/JournalStream.tsx`)
  - Note detail pages (`src/app/notes/[id]/page.tsx`)
- **Benefits**: Bug fixes and feature additions automatically apply to both contexts
- **Features**: Rich text toolbar, voice transcription, "Make Note" functionality, auto-save support
- **Pattern**: Single source of truth for all WYSIWYG editing in the application

### Voice Transcription (`VoiceRecordButton`)
- **Location**: `src/components/editor/VoiceRecordButton.tsx`
- **Integrated**: Automatically included in `SimpleRichEditor`
- **Used by**: All contexts that use `SimpleRichEditor`

