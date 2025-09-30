# PRD Update Summary - September 30, 2025

## Overview

Major refactor of Story 2.4 (AI Personal Ontology Extraction) based on PM review. Split into two stories with proper prerequisites and created comprehensive supporting documentation.

## Changes Made

### 1. New Story Added: Story 2.3.6

**Title:** Unified Note Data Model & Supabase Migration

**Purpose:** Critical prerequisite for AI ontology extraction. Solves the "journal entries vs notes" architectural problem.

**Key Points:**
- Unifies `JournalEntry` and `Note` into single `Note` interface
- Adds `noteType` discriminator field ('journal-entry', 'reflection', 'ontology-value', etc.)
- Migrates all data from localStorage → Supabase
- Creates unified `notes` table with proper indexing and RLS
- Enables AI to analyze all content uniformly

**Estimate:** 2-3 days (significant refactoring)

**Location in PRD:** Lines 567-846

---

### 2. Story 2.4 Updated

**What Changed:**
- Now depends on Story 2.3.6 as prerequisite
- Switched from "journal entries" to "all notes" as data source
- Changed model from GPT-5 to **GPT-5-mini** (cost-efficient)
- Storage: Supabase from Day 1 (no localStorage)
- Simplified to MVP scope (manual trigger, no approval workflow)
- References comprehensive external documentation

**New Structure:**
- **Prerequisites** section clearly states dependency on 2.3.6
- **Context & Documentation** section with links to detailed docs
- **MVP Scope** section defines what's in/out
- Simplified acceptance criteria (points to `/docs/story-2.4-updated.md` for full details)
- Added expected test results with 20 sample notes

**Location in PRD:** Lines 849-952

---

### 3. Supporting Documentation Created

#### `/docs/openai-gpt5-api.md`
- Complete GPT-5 and GPT-5-mini API documentation
- Confirms both models are valid and available
- Responses API endpoint details
- Reasoning effort parameters ('minimal', 'low', 'medium', 'high')
- Cost estimation guidance
- Full code examples for Next.js API routes
- Prompt engineering templates for ontology extraction

**Key Findings:**
- GPT-5-mini exists and is cost-efficient for MVP
- Responses API at `/v1/responses` (not Chat Completions)
- Reasoning effort controls internal thinking tokens
- Medium effort recommended for quality/cost balance

---

#### `/docs/data-model-unification.md`
- Complete architecture proposal for unified Note model
- Problem statement explaining why current split is bad
- Proposed solution with full TypeScript interfaces
- Supabase schema with SQL migrations
- Migration strategy (5 phases)
- Implementation checklist
- References to Supabase project

**Key Decisions:**
- Single `Note` interface with `noteType` field
- Journal entries become `noteType: 'journal-entry'`
- Metadata field (JSONB) for type-specific data
- All content in one `notes` table with proper indexes

---

#### `/docs/story-2.4-updated.md`
- Complete, implementable version of Story 2.4
- MVP-focused (Story 2.4.1)
- Full implementation guide with:
  - Architecture diagrams
  - Component structure
  - API route code examples
  - Prompt templates
  - TypeScript interfaces
  - Testing strategy
  - 6-phase implementation checklist

**Key Features:**
- Manual "Analyze My Notes" button
- Direct population (no suggestion workflow)
- GPT-5-mini for cost efficiency
- Supabase storage from start
- Immediately testable with 20 sample notes

---

### 4. PRD Current Status Updated

**Before:**
```
Next Priority: Story 2.4 - AI Personal Ontology Extraction with GPT-5
```

**After:**
```
Next Priorities:
1. Story 2.3.6: Unified Note Data Model & Supabase Migration (CRITICAL)
2. Story 2.4: AI Personal Ontology Extraction with GPT-5-mini
```

**Cloud data persistence** now marked as "(partial - needs unification)"

---

### 5. Change Log Updated

Added version 3.2 entry:
> **MAJOR REFACTOR:** Added Story 2.3.6 (Unified Note Data Model & Supabase Migration) as critical prerequisite for AI features. Updated Story 2.4 with GPT-5-mini integration, Supabase storage, and MVP scope. Created comprehensive documentation: `/docs/openai-gpt5-api.md`, `/docs/data-model-unification.md`, `/docs/story-2.4-updated.md`

---

## Issues Resolved

### 1. Data Model Confusion ✅
**Problem:** Journal entries and notes treated as separate entities
**Solution:** Story 2.3.6 unifies into single Note model with noteType field

