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

