/**
 * Task CRUD operations for Content Intelligence system
 * Story 1.1: Core NLP Infrastructure & Database Schema
 */

import { supabase } from '@/lib/supabase';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  status: 'pending' | 'completed' | 'cancelled';
  due_at?: string;
  remind_at?: string;
  rrule?: string;
  est_minutes?: number;
  priority?: number;
  source_entry_id?: string;
  source_para_anchor?: string;
  person_id?: string;
  project_id?: string;
  value_id?: string;
  metadata: Record<string, unknown>;
  snooze_count: number;
  created_at: string;
  completed_at?: string;
}

/**
 * Create a new task
 */
export async function createTask(
  userId: string,
  title: string,
  dueAt?: Date,
  metadata?: Record<string, unknown>
): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title,
      due_at: dueAt?.toISOString(),
      metadata: metadata || {}
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }

  return data;
}

/**
 * Get all tasks for a user, optionally filtered by status
 */
export async function getTasksByUser(
  userId: string,
  status?: 'pending' | 'completed' | 'cancelled'
): Promise<Task[]> {
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get tasks due today for a user
 */
export async function getTasksDueToday(userId: string): Promise<Task[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gte('due_at', today.toISOString())
    .lt('due_at', tomorrow.toISOString())
    .order('due_at', { ascending: true });

  if (error) {
    console.error('Error fetching tasks due today:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get overdue tasks for a user
 */
export async function getTasksOverdue(userId: string): Promise<Task[]> {
  const now = new Date();

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .lt('due_at', now.toISOString())
    .order('due_at', { ascending: true });

  if (error) {
    console.error('Error fetching overdue tasks:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get upcoming tasks (next N days)
 */
export async function getTasksUpcoming(
  userId: string,
  days: number
): Promise<Task[]> {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + days);

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .gte('due_at', now.toISOString())
    .lte('due_at', future.toISOString())
    .order('due_at', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming tasks:', error);
    throw error;
  }

  return data || [];
}

/**
 * Mark a task as complete
 */
export async function markTaskComplete(
  taskId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error marking task complete:', error);
    throw error;
  }
}

/**
 * Snooze a task to a new due date
 */
export async function snoozeTask(
  taskId: string,
  userId: string,
  newDueAt: Date
): Promise<void> {
  // Get current snooze count
  const { data: task, error: fetchError } = await supabase
    .from('tasks')
    .select('snooze_count')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single();

  if (fetchError) {
    console.error('Error fetching task for snooze:', fetchError);
    throw fetchError;
  }

  // Update due date and increment snooze count
  const { error: updateError } = await supabase
    .from('tasks')
    .update({
      due_at: newDueAt.toISOString(),
      snooze_count: (task.snooze_count || 0) + 1
    })
    .eq('id', taskId)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error snoozing task:', updateError);
    throw updateError;
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}
