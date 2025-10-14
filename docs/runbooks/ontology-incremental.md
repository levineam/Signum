# Incremental Ontology Analysis Runbook

**Story:** 2.4.4 - Incremental AI Ontology Analysis
**Last Updated:** 2025-10-12
**Owner:** Engineering

## Overview

The incremental ontology analysis system automatically extracts values, beliefs, and aims from users' new journal entries on a daily schedule. It uses the same pipeline as the manual "Analyze My Notes" button, ensuring parity between automatic and manual runs.

## Architecture

### Components

1. **State Tracking** (`ontology_analysis_state` table)
   - Stores `lastAnalyzedAt` timestamp per user
   - Tracks `lastRunSummary` with metrics (noteCount, runtime, status)
   - Enables incremental queries: `WHERE updated_at > lastAnalyzedAt`

2. **API Endpoint** (`/api/ontology/incremental-analysis`)
   - Handles both manual and scheduled triggers
   - Implements concurrency control (one run per user at a time)
   - Rate limiting: 6 runs per hour per user

3. **Extraction Service** (`src/lib/ontology/extractor.ts`)
   - Fetches new notes since last analysis
   - Calls OpenAI GPT-5-mini with incremental prompt
   - Includes existing ontology summary to avoid duplicates

4. **Merge Logic** (`src/lib/ontology/merge.ts`)
   - Deduplicates by normalized title
   - Reconciles confidence levels (keeps highest)
   - Aggregates source excerpts from multiple notes

5. **UI** (`OntologyAnalysisButton.tsx`)
   - Shows "Last updated X time ago"
   - Calls same incremental pipeline as scheduled runs
   - Tagged with `triggeredBy: 'manual'` for observability

### Data Flow

```
New Note Created
  ↓
notes.updated_at auto-updated (trigger)
  ↓
Daily Scheduled Job (or Manual Button)
  ↓
/api/ontology/incremental-analysis
  ↓
Get notes WHERE updated_at > lastAnalyzedAt
  ↓
GPT-5-mini Extraction (with existing ontology context)
  ↓
Merge with existing ontology (dedupe, reconcile confidence)
  ↓
Update lastAnalyzedAt on success
  ↓
UI refreshes with new insights
```

## Feature Flag

### Server-Side Control

**Environment Variable:** `ONTOLOGY_INCREMENTAL_ENABLED`

- **Default:** `true` (enabled)
- **To disable:** Set to `"false"` in environment variables
- **Scope:** Server-side only (API route checks flag)

**Check status:**
```bash
curl https://ontology-mu.vercel.app/api/ontology/incremental-analysis
# Returns: { "enabled": true, "rateLimitMax": 6, "rateLimitWindow": 3600000 }
```

### Client-Side Indicator

The manual button always works regardless of flag status. The flag only controls scheduled/automatic runs.

## Configuration

### Rate Limiting

```typescript
// src/app/api/ontology/incremental-analysis/route.ts
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 6 // max runs per window
```

### Analysis Model

```typescript
// src/lib/ontology/extractor.ts
model: 'gpt-5-mini'
reasoning: { effort: 'medium' }
```

### Concurrency Control

Lock mechanism prevents overlapping runs:
- Locks expire after 10 minutes (guards against stuck processes)
- Status tracked in `lastRunSummary.status`

## Operations

### Manual Analysis (Testing)

Trigger analysis via manual button:

1. Navigate to Notes page
2. Click "Analyze My Notes" button
3. Check logs for `triggeredBy: 'manual'` tag

API call:
```bash
curl -X POST https://ontology-mu.vercel.app/api/ontology/incremental-analysis \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "triggeredBy": "manual"}'
```

### View Analysis State

Query Supabase:
```sql
SELECT
  user_id,
  last_analyzed_at,
  last_run_summary
FROM ontology_analysis_state
WHERE user_id = 'USER_ID';
```

### Reset Analysis State

Force re-analysis of all notes for a user:

```typescript
import { resetAnalysisState } from '@/lib/ontology/state'
await resetAnalysisState(userId)
```

Or via SQL:
```sql
UPDATE ontology_analysis_state
SET
  last_analyzed_at = NULL,
  last_run_summary = '{}'::jsonb
WHERE user_id = 'USER_ID';
```

### Disable Feature

Set environment variable:
```bash
# Vercel Dashboard → Settings → Environment Variables
ONTOLOGY_INCREMENTAL_ENABLED=false
```

Redeploy or restart to apply.

### Re-enable Feature

```bash
# Remove variable or set to true
ONTOLOGY_INCREMENTAL_ENABLED=true
```

## Monitoring

### Key Metrics

Log structured data for each run:

```json
{
  "userId": "uuid",
  "triggeredBy": "manual" | "scheduled",
  "noteCount": 5,
  "runtime": 3456,
  "tokenEstimate": 2500,
  "status": "success" | "failure" | "skipped",
  "extractedCounts": {
    "values": 2,
    "beliefs": 3,
    "aims": 1
  },
  "timestamp": "2025-10-12T10:30:00Z"
}
```

