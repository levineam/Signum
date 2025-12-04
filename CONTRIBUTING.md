# Contributing to Signum

Thanks for your interest in improving Signum! This guide covers the basics for local development and safe contributions.

## Quickstart (no secrets required)
- Install dependencies: `npm ci`
- Fast local mode: `npm run dev:test` (auto-enables a test user; no Supabase credentials needed)
- Lint & typecheck: `npm run lint` and `npm run typecheck`
- Unit tests: `npm run test:unit`

If you need full Supabase integration, copy `.env.example` to `.env.local` and fill in your own credentials. Never commit secrets.

## Development notes
- Use the `@/` import alias instead of deep relative paths.
- Prefer `npm run dev:test` for UI/component work; use `npm run dev` only when you must exercise database/RLS behavior.
- Keep Playwright specs focused and tag smoke tests with `@smoke` where applicable.
- Follow the existing formatting (2-space indentation, single quotes in TSX unless attributes require otherwise).
- Avoid committing screenshots or recordings that include real user data; regenerate sanitized captures when needed.

## Commit hygiene
- Write short, present-tense commit messages (e.g., `Add tabbed editor layout`).
- Run `npm run lint` and relevant tests before opening a PR. Note any skipped checks in the PR description.

## Security & responsible disclosure
Please do **not** open public issues for security bugs. Report privately via GitHub Security Advisories: <https://github.com/levineam/Signum/security/advisories/new>. See `SECURITY.md` for details.

## Code of Conduct
By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).
