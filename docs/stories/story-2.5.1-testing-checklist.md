# Story 2.5.1: Bulk Import Ontology Analysis - Testing Checklist

**PR**: https://github.com/levineam/Signum/pull/151
**Date**: 2025-11-04

---

## Pre-Implementation Checklist

- [ ] Database migration applied to dev/staging
- [ ] All new tables visible in Supabase dashboard
- [ ] RLS policies correctly configured
- [ ] Feature flags set in `.env.local`

---

## Database Migration Testing

### Schema Verification
- [ ] `ontology_analysis_queue` table exists with 8 columns
  - `id`, `user_id`, `import_id`, `import_snapshot_timestamp`, `total_notes`, `processed_notes`, `status`, `error_message`
- [ ] `ontology_analysis_queue_notes` table exists with 3 columns
  - `queue_id`, `note_id`, `processed`
- [ ] `ontology_analysis_telemetry` table exists with 15+ columns
  - Check all event types: `import_sample_start`, `import_sample_complete`, `queue_created`, `queue_batch_complete`, `queue_complete`, `manual_trigger`

### Index Verification
- [ ] `idx_queue_user_status` on `(user_id, status)`
- [ ] `idx_queue_pending` on `(status)` where `status='pending'`
- [ ] `idx_queue_notes_pending` on `(queue_id, processed)` where `NOT processed`
- [ ] `idx_telemetry_user_event` on `(user_id, event_type)`
- [ ] `idx_telemetry_created` on `(created_at DESC)`

### RLS Policy Verification
- [ ] Users can SELECT own queue records
- [ ] Service role can UPDATE queue records
- [ ] Service role can manage queue notes
- [ ] Telemetry readable by user, insertable by service role

### Helper Function Verification
- [ ] `get_next_queue_job()` returns correct schema
- [ ] `get_unprocessed_notes(queue_id, batch_size)` returns notes as expected
- [ ] `mark_notes_processed(queue_id, note_ids)` updates `processed=true`
- [ ] `update_queue_status()` works correctly
- [ ] `insert_telemetry()` creates event records
- [ ] `cleanup_ontology_queue()` can be called manually

---

## Unit Tests

### `queue.ts` Functions

#### `createQueueJob()`
```typescript
const job = await createQueueJob(
  'test-user-id',
  'test-import-id',
  ['note-1', 'note-2', 'note-3'],
  new Date()
)
```
- [ ] Returns job with `status='pending'`
- [ ] Creates 3 records in `queue_notes` table
- [ ] Inserts `queue_created` telemetry event
- [ ] Handles duplicate calls gracefully

#### `getNextPendingJob()`
- [ ] Returns first pending job by `created_at`
- [ ] Uses atomic lock (FOR UPDATE)
- [ ] Returns null when no pending jobs
- [ ] Returns correct `remainingNotes` count

#### `getUnprocessedNotes()`
- [ ] Fetches max 20 notes from specific queue
- [ ] Only returns notes with `processed=false`
- [ ] Returns Note type with all fields
- [ ] Returns empty array when all processed

#### `markNotesProcessed()`
- [ ] Updates specified notes to `processed=true`
- [ ] Idempotent: can call multiple times safely
- [ ] Returns without error if notes don't exist

#### `insertTelemetry()`
- [ ] Creates record in telemetry table
- [ ] All 6 event types can be inserted
- [ ] Accepts optional fields (runtime_ms, token_estimate, etc.)
- [ ] Returns telemetry ID

### `batch-importer.ts` Tiering

#### Tier 1: Small Import (≤200 notes)
```typescript
await importer.importNotes(
  /* 150 parsed notes */,
  { userId: 'test-user', ... }
)
```
- [ ] Immediate analysis triggered with `updateCursor=true`
- [ ] `noteIds` array passed to incremental-analysis
- [ ] No queue job created
- [ ] `lastAnalyzedAt` updated immediately

#### Tier 2: Medium Import (201-500 notes)
```typescript
await importer.importNotes(
  /* 350 parsed notes */,
  { userId: 'test-user', ... }
)
```
- [ ] Sample (200 notes) analyzed with `updateCursor=false`
- [ ] Queue job created for 150 remaining notes
- [ ] `lastAnalyzedAt` NOT updated immediately
- [ ] Telemetry: `queue_created` event logged

#### Tier 3: Large Import (500+ notes)
```typescript
await importer.importNotes(
  /* 750 parsed notes */,
  { userId: 'test-user', ... }
)
```
- [ ] Sample (400 notes) analyzed with `updateCursor=false`
- [ ] Queue job created for 350 remaining notes
- [ ] `lastAnalyzedAt` NOT updated immediately