### Health Checks

**Success rate:**
```sql
SELECT
  COUNT(*) FILTER (WHERE last_run_summary->>'status' = 'success') as success_count,
  COUNT(*) FILTER (WHERE last_run_summary->>'status' = 'failure') as failure_count,
  COUNT(*) as total
FROM ontology_analysis_state
WHERE last_run_summary->>'timestamp' > (NOW() - INTERVAL '24 hours');
```

**Average runtime:**
```sql
SELECT
  AVG((last_run_summary->>'runtime')::int) as avg_runtime_ms
FROM ontology_analysis_state
WHERE last_run_summary->>'status' = 'success'
  AND last_run_summary->>'timestamp' > (NOW() - INTERVAL '24 hours');
```

### Alerting

**High failure rate (>10%):**
- Check OpenAI API status
- Verify API key is valid
- Check Supabase connectivity

**Long runtimes (>10s):**
- Review note volume per user
- Check OpenAI API latency
- Consider batch size limits

**Stuck locks (>10 min):**
- Query for in-progress runs older than 10 min
- Investigate hung processes
- Release locks manually if needed

## Troubleshooting

### Analysis Not Running

**Symptom:** No updates to `lastAnalyzedAt`

**Check:**
1. Feature flag enabled? `GET /api/ontology/incremental-analysis`
2. User has new notes? Query `notes WHERE updated_at > lastAnalyzedAt`
3. Scheduled job running? (Check Supabase Cron or Vercel Cron logs)
4. Lock acquired? Query `ontology_analysis_state.last_run_summary`

**Fix:**
- Enable feature flag
- Create test note to trigger analysis
- Check cron job configuration
- Release stuck locks

### Duplicate Ontology Items

**Symptom:** Same value appears multiple times with slight variations

**Check:**
1. Merge logic normalizing titles correctly?
2. Deduplication function working?

**Fix:**
```sql
-- Find duplicates
SELECT
  note_type,
  jsonb_array_elements(metadata->'items')->>'name' as item_name,
  COUNT(*)
FROM notes
WHERE note_type LIKE 'ontology-%'
GROUP BY note_type, item_name
HAVING COUNT(*) > 1;
```

Run deduplication script (admin function).

### Missing Excerpts

**Symptom:** Ontology items have no source excerpts

**Check:**
1. GPT response includes excerpts?
2. Merge logic preserving excerpts?

**Fix:** Re-run analysis with `resetAnalysisState()`.

### Rate Limit Exceeded

**Symptom:** `429 Too Many Requests`

**Check:** Query last 6 runs in past hour:
```sql
SELECT
  last_run_summary->>'timestamp',
  last_run_summary->>'triggeredBy'
FROM ontology_analysis_state
WHERE user_id = 'USER_ID'
ORDER BY (last_run_summary->>'timestamp')::timestamp DESC
LIMIT 10;
```

**Fix:** Wait 1 hour or temporarily increase `RATE_LIMIT_MAX`.

## Cost Tracking

### Token Usage

Estimate: ~500 tokens per note analyzed

**Daily cost per user:**
- 1 journal entry/day = 500 tokens = $0.001
- 5 notes/day = 2,500 tokens = $0.005

**Monthly projection:**
- 100 active users × 30 days × $0.005 = $15/month

### Optimization

- Incremental analysis reduces token usage by ~80% vs full re-analysis
- Existing ontology summary included in prompt to avoid duplicates
- Minimum 5 notes required for meaningful extraction

## Recovery Procedures

### Replay Missed Notes

If analysis failed or was skipped:

1. Reset state: `UPDATE ontology_analysis_state SET last_analyzed_at = NULL`
2. Trigger manual analysis
3. Verify results

### Rollback Feature

If issues detected:

1. Disable feature: `ONTOLOGY_INCREMENTAL_ENABLED=false`
2. Investigate logs
3. Fix and redeploy
4. Re-enable: `ONTOLOGY_INCREMENTAL_ENABLED=true`

### Data Corruption

If ontology data is corrupted:

1. Backup current state
2. Reset analysis state
3. Re-run full analysis
4. Verify results
5. Restore if needed

## Future Enhancements

- **Scheduled Cron:** Implement Supabase Cron or Vercel Cron for daily runs
- **Analytics Dashboard:** Track extraction metrics over time
- **Suggestion Review:** Allow users to approve/reject AI suggestions
- **Confidence Thresholds:** Make medium-confidence items reviewable
- **Batch Processing:** Process multiple users in single cron run

## References

- Story: `docs/stories/story-2.4.4-incremental-analysis.md`
- API Route: `src/app/api/ontology/incremental-analysis/route.ts`
- State Management: `src/lib/ontology/state.ts`
- Extractor: `src/lib/ontology/extractor.ts`
- Merge Logic: `src/lib/ontology/merge.ts`
- Migration: `supabase/migrations/20251012000000_ontology_analysis_state.sql`
