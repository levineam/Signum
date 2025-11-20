# Story 1.10.3: Phase 3 - Supabase Client Integration & React Hooks

**Story ID**: 1.10.3
**Epic**: Epic 1.10 (Unified Tasks & Reminders System - Clean Rebuild)
**Type**: Backend / Integration
**Status**: 🚀 NOT STARTED
**Priority**: High (Blocker for Phase 4)
**Estimated Effort**: 2-3 days
**Created**: 2025-11-12

---

## Goal

Implement Supabase database client utilities and React hooks for efficient querying and mutation of temporal data (items, schedules, occurrences). This provides the bridge between the database schema (Phase 2) and UI components.

**Architecture**: Following the client library pattern:
1. **Supabase utilities** - Raw database operations with TypeScript types
2. **React Query hooks** - Optimized data fetching, caching, mutations
3. **Error handling** - Consistent error patterns across the app
4. **Real-time subscriptions** - Listen to changes in items/occurrences (future)

---

## Acceptance Criteria

### Supabase Client Utilities
- [ ] Create `src/lib/supabase/schedules.ts` - Schedule CRUD operations
- [ ] Create `src/lib/supabase/items.ts` - Item CRUD operations
- [ ] Create `src/lib/supabase/occurrences.ts` - Occurrence CRUD operations
- [ ] Export all utilities from `src/lib/supabase/index.ts`
- [ ] Full TypeScript support using types from `src/types/temporal.ts`
- [ ] Proper error handling and validation

### React Query Hooks
- [ ] Create `src/hooks/useItems.ts` - Query all items, with filtering
- [ ] Create `src/hooks/useOccurrences.ts` - Query occurrences by date range
- [ ] Create `src/hooks/useCreateItem.ts` - Mutation for creating items
- [ ] Create `src/hooks/useUpdateItem.ts` - Mutation for updating items
- [ ] Create `src/hooks/useDeleteItem.ts` - Mutation for deleting items
- [ ] Create `src/hooks/useCreateOccurrence.ts` - Mutation for occurrences
- [ ] Export all hooks from `src/hooks/index.ts`
- [ ] Cache invalidation patterns

### API Route Stubs
- [ ] Create `src/app/api/temporal/items/route.ts` - GET/POST items (stub)
- [ ] Create `src/app/api/temporal/items/[id]/route.ts` - GET/PATCH/DELETE item (stub)
- [ ] Create `src/app/api/temporal/occurrences/route.ts` - GET/POST occurrences (stub)
- [ ] Proper error responses and validation
- [ ] Documentation comments for Phase 5 implementation

### Documentation & Testing
- [ ] Document Supabase client utilities with examples
- [ ] Document React hooks with usage examples
- [ ] TypeScript type safety verified
- [ ] Error handling strategy documented

---

## Implementation Plan

### Step 1: Supabase Client Utilities

Create `src/lib/supabase/schedules.ts`:
```typescript
import { createClient } from '@/lib/supabase/client'
import { Schedule, CreateScheduleRequest, UpdateScheduleRequest } from '@/types/temporal'

const supabase = createClient()

export const scheduleQueries = {
  // Get all schedules for user
  async getSchedules(): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  // Get single schedule
  async getSchedule(id: string): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  // Create schedule
  async createSchedule(req: CreateScheduleRequest): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .insert([{
        rrule: req.rrule,
        timezone: req.timezone,
        exception_dates: req.exceptionDates || [],
        recurrence_dates: req.recurrenceDates || [],
      }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Update schedule
  async updateSchedule(id: string, req: UpdateScheduleRequest): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .update({
        rrule: req.rrule,
        timezone: req.timezone,
        exception_dates: req.exceptionDates,
        recurrence_dates: req.recurrenceDates,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Delete schedule
  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)
    if (error) throw error
  },
}
```

