/**
 * Supabase CRUD operations for helper_usage and user_preferences tables.
 * Story 1.8.1: Helper Database Infrastructure
 */

import { supabase } from '@/lib/supabase'
import {
  HelperUsage,
  HelperUsageResponse,
  CreateHelperUsageRequest,
  UserPreferences,
  UserPreferencesResponse,
  UpdateUserPreferencesRequest,
  HelperType,
  HelperUsageMetadata,
  DismissedHelpers
} from '@/types/helper'

// ============================================================================
// Helper Usage CRUD Operations
// ============================================================================

/**
 * Create a new helper usage record.
 *
 * @param request - Helper usage data to insert
 * @param userId - Authenticated user ID
 * @returns Response with created helper usage or error
 */
export async function createHelperUsage(
  request: CreateHelperUsageRequest,
  userId: string
): Promise<HelperUsageResponse> {
  try {
    const { data, error } = await supabase
      .from('helper_usage')
      .insert({
        user_id: userId,
        entry_id: request.entryId,
        helper_type: request.helperType,
        selected_items: request.selectedItems,
        metadata: request.metadata
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating helper usage:', error)
      return { success: false, error: error.message }
    }

    return { success: true, usage: mapDatabaseHelperUsageToHelperUsage(data) }
  } catch (error) {
    console.error('Unexpected error creating helper usage:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

/**
 * Get all helper usage records for a specific journal entry.
 *
 * @param entryId - UUID of the journal entry
 * @param userId - Authenticated user ID (for RLS)
 * @returns Array of helper usage records (newest first)
 */
export async function getHelperUsageForEntry(
  entryId: string,
  userId: string
): Promise<HelperUsage[]> {
  try {
    const { data, error } = await supabase
      .from('helper_usage')
      .select('*')
      .eq('entry_id', entryId)
      .eq('user_id', userId)
      .order('inserted_at', { ascending: false })

    if (error) {
      console.error('Error fetching helper usage for entry:', error)
      return []
    }

    return (data || []).map(mapDatabaseHelperUsageToHelperUsage)
  } catch (error) {
    console.error('Unexpected error fetching helper usage:', error)
    return []
  }
}

/**
 * Get helper usage history for a user across all entries.
 *
 * @param userId - Authenticated user ID
 * @param limit - Maximum number of records to return (default: 100)
 * @returns Array of helper usage records (newest first)
 */
export async function getHelperUsageByUser(
  userId: string,
  limit: number = 100
): Promise<HelperUsage[]> {
  try {
    const { data, error } = await supabase
      .from('helper_usage')
      .select('*')
      .eq('user_id', userId)
      .order('inserted_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching helper usage by user:', error)
      return []
    }

    return (data || []).map(mapDatabaseHelperUsageToHelperUsage)
  } catch (error) {
    console.error('Unexpected error fetching user helper usage:', error)
    return []
  }
}

// ============================================================================
// User Preferences CRUD Operations
// ============================================================================

/**
 * Get user preferences (including dismissed helpers state).
 *
 * @param userId - Authenticated user ID
 * @returns User preferences or null if not found
 */
export async function getUserPreferences(
  userId: string
): Promise<UserPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - user has no preferences yet
        return null
      }
      console.error('Error fetching user preferences:', error)
      return null
    }

    return mapDatabaseUserPreferencesToUserPreferences(data)
  } catch (error) {
    console.error('Unexpected error fetching user preferences:', error)
    return null
  }
}

/**
 * Update user preferences (e.g., dismiss a helper).
 * Creates preferences record if it doesn't exist (upsert).
 *
 * @param request - Preferences to update
 * @param userId - Authenticated user ID
 * @returns Response with updated preferences or error
 */
export async function updateUserPreferences(
  request: UpdateUserPreferencesRequest,
  userId: string
): Promise<UserPreferencesResponse> {
  try {
    // Fetch current preferences to merge with updates
    const current = await getUserPreferences(userId)

    const mergedDismissedHelpers = {
      ...(current?.dismissedHelpers || {}),
      ...request.dismissedHelpers
    }

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        dismissed_helpers: mergedDismissedHelpers
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating user preferences:', error)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      preferences: mapDatabaseUserPreferencesToUserPreferences(data)
    }
  } catch (error) {
    console.error('Unexpected error updating user preferences:', error)
    return { success: false, error: 'Unknown error occurred' }
  }
}

// ============================================================================
// Helper Functions: Database → App Type Mapping
// ============================================================================

/**
 * Maps database column names (snake_case) to app-friendly camelCase.
 */
function mapDatabaseHelperUsageToHelperUsage(dbUsage: {
  id: string
  user_id: string
  entry_id: string
  helper_type: string
  selected_items: string[]
  metadata: Record<string, unknown>
  inserted_at: string
}): HelperUsage {
  return {
    id: dbUsage.id,
    userId: dbUsage.user_id,
    entryId: dbUsage.entry_id,
    helperType: dbUsage.helper_type as HelperType,
    selectedItems: dbUsage.selected_items,
    metadata: dbUsage.metadata as unknown as HelperUsageMetadata,
    insertedAt: dbUsage.inserted_at
  }
}

/**
 * Maps database user preferences to app type.
 */
function mapDatabaseUserPreferencesToUserPreferences(dbPrefs: {
  user_id: string
  dismissed_helpers: Record<string, unknown>
  updated_at: string
}): UserPreferences {
  return {
    userId: dbPrefs.user_id,
    dismissedHelpers: dbPrefs.dismissed_helpers as unknown as DismissedHelpers,
    updatedAt: dbPrefs.updated_at
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a user has dismissed a specific helper type.
 *
 * @param userId - Authenticated user ID
 * @param helperType - Helper type to check
 * @returns True if helper is dismissed, false otherwise
 */
export async function isHelperDismissed(
  userId: string,
  helperType: HelperType
): Promise<boolean> {
  const preferences = await getUserPreferences(userId)

  if (!preferences) {
    return false
  }

  return preferences.dismissedHelpers[helperType] === true
}

/**
 * Dismiss a helper for a user (add to dismissed list).
 *
 * @param userId - Authenticated user ID
 * @param helperType - Helper type to dismiss
 * @returns Response with updated preferences or error
 */
export async function dismissHelper(
  userId: string,
  helperType: HelperType
): Promise<UserPreferencesResponse> {
  return updateUserPreferences(
    {
      dismissedHelpers: { [helperType]: true }
    },
    userId
  )
}

/**
 * Re-enable a dismissed helper for a user.
 *
 * @param userId - Authenticated user ID
 * @param helperType - Helper type to re-enable
 * @returns Response with updated preferences or error
 */
export async function enableHelper(
  userId: string,
  helperType: HelperType
): Promise<UserPreferencesResponse> {
  return updateUserPreferences(
    {
      dismissedHelpers: { [helperType]: false }
    },
    userId
  )
}
