# Signum

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

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

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

## 🔗 Links

- **Production App:** [https://ontology-mu.vercel.app](https://ontology-mu.vercel.app)
- **GitHub Repository:** [https://github.com/levineam/Signum](https://github.com/levineam/Signum)
- **Vercel Dashboard:** [https://vercel.com/levineams-projects/signum](https://vercel.com/levineams-projects/signum)

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
