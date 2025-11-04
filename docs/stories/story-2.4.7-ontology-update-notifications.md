# Story 2.4.7: Ontology Update Notifications - Brownfield Enhancement

**Story ID**: 2.4.7
**Epic**: Epic 2.4 (AI Personal Ontology)
**Related Issue**: [#129 - Notify users of ontology updates with badges and highlighting](https://github.com/levineam/Signum/issues/129)
**Status**: Draft
**Story Points**: 5
**Estimated Duration**: 3-4 days
**Created**: November 4, 2025

---

## Story Goal

Notify users when new information is added to their ontology by displaying a badge count on the Ontology sidebar button and highlighting new items on the Ontology page. This improves user awareness and engagement with their growing personal ontology.

---

## Story Description

### Existing System Context

**Current Relevant Functionality:**
- **Ontology System** (Stories 2.4.3-2.4.5): AI extracts values, beliefs, and goals from journal entries
  - Stored as pinned notes with `noteType`: `'ontology-value' | 'ontology-belief' | 'ontology-aim'`
  - Displayed on `/ontology` page via `OntologyPage.tsx`
  - Expandable rows with structured items showing excerpts from source notes
- **Database Schema**: `notes` table with unified data model (Story 2.3.6)
  - Ontology items stored as pinned notes (`is_pinned = TRUE`)
  - Metadata JSONB field contains `items` array with excerpts
- **Sidebar Component** (`src/components/layout/Sidebar.tsx`): Navigation with "Ontology" button
- **No Current Notification System**: Users don't know when ontology is updated

**Technology Stack:**
- Next.js 15.5.3 (App Router, Turbopack), React 19.1.0, TypeScript ^5
- Supabase (PostgreSQL + RLS policies)
- shadcn/ui with Notebook theme (Badge, Card components)
- Tailwind CSS for styling

**Integration Points:**
1. **Database**: New `ontology_updates` table to track viewed status
2. **Sidebar**: Add badge component showing unread count
3. **OntologyPage**: Highlight new items, mark as viewed on navigation
4. **API Routes**: Backend logic to track and mark updates

### Enhancement Details

**What's Being Added:**

1. **Database Layer (Priority 1)**:
   - New `ontology_updates` table to track notification state
   - Trigger to create update records when ontology items are modified
   - Functions to query unread count and mark items as viewed

2. **Sidebar Badge (Priority 2)**:
   - Notification badge on "Ontology" button showing count of unread updates
   - Badge should be visually distinct (red circle with white number)
   - Real-time count updates via Supabase Realtime subscriptions
   - Badge disappears when count reaches 0

3. **Ontology Page Highlighting (Priority 3)**:
   - Newly added ontology items highlighted with subtle background color
   - "NEW" badge or colored accent on recent items
   - Highlights persist until user navigates away from page
   - Updates marked as "viewed" when user leaves Ontology page

4. **Mark as Viewed Logic (Priority 4)**:
   - Track which updates have been viewed per user
   - Clear highlights when user navigates away from `/ontology`
   - Reset badge count to 0 after viewing

**How It Integrates:**

1. **Database Integration**:
   - `ontology_updates` table references `notes.id` (ontology items)
   - Trigger on `notes` table creates update records for ontology modifications
   - RLS policies ensure users only see their own updates

2. **Sidebar Integration**:
   - Sidebar queries unread count on mount and subscribes to changes
   - Badge component conditionally renders when count > 0
   - Supabase Realtime subscription updates count without polling

3. **Ontology Page Integration**:
   - `OntologyPage.tsx` fetches unread update IDs on mount
   - Highlights applied via conditional CSS classes
   - `useEffect` hook marks updates as viewed on unmount

4. **API Integration**:
   - `/api/ontology/mark-viewed` endpoint to update viewed timestamps
   - Server-side validation of user permissions

**Success Criteria:**

1. ✅ Badge appears on "Ontology" sidebar button when unread updates exist
2. ✅ Badge count accurately reflects number of new/modified ontology items
3. ✅ Badge count updates in real-time when ontology is analyzed
4. ✅ Newly added ontology items are visually highlighted on Ontology page
5. ✅ Highlights distinguish between new items and modified items
6. ✅ Highlights disappear after user navigates away from Ontology page
7. ✅ Badge count resets to 0 after user views updates
8. ✅ System tracks viewed status per user (multi-user safe)
9. ✅ Works correctly across multiple sessions/devices
10. ✅ No performance degradation (queries optimized with indexes)

---

## Acceptance Criteria

### Database Schema
- [ ] `ontology_updates` table created with required columns:
  - `id` (uuid, primary key)
  - `user_id` (uuid, references `auth.users`)
  - `note_id` (uuid, references `notes.id`)
  - `update_type` (enum: `'new_item'`, `'item_modified'`)
  - `created_at` (timestamp)
  - `viewed_at` (timestamp, nullable)
- [ ] Trigger on `notes` table creates update records for ontology changes
- [ ] RLS policies ensure users only access their own updates
- [ ] Indexes created for performance: `(user_id, viewed_at)`, `(note_id)`

### Sidebar Badge
- [ ] Badge component displays on "Ontology" button when unread count > 0
- [ ] Badge shows correct count of unread updates
- [ ] Badge updates in real-time via Supabase Realtime
- [ ] Badge disappears when count reaches 0
- [ ] Badge styled consistently with shadcn/ui theme (red background, white text)
- [ ] Badge positioned top-right of "Ontology" button

### Ontology Page Highlighting
- [ ] New ontology items highlighted with subtle yellow/blue background
- [ ] "NEW" badge or icon displayed on recent items
- [ ] Highlights apply only to items with `viewed_at = NULL`
- [ ] Highlights removed after user navigates away from page
- [ ] CSS transitions smooth (fade-in/fade-out effects)

### Mark as Viewed Logic
- [ ] Updates marked as viewed when user navigates away from `/ontology`
- [ ] API endpoint `/api/ontology/mark-viewed` validates user permissions
- [ ] Badge count updates immediately after marking as viewed
- [ ] Works correctly across multiple tabs/devices

### Testing
- [ ] Manual: Create new ontology item → badge appears with count "1"
- [ ] Manual: Click Ontology → item highlighted → navigate away → badge disappears
- [ ] Manual: Test across multiple devices (badge syncs via Supabase)
- [ ] Manual: Modify existing ontology item → badge increments
- [ ] Build: `npm run build` passes without errors
- [ ] Vercel Preview: Full functionality tested on preview deployment

---

## Technical Implementation Plan

### Phase 1: Database Schema (Day 1, ~4-5 hours)

**1.1 Create Migration File**
```sql
-- File: supabase/migrations/20251104000000_ontology_update_notifications.sql

-- Create ontology_updates table
CREATE TABLE ontology_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  update_type TEXT NOT NULL CHECK (update_type IN ('new_item', 'item_modified')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  viewed_at TIMESTAMP WITH TIME ZONE,

  -- Prevent duplicate update notifications
  UNIQUE(user_id, note_id, created_at)
);

-- Indexes for performance
CREATE INDEX idx_ontology_updates_user_viewed ON ontology_updates(user_id, viewed_at);
CREATE INDEX idx_ontology_updates_note ON ontology_updates(note_id);
CREATE INDEX idx_ontology_updates_created ON ontology_updates(created_at DESC);

-- RLS policies
ALTER TABLE ontology_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ontology updates"
  ON ontology_updates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own ontology updates"
  ON ontology_updates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger function to create update records when ontology items change
CREATE OR REPLACE FUNCTION create_ontology_update_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track ontology notes (not journal entries or custom notes)
  IF NEW.note_type IN ('ontology-value', 'ontology-belief', 'ontology-aim') AND NEW.is_pinned = TRUE THEN
    -- Determine update type
    IF TG_OP = 'INSERT' THEN
      INSERT INTO ontology_updates (user_id, note_id, update_type)
      VALUES (NEW.user_id, NEW.id, 'new_item');
    ELSIF TG_OP = 'UPDATE' AND OLD.content != NEW.content THEN
      INSERT INTO ontology_updates (user_id, note_id, update_type)
      VALUES (NEW.user_id, NEW.id, 'item_modified');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to notes table
CREATE TRIGGER ontology_update_notification_trigger
AFTER INSERT OR UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION create_ontology_update_notification();
```

**1.2 Test Migration**
- Run migration locally: `supabase migration up`
- Verify table created: `SELECT * FROM ontology_updates LIMIT 1;`
- Test trigger: Modify ontology note → verify update record created

---

### Phase 2: Sidebar Badge (Day 1-2, ~6-7 hours)

**2.1 Create Badge Hook (`src/hooks/useOntologyBadge.ts`)**
```typescript
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/contexts/AuthContext'

export function useOntologyBadge() {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    // Fetch initial count
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('ontology_updates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('viewed_at', null)

      if (!error && count !== null) {
        setUnreadCount(count)
      }
    }

    fetchCount()

    // Subscribe to real-time changes
    const channel = supabase
      .channel('ontology-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ontology_updates',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchCount() // Refetch count on any change
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase])

  return unreadCount
}
```

**2.2 Update Sidebar Component**
```tsx
// File: src/components/layout/Sidebar.tsx
import { useOntologyBadge } from '@/hooks/useOntologyBadge'
import { Badge } from '@/components/ui/badge'

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const unreadCount = useOntologyBadge()

  return (
    <nav className="sidebar">
      {/* ... existing navigation items ... */}

      <Button
        onClick={() => onSectionChange('ontology')}
        className={cn('nav-button', activeSection === 'ontology' && 'active')}
      >
        <BookUser className="icon" />
        <span>Ontology</span>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="ml-2">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* ... rest of sidebar ... */}
    </nav>
  )
}
```

---

### Phase 3: Ontology Page Highlighting (Day 2-3, ~6-7 hours)

**3.1 Fetch Unread Updates in OntologyPage**
```tsx
// File: src/components/ontology/OntologyPage.tsx
const [unreadNoteIds, setUnreadNoteIds] = useState<Set<string>>(new Set())

useEffect(() => {
  if (!user) return

  const fetchUnreadUpdates = async () => {
    const supabase = createClientComponentClient()
    const { data, error } = await supabase
      .from('ontology_updates')
      .select('note_id')
      .eq('user_id', user.id)
      .is('viewed_at', null)

    if (!error && data) {
      setUnreadNoteIds(new Set(data.map((u) => u.note_id)))
    }
  }

  fetchUnreadUpdates()
}, [user])
```

**3.2 Apply Highlight Styling**
```tsx
// Pass isNew prop to ExpandableOntologyRow
<ExpandableOntologyRow
  key={note.id}
  note={note}
  isExpanded={expandedCards.has(category)}
  onToggle={() => toggleCard(category)}
  isNew={unreadNoteIds.has(note.id)} // NEW PROP
/>
```

**3.3 Update ExpandableOntologyRow Component**
```tsx
// File: src/components/ontology/ExpandableOntologyRow.tsx
interface ExpandableOntologyRowProps {
  note: Note
  isExpanded: boolean
  onToggle: () => void
  isNew?: boolean // NEW PROP
}

export function ExpandableOntologyRow({ note, isExpanded, onToggle, isNew }: ExpandableOntologyRowProps) {
  return (
    <Card className={cn(
      'ontology-row',
      isNew && 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-950/20'
    )}>
      <div className="row-header">
        <h3>{getNoteDisplayTitle(note)}</h3>
        {isNew && (
          <Badge variant="secondary" className="ml-2 bg-blue-500 text-white">
            NEW
          </Badge>
        )}
      </div>
      {/* ... rest of component ... */}
    </Card>
  )
}
```

---

### Phase 4: Mark as Viewed (Day 3, ~4-5 hours)

**4.1 Create API Endpoint**
```typescript
// File: src/app/api/ontology/mark-viewed/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('ontology_updates')
    .update({ viewed_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('viewed_at', null)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

**4.2 Call API on Page Unmount**
```tsx
// File: src/components/ontology/OntologyPage.tsx
useEffect(() => {
  return () => {
    // Mark all updates as viewed when user leaves page
    if (user && unreadNoteIds.size > 0) {
      fetch('/api/ontology/mark-viewed', {
        method: 'POST',
        credentials: 'include',
      })
    }
  }
}, [user, unreadNoteIds])
```

---

## Testing Strategy

### Unit Tests
- [ ] Test `useOntologyBadge` hook with mock Supabase client
- [ ] Test badge count calculation logic
- [ ] Test highlight rendering with `isNew` prop

### Integration Tests
- [ ] Test database trigger creates update records correctly
- [ ] Test RLS policies prevent cross-user access
- [ ] Test API endpoint validates user permissions

### Manual Tests
1. **Badge Appearance**: Create new ontology item → verify badge shows "1"
2. **Real-time Updates**: Run ontology analysis → verify badge increments without refresh
3. **Highlighting**: Navigate to `/ontology` → verify new items highlighted
4. **Mark as Viewed**: Navigate away → verify badge disappears and highlights cleared
5. **Multi-device Sync**: Open app on two devices → verify badge syncs across both
6. **Edge Cases**:
   - Badge behavior when all updates viewed (should disappear)
   - Highlight behavior when no unread updates (should show normal styling)
   - Badge count when user has never run ontology analysis (should be 0)

### Vercel Preview Tests
- [ ] Test full flow on Vercel preview deployment
- [ ] Verify Supabase Realtime works in production environment
- [ ] Check console for errors
- [ ] Test across different browsers (Chrome, Safari, Firefox)
- [ ] Test on mobile devices (iOS Safari, Android Chrome)

---

## Rollback Plan

If issues arise during deployment:

1. **Database Issues**:
   - Create rollback migration: `20251104000001_ontology_update_notifications_rollback.sql`
   - Drop trigger, function, and table
   - Revert to previous schema state

2. **Performance Issues**:
   - Disable Realtime subscription temporarily
   - Fall back to polling with `setInterval` (less ideal)
   - Optimize indexes if queries are slow

3. **UI Issues**:
   - Remove badge component from Sidebar (comment out)
   - Remove highlighting from OntologyPage
   - Keep database schema for future retry

**Rollback Migration**:
```sql
-- File: supabase/migrations/20251104000001_ontology_update_notifications_rollback.sql
DROP TRIGGER IF EXISTS ontology_update_notification_trigger ON notes;
DROP FUNCTION IF EXISTS create_ontology_update_notification();
DROP TABLE IF EXISTS ontology_updates CASCADE;
```

---

## Dependencies

### External Dependencies
- ✅ **Supabase**: Database, RLS, Realtime subscriptions available
- ✅ **shadcn/ui Badge**: Component available for badge styling
- ✅ **Ontology System**: Stories 2.4.3-2.4.5 completed

### Internal Dependencies
- ✅ **Unified Notes Schema**: Story 2.3.6 provides `notes` table structure
- ✅ **OntologyPage Component**: Exists and can be modified
- ✅ **Sidebar Component**: Exists and can be modified
- ✅ **AuthContext**: Provides user authentication state

### Blockers
- None - all dependencies are in place

---

## Definition of Done

### Code Quality
- ✅ TypeScript strict mode passes (no `any` types)
- ✅ ESLint passes (`npm run lint`)
- ✅ Build succeeds (`npm run build`)
- ✅ No console errors in browser or terminal

### Functionality
- ✅ All acceptance criteria met (database, badge, highlighting, mark-as-viewed)
- ✅ Badge count updates in real-time via Supabase Realtime
- ✅ Highlights applied correctly to new ontology items
- ✅ Updates marked as viewed when user navigates away

### Testing
- ✅ Manual tests completed for all user flows
- ✅ Tested on Vercel preview deployment
- ✅ Tested across multiple devices (desktop, mobile)
- ✅ No regressions in existing ontology functionality

### Documentation
- ✅ Story document completed with implementation details
- ✅ Database migration includes comments explaining schema
- ✅ Code comments added for complex logic (trigger, hook)

### Deployment
- ✅ PR created with detailed description and screenshots
- ✅ Tested on Vercel preview (wait for preview URL from bot)
- ✅ Code reviewed and approved
- ✅ User merges PR (not Claude)

---

## Related Stories

- **Story 2.3.6**: Unified Note Data Model (provides `notes` table structure)
- **Story 2.4.3**: AI Personal Ontology Extraction (creates ontology items)
- **Story 2.4.4**: Incremental AI Ontology Analysis (updates ontology items)
- **Story 2.4.5**: Ontology Expandable Rows (displays ontology items)

---

## Future Enhancements (Out of Scope)

These features are intentionally excluded from Story 2.4.7 but may be considered in future stories:

1. **Email Digests**: Weekly email summary of ontology growth
2. **Toast Notifications**: Pop-up notification when ontology is updated
3. **Timeline View**: "Recent Updates" section showing chronological changes
4. **Persistent Highlights**: Keep highlights until user explicitly dismisses them
5. **Granular Notifications**: Separate badges for Values, Beliefs, Goals
6. **Notification Settings**: User preferences for notification types

---

## Risk Assessment

### Primary Risk: Supabase Realtime Performance
**Risk**: Realtime subscriptions may cause performance issues with many concurrent users
**Likelihood**: Low (Supabase handles Realtime well)
**Impact**: Medium (badge updates would lag)
**Mitigation**:
- Use targeted subscriptions (filter by `user_id`)
- Implement debouncing on count refetch
- Fall back to polling if Realtime fails

### Secondary Risk: Trigger Performance
**Risk**: Database trigger may slow down note updates
**Likelihood**: Low (trigger logic is simple)
**Impact**: Low (slight delay in note saves)
**Mitigation**:
- Optimize trigger function (avoid unnecessary checks)
- Add indexes on `note_type` and `is_pinned`
- Monitor query performance with Supabase dashboard

### Tertiary Risk: Badge Count Accuracy
**Risk**: Badge count may become inaccurate due to race conditions
**Likelihood**: Low (Supabase transactions are atomic)
**Impact**: Low (cosmetic issue, self-correcting on page refresh)
**Mitigation**:
- Use `count` query with `head: true` for efficiency
- Refetch count on page mount to ensure accuracy
- Add manual refresh button if needed

---

## Timeline Estimate

### Optimistic (3 days)
- Day 1: Database schema + migration (4 hours) + Sidebar badge (4 hours)
- Day 2: Ontology page highlighting (6 hours)
- Day 3: Mark as viewed API + testing (6 hours)

### Realistic (4 days)
- Day 1: Database schema + migration + testing (6 hours)
- Day 2: Sidebar badge + Realtime subscription debugging (7 hours)
- Day 3: Ontology page highlighting + styling refinement (7 hours)
- Day 4: Mark as viewed API + full integration testing + Vercel preview testing (6 hours)

### Pessimistic (5 days)
- Day 1-2: Database schema + debugging trigger issues (12 hours)
- Day 3: Sidebar badge + Realtime subscription issues (8 hours)
- Day 4: Ontology page highlighting + accessibility refinement (8 hours)
- Day 5: Mark as viewed API + cross-device testing + bug fixes (8 hours)

**Recommended Target**: 4 days (realistic)

---

## Notes

### Why This Story vs Full Epic?

This enhancement qualified for a single story (not a multi-story epic) because:
- ✅ Can be completed in 3-4 focused days
- ✅ Single feature with clear scope (notifications)
- ✅ No significant architectural changes (extends existing schema)
- ✅ Integration complexity is manageable (database + UI updates)
- ✅ Risk to existing system is low (additive feature, no breaking changes)

### Design Decisions

1. **Badge Placement**: Top-right of "Ontology" button (standard notification pattern)
2. **Highlight Color**: Subtle blue/yellow background (not distracting)
3. **Mark as Viewed Trigger**: On navigation away (not on page view duration)
4. **Update Granularity**: Track at note level (not individual item level)
5. **Realtime vs Polling**: Use Realtime for better UX (fall back to polling if issues)

### Accessibility Considerations

- Badge has sufficient color contrast (WCAG AA compliant)
- "NEW" text badge for screen reader users
- Highlighted items have semantic HTML (`aria-label="New ontology item"`)
- Keyboard navigation works correctly with badge present

---

**Story Status**: ✅ **READY FOR IMPLEMENTATION**

**Next Action**: Rename branch to `story-2.4.7-ontology-notifications`, then begin Phase 1 (Database Schema).
