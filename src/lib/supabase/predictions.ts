/**
 * Supabase CRUD operations for predictions feature.
 * Issue #231: Alpha Predictions
 */

import { supabase, hasPublicSupabase } from './singleton'
import {
  Prediction,
  PredictionPosition,
  PredictionRow,
  PredictionPositionRow,
  CreatePredictionRequest,
  TakePositionRequest,
  ResolvePredictionRequest,
  PositionType,
  PositionWithUser,
  isPositionType,
  predictionFromRow,
  positionFromRow,
} from '@/types/prediction'

// ============================================================================
// Prediction CRUD Operations
// ============================================================================

/**
 * Get all predictions, sorted by creation date (newest first).
 * Includes position counts and the current user's position if userId provided.
 */
export async function getPredictions(options?: {
  userId?: string
  includeResolved?: boolean
  limit?: number
  offset?: number
}): Promise<Prediction[]> {
  if (!hasPublicSupabase()) {
    console.warn('[Predictions] Supabase not available, returning empty array')
    return []
  }

  let query = supabase
    .from('predictions')
    .select('*')
    .order('created_at', { ascending: false })

  if (options?.includeResolved === false) {
    query = query.is('resolved_at', null)
  }

  if (options?.limit != null) {
    query = query.limit(options.limit)
  }

  if (options?.offset != null) {
    const rangeLimit = options.limit ?? 50
    query = query.range(options.offset, options.offset + rangeLimit - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching predictions:', error)
    throw error
  }

  const predictions = (data || []).map((row: PredictionRow) => predictionFromRow(row))

  // Fetch position counts for all predictions
  if (predictions.length > 0) {
    const predictionIds = predictions.map(p => p.id)
    const counts = await getPositionCounts(predictionIds)

    predictions.forEach(prediction => {
      const count = counts.get(prediction.id)
      if (count) {
        prediction.agreeCount = count.agree
        prediction.disagreeCount = count.disagree
      } else {
        prediction.agreeCount = 0
        prediction.disagreeCount = 0
      }
    })

    // Fetch current user's positions if userId provided
    if (options?.userId) {
      const userPositions = await getUserPositionsForPredictions(options.userId, predictionIds)
      predictions.forEach(prediction => {
        prediction.userPosition = userPositions.get(prediction.id) || null
      })
    }
  }

  return predictions
}

/**
 * Get a single prediction by ID with position counts.
 */
export async function getPredictionById(
  predictionId: string,
  userId?: string
): Promise<Prediction | null> {
  if (!hasPublicSupabase()) {
    return null
  }

  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('id', predictionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching prediction:', error)
    throw error
  }

  const prediction = predictionFromRow(data as PredictionRow)

  // Get position counts
  const counts = await getPositionCounts([predictionId])
  const count = counts.get(predictionId)
  prediction.agreeCount = count?.agree || 0
  prediction.disagreeCount = count?.disagree || 0

  // Get user's position if userId provided
  if (userId) {
    const userPositions = await getUserPositionsForPredictions(userId, [predictionId])
    prediction.userPosition = userPositions.get(predictionId) || null
  }

  return prediction
}

/**
 * Create a new prediction.
 */
export async function createPrediction(
  request: CreatePredictionRequest,
  userId: string
): Promise<Prediction> {
  if (!hasPublicSupabase()) {
    throw new Error('Supabase not available')
  }

  const { data, error } = await supabase
    .from('predictions')
    .insert({
      user_id: userId,
      statement: request.statement,
      settlement_date: request.settlementDate,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating prediction:', error)
    throw error
  }

  const prediction = predictionFromRow(data as PredictionRow)
  prediction.agreeCount = 0
  prediction.disagreeCount = 0
  prediction.userPosition = null

  return prediction
}

/**
 * Resolve a prediction and award points.
 * Only the prediction creator can resolve.
 */
export async function resolvePrediction(
  request: ResolvePredictionRequest,
  userId: string
): Promise<Prediction> {
  if (!hasPublicSupabase()) {
    throw new Error('Supabase not available')
  }

  // First verify the user owns this prediction
  const { data: existing, error: fetchError } = await supabase
    .from('predictions')
    .select('*')
    .eq('id', request.predictionId)
    .eq('user_id', userId)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      throw new Error('Prediction not found or you do not have permission to resolve it')
    }
    throw fetchError
  }

  if (existing.resolved_at) {
    throw new Error('Prediction has already been resolved')
  }

  const { data, error } = await supabase.rpc('resolve_prediction_and_award', {
    prediction_id_input: request.predictionId,
    resolution_input: request.resolution,
  })

  if (error) {
    console.error('Error resolving prediction:', error)
    throw error
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    throw new Error('Prediction could not be resolved')
  }

  const prediction = predictionFromRow(row as PredictionRow)
  const counts = await getPositionCounts([prediction.id])
  const count = counts.get(prediction.id)
  prediction.agreeCount = count?.agree ?? 0
  prediction.disagreeCount = count?.disagree ?? 0

  return prediction
}

/**
 * Delete a prediction (only owner can delete).
 */
export async function deletePrediction(
  predictionId: string,
  userId: string
): Promise<void> {
  if (!hasPublicSupabase()) {
    throw new Error('Supabase not available')
  }

  const { error } = await supabase
    .from('predictions')
    .delete()
    .eq('id', predictionId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting prediction:', error)
    throw error
  }
}