Create `src/lib/supabase/items.ts`:
```typescript
import { createClient } from '@/lib/supabase/client'
import { Item, CreateItemRequest, UpdateItemRequest, ItemsQuery } from '@/types/temporal'

const supabase = createClient()

export const itemQueries = {
  // Get items with optional filtering
  async getItems(query?: ItemsQuery): Promise<Item[]> {
    let q = supabase.from('items').select('*')

    if (query?.itemType) q = q.eq('item_type', query.itemType)
    if (query?.status) q = q.eq('status', query.status)
    if (query?.priority) q = q.eq('priority', query.priority)
    if (query?.dueBefore) q = q.lte('due_at', query.dueBefore)
    if (query?.dueAfter) q = q.gte('due_at', query.dueAfter)
    if (query?.hasSchedule !== undefined) {
      if (query.hasSchedule) {
        q = q.not('schedule_id', 'is', null)
      } else {
        q = q.is('schedule_id', null)
      }
    }
    if (query?.search) {
      q = q.or(`title.ilike.%${query.search}%,description.ilike.%${query.search}%`)
    }

    q = q.order('created_at', { ascending: false })

    if (query?.limit) q = q.limit(query.limit)
    if (query?.offset) q = q.range(query.offset, query.offset + (query.limit || 10) - 1)

    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  // Get single item
  async getItem(id: string): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  // Create item
  async createItem(req: CreateItemRequest): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .insert([{
        item_type: req.itemType,
        title: req.title,
        description: req.description,
        schedule_id: req.scheduleId,
        due_at: req.dueAt,
        priority: req.priority || 'medium',
        estimate_minutes: req.estimateMinutes,
        reminder_time: req.reminderTime,
        metadata: req.metadata || {},
      }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Update item
  async updateItem(id: string, req: UpdateItemRequest): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .update({
        title: req.title,
        description: req.description,
        due_at: req.dueAt,
        priority: req.priority,
        estimate_minutes: req.estimateMinutes,
        reminder_time: req.reminderTime,
        snooze_until: req.snoozeUntil,
        status: req.status,
        metadata: req.metadata,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Delete item
  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  // Complete item
  async completeItem(id: string): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Snooze reminder
  async snoozeReminder(id: string, until: string): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .update({ snooze_until: until })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
```

Create `src/lib/supabase/occurrences.ts`:
```typescript
import { createClient } from '@/lib/supabase/client'
import { Occurrence, CreateOccurrenceRequest, UpdateOccurrenceRequest, OccurrencesQuery } from '@/types/temporal'

const supabase = createClient()

export const occurrenceQueries = {
  // Get occurrences with optional filtering
  async getOccurrences(query?: OccurrencesQuery): Promise<Occurrence[]> {
    let q = supabase.from('occurrences').select('*')

    if (query?.itemId) q = q.eq('item_id', query.itemId)
    if (query?.status) q = q.eq('status', query.status)
    if (query?.scheduledBefore) q = q.lte('scheduled_at', query.scheduledBefore)
    if (query?.scheduledAfter) q = q.gte('scheduled_at', query.scheduledAfter)
    if (query?.excludeSkipped) q = q.eq('is_skipped', false)

    q = q.order('scheduled_at', { ascending: true })

    if (query?.limit) q = q.limit(query.limit)
    if (query?.offset) q = q.range(query.offset, query.offset + (query.limit || 10) - 1)

    const { data, error } = await q
    if (error) throw error
    return data || []
  },

  // Get single occurrence
  async getOccurrence(id: string): Promise<Occurrence> {
    const { data, error } = await supabase
      .from('occurrences')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  // Get occurrences for date range (common query)
  async getOccurrencesByDateRange(startDate: string, endDate: string, itemId?: string): Promise<Occurrence[]> {
    let q = supabase
      .from('occurrences')
      .select('*')
      .gte('scheduled_at', startDate)
      .lte('scheduled_at', endDate)
      .eq('is_skipped', false)

    if (itemId) q = q.eq('item_id', itemId)

    const { data, error } = await q.order('scheduled_at', { ascending: true })
    if (error) throw error
    return data || []
  },

  // Create occurrence
  async createOccurrence(req: CreateOccurrenceRequest): Promise<Occurrence> {
    const { data, error } = await supabase
      .from('occurrences')
      .insert([{
        item_id: req.itemId,
        scheduled_at: req.scheduledAt,
        title: req.title,
        description: req.description,
        due_at: req.dueAt,
        reminder_time: req.reminderTime,
        metadata: req.metadata || {},
      }])
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Update occurrence
  async updateOccurrence(id: string, req: UpdateOccurrenceRequest): Promise<Occurrence> {
    const { data, error } = await supabase
      .from('occurrences')
      .update({
        title: req.title,
        description: req.description,
        due_at: req.dueAt,
        reminder_time: req.reminderTime,
        status: req.status,
        is_skipped: req.isSkipped,
        metadata: req.metadata,
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Delete occurrence
  async deleteOccurrence(id: string): Promise<void> {
    const { error } = await supabase
      .from('occurrences')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  // Complete occurrence
  async completeOccurrence(id: string): Promise<Occurrence> {
    const { data, error } = await supabase
      .from('occurrences')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  // Skip occurrence
  async skipOccurrence(id: string): Promise<Occurrence> {
    const { data, error } = await supabase
      .from('occurrences')
      .update({ is_skipped: true })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
```

