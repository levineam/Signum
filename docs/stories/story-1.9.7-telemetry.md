# Story 1.9.7: Telemetry for AI Answers Usage and Satisfaction

**Status:** Backlog
**Parent Story:** Story 1.9 - AI-Powered Task Assistance
**GitHub Issue:** [#127](https://github.com/levineam/Signum/issues/127)
**Epic:** Epic 1 - Content Intelligence & Feedback System

## Story

As a product owner,
I want to track usage metrics and user satisfaction for the AI answers feature,
so that I can measure feature adoption, ROI, and identify areas for improvement.

## Acceptance Criteria

1. **Usage Metrics Tracking**
   - [ ] Track number of AI requests per user (daily, weekly, monthly)
   - [ ] Track total AI requests across all users
   - [ ] Track AI request success rate (successful vs. failed requests)
   - [ ] Track OpenAI token usage and estimated costs
   - [ ] Store metrics in database for historical analysis

2. **Satisfaction Indicators**
   - [ ] Track note deletion rate for AI-generated notes (within 24 hours)
   - [ ] Track note edit rate for AI-generated notes
   - [ ] Track "Add to Ontology" toggle usage (how many users include AI notes)
   - [ ] Track time spent viewing AI-generated notes (optional, analytics integration)

3. **Feature Adoption Metrics**
   - [ ] Track % of query-tasks that use "Ask AI" feature
   - [ ] Track % of users who have used "Ask AI" at least once
   - [ ] Track frequency of "Ask AI" usage per user (power users vs. occasional users)

4. **Data Storage**
   - [ ] Create `ai_answer_analytics` table to store events
   - [ ] Schema includes: user_id, event_type, task_id, note_id, metadata (tokens, cost, etc.), timestamp
   - [ ] Events logged: `ai_request_success`, `ai_request_failure`, `note_deleted`, `note_edited`, `added_to_ontology`

5. **Analytics Dashboard or Export**
   - [ ] Create basic analytics query API endpoint `/api/analytics/ai-answers`
   - [ ] Returns aggregated metrics: total requests, success rate, avg tokens per request, top users
   - [ ] Optional: Simple admin dashboard to view metrics (future enhancement)
   - [ ] Metrics can be exported to CSV or JSON for external analysis

6. **Privacy and Compliance**
   - [ ] Telemetry respects user privacy (no content storage, only metadata)
   - [ ] Users can opt out of telemetry (future enhancement)
   - [ ] Data retention policy: analytics data kept for 90 days

## Tasks / Subtasks

- [ ] **Create Analytics Database Schema** (AC: #4)
  - [ ] Create migration: `YYYYMMDDHHMMSS_add_ai_answer_analytics.sql`
  - [ ] Create `ai_answer_analytics` table with columns:
    - `id` (UUID, primary key)
    - `user_id` (UUID, references auth.users)
    - `event_type` (TEXT: ai_request_success, ai_request_failure, note_deleted, note_edited, added_to_ontology)
    - `task_id` (UUID, nullable, references tasks)
    - `note_id` (UUID, nullable, references notes)
    - `metadata` (JSONB, for flexible data like tokens, cost, error codes)
    - `created_at` (TIMESTAMPTZ, default NOW())
  - [ ] Add indexes for performance: `user_id`, `event_type`, `created_at`

- [ ] **Implement Event Logging Utility** (AC: #1, #2, #3)
  - [ ] Create `/src/utils/analytics.ts`
  - [ ] Function: `logAIEvent(event: AIAnalyticsEvent): Promise<void>`
  - [ ] Insert event into `ai_answer_analytics` table
  - [ ] Handle errors gracefully (don't fail main operations if logging fails)

- [ ] **Log AI Request Events** (AC: #1)
  - [ ] Modify `/src/app/api/ai/answer/route.ts`
  - [ ] Log `ai_request_success` event with metadata: tokens, cost, taskId, noteId
  - [ ] Log `ai_request_failure` event with metadata: error code, taskId

- [ ] **Log Note Deletion Events** (AC: #2)
  - [ ] Modify note deletion API/logic
  - [ ] Check if note is AI-generated before deletion
  - [ ] Log `note_deleted` event with metadata: note age (hours since creation)

- [ ] **Log Note Edit Events** (AC: #2)
  - [ ] Modify note edit API/logic
  - [ ] Check if note is AI-generated on first edit
  - [ ] Log `note_edited` event (only log first edit, not subsequent edits)

- [ ] **Log "Add to Ontology" Toggle Events** (AC: #2)
  - [ ] Modify `/src/app/api/notes/[id]/toggle-ontology/route.ts` (Story 1.9.5)
  - [ ] Log `added_to_ontology` event when user includes AI note in ontology

- [ ] **Create Analytics API Endpoint** (AC: #5)
  - [ ] Create `/src/app/api/analytics/ai-answers/route.ts`
  - [ ] Implement GET handler (admin/authenticated only)
  - [ ] Return aggregated metrics:
    - Total AI requests (last 7 days, 30 days, all time)
    - Success rate (successful / total requests)
    - Average tokens per request
    - Top 10 users by request count
    - Note deletion rate (deleted within 24 hours / total notes created)
    - "Add to Ontology" rate (included notes / total AI notes)

- [ ] **Implement Metrics Calculation** (AC: #1, #2, #3)
  - [ ] Create SQL queries for aggregated metrics
  - [ ] Use Supabase `.rpc()` for complex aggregations
  - [ ] Cache results for performance (optional)

- [ ] **Add Cost Tracking** (AC: #1)
  - [ ] Calculate estimated cost from token usage
  - [ ] Use OpenAI pricing: GPT-4o-mini ~$0.15/1M input, ~$0.60/1M output
  - [ ] Store in metadata: `{ tokensUsed: 500, estimatedCost: 0.0003 }`

- [ ] **Test Analytics Pipeline** (AC: #4, #5)
  - [ ] Create test AI requests, verify events logged
  - [ ] Delete AI note, verify deletion event logged
  - [ ] Query analytics endpoint, verify metrics returned

- [ ] **Add Data Retention Policy** (AC: #6)
  - [ ] Create scheduled job or cron to delete analytics older than 90 days
  - [ ] Optional: Use Supabase Edge Functions for cleanup

## Dev Notes

### Technical Summary

Implement a telemetry system to track usage, satisfaction, and adoption of the AI answers feature. Events are logged to a dedicated analytics table, and metrics can be queried via an API endpoint for product insights.

### Implementation Approach

**Analytics Database Schema:**

```sql
-- Migration: YYYYMMDDHHMMSS_add_ai_answer_analytics.sql
CREATE TABLE ai_answer_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'ai_request_success',
    'ai_request_failure',
    'note_deleted',
    'note_edited',
    'added_to_ontology'
  )),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  note_id UUID REFERENCES notes(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_ai_analytics_user_id ON ai_answer_analytics(user_id);
CREATE INDEX idx_ai_analytics_event_type ON ai_answer_analytics(event_type);
CREATE INDEX idx_ai_analytics_created_at ON ai_answer_analytics(created_at);

-- RLS Policy: Only admins can read analytics (or allow users to see their own)
ALTER TABLE ai_answer_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analytics"
  ON ai_answer_analytics FOR SELECT
  USING (auth.uid() = user_id);

-- Optional: Data retention cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS VOID AS $$
BEGIN
  DELETE FROM ai_answer_analytics
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

**Analytics Utility:**

```typescript
// /src/utils/analytics.ts
import { createClient } from '@/utils/supabase/server'

export type AIEventType =
  | 'ai_request_success'
  | 'ai_request_failure'
  | 'note_deleted'
  | 'note_edited'
  | 'added_to_ontology'

interface AIAnalyticsEvent {
  userId: string
  eventType: AIEventType
  taskId?: string
  noteId?: string
  metadata?: Record<string, any>
}

export async function logAIEvent(event: AIAnalyticsEvent): Promise<void> {
  try {
    const supabase = createClient()

    await supabase.from('ai_answer_analytics').insert({
      user_id: event.userId,
      event_type: event.eventType,
      task_id: event.taskId,
      note_id: event.noteId,
      metadata: event.metadata || {},
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    // Don't throw errors - analytics should not break main functionality
    console.error('[Analytics Error]', error)
  }
}
```

**Log AI Request Success:**

```typescript
// /src/app/api/ai/answer/route.ts (modifications)
import { logAIEvent } from '@/utils/analytics'

export async function POST(request: Request) {
  try {
    // ... existing code (generate AI answer, create note) ...

    // Log success event
    await logAIEvent({
      userId: session.user.id,
      eventType: 'ai_request_success',
      taskId,
      noteId: note.id,
      metadata: {
        tokensUsed,
        estimatedCost: calculateCost(tokensUsed),
      },
    })

    return NextResponse.json({...})

  } catch (error) {
    // Log failure event
    await logAIEvent({
      userId: session.user.id,
      eventType: 'ai_request_failure',
      taskId,
      metadata: {
        errorCode: error.code || 'UNKNOWN',
      },
    })

    // ... existing error handling ...
  }
}

function calculateCost(tokensUsed: number): number {
  // GPT-4o-mini pricing (approximate)
  const inputCostPer1M = 0.15
  const outputCostPer1M = 0.60
  const avgCostPer1M = (inputCostPer1M + outputCostPer1M) / 2
  return (tokensUsed / 1_000_000) * avgCostPer1M
}
```

**Analytics API Endpoint:**

```typescript
// /src/app/api/analytics/ai-answers/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    // Auth pattern follows /api/tasks/parse
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        }
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Optional: Restrict to admin users
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Aggregate metrics
    const { data: successCount } = await supabase
      .from('ai_answer_analytics')
      .select('id', { count: 'exact' })
      .eq('event_type', 'ai_request_success')

    const { data: failureCount } = await supabase
      .from('ai_answer_analytics')
      .select('id', { count: 'exact' })
      .eq('event_type', 'ai_request_failure')

    const { data: events } = await supabase
      .from('ai_answer_analytics')
      .select('metadata')
      .eq('event_type', 'ai_request_success')

    const totalTokens = events?.reduce((sum, e) => sum + (e.metadata?.tokensUsed || 0), 0) || 0
    const totalCost = events?.reduce((sum, e) => sum + (e.metadata?.estimatedCost || 0), 0) || 0

    const totalRequests = (successCount?.count || 0) + (failureCount?.count || 0)
    const successRate = totalRequests > 0 ? (successCount?.count || 0) / totalRequests : 0

    return NextResponse.json({
      totalRequests,
      successCount: successCount?.count || 0,
      failureCount: failureCount?.count || 0,
      successRate: (successRate * 100).toFixed(2) + '%',
      totalTokens,
      totalCost: '$' + totalCost.toFixed(4),
      avgTokensPerRequest: totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0,
    })

  } catch (error) {
    console.error('[Analytics API Error]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Files to Modify

**New Files:**
- `/src/utils/analytics.ts` - Analytics utility
- `/src/app/api/analytics/ai-answers/route.ts` - Analytics API endpoint
- `/supabase/migrations/YYYYMMDDHHMMSS_add_ai_answer_analytics.sql` - Schema migration

**Modified Files:**
- `/src/app/api/ai/answer/route.ts` - Log request events
- `/src/app/api/notes/[id]/route.ts` (or deletion logic) - Log deletion events
- `/src/app/api/notes/[id]/toggle-ontology/route.ts` - Log toggle events

### Dependencies

- **Story 1.9.3 (AI Answer API):** Log events from API
- **Story 1.9.4 (AI Note Creation):** Track note creation
- **Story 1.9.5 (Ontology Isolation):** Track toggle usage

### Metrics to Track

| Metric | Calculation | Purpose |
|--------|-------------|---------|
| Total AI Requests | Count of all `ai_request_success` + `ai_request_failure` events | Measure feature usage |
| Success Rate | `ai_request_success / total requests` | Measure API reliability |
| Avg Tokens per Request | `SUM(tokensUsed) / total requests` | Estimate costs |
| Total Cost | `SUM(estimatedCost)` | Budget tracking |
| Note Deletion Rate | `note_deleted (age < 24h) / total AI notes` | Satisfaction proxy |
| "Add to Ontology" Rate | `added_to_ontology / total AI notes` | Perceived value |
| % of Query Tasks Using AI | `ai_request_success / total query tasks` | Feature adoption |

### Privacy Considerations

- **No Content Logging:** Analytics do not store note content or task text
- **Metadata Only:** Only technical metadata (tokens, costs, timestamps)
- **User Consent:** Consider adding opt-out in future (GDPR compliance)
- **Data Retention:** Auto-delete analytics after 90 days

### Future Enhancements

- **Real-time Dashboard:** Build admin UI to visualize metrics
- **User-specific Analytics:** Show users their own AI usage stats
- **A/B Testing:** Track experiments (e.g., prompt variations)
- **Sentiment Analysis:** Analyze user feedback on AI quality

### Time Estimate

**1-2 days**
- Day 1: Database schema, analytics utility, event logging
- Day 2: Analytics API endpoint, testing, documentation

**Story Points:** 2 points

### References

- **Supabase Analytics:** https://supabase.com/docs/guides/database/postgres
- **Postgres JSONB:** https://www.postgresql.org/docs/current/datatype-json.html
- **OpenAI Pricing:** https://openai.com/pricing

---

## Dev Agent Record

### Context Reference

<!-- Will be populated during dev-story execution -->

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes List

<!-- Will be populated during dev-story execution -->

### File List

<!-- Will be populated during dev-story execution -->

### Test Results

<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->
