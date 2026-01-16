# Story 2.5.1: Bulk Import Ontology Analysis

**Status:** 🎯 IN PROGRESS
**Created:** 2025-11-03
**Epic:** 2 (Intelligent Note Linking & Knowledge Graph)
**Priority:** High
**Estimate:** 3-4 days

**Prerequisites:**
- Story 2.4.4 (Incremental AI Ontology Analysis) ✅ Complete
- Story 2.5.0 (Obsidian Vault Import) ✅ Complete

---

## User Story

As a Signum user importing a large Obsidian vault,
I want my ontology to be analyzed efficiently on the bulk of imported notes,
so that I can immediately see my values/beliefs/aims extracted from my existing knowledge base without hitting rate limits or waiting hours.

---

## Problem Statement

**Current State:**
- Story 2.4.4 incremental analysis has a **20-note limit per API call** (arbitrary cost control)
- When user imports 500 notes, all have `updated_at > lastAnalyzedAt` (all are "new")
- Manual "Analyze My Notes" would require:
  - **25+ separate runs** (500 notes ÷ 20 per run)
  - **4+ hours** with 6-runs/hour rate limit
  - **Terrible UX** - user has to manually click repeatedly

**User Impact:**
- Frustrating onboarding for Obsidian imports
- Users see empty ontology cards despite importing rich journal content
- Delayed time-to-value for AI features
- May abandon import process entirely

---

## Solution: Tiered Bulk Analysis

Implement intelligent tiered analysis based on import size:

### Tier 1: Small Imports (1-200 notes)
- **Analyze all notes immediately** in 1-2 API calls
- **Cost**: $0.10-0.20
- **Time**: ~10-15 seconds
- **User sees**: Immediate ontology results

### Tier 2: Medium Imports (201-500 notes)
- **Analyze 200-note sample immediately** (1-2 API calls, ~10 seconds)
- **Queue remaining notes** for background processing (20-note batches every 2 minutes)
- **User sees**: Initial ontology from sample, then gradual enrichment

### Tier 3: Large Imports (500+ notes)
- **Analyze 400-note sample immediately** (2 API calls, ~15-20 seconds)
- **Queue remaining notes** for background processing
- **User sees**: Representative ontology upfront, background completion notification

---

## Technical Design

### 1. Increase Analysis Batch Size

**Current Code** (`/src/app/api/extract-ontology/route.ts:69-70`):
```typescript
// 3. Limit to 20 notes for cost control
const notesToAnalyze = notes.slice(0, 20)
```

**New Approach**:
```typescript
// Dynamic batch sizing based on context
const getBatchSize = (context: 'incremental' | 'bulk-import', totalNotes: number) => {
  if (context === 'incremental') return 20 // Keep conservative for daily runs

  if (totalNotes <= 200) return totalNotes // Analyze all
  if (totalNotes <= 500) return 200        // Large sample
  return 400                               // Very large sample
}
```

**Why This Works:**
- GPT-5-mini has **272,000 token input limit**
- Average note: ~500 tokens
- 200 notes: ~100,000 tokens (37% capacity) ✅
- 400 notes: ~200,000 tokens (73% capacity) ✅
- 500+ notes: Exceeds safe threshold, use 400-note max

### 2. Background Queue for Remaining Notes