### `incremental-analysis/route.ts` Cursor Management

#### With `noteIds` and `updateCursor=true`
- [ ] Fetches notes by explicit ID list
- [ ] Updates `lastAnalyzedAt` after analysis
- [ ] Releases lock properly
- [ ] Returns success response

#### With `noteIds` and `updateCursor=false`
- [ ] Fetches notes by explicit ID list
- [ ] Does NOT update `lastAnalyzedAt`
- [ ] Releases lock without state update
- [ ] Returns success response

#### Without `noteIds` (backward compatible)
- [ ] Uses cursor-based incremental query
- [ ] Updates `lastAnalyzedAt` as before
- [ ] Maintains backward compatibility

---

## Integration Tests

### Test Scenario 1: Small Import
1. **Setup**: Create 150 test notes in Obsidian format
2. **Import**: Upload vault (import should succeed)
3. **Verify Immediate Analysis**:
   - [ ] Ontology cards populated within 15 seconds
   - [ ] All 150 notes analyzed (check metadata)
   - [ ] `lastAnalyzedAt` advanced to import timestamp
   - [ ] No queue job created
4. **Verify Telemetry**:
   - [ ] `import_sample_complete` event exists
   - [ ] `runtime_ms` < 20000 (20 seconds)
   - [ ] `note_count` = 150
   - [ ] `extracted_values`, `extracted_beliefs`, `extracted_aims` > 0

### Test Scenario 2: Medium Import
1. **Setup**: Create 350 test notes
2. **Import**: Upload vault
3. **Verify Sample Analysis**:
   - [ ] Ontology cards populated within 15 seconds (200-note sample)
   - [ ] Sample notes extracted correctly
   - [ ] `lastAnalyzedAt` NOT advanced (still null or older)
4. **Verify Queue Creation**:
   - [ ] Queue job exists in `ontology_analysis_queue`
   - [ ] 150 notes in `queue_notes` with `processed=false`
   - [ ] `import_snapshot_timestamp` set correctly
5. **Wait for Background Processing**:
   - [ ] Queue processes 20 notes every ~2 minutes
   - [ ] `queue_batch_complete` events appear in telemetry
   - [ ] After ~15 minutes, queue status = `completed`
6. **Verify Final State**:
   - [ ] All 350 notes analyzed (merged)
   - [ ] `lastAnalyzedAt` advanced to snapshot timestamp
   - [ ] `queue_complete` telemetry event logged

### Test Scenario 3: Large Import with Overlapping Import
1. **Setup**: Create 600 notes (import A) and 300 notes (import B)
2. **Start Import A**: Upload vault, sample analysis begins
3. **Start Import B** (while A is processing queue): Upload second vault
4. **Verify Isolation**:
   - [ ] Two separate queue jobs created (different IDs)
   - [ ] Each queue tracks its own note set
   - [ ] No cross-contamination (notes processed in correct order)
   - [ ] Both complete successfully

### Test Scenario 4: Queue Processing Idempotency
1. **Setup**: Queue job with 40 unprocessed notes
2. **Simulate Worker Crash**:
   - [ ] Start processing batch (20 notes)
   - [ ] Kill worker mid-processing
   - [ ] Some notes marked processed, some not
3. **Restart Worker**:
   - [ ] Worker picks up job again (atomic lock)
   - [ ] Only fetches remaining unprocessed notes
   - [ ] Doesn't double-analyze already-processed notes
   - [ ] Job completes successfully

---

## E2E Tests (Playwright)

### Test 1: Import 300-Note Vault
```gherkin
Given a test Obsidian vault with 300 notes
When the user uploads the vault via import interface
Then the import completes successfully
And a progress indicator shows "Analyzing 300 notes..."
And within 20 seconds, ontology cards show extracted values/beliefs/aims
And the user sees "Background analysis in progress: 150 notes remaining"
```

**Assertions:**
- [ ] Import summary shows "✅ 300 notes imported"
- [ ] Ontology cards show at least 2-3 values/beliefs/aims
- [ ] Progress indicator updates every 2 minutes
- [ ] After ~15 minutes, shows "✅ Analysis complete! Analyzed 300 notes."

### Test 2: Verify Ontology Merging
```gherkin
Given import 1 extracts: "Compassion", "Growth", "Authenticity"
And import 2 adds notes supporting "Compassion" and adds "Courage"
When both imports complete
Then ontology shows all 4 items with merged excerpts
And "Compassion" has excerpts from both imports
```

**Assertions:**
- [ ] Ontology cards show deduplicated items
- [ ] Excerpt count increases when same value appears in multiple notes
- [ ] No duplicates in final ontology