Create `src/lib/supabase/index.ts`:
```typescript
export { scheduleQueries } from './schedules'
export { itemQueries } from './items'
export { occurrenceQueries } from './occurrences'
```

### Step 2: React Query Hooks

Create `src/hooks/useItems.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { itemQueries } from '@/lib/supabase/items'
import { Item, CreateItemRequest, UpdateItemRequest, ItemsQuery } from '@/types/temporal'

const ITEMS_QUERY_KEY = ['items']

export function useItems(query?: ItemsQuery) {
  return useQuery({
    queryKey: [ITEMS_QUERY_KEY, query],
    queryFn: () => itemQueries.getItems(query),
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: [ITEMS_QUERY_KEY, id],
    queryFn: () => itemQueries.getItem(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateItemRequest) => itemQueries.createItem(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY })
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateItemRequest }) =>
      itemQueries.updateItem(id, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY })
      queryClient.setQueryData([ITEMS_QUERY_KEY, data.id], data)
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => itemQueries.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY })
    },
  })
}

export function useCompleteItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => itemQueries.completeItem(id),
    onSuccess: (data) => {
      queryClient.setQueryData([ITEMS_QUERY_KEY, data.id], data)
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY })
    },
  })
}

export function useSnoozeReminder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, until }: { id: string; until: string }) =>
      itemQueries.snoozeReminder(id, until),
    onSuccess: (data) => {
      queryClient.setQueryData([ITEMS_QUERY_KEY, data.id], data)
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY })
    },
  })
}
```

