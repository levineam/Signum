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
  PointsResult,
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

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
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

  // Get all positions to calculate points
  const positions = await getPositionsForPrediction(request.predictionId)

  // Calculate points for each position
  const pointsResult = calculatePoints(positions, request.resolution)

  // Update the prediction with resolution
  const { data, error } = await supabase
    .from('predictions')
    .update({
      resolution: request.resolution,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', request.predictionId)
    .select()
    .single()

  if (error) {
    console.error('Error resolving prediction:', error)
    throw error
  }

  // Award points to all positions
  await awardPointsToPositions(positions, request.resolution, pointsResult)

  const prediction = predictionFromRow(data as PredictionRow)
  prediction.agreeCount = pointsResult.winningSide === 'agree'
    ? positions.filter(p => p.position === 'agree').length
    : positions.filter(p => p.position === 'disagree').length
  prediction.disagreeCount = pointsResult.losingSide === 'agree'
    ? positions.filter(p => p.position === 'agree').length
    : positions.filter(p => p.position === 'disagree').length

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
  request: TakePositionRequest,
  userId: string
): Promise<PredictionPosition> {
  if (!hasPublicSupabase()) {
    throw new Error('Supabase not available')
  }

  // First check if prediction is resolved
  const prediction = await getPredictionById(request.predictionId)
  if (!prediction) {
    throw new Error('Prediction not found')
  }
  if (prediction.resolvedAt) {
    throw new Error('Cannot take position on resolved prediction')
  }

  // Upsert the position (allows changing position before resolution)
  const { data, error } = await supabase
    .from('prediction_positions')
    .upsert(
      {
        prediction_id: request.predictionId,
        user_id: userId,
        position: request.position,
      },
      {
        onConflict: 'prediction_id,user_id',
      }
    )
    .select()
    .single()

  if (error) {
    console.error('Error taking position:', error)
    throw error
  }

  return positionFromRow(data as PredictionPositionRow)
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

  const { data, error } = await supabase
    .from('prediction_positions')
    .select('prediction_id, position')
    .in('prediction_id', predictionIds)

  if (error) {
    console.error('Error fetching position counts:', error)
    return counts
  }

  // Initialize counts for all prediction IDs
  predictionIds.forEach(id => {
    counts.set(id, { agree: 0, disagree: 0 })
  })

  // Count positions
  ;(data || []).forEach((row: { prediction_id: string; position: PositionType }) => {
    const current = counts.get(row.prediction_id)
    if (current) {
      if (row.position === 'agree') {
        current.agree++
      } else {
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

  ;(data || []).forEach((row: { prediction_id: string; position: PositionType }) => {
    positions.set(row.prediction_id, row.position)
  })

  return positions
}

// ============================================================================
// Points Calculation
// ============================================================================

/**
 * Calculate points for a resolved prediction.
 * - Win as majority: +1 point
 * - Win as minority: +floor(majority/minority) points
 * - Lose: 0 points
 */
export function calculatePoints(
  positions: PredictionPosition[],
  resolution: boolean
): PointsResult {
  const agreePositions = positions.filter(p => p.position === 'agree')
  const disagreePositions = positions.filter(p => p.position === 'disagree')

  const winningSide: PositionType = resolution ? 'agree' : 'disagree'
  const losingSide: PositionType = resolution ? 'disagree' : 'agree'

  const winnerCount = winningSide === 'agree' ? agreePositions.length : disagreePositions.length
  const loserCount = losingSide === 'agree' ? agreePositions.length : disagreePositions.length

  const majorityCount = Math.max(winnerCount, loserCount)
  const minorityCount = Math.min(winnerCount, loserCount)

  // Calculate points
  const majorityPoints = 1
  const minorityPoints = minorityCount > 0
    ? Math.floor(majorityCount / minorityCount)
    : majorityCount > 0 ? majorityCount : 1

  return {
    winningSide,
    losingSide,
    majorityCount,
    minorityCount,
    majorityPoints,
    minorityPoints,
  }
}

/**
 * Award points to all positions after resolution.
 */
async function awardPointsToPositions(
  positions: PredictionPosition[],
  resolution: boolean,
  pointsResult: PointsResult
): Promise<void> {
  if (!hasPublicSupabase() || positions.length === 0) {
    return
  }

  const winningSide = resolution ? 'agree' : 'disagree'
  const winnerCount = positions.filter(p => p.position === winningSide).length
  const loserCount = positions.filter(p => p.position !== winningSide).length

  // Determine if winners are majority or minority
  const winnersAreMajority = winnerCount >= loserCount
  const winnerPoints = winnersAreMajority ? pointsResult.majorityPoints : pointsResult.minorityPoints

  // Update all positions with their points
  for (const position of positions) {
    const isWinner = position.position === winningSide
    const points = isWinner ? winnerPoints : 0

    await supabase
      .from('prediction_positions')
      .update({ points_awarded: points })
      .eq('id', position.id)
  }
}
