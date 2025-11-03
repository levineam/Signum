# Story 1.9.2: UI: Add 'Ask AI' Button on Query Tasks

**Status:** Backlog
**Parent Story:** Story 1.9 - AI-Powered Task Assistance
**GitHub Issue:** [#122](https://github.com/levineam/Signum/issues/122)
**Epic:** Epic 1 - Content Intelligence & Feedback System

## Story

As a journaling user who creates research-oriented tasks,
I want to see an "Ask AI" button on query-based tasks,
so that I can easily trigger AI-powered answers for research questions.

## Acceptance Criteria

1. **"Ask AI" Button Visibility**
   - [ ] "Ask AI" button appears only on tasks where `is_query = true` (from Story 1.9.1)
   - [ ] Button is visually distinct (e.g., sparkle icon ✨ or lightbulb icon 💡)
   - [ ] Button placement is consistent and accessible on task cards
   - [ ] Button does not appear on action tasks (`is_query = false`)

2. **Button States**
   - [ ] Default state: "Ask AI" with icon
   - [ ] Loading state: Spinner with "Generating..." text
   - [ ] Success state: Checkmark with "Answer Created" (brief transition)
   - [ ] Error state: Error icon with "Try Again" option

3. **User Interaction**
   - [ ] Clicking "Ask AI" triggers API call to `/api/ai/answer` (Story 1.9.3)
   - [ ] Loading indicator shown immediately on click
   - [ ] Button disabled during loading to prevent duplicate requests
   - [ ] Error toast/notification shown on API failure with user-friendly message

4. **Visual Design**
   - [ ] Button follows shadcn/ui design system patterns
   - [ ] Responsive design (works on mobile and desktop)
   - [ ] Accessible (keyboard navigation, screen reader support)
   - [ ] Tooltip explaining feature on hover (e.g., "Get AI-powered answer")

5. **Error Handling**
   - [ ] Network errors show "Connection failed. Please try again."
   - [ ] Rate limit errors show "Daily AI limit reached. Try again tomorrow."
   - [ ] Generic errors show "Unable to generate answer. Please try again."
   - [ ] Errors don't crash the UI or leave task in broken state

## Tasks / Subtasks

- [ ] **Create AskAIButton Component** (AC: #1, #2, #4)
  - [ ] Create `/src/components/tasks/AskAIButton.tsx`
  - [ ] Implement button states (default, loading, success, error)
  - [ ] Add sparkle or lightbulb icon (Lucide React or similar)
  - [ ] Use shadcn/ui Button component as base
  - [ ] Add tooltip with feature explanation

- [ ] **Implement Click Handler** (AC: #3)
  - [ ] Add `onClick` handler to trigger AI answer API
  - [ ] Call `/api/ai/answer` endpoint with task ID
  - [ ] Handle loading state (disable button, show spinner)
  - [ ] Handle success state (show checkmark, update UI)
  - [ ] Handle error state (show error message, enable retry)

- [ ] **Add Error Handling** (AC: #5)
  - [ ] Catch network errors and display user-friendly messages
  - [ ] Handle rate limiting errors (429 status code)
  - [ ] Handle generic API errors (500, etc.)
  - [ ] Use toast notifications (shadcn/ui Toast component)

- [ ] **Integrate with TaskCard** (AC: #1)
  - [ ] Modify `/src/components/tasks/TaskCard.tsx`
  - [ ] Conditionally render `<AskAIButton />` if `task.is_query === true`
  - [ ] Pass task ID and metadata to button component
  - [ ] Ensure button placement works with existing task card layout

- [ ] **Add Accessibility Features** (AC: #4)
  - [ ] Add ARIA labels for screen readers
  - [ ] Ensure keyboard navigation works (tab, enter)
  - [ ] Add focus styles for keyboard users
  - [ ] Test with screen reader (VoiceOver or NVDA)

- [ ] **Responsive Design** (AC: #4)
  - [ ] Test button layout on mobile (320px width)
  - [ ] Test button layout on tablet (768px width)
  - [ ] Test button layout on desktop (1024px+ width)
  - [ ] Ensure button text truncates gracefully if needed

- [ ] **Add Loading and Success Animations** (AC: #2)
  - [ ] Spinner animation during loading
  - [ ] Checkmark animation on success (1-2 seconds)
  - [ ] Smooth transitions between states

## Dev Notes

### Technical Summary

Create a React component for the "Ask AI" button that integrates with the task card UI. The button should only appear on query-based tasks (detected in Story 1.9.1) and trigger the AI answer API (Story 1.9.3) when clicked.

### Implementation Approach

**Component Structure:**

```typescript
// /src/components/tasks/AskAIButton.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Sparkles, Loader2, Check, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

type ButtonState = 'idle' | 'loading' | 'success' | 'error'

interface AskAIButtonProps {
  taskId: string
  taskText: string
  onAnswerCreated?: (noteId: string) => void
}

export function AskAIButton({ taskId, taskText, onAnswerCreated }: AskAIButtonProps) {
  const [state, setState] = useState<ButtonState>('idle')
  const { toast } = useToast()

  const handleClick = async () => {
    setState('loading')

    try {
      const response = await fetch('/api/ai/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, taskText })
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit reached')
        }
        throw new Error('Failed to generate answer')
      }

      const data = await response.json()
      setState('success')
      onAnswerCreated?.(data.noteId)

      // Reset to idle after 2 seconds
      setTimeout(() => setState('idle'), 2000)
    } catch (error) {
      setState('error')
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
      // Reset to idle after 3 seconds
      setTimeout(() => setState('idle'), 3000)
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={handleClick}
          disabled={state === 'loading'}
          variant={state === 'error' ? 'destructive' : 'secondary'}
          size="sm"
        >
          {state === 'idle' && <><Sparkles className="mr-2 h-4 w-4" />Ask AI</>}
          {state === 'loading' && <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</>}
          {state === 'success' && <><Check className="mr-2 h-4 w-4" />Answer Created</>}
          {state === 'error' && <><AlertCircle className="mr-2 h-4 w-4" />Try Again</>}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Get an AI-powered answer to this research question
      </TooltipContent>
    </Tooltip>
  )
}
```

**Integration with TaskCard:**

```typescript
// /src/components/tasks/TaskCard.tsx (modifications)
import { AskAIButton } from './AskAIButton'

export function TaskCard({ task }: { task: Task }) {
  // ... existing code ...

  return (
    <div className="task-card">
      {/* ... existing task content ... */}

      {/* Add Ask AI button for query tasks */}
      {task.is_query && (
        <div className="mt-2">
          <AskAIButton
            taskId={task.id}
            taskText={task.text}
            onAnswerCreated={(noteId) => {
              // Optional: Navigate to note or show success message
              console.log('Answer created:', noteId)
            }}
          />
        </div>
      )}
    </div>
  )
}
```

### Files to Modify

**New Files:**
- `/src/components/tasks/AskAIButton.tsx` - Main button component

**Modified Files:**
- `/src/components/tasks/TaskCard.tsx` - Integrate button into task cards

### Dependencies

- **Story 1.9.1 (Query Detection):** Requires `is_query` field on tasks
- **Story 1.9.3 (AI Answer API):** Button calls `/api/ai/answer` endpoint
- **shadcn/ui components:** Button, Tooltip, Toast (already installed)
- **Lucide React:** Icons (already installed)

### UI/UX Considerations

- **Button Placement:** Place below task text, aligned left with other task actions
- **Loading Feedback:** Immediate visual feedback (spinner) prevents user confusion
- **Success Transition:** Brief "Answer Created" state provides positive reinforcement
- **Error Recovery:** "Try Again" allows users to retry without page refresh
- **Tooltip:** Helps users understand the feature on first encounter

### Accessibility

- Use semantic HTML (`<button>` element)
- Add `aria-label` for screen readers
- Ensure sufficient color contrast (WCAG AA)
- Support keyboard navigation (Tab, Enter, Space)
- Announce state changes to screen readers

### Time Estimate

**1-2 days**
- Day 1: Component creation, basic states, TaskCard integration
- Day 2: Error handling, accessibility, responsive testing

**Story Points:** 2 points

### References

- **Task Card Component:** `/src/components/tasks/TaskCard.tsx`
- **shadcn/ui Button:** `/src/components/ui/button.tsx`
- **shadcn/ui Toast:** `/src/components/ui/toast.tsx`
- **Lucide Icons:** https://lucide.dev/icons

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
