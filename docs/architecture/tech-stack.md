# Tech Stack

## Application
- Next.js 15.5.3 (App Router, Turbopack)
- React 19.1.0
- TypeScript ^5
- TailwindCSS ^4 (with `@tailwindcss/postcss`)

## Data & Auth
- Supabase (Postgres 17, Auth, Storage)
- `@supabase/supabase-js` ^2.57.x
- `@supabase/ssr` for server‑side auth helpers

## UI & Utilities
- Radix UI primitives, Lucide Icons, CMDK, clsx, cva, sonner

## Quality & Tooling
- ESLint ^9 with `eslint-config-next`
- Playwright ^1.55 for E2E tests

## Build & Deploy
- Turbopack for dev/build
- Vercel (via `vercel.json`) for deploy configuration

## Project Scripts
- `npm run dev` – start dev server
- `npm run build` – production build
- `npm run start` – serve built app
- `npm run lint` – lint codebase
- `npx playwright test` – run E2E tests

