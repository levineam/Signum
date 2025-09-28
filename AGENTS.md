# Repository Guidelines

## Project Structure & Module Organization
- App code lives in `signum-app/src`, with routing in `src/app`, shared UI in `src/components`, state providers in `src/contexts`, and data helpers in `src/lib` and `src/utils`.
- UI assets and static content sit under `public/`; reference docs, debug captures, and screenshots are in `signum-app/docs`, `debug-*.png`, and `screenshots/`.
- Playwright specs are colocated at the repo root (`test-*.js`) and in `tests/*.test.ts`; generated artifacts land in `test-results/`.

## Build, Test, and Development Commands
- `npm run dev` — start the Next.js dev server with Turbopack at `http://localhost:3000`.
- `npm run build` — produce an optimized production bundle; run before deployment.
- `npm run start` — serve the production build locally for smoke checks.
- `npm run lint` — run ESLint using the Next.js Core Web Vitals ruleset.
- `npx playwright test` — execute the end-to-end suite; add `--headed` when you need to watch interactions.

## Coding Style & Naming Conventions
- Author React components and modules in TypeScript with strict mode enabled; prefer PascalCase for components, camelCase for hooks and utilities, and SCREAMING_SNAKE_CASE for constants.
- Follow the default Next.js/ESLint formatting: 2-space indentation, semicolons optional but stay consistent with surrounding code, single quotes in TSX unless JSX attributes require otherwise.
- Import shared code through the `@/` alias instead of relative `../../` paths to match the `tsconfig.json` setup.

## Testing Guidelines
- Keep Playwright scenarios focused; name files with the flow under test (e.g. `hyperlink-verification.test.ts`).
- Record new artifacts with `npx playwright codegen` when debugging UI flows, but clean them before committing.
- Save expected screenshots alongside the suite in `test-results/`, and include updates when UI-regressed assertions fail.

## Commit & Pull Request Guidelines
- Base commit messages on the existing `git log`: a short, present-tense summary (e.g. "Add tabbed editor layout"). Append an issue key when available.
- Each PR should describe the change, note affected screens, and link any tracking tickets. Provide before/after screenshots or test output when UI or E2E behavior changes.
- Run `npm run lint` and `npx playwright test` locally before requesting review; call out any skipped checks in the PR description.

## Environment & Configuration
- Copy `.env.example` to `.env.local` and populate Supabase credentials before running the dev server; never commit secrets.
- Vercel deploys read configuration from `vercel.json`; coordinate with maintainers before altering routing or edge settings.
