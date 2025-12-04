# Signum

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

A journaling-first social platform designed to help users lead more meaningful lives through personal insight and community connection.

## 🚀 Live Application

**Production URL:** [https://ontology-mu.vercel.app](https://ontology-mu.vercel.app)

## About

Signum addresses the gap in digital platforms that optimize for external metrics rather than personal insight and meaning-making. It provides a calm, frictionless space for journaling and self-discovery, then uniquely connects those personal insights to meaningful social experiences.

### Key Features

- **WYSIWYG Rich Text Editor** - Seamless journal entry creation and editing
- **Smart Note Creation** - Create linked notes from highlighted text
- **Bidirectional Linking** - Navigate between connected thoughts and entries
- **Cloud Persistence** - All data securely stored with Supabase
- **Authentication System** - Secure user accounts and data privacy

### Tech Stack

- **Framework:** Next.js 15.5.3 with Turbopack
- **Authentication:** Supabase Auth
- **Database:** Supabase PostgreSQL
- **UI Components:** shadcn/ui with Tailwind CSS
- **Deployment:** Vercel with GitHub integration
- **Language:** TypeScript

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Local Development

**Quick Start (Test Mode - Recommended):**

```bash
npm run dev:test
```

This starts the dev server with test mode enabled - no Supabase credentials needed! Perfect for:
- UI/component changes
- Fast iteration (30-second cycles)
- E2E test development

Open [http://localhost:3000](http://localhost:3000) - you'll be automatically "logged in" with a test user.

**Full Mode (Requires Supabase):**

```bash
npm run dev
```

Requires `.env.local` with Supabase credentials. Use this for:
- Database schema testing
- RLS policy validation
- Supabase-dependent features

Admin-only scripts such as `scripts/seed-sample-journal-entries.ts` expect `SUPABASE_SERVICE_ROLE_KEY`. Do not expose this key to the client or commit it; most contributors can skip it entirely by using `npm run dev:test`.

**Sentry (optional):**
- Sentry is disabled by default. To enable it locally or in production, set `SENTRY_ENABLED=true` and provide `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN`.
- Leave Sentry variables unset for open-source runs to avoid uploading source maps or requiring private tokens.
- Secret scanning runs in CI via gitleaks; run locally with `./SECURITY.md` instructions before pushing.

### Development Modes Comparison

| Mode | Command | Setup | Speed | Best For |
|------|---------|-------|-------|----------|
| Test Mode | `npm run dev:test` | None | 30 sec | UI changes, components |
| Full Mode | `npm run dev` | Needs `.env.local` | 2-3 min | DB features, RLS |
| Vercel Preview | Push to GitHub | Automatic | 5-10 min | Final validation |

**When in doubt:** Start with `npm run dev:test` for fast feedback!

See `docs/runbooks/local-testing-guide.md` for complete testing workflow guide.

---

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 🚢 Deployment

This application is deployed on Vercel with automatic deployments from the `main` branch.

### Deployment Pipeline
- **Source:** GitHub repository push to `main`
- **Build:** Vercel automatically builds with Next.js
- **Deploy:** Live at [https://ontology-mu.vercel.app](https://ontology-mu.vercel.app)

### Manual Deployment
```bash
# Using Vercel CLI
vercel deploy --prod
```

## 📚 Documentation

- **Product Requirements:** [`docs/prd.md`](./docs/prd.md)
- **Project Brief:** [`docs/project-brief.md`](./docs/project-brief.md)
- **MCP Usage Guide:** [`.claude/CLAUDE.md`](./.claude/CLAUDE.md)
- **Contributing:** [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- **Security Policy:** [`SECURITY.md`](./SECURITY.md)
- **AI Code Review:** CodeRabbit auto-reviews all PRs (including drafts) per `.coderabbit.yaml`.

## 🔗 Links

- **Production App:** [https://ontology-mu.vercel.app](https://ontology-mu.vercel.app)
- **GitHub Repository:** [https://github.com/levineam/Signum](https://github.com/levineam/Signum)


Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
