# Noticer Helper System - Brownfield PRD

**Feature Name:** Noticer Meta-Awareness System
**Type:** Brownfield Enhancement
**Target Epic:** Epic 4 (AI-Powered Personal Ontology)
**Date:** October 2025
**Status:** Planning

---

## Executive Summary

The **Noticer** is a meta-awareness system that surfaces hidden anxiety and repetitive negative thinking (RNT) through brief emotional check-ins, contextual language analysis, and intelligent helper recommendations. Unlike existing journaling helpers (Gratitude, CBT, Values, etc.) that provide structured reflection prompts, the Noticer acts as an **intelligent routing system** that detects emotional states and suggests the most appropriate helper or intervention.

**Key Innovation:** Combines Ecological Momentary Assessment (EMA), affect labeling, and RNT screening to raise implicit emotional patterns to conscious awareness, then bridges to existing therapeutic tools (CBT thought records, self-compassion exercises, etc.).

---

## Background & Context

### Problem Statement

Users often experience anxiety, rumination, and worry during journaling but:
1. **Don't recognize the pattern** until it's severe (lack of real-time awareness)
2. **Don't know which tool to use** (Signum will have 6+ helpers; which one fits this moment?)
3. **Miss subtle signals** in their own writing (all-or-nothing language, repetitive themes)

### Current State

Signum has:
- ✅ **6 evidence-based helpers** (CBT, Gratitude, Values, Self-Compassion, WOOP, Expressive Writing)
- ✅ **Manual helper activation** (user clicks helper button)
- ✅ **Helper usage tracking** (Supabase `helper_usage` table)
- ✅ **ACT-inspired prompts** for reflection
- ❌ **No emotional state detection**
- ❌ **No helper recommendation logic**
- ❌ **No pattern visualization over time**

### Proposed Solution

Add a **4-phase Noticer system**:

1. **Phase 1 (Story 2.5.10):** Manual mood check-in helper (affect + RNT scales)
2. **Phase 2 (Story 2.5.11):** RNT-based helper suggestions (low/medium/high intervention paths)
3. **Phase 3 (Story 2.5.12):** Auto-triggered check-ins based on typing patterns (absolutist language detection)
4. **Phase 4 (Story 2.5.13):** Weekly pattern visualization (emotional trends on Notes page)

---

## Goals & Success Metrics

### Primary Goals

1. **Raise awareness** of hidden anxiety/rumination patterns during journaling
2. **Increase helper engagement** by recommending the right tool at the right time
3. **Reduce cognitive load** of choosing which helper to use
4. **Surface longitudinal patterns** that inform values/ontology work

### Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Check-in completion rate** | 70%+ | % of users who finish mood check-in after starting |
| **Helper suggestion acceptance** | 40%+ | % of users who click suggested helper after RNT ≥3 |
| **Typing trigger relevance** | <10% dismissal rate | % of auto-suggestions dismissed without interaction |
| **Pattern card engagement** | 50%+ weekly views | % of users who view weekly pattern card |
| **Helper discovery improvement** | 30% increase | Increase in non-CBT helper usage after Noticer launch |

### Non-Goals

- ❌ Clinical diagnosis or mental health assessment
- ❌ Replace human therapist or medical intervention
- ❌ Track mood for insurance/employment purposes
- ❌ Social sharing of mood data

---

## Evidence Base

### Scientific Rationale

