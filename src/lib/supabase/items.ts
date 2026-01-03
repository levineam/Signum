import { supabase, hasPublicSupabase } from '@/lib/supabase'
import {
  Item,
  CreateItemRequest,
  UpdateItemRequest,
  ItemsQuery,
  JsonValue,
} from '@/types/temporal'

/**
 * Ensure Supabase is available before making any calls
 */
function requireSupabase() {
  if (!hasPublicSupabase()) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
}

async function requireUserId() {
  requireSupabase()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw new Error(`Failed to load user session: ${error.message}`)
  }

  if (!user?.id) {
    throw new Error('User not authenticated')
  }

  return user.id
}

type Maybe<T> = T | null | undefined

type ItemRow = {
  id: string
  user_id: string
  item_type: Item['itemType']
  title: string
  description: Maybe<string>
  schedule_id: Maybe<string>
  due_at: Maybe<string>
  priority: Maybe<Item['priority']>
  estimate_minutes: Maybe<number>
  reminder_time: Maybe<string>
  snooze_until: Maybe<string>
  status: Item['status']
  completed_at: Maybe<string>
  metadata: Maybe<Record<string, JsonValue>>
  created_at: string
  updated_at: string
}

const mapItemRow = (row: ItemRow): Item => ({
  id: row.id,
  userId: row.user_id,
  itemType: row.item_type,
  title: row.title,
  description: row.description ?? undefined,
  scheduleId: row.schedule_id ?? undefined,
  dueAt: row.due_at ?? undefined,
  priority: row.priority ?? undefined,
  estimateMinutes: row.estimate_minutes ?? undefined,
  reminderTime: row.reminder_time ?? undefined,
  snoozeUntil: row.snooze_until ?? undefined,
  status: row.status,
  completedAt: row.completed_at ?? undefined,
  metadata: row.metadata ?? {},
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const mapItemRows = (rows: ItemRow[] | null): Item[] =>
  (rows ?? []).map((row) => mapItemRow(row))

const sanitizeSearchInput = (value: string): string =>
  value
    .replace(/[%_]/g, '') // prevent wildcard injection
    .replace(/[(),]/g, ' ') // prevent OR clause injection
    .trim()

/**
 * Item (task/reminder) database queries
 * Handles CRUD operations for tasks and reminders
 */
export const itemQueries = {
  /**
   * Get items for the authenticated user with optional filtering
   */
  async getItems(query?: ItemsQuery): Promise<Item[]> {
    const userId = await requireUserId()

    let q = supabase.from('items').select('*').eq('user_id', userId)

    if (query?.itemType) q = q.eq('item_type', query.itemType)
    if (query?.status) q = q.eq('status', query.status)
    if (query?.priority) q = q.eq('priority', query.priority)
    if (query?.dueBefore) q = q.lte('due_at', query.dueBefore)
    if (query?.dueAfter) q = q.gte('due_at', query.dueAfter)

    // Filter by recurring status
    if (query?.hasSchedule !== undefined) {
      if (query.hasSchedule) {
        q = q.not('schedule_id', 'is', null)
      } else {
        q = q.is('schedule_id', null)
      }
    }

    // Full-text search on title and description
    if (query?.search) {
      const sanitizedSearch = sanitizeSearchInput(query.search)
      if (sanitizedSearch.length > 0) {
        const pattern = `%${sanitizedSearch}%`
        q = q.or(`title.ilike.${pattern},description.ilike.${pattern}`)
      }
    }

    q = q.order('created_at', { ascending: false })

    // Pagination
    if (query?.limit) {
      const offset = query.offset || 0
      q = q.range(offset, offset + query.limit - 1)
    }

    const { data, error } = await q

    if (error) throw new Error(`Failed to fetch items: ${error.message}`)
    return mapItemRows(data as ItemRow[] | null)
  },

  /**
   * Get a single item by ID
   */
  async getItem(id: string): Promise<Item> {
    const userId = await requireUserId()
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw new Error(`Failed to fetch item: ${error.message}`)
    if (!data) throw new Error('Item not found')
    return mapItemRow(data as ItemRow)
  },

  /**
   * Create a new item (task or reminder)
   */
  async createItem(req: CreateItemRequest): Promise<Item> {
    const userId = await requireUserId()
    const payload: Record<string, JsonValue> = {
      item_type: req.itemType,
      title: req.title,
      priority: req.priority || 'medium',
      metadata: req.metadata || {},
      user_id: userId,
    }

    if (req.description !== undefined) payload.description = req.description
    if (req.scheduleId !== undefined) payload.schedule_id = req.scheduleId
    if (req.dueAt !== undefined) payload.due_at = req.dueAt
    if (req.estimateMinutes !== undefined)
      payload.estimate_minutes = req.estimateMinutes
    if (req.reminderTime !== undefined) payload.reminder_time = req.reminderTime

    const { data, error } = await supabase
      .from('items')
      .insert([payload])
      .select()
      .single()

    if (error) throw new Error(`Failed to create item: ${error.message}`)
    if (!data) throw new Error('Item creation failed')
    return mapItemRow(data as ItemRow)
  },

  /**
   * Update an existing item
   */
  async updateItem(id: string, req: UpdateItemRequest): Promise<Item> {
    const updatePayload: Record<string, JsonValue> = {}

    if (req.title !== undefined) updatePayload.title = req.title
    if (req.description !== undefined) updatePayload.description = req.description
    if (req.dueAt !== undefined) updatePayload.due_at = req.dueAt
    if (req.priority !== undefined) updatePayload.priority = req.priority
    if (req.estimateMinutes !== undefined)
      updatePayload.estimate_minutes = req.estimateMinutes
    if (req.reminderTime !== undefined)
      updatePayload.reminder_time = req.reminderTime
    if (req.snoozeUntil !== undefined) updatePayload.snooze_until = req.snoozeUntil
    if (req.status !== undefined) {
      updatePayload.status = req.status
      if (req.status === 'completed') {
        updatePayload.completed_at =
          updatePayload.completed_at ?? new Date().toISOString()
      } else {
        updatePayload.completed_at = null
      }
    }

    if (req.metadata !== undefined) updatePayload.metadata = req.metadata

    const { data, error } = await supabase
      .from('items')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update item: ${error.message}`)
    if (!data) throw new Error('Item not found')
    return mapItemRow(data as ItemRow)
  },

  /**
   * Delete an item
   */
  async deleteItem(id: string): Promise<void> {
    requireSupabase()
    const { error } = await supabase.from('items').delete().eq('id', id)

    if (error) throw new Error(`Failed to delete item: ${error.message}`)
  },

  /**
   * Mark an item as completed
   */
  async completeItem(id: string): Promise<Item> {
    requireSupabase()
    const { data, error } = await supabase
      .from('items')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to complete item: ${error.message}`)
    if (!data) throw new Error('Item not found')
    return mapItemRow(data as ItemRow)
  },

  /**
   * Snooze a reminder until a specific time
   */
  async snoozeReminder(id: string, until: string): Promise<Item> {
    requireSupabase()
    const { data, error } = await supabase
      .from('items')
      .update({ snooze_until: until })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to snooze reminder: ${error.message}`)
    if (!data) throw new Error('Reminder not found')
    return mapItemRow(data as ItemRow)
  },

  /**
   * Mark an item as pending (uncomplete)
   */
  async uncompleteItem(id: string): Promise<Item> {
    requireSupabase()
    const { data, error } = await supabase
      .from('items')
      .update({
        status: 'pending',
        completed_at: null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to uncomplete item: ${error.message}`)
    if (!data) throw new Error('Item not found')
    return mapItemRow(data as ItemRow)
  },
}
