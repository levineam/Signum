/**
 * Term Frequency CRUD operations for Content Intelligence system
 * Story 1.1: Core NLP Infrastructure & Database Schema
 */

import { supabase } from '@/lib/supabase';

export interface TermFrequency {
  id: string;
  user_id: string;
  term: string;
  count_alltime: number;
  count_this_week: number;
  count_last_week: number;
  last_updated: string;
  created_at: string;
}

export async function incrementTermCount(
  term: string,
  amount: number = 1
): Promise<void> {
  // Use RPC for atomic increment that handles both insert and update
  // The function uses auth.uid() internally for security
  const { error } = await supabase.rpc('increment_term_frequency', {
    p_term: term,
    p_amount: amount
  });

  if (error) {
    console.error('Error incrementing term frequency:', error);
    throw error;
  }
}

export async function getTopTerms(
  userId: string,
  limit: number
): Promise<TermFrequency[]> {
  const { data, error } = await supabase
    .from('term_frequencies')
    .select('*')
    .eq('user_id', userId)
    .order('count_alltime', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('Error fetching top terms:', error);
    throw error;
  }
  return data || [];
}

export async function getWeeklyDelta(
  userId: string,
  limit: number
): Promise<TermFrequency[]> {
  const { data, error } = await supabase
    .from('term_frequencies')
    .select('*')
    .eq('user_id', userId)
    .order('count_this_week', { ascending: false })
    .limit(limit);
  if (error) {
    console.error('Error fetching weekly delta:', error);
    throw error;
  }
  type TermWithDelta = TermFrequency & { delta?: number };

  return (data || [])
    .map((term: TermFrequency): TermWithDelta => ({
      ...term,
      delta: term.count_this_week - term.count_last_week
    }))
    .sort(
      (a: TermWithDelta, b: TermWithDelta) =>
        (b.delta ?? b.count_this_week - b.count_last_week) -
        (a.delta ?? a.count_this_week - a.count_last_week)
    )
    .slice(0, limit);
}

export async function weeklyRollover(userId: string): Promise<void> {
  const { data: terms, error: fetchError } = await supabase
    .from('term_frequencies')
    .select('id, count_this_week')
    .eq('user_id', userId);
  if (fetchError) {
    console.error('Error fetching terms for rollover:', fetchError);
    throw fetchError;
  }
  if (terms && terms.length > 0) {
    const updates = terms.map((term: { id: string; count_this_week: number }) => ({
      id: term.id,
      count_last_week: term.count_this_week,
      count_this_week: 0
    }));
    const { error: updateError } = await supabase
      .from('term_frequencies')
      .upsert(updates);
    if (updateError) {
      console.error('Error performing weekly rollover:', updateError);
      throw updateError;
    }
  }
}
