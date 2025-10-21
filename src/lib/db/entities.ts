/**
 * Entity CRUD operations for Content Intelligence system
 * Story 1.1: Core NLP Infrastructure & Database Schema
 */

import { supabase } from '@/lib/supabase';

export interface Entity {
  id: string;
  user_id: string;
  type: 'person' | 'project' | 'value' | 'domain' | 'note';
  name: string;
  first_seen: string;
  last_seen: string;
  sentiment_avg: number;
  centrality: number;
}

/**
 * Upsert an entity (create or update last_seen timestamp)
 * Used when an entity is mentioned in a paragraph
 * Uses upsert with unique constraint to prevent duplicate creation
 */
export async function upsertEntity(
  userId: string,
  type: Entity['type'],
  name: string
): Promise<Entity> {
  const now = new Date().toISOString();

  // Use upsert with onConflict to handle concurrent requests atomically
  // The unique constraint on (user_id, type, name) prevents duplicates
  const { data: upserted, error: upsertError } = await supabase
    .from('entities')
    .upsert({
      user_id: userId,
      type,
      name,
      first_seen: now,
      last_seen: now
    }, {
      onConflict: 'user_id,type,name',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (upsertError) {
    console.error('Error upserting entity:', upsertError);
    throw upsertError;
  }

  return upserted;
}

/**
 * Increment the centrality (mention count) for an entity atomically
 * Uses RPC to prevent race conditions with concurrent updates
 * The function uses auth.uid() internally for security
 */
export async function incrementMentionCount(
  entityId: string
): Promise<void> {

  // Use RPC for atomic increment to avoid race conditions
  const { error } = await supabase.rpc('increment_entity_centrality', {
    p_entity_id: entityId
  });

  if (error) {
    console.error('Error incrementing mention count:', error);
    throw error;
  }
}

/**
 * Update sentiment average for an entity
 * Used in sentiment analysis (Story 1.6)
 */
export async function updateSentiment(
  entityId: string,
  userId: string,
  sentiment: number
): Promise<void> {

  const { error } = await supabase
    .from('entities')
    .update({
      sentiment_avg: sentiment
    })
    .eq('id', entityId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating sentiment:', error);
    throw error;
  }
}

/**
 * Get entities by type for a user
 */
export async function getEntitiesByType(
  userId: string,
  type: Entity['type']
): Promise<Entity[]> {

  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .order('last_seen', { ascending: false });

  if (error) {
    console.error('Error fetching entities by type:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get top entities by centrality (most frequently mentioned)
 */
export async function getTopEntitiesByCentrality(
  userId: string,
  type: Entity['type'],
  limit: number
): Promise<Entity[]> {

  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .order('centrality', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching top entities:', error);
    throw error;
  }

  return data || [];
}
