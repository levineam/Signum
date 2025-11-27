# Signum Story Index

**Last Updated:** November 6, 2025
**Purpose:** Comprehensive tracking of all stories across the Signum project

---

## Story Numbering System

### Epic 1 (PRD): Clean Slate & Fresh Foundation
Greenfield foundation stories documented in `/docs/prd.md`

### Epic 1 (Issue #50): Content Intelligence & Feedback System
Brownfield enhancement stories for NLP, tasks, and analytics

### Epic 1.10: Unified Tasks & Reminders System
**NEW**: Clean rebuild replacing Stories 1.1-1.2 with PRD-spec architecture

---

## Content Intelligence Stories (Epic 1 / Issue #50)

### ⚠️ DEPRECATED (Replaced by Epic 1.10)

| Story | Title | Status | PR | Notes |
|-------|-------|--------|-----|-------|
| ~~1.1~~ | Core NLP Infrastructure & Database Schema | ⚠️ Deprecated | #56 | **Replaced by Epic 1.10** - Clean rebuild approach |
| ~~1.2~~ | Natural Language Task/Reminder Parsing | ⚠️ Deprecated | #65 | **Replaced by Epic 1.10** - Clean rebuild approach |
| ~~1.2.1~~ | Inline Task Cards with Accept/Reject/Edit | ⚠️ Deprecated | #79 | **Replaced by Epic 1.10** - Clean rebuild approach |
| ~~1.2.2~~ | Fix Duplicate Task Creation & Rejected Task Re-appearance | ⚠️ Obsolete | #130 | **Obsolete after Epic 1.10** - New architecture eliminates issues |
| ~~1.4~~ | Today Header & Task Management UI | ⚠️ Deprecated | Draft | **Replaced by Epic 1.10 Phase 2** - Widget-based UI |

**Location:** `docs/stories/completed/` (to be moved with deprecation notices)

**Deprecation Rationale**: Zero users + incomplete implementation + OSS consistency → Clean rebuild with PRD-spec schema (schedules/items/occurrences)

---

### ⏸️ Partially Complete