### Test 3: Manual Analysis Still Works
```gherkin
Given ontology already extracted from 300 notes
When user clicks "Analyze My Notes" button
Then system processes all new/updated notes
And respects 6-runs/hour rate limit
And merges results with existing ontology
```

**Assertions:**
- [ ] Button works after import
- [ ] Rate limiting prevents abuse
- [ ] Results merge correctly

---

## Analytics Verification

### Query Telemetry Data
```sql
-- Should return ~2 rows (sample_complete, queue_complete)
SELECT event_type, COUNT(*) FROM ontology_analysis_telemetry
WHERE import_id = 'test-import-id'
GROUP BY event_type;
```

- [ ] Results include both `import_sample_complete` and `queue_complete`

### Check Success Metrics
```bash
curl http://localhost:3000/api/ontology/metrics?days=1
```

**Response should include:**
```json
{
  "metrics": {
    "avgTimeToOntologySeconds": 15.5,     // Should be <20
    "avgNotesPerMinute": 22.3,            // Should be >20
    "successRatePercent": 100,            // Should be >95
    "tokensPerThousandNotes": 4800        // Should be <5000
  }
}
```

### Analytics Queries in Supabase
- [ ] "Average time to initial ontology" query returns <20 seconds
- [ ] "Queue processing rate" query returns >20 notes/minute
- [ ] "Success rate" query returns >95%
- [ ] "Cost per 1000 notes" query returns reasonable estimate

---

## Performance & Load Testing

### Single Import Performance
- [ ] 300-note import: initial analysis <20 seconds
- [ ] Queue processing: 20 notes per 2 minutes (observed)
- [ ] Memory usage: <100MB during import
- [ ] Database connections: <5 concurrent

### Multiple Concurrent Imports
- [ ] Import 3 different vaults simultaneously
- [ ] Each processes independently
- [ ] Queue job processing fair (FIFO by created_at)
- [ ] No deadlocks or contention issues

### Load: Many Pending Queue Jobs
- [ ] Create 10 pending queue jobs
- [ ] Process them over time
- [ ] Each completes successfully
- [ ] Total time: ~50 minutes (10 jobs × 5 min per job)

---

## Error Handling

### Error Scenario 1: Import Fails Partway
- [ ] 150 notes imported, then error occurs
- [ ] Rollback doesn't undo successful imports
- [ ] User can retry import
- [ ] No duplicate notes created

### Error Scenario 2: Sample Analysis Fails
- [ ] Show error to user
- [ ] Allow retry without re-importing
- [ ] Queue still created for remaining notes
- [ ] System recovers gracefully

### Error Scenario 3: Queue Processing Fails
- [ ] Mark job as `failed` with error message
- [ ] Allow manual retry via admin endpoint
- [ ] No data loss or corruption

### Error Scenario 4: Database Connection Lost
- [ ] Worker handles connection error gracefully
- [ ] Job remains pending
- [ ] Next cron cycle retries
- [ ] No double-processing due to idempotency

---

## Cleanup & Data Integrity

### Queue Cleanup
- [ ] Old completed queue jobs deleted after 7 days
- [ ] Old telemetry events deleted after 30 days
- [ ] Cleanup task runs without errors
- [ ] No orphaned records remain

### Data Integrity Checks
- [ ] No notes appear in multiple analyses
- [ ] No "ghost" queue_notes records
- [ ] All telemetry events have valid user_id or are null
- [ ] Timestamps are monotonic

---

## Deployment Testing

### Feature Flag Testing
- [ ] With `ONTOLOGY_QUEUE_PROCESSING_ENABLED=false`: queue endpoint returns 503
- [ ] With `ONTOLOGY_QUEUE_PROCESSING_ENABLED=true`: queue endpoint processes jobs
- [ ] Feature flag toggle doesn't require restart

### Environment Parity
- [ ] Test in dev environment
- [ ] Test in staging environment
- [ ] Test in production environment (limited test account)
- [ ] Verify behavior consistent across environments

### Rollback Plan
- [ ] Can disable `ONTOLOGY_QUEUE_PROCESSING_ENABLED` to pause background processing
- [ ] Can delete migration to rollback (after 7 days when no queue jobs pending)
- [ ] No data loss or corruption on rollback

---

## Sign-Off

- [ ] All database tests pass
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Analytics metrics within targets
- [ ] Error handling verified
- [ ] Performance acceptable
- [ ] Ready for production deployment
- [ ] Documentation updated
- [ ] Team briefed on new feature

**Tested by**: _____________________
**Date**: _____________________
**Notes**: _____________________
