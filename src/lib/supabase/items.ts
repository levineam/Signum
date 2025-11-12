import { createClient } from '@/lib/supabase/client'
import {
  Item,
  CreateItemRequest,
  UpdateItemRequest,
  ItemsQuery,
  JsonValue,
} from '@/types/temporal'

const supabase = createClient()

/**
 * Item (task/reminder) database queries
 * Handles CRUD operations for tasks and reminders
 */
export const itemQueries = {
  /**
   * Get items for the authenticated user with optional filtering
   */
  async getItems(query?: ItemsQuery): Promise<Item[]> {
    let q = supabase.from('items').select('*')

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
      q = q.or(
        `title.ilike.%${query.search}%,description.ilike.%${query.search}%`
      )
    }

    q = q.order('created_at', { ascending: false })

    // Pagination
    if (query?.limit) {
      const offset = query.offset || 0
      q = q.range(offset, offset + query.limit - 1)
    }

    const { data, error } = await q

    if (error) throw new Error(`Failed to fetch items: ${error.message}`)
    return (data as Item[] | null) ?? []
  },

  /**
   * Get a single item by ID
   */
  async getItem(id: string): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(`Failed to fetch item: ${error.message}`)
    if (!data) throw new Error('Item not found')
    return data as Item
  },

  /**
   * Create a new item (task or reminder)
   */
  async createItem(req: CreateItemRequest): Promise<Item> {
    const payload: Record<string, JsonValue> = {
      item_type: req.itemType,
      title: req.title,
      priority: req.priority || 'medium',
      metadata: req.metadata || {},
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
    return data as Item
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
    if (req.status !== undefined) updatePayload.status = req.status
    if (req.metadata !== undefined) updatePayload.metadata = req.metadata

    // Auto-set completed_at when status changes to completed
    if (req.status === 'completed' && !updatePayload.completed_at) {
      updatePayload.completed_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('items')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update item: ${error.message}`)
    if (!data) throw new Error('Item not found')
    return data as Item
  },

  /**
   * Delete an item
   */
  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase.from('items').delete().eq('id', id)

    if (error) throw new Error(`Failed to delete item: ${error.message}`)
  },

  /**
   * Mark an item as completed
   */
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

    if (error) throw new Error(`Failed to complete item: ${error.message}`)
    if (!data) throw new Error('Item not found')
    return data as Item
  },

  /**
   * Snooze a reminder until a specific time
   */
  async snoozeReminder(id: string, until: string): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .update({ snooze_until: until })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to snooze reminder: ${error.message}`)
    if (!data) throw new Error('Reminder not found')
    return data as Item
  },
}
