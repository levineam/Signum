# Epic 1.8: Helper System Enhancement - Brownfield Enhancement

**Epic ID**: 1.8
**Epic Type**: Brownfield Enhancement
**Parent Epic**: Epic 1 (Clean Slate & Fresh Foundation)
**Related Issue**: [#17 - Add Cognitive Distortions Helper](https://github.com/levineam/Signum/issues/17)
**Status**: Ready for Implementation
**Estimated Duration**: 7-11 days
**Created**: October 14, 2025

---

## Epic Goal

Add a CBT Cognitive Distortions helper to the journaling interface that helps users identify and reflect on cognitive distortions they experienced, providing structured starter text as plain paragraphs appended to journal entries. This enhancement builds on the existing Gentle Prompts System (Story 1.7) and establishes a pattern for future helper integrations.

---

## Epic Description

### Existing System Context

**Current Relevant Functionality:**
- **Gentle Prompts System (Story 1.7)**: ACT-inspired prompts displayed above journal entries using progressive disclosure pattern
- **JournalStream Component**: Main journaling interface with auto-save (2-second debounce), link rehydration, and rich text editing
- **SimpleRichEditor**: contentEditable-based editor with formatting toolbar and `onMakeNote` callback
- **Supabase Integration**: RLS-enforced data isolation (completed in Story 2.4.1), link persistence with metadata (Story 2.4.2)

**Technology Stack:**
- Next.js 15.5.3 (App Router, Turbopack), React 19.1.0, TypeScript ^5
- Supabase (Postgres 17, Auth, Storage) with Row-Level Security
- shadcn/ui with Notebook theme (Card, Button, radix primitives)
- Playwright ^1.55 for E2E testing
- Vercel deployment with PR-based workflow

**Integration Points:**
1. **JournalStream** (`src/components/journal/JournalStream.tsx`): Render helper alongside Gentle Prompt
2. **SimpleRichEditor** (`src/components/editor/SimpleRichEditor.tsx`): Extend with `onInsertHelper` callback
3. **Supabase Database**: New `helper_usage` table with RLS policies
4. **Auto-save System**: Trigger 2-second debounce after helper insertion
5. **User Preferences**: Store dismissal state in Supabase (not sessionStorage)

### Enhancement Details

**What's Being Added:**

A CBT Cognitive Distortions helper that provides:
- **10 Cognitive Distortions**: Expandable list with names, descriptions, and examples (All-or-Nothing Thinking, Overgeneralization, Mental Filter, Discounting the Positive, Jumping to Conclusions, Magnification/Minimization, Emotional Reasoning, Should Statements, Labeling, Personalization/Blame)
- **Progressive Disclosure UI**: Explore button expands inline panel, Continue inserts selected items, Clear deselects all
- **Structured Reflection**: Inserts plain paragraphs in format: "Today I experienced {Distortion}. Here's what happened: ..."
- **Usage Tracking**: Logs all interactions to `helper_usage` table for future AI improvements (Story 2.4.4+)
- **Accessibility**: WCAG AA compliant with keyboard navigation, focus management, and exact aria-live announcements

**How It Integrates:**

1. **Visual Integration**: Displays below Gentle Prompt on today's entry using blue/indigo gradient (differentiates from amber Gentle Prompt)
2. **Data Integration**: New `helper_usage` table with same RLS pattern as `links` table (Story 2.4.2)
3. **Editor Integration**: Extends SimpleRichEditor API with `onInsertHelper` callback, maintains auto-save coordination
4. **Pattern Integration**: Establishes reusable HelperContainer pattern for future helpers (Issue #18)

**Success Criteria:**

1. ✅ Users can explore 10 CBT distortions with descriptions and examples
2. ✅ Selected distortions insert as plain paragraphs at end of journal entry
3. ✅ Insertions trigger auto-save and persist across sessions
4. ✅ Helper usage tracked to Supabase with full metadata (events, counts, timestamps)
5. ✅ Accessibility meets WCAG AA: keyboard nav, focus management, screen reader announcements
6. ✅ RLS policies enforce multi-user data isolation
7. ✅ No regression in existing journaling flow (verified via Playwright tests)

---

## Stories

This epic consists of 3 coordinated stories that must be completed sequentially:

### Story 1.8.1: Helper Database Infrastructure (1-2 days)

**Goal**: Establish database foundation for helper system with RLS policies and TypeScript types.

**Scope**:
- Create `helper_usage` table with RLS policies (following Story 2.4.2 patterns)
- Create `user_preferences` table (or extend existing) for dismissal state
- Define TypeScript types (`src/types/helper.ts`)
- Implement data access layer (`src/lib/supabase/helpers.ts`)
- Create Supabase migration file

**Deliverables**:
- SQL migration: `supabase/migrations/[timestamp]_create_helper_usage_table.sql`
- TypeScript types: `src/types/helper.ts` (HelperUsage, HelperEvent interfaces)
- Data access layer: `src/lib/supabase/helpers.ts` (createHelperUsage, getHelperUsageForEntry)
- RLS policies: SELECT, INSERT, UPDATE, DELETE for authenticated users only

**Dependencies**: None (Story 2.4.1 auth integration already complete)

**Testing**:
- Manual: Test RLS with multiple users (User A can't see User B's helper_usage)
- Verification: `psql` queries confirm table structure and policies

---

### Story 1.8.2: CBT Distortions Helper Component (3-4 days)

**Goal**: Implement CBT Distortions helper UI component with editor integration and auto-save coordination.

**Scope**:
- Create static distortion data (`src/data/cbtDistortions.ts`)
- Implement CbtDistortions component (`src/components/journal/helpers/CbtDistortions.tsx`)
- (Optional) Create HelperContainer abstraction for Issue #18 compatibility
- Extend SimpleRichEditor with `onInsertHelper` callback
- Integrate into JournalStream with auto-save coordination
- Implement exact aria-live announcements
- Apply blue/indigo gradient styling (per visual design spec)

**Deliverables**:
- Data file: `src/data/cbtDistortions.ts` (10 distortions with descriptions/examples)
- Component: `src/components/journal/helpers/CbtDistortions.tsx`
- Container (optional): `src/components/journal/helpers/HelperContainer.tsx`
- Editor API: `SimpleRichEditor.tsx` updated with `onInsertHelper` prop
- Integration: `JournalStream.tsx` updated with `handleHelperInsertion` function

**Dependencies**: Story 1.8.1 (requires `helper_usage` table and types)

**Testing**:
- Manual: Test expand/collapse, checkbox selection, Continue insertion, Clear button
- Manual: Test auto-save triggers after insertion (wait 2 seconds, refresh page)
- Manual: Test with screen reader (VoiceOver or NVDA) for aria-live announcements

---

### Story 1.8.3: Helper Testing & Validation (2-3 days)

**Goal**: Comprehensive E2E testing, Vercel preview validation, and accessibility certification.

**Scope**:
- Write Playwright E2E test suite (10 test scenarios)
- Create Vercel preview testing checklist (25+ items)
- Test multi-user RLS isolation
- Screen reader accessibility testing
- Auto-save coordination testing
- Link rehydration compatibility testing
- Documentation updates (if needed)

**Deliverables**:
- Playwright tests: `tests/cbt-distortions-helper.test.ts`
- Test scenarios: expand/collapse, keyboard nav, insertion, auto-save, RLS, aria-live, Escape key
- Vercel preview checklist: Functionality, integration, accessibility, security, visual, console
- Test report: Summary of all passing tests with screenshots

**Dependencies**: Story 1.8.2 (requires component implementation)

**Testing**:
- Playwright: `npx playwright test tests/cbt-distortions-helper.test.ts`
- Vercel Preview: Test full checklist on preview URL from PR
- Multi-user: Sign in as 2 different users, verify RLS isolation
- Screen reader: Test with VoiceOver (Mac) or NVDA (Windows)

---

## Compatibility Requirements

### Database Compatibility
- ✅ `helper_usage` table uses additive schema (no existing table modifications)
- ✅ RLS policies follow Story 2.4.2 patterns (`auth.uid() = user_id`)
- ✅ No breaking changes to existing tables
- ✅ Foreign keys use `ON DELETE CASCADE` for cleanup

### API Compatibility
- ✅ SimpleRichEditor maintains backward compatibility (new prop is optional)
- ✅ JournalStream continues to work if helper component fails
- ✅ Auto-save coordination respects existing 2-second debounce
- ✅ Link rehydration unaffected by helper insertion

### UI Compatibility
- ✅ Helper uses blue/indigo gradient (distinct from amber Gentle Prompt)
- ✅ Follows shadcn/ui Notebook theme patterns
- ✅ Responsive layout matches existing JournalStream behavior
- ✅ Focus management doesn't interfere with existing editor focus

### Performance Compatibility
- ✅ Helper expansion doesn't block UI thread
- ✅ Database queries use indexed fields (`user_id`, `entry_id`)
- ✅ Telemetry logging is async (doesn't delay insertion)
- ✅ Component lazy-loads if needed (but small enough to inline)

---

## Risk Mitigation

### Primary Risk: Auto-save Coordination Conflicts

**Risk Description**: Helper insertion might interfere with existing auto-save logic or link rehydration, causing data loss or UI glitches.

**Likelihood**: Medium (JournalStream has complex timing with auto-save debounce and link rehydration)

**Impact**: High (could cause lost journal content or broken links)

**Mitigation**:
1. **Use Existing handleContentChange**: Helper insertion calls the same function that typing does, ensuring consistent auto-save behavior
2. **Read Editor Content After Insertion**: Wait for DOM to settle (50ms timeout), then read `editor.innerHTML` to capture updated state
3. **Test Link Rehydration Compatibility**: Ensure helper insertion doesn't interfere with links (Playwright test scenario)
4. **Flag-Based Protection**: Set `creatingLink` flag during Note creation to prevent content overrides; apply same pattern for helper insertion if needed

**Rollback Plan**: If auto-save conflicts occur:
1. Disable helper component via feature flag (if implemented)
2. Remove `handleHelperInsertion` function call from JournalStream
3. Revert SimpleRichEditor changes
4. Helper usage data remains in database for future fixes

### Secondary Risk: RLS Policy Misconfiguration

**Risk Description**: Incorrectly configured RLS policies could expose User A's helper usage to User B.

**Likelihood**: Low (following established Story 2.4.2 patterns)

**Impact**: High (privacy violation, compliance issue)

**Mitigation**:
1. **Copy-Paste RLS Patterns**: Use exact policy structure from `links` table (proven in production)
2. **Multi-User Testing**: Test with 2 different users in Vercel preview (mandatory acceptance criteria)
3. **Policy Validation**: Run `psql` queries to verify policy enforcement before merge

**Rollback Plan**: If RLS leak discovered:
1. Immediately disable table access via `REVOKE ALL ON helper_usage FROM authenticated`
2. Fix policies, re-test multi-user scenarios
3. Re-enable with corrected policies

### Tertiary Risk: Accessibility Non-Compliance

**Risk Description**: Screen reader users can't use helper effectively or aria-live announcements don't work.

**Likelihood**: Low (comprehensive accessibility spec provided)

**Impact**: Medium (WCAG AA non-compliance, poor UX for screen reader users)

**Mitigation**:
1. **Exact aria-live Specification**: Provided in Codex integration document with exact message format
2. **Playwright Accessibility Tests**: Test aria-live region, focus management, keyboard navigation
3. **Manual Screen Reader Testing**: Test with VoiceOver or NVDA before merge (Story 1.8.3)

**Rollback Plan**: If accessibility issues found:
1. Keep helper visible but mark as "experimental" in UI
2. Fix accessibility issues in follow-up PR
3. Re-test with screen reader before promoting to stable

---

## Definition of Done

### Epic-Level DoD

- ✅ All 3 stories completed with acceptance criteria met
- ✅ Database migration deployed to production
- ✅ Component integrated into JournalStream
- ✅ Playwright E2E tests pass (10 scenarios)
- ✅ Vercel preview testing checklist completed (25+ items)
- ✅ Multi-user RLS isolation verified
- ✅ Screen reader testing completed with passing results
- ✅ Auto-save coordination tested and working
- ✅ Link rehydration compatibility confirmed
- ✅ No console errors in browser or terminal
- ✅ No regression in existing journaling flow
- ✅ Documentation updated (if needed)
- ✅ PR merged to `dev` branch, then to `main` after dev validation

### Per-Story DoD

Each story must meet:
- ✅ All story acceptance criteria met
- ✅ Code follows project coding standards (TypeScript strict, 2-space indent, etc.)
- ✅ No ESLint errors (`npm run lint`)
- ✅ Builds successfully (`npm run build`)
- ✅ Tested locally with `npm run dev`
- ✅ PR created with detailed description and screenshots
- ✅ Tested on Vercel preview deployment
- ✅ Code reviewed and approved
- ✅ User merges PR (not Claude)

---

## Timeline Estimate

### Optimistic (7 days)
- Story 1.8.1: 1 day (database straightforward)
- Story 1.8.2: 3 days (component implementation smooth)
- Story 1.8.3: 2 days (testing passes on first run)
- Buffer: 1 day for review and minor fixes

### Realistic (9 days)
- Story 1.8.1: 1.5 days (RLS policy refinement)
- Story 1.8.2: 4 days (editor integration takes extra time)
- Story 1.8.3: 2.5 days (Playwright tests need iteration)
- Buffer: 1 day for Vercel preview fixes

### Pessimistic (11 days)
- Story 1.8.1: 2 days (user_preferences table complications)
- Story 1.8.2: 4 days (auto-save coordination requires debugging)
- Story 1.8.3: 3 days (accessibility issues found, need fixes)
- Buffer: 2 days for multi-user testing and fixes

**Recommended Target**: 9 days (realistic)

---

## Dependencies

### External Dependencies
- ✅ **Story 2.4.1 (Auth Integration)**: COMPLETE - Provides authenticated user context
- ✅ **Story 2.4.2 (Link Migration)**: COMPLETE - Establishes RLS pattern to follow
- ⏳ **Story 2.4.4 (Incremental Analysis)**: IN PROGRESS - Will benefit from helper_usage telemetry
- ⏳ **Issue #18 (Unified Helper Framework)**: BLOCKED BY THIS EPIC - HelperContainer pattern will inform design

### Internal Dependencies (Story Sequence)
1. **Story 1.8.1 → Story 1.8.2**: Database must exist before component can log usage
2. **Story 1.8.2 → Story 1.8.3**: Component must be implemented before testing
3. **Story 1.8.3 → PR Merge**: All tests must pass before merge approval

---

## Related Documentation

### Issue #17 Documentation (4,000+ lines)
1. **Original Issue**: [#17](https://github.com/levineam/Signum/issues/17) - UX requirements, accessibility, CBT table
2. **Architecture Review**: [Comment 1](https://github.com/levineam/Signum/issues/17#issuecomment-3403300313) - 9 recommendations, gaps analysis
3. **Updated Specification**: [Comment 2](https://github.com/levineam/Signum/issues/17#issuecomment-3403427651) - Database schema, TypeScript types, Playwright tests (1,100+ lines)
4. **Codex Integration**: [Comment 3](https://github.com/levineam/Signum/issues/17#issuecomment-3403523034) - Deterministic specs, exact aria-live format

### Project Documentation
- **PRD**: `docs/prd.md` - Product requirements, Story 1.7 (Gentle Prompts) context
- **Tech Stack**: `docs/architecture/tech-stack.md` - Next.js 15.5.3, Supabase, shadcn/ui
- **Coding Standards**: `docs/architecture/coding-standards.md` - TypeScript strict, 2-space indent
- **Project Structure**: `docs/architecture/project-structure.md` - src/ layout, @/ alias
- **CLAUDE.md**: `.claude/CLAUDE.md` - PR-based workflow, Vercel preview testing requirements

---

## Story Manager Handoff

**Story Manager Handoff:**

"Please develop detailed user stories for this brownfield epic. Key considerations:

- **This is an enhancement to an existing system running:**
  - Next.js 15.5.3 (App Router, Turbopack) + React 19.1.0 + TypeScript ^5
  - Supabase (Postgres 17, Auth, Storage) with Row-Level Security
  - shadcn/ui with Notebook theme
  - Playwright ^1.55 for E2E testing

- **Integration points:**
  1. JournalStream component (`src/components/journal/JournalStream.tsx`) - render helper below Gentle Prompt
  2. SimpleRichEditor component (`src/components/editor/SimpleRichEditor.tsx`) - extend with `onInsertHelper` callback
  3. Supabase database - new `helper_usage` table with RLS policies
  4. Auto-save system - trigger 2-second debounce after helper insertion
  5. User preferences - store dismissal state in Supabase

- **Existing patterns to follow:**
  - **Gentle Prompts UI Pattern (Story 1.7)**: Progressive disclosure with expand/collapse, manual dismissal, amber gradient styling
  - **RLS Policy Pattern (Story 2.4.2)**: `auth.uid() = user_id` for SELECT, INSERT, UPDATE, DELETE
  - **Auto-save Pattern (JournalStream)**: 2-second debounced `handleContentChange` function
  - **Component Styling**: shadcn/ui Card and Button components with Notebook theme

- **Critical compatibility requirements:**
  - No breaking changes to existing APIs (SimpleRichEditor backward compatible)
  - Database schema is additive only (no existing table modifications)
  - UI follows existing JournalStream responsive patterns
  - Performance impact is negligible (helper expansion non-blocking)

- **Each story must include verification that existing functionality remains intact:**
  - Story 1.8.1: Verify existing RLS policies still work after new table creation
  - Story 1.8.2: Verify Gentle Prompt still works, auto-save still triggers, link rehydration unaffected
  - Story 1.8.3: Playwright regression tests confirm no existing functionality broken

The epic should maintain system integrity while delivering a CBT Cognitive Distortions helper that helps users identify and reflect on cognitive distortions through structured journaling.

**Complete Specification**: See Issue #17 with 4 comprehensive documentation comments (4,000+ lines total) covering:
- Database schema with exact SQL
- TypeScript types and interfaces
- Component implementation examples
- Playwright test suite (10 scenarios)
- Vercel preview testing checklist (25+ items)
- Exact aria-live announcement format
- Visual design specification (blue/indigo gradient)
- Risk mitigation strategies

**Timeline**: 7-11 days (realistic: 9 days) across 3 sequential stories."

---

## Notes

### Why This Epic vs Full PRD/Architecture?

This enhancement qualified for the brownfield epic process (vs full PRD) because:
- ✅ Can be completed in 3 focused stories
- ✅ No significant architectural changes (follows existing patterns)
- ✅ Integration complexity is manageable (well-defined touch points)
- ✅ Risk to existing system is low (additive feature)

However, due to the comprehensive specification work done during Issue #17 review:
- ✅ We have database schema equivalent to full architecture docs
- ✅ We have testing strategy equivalent to full test plans
- ✅ We have risk assessment equivalent to full architecture review

**Result**: This epic has "architecture-level" documentation without requiring the full PRD/Architecture process.

### Future: Issue #18 - Unified Helper Framework

This epic establishes the pattern for future helpers:
- HelperContainer abstraction (if built in Story 1.8.2)
- Helper usage tracking pattern
- Progressive disclosure UI pattern
- RLS policy pattern for helper data

Issue #18 will:
- Unify Gentle Prompts and CBT Distortions under single framework
- Add more helper types (feelings wheel, values prompts, etc.)
- Potentially rename "Gentle Prompts" to "Reflective Helpers" or similar

### Telemetry for AI Improvements

Helper usage data (`helper_usage` table) will inform:
- **Story 2.4.4 (Incremental Analysis)**: Which cognitive distortions users identify most frequently
- **Future AI Prompts**: Personalized suggestions based on user patterns
- **Helper Effectiveness**: Usage metrics, completion rates, retention

---

## Validation Checklist (Completed)

### Scope Validation
- ✅ Epic can be completed in 1-3 stories maximum (3 stories defined)
- ✅ No architectural documentation is required (follows existing patterns)
- ✅ Enhancement follows existing patterns (Gentle Prompts, RLS, shadcn/ui)
- ✅ Integration complexity is manageable (5 well-defined touch points)

### Risk Assessment
- ✅ Risk to existing system is low (additive feature, no code modifications)
- ✅ Rollback plan is feasible (drop table, remove component, revert editor)
- ✅ Testing approach covers existing functionality (Playwright regression tests)
- ✅ Team has sufficient knowledge of integration points (4,000+ lines of docs)

### Completeness Check
- ✅ Epic goal is clear and achievable (add CBT helper to journaling flow)
- ✅ Stories are properly scoped (1-2, 3-4, 2-3 days sequentially)
- ✅ Success criteria are measurable (7 concrete acceptance criteria)
- ✅ Dependencies are identified (Story 2.4.1/2.4.2 complete, 1.8.1→1.8.2→1.8.3 sequence)

---

**Epic Status**: ✅ **VALIDATED AND READY FOR IMPLEMENTATION**

**Next Action**: Story Manager to develop detailed user stories for Stories 1.8.1, 1.8.2, and 1.8.3 following this epic specification.