| Story | Title | Status | Notes |
|-------|-------|--------|-------|
| 1.3 | Paragraph Detection & Suggestion Card UI | ⏸️ Partial | Task cards implemented (PR #79). Real-time detection deferred. **NOT affected by Epic 1.10** |

**Location:** `docs/stories/story-1.3-paragraph-suggestions.md`

---

### 📋 Planned

| Story | Title | Status | Epic |
|-------|-------|--------|------|
| 1.5 | Weekly Snapshot & Rising Themes Analytics | Draft | Issue #50 |
| 1.6 | Keywords Visualization & C3 Progress Bars | Draft | Issue #50 |
| 1.8 | Guest Journaling Before Sign-Up | Planned | High Priority |
| 1.9 | AI-Powered Task Assistance | Planned | Issue #119 |

**Story 1.9 Sub-Stories:**

| Story | Title | Status | Effort |
|-------|-------|--------|--------|
| 1.9.1 | Query Detection (Rules) for Query-Based Tasks | Backlog | 2-3 days |
| 1.9.2 | UI: Add 'Ask AI' Button on Query Tasks | Backlog | 1-2 days |
| 1.9.3 | API: /api/ai/answer Endpoint for AI Responses | Backlog | 2-3 days |
| 1.9.4 | Create AI-Generated Note and Link to Task | Backlog | 2-3 days |
| 1.9.5 | Ontology Isolation + 'Add to Ontology' Toggle | Backlog | 2-3 days |
| 1.9.6 | Feature Flag and Rate Limiting for AI Answers | Backlog | 1-2 days |
| 1.9.7 | Telemetry for AI Answers Usage and Satisfaction | Backlog | 1-2 days |
| 1.9.8 | E2E and Unit Tests for 'Ask AI' Flow | Backlog | 2-3 days |

**Related Issues:** [#119](https://github.com/levineam/Signum/issues/119) (Epic), [#121-#128](https://github.com/levineam/Signum/issues) (Sub-stories)
**Location:** `docs/stories/story-1.9-ai-task-assistance.md` (epic), `docs/stories/story-1.9.{1-8}-*.md` (sub-stories)
**Total Effort:** 13-21 days (3-4 weeks), 21 story points

**Note**: Story 1.9 may integrate with Epic 1.10 after completion

---

## Epic 1.10: Unified Tasks & Reminders System (NEW)

### 📋 Ready for Implementation

**Epic Document:** `docs/stories/epic-1.10-tasks-reminders-system.md`

**Status**: 📋 Draft - Awaiting Final User Approval

**Type**: Greenfield Rebuild (Clean Slate)

**Duration**: 4-5 weeks (27 stories)

**Approach**:
- **Phase 0**: Remove existing tasks/reminders code (Stories 1.1-1.2 implementation)
- **Phase 1-5**: Rebuild with PRD-spec schema (schedules, items, occurrences)
- **Rationale**: Zero users + incomplete implementation + OSS consistency

**Key Features**:
- RFC 5545 recurrence (rrule.js native)
- Timezone-aware scheduling (IANA tzid)
- Widget-based UI (Reminders | Tasks boxes above journal)
- Supabase Edge Functions for notifications (pg_cron + web push)
- Journal integration (source linking, completion write-back)

**Story Breakdown**:
- Phase 0 (Clean Slate): Stories 1.10.1-1.10.7 (2.5 days)
- Phase 1 (PRD Schema): Stories 1.10.8-1.10.11 (2.5 days)
- Phase 2 (UI Foundation): Stories 1.10.12-1.10.17 (2 weeks)
- Phase 3 (Temporal Core): Stories 1.10.18-1.10.22 (1.5 weeks)
- Phase 4 (Actions): Stories 1.10.23-1.10.29 (1.5 weeks)
- Phase 5 (Journal Integration): Stories 1.10.30-1.10.33 (4 days)
- Phase 1.5 (Optional): Stories 1.10.34-1.10.38 (1 week)

**Replaces**: Stories 1.1, 1.2, 1.2.1, 1.2.2, 1.4

**Next Action**: User approval → Create GitHub issue → Begin Story 1.10.1

---

## Foundation Stories (PRD Epic 1)

### 📋 Planned

| Story | Title | Status | Priority |
|-------|-------|--------|----------|
| 1.8 | Guest Journaling Before Sign-Up | Planned | High |

**Related Issue:** [#111](https://github.com/levineam/Signum/issues/111)
**Location:** `docs/stories/story-1.8-guest-journaling.md`
**Effort:** 5-7 days

---

## Epic 2: AI-Powered Personal Ontology

### ✅ Completed Stories

See `docs/stories/completed/` for:
- Story 2.3.6: Unified Note Data Model
- Story 2.4.0: Dev Environment Setup
- Story 2.4.1: Complete Auth Integration
- Story 2.4.2: Migrate Links to Supabase (MVP)
- Story 2.4.3: AI Personal Ontology Extraction
- Story 2.4.4: Incremental AI Ontology Analysis

### 📋 In Progress / Planned

| Story | Title | Status | Priority |
|-------|-------|--------|----------|
| 2.4.5 | Ontology Expandable Rows | Completed (PR #49) | - |
| 2.4.6 | Production Security Hardening & Logging | **✅ COMPLETE** | **Launch Blocker Resolved** |
| 2.5 | Voice Transcription | Completed (PRs #69, #72, #74) | - |
| 2.4.8 | Execution Stack Sample Seeding (Empty State) | Draft | - |

**Story 2.4.6 Details:**
- **GitHub Issue:** [#118](https://github.com/levineam/Signum/issues/118) (Closed)
- **PR:** [#145](https://github.com/levineam/Signum/pull/145) (replaces #143)
- **Purpose:** Remove prototype user backdoor, implement structured logging
- **Priority:** P0 (Critical - Launch Blocker) → **RESOLVED ✅**
- **Completed:** November 3, 2025
- **Location:** `docs/stories/story-2.4.6-production-security-hardening.md`
- **Key Achievements:**
  - Removed prototype user (UUID `00000000-0000-0000-0000-000000000000`) from all auth tables
  - Hardened RLS policies to use `TO authenticated` (not `TO public`)
  - Implemented Pino structured logging across all 9 API routes (57 replacements)
  - Fixed Codex P1 issue: Anonymous client for RLS verification
  - Created automated verification infrastructure
  - Documented security baseline

---

## Epic 2.5: Helper System & UX Enhancements

### ✅ Completed

| Story | Title | PR | Status |
|-------|-------|-----|--------|
| 2.5.0 | Obsidian Vault Import | #62 | ✅ Merged |
| 2.5.4 | Increase Sidebar Icon/Text Size | #46 | ✅ Merged |
| 2.5.5 | Gratitude (Three Good Things) Helper | #91 | ✅ Merged |
| 2.5.6 | Values Self-Affirmation Helper | #91 | ✅ Merged |
| 2.5.7 | Self-Compassion Break Helper | #91 | ✅ Merged |
| 2.5.8 | WOOP Goal Setting Helper | #91 | ✅ Merged |
| 2.5.9 | Best Possible Self Helper | #91 | ✅ Merged |
| 2.5.10 | Savoring Helper | #91 | ✅ Merged |
| 2.5.11 | Progressive Muscle Relaxation | #91 | ✅ Merged |
| 2.5.12 | Loving-Kindness Meditation | #91 | ✅ Merged |
| 2.5.13 | Mental Contrasting Helper | #91 | ✅ Merged |

**Note:** Stories 2.5.5-2.5.13 were implemented together in PR #91 (Journaling Helpers Phase 1)

### ✅ Polish & Bug Fixes

| Story | Title | PR | Status |
|-------|-------|-----|--------|
| 2.6 | Remove Notes Page Headers | #43 | ✅ Merged |
| 2.7 | CBT Checkbox Contrast | #54 | ✅ Merged |
| 2.8 | Helpers Tile-Based UI | #93, #104 | ✅ Merged |
| 2.8.1 | WYSIWYG Formatting Buttons Fix | #90 | ✅ Merged |
| 2.9 | Helper Popup UX Enhancement | #96 | ✅ Merged |

---

## Epic 2.10: Sidebar Responsive Redesign

**Epic Document:** `docs/stories/epic-2.10-sidebar-responsive-redesign.md`

**Status**: ✅ Ready for Implementation

**Type**: Brownfield Enhancement (UX Polish)

**Duration**: 5-7 days

**Related Issue:** [#29](https://github.com/levineam/Signum/issues/29)

**Story Breakdown**:
- Story 2.10.1: Logo Asset Preparation & Integration (1-2 days)
- Story 2.10.2: Sidebar Responsive Collapse Refactoring (2-3 days)
- Story 2.10.3: Tooltip Implementation & Testing (2 days)

**Renumbered From**: Previously Epic 2.5 → Now Epic 2.10 (aligns with Helper System family)

---

## Story File Organization

### Active Stories
**Location:** `docs/stories/`
- Stories currently in planning or development
- Stories marked Draft or Planned

### Completed Stories
**Location:** `docs/stories/completed/`
- Stories marked ✅ Complete with merged PRs
- Historical reference for implementation details

### Deprecated Stories
**Location:** `docs/stories/completed/` (with ⚠️ DEPRECATED prefix)
- Stories 1.1, 1.2, 1.2.1, 1.2.2, 1.4 (replaced by Epic 1.10)

---

## Numbering Conventions

### Standard Stories
- **Major:** `1.1, 1.2, 1.3` (core feature implementations)
- **Minor:** `1.2.1` (sub-stories or iterations)
- **Patch:** `1.2.1.1` (rare, for hotfixes)

### Epic Stories
- **Epic-level:** `1.10, 2.10` (major feature sets, 20+ stories)
- Use `.10+` suffix to avoid collision with minor versions

### Helper Stories
- Use minor versions: `2.5.5, 2.5.6, 2.5.7`
- Group related helpers under same major version

### Bug Fixes / Polish
- Can reuse numbers if completed simultaneously
- Use minor versions (e.g., 2.8.1) to resolve conflicts

---

## Epic Mapping

| Epic | GitHub Issue | Description | Story Range |
|------|--------------|-------------|-------------|
| Epic 1 (PRD) | N/A | Greenfield Foundation | 1.1-1.9 (PRD) |
| Epic 1 (Brownfield) | #50, #119 | Content Intelligence & AI Task Assistance | 1.1-1.6, 1.9 (docs) |
| **Epic 1.10** | **TBD** | **Unified Tasks & Reminders (Clean Rebuild)** | **1.10.1-1.10.38** |
| **Epic 1.11** | **#177** | **Database Security & Performance Optimization** | **1.11.1-1.11.3** |
| Epic 2 | N/A | AI Personal Ontology | 2.1-2.4.x |
| Epic 2.5 | N/A | Helper System | 2.5.x |
| **Epic 2.10** | **#29** | **Sidebar Responsive Redesign** | **2.10.1-2.10.3** |
| Epic 4 | N/A | Social Layer (Future) | 4.x |

---

## Status Definitions

- **✅ Complete:** Merged to production, fully functional
- **⚠️ Deprecated:** Replaced by newer implementation (Epic 1.10)
- **⏸️ Partial:** Some features implemented, others deferred
- **🚧 In Progress:** Active development
- **📋 Planned:** Documented, awaiting implementation
- **Draft:** Initial planning stage

---

## Quick Reference: Active Stories

**Ready for Implementation:**
1. **Epic 1.11**: Database Security & Performance (✅ Ready) - 3 stories, 10-16 hours - **START IMMEDIATELY**
2. **Epic 1.10**: Unified Tasks & Reminders (📋 Awaiting approval) - 27 stories, 4-5 weeks
3. **Epic 2.10**: Sidebar Responsive Redesign (✅ Ready) - 3 stories, 5-7 days

**High Priority:**
1. Story 1.9: AI-Powered Task Assistance (Planned) - 21 story points, 3-4 weeks
2. Story 1.8: Guest Journaling Before Sign-Up (Planned)

**Deferred Features:**
- Story 1.3: Real-time paragraph detection (partial completion acceptable)
- Story 1.5: Weekly Snapshot Analytics
- Story 1.6: Keywords & C3 Visualization

**Deprecated (Replaced by Epic 1.10)**:
- ~~Story 1.1~~: Core NLP Infrastructure
- ~~Story 1.2~~: Task/Reminder Parsing
- ~~Story 1.2.1~~: Inline Task Cards
- ~~Story 1.2.2~~: Fix Duplicate Task Creation
- ~~Story 1.4~~: Today Header & Task Management

---

## Related Documentation

- **PRD:** `/docs/prd.md`
- **Epic 1.10:** `docs/stories/epic-1.10-tasks-reminders-system.md`
- **Epic 1.11:** `docs/stories/epic-1.11-database-security-performance.md`
- **Epic 2.10:** `docs/stories/epic-2.10-sidebar-responsive-redesign.md`
- **Epic 1 (Content Intelligence):** Issue #50
- **Completed Stories:** `/docs/stories/completed/`
- **CLAUDE.md:** Project instructions and workflow

---

**Maintenance Note:** Update this index when:
- New stories are created
- Story statuses change
- Stories are completed and moved to `completed/`
- Stories are deprecated (moved to `completed/` with ⚠️ prefix)
- PRs are merged
- Epic numbering changes

---

**Change Log:**
- **2025-11-12**: Added Epic 1.11 (Database Security & Performance Optimization) - 3 stories addressing 2 security vulnerabilities + 21 performance issues from Supabase Database Linter.
- **2025-11-06**: Renumbered Epic 3 → Epic 1.10 (Tasks & Reminders), Epic 2.5 (Sidebar) → Epic 2.10. Deprecated Stories 1.1-1.2.2, 1.4 (replaced by Epic 1.10).
- **2025-11-03**: Added Story 2.4.6 completion details
