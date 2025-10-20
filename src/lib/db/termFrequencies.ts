/**
 * Term Frequency CRUD operations for Content Intelligence system
 * Story 1.1: Core NLP Infrastructure & Database Schema
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialize Supabase client to avoid build-time env var errors
let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables');
    }
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabaseInstance;
}

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
  userId: string,
  term: string,
  amount: number = 1
): Promise<void> {
  const supabase = getSupabase();
  const { data: existing, error: fetchError } = await supabase
    .from('term_frequencies')
    .select('*')
    .eq('user_id', userId)
    .eq('term', term)
    .single();

  if (!fetchError && existing) {
    const { error: updateError } = await supabase
      .from('term_frequencies')
      .update({
        count_alltime: existing.count_alltime + amount,
        count_this_week: existing.count_this_week + amount,
        last_updated: new Date().toISOString()
      })
      .eq('id', existing.id);
    if (updateError) {
      console.error('Error updating term frequency:', updateError);
      throw updateError;
    }
  } else {
    const { error: insertError } = await supabase
      .from('term_frequencies')
      .insert({
        user_id: userId,
        term,
        count_alltime: amount,
        count_this_week: amount,
        count_last_week: 0
      });
    if (insertError) {
      console.error('Error creating term frequency:', insertError);
      throw insertError;
    }
  }
}

export async function getTopTerms(
  userId: string,
  limit: number
): Promise<TermFrequency[]> {
  const supabase = getSupabase();
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
  const supabase = getSupabase();
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
  return (data || [])
    .map(term => ({
      ...term,
      delta: term.count_this_week - term.count_last_week
    }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, limit);
}

export async function weeklyRollover(userId: string): Promise<void> {
  const supabase = getSupabase();
  const { data: terms, error: fetchError } = await supabase
    .from('term_frequencies')
    .select('id, count_this_week')
    .eq('user_id', userId);
  if (fetchError) {
    console.error('Error fetching terms for rollover:', fetchError);
    throw fetchError;
  }
  if (terms && terms.length > 0) {
    const updates = terms.map(term => ({
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
