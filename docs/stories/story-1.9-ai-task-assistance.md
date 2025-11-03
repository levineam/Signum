# Story 1.9: AI-Powered Task Assistance

**Status:** Planned
**Epic:** Epic 1 - Content Intelligence & Feedback System
**GitHub Issue:** [#119](https://github.com/levineam/Signum/issues/119)
**Related Issues:** [#50](https://github.com/levineam/Signum/issues/50) (Parent Epic), [#121-#128](https://github.com/levineam/Signum/issues) (Sub-stories)

## Story

As a journaling user who creates research-oriented tasks,
I want AI to automatically answer my query-based tasks,
so that I can get immediate insights without manually researching every question.

## Problem Statement

Our NLP-based task system (Story 1.2) automatically creates tasks from journal entries. Some tasks are research queries (e.g., "research what the right 'basics' are to teach the kids") or knowledge questions (e.g., "find broader context of Wheeler's statement 'It from bit'") that could be answered by AI.

Currently, users must manually research and answer these queries themselves, creating friction and reducing the value of automated task detection.

## Proposed Solution

Enable AI to generate answers for query-based tasks with proper ontology isolation. Users will see an "Ask AI" button on tasks detected as queries, click to generate a response, and have that response automatically saved as a new note labeled "AI-generated" (excluded from ontology analysis by default).

### Implementation Approach

**Recommended:** Start with **"Ask AI" button (on-demand)** rather than automatic generation because:
1. Gives users control and transparency
2. Lower API costs during feature validation
3. Easier to iterate on query detection without annoying users
4. Can evolve to automatic mode once query detection is proven reliable

## Sub-Stories

This epic is decomposed into 8 sequential sub-stories:

| Story | Title | GitHub Issue | Estimated Effort |
|-------|-------|--------------|------------------|
| 1.9.1 | Query Detection (Rules) for Query-Based Tasks | [#121](https://github.com/levineam/Signum/issues/121) | 2-3 days |
| 1.9.2 | UI: Add 'Ask AI' Button on Query Tasks | [#122](https://github.com/levineam/Signum/issues/122) | 1-2 days |
| 1.9.3 | API: /api/ai/answer Endpoint for AI Responses | [#123](https://github.com/levineam/Signum/issues/123) | 2-3 days |
| 1.9.4 | Create AI-Generated Note and Link to Task | [#124](https://github.com/levineam/Signum/issues/124) | 2-3 days |
| 1.9.5 | Ontology Isolation: Exclude AI-Generated Notes + Toggle | [#125](https://github.com/levineam/Signum/issues/125) | 2-3 days |
| 1.9.6 | Feature Flag and Rate Limiting for AI Answers | [#126](https://github.com/levineam/Signum/issues/126) | 1-2 days |
| 1.9.7 | Telemetry for AI Answers Usage and Satisfaction | [#127](https://github.com/levineam/Signum/issues/127) | 1-2 days |
| 1.9.8 | E2E and Unit Tests for 'Ask AI' Flow | [#128](https://github.com/levineam/Signum/issues/128) | 2-3 days |

**Total Estimated Effort:** 13-21 days (3-4 weeks)

## Acceptance Criteria

### AC1: Query Detection
- [ ] System can differentiate between actionable tasks ("Call mom") and research queries ("Find context of Wheeler's 'It from bit'")
- [ ] Rule-based or heuristic system identifies query-based tasks with acceptable accuracy (target: <10% false positive rate)
- [ ] Detection works for both existing tasks and newly created tasks from journal entries

### AC2: "Ask AI" Button UI
- [ ] "Ask AI" button appears only on tasks detected as queries
- [ ] Button is visually distinct and accessible
- [ ] Loading state shown while AI generates response
- [ ] Error handling for failed AI requests with user-friendly messages

### AC3: AI Response Generation
- [ ] `/api/ai/answer` endpoint accepts task ID and generates comprehensive answer
- [ ] Uses OpenAI API (or equivalent) with appropriate model
- [ ] Responses are well-formatted, concise, and cite sources when possible
- [ ] API implements proper error handling and timeout management

### AC4: AI-Generated Note Creation
- [ ] AI response automatically creates new note
- [ ] Note is labeled "AI-generated"
- [ ] Note is linked to the originating task (bidirectional link)
- [ ] Note appears in journal stream with clear "AI-generated" indicator

### AC5: Ontology Isolation
- [ ] Notes labeled "AI-generated" are excluded from ontology extraction by default
- [ ] "Add to Ontology" button/toggle available within AI-generated notes
- [ ] Removing "AI-generated" label or toggling includes note in ontology analysis
- [ ] Users can see which notes are excluded from ontology

### AC6: Feature Flag & Rate Limiting
- [ ] Feature flag controls AI answers feature (can be disabled without code changes)
- [ ] Rate limiting prevents abuse (per-user limits on AI requests)
- [ ] Clear messaging when rate limits are reached
- [ ] Admin interface to adjust rate limits (future enhancement)

### AC7: Telemetry
- [ ] Track usage metrics: % of query-tasks that use "Ask AI"
- [ ] Track satisfaction indicators (user engagement with AI notes)
- [ ] Monitor AI response quality (errors, timeouts, token usage)
- [ ] Analytics dashboard or export for product insights

### AC8: Testing
- [ ] E2E tests cover full "Ask AI" flow (detect query → click button → generate note → link to task)
- [ ] Unit tests for query detection logic
- [ ] Unit tests for API endpoint
- [ ] Integration tests for ontology exclusion
- [ ] Test coverage > 80% for new code

## User Flow

1. User journals: "I need to research Wheeler's 'It from bit' statement"
2. NLP system (Story 1.2) creates task: "Find broader context of Wheeler's statement 'It from bit'"
3. Query detection (Story 1.9.1) identifies this as a research query
4. Task card displays with "Ask AI" button (Story 1.9.2)
5. User clicks "Ask AI" button
6. API endpoint (Story 1.9.3) calls OpenAI to generate answer
7. New note created (Story 1.9.4) with AI response, labeled "AI-generated"
8. Note linked to task (bidirectional)
9. Note appears in journal stream, excluded from ontology (Story 1.9.5)
10. User can click "Add to Ontology" if they want to include AI content in their personal ontology

## Technical Considerations

### Query Detection (Story 1.9.1)
- **Approach:** Rule-based heuristics initially (keywords, question marks, imperative verbs)
- **Future:** ML model for improved accuracy
- **Edge Cases:** Hybrid tasks ("Research X and then call Y") - may need to split or flag

### AI Response Quality (Story 1.9.3)
- **Model Selection:** GPT-4o-mini for cost-efficiency, GPT-4o for complex queries
- **Prompt Engineering:** System prompt should encourage concise, well-sourced answers
- **Response Format:** Markdown-compatible for rich text editor

### API Costs (Story 1.9.6)
- **Rate Limiting:** 10 AI requests per user per day (MVP)
- **Budget Monitoring:** Track token usage and costs
- **Graceful Degradation:** Feature flag allows disabling if costs exceed budget

### Data Model Changes (Story 1.9.4, 1.9.5)
- **Notes Table:** Add `ai_generated` boolean column
- **Notes Table:** Add `source_task_id` foreign key for linking
- **Ontology Extraction:** Modify to filter out `ai_generated = true` notes

### Integration with Existing Features
- **Story 1.2 (Task Parsing):** Query detection happens post-creation
- **Story 2.4.3 (Ontology Extraction):** Must respect `ai_generated` flag
- **Story 2.4.4 (Incremental Analysis):** AI notes excluded from analysis pipeline

## Dev Notes

### Files to Create/Modify

**New Files:**
- `/src/utils/nlp/queryDetection.ts` - Query detection logic (Story 1.9.1)
- `/src/components/tasks/AskAIButton.tsx` - UI component (Story 1.9.2)
- `/src/app/api/ai/answer/route.ts` - API endpoint (Story 1.9.3)
- `/tests/integration/ai-task-assistance.test.ts` - E2E tests (Story 1.9.8)
- `/tests/unit/queryDetection.test.ts` - Unit tests (Story 1.9.8)

**Modified Files:**
- `/src/components/tasks/TaskCard.tsx` - Add "Ask AI" button (Story 1.9.2)
- `/supabase/migrations/YYYYMMDDHHMMSS_add_ai_generated_to_notes.sql` - Schema change (Story 1.9.5)
- `/src/utils/ontologyExtraction.ts` - Filter AI notes (Story 1.9.5)
- `/src/components/notes/NoteCard.tsx` - Show "AI-generated" label + toggle (Story 1.9.5)

### Database Schema Changes

```sql
-- Story 1.9.5: Add ai_generated flag and source_task_id to notes table
ALTER TABLE notes ADD COLUMN ai_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE notes ADD COLUMN source_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_notes_ai_generated ON notes(ai_generated);
CREATE INDEX idx_notes_source_task ON notes(source_task_id);
```

### Dependencies

**External:**
- OpenAI API (already used in Story 2.4.3)
- Existing Supabase setup
- Existing task system (Story 1.2)

**Internal:**
- Story 1.2 (Task Parsing) - must be completed first
- Story 2.4.3 (Ontology Extraction) - integration point for exclusion logic

### Architecture References

- See `/docs/architecture.md` for API route patterns
- See `/src/app/api/ontology/analyze/route.ts` for OpenAI integration example
- See `/src/utils/supabase/client.ts` for database client patterns

### Testing Locations

- E2E tests: `/tests/integration/ai-task-assistance.test.ts`
- Unit tests: `/tests/unit/queryDetection.test.ts`, `/tests/unit/aiAnswer.test.ts`
- Manual testing: Use sample tasks from `/scripts/seed-tasks.js`

### Time Estimate

**Total Epic:** 13-21 days (3-4 weeks)

**Story Points:** 21 points (epic-level)
- Story 1.9.1: 3 points
- Story 1.9.2: 2 points
- Story 1.9.3: 3 points
- Story 1.9.4: 3 points
- Story 1.9.5: 3 points
- Story 1.9.6: 2 points
- Story 1.9.7: 2 points
- Story 1.9.8: 3 points

## Open Questions

1. **Should AI responses be editable before saving as a note?**
   - *Recommendation:* Save immediately, allow editing after (standard note editing)

2. **Should we show a preview/approval step?**
   - *Recommendation:* MVP creates note immediately; future enhancement adds preview

3. **What confidence threshold for query detection triggers "Ask AI" button?**
   - *Recommendation:* Start with 70% confidence, tune based on user feedback

4. **Should users be able to regenerate AI responses if unsatisfied?**
   - *Recommendation:* MVP = single generation; future enhancement adds "Regenerate" button

5. **How handle hybrid tasks (query + action)?**
   - *Recommendation:* MVP = treat as single task type (query or action); future enhancement splits tasks

## Success Metrics

- **Usage:** >30% of query-tasks use "Ask AI" feature within first month
- **Satisfaction:** <5% of AI-generated notes are deleted within 24 hours (proxy for quality)
- **Efficiency:** Average time to complete research task reduced by 50%
- **Accuracy:** Query detection false positive rate <10%
- **Cost:** AI API costs <$50/month during MVP phase

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| High API costs | Medium | High | Feature flag, rate limiting, budget alerts |
| Poor query detection accuracy | Medium | Medium | Start conservative (70% threshold), iterative tuning |
| Low user adoption | Low | Medium | Clear UI, helpful onboarding, valuable default prompts |
| AI response quality issues | Medium | Medium | Prompt engineering, model selection, user feedback loop |

## Future Enhancements (Post-MVP)

- Automatic AI response generation (bypass "Ask AI" button for high-confidence queries)
- ML-based query detection (replace rule-based heuristics)
- Multi-turn AI conversations (follow-up questions)
- Regenerate/refine AI responses
- Custom AI prompts per user
- AI-generated task suggestions based on journal content

---

## Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-11-02 | Claude (BMad Master) | Initial story creation from Issue #119 |
