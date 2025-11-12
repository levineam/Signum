import { createClient } from '@/lib/supabase/client'
import {
  Schedule,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  JsonValue,
} from '@/types/temporal'

const supabase = createClient()

/**
 * Schedule database queries
 * Handles CRUD operations for RFC 5545 recurrence rules
 */
export const scheduleQueries = {
  /**
   * Get all schedules for the authenticated user
   */
  async getSchedules(): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch schedules: ${error.message}`)
    return (data as Schedule[] | null) ?? []
  },

  /**
   * Get a single schedule by ID
   */
  async getSchedule(id: string): Promise<Schedule> {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(`Failed to fetch schedule: ${error.message}`)
    if (!data) throw new Error('Schedule not found')
    return data as Schedule
  },

  /**
   * Create a new schedule with recurrence rule
   */
  async createSchedule(req: CreateScheduleRequest): Promise<Schedule> {
    const payload: Record<string, JsonValue> = {
      rrule: req.rrule,
      timezone: req.timezone,
      exception_dates: req.exceptionDates || [],
      recurrence_dates: req.recurrenceDates || [],
    }

    const { data, error } = await supabase
      .from('schedules')
      .insert([payload])
      .select()
      .single()

    if (error) throw new Error(`Failed to create schedule: ${error.message}`)
    if (!data) throw new Error('Schedule creation failed')
    return data as Schedule
  },

  /**
   * Update an existing schedule
   */
  async updateSchedule(
    id: string,
    req: UpdateScheduleRequest
  ): Promise<Schedule> {
    const updatePayload: Record<string, JsonValue> = {}

    if (req.rrule !== undefined) updatePayload.rrule = req.rrule
    if (req.timezone !== undefined) updatePayload.timezone = req.timezone
    if (req.exceptionDates !== undefined)
      updatePayload.exception_dates = req.exceptionDates
    if (req.recurrenceDates !== undefined)
      updatePayload.recurrence_dates = req.recurrenceDates

    const { data, error } = await supabase
      .from('schedules')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update schedule: ${error.message}`)
    if (!data) throw new Error('Schedule not found')
    return data as Schedule
  },

  /**
   * Delete a schedule
   * Note: Cascading delete will set schedule_id to NULL on related items
   */
  async deleteSchedule(id: string): Promise<void> {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Failed to delete schedule: ${error.message}`)
  },
}
