# Signum Story Index

**Last Updated:** November 3, 2025
**Purpose:** Comprehensive tracking of all stories across the Signum project

---

## Story Numbering System

### Epic 1 (PRD): Clean Slate & Fresh Foundation
Greenfield foundation stories documented in `/docs/prd.md`

### Epic 1 (Issue #50): Content Intelligence & Feedback System
Brownfield enhancement stories for NLP, tasks, and analytics

---

## Content Intelligence Stories (Epic 1 / Issue #50)

### ✅ Completed

| Story | Title | Status | PR | Merged |
|-------|-------|--------|-----|--------|
| 1.1 | Core NLP Infrastructure & Database Schema | ✅ Complete | #56 | Oct 21, 2025 |
| 1.2 | Natural Language Task/Reminder Parsing | ✅ Complete | #65 | Oct 24, 2025 |
| 1.2.1 | Inline Task Cards with Accept/Reject/Edit | ✅ Complete | #79 | Oct 28, 2025 |

**Location:** `docs/stories/completed/`

### ⏸️ Partially Complete

| Story | Title | Status | Notes |
|-------|-------|--------|-------|
| 1.3 | Paragraph Detection & Suggestion Card UI | ⏸️ Partial | Task cards implemented (PR #79). Real-time detection deferred. |

**Location:** `docs/stories/story-1.3-paragraph-suggestions.md`

### 📋 Planned

| Story | Title | Status | Epic |
|-------|-------|--------|------|
| 1.4 | Today Header & Task Management UI | Draft | Issue #50 |
| 1.5 | Weekly Snapshot & Rising Themes Analytics | Draft | Issue #50 |
| 1.6 | Keywords Visualization & C3 Progress Bars | Draft | Issue #50 |

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
| 2.4.6 | Production Security Hardening & Logging | **📋 PLANNED (P0)** | **Launch Blocker** |
| 2.5 | Voice Transcription | Completed (PRs #69, #72, #74) | - |

**Story 2.4.6 Details:**
- **GitHub Issue:** [#118](https://github.com/levineam/Signum/issues/118)
- **Purpose:** Remove prototype user backdoor, implement structured logging
- **Priority:** P0 (Critical - Launch Blocker)
- **Estimate:** 3.5-4.5 hours (or 45-60 min for critical security fix only)
- **Location:** `docs/stories/story-2.4.6-production-security-hardening.md`

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

## Story File Organization

### Active Stories
**Location:** `docs/stories/`
- Stories currently in planning or development
- Stories marked Draft or Planned

### Completed Stories
**Location:** `docs/stories/completed/`
- Stories marked ✅ Complete with merged PRs
- Historical reference for implementation details

---

## Numbering Conventions

### Standard Stories
- **Major:** `1.1, 1.2, 1.3` (core feature implementations)
- **Minor:** `1.2.1` (sub-stories or iterations)
- **Patch:** `1.2.1.1` (rare, for hotfixes)

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
| Epic 1 (PRD) | N/A | Greenfield Foundation | 1.1-1.7 (PRD) |
| Epic 1 (Brownfield) | #50 | Content Intelligence | 1.1-1.6 (docs) |
| Epic 2 | N/A | AI Personal Ontology | 2.1-2.4.x |
| Epic 2.5 | N/A | Helper System | 2.5.x |
| Epic 3 | N/A | Social Layer | 3.x |

---

## Status Definitions

- **✅ Complete:** Merged to production, fully functional
- **⏸️ Partial:** Some features implemented, others deferred
- **🚧 In Progress:** Active development
- **📋 Planned:** Documented, awaiting implementation
- **Draft:** Initial planning stage

---

## Quick Reference: Active Stories

**Launch Blockers:**
1. Story 2.4.6: Production Security Hardening (P0 - Critical) - [Issue #118](https://github.com/levineam/Signum/issues/118)

**High Priority:**
1. Story 1.8: Guest Journaling Before Sign-Up (Planned)
2. Story 1.4: Today Header & Task Management (Draft)

**Deferred Features:**
- Story 1.3: Real-time paragraph detection (partial completion acceptable)
- Story 1.5: Weekly Snapshot Analytics
- Story 1.6: Keywords & C3 Visualization

---

## Related Documentation

- **PRD:** `/docs/prd.md`
- **Epic 1 (Content Intelligence):** Issue #50
- **Completed Stories:** `/docs/stories/completed/`
- **CLAUDE.md:** Project instructions and workflow

---

**Maintenance Note:** Update this index when:
- New stories are created
- Story statuses change
- Stories are completed and moved to `completed/`
- PRs are merged