Create `src/hooks/useOccurrences.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { occurrenceQueries } from '@/lib/supabase/occurrences'
import { Occurrence, CreateOccurrenceRequest, UpdateOccurrenceRequest, OccurrencesQuery } from '@/types/temporal'

const OCCURRENCES_QUERY_KEY = ['occurrences']

export function useOccurrences(query?: OccurrencesQuery) {
  return useQuery({
    queryKey: [OCCURRENCES_QUERY_KEY, query],
    queryFn: () => occurrenceQueries.getOccurrences(query),
    staleTime: 30 * 1000,
  })
}

export function useOccurrence(id: string) {
  return useQuery({
    queryKey: [OCCURRENCES_QUERY_KEY, id],
    queryFn: () => occurrenceQueries.getOccurrence(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export function useOccurrencesByDateRange(startDate: string, endDate: string, itemId?: string) {
  return useQuery({
    queryKey: [OCCURRENCES_QUERY_KEY, 'dateRange', startDate, endDate, itemId],
    queryFn: () => occurrenceQueries.getOccurrencesByDateRange(startDate, endDate, itemId),
    staleTime: 30 * 1000,
  })
}

export function useCreateOccurrence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (req: CreateOccurrenceRequest) => occurrenceQueries.createOccurrence(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OCCURRENCES_QUERY_KEY })
    },
  })
}

export function useUpdateOccurrence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, req }: { id: string; req: UpdateOccurrenceRequest }) =>
      occurrenceQueries.updateOccurrence(id, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: OCCURRENCES_QUERY_KEY })
      queryClient.setQueryData([OCCURRENCES_QUERY_KEY, data.id], data)
    },
  })
}

export function useDeleteOccurrence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => occurrenceQueries.deleteOccurrence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OCCURRENCES_QUERY_KEY })
    },
  })
}

export function useCompleteOccurrence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => occurrenceQueries.completeOccurrence(id),
    onSuccess: (data) => {
      queryClient.setQueryData([OCCURRENCES_QUERY_KEY, data.id], data)
      queryClient.invalidateQueries({ queryKey: OCCURRENCES_QUERY_KEY })
    },
  })
}

export function useSkipOccurrence() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => occurrenceQueries.skipOccurrence(id),
    onSuccess: (data) => {
      queryClient.setQueryData([OCCURRENCES_QUERY_KEY, data.id], data)
      queryClient.invalidateQueries({ queryKey: OCCURRENCES_QUERY_KEY })
    },
  })
}
```

Create `src/hooks/index.ts`:
```typescript
export * from './useItems'
export * from './useOccurrences'
```

### Step 3: API Route Stubs

Create `src/app/api/temporal/items/route.ts`:
```typescript
import { createClient } from '@/lib/supabase/server'
import { CreateItemRequest } from '@/types/temporal'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/temporal/items
 * Fetch items for current user with optional filters
 *
 * Query parameters:
 * - itemType?: 'task' | 'reminder'
 * - status?: 'pending' | 'completed' | 'cancelled'
 * - priority?: 'low' | 'medium' | 'high'
 * - dueBefore?: ISO timestamp
 * - dueAfter?: ISO timestamp
 * - search?: search string
 * - limit?: number (default 10)
 * - offset?: number (default 0)
 *
 * TODO Phase 5: Implement full query parameter handling
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // TODO: Extract query parameters and pass to itemQueries.getItems()
    // const query = Object.fromEntries(request.nextUrl.searchParams)

    // For now, stub response
    return NextResponse.json({
      error: 'Not implemented in Phase 3. Will be completed in Phase 5.',
      status: 501,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/temporal/items
 * Create a new item (task or reminder)
 *
 * Body: CreateItemRequest
 *
 * TODO Phase 5: Implement creation with validation
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Parse CreateItemRequest, validate, then call itemQueries.createItem()
    return NextResponse.json(
      { error: 'Not implemented in Phase 3. Will be completed in Phase 5.' },
      { status: 501 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

Create `src/app/api/temporal/items/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { UpdateItemRequest } from '@/types/temporal'