| Mechanism | Evidence | Effect Size | Key Studies |
|-----------|----------|-------------|-------------|
| **Ecological Momentary Assessment (EMA)** | Makes implicit states explicit through real-time sampling | d=0.35–0.50 | [PMC8428969](https://pmc.ncbi.nlm.nih.gov/articles/PMC8428969/) |
| **Affect Labeling** | Naming emotions reduces amygdala reactivity | d=0.43 | [PubMed 17576282](https://pubmed.ncbi.nlm.nih.gov/17576282/) |
| **RNT as Transdiagnostic Factor** | Rumination/worry drive anxiety/depression across diagnoses | r=0.50–0.60 | [PMC6370308](https://pmc.ncbi.nlm.nih.gov/articles/PMC6370308/) |
| **Self-Distancing (Pronoun Shift)** | Using "you/name" increases psychological distance | d=0.30–0.45 | [PubMed 24467424](https://pubmed.ncbi.nlm.nih.gov/24467424/) |
| **Attention Training Technique (ATT)** | Brief attention exercises reduce self-focused worry | d=0.54 | [PMC6246690](https://pmc.ncbi.nlm.nih.gov/articles/PMC6246690/) |

### Clinical Measures Adapted

- **RNT Screening Items:** Adapted from Penn State Worry Questionnaire (PSWQ) and Ruminative Response Scale (RRS) short forms
- **Affect Circumplex:** Simplified valence/arousal model (calm/tense/sad/irritable/worried)
- **Language Markers:** Absolutist word lists from Beck's CBT framework

---

## User Stories & Acceptance Criteria

### Phase 1: Mood Check-In Helper (Story 2.5.10)

**As a user,**
I want to quickly check in with my emotional state while journaling,
so that I become more aware of hidden anxiety or rumination patterns.

#### Acceptance Criteria

1. ✅ "Quick Check-In" button appears in helper toolbar (same row as Gratitude, CBT, etc.)
2. ✅ Clicking button opens `MoodCheckHelper` in collapsible `HelperContainer` with purple gradient
3. ✅ Helper displays 4-item form:
   - **Item A:** "Right now I feel:" (dropdown: calm/tense/sad/irritable/worried/other)
   - **Item B:** "Put a word on it" (free text input for affect label)
   - **Item C:** "My mind is stuck replaying a problem" (0-4 Likert scale)
   - **Item D:** "I'm worrying more than I want to" (0-4 Likert scale)
4. ✅ RNT total score calculated as `Item C + Item D` (range 0-8)
5. ✅ "Add to Journal Entry" button inserts formatted reflection:
   ```markdown
   ## Mood Check-In

   **Right now:** [affect_primary] - "[affect_label]"

   **Mind replaying problem:** [0-4]
   **Worrying more than wanted:** [0-4]
   **Total RNT score:** [0-8]
   ```
6. ✅ Data saved to `mood_checks` table with `trigger_source: 'manual'`
7. ✅ Helper collapses after insert
8. ✅ Usage tracked in `helper_usage` table with metadata

#### UI/UX Requirements

- **Time to complete:** ~60 seconds
- **Accessibility:** WCAG AA compliant, screen reader tested
- **Mobile:** Responsive layout, touch-friendly controls
- **Tone:** Descriptive, not clinical ("notice" vs "diagnose")

---

### Phase 2: Smart Helper Suggestions (Story 2.5.11)

**As a user,**
I want personalized suggestions for which helper to use based on my emotional state,
so that I don't have to guess which tool will help most right now.

#### Acceptance Criteria

1. ✅ After mood check-in completion, system evaluates RNT score:
   - **RNT 0-2:** No suggestion, just insert mood reflection
   - **RNT 3-5:** Suggest self-compassion or values helper
   - **RNT 6-8:** Suggest CBT distortions or thought record helper
2. ✅ Suggestion appears as banner within MoodCheckHelper:
   ```tsx
   <SuggestionBanner variant="purple">
     Your worry seems elevated. Want to explore this with a helper?
     <Button>Try CBT Helper</Button>
     <Button variant="ghost">Not now</Button>
   </SuggestionBanner>
   ```
3. ✅ Clicking "Try CBT Helper" button:
   - Collapses MoodCheckHelper
   - Opens suggested helper (e.g., `CbtDistortions`)
   - Logs `helper_accepted: true` in `mood_checks` table
4. ✅ Clicking "Not now":
   - Dismisses banner
   - Logs `helper_accepted: false`
   - User continues journaling normally
5. ✅ Suggestion logic stored in `/src/utils/helperRecommendations.ts`

#### Recommendation Logic (MVP)

```typescript
function recommendHelper(rntScore: number, affectPrimary: string): HelperType | null {
  // No intervention needed
  if (rntScore <= 2) return null

  // Medium RNT: self-kindness or values work
  if (rntScore >= 3 && rntScore <= 5) {
    return affectPrimary === 'sad' ? 'self-compassion' : 'values-affirmation'
  }

  // High RNT: cognitive restructuring
  if (rntScore >= 6) {
    return 'cbt-distortions'
  }

  return null
}
```

---

### Phase 3: Typing-Based Triggers (Story 2.5.12)

**As a user,**
I want subtle prompts to check in with myself when my writing shows signs of distress,
so that I catch anxiety patterns before they escalate.

#### Acceptance Criteria

1. ✅ On-device sentiment analyzer runs on journal entry text (privacy-first, no API calls)
2. ✅ Analyzer detects:
   - **Absolutist words:** always, never, must, should, can't, impossible, totally, completely
   - **Negation density:** ratio of negative words (not, no, nothing, none) to total words
3. ✅ Trigger threshold: `≥3 absolutist words in entry with 50+ words AND no check-in today`
4. ✅ Subtle banner appears above editor:
   ```tsx
   <Banner variant="purple" dismissible>
     Noticing a lot of all-or-nothing language. Want a 30-sec check-in?
     <Button size="sm">Yes</Button>
   </Banner>
   ```
5. ✅ Clicking "Yes" opens MoodCheckHelper with `trigger_source: 'typing'`
6. ✅ Banner dismissed → logged to `language_flags` table
7. ✅ Banner max frequency: 1 per day per user (prevent annoyance)

#### Technical Implementation

```typescript
// src/utils/sentimentAnalyzer.ts
const ABSOLUTIST_WORDS = [
  'always', 'never', 'must', 'should', 'can\'t', 'cannot',
  'impossible', 'totally', 'completely', 'absolutely'
]

interface SentimentAnalysis {
  absolutistCount: number
  negationRatio: number
  shouldSuggestCheckIn: boolean
  flaggedPhrases: string[]
}

export function analyzeEntry(text: string): SentimentAnalysis {
  const words = text.toLowerCase().split(/\s+/)
  const absolutistCount = words.filter(w => ABSOLUTIST_WORDS.includes(w)).length
  const negationWords = words.filter(w => ['not', 'no', 'nothing', 'none'].includes(w)).length
  const negationRatio = negationWords / words.length

  return {
    absolutistCount,
    negationRatio,
    shouldSuggestCheckIn: words.length >= 50 && absolutistCount >= 3,
    flaggedPhrases: [] // Future: phrase-level detection
  }
}
```

#### Privacy & Guardrails

- ✅ All analysis runs client-side (no text sent to server)
- ✅ Only aggregate counts stored in database
- ✅ User can mute typing triggers for 30 days via settings
- ✅ Crisis phrase detection → show resources link (non-blocking)

---

### Phase 4: Weekly Pattern Visualization (Story 2.5.13)

**As a user,**
I want to see patterns in my emotional state over time,
so that I can understand triggers and inform my values/ontology work.

#### Acceptance Criteria

1. ✅ New "Emotional Patterns" card appears on Notes page (Personal Ontology section)
2. ✅ Card displays weekly summary:
   ```tsx
   <Card variant="purple">
     <h3>This Week's Emotional Patterns</h3>

     <PatternInsight>
       Worry intensity peaked Tuesday/Thursday evenings
     </PatternInsight>

     <AffectLabels>
       Common feelings: "uncertain", "behind", "overwhelmed"
     </AffectLabels>

     <RNTChart data={weeklyRNTScores} />

     <Button>Explore values helper</Button>
   </Card>
   ```
3. ✅ Data source: `mood_checks` table (last 7 days)
4. ✅ Insights calculated server-side via API route `/api/mood-patterns`
5. ✅ Chart library: **Recharts** (install via `npm i recharts` - not currently in dependencies)
   - SSR note (Next.js): import charts dynamically with `next/dynamic` and `ssr: false`; wrap charts with `ResponsiveContainer` to avoid hydration/layout issues
   - Example:
     ```tsx
     const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } = dynamic(
       () => import('recharts'),
       { ssr: false }
     ) as unknown as typeof import('recharts')

     // ...
     <ResponsiveContainer width="100%" height={200}>
       <LineChart data={weeklyRNTScores}>
         <XAxis dataKey="day" />
         <YAxis domain={[0, 8]} />
         <Tooltip />
         <Line type="monotone" dataKey="rnt" stroke="#7C3AED" />
       </LineChart>
     </ResponsiveContainer>
     ```
6. ✅ Clicking "Explore values helper" → opens `ValuesAffirmationHelper`
7. ✅ Pattern card only appears if user has ≥3 check-ins in past 7 days

#### Pattern Calculation Logic

```typescript
interface WeeklyPattern {
  peakTimes: string[]        // ["Tuesday evening", "Thursday evening"]
  commonLabels: string[]     // ["uncertain", "behind"]
  averageRNT: number         // 0-8 scale
  trendDirection: 'up' | 'down' | 'stable'
}

function calculateWeeklyPattern(checkIns: MoodCheck[]): WeeklyPattern {
  // Group by day/time, find RNT peaks, extract common affect_labels
  // ...implementation details...
}
```

---

## Technical Architecture

### New Components

```
/src/components/journal/helpers/
  ├── MoodCheckHelper.tsx           # Phase 1: Check-in form
  ├── HelperSuggestionBanner.tsx    # Phase 2: Recommendation UI
  └── EmotionalPatternCard.tsx      # Phase 4: Weekly visualization

/src/utils/
  ├── sentimentAnalyzer.ts          # Phase 3: Language detection
  └── helperRecommendations.ts      # Phase 2: Suggestion logic

/src/app/api/mood-patterns/
  └── route.ts                      # Phase 4: Weekly pattern API
```

### Database Schema

**Note**: Requires `pgcrypto` extension (enabled by default on Supabase) for `gen_random_uuid()`. Include an explicit extension guard in the migration to avoid env drift.

```sql
-- Ensure required extension exists
create extension if not exists pgcrypto;

-- Phase 1: Mood check-ins
CREATE TABLE mood_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES notes(id) ON DELETE SET NULL,

  -- Affect data
  affect_primary TEXT NOT NULL CHECK (affect_primary IN ('calm', 'tense', 'sad', 'irritable', 'worried', 'other')),
  affect_label TEXT,  -- Free text: "Put a word on it"

  -- RNT scoring
  rnt_replaying_score INT NOT NULL CHECK (rnt_replaying_score BETWEEN 0 AND 4),
  rnt_worrying_score INT NOT NULL CHECK (rnt_worrying_score BETWEEN 0 AND 4),
  rnt_total_score INT GENERATED ALWAYS AS (rnt_replaying_score + rnt_worrying_score) STORED,
  CHECK (rnt_total_score BETWEEN 0 AND 8),

  -- Trigger context
  trigger_source TEXT NOT NULL CHECK (trigger_source IN ('manual', 'typing', 'scheduled')),

  -- Phase 2: Follow-up actions
  suggested_helper TEXT CHECK (suggested_helper IN ('cbt-distortions', 'gratitude', 'values-affirmation', 'self-compassion', 'woop', 'expressive-writing')),
  helper_accepted BOOLEAN,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for pattern queries (separate from table definition)
CREATE INDEX idx_mood_checks_user_created ON mood_checks (user_id, created_at DESC);
CREATE INDEX idx_mood_checks_rnt ON mood_checks (user_id, rnt_total_score);

-- Phase 3: Language flags
CREATE TABLE language_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,

  absolutist_count INT NOT NULL DEFAULT 0,
  negation_ratio FLOAT NOT NULL DEFAULT 0,

  check_in_suggested BOOLEAN NOT NULL DEFAULT false,
  check_in_completed BOOLEAN NOT NULL DEFAULT false,
  banner_dismissed BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for language flags (separate from table definition)
CREATE INDEX idx_language_flags_user_date ON language_flags (user_id, created_at DESC);

-- RLS policies (explicit SELECT/INSERT/UPDATE/DELETE)
ALTER TABLE mood_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_flags ENABLE ROW LEVEL SECURITY;

-- Enforce RLS even for table owners (service role still bypasses)
ALTER TABLE mood_checks FORCE ROW LEVEL SECURITY;
ALTER TABLE language_flags FORCE ROW LEVEL SECURITY;

-- Mood checks RLS policies
CREATE POLICY "Users can view own mood checks"
  ON mood_checks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mood checks"
  ON mood_checks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mood checks"
  ON mood_checks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mood checks"
  ON mood_checks FOR DELETE
  USING (auth.uid() = user_id);

-- Language flags RLS policies
CREATE POLICY "Users can view own language flags"
  ON language_flags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own language flags"
  ON language_flags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own language flags"
  ON language_flags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own language flags"
  ON language_flags FOR DELETE
  USING (auth.uid() = user_id);

-- Phase 3: User preferences for Noticer settings
-- Extend existing user_preferences table
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS noticer_preferences JSONB DEFAULT '{}'::jsonb;

-- Example noticer_preferences shape:
-- {
--   "typingTriggerMutedUntil": "2025-11-15T00:00:00Z",
--   "autoSuggestionsEnabled": true
-- }
```

### Type Definitions

**Implementation Note**: Follow existing snake_case → camelCase mapping pattern from `src/lib/supabase/helpers.ts:206-227`. Consider creating `src/types/noticer.ts` for Noticer-specific types.

```typescript
// src/types/helper.ts additions

export type HelperType =
  | 'cbt-distortions'
  | 'gratitude'          // Add when Story 2.5.5 implemented
  | 'values-affirmation' // Add when Story 2.5.6 implemented
  | 'self-compassion'    // Add when Story 2.5.7 implemented
  | 'woop'               // Add when Story 2.5.8 implemented
  | 'expressive-writing' // Add when Story 2.5.9 implemented
  | 'mood-check'         // 🆕 Add in Story 2.5.10

// Keep HelperType union aligned with DB CHECK constraints and UI to avoid runtime errors

export type AffectType = 'calm' | 'tense' | 'sad' | 'irritable' | 'worried' | 'other'

export interface MoodCheck {
  id: string
  userId: string
  entryId: string | null
  affectPrimary: AffectType
  affectLabel: string | null
  rntReplayingScore: number  // 0-4
  rntWorryingScore: number   // 0-4
  rntTotalScore: number      // 0-8 (computed)
  triggerSource: 'manual' | 'typing' | 'scheduled'
  suggestedHelper: HelperType | null
  helperAccepted: boolean | null
  createdAt: string
}

export interface LanguageFlag {
  id: string
  userId: string
  entryId: string
  absolutistCount: number
  negationRatio: number
  checkInSuggested: boolean
  checkInCompleted: boolean
  bannerDismissed: boolean
  createdAt: string
}

export interface NoticerPreferences {
  typingTriggerMutedUntil: string | null  // ISO timestamp
  autoSuggestionsEnabled: boolean
}
```

---

## User Experience Flow

### Flow 1: Manual Check-In (Phase 1)

1. User is journaling about a stressful day
2. Sees "Quick Check-In" button in helper toolbar
3. Clicks → MoodCheckHelper expands with 4-item form
4. Selects "worried", types "overwhelmed by deadlines"
5. Rates replaying: 3, worrying: 4 (RNT total: 7)
6. Clicks "Add to Journal Entry"
7. Formatted reflection inserts into journal
8. Helper collapses

### Flow 2: Smart Suggestion (Phase 2)

1. (Continuing from Flow 1)
2. After step 6, suggestion banner appears:
   > "Your worry seems elevated. Want to explore this with a helper?
   > [Try CBT Helper] [Not now]"
3. User clicks "Try CBT Helper"
4. MoodCheckHelper collapses
5. CBTDistortions helper opens automatically
6. User selects "Catastrophizing" distortion
7. Completes CBT thought record

**Insight:** Noticer bridged awareness → intervention seamlessly

### Flow 3: Typing Trigger (Phase 3)

1. User types: "I always mess things up. I can never get it right. This is impossible."
2. Sentiment analyzer detects 3 absolutist words in 50-word entry
3. Purple banner appears: "Noticing a lot of all-or-nothing language. Want a 30-sec check-in?"
4. User clicks "Yes"
5. MoodCheckHelper opens with `trigger_source: 'typing'`
6. User completes check-in, discovers RNT: 6
7. Suggested to try CBT helper

**Insight:** System caught distress signal user wasn't consciously aware of

### Flow 4: Weekly Pattern (Phase 4)

1. User visits Notes page on Friday
2. Sees "Emotional Patterns" card with chart
3. Chart shows RNT spikes on Tuesday/Thursday evenings
4. Common labels: "uncertain", "behind schedule"
5. User realizes: "I'm anxious before weekly 1:1s with my boss"
6. Clicks "Explore values helper"
7. Reflects on "Career" value and what matters in work relationships

**Insight:** Longitudinal pattern revealed insight for values work

---

## Integration with Existing Features

### Helper Integration Strategy

**Current UI Pattern** (as of Story 2.5.4):
- Helpers render as `HelperContainer` components embedded directly above the journal editor
- CBT helper currently shown for today's entry: `src/components/journal/JournalStream.tsx:520-527`
- No separate helper toolbar yet

**Phase 1 Implementation Options**:

**Option A (Lighter, Matches Current Pattern):**
Render `MoodCheckHelper` as another `HelperContainer` above today's editor, similar to CBT:
```tsx
// src/components/journal/JournalStream.tsx

{isTodaysEntry && (
  <>
    <CbtDistortions {...} />
    <MoodCheckHelper {...} />  {/* 🆕 Add below CBT helper */}
  </>
)}
```

**Option B (Future-Ready Toolbar):**
Implement a helper toolbar row with buttons for all helpers (includes refactoring CBT):
```tsx
// src/components/journal/JournalStream.tsx

{isTodaysEntry && (
  <HelperToolbar>
    <Button onClick={() => openHelper('gratitude')}>Three Good Things</Button>
    <Button onClick={() => openHelper('values-affirmation')}>Values</Button>
    <Button onClick={() => openHelper('cbt-distortions')}>CBT</Button>
    <Button onClick={() => openHelper('self-compassion')}>Self-Compassion</Button>
    <Button onClick={() => openHelper('woop')}>WOOP</Button>
    <Button onClick={() => openHelper('expressive-writing')}>Expressive Writing</Button>
    <Button onClick={() => openHelper('mood-check')} variant="purple">
      Quick Check-In  {/* 🆕 Noticer */}
    </Button>
  </HelperToolbar>
)}
```

**Recommendation**: Use **Option A** for Phase 1 (Story 2.5.10) to minimize scope, then migrate to **Option B** in a dedicated "Helper Toolbar" story after all Phase 1-2 helpers are implemented.

### Notes Page (Personal Ontology)

```tsx
// src/app/notes/page.tsx

<PersonalOntologySection>
  <ValuesCard />
  <BeliefsCard />
  <AimsCard />
  <EmotionalPatternCard />  {/* 🆕 Phase 4 */}
</PersonalOntologySection>
```

### Helper Usage Tracking

Noticer check-ins logged to existing `helper_usage` table:

```typescript
await createHelperUsage({
  helperType: 'mood-check',
  entryId: currentEntryId,
  selectedItems: [affectPrimary, affectLabel],
  metadata: {
    rntTotalScore: rntReplayingScore + rntWorryingScore,
    triggerSource: 'manual',
    suggestedHelper: 'cbt-distortions',
    helperAccepted: true
  }
}, userId)
```

---

## Privacy & Ethical Considerations

### Privacy-First Design

1. **On-device analysis:** Sentiment detection runs client-side (no text transmitted to server)
2. **Aggregate storage:** Only counts/scores stored, not full text
   - `language_flags` table stores `absolutist_count` and `negation_ratio`, **not raw entry text**
   - `mood_checks` stores affect labels (user-provided strings), but **not journal entry content**
   - Existing `helper_usage.metadata` stores fixed prompt text (CBT distortion names), **never free-text journal content**
3. **User control:**
   - Mute typing triggers for 30 days via `noticer_preferences.typingTriggerMutedUntil`
   - Dismiss individual suggestions (non-persistent, session-only)
   - Delete mood check history via Settings → "Delete all mood checks" (API endpoint: `/api/mood-checks/delete-all`)
4. **Data ownership:** All mood data exportable via Settings → "Export mood data" (CSV/JSON download with RLS-scoped query)

### Guardrails

1. **Disclaimer:** "This is for self-awareness, not a medical tool"
2. **Crisis detection:** If entry contains crisis phrases → show resources link (non-blocking, dismissible)
   - **Implementation**: Client-side phrase detection (minimal list: "suicide", "kill myself", "end my life", "no reason to live")
   - **UX**: Non-blocking banner with external resources link (e.g., 988 Suicide & Crisis Lifeline)
   - **Privacy**: No DB writes for crisis phrases; only log `crisis_banner_shown: boolean` flag (no text content)
   - **Dismissible**: User can close banner; don't re-trigger for same entry
3. **No diagnosis:** Never use clinical terms ("anxiety disorder", "depression")
4. **Tone guidelines:**
   - Use: "notice", "explore", "check in", "pattern"
   - Avoid: "diagnose", "treat", "fix", "disorder"

### Accessibility

- WCAG AA compliant (4.5:1 contrast, keyboard nav)
- Screen reader tested for all new components
- Mobile-responsive (helpers work on phone)

---

## Implementation Plan

### Phase 1: Mood Check-In (Story 2.5.10)
**Timeline:** 1 week
**Dependencies:** None (uses existing HelperContainer)

- [ ] Create `MoodCheckHelper.tsx` component
- [ ] Add `mood-check` to HelperType union
- [ ] Create `mood_checks` table + RLS policies
- [ ] Implement 4-item form (affect + RNT Likert)
- [ ] Add "Quick Check-In" button to helper toolbar
- [ ] Write Playwright tests
- [ ] Deploy to dev environment

### Phase 2: Smart Suggestions (Story 2.5.11)
**Timeline:** 3-4 days
**Dependencies:** Phase 1 complete

- [ ] Create `HelperSuggestionBanner.tsx`
- [ ] Implement `/src/utils/helperRecommendations.ts`
- [ ] Add suggestion logic to MoodCheckHelper
- [ ] Update `mood_checks` schema (suggested_helper, helper_accepted)
- [ ] Test helper auto-open flow
- [ ] Measure acceptance rates

### Phase 3: Typing Triggers (Story 2.5.12)
**Timeline:** 1 week
**Dependencies:** Phase 1 complete

- [ ] Create `/src/utils/sentimentAnalyzer.ts`
- [ ] Add absolutist word lexicon
- [ ] Create `language_flags` table
- [ ] Implement debounced text analysis in JournalStream
- [ ] Add suggestion banner to editor
- [ ] Add "Mute for 30 days" user preference
- [ ] Test trigger thresholds (avoid false positives)

### Phase 4: Weekly Patterns (Story 2.5.13)
**Timeline:** 1 week
**Dependencies:** Phase 1 complete + 7 days of user data

- [ ] Create `EmotionalPatternCard.tsx`
- [ ] Implement `/api/mood-patterns` route
- [ ] Add pattern calculation logic
- [ ] Integrate Recharts for RNT visualization
- [ ] Add card to Notes page
- [ ] Test with mock weekly data

**Total Estimated Timeline:** 3-4 weeks across 4 stories

---

## Open Questions

1. **Scheduling triggers (future):** Should we add `trigger_source: 'scheduled'` for daily check-in reminders?
2. **Self-distancing micro-exercise:** Original proposal included "write one sentence using 'you/name'" after high RNT. Include in Phase 2?
3. **ATT audio clips:** Should we integrate 2-minute Attention Training Technique audio/script in Phase 2?
4. **Pattern sharing:** Allow users to share anonymized emotional pattern insights in social feed?
5. **Helper recommendation ML:** Use historical `helper_usage` data to personalize suggestions beyond RNT score?

---

## Success Criteria (MVP)

### Phase 1 Success Metrics
- ✅ 70%+ completion rate for mood check-ins
- ✅ <5% bug reports related to check-in form
- ✅ Positive qualitative feedback on 60-second flow

### Phase 2 Success Metrics
- ✅ 40%+ helper acceptance rate from suggestions
- ✅ 30% increase in non-CBT helper usage (Gratitude, Values, Self-Compassion)
- ✅ <10% "suggestion fatigue" complaints

### Phase 3 Success Metrics
- ✅ <10% banner dismissal rate without interaction
- ✅ Typing triggers lead to check-ins 50%+ of the time
- ✅ <3% users mute typing triggers permanently

### Phase 4 Success Metrics
- ✅ 50%+ weekly pattern card views among active users
- ✅ Pattern insights correlate with values work (qualitative)
- ✅ Users report "aha moments" from seeing trends

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Users find auto-triggers annoying** | High | Max 1 trigger/day; easy mute option; gentle tone |
| **Low helper acceptance rate** | Medium | Improve recommendation logic; A/B test messaging |
| **Privacy concerns about sentiment analysis** | High | Emphasize on-device processing; transparent data policy |
| **Insufficient mood data for patterns** | Medium | Only show pattern card if ≥3 check-ins/week |
| **Users feel "diagnosed" by RNT score** | High | Use descriptive language; avoid clinical terms |

---

## Appendix: Copy & Microcopy

### Mood Check-In Helper

**Header:** "Quick Check-In"
**Description:** "How are you feeling right now? This takes about 60 seconds."

**Item A:** "Right now I feel:"
Options: Calm / Tense / Sad / Irritable / Worried / Other

**Item B:** "Put a word on it"
Placeholder: "e.g., overwhelmed, excited, uncertain"

**Item C:** "My mind is stuck replaying a problem"
Scale: 0 (Not at all) → 4 (Very much)

**Item D:** "I'm worrying more than I want to"
Scale: 0 (Not at all) → 4 (Very much)

**Button:** "Add to Journal Entry"

### Suggestion Banner (RNT 3-5)

> "Your worry seems elevated. Want to explore this with self-compassion?"
> [Try Self-Compassion Helper] [Not now]

### Suggestion Banner (RNT 6-8)

> "Noticing strong rumination. The CBT helper might help identify thinking patterns."
> [Try CBT Helper] [Not now]

### Typing Trigger Banner

> "Noticing a lot of all-or-nothing language. Want a 30-sec check-in?"
> [Yes] [Dismiss for today]

### Weekly Pattern Card

**Header:** "This Week's Emotional Patterns"

**Insight:** "Worry intensity peaked Tuesday/Thursday evenings"

**Labels:** "Common feelings: 'uncertain', 'behind', 'overwhelmed'"

**CTA:** "Explore values helper" (if RNT trend upward)

---

## Ready-To-Implement Checklist

### Phase 1 Prerequisites (Story 2.5.10)

**Type System:**
- [ ] Add `'mood-check'` to `HelperType` union in `src/types/helper.ts:17`
- [ ] Create `src/types/noticer.ts` with `MoodCheck`, `LanguageFlag`, `NoticerPreferences` interfaces
- [ ] Follow snake_case → camelCase mapping pattern from `src/lib/supabase/helpers.ts:206-227`

**Database Migration:**
- [ ] Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_create_noticer_tables.sql`
- [ ] Add `mood_checks` table with corrected index syntax (separate `CREATE INDEX` statements)
- [ ] Add RLS policies with explicit `SELECT/INSERT/UPDATE/DELETE` and `WITH CHECK` clauses
- [ ] Add `noticer_preferences` JSONB column to existing `user_preferences` table
- [ ] Apply migration to dev environment and test RLS

**Component:**
- [ ] Create `src/components/journal/helpers/MoodCheckHelper.tsx`
- [ ] Use existing `HelperContainer` component with `variant="purple"`
- [ ] Implement 4-item form (affect dropdown + affect label text + 2 RNT Likert scales)
- [ ] Follow CBT helper pattern for collapse/announce/insert and non-blocking usage logging
- [ ] Wire `handleHelperInsertion` in `src/components/journal/JournalStream.tsx:182-229`

**UI Integration (Option A - Recommended for MVP):**
- [ ] Render `MoodCheckHelper` below `CbtDistortions` for today's entry
- [ ] Add conditional rendering: `{isTodaysEntry && <MoodCheckHelper {...} />}`
- [ ] Defer helper toolbar refactor to post-Phase 2

**Testing:**
- [ ] Add Playwright test: `tests/mood-check-insert.spec.ts`
- [ ] Test flow: open → fill form → submit → insertion → collapse
- [ ] Assertion: inserted markdown block present in entry and helper collapses after submit
- [ ] Unit test RNT score calculation (sum of 2 Likert scales, 0-8 range)

---

### Phase 2 Prerequisites (Story 2.5.11)

**Utils:**
- [ ] Create `src/utils/helperRecommendations.ts`
- [ ] Implement `recommendHelper(rntScore, affectPrimary)` logic (see PRD:157-174)
- [ ] Add unit tests for recommendation matrix

**Component:**
- [ ] Create `src/components/journal/helpers/HelperSuggestionBanner.tsx`
- [ ] Embed in `MoodCheckHelper` conditional on RNT thresholds (3-5, 6-8)
- [ ] Test helper auto-open flow (accept vs dismiss)

**Database:**
- [ ] Ensure `mood_checks.suggested_helper` and `helper_accepted` columns exist
- [ ] Log suggestion data for analytics

---

### Phase 3 Prerequisites (Story 2.5.12)

**Utils:**
- [ ] Create `src/utils/sentimentAnalyzer.ts`
- [ ] Implement `analyzeEntry(text)` with absolutist word detection
- [ ] Add debounce logic (e.g., 2-second delay after typing stops)

**Database Migration:**
- [ ] Add `language_flags` table with corrected indexes
- [ ] Add RLS policies (SELECT/INSERT/UPDATE/DELETE with WITH CHECK)

**UI:**
- [ ] Add typing trigger banner above editor (purple, dismissible)
- [ ] Enforce 1-banner-per-day limit via `language_flags` query
- [ ] Add "Mute for 30 days" preference UI in Settings

**Privacy:**
- [ ] Verify all analysis runs client-side (no text sent to API)
- [ ] Store only `absolutist_count` and `negation_ratio` in DB

---

### Phase 4 Prerequisites (Story 2.5.13)

**Dependencies:**
- [ ] Install Recharts: `npm i recharts`

**API:**
- [ ] Create `src/app/api/mood-patterns/route.ts`
- [ ] Implement weekly pattern aggregation (last 7 days)
- [ ] Return RNT trends, peak times, common affect labels

**Component:**
- [ ] Create `src/components/notes/EmotionalPatternCard.tsx`
- [ ] Add to Notes page: `src/app/notes/page.tsx`
- [ ] Gate visibility on ≥3 check-ins in past 7 days
- [ ] Integrate Recharts for RNT timeline visualization

**Testing:**
- [ ] Mock API with 7 days of sample mood check data
- [ ] Test pattern calculation logic (peak times, common labels)
- [ ] Verify chart renders correctly with real RNT scores

---

### Additional Implementation Notes (from GPT-5 Feedback)

**Data Minimization:**
- [ ] Review existing `helper_usage.metadata` to avoid logging free-text journal content
- [ ] Confirm CBT helper only stores fixed distortion names, not user entries

**Crisis Detection:**
- [ ] Add minimal phrase list: `["suicide", "kill myself", "end my life", "no reason to live"]`
- [ ] Implement non-blocking banner with external resources link (988 Lifeline)
- [ ] Log only `crisis_banner_shown: boolean` flag (no phrase content)

**Export/Delete Features:**
- [ ] Add Settings page action: "Delete all mood checks" → `/api/mood-checks/delete-all`
- [ ] Add Settings page action: "Export mood data" → CSV/JSON download (RLS-scoped)

**Performance:**
- [ ] Debounce sentiment analyzer in editor (minimize re-renders)
- [ ] Index `mood_checks` by `(user_id, created_at DESC)` for fast pattern queries
- [ ] Batch fetch only last 7 days for weekly patterns (avoid full scan)

**Timezone Handling:**
- [ ] Consider storing user timezone or computing pattern bins client-side
- [ ] Ensure "Tuesday evening" insights match user's local time, not UTC

---

## References

1. **EMA in Mental Health:** [PMC8428969](https://pmc.ncbi.nlm.nih.gov/articles/PMC8428969/)
2. **Affect Labeling:** [PubMed 17576282](https://pubmed.ncbi.nlm.nih.gov/17576282/)
3. **RNT as Transdiagnostic Factor:** [PMC6370308](https://pmc.ncbi.nlm.nih.gov/articles/PMC6370308/)
4. **Self-Distancing:** [PubMed 24467424](https://pubmed.ncbi.nlm.nih.gov/24467424/)
5. **Attention Training (ATT):** [PMC6246690](https://pmc.ncbi.nlm.nih.gov/articles/PMC6246690/)

---

**Document Version:** 1.1 (Updated with GPT-5 feedback)
**Last Updated:** October 2025
**Next Review:** After Phase 1 completion
