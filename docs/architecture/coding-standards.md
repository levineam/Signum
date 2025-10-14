# Coding Standards

This document defines the baseline code style and conventions the dev agent must always load. It mirrors our existing Next.js + TypeScript practices and lint rules.

## Language & General
- TypeScript everywhere; `strict` enabled.
- 2‑space indentation; keep semicolon usage consistent with surrounding files.
- Single quotes by default in TS/TSX; JSX attribute values may use double quotes.
- Prefer `const` and immutability; avoid `any` and implicit `any`.
- Components in PascalCase; hooks/utilities in camelCase; constants in SCREAMING_SNAKE_CASE.

## Imports
- Use the path alias `@/` for shared code (configured in `tsconfig.json`).
- Order: Node/third‑party → workspace aliases (`@/…`) → relative paths.

## React/Next.js
- Client/server components: mark with `'use client'` only when needed.
- Keep components pure; push effects to boundaries, memoize expensive work.
- Co-locate component styles and tests with the component when practical.

## Error Handling
- Fail fast with helpful messages; prefer typed error shapes.
- Wrap async operations with minimal, contextual try/catch.

## Testing
- Playwright for E2E; keep scenarios focused and deterministic.
- Name tests by flow (e.g., `hyperlink-verification.test.ts`).

## Linting & Formatting
- Use Next.js Core Web Vitals ESLint config; run `npm run lint` before PRs.
- Prefer Prettier defaults if configured; otherwise follow these standards.

## Commit Messages
- Short, present‑tense summary (e.g., "Add tabbed editor layout").
- Reference issue keys when available.