### 2. GPT Model Availability ✅
**Problem:** Story assumed GPT-5 without documentation
**Solution:** Confirmed GPT-5-mini is valid, documented API in `/docs/openai-gpt5-api.md`

### 3. Storage Architecture ✅
**Problem:** localStorage with "future Supabase migration"
**Solution:** Supabase from Day 1 in both stories, with clear migration from localStorage

### 4. Scope Clarity ✅
**Problem:** Story 2.4 bundled too much (data model + AI + approval workflow)
**Solution:** Split into 2.3.6 (foundation) and 2.4.1 (MVP extraction only)

### 5. Implementation Guidance ✅
**Problem:** Acceptance criteria lacked implementation details
**Solution:** Created `/docs/story-2.4-updated.md` with complete implementation guide

---

## Impact Assessment

### Development Timeline
- **Before:** ~5-6 days for Story 2.4 (bundled with data model work)
- **After:** 2-3 days for 2.3.6 + 2-3 days for 2.4 = **4-6 days total** (clearer scope)

### Risk Level
- **Before:** HIGH (two major changes in one story)
- **After:** MEDIUM (separated concerns, clear dependencies)

### Code Quality
- **Before:** Technical debt in data model would persist
- **After:** Clean foundation enables future features

### Cost Efficiency
- **Before:** GPT-5 (expensive)
- **After:** GPT-5-mini (cost-efficient MVP approach)

---

## Next Steps for Development

### Story 2.3.6 (Do First)
1. Review `/docs/data-model-unification.md`
2. Create Supabase migration for `notes` table
3. Update TypeScript interfaces
4. Migrate localStorage data
5. Refactor JournalStream and NotesPage components
6. Test with 20 sample notes

### Story 2.4 (Do Second)
1. Review `/docs/story-2.4-updated.md`
2. Review `/docs/openai-gpt5-api.md`
3. Set up OPENAI_API_KEY environment variable
4. Create `/src/app/api/extract-ontology/route.ts`
5. Build OntologyAnalysisButton component
6. Test with 20 sample notes
7. Verify Values/Beliefs/Aims cards populate correctly

---

## Documentation Files Created

1. `/docs/openai-gpt5-api.md` - GPT-5/GPT-5-mini API reference
2. `/docs/data-model-unification.md` - Unified Note architecture
3. `/docs/story-2.4-updated.md` - Complete Story 2.4 implementation guide
4. `/docs/prd-update-summary.md` - This file

---

## Questions Answered

**Q: Does Story 2.4 include all the data model unification work?**
**A:** No. That work is now in Story 2.3.6 as a separate, prerequisite story.

**Q: Is GPT-5 actually available?**
**A:** Yes, both GPT-5 and GPT-5-mini are valid models. Documentation confirms this.

**Q: Should we use localStorage or Supabase?**
**A:** Supabase from Day 1. Story 2.3.6 migrates localStorage → Supabase first.

**Q: Are journal entries and notes separate things?**
**A:** No. Journal entries are a noteType variant of the unified Note model.

---

## Git Commit Recommendation

```
docs: Major PRD refactor - split Story 2.4, add data model unification

- Add Story 2.3.6: Unified Note Data Model & Supabase Migration
- Update Story 2.4: GPT-5-mini integration, MVP scope, Supabase storage
- Create comprehensive docs:
  - /docs/openai-gpt5-api.md (GPT-5-mini API reference)
  - /docs/data-model-unification.md (unified Note architecture)
  - /docs/story-2.4-updated.md (complete implementation guide)
- Update Current Status and Change Log

Addresses PM feedback:
1. Journal entries should be a type of note (not separate entity)
2. Use GPT-5-mini for cost efficiency
3. Supabase integration from Day 1
4. Clear separation of concerns (data model vs AI extraction)

Closes #TBD
```

---

## Review Checklist

- [x] Story 2.3.6 added to PRD with clear scope
- [x] Story 2.4 updated with prerequisite reference
- [x] Current Status section updated
- [x] Change Log updated with version 3.2
- [x] GPT-5-mini API documentation created
- [x] Data model unification documentation created
- [x] Complete Story 2.4 implementation guide created
- [x] All feedback points addressed
- [x] Clear next steps defined

---

**Status:** ✅ PRD Update Complete
**Date:** September 30, 2025
**Author:** John (Product Manager)
**Reviewed by:** Pending user review