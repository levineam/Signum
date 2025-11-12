# Epic 2.10: Sidebar Responsive Redesign - Brownfield Enhancement

**Epic ID**: 2.10
**Epic Type**: Brownfield Enhancement
**Parent Epic**: Epic 2 (AI-Powered Personal Ontology & UX Polish)
**Related Issue**: [#29 - Update Sidebar: Twitter-Style Icon-Only Collapse + New Logo](https://github.com/levineam/Signum/issues/29)
**Status**: ✅ Ready for Implementation
**Estimated Duration**: 5-7 days
**Created**: October 17, 2025
**Decisions Finalized**: October 17, 2025

---

## Epic Goal

Redesign the sidebar navigation to use a Twitter-style responsive pattern that collapses to an icon-only column (instead of burger menu), and replace "Signum" text branding with the new minimalist S logo. This enhancement improves mobile/tablet UX and establishes stronger brand identity.

---

## Epic Description

### Existing System Context

**Current Relevant Functionality:**
- **Sidebar Component** (`src/components/layout/Sidebar.tsx`): Fixed-width sidebar (w-64, 256px) with burger menu collapse on mobile
- **Current Responsive Behavior**:
  - Desktop (>=1024px): Full sidebar visible
  - Mobile (<1024px): Sidebar hidden, toggle button shows burger menu
  - Collapsed state: Full off-screen translation with overlay
- **Current Branding**: "Signum" text in h1 at top of sidebar
- **Navigation Items**: 6 sections (Journal, Notes, Feedback, Articles, Meets, Karma) with lucide-react icons
- **Auth Integration**: User status display at bottom with sign out functionality

**Technology Stack:**
- Next.js 15.5.3 (App Router, Turbopack), React 19.1.0, TypeScript ^5
- shadcn/ui with Notebook theme (Button, Card, radix primitives)
- Tailwind CSS for responsive design
- lucide-react for icons
- Theme support via ThemeProvider (light/dark modes)

**Integration Points:**
1. **Sidebar Component**: Core refactoring target for responsive behavior
2. **Layout System** (`src/app/layout.tsx`): No changes expected, but verify
3. **Theme System**: Logo must adapt to theme changes
4. **Public Assets**: New logo assets in `/public/` directory
5. **Navigation State**: Existing `activeSection` and `onSectionChange` props maintained

### Enhancement Details

**What's Being Added:**

A Twitter-style responsive sidebar that provides:
- **Icon-Only Collapsed State**: Narrow column (w-16 to w-20, 64-80px) instead of burger menu
- **Always-Visible Navigation**: Sidebar never fully hides, only collapses width
- **New Logo Branding**: Minimalist S logo replaces "Signum" text
  - PNG source: `Minimalist Black 'S' Logo.png` (provided)
  - Needs conversion to SVG for scalability
  - Requires light/dark theme variants
- **Smooth Transitions**: Animated width changes between states
- **Tooltip Support**: Show labels on hover when sidebar is collapsed
- **Responsive Breakpoints** (FINALIZED):
  - >= 1280px: Full sidebar with icons + labels (w-64, 256px)
  - 768px - 1279px: Icon-only sidebar (w-20, 80px) with tooltips
  - < 768px: Hidden by default, slide-out drawer with overlay (tap hamburger to open)

**How It Integrates:**

1. **Visual Integration**: Sidebar width transitions smoothly on desktop/tablet (pushing main content), overlay drawer on mobile
2. **State Management**: Uses React useState for collapse state + localStorage for manual toggle preference (Twitter-style: auto-responsive with manual override)
3. **Theme Integration**: Logo SVG adapts via conditional rendering based on theme context
4. **Responsive Integration**: Tailwind breakpoints (768px, 1280px) control automatic collapse/expand behavior
5. **Logo Navigation**: Logo click navigates to home/root page (`/`)

**Success Criteria:**

1. ✅ Desktop (>=1280px): Full sidebar (w-64) with icons + labels visible
2. ✅ Tablet (768px-1279px): Icon-only sidebar (w-20) with tooltips on hover/focus
3. ✅ Mobile (<768px): Hidden by default, slide-out drawer with overlay on demand
4. ✅ Manual toggle button works on desktop/tablet (persists to localStorage)
5. ✅ New S logo appears at top of sidebar, replacing "Signum" text
6. ✅ Logo is clickable and navigates to home/root page (`/`)
7. ✅ Logo adapts to light/dark themes correctly (black/white variants)
8. ✅ Smooth width transitions (300ms duration) between expanded/collapsed states
9. ✅ All navigation items work correctly in all states (expanded/collapsed/drawer)
10. ✅ Tooltips display on desktop/tablet when collapsed, but NOT on mobile
11. ✅ User status section hidden when sidebar is collapsed or drawer closed
12. ✅ Mobile drawer opens/closes with hamburger button + overlay backdrop
13. ✅ No layout shifts, overflow issues, or content overlap at any breakpoint
14. ✅ Accessibility: keyboard navigation, focus management, ARIA labels, screen reader support

---

## Stories

This epic consists of 3 coordinated stories that can be parallelized partially:

### Story 2.10.1: Logo Asset Preparation & Integration (1-2 days)

**Goal**: Prepare logo assets (SVG, theme variants) and integrate into sidebar component.

**Scope**:
- Convert `Minimalist Black 'S' Logo.png` to SVG format
- Create light/dark theme variants (black for light mode, white for dark mode)
- Add logo assets to `/public/logos/` directory
- Create Logo component (`src/components/branding/Logo.tsx`) with theme awareness
- Replace "Signum" text in Sidebar with Logo component
- Make logo clickable, linking to journal section
- Update favicon and other brand touchpoints (if needed)

**Deliverables**:
- Logo assets: `public/logos/signum-logo.svg` (black), `public/logos/signum-logo-white.svg`
- Component: `src/components/branding/Logo.tsx` with theme-aware rendering
- Updated: `src/components/layout/Sidebar.tsx` (h1 replaced with Logo component)
- Optional: `public/favicon.svg` (if updating favicon)

**Dependencies**: None (can start immediately)

**Testing**:
- Manual: Test logo displays correctly in light mode (black logo)
- Manual: Test logo displays correctly in dark mode (white logo)
- Manual: Test logo click navigates to home/root page (`/`)
- Manual: Test logo sizing at different viewport widths

**Finalized Decisions**:
- ✅ **Logo click destination**: Navigate to home/root page (`/`)
- ✅ **Logo sizing**: Maintain consistent size across all states (simplified implementation)
- ✅ **Favicon update**: Not required for this epic (can be added later if needed)

---

### Story 2.10.2: Sidebar Responsive Collapse Refactoring (2-3 days)

**Goal**: Refactor sidebar to use icon-only collapse pattern instead of burger menu.

**Scope**:
- Implement Twitter-style responsive behavior with manual override:
  - Auto-collapse based on viewport width (768px, 1280px breakpoints)
  - Add manual toggle button for desktop users (chevron icon or similar)
  - Persist manual preference to localStorage
- Define responsive breakpoints (FINALIZED):
  - >= 1280px: Full sidebar (w-64, icons + labels)
  - 768px - 1279px: Icon-only sidebar (w-20, icons only)
  - < 768px: Hidden by default, slide-out drawer with overlay backdrop
- Add smooth width transitions (300ms cubic-bezier)
- Update navigation button layout to center icons when collapsed
- Hide labels when collapsed (opacity transition for desktop/tablet)
- Hide user status section entirely when sidebar is collapsed
- Implement mobile drawer with hamburger button and overlay
- Test main content reflow (ensure no overlap with sidebar)

**Deliverables**:
- Updated: `src/components/layout/Sidebar.tsx` with Twitter-style responsive behavior
- Added: Manual toggle button (chevron icon) for desktop override
- Added: localStorage integration for manual preference persistence
- Added: Mobile drawer with hamburger button + overlay backdrop (<768px)
- Added: Icon-only state for tablet (768px-1279px) with centered icons
- Added: User status section hidden when collapsed
- Added: Conditional CSS classes for expanded/collapsed/drawer states
- Added: Smooth transitions for width, opacity, padding (300ms)

**Dependencies**: Story 2.10.1 (logo should be integrated first for visual consistency)

**Testing**:
- Manual: Test at 1280px+ (full sidebar, manual toggle works)
- Manual: Test at 768px-1279px (icon-only sidebar, manual toggle works)
- Manual: Test at <768px (drawer with hamburger button, overlay backdrop)
- Manual: Test smooth transitions when resizing browser
- Manual: Test manual toggle preference persists (localStorage)
- Manual: Test main content doesn't overlap with sidebar
- Manual: Test user status section hidden when collapsed
- Manual: Test mobile drawer opens/closes correctly with hamburger
- Build: Verify `npm run build` passes

**Finalized Decisions**:
- ✅ **Mobile behavior (<768px)**: Hidden by default, slide-out drawer with overlay
- ✅ **Manual toggle control**: Twitter-style (auto-responsive + manual override with localStorage)
- ✅ **User status in collapsed state**: Hide entirely

---

### Story 2.10.3: Tooltip Implementation & Testing (2 days)

**Goal**: Add tooltips for collapsed sidebar, comprehensive testing, and accessibility validation.

**Scope**:
- Implement tooltips using shadcn/ui Tooltip component (desktop/tablet only, not mobile drawer)
- Show navigation labels on hover/focus when sidebar is icon-only (768px-1279px and collapsed desktop)
- Configure tooltip positioning (right side, 8px offset)
- Configure tooltip delay (300ms)
- Disable tooltips on touch devices (<768px using drawer pattern)
- Add ARIA labels for collapsed navigation items
- Write Playwright E2E test suite (8-10 scenarios)
- Test on Vercel preview deployment
- Accessibility testing (keyboard nav, screen reader, focus management)
- Mobile device testing (iOS Safari, Android Chrome) - drawer behavior, no tooltips

**Deliverables**:
- Updated: `src/components/layout/Sidebar.tsx` with Tooltip components
- Playwright tests: `tests/sidebar-responsive.test.ts`
  - Test scenarios: expand/collapse at breakpoints, tooltip display, keyboard navigation, logo click, theme switching, mobile drawer (if applicable)
- Vercel preview checklist: Functionality, visual, responsive, accessibility, performance
- Test report: Summary with screenshots

**Dependencies**: Story 2.10.2 (collapsed state must exist before adding tooltips)

**Testing**:
- Playwright: `npx playwright test tests/sidebar-responsive.test.ts`
- Manual: Test tooltips appear on hover (mouse) and focus (keyboard) on desktop/tablet
- Manual: Test tooltips do NOT appear on mobile (<768px) - using drawer instead
- Manual: Test on real mobile devices (iOS Safari, Android Chrome)
- Manual: Test screen reader announces navigation items correctly
- Manual: Test theme switching doesn't break tooltips or logo
- Manual: Test manual toggle button and localStorage persistence
- Manual: Test drawer opens/closes correctly on mobile
- Vercel Preview: Full checklist on preview URL from PR

**Finalized Decisions**:
- ✅ **Tooltip on mobile**: Not needed - using slide-out drawer on mobile (<768px)
- ✅ **User status tooltip**: Not applicable - user status hidden when collapsed

---

## Compatibility Requirements

### Component Compatibility
- ✅ Sidebar maintains existing props API: `activeSection`, `onSectionChange`
- ✅ No breaking changes to components that use Sidebar
- ✅ Auth integration continues to work (user status display)
- ✅ Theme switching continues to work (logo adapts)

### UI Compatibility
- ✅ Sidebar uses existing shadcn/ui components (Button, Card)
- ✅ Follows Notebook theme color scheme
- ✅ Responsive layout doesn't break existing page layouts
- ✅ Main content area adjusts width correctly with sidebar changes

### Performance Compatibility
- ✅ Width transitions don't cause layout thrashing
- ✅ Logo loads quickly (SVG is small, ~5-10KB)
- ✅ Tooltip rendering doesn't block UI thread
- ✅ No excessive re-renders when resizing

### Accessibility Compatibility
- ✅ Keyboard navigation continues to work (Tab, Enter, Escape)
- ✅ Focus management respects collapsed/expanded states
- ✅ Screen readers announce navigation items correctly
- ✅ ARIA labels updated for icon-only state

---

## Risk Mitigation

### Primary Risk: Mobile UX Degradation - ✅ MITIGATED

**Risk Description**: Icon-only sidebar on small mobile screens may take too much width (64px = ~17% of 375px screen), making content area cramped.

**Likelihood**: ~~Medium~~ → **LOW** (risk mitigated by design decision)

**Impact**: ~~High~~ → **LOW** (drawer pattern chosen)

**Mitigation Applied**:
1. ✅ **Decision Finalized**: Using slide-out drawer for mobile (<768px), not icon-only column
2. ✅ **Hidden by Default**: Drawer hidden, full content width available on mobile
3. ✅ **Test on Real Devices**: Mandatory in Story 2.10.3 (iOS Safari, Android Chrome)
4. ✅ **Full Content Width**: Mobile gets 100% content width when drawer closed

**Rollback Plan**: If mobile drawer UX is poor:
1. Revert to original burger menu for mobile only (<768px)
2. Keep icon-only for tablet+ (768px-1279px)
3. Keep full sidebar for desktop (>=1280px)

### Secondary Risk: Layout Shift / Content Overlap

**Risk Description**: Sidebar width changes might cause main content to overlap or shift unexpectedly.

**Likelihood**: Low (Tailwind responsive utilities are well-tested)

**Impact**: Medium (visual bugs, poor UX)

**Mitigation**:
1. **Use Flexbox/Grid**: Ensure main content area uses flex-grow to fill remaining space
2. **Test Transitions**: Manually resize browser to trigger all breakpoints
3. **Check Fixed Elements**: Verify no fixed-position elements overlap with sidebar
4. **Playwright Visual Tests**: Capture screenshots at different widths

**Rollback Plan**: If layout issues occur:
1. Add explicit margin-left to main content based on sidebar width
2. Use JavaScript to calculate and set content width dynamically
3. Disable transitions temporarily while debugging

### Tertiary Risk: Theme Switching Logo Bug

**Risk Description**: Logo doesn't update correctly when switching between light/dark themes.

**Likelihood**: Low (theme context is well-established)

**Impact**: Low (visual bug, doesn't break functionality)

**Mitigation**:
1. **Use Theme Context**: Logo component accesses theme via `useTheme()` hook
2. **Test Both Directions**: Light→Dark AND Dark→Light
3. **Fallback**: If conditional rendering fails, use CSS filter: `filter: invert(1)` for dark mode

**Rollback Plan**: If theme switching breaks:
1. Use single black logo with CSS filter for dark mode
2. Fix theme-aware rendering in follow-up PR

---

## Definition of Done

### Epic-Level DoD

- ✅ All 3 stories completed with acceptance criteria met
- ✅ Logo assets created and integrated (SVG, theme variants)
- ✅ Sidebar refactored to icon-only collapse (no burger menu)
- ✅ Tooltips implemented for collapsed state
- ✅ Responsive breakpoints tested at 1280px, 768px, 375px
- ✅ Playwright E2E tests pass (8-10 scenarios)
- ✅ Vercel preview testing checklist completed
- ✅ Mobile device testing completed (iOS Safari, Android Chrome)
- ✅ Accessibility testing passed (keyboard, screen reader, focus)
- ✅ Theme switching tested (light/dark, logo adapts)
- ✅ No console errors in browser or terminal
- ✅ No regression in existing navigation functionality
- ✅ PR merged to `dev` branch, then to `main` after validation

### Per-Story DoD

Each story must meet:
- ✅ All story acceptance criteria met
- ✅ Code follows project coding standards (TypeScript strict, 2-space indent)
- ✅ No ESLint errors (`npm run lint`)
- ✅ Builds successfully (`npm run build`)
- ✅ Tested locally with `npm run dev`
- ✅ PR created with detailed description and screenshots
- ✅ Tested on Vercel preview deployment
- ✅ Code reviewed and approved
- ✅ User merges PR (not Claude)

---

## Timeline Estimate

### Optimistic (5 days)
- Story 2.10.1: 1 day (logo conversion straightforward)
- Story 2.10.2: 2 days (refactoring goes smoothly)
- Story 2.10.3: 1.5 days (testing passes on first run)
- Buffer: 0.5 days for review and minor fixes

### Realistic (6 days)
- Story 2.10.1: 1.5 days (theme variant tweaking)
- Story 2.10.2: 2.5 days (responsive breakpoint refinement)
- Story 2.10.3: 2 days (Playwright tests need iteration)
- Buffer: 1 day for mobile device testing and fixes

### Pessimistic (7 days)
- Story 2.10.1: 2 days (logo sizing/positioning issues)
- Story 2.10.2: 3 days (layout shift debugging required)
- Story 2.10.3: 2.5 days (accessibility issues found, need fixes)
- Buffer: 1.5 days for cross-device testing and polish

**Recommended Target**: 6 days (realistic)

---

## Dependencies

### External Dependencies
- ✅ **Theme System**: COMPLETE - ThemeProvider established, logo can use theme context
- ✅ **shadcn/ui Tooltip**: AVAILABLE - Can import and use immediately
- ✅ **Responsive Layout**: COMPLETE - Main layout supports sidebar changes

### Internal Dependencies (Story Sequence)
1. **Story 2.10.1 (Logo) → Story 2.10.2 (Sidebar)**: Logo should be integrated before sidebar refactor for visual consistency
2. **Story 2.10.2 (Sidebar) → Story 2.10.3 (Tooltips)**: Collapsed state must exist before adding tooltips
3. **Story 2.10.3 (Testing) → PR Merge**: All tests must pass before merge approval

**Note**: Stories 2.5.1 and 2.5.2 can be partially parallelized (logo work can happen independently), but 2.5.3 must wait for 2.5.2.

---

## Related Documentation

### Issue #29
- **Original Issue**: [#29](https://github.com/levineam/Signum/issues/29) - UX requirements, Twitter reference, acceptance criteria

### Project Documentation
- **PRD**: `docs/prd.md` - Product requirements, existing sidebar context
- **Tech Stack**: `docs/architecture/tech-stack.md` - Next.js 15.5.3, Tailwind CSS, shadcn/ui
- **Coding Standards**: `docs/architecture/coding-standards.md` - TypeScript strict, 2-space indent
- **CLAUDE.md**: `.claude/CLAUDE.md` - PR-based workflow, Vercel preview testing requirements

---

## ✅ Finalized Design Decisions

All critical decisions have been finalized by the user on October 17, 2025:

### Responsive Behavior Decisions

1. **Mobile Behavior (<768px)**: ✅ **DECIDED**
   - **Decision**: Hidden by default, slide-out drawer with overlay (tap hamburger to open)
   - **Rationale**: Maximizes content area on small screens, familiar mobile UX pattern
   - **Implementation**: Hamburger button triggers drawer, overlay backdrop when open

2. **Manual Toggle Control**: ✅ **DECIDED**
   - **Decision**: Twitter-style (auto-responsive with manual override)
   - **Rationale**: Best of both worlds - responsive by default, user control when desired
   - **Implementation**: Toggle button (chevron icon) + localStorage persistence for preference

3. **Logo Click Destination**: ✅ **DECIDED**
   - **Decision**: Navigate to home/root page (`/`)
   - **Rationale**: Standard web convention, logo = home
   - **Implementation**: `<Link href="/">` wrapper around Logo component

### UI/UX Details Decisions

4. **Tooltip Behavior on Mobile**: ✅ **DECIDED**
   - **Decision**: Not needed on mobile (using drawer pattern)
   - **Rationale**: Drawer shows full labels, tooltips unnecessary
   - **Implementation**: Tooltips only on desktop/tablet (>=768px) when icon-only

5. **User Status in Collapsed State**: ✅ **DECIDED**
   - **Decision**: Hide user status section entirely when collapsed
   - **Rationale**: Simplest implementation, cleaner icon-only column
   - **Implementation**: Conditional rendering based on collapse state

6. **Breakpoint Values**: ✅ **CONFIRMED**
   - Desktop full: >= **1280px** (w-64, 256px sidebar) ✅
   - Tablet icon-only: **768px - 1279px** (w-20, 80px sidebar) ✅
   - Mobile drawer: < **768px** (hidden by default, drawer on demand) ✅

---

## Story Manager Handoff

**Story Manager Handoff:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

- **This is an enhancement to an existing system running:**
  - Next.js 15.5.3 (App Router, Turbopack) + React 19.1.0 + TypeScript ^5
  - Tailwind CSS for responsive design
  - shadcn/ui with Notebook theme
  - lucide-react icons

- **Integration points:**
  1. Sidebar component (`src/components/layout/Sidebar.tsx`) - core refactoring target
  2. Logo asset creation (PNG → SVG, theme variants)
  3. Theme system - logo must adapt to light/dark modes
  4. Responsive layout - sidebar width changes affect main content area
  5. Tooltip component - use shadcn/ui Tooltip for collapsed labels

- **Existing patterns to follow:**
  - **shadcn/ui Button**: Navigation items use Button component with icon + label
  - **Theme Integration**: Use `useTheme()` hook from theme provider
  - **Responsive Classes**: Tailwind breakpoints (sm:, md:, lg:, xl:, 2xl:)
  - **Smooth Transitions**: `transition-all duration-300 ease-in-out`

- **Critical compatibility requirements:**
  - No breaking changes to Sidebar props API (`activeSection`, `onSectionChange`)
  - Existing auth integration must continue working
  - Main content area must reflow correctly with sidebar width changes
  - Theme switching must not break logo or tooltips

- **Each story must include verification that existing functionality remains intact:**
  - Story 2.10.1: Verify theme switching works with new logo
  - Story 2.10.2: Verify navigation works correctly in collapsed state, no layout overlap
  - Story 2.10.3: Verify tooltips don't interfere with existing interactions

The epic should improve mobile/tablet UX with a Twitter-style sidebar that never fully hides, and establish stronger brand identity with the new S logo.

**Twitter Reference**: User provided screenshot showing X.com's sidebar with icon-only column on smaller screens, logo at top, smooth transitions.

**Timeline**: 5-7 days (realistic: 6 days) across 3 stories (partially parallelizable)."

---

## Notes

### Why This Epic vs Full PRD/Architecture?

This enhancement qualified for the brownfield epic process because:
- ✅ Can be completed in 3 focused stories
- ✅ No significant architectural changes (UI refactoring only)
- ✅ Integration complexity is manageable (single component + assets)
- ✅ Risk to existing system is low (visual/UX enhancement)

### Design Inspiration: Twitter/X.com

The user provided a screenshot of Twitter's (X.com) responsive sidebar showing:
- **Icon-only column**: Narrow vertical sidebar with centered icons
- **Logo at top**: X logo prominently displayed
- **Always visible**: Never fully hides, just collapses width
- **Clean spacing**: Generous vertical spacing between nav items
- **Hover tooltips**: Labels appear on hover (not shown in screenshot but likely present)

This pattern provides:
- **Better mobile UX**: Navigation always accessible without opening menu
- **Faster navigation**: No extra click to open menu
- **Visual consistency**: Sidebar presence maintained across screen sizes
- **Industry standard**: Users familiar with pattern from Twitter, Discord, Slack

---

## Validation Checklist

### Scope Validation
- ✅ Epic can be completed in 1-3 stories maximum (3 stories defined)
- ✅ No architectural documentation is required (UI enhancement only)
- ✅ Enhancement follows existing patterns (shadcn/ui, Tailwind responsive)
- ✅ Integration complexity is manageable (single component + asset prep)

### Risk Assessment
- ✅ Risk to existing system is low-medium (layout changes could cause issues, but mitigated)
- ✅ Rollback plan is feasible (revert Sidebar.tsx, remove logo assets)
- ✅ Testing approach covers existing functionality (Playwright regression tests)
- ✅ Team has sufficient knowledge (all design decisions finalized)

### Completeness Check
- ✅ Epic goal is clear and achievable (Twitter-style sidebar + new logo)
- ✅ Stories are properly scoped (1-2, 2-3, 2 days, some parallelizable)
- ✅ Success criteria are measurable (12 concrete acceptance criteria)
- ✅ Dependencies are identified (2.5.1→2.5.2→2.5.3 sequence)
- ✅ **All critical decisions finalized** (6 design questions answered on Oct 17, 2025)

---

**Epic Status**: ✅ **READY FOR IMPLEMENTATION**

**Next Action**: Dev can start Story 2.10.1 (Logo Asset Preparation) immediately. Story Manager may develop detailed user stories if additional granularity needed.
