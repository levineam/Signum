# Story 1.9.1: Query Detection (Rules) for Query-Based Tasks

**Status:** Backlog
**Parent Story:** Story 1.9 - AI-Powered Task Assistance
**GitHub Issue:** [#121](https://github.com/levineam/Signum/issues/121)
**Epic:** Epic 1 - Content Intelligence & Feedback System

## Story

As a system,
I want to automatically detect when a task is a research query versus an actionable item,
so that the "Ask AI" button appears only on tasks that can be answered by AI.

## Acceptance Criteria

1. **Rule-Based Detection Implemented**
   - [ ] Query detection logic in `/src/utils/nlp/queryDetection.ts`
   - [ ] Detects interrogative patterns (who, what, when, where, why, how)
   - [ ] Detects research keywords ("research", "find out", "look up", "learn about")
   - [ ] Detects question marks in task text
   - [ ] Returns confidence score (0-1) for query likelihood

2. **Action Task Filtering**
   - [ ] Excludes common action verbs ("call", "email", "buy", "schedule", "remind")
   - [ ] Excludes tasks with specific times/dates as primary focus
   - [ ] Handles edge cases (hybrid tasks default to action if ambiguous)

3. **Performance & Accuracy**
   - [ ] Query detection runs in <50ms per task
   - [ ] False positive rate <10% (measured against test dataset)
   - [ ] False negative rate <15% (acceptable to miss some queries initially)

4. **Integration with Task System**
   - [ ] Detection runs automatically when task is created (Story 1.2 integration)
   - [ ] Detection result stored in task metadata or separate field
   - [ ] Can be re-run on existing tasks (batch processing support)

5. **Testing**
   - [ ] Unit tests with 30+ test cases covering:
     - Clear queries ("What is quantum physics?")
     - Clear actions ("Call mom tomorrow")
     - Hybrid tasks ("Research dentists and schedule appointment")
     - Edge cases ("Find my keys" vs "Find information about X")
   - [ ] Test coverage >90% for `queryDetection.ts`

## Tasks / Subtasks

- [ ] **Create Query Detection Module** (AC: #1)
  - [ ] Create `/src/utils/nlp/queryDetection.ts`
  - [ ] Implement `detectQuery(taskText: string): QueryDetectionResult` function
  - [ ] Return type: `{ isQuery: boolean, confidence: number, reason: string }`

- [ ] **Implement Rule-Based Heuristics** (AC: #1, #2)
  - [ ] Interrogative detection (who, what, when, where, why, how)
  - [ ] Keyword matching ("research", "find", "learn", "discover", "explore")
  - [ ] Question mark detection
  - [ ] Action verb filtering ("call", "email", "buy", "remind", "schedule")
  - [ ] Time/date primary focus detection

- [ ] **Add Confidence Scoring** (AC: #1)
  - [ ] Score 0.9-1.0: Clear query (multiple signals)
  - [ ] Score 0.7-0.89: Likely query (one strong signal)
  - [ ] Score 0.4-0.69: Ambiguous (treat as action)
  - [ ] Score 0-0.39: Clear action

- [ ] **Integrate with Task Creation** (AC: #4)
  - [ ] Hook into task parsing logic (Story 1.2)
  - [ ] Store detection result in task record
  - [ ] Add `is_query` boolean and `query_confidence` float to tasks table

- [ ] **Database Migration** (AC: #4)
  - [ ] Create migration: `YYYYMMDDHHMMSS_add_query_detection_to_tasks.sql`
  - [ ] Add `is_query BOOLEAN DEFAULT FALSE`
  - [ ] Add `query_confidence FLOAT DEFAULT 0.0`
  - [ ] Add index on `is_query` for performance

- [ ] **Create Test Suite** (AC: #5)
  - [ ] Create `/tests/unit/queryDetection.test.ts`
  - [ ] Add 30+ test cases covering edge cases
  - [ ] Achieve >90% code coverage

- [ ] **Batch Processing Script** (AC: #4)
  - [ ] Create `/scripts/detect-query-tasks.ts`
  - [ ] Process all existing tasks
  - [ ] Update `is_query` and `query_confidence` fields

## Dev Notes

### Technical Summary

Implement rule-based query detection using pattern matching and keyword analysis. The system will analyze task text and return a confidence score indicating whether the task is a research query (can be answered by AI) or an actionable item (requires user action).

### Implementation Approach

**Detection Algorithm:**

```typescript
// Pseudo-code for query detection logic
function detectQuery(taskText: string): QueryDetectionResult {
  let score = 0.0;
  const reasons: string[] = [];

  // Interrogative patterns (strong signal: +0.4)
  if (/^(who|what|when|where|why|how)\b/i.test(taskText)) {
    score += 0.4;
    reasons.push('Starts with interrogative word');
  }

  // Question mark (medium signal: +0.3)
  if (/\?/.test(taskText)) {
    score += 0.3;
    reasons.push('Contains question mark');
  }

  // Research keywords (medium signal: +0.3)
  const researchKeywords = ['research', 'find out', 'look up', 'learn about', 'understand', 'explore', 'investigate'];
  if (researchKeywords.some(kw => taskText.toLowerCase().includes(kw))) {
    score += 0.3;
    reasons.push('Contains research keywords');
  }

  // Action verb penalty (strong signal: -0.5)
  const actionVerbs = ['call', 'email', 'buy', 'purchase', 'schedule', 'remind', 'set up', 'contact'];
  if (actionVerbs.some(verb => new RegExp(`\\b${verb}\\b`, 'i').test(taskText))) {
    score -= 0.5;
    reasons.push('Contains action verb');
  }

  // Time/date focus penalty (medium signal: -0.3)
  if (/\b(tomorrow|today|next week|at \d+|by \d+)\b/i.test(taskText)) {
    score -= 0.3;
    reasons.push('Contains specific time/date');
  }

  // Normalize score to 0-1
  score = Math.max(0, Math.min(1, score));

  return {
    isQuery: score >= 0.7,
    confidence: score,
    reason: reasons.join('; ')
  };
}
```

### Database Schema Changes

```sql
-- Migration: YYYYMMDDHHMMSS_add_query_detection_to_tasks.sql
ALTER TABLE tasks ADD COLUMN is_query BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN query_confidence FLOAT DEFAULT 0.0;

CREATE INDEX idx_tasks_is_query ON tasks(is_query);
```

### Test Cases Examples

```typescript
// /tests/unit/queryDetection.test.ts
describe('Query Detection', () => {
  describe('Clear Queries', () => {
    it('detects interrogative questions', () => {
      expect(detectQuery('What is quantum physics?').isQuery).toBe(true);
      expect(detectQuery('How does gravity work?').isQuery).toBe(true);
    });

    it('detects research tasks', () => {
      expect(detectQuery('Research Wheeler\'s "It from bit" statement').isQuery).toBe(true);
      expect(detectQuery('Find out what the right basics are to teach kids').isQuery).toBe(true);
    });
  });

  describe('Clear Actions', () => {
    it('detects action tasks', () => {
      expect(detectQuery('Call mom tomorrow').isQuery).toBe(false);
      expect(detectQuery('Buy groceries').isQuery).toBe(false);
      expect(detectQuery('Schedule dentist appointment').isQuery).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('handles hybrid tasks (defaults to action)', () => {
      expect(detectQuery('Research dentists and schedule appointment').isQuery).toBe(false);
    });

    it('distinguishes "find" meanings', () => {
      expect(detectQuery('Find my keys').isQuery).toBe(false); // Action
      expect(detectQuery('Find information about AI ethics').isQuery).toBe(true); // Query
    });
  });
});
```

### Files to Modify

**New Files:**
- `/src/utils/nlp/queryDetection.ts` - Core detection logic
- `/tests/unit/queryDetection.test.ts` - Unit tests
- `/scripts/detect-query-tasks.ts` - Batch processing script
- `/supabase/migrations/YYYYMMDDHHMMSS_add_query_detection_to_tasks.sql` - Schema migration

**Modified Files:**
- `/src/utils/taskParsing.ts` - Integrate detection into task creation (Story 1.2 code)

### Dependencies

- **Story 1.2 (Task Parsing):** Must be completed - this story extends task creation
- **TypeScript:** Type definitions for detection result
- **Supabase:** Database schema changes

### Time Estimate

**2-3 days**
- Day 1: Core detection logic + basic tests
- Day 2: Integration with task system + database migration
- Day 3: Comprehensive testing + batch processing script

**Story Points:** 3 points

### References

- **Task Parsing Logic:** `/src/utils/taskParsing.ts` (Story 1.2)
- **Database Schema:** `/supabase/migrations/` (existing patterns)
- **Testing Patterns:** `/tests/unit/` (existing test structure)

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