// ============================================================================
// Position CRUD Operations
// ============================================================================

/**
 * Take or update a position on a prediction.
 * User can only have one position per prediction.
 */
export async function takePosition(
  request: TakePositionRequest
): Promise<PredictionPosition> {
  if (!hasPublicSupabase()) {
    throw new Error('Supabase not available')
  }

  // First check if prediction is resolved (fast UX path)
  const prediction = await getPredictionById(request.predictionId)
  if (!prediction) {
    throw new Error('Prediction not found')
  }
  if (prediction.resolvedAt) {
    throw new Error('Cannot take position on resolved prediction')
  }

  const { data, error } = await supabase.rpc('take_prediction_position', {
    prediction_id_input: request.predictionId,
    position_input: request.position,
  })

  if (error) {
    console.error('Error taking position:', error)
    throw error
  }

  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    throw new Error('Position could not be saved')
  }

  return positionFromRow(row as PredictionPositionRow)
}

/**
 * Get all positions for a prediction.
 */
export async function getPositionsForPrediction(
  predictionId: string
): Promise<PredictionPosition[]> {
  if (!hasPublicSupabase()) {
    return []
  }

  const { data, error } = await supabase
    .from('prediction_positions')
    .select('*')
    .eq('prediction_id', predictionId)

  if (error) {
    console.error('Error fetching positions:', error)
    throw error
  }

  return (data || []).map((row: PredictionPositionRow) => positionFromRow(row))
}

/**
 * Get all positions for a user.
 */
export async function getUserPositions(
  userId: string
): Promise<PredictionPosition[]> {
  if (!hasPublicSupabase()) {
    return []
  }

  const { data, error } = await supabase
    .from('prediction_positions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user positions:', error)
    throw error
  }

  return (data || []).map((row: PredictionPositionRow) => positionFromRow(row))
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get position counts for multiple predictions.
 * Returns a map of prediction_id -> { agree: number, disagree: number }
 */
async function getPositionCounts(
  predictionIds: string[]
): Promise<Map<string, { agree: number; disagree: number }>> {
  const counts = new Map<string, { agree: number; disagree: number }>()

  if (!hasPublicSupabase() || predictionIds.length === 0) {
    return counts
  }

  // Initialize counts for all prediction IDs
  predictionIds.forEach(id => {
    counts.set(id, { agree: 0, disagree: 0 })
  })

  const { data, error } = await supabase.rpc('get_prediction_position_counts', {
    prediction_ids: predictionIds,
  })

  if (!error && data) {
    ;(data as Array<{ prediction_id: string; agree_count: number; disagree_count: number }>).forEach((row) => {
      counts.set(row.prediction_id, {
        agree: row.agree_count ?? 0,
        disagree: row.disagree_count ?? 0,
      })
    })
    return counts
  }

  if (error) {
    console.error('Error fetching position counts:', error)
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from('prediction_positions')
    .select('prediction_id, position')
    .in('prediction_id', predictionIds)

  if (fallbackError) {
    console.error('Error fetching position counts fallback:', fallbackError)
    return counts
  }

  // Count positions
  ;(fallbackData || []).forEach((row: { prediction_id: string; position: string }) => {
    const current = counts.get(row.prediction_id)
    if (current) {
      if (row.position === 'agree') {
        current.agree++
      } else if (row.position === 'disagree') {
        current.disagree++
      }
    }
  })

  return counts
}

/**
 * Get user's positions for multiple predictions.
 * Returns a map of prediction_id -> position
 */
async function getUserPositionsForPredictions(
  userId: string,
  predictionIds: string[]
): Promise<Map<string, PositionType>> {
  const positions = new Map<string, PositionType>()

  if (!hasPublicSupabase() || predictionIds.length === 0) {
    return positions
  }

  const { data, error } = await supabase
    .from('prediction_positions')
    .select('prediction_id, position')
    .eq('user_id', userId)
    .in('prediction_id', predictionIds)

  if (error) {
    console.error('Error fetching user positions:', error)
    return positions
  }

  ;(data || []).forEach((row: { prediction_id: string; position: string }) => {
    if (isPositionType(row.position)) {
      positions.set(row.prediction_id, row.position)
    }
  })

  return positions
}

// ============================================================================
// Position Display with User Info
// ============================================================================

/**
 * Get all positions for a prediction with user email addresses.
 * Uses an RPC function to join with auth.users (which is in a separate schema).
 */
export async function getPositionsWithUsers(
  predictionId: string
): Promise<PositionWithUser[]> {
  if (!hasPublicSupabase()) {
    return []
  }

  const { data, error } = await supabase.rpc('get_positions_with_users', {
    prediction_id_input: predictionId,
  })

  if (error) {
    console.error('Error fetching positions with users:', error)
    return []
  }

  return (data || []).map(
    (row: {
      id: string
      prediction_id: string
      user_id: string
      position: string
      email: string
      created_at: string
    }): PositionWithUser => ({
      id: row.id,
      predictionId: row.prediction_id,
      userId: row.user_id,
      position: isPositionType(row.position) ? row.position : 'agree',
      email: row.email,
      createdAt: row.created_at,
    })
  )
}

