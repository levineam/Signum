# Story 1.6: Keywords Visualization & C3 Progress Bars

<!-- Source: Brownfield PRD (docs/brownfield-prd-content-intelligence.md v1.2) -->
<!-- Context: Brownfield enhancement - Epic 1: Content Intelligence & Feedback System -->
<!-- Epic: https://github.com/levineam/Signum/issues/50 -->

## Status: Draft

## Story

As a **reflective journaling user**,
I want **to see a weighted visualization of my all-time keywords on the Ontology page and subtle progress bars tracking my alignment with Self/Others/Greater**,
so that **I gain long-term identity insight and motivation to continue journaling**.

## Context Source

- **Source Document:** `docs/brownfield-prd-content-intelligence.md` (v1.2)
- **Epic:** Epic 1: Content Intelligence & Feedback System (Issue #50)
- **Enhancement Type:** Long-term analytics visualization (identity reflection + engagement tracking)
- **Existing System Impact:** Adds components to Ontology page
- **Dependencies:** Story 1.1 (term_frequencies, entities, meters_daily tables), Story 1.2 (paragraph processing for term extraction)

---

## Acceptance Criteria

### Functional Requirements

**AC1:** Keywords section displays on Ontology page
- `KeywordsSection.tsx` component created in `/src/components/intelligence/`
- Added to Ontology page (`/src/app/ontology/page.tsx`) beneath Beliefs/Values/Goals cards
- Displays top 30 keywords weighted by `count_alltime` from `term_frequencies` table
- Visual weighting: **Weighted list** (default per PRD recommendations) with font size/color intensity proportional to count
- Keywords are clickable (placeholder - future enhancement to filter notes)

**AC2:** Keywords API functional
- `GET /api/keywords/all-time` endpoint created
- Accepts `userId`, optional `limit` (default 30)
- Queries `term_frequencies WHERE user_id = X ORDER BY count_alltime DESC LIMIT 30`
- Returns `{ keywords: [{ term: string, count: number, weight: number }] }`
- Weight normalized 0-1 for UI rendering (max count = 1.0, min count = 0.1)

**AC3:** Auto-update on new journal entries
- When paragraph processed (Story 1.2), term extraction increments `count_alltime` and `count_this_week` for extracted terms
- Keywords section refetches data on Ontology page load (no real-time required, batch update acceptable)
- Use SWR or React Query for caching with 5-minute revalidation

**AC4:** C3 Progress Bars component displays in Ontology sidebar
- `C3ProgressBars.tsx` component created in `/src/components/intelligence/`
- Displays 3 horizontal progress bars: Self, Others, Greater
- Positioned in Ontology page sidebar (minimal visual prominence per PRD recommendations)
- Each bar shows 0-100% fill based on rolling 7-day score
- Tooltip on hover explains score calculation:
  - Self: "Value-aligned paragraphs written this week"
  - Others: "Positive mentions of people in your network"
  - Greater: "Contributions to nature, service, learning, art, faith"

**AC5:** C3 metrics calculation functional
- `POST /api/metrics/c3` endpoint created (called after paragraph processed)
- Calculates scores:
  - **Self:** Count paragraphs with terms matching user's Values from `notes WHERE type = 'ontology-value'` (last 7 days)
  - **Others:** Count positive sentiment mentions of `entities WHERE type = 'person'` (last 7 days, weighted by recency)
  - **Greater:** Count paragraphs with domain keywords (nature, service, learning, art, faith) from predefined list
- Stores daily score in `meters_daily` table
- Returns `{ self: number, others: number, greater: number }` (0-100 scale)

**AC6:** Performance acceptable
- Keywords section loads in < 2 seconds
- C3 bars update asynchronously (don't block page render)
- Use SWR or React Query for caching/background revalidation

### Integration Requirements

**AC7:** Existing Ontology page loads normally
- Beliefs/Values/Goals cards still render
- Keywords section is additive, doesn't break existing layout

**AC8:** No visual clutter
- C3 bars subtle, not distracting from journaling experience
- Keywords section follows Notebook theme (cream, serif)

**AC9:** Keywords accurate
- Manual spot check: top keywords match actual writing patterns
- No spam terms (stop words filtered per Story 1.1)

---

## Dev Technical Guidance

### Existing System Context

**Ontology Page:**
- Location: `/src/app/ontology/page.tsx`
- Component: `/src/components/ontology/OntologyPage.tsx`
- Displays 3 card sections: Beliefs, Values, Aims
- Uses shadcn/ui Card component

**Term Frequencies Table (from Story 1.1):**
- Columns: `user_id`, `term`, `count_alltime`, `count_this_week`, `count_last_week`
- Updated automatically when paragraphs processed (Story 1.2 integration)

**Notes Table:**
- Ontology notes: `note_type IN ('ontology-value', 'ontology-belief', 'ontology-aim')`
- Used for Self score calculation (value alignment)

### Integration Approach

**Keywords Section Placement:**
1. Add `<KeywordsSection />` to `/src/app/ontology/page.tsx` after Beliefs/Values/Goals cards
2. Fetch data via `GET /api/keywords/all-time`
3. Render weighted list with varying font sizes/opacities

**C3 Progress Bars Placement:**
1. Add sidebar to Ontology page layout (or use existing sidebar if present)
2. Place `<C3ProgressBars />` in sidebar
3. Fetch data via `GET /api/metrics/c3/weekly` (last 7 days)
4. Render 3 progress bars with tooltips

**Weight Normalization:**
- Max count (highest frequency term) → weight = 1.0 → font size 24px, opacity 1.0
- Min count (30th term) → weight = 0.3 → font size 14px, opacity 0.7
- Linear interpolation: `weight = (count - minCount) / (maxCount - minCount) * 0.7 + 0.3`

**C3 Scoring Logic:**
```ts
// Self score: value-aligned paragraphs (last 7 days)
const userValues = await getOntologyNotes(userId, 'ontology-value')
const valueTerms = userValues.map(v => extractTerms(v.title))
const recentParagraphs = await getParagraphsLast7Days(userId)
const alignedCount = recentParagraphs.filter(p =>
  extractTerms(p.text).some(term => valueTerms.includes(term))
).length
const selfScore = Math.min((alignedCount / recentParagraphs.length) * 100, 100)

// Others score: positive people mentions (last 7 days)
const peopleEntities = await getEntities(userId, 'person')
const peopleMentions = peopleEntities.filter(e =>
  e.last_seen > now() - 7 days && e.sentiment_avg > 0
)
const othersScore = Math.min((peopleMentions.length / peopleEntities.length) * 100, 100)

// Greater score: domain keyword paragraphs (last 7 days)
const domainKeywords = ['nature', 'service', 'learning', 'art', 'faith', 'community', 'environment', 'teach', 'volunteer', 'create']
const domainAlignedCount = recentParagraphs.filter(p =>
  extractTerms(p.text).some(term => domainKeywords.includes(term))
).length
const greaterScore = Math.min((domainAlignedCount / recentParagraphs.length) * 100, 100)
```

### Technical Constraints

**Performance:**
- Keywords query < 100ms (uses index on user_id, term from Story 1.1)
- C3 calculation < 500ms (batch query all 3 scores)

**Visual Design:**
- Weighted list format (not tag cloud) per PRD recommendations
- Font size range: 14px (min) to 24px (max)
- Opacity range: 0.7 (min) to 1.0 (max)
- Color: single accent color with varying opacity

**Data Quality:**
- Filter keywords < 3 characters (too short, likely noise)
- Filter keywords with count < 2 (mentioned only once, not significant)

### File Locations

Create:
- `/src/components/intelligence/KeywordsSection.tsx`
- `/src/components/intelligence/C3ProgressBars.tsx`
- `/src/app/api/keywords/all-time/route.ts`
- `/src/app/api/metrics/c3/route.ts`
- `/src/app/api/metrics/c3/weekly/route.ts` (GET endpoint for current week's scores)

Modify:
- `/src/app/ontology/page.tsx` (add KeywordsSection and C3ProgressBars)

---

## Tasks / Subtasks

### Task 1: Keywords API

- [ ] Create API route `/api/keywords/all-time/route.ts`
  - [ ] Export GET handler
  - [ ] Get user from auth
  - [ ] Parse query param: `limit` (default 30)
  - [ ] Query term_frequencies: `SELECT term, count_alltime FROM term_frequencies WHERE user_id = userId AND count_alltime >= 2 AND LENGTH(term) >= 3 ORDER BY count_alltime DESC LIMIT limit`
  - [ ] Use `getTopTerms(limit)` from Story 1.1 if available

- [ ] Normalize weights
  - [ ] Get max count: `maxCount = keywords[0].count_alltime`
  - [ ] Get min count: `minCount = keywords[keywords.length - 1].count_alltime`
  - [ ] For each keyword: `weight = (count - minCount) / (maxCount - minCount) * 0.7 + 0.3`
  - [ ] Return: `{ keywords: [{ term, count, weight }] }`

- [ ] Add caching
  - [ ] Use `revalidate: 300` (5 minutes)
  - [ ] Keywords don't change frequently, safe to cache

### Task 2: Keywords Section Component

- [ ] Create KeywordsSection component `/src/components/intelligence/KeywordsSection.tsx`
  - [ ] Fetch data: `const { data } = useSWR('/api/keywords/all-time', fetcher, { refreshInterval: 300000 })`
  - [ ] Handle loading state: show skeleton
  - [ ] Handle empty state: "No keywords yet. Keep journaling to build your vocabulary!"

- [ ] Render weighted list
  - [ ] Map over keywords: `keywords.map(k => <span style={{ fontSize: interpolate(k.weight, 14, 24), opacity: interpolate(k.weight, 0.7, 1.0) }}>{k.term}</span>)`
  - [ ] Display in grid or flex wrap (multi-column layout)
  - [ ] Add hover effect: scale 1.1, show count in tooltip

- [ ] Style with Notebook theme
  - [ ] Use shadcn/ui Card component
  - [ ] Heading: "Keywords" (24px, serif)
  - [ ] Background: cream/white
  - [ ] Spacing: 2rem between cards

- [ ] Add click handler (placeholder)
  - [ ] onClick: `console.log('Filter by keyword:', keyword)` (defer full implementation)
  - [ ] Future: navigate to notes filtered by keyword

### Task 3: C3 Metrics API

- [ ] Create C3 calculation utility `/src/utils/c3Scoring.ts`
  - [ ] Function: `async function calculateC3Scores(userId: string): Promise<{ self, others, greater }>`
  - [ ] Get date range: `const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)`

- [ ] Calculate Self score
  - [ ] Query user's values: `SELECT title FROM notes WHERE user_id = userId AND note_type = 'ontology-value'`
  - [ ] Extract value terms: `const valueTerms = values.flatMap(v => extractTerms(v.title))`
  - [ ] Query recent paragraphs (pseudo-code, actual: query journal entries created in last 7 days)
  - [ ] Count aligned paragraphs: paragraphs containing value terms
  - [ ] Score: `(alignedCount / totalCount) * 100`

- [ ] Calculate Others score
  - [ ] Query people entities: `SELECT * FROM entities WHERE user_id = userId AND type = 'person' AND last_seen > sevenDaysAgo`
  - [ ] Filter positive sentiment: `entities.filter(e => e.sentiment_avg > 0)`
  - [ ] Score: `(positiveMentions / totalPeople) * 100` OR `positiveMentions * 10` (capped at 100)

- [ ] Calculate Greater score
  - [ ] Define domain keywords: `const domainKeywords = ['nature', 'environment', 'service', 'volunteer', 'community', 'learning', 'teach', 'art', 'create', 'faith', 'spiritual']`
  - [ ] Count paragraphs with domain keywords
  - [ ] Score: `(domainCount / totalCount) * 100`

- [ ] Return scores
  - [ ] `return { self: Math.min(selfScore, 100), others: Math.min(othersScore, 100), greater: Math.min(greaterScore, 100) }`

- [ ] Create C3 update endpoint `/api/metrics/c3/route.ts`
  - [ ] Export POST handler (called after paragraph processed)
  - [ ] Get user from auth
  - [ ] Call `calculateC3Scores(userId)`
  - [ ] Upsert into `meters_daily`: `INSERT INTO meters_daily (user_id, date, self_score, others_score, greater_score) VALUES (...) ON CONFLICT (user_id, date) DO UPDATE SET self_score = ..., others_score = ..., greater_score = ..., updated_at = now()`
  - [ ] Return: `{ self, others, greater }`

- [ ] Create C3 weekly endpoint `/api/metrics/c3/weekly/route.ts`
  - [ ] Export GET handler (for UI to fetch current week's scores)
  - [ ] Get user from auth
  - [ ] Query `meters_daily WHERE user_id = userId AND date >= sevenDaysAgo`
  - [ ] Average scores across days: `self = avg(self_score), others = avg(others_score), greater = avg(greater_score)`
  - [ ] Return: `{ self, others, greater }`

### Task 4: C3 Progress Bars Component

- [ ] Create C3ProgressBars component `/src/components/intelligence/C3ProgressBars.tsx`
  - [ ] Fetch data: `const { data } = useSWR('/api/metrics/c3/weekly', fetcher, { refreshInterval: 300000 })`
  - [ ] Handle loading state: show skeleton bars

- [ ] Render 3 progress bars
  - [ ] Use shadcn/ui Progress component
  - [ ] Bar 1: "Self" (value = data.self, color = blue)
  - [ ] Bar 2: "Others" (value = data.others, color = green)
  - [ ] Bar 3: "Greater" (value = data.greater, color = purple)

- [ ] Add tooltips
  - [ ] Use shadcn/ui Tooltip component
  - [ ] On hover: show explanation
    - Self: "Value-aligned paragraphs written this week"
    - Others: "Positive mentions of people in your network"
    - Greater: "Contributions to nature, service, learning, art, faith"

- [ ] Style for sidebar
  - [ ] Compact layout (max 200px width)
  - [ ] Label above each bar (12px, muted)
  - [ ] Bar height: 8px
  - [ ] Spacing: 1rem between bars

### Task 5: Integration with Ontology Page

- [ ] Modify Ontology page `/src/app/ontology/page.tsx`
  - [ ] Import components: `import KeywordsSection from '@/components/intelligence/KeywordsSection'`
  - [ ] Import C3ProgressBars: `import C3ProgressBars from '@/components/intelligence/C3ProgressBars'`

- [ ] Add Keywords section
  - [ ] Place after Beliefs/Values/Goals cards: `<KeywordsSection />`
  - [ ] Lazy load: `const KeywordsSection = dynamic(() => import('@/components/intelligence/KeywordsSection'), { ssr: false })`

- [ ] Add sidebar for C3 bars
  - [ ] If sidebar doesn't exist: create layout with main + sidebar
  - [ ] Place C3ProgressBars in sidebar: `<C3ProgressBars />`
  - [ ] If no sidebar space: place at bottom of page (fallback)

- [ ] Test layout
  - [ ] Verify Beliefs/Values/Goals still render correctly
  - [ ] Verify Keywords section appears below
  - [ ] Verify C3 bars appear in sidebar
  - [ ] Verify responsive layout (mobile: stack vertically)

### Task 6: Integration with Paragraph Processing (Story 1.2)

- [ ] Modify suggestion API `/api/suggestions/paragraph/route.ts` (from Story 1.2)
  - [ ] After processing paragraph, call term extraction (already done in Story 1.2)
  - [ ] Increment term counts: `await incrementTermCount(userId, term, 1)` for each extracted term
  - [ ] This auto-updates `count_alltime` and `count_this_week` in `term_frequencies`

- [ ] Optionally call C3 update
  - [ ] At end of paragraph processing: `await fetch('/api/metrics/c3', { method: 'POST' })`
  - [ ] Or: batch update daily (run C3 calculation once per day via cron)
  - [ ] For MVP: batch update is sufficient (less API overhead)

### Task 7: Testing

- [ ] Unit tests for C3 scoring (Vitest)
  - [ ] Test Self score: user has 3 values, 10 paragraphs, 5 aligned → score = 50
  - [ ] Test Others score: user has 5 people, 3 positive mentions → score = 60
  - [ ] Test Greater score: 10 paragraphs, 2 with domain keywords → score = 20
  - [ ] Test edge cases: no values, no people, no paragraphs → scores = 0

- [ ] Integration test for Keywords API (Playwright)
  - [ ] Create test user with 10 term frequencies
  - [ ] GET `/api/keywords/all-time?limit=5`
  - [ ] Verify top 5 terms returned
  - [ ] Verify weights normalized 0-1

- [ ] E2E test for Keywords section (Playwright)
  - [ ] Navigate to Ontology page
  - [ ] Verify Keywords section displays
  - [ ] Verify top 3 keywords match database
  - [ ] Hover over keyword, verify count tooltip appears

- [ ] E2E test for C3 bars (Playwright)
  - [ ] Navigate to Ontology page
  - [ ] Verify C3 bars display in sidebar
  - [ ] Verify bar values match expected scores
  - [ ] Hover over bar, verify tooltip appears

### Task 8: Verify Existing Functionality

- [ ] Test Ontology page loads
  - [ ] Verify Beliefs/Values/Goals cards still render
  - [ ] Verify "Analyze My Notes" button still works (Story 2.4.3)
  - [ ] No layout breaking

- [ ] Test Keywords accuracy
  - [ ] Manually review top 10 keywords
  - [ ] Verify they match actual journal content
  - [ ] Verify no stop words ("the", "a", "is")

- [ ] Test performance
  - [ ] Ontology page load time < 2 seconds
  - [ ] Keywords API response time < 100ms
  - [ ] C3 API response time < 500ms

---

## Risk Assessment

### Implementation Risks

**Primary Risk:** Keywords are inaccurate (spam terms, irrelevant words)
- **Mitigation:**
  - Filter stop words (Story 1.1)
  - Filter terms < 3 characters
  - Filter terms with count < 2 (mentioned only once)
  - Manual spot check top 30 keywords
- **Verification:**
  - User feedback: "Do these keywords reflect your writing?"
  - Analytics: track keyword click-through rate (if users engage, they're relevant)

**Secondary Risk:** C3 scores are confusing or demotivating
- **Mitigation:**
  - Clear tooltip explanations
  - No penalties or negative messaging (pure feedback, no streaks)
  - Scores based on percentage, not absolute numbers (always 0-100%)
  - Test with real users: "Do these scores make sense?"
- **Verification:**
  - User feedback survey
  - Track engagement: do users check C3 bars regularly?

**Tertiary Risk:** C3 calculation is slow, blocks paragraph processing
- **Mitigation:**
  - Batch update (once per day) instead of per-paragraph
  - Async calculation (don't block API response)
  - Cache scores in `meters_daily` table
- **Verification:**
  - Performance test: measure C3 calculation time
  - Load test: 100 concurrent paragraph processes

### Rollback Plan

If Keywords/C3 cause issues:
1. Feature flag: `ENABLE_KEYWORDS=false`, `ENABLE_C3=false`
2. Conditional render in Ontology page
3. Redeploy with flags disabled

### Safety Checks

- [ ] Ontology page renders correctly
- [ ] Keywords accurate (spot check)
- [ ] C3 bars display without errors
- [ ] Performance acceptable

---

## Definition of Done

- [ ] All acceptance criteria met (AC1-AC9)
- [ ] All tasks completed
- [ ] Keywords section displays on Ontology page
- [ ] Top 30 keywords weighted correctly
- [ ] C3 progress bars display in sidebar
- [ ] Self/Others/Greater scores calculated correctly
- [ ] Auto-update on new journal entries
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Existing functionality verified
- [ ] Keywords manually verified (spot check)
- [ ] Code follows existing patterns
- [ ] TypeScript types defined
- [ ] PR created targeting `dev` branch
- [ ] Vercel preview deployment tested

---

## File Checklist

**Create:**
- [ ] `/src/components/intelligence/KeywordsSection.tsx`
- [ ] `/src/components/intelligence/C3ProgressBars.tsx`
- [ ] `/src/app/api/keywords/all-time/route.ts`
- [ ] `/src/app/api/metrics/c3/route.ts`
- [ ] `/src/app/api/metrics/c3/weekly/route.ts`
- [ ] `/src/utils/c3Scoring.ts`
- [ ] `/src/utils/c3Scoring.test.ts` (Vitest)
- [ ] `/tests/e2e/keywords-c3.spec.ts` (Playwright)

**Modify:**
- [ ] `/src/app/ontology/page.tsx` (add KeywordsSection and C3ProgressBars)
- [ ] `/src/app/api/suggestions/paragraph/route.ts` (increment term counts, from Story 1.2)

---

## Notes

**Default Decisions (per PRD):**
- Keywords visualization: Weighted list (not tag cloud)
- C3 placement: Ontology sidebar (minimal prominence)
- Update frequency: Auto-update on page load (5-minute cache)
- Clickable keywords: Placeholder only (defer filtering to future enhancement)

**Future Enhancements (not in scope):**
- Click keyword to filter notes
- Keyword trending over time (graph)
- C3 setting to show on journal view (currently Ontology only)
