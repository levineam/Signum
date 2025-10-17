# Issue 4 PRD: Light/Dark Theme Toggle

## Summary
Provide users with a direct control to switch between the tweakcn Notebook theme's light and dark modes. The toggle lives in the homepage header, ensures the correct CSS variables are applied globally, and remembers the user's preference across sessions.

## Background
- The current Notebook theme already ships with light/dark CSS variables in `src/app/globals.css`.
- No runtime toggle exists today, so the app defaults to one mode regardless of user preference.
- Issue #5 will later introduce multi-theme selection; this work should lay the groundwork without blocking that roadmap.

## Goals
1. Expose an intuitive toggle in the homepage header (top-right) that lets users switch between light and dark modes instantly.
2. Respect system preferences on initial load and persist user selection for subsequent visits.
3. Ensure existing UI surfaces remain legible and accessible in both modes, using only the tweakcn-provided styling.

## Non-Goals
- Theme preset switching (covered by Issue #5).
- Creating new color tokens or bespoke CSS overrides beyond what ships with tweakcn Notebook.
- Overhauling layout/header design beyond what is needed to host the toggle.

## Functional Requirements
- Toggle renders in the homepage header (desktop and mobile) and is reachable via keyboard navigation.
- Clicking or tapping the toggle flips the `<html>` class between `light` and `dark` while reusing existing CSS variables.
- On initial visit, theme defaults to the user's `prefers-color-scheme` setting.
- Selection persists across sessions (e.g., `localStorage` via theming library) and applies without a full page refresh.
- UI remains readable in both modes; regressions are documented with contrast notes if discovered.

## Technical Notes
- Recommended to use `next-themes` (or equivalent) at the app root with `attribute="class"` and `defaultTheme="system"`.
- Toggle component can reuse shadcn primitives (`Button`, `Toggle`, `DropdownMenu`) and lucide icons; no custom CSS.
- Prevent hydration flash by conditionally rendering the toggle after hydration or by leveraging provider options.
- Update shared layout files (`src/app/layout.tsx`, `src/app/page.tsx`) with coordination for Story 2.4 team.
- Confirm tweakcn documentation for any suggested toggle UX (Context7 `/jnsahaj/tweakcn`).

## UX & Accessibility
- Toggle displays state via iconography and accessible text (e.g., aria-label, aria-pressed).
- Maintains focus order and works with keyboard + SR (VoiceOver/NVDA) announcing current mode.
- Mobile view keeps toggle discoverable without overlapping existing header controls.

## Testing Strategy
- Manual smoke tests on homepage, journal stream, notes page, modals, sidebar, and toast notifications in both themes.
- Refresh browser to verify persistence and system default fallback when storage is cleared.
- Accessibility spot check: keyboard toggle, screen reader announcement, focus outline visibility.
- Optional Playwright scenario: click toggle, assert `<html>` class, reload, confirm persisted class.

## Dependencies & Risks
- Shared layout updates may conflict with ongoing Story 2.4 work; coordinate PR timing.
- Contrast regressions discovered during QA should be logged but only block release if they impair readability.
- Storage failures (private mode) should fail gracefully—stay on system theme without breaking UI.

## Open Questions
- None at this time. Update if tweakcn documentation surfaces required UX patterns.