**CRITICAL DESIGN DECISIONS** (Codex Findings #1 and #2):

1. **lastAnalyzedAt Cursor Management**:
   - Initial sample analysis **DOES NOT** update `lastAnalyzedAt`
   - Queue job tracks `import_snapshot_timestamp` (max `updated_at` from import batch)
   - Only when queue completes do we advance `lastAnalyzedAt` to `import_snapshot_timestamp`
   - This prevents race condition where sample run marks all notes as "analyzed"

2. **Note Scope Tracking**:
   - Queue table stores explicit list of remaining note IDs
   - Workers fetch notes by ID (not by `updated_at` cursor)
   - Prevents double-processing and handles overlapping imports
   - Each import gets unique queue job with isolated note set

**Database Schema**:

```sql
-- Main queue table
CREATE TABLE ontology_analysis_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  import_id UUID NOT NULL,  -- Links to import session for tracking
  import_snapshot_timestamp TIMESTAMP NOT NULL,  -- Max updated_at from import batch
  total_notes INT NOT NULL,
  processed_notes INT DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Join table for pending notes (Codex Finding #2)
CREATE TABLE ontology_analysis_queue_notes (
  queue_id UUID REFERENCES ontology_analysis_queue(id) ON DELETE CASCADE,
  note_id UUID REFERENCES notes(id) ON DELETE CASCADE,
  processed BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (queue_id, note_id)
);

CREATE INDEX idx_queue_user_status ON ontology_analysis_queue(user_id, status);
CREATE INDEX idx_queue_notes_pending ON ontology_analysis_queue_notes(queue_id, processed) WHERE NOT processed;
```

**Supabase Cron Job** (runs every 2 minutes):

**RATE LIMIT RECONCILIATION** (Codex Finding #3):
- Cron fires every 2 minutes (30 calls/hour globally)
- Each call processes one batch for ONE user
- 6-runs/hour limit applies to **manual** "Analyze My Notes" button
- Background queue is **system-triggered**, exempt from manual limit
- Workers use service role auth, not user session (different quota)

```sql
-- In Supabase Dashboard > Database > Cron Jobs
SELECT cron.schedule(
  'process-ontology-queue',
  '*/2 * * * *', -- Every 2 minutes, processes next pending job
  $$
  SELECT net.http_post(
    url := 'https://ontology-mu.vercel.app/api/ontology/process-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
  $$
);
```

**API Endpoint** (`/api/ontology/process-queue`):
- Authenticates via service role token (bypasses user rate limits)
- Fetches next pending queue job via `SELECT ... WHERE status='pending' ORDER BY created_at LIMIT 1 FOR UPDATE`
- Fetches 20 unprocessed note IDs from `ontology_analysis_queue_notes` where `processed=false`
- Processes batch using `runIncrementalExtraction()` (WITHOUT updating `lastAnalyzedAt`)
- Marks notes as `processed=true` in join table
- If all notes processed: updates queue status to `completed`, advances user's `lastAnalyzedAt` to `import_snapshot_timestamp`
- Idempotent: if worker crashes, next cron picks up where it left off

### 3. Import Hook Integration

**Update** `/src/lib/import/batch-importer.ts`:

```typescript
import { queueBulkOntologyAnalysis } from '@/lib/ontology/queue'

export class BatchImporter {
  async importNotes(...) {
    // ... existing import logic ...

    const result = await super.importNotes(...)

    // After successful import, trigger ontology analysis
    if (result.success && result.noteIds.length > 0) {
      await this.handlePostImportAnalysis(options.userId, result.noteIds)
    }

    return result
  }

  private async handlePostImportAnalysis(userId: string, noteIds: string[], importId: string) {
    const noteCount = noteIds.length

    // Fetch actual notes to get their updated_at timestamps
    const notes = await this.supabase
      .from('notes')
      .select('id, updated_at')
      .in('id', noteIds)

    const importSnapshotTimestamp = notes.data
      ? new Date(Math.max(...notes.data.map(n => new Date(n.updated_at).getTime())))
      : new Date()

    if (noteCount <= 200) {
      // Tier 1: Analyze all immediately AND update lastAnalyzedAt
      await fetch('/api/ontology/incremental-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          triggeredBy: 'bulk-import',
          maxNotes: noteCount,
          noteIds: noteIds,  // Explicit list, not cursor-based
          updateCursor: true  // Safe to advance lastAnalyzedAt (no queue)
        })
      })
    } else {
      // Tier 2/3: Sample + queue
      const sampleSize = noteCount <= 500 ? 200 : 400
      const sampleNoteIds = noteIds.slice(0, sampleSize)
      const queuedNoteIds = noteIds.slice(sampleSize)

      // Immediate sample analysis WITHOUT updating lastAnalyzedAt (Codex Finding #1)
      await fetch('/api/ontology/incremental-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          triggeredBy: 'bulk-import-sample',
          maxNotes: sampleSize,
          noteIds: sampleNoteIds,  // Explicit list
          updateCursor: false  // DO NOT advance lastAnalyzedAt yet!
        })
      })

      // Queue remaining notes with explicit note IDs (Codex Finding #2)
      await queueBulkOntologyAnalysis(userId, queuedNoteIds, importId, importSnapshotTimestamp)
    }
  }
}
```

### 4. Update Incremental Analysis Endpoint

**Modify** `/src/app/api/ontology/incremental-analysis/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { triggeredBy, maxNotes, noteIds, updateCursor = true } = body

  // ... existing auth logic ...

  let notesToAnalyze: Note[]

  if (noteIds && noteIds.length > 0) {
    // Explicit note list (bulk import path)
    notesToAnalyze = await supabaseAdmin
      .from('notes')
      .select('*')
      .in('id', noteIds)
      .then(({ data }) => data || [])
  } else {
    // Cursor-based incremental (standard daily cron path)
    notesToAnalyze = await getNotesForIncrementalAnalysis(userId, lastAnalyzed)
  }

  // Apply dynamic batch sizing
  const batchSize = maxNotes || (triggeredBy === 'bulk-import' ? 200 : 20)
  const batch = notesToAnalyze.slice(0, batchSize)

  // ... existing extraction logic ...

  // CRITICAL: Only update lastAnalyzedAt if updateCursor=true (Codex Finding #1)
  if (updateCursor) {
    const maxNoteTimestamp = notesToAnalyze.reduce(
      (max, note) => {
        const noteTime = new Date(note.updatedAt)
        return noteTime > max ? noteTime : max
      },
      new Date(0)
    )
    await updateAnalysisState(userId, maxNoteTimestamp, runSummary)
  } else {
    // Sample run: update summary but NOT lastAnalyzedAt
    await releaseLock(userId, runSummary)
  }
}
```

### 5. Instrumentation & Telemetry (Codex Finding #4)

**CRITICAL**: Add explicit tracking to measure success metrics.

**Telemetry Schema** (`ontology_analysis_telemetry` table):
```sql
CREATE TABLE ontology_analysis_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT CHECK (event_type IN (
    'import_sample_start',
    'import_sample_complete',
    'queue_created',
    'queue_batch_complete',
    'queue_complete',
    'manual_trigger'
  )),
  import_id UUID,  -- Links related events
  queue_id UUID REFERENCES ontology_analysis_queue(id),

  -- Performance metrics
  note_count INT,
  runtime_ms INT,
  token_estimate INT,

  -- Success tracking
  extracted_values INT,
  extracted_beliefs INT,
  extracted_aims INT,

  -- Error tracking
  error_message TEXT,

  metadata JSONB,  -- Flexible field for additional context
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_telemetry_user_event ON ontology_analysis_telemetry(user_id, event_type);
CREATE INDEX idx_telemetry_import ON ontology_analysis_telemetry(import_id);
CREATE INDEX idx_telemetry_created ON ontology_analysis_telemetry(created_at);
```

**Event Tracking Points**:

1. **Import Sample Start**:
   ```typescript
   await trackTelemetry({
     event_type: 'import_sample_start',
     user_id: userId,
     import_id: importId,
     note_count: sampleSize,
     metadata: { triggeredBy: 'bulk-import-sample' }
   })
   ```

2. **Import Sample Complete** (measure "<20s to initial ontology"):
   ```typescript
   await trackTelemetry({
     event_type: 'import_sample_complete',
     user_id: userId,
     import_id: importId,
     runtime_ms: Date.now() - startTime,  // KEY METRIC
     note_count: sampleSize,
     extracted_values: extraction.newValues,
     extracted_beliefs: extraction.newBeliefs,
     extracted_aims: extraction.newAims
   })
   ```

3. **Queue Created**:
   ```typescript
   await trackTelemetry({
     event_type: 'queue_created',
     user_id: userId,
     import_id: importId,
     queue_id: queueJob.id,
     note_count: queuedNoteIds.length
   })
   ```

4. **Queue Batch Complete** (measure "20 notes/2min" throughput):
   ```typescript
   await trackTelemetry({
     event_type: 'queue_batch_complete',
     user_id: userId,
     queue_id: queueJob.id,
     runtime_ms: batchRuntime,  // Should be ~5-10 seconds
     note_count: 20,
     metadata: { batch_number: Math.ceil(processedNotes / 20) }
   })
   ```

5. **Queue Complete**:
   ```typescript
   await trackTelemetry({
     event_type: 'queue_complete',
     user_id: userId,
     import_id: importId,
     queue_id: queueJob.id,
     runtime_ms: Date.now() - queueCreatedAt,
     note_count: totalNotesProcessed
   })
   ```

**Analytics Queries** (for measuring success metrics):

```sql
-- Metric: Average time to initial ontology (should be <20s)
SELECT AVG(runtime_ms) / 1000.0 AS avg_seconds
FROM ontology_analysis_telemetry
WHERE event_type = 'import_sample_complete'
  AND created_at > NOW() - INTERVAL '7 days';

-- Metric: Queue processing rate (should be ~20 notes/2min)
SELECT
  AVG(note_count::float / (runtime_ms / 1000.0 / 60.0)) AS notes_per_minute
FROM ontology_analysis_telemetry
WHERE event_type = 'queue_batch_complete'
  AND created_at > NOW() - INTERVAL '7 days';

-- Metric: Import completion rate (should be >95%)
SELECT
  COUNT(CASE WHEN error_message IS NULL THEN 1 END)::float / COUNT(*) * 100 AS success_rate
FROM ontology_analysis_telemetry
WHERE event_type = 'queue_complete'
  AND created_at > NOW() - INTERVAL '7 days';

-- Metric: Cost per 1000 notes
SELECT
  AVG(token_estimate::float / note_count * 1000) AS tokens_per_1000_notes
FROM ontology_analysis_telemetry
WHERE event_type IN ('import_sample_complete', 'queue_batch_complete')
  AND created_at > NOW() - INTERVAL '7 days';
```

**Dashboard Visualization** (future enhancement):
- Real-time queue progress chart
- Average time-to-ontology histogram
- Success rate by import size
- Cost tracking per user/import

---

## User Experience

### Import Flow

1. **User uploads 500-note Obsidian vault**
2. **Import completes**: "✅ Imported 500 notes successfully"
3. **Immediate analysis starts**: Progress indicator appears
4. **15 seconds later**: "🧠 Analyzing your notes... 200/500 analyzed"
5. **Ontology cards populate**: User sees initial values/beliefs/aims
6. **Background continues**: Every 2 minutes, 20 more notes analyzed
7. **25 minutes later**: "✅ Ontology analysis complete! Analyzed 500 notes."

### UI Updates

**During Import** (`/src/components/import/ImportSummary.tsx`):
```tsx
{importResult.noteCount > 200 && (
  <Alert>
    <Brain className="h-4 w-4" />
    <AlertTitle>Ontology Analysis Starting</AlertTitle>
    <AlertDescription>
      Analyzing {Math.min(importResult.noteCount, 400)} notes now.
      {importResult.noteCount > 400 && ` Remaining notes will be processed over the next ${Math.ceil((importResult.noteCount - 400) / 20 * 2)} minutes.`}
    </AlertDescription>
  </Alert>
)}
```

**Progress Indicator** (new component):
```tsx
<Card>
  <CardHeader>
    <CardTitle>Ontology Analysis Progress</CardTitle>
  </CardHeader>
  <CardContent>
    <Progress value={(processedNotes / totalNotes) * 100} />
    <p className="text-sm text-muted-foreground mt-2">
      {processedNotes} / {totalNotes} notes analyzed
    </p>
  </CardContent>
</Card>
```

---

## Acceptance Criteria

### Detection & Routing
1. ✅ System detects bulk import (>20 notes imported at once)
2. ✅ Routes small imports (≤200) to immediate full analysis with `updateCursor=true`
3. ✅ Routes medium imports (201-500) to 200-note sample + queue
4. ✅ Routes large imports (500+) to 400-note sample + queue
5. ✅ Incremental daily runs continue using 20-note batches

### Analysis Execution & Cursor Management (Codex Findings #1 & #2)
1. ✅ Small import (<200 notes): Analyzes all, updates `lastAnalyzedAt` immediately
2. ✅ Large import (>200 notes): Sample analysis does NOT update `lastAnalyzedAt`
3. ✅ Queue job stores explicit list of remaining note IDs in `ontology_analysis_queue_notes` table
4. ✅ Queue workers fetch notes by ID (not by `updated_at > lastAnalyzedAt` cursor)
5. ✅ `lastAnalyzedAt` updates to `import_snapshot_timestamp` ONLY when queue completes
6. ✅ Overlapping imports create separate queue jobs with isolated note sets (no cross-contamination)
7. ✅ Sample analysis completes within 20 seconds (tracked via telemetry)
8. ✅ Background queue processes 20 notes every 2 minutes (measured via `queue_batch_complete` events)
9. ✅ Ontology merging works correctly with large batches (200-400 notes)

### Rate Limiting (Codex Finding #3)
1. ✅ 6-runs/hour limit applies ONLY to manual "Analyze My Notes" button
2. ✅ Background queue uses service role auth, exempt from manual user limits
3. ✅ Cron job fires every 2 minutes (30 global calls/hour), processes ONE pending job per call
4. ✅ Multiple users with pending queues are processed fairly (FIFO by created_at)

### User Feedback
1. ✅ User sees immediate ontology results after sample analysis
2. ✅ Progress indicator shows background processing status (X/Y notes analyzed)
3. ✅ Toast notification when background analysis completes
4. ✅ No manual intervention required for bulk imports
5. ✅ Manual "Analyze My Notes" still works for incremental updates

### Error Handling & Idempotency
1. ✅ Failed sample analysis shows error but allows retry
2. ✅ Failed queue processing is idempotent: crashed workers don't double-process notes
3. ✅ Queue records cleaned up 7 days after completion
4. ✅ Admin can clear stuck jobs via database query or support dashboard

### Instrumentation (Codex Finding #4)
1. ✅ All analysis events tracked in `ontology_analysis_telemetry` table
2. ✅ `import_sample_complete` events measure time-to-initial-ontology (<20s target)
3. ✅ `queue_batch_complete` events measure throughput (20 notes/2min target)
4. ✅ Analytics queries provided for success rate, cost per 1000 notes, avg runtime
5. ✅ Error events include `error_message` field for debugging

---

## Testing Strategy

### Unit Tests
- `getBatchSize()` logic for different import sizes
- Queue creation and progress tracking
- Batch size calculation edge cases

### Integration Tests
- Import 200 notes → verify immediate full analysis
- Import 500 notes → verify sample + queue split
- Queue processing → verify 20-note batches
- Concurrent imports → verify no queue collisions

### E2E Tests (Playwright)
1. **Small Import Test**:
   - Upload 50-note vault
   - Verify ontology appears within 15 seconds
   - Verify all 50 notes analyzed

2. **Large Import Test**:
   - Upload 300-note vault
   - Verify sample analysis completes (~200 notes)
   - Verify queue created for remaining 100
   - Verify background processing updates ontology

3. **Error Recovery Test**:
   - Simulate API failure during sample analysis
   - Verify user can retry
   - Verify queue cleans up properly

---

## Performance Considerations

### Cost Analysis

**Current State** (manual 20-note limit):
- 500 notes: 25 runs × $0.01 = **$0.25**
- User effort: 25 button clicks over 4+ hours ❌

**New State** (tiered approach):
- 500 notes: 2 immediate runs ($0.20) + 15 background runs ($0.15) = **$0.35**
- User effort: Zero, automatic ✅
- **10% cost increase** for dramatically better UX

### Token Usage

| Import Size | Immediate Analysis | Background Analysis | Total Cost | Time to Complete |
|-------------|-------------------|---------------------|------------|------------------|
| 50 notes    | 50 notes          | 0 notes             | $0.05      | ~10 seconds      |
| 200 notes   | 200 notes         | 0 notes             | $0.20      | ~15 seconds      |
| 500 notes   | 200 notes         | 300 notes           | $0.35      | ~30 minutes      |
| 1000 notes  | 400 notes         | 600 notes           | $0.70      | ~60 minutes      |

### Database Impact

- Queue table: ~1KB per job, auto-cleanup after 7 days
- No schema changes to existing `notes` or `ontology_analysis_state` tables
- Cron job: Minimal load, runs every 2 minutes only if queue has pending jobs

---

## Rollout Plan

### Phase 1: Code Implementation (Days 1-2)
- [ ] Create `ontology_analysis_queue` table migration
- [ ] Implement `getBatchSize()` dynamic sizing
- [ ] Update `/api/ontology/incremental-analysis` to accept `maxNotes`
- [ ] Create `/api/ontology/process-queue` endpoint
- [ ] Hook into `batch-importer.ts` post-import

### Phase 2: Queue Infrastructure (Day 3)
- [ ] Set up Supabase Cron job for queue processing
- [ ] Implement queue management functions
- [ ] Add progress tracking UI component
- [ ] Test with sample 300-note import

### Phase 3: Testing & Polish (Day 4)
- [ ] Write unit tests for batch sizing logic
- [ ] E2E test with 500-note Obsidian vault
- [ ] Add error handling and retry logic
- [ ] Update documentation
- [ ] Deploy to dev environment for testing

### Phase 4: Production Rollout
- [ ] Deploy to production with feature flag
- [ ] Monitor first 10 bulk imports
- [ ] Adjust batch sizes based on actual token usage
- [ ] Document learnings and edge cases

---

## Success Metrics

1. **Import Completion Rate**: >95% of bulk imports complete analysis without errors
2. **Time to Initial Ontology**: <20 seconds for 90% of imports
3. **User Satisfaction**: No complaints about "empty ontology after import"
4. **Cost Efficiency**: <$1 per 1000 notes imported
5. **Background Processing**: Queue completes within expected time (20 notes/2min)

---

## Open Questions

1. **What if user imports another vault while queue is processing?**
   - **Decision**: Allow concurrent queues, each tracks its own progress

2. **Should we show which specific notes are being analyzed?**
   - **Decision**: No, just show progress percentage to avoid clutter

3. **What if analysis fails midway through queue?**
   - **Decision**: Mark job as failed, allow manual retry via "Analyze My Notes"

4. **Should we prioritize newer notes or random sample?**
   - **Decision**: Random sample for initial analysis, then chronological for queue

5. **Do we need UI to pause/cancel background processing?**
   - **Decision**: Not for MVP, can add in future if users request it

---

## Related Stories

- Story 2.4.4: Incremental AI Ontology Analysis (foundation)
- Story 2.5.0: Obsidian Vault Import (triggers this workflow)
- Story 2.4.5: Ontology Expandable Rows (displays results)
- Future: Analytics dashboard to show ontology evolution over time

---

## Files to Modify

### New Files
- `/src/lib/ontology/queue.ts` - Queue management functions
- `/src/app/api/ontology/process-queue/route.ts` - Background processing endpoint
- `/src/components/ontology/AnalysisProgressIndicator.tsx` - UI component
- `/supabase/migrations/20251103000000_ontology_analysis_queue.sql` - Queue table

### Modified Files
- `/src/lib/import/batch-importer.ts` - Add post-import analysis hook
- `/src/app/api/ontology/incremental-analysis/route.ts` - Dynamic batch sizing
- `/src/lib/ontology/extractor.ts` - Support larger batches
- `/src/components/import/ImportSummary.tsx` - Show analysis status

---

## Notes

- This story unlocks the full value of bulk imports by making ontology extraction seamless
- The tiered approach balances immediate user feedback with cost efficiency
- Background queue prevents rate limit issues and spreads load over time
- Can extend this pattern to other AI features (entity extraction, sentiment analysis)
- Consider making batch sizes configurable via admin panel in future