/**
 * GET /api/temporal/items/[id]
 * Fetch single item by ID
 *
 * TODO Phase 5: Implement with authorization check
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Call itemQueries.getItem(params.id) with auth check
    return NextResponse.json(
      { error: 'Not implemented in Phase 3. Will be completed in Phase 5.' },
      { status: 501 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/temporal/items/[id]
 * Update an existing item
 *
 * Body: UpdateItemRequest (partial)
 *
 * TODO Phase 5: Implement with authorization check
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Parse UpdateItemRequest and call itemQueries.updateItem()
    return NextResponse.json(
      { error: 'Not implemented in Phase 3. Will be completed in Phase 5.' },
      { status: 501 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/temporal/items/[id]
 * Delete an item
 *
 * TODO Phase 5: Implement with authorization check
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // TODO: Call itemQueries.deleteItem(params.id) with auth check
    return NextResponse.json(
      { error: 'Not implemented in Phase 3. Will be completed in Phase 5.' },
      { status: 501 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

Create `src/app/api/temporal/occurrences/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { CreateOccurrenceRequest } from '@/types/temporal'

/**
 * GET /api/temporal/occurrences
 * Fetch occurrences with optional filtering
 *
 * Query parameters:
 * - itemId?: filter by item
 * - status?: 'pending' | 'completed' | 'cancelled'
 * - scheduledBefore?: ISO timestamp
 * - scheduledAfter?: ISO timestamp
 * - excludeSkipped?: boolean
 * - limit?: number (default 10)
 * - offset?: number (default 0)
 *
 * TODO Phase 5: Implement full query parameter handling
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Extract query parameters and pass to occurrenceQueries.getOccurrences()
    return NextResponse.json(
      { error: 'Not implemented in Phase 3. Will be completed in Phase 5.' },
      { status: 501 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/temporal/occurrences
 * Create a new occurrence (usually auto-generated from recurrence)
 *
 * Body: CreateOccurrenceRequest
 *
 * TODO Phase 5: Implement creation with validation
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Parse CreateOccurrenceRequest and call occurrenceQueries.createOccurrence()
    return NextResponse.json(
      { error: 'Not implemented in Phase 3. Will be completed in Phase 5.' },
      { status: 501 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Documentation

### Supabase Client Utilities

**Location**: `src/lib/supabase/`

**Usage Example**:
```typescript
import { itemQueries, occurrenceQueries } from '@/lib/supabase'

// Get all pending tasks
const tasks = await itemQueries.getItems({
  itemType: 'task',
  status: 'pending',
})

// Create a new reminder
const reminder = await itemQueries.createItem({
  itemType: 'reminder',
  title: 'Doctor appointment',
  reminderTime: '2025-11-15T10:00:00Z',
})

// Get occurrences for today
const today = new Date().toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
const todayItems = await occurrenceQueries.getOccurrencesByDateRange(
  `${today}T00:00:00Z`,
  `${tomorrow}T00:00:00Z`
)
```

### React Query Hooks

**Location**: `src/hooks/`

**Usage Example**:
```typescript
import { useItems, useCreateItem, useCompleteItem } from '@/hooks'

export function TasksWidget() {
  const { data: items, isLoading } = useItems({
    itemType: 'task',
    status: 'pending',
  })

  const createMutation = useCreateItem()
  const completeMutation = useCompleteItem()

  const handleCreateTask = async (title: string) => {
    await createMutation.mutateAsync({
      itemType: 'task',
      title,
      priority: 'medium',
    })
  }

  const handleCompleteTask = async (id: string) => {
    await completeMutation.mutateAsync(id)
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {items?.map(item => (
        <div key={item.id}>
          <h3>{item.title}</h3>
          <button onClick={() => handleCompleteTask(item.id)}>
            Complete
          </button>
        </div>
      ))}
    </div>
  )
}
```

---

## Error Handling Strategy

All Supabase utilities should follow this pattern:

```typescript
try {
  const { data, error } = await supabase.from('table').select()
  if (error) throw error
  return data
} catch (error) {
  console.error('Operation failed:', error)
  throw new Error(`Failed to fetch items: ${error.message}`)
}
```

React Query hooks automatically retry failed requests with exponential backoff.

---

## Cache Invalidation Patterns

When mutations succeed, invalidate related queries:

```typescript
onSuccess: (data) => {
  // Invalidate all items queries
  queryClient.invalidateQueries({ queryKey: ['items'] })

  // Update single item cache
  queryClient.setQueryData(['items', data.id], data)
}
```

---

## Next Steps (Phase 4)

After Story 1.10.3 completion:
- **Story 1.10.4**: Database triggers for automatic occurrence generation from RRULE
- **Story 1.10.5**: Full API route implementation with auth/validation
- **Story 1.10.6**: Widget integration with real data

---

## Testing Plan

- [ ] TypeScript compilation succeeds
- [ ] All imports resolve correctly
- [ ] Hooks can be imported and used in components
- [ ] Error handling works correctly
- [ ] Query key patterns are consistent

