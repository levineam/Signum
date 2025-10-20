/**
 * Entity CRUD operations for Content Intelligence system
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
 */
export async function upsertEntity(
  userId: string,
  type: Entity['type'],
  name: string
): Promise<Entity> {
  const supabase = getSupabase();

  // Check if entity already exists
  const { data: existing, error: fetchError } = await supabase
    .from('entities')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .eq('name', name)
    .single();

  if (!fetchError && existing) {
    // Entity exists - update last_seen
    const { data: updated, error: updateError } = await supabase
      .from('entities')
      .update({
        last_seen: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating entity:', updateError);
      throw updateError;
    }

    return updated;
  }

  // Entity doesn't exist - create new
  const { data: created, error: createError } = await supabase
    .from('entities')
    .insert({
      user_id: userId,
      type,
      name,
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString()
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating entity:', createError);
    throw createError;
  }

  return created;
}

/**
 * Increment the centrality (mention count) for an entity
 */
export async function incrementMentionCount(
  entityId: string,
  userId: string
): Promise<void> {
  const supabase = getSupabase();

  // First, get current centrality value
  const { data: entity, error: fetchError } = await supabase
    .from('entities')
    .select('centrality')
    .eq('id', entityId)
    .eq('user_id', userId)
    .single();

  if (fetchError) {
    console.error('Error fetching entity for increment:', fetchError);
    throw fetchError;
  }

  // Increment and update
  const { error: updateError } = await supabase
    .from('entities')
    .update({
      centrality: (entity.centrality || 0) + 1
    })
    .eq('id', entityId)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error incrementing mention count:', updateError);
    throw updateError;
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
  const supabase = getSupabase();

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
  const supabase = getSupabase();

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
  const supabase = getSupabase();

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
