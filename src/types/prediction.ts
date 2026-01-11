/**
 * Prediction feature types for Alpha Predictions (Issue #231)
 */

export const POSITION_TYPES = ['agree', 'disagree'] as const
export type PositionType = (typeof POSITION_TYPES)[number]

export function isPositionType(value: string): value is PositionType {
  return POSITION_TYPES.includes(value as PositionType)
}

function normalizePositionType(value: string): PositionType {
  if (isPositionType(value)) {
    return value
  }
  console.warn(`[predictions] Unexpected position value: ${value}`)
  return 'agree'
}

/**
 * A prediction created by a user with a statement and settlement date.
 * Other users can agree/disagree, and the creator resolves it.
 */
export interface Prediction {
  id: string
  userId: string
  statement: string
  settlementDate: string // ISO timestamp
  resolvedAt: string | null
  resolution: boolean | null // null = unresolved, true/false = outcome
  createdAt: string
  updatedAt: string
  // Computed fields from joins/aggregations
  agreeCount?: number
  disagreeCount?: number
  userPosition?: PositionType | null // Current user's position, if any
  creatorEmail?: string // For display purposes
}

/**
 * A user's position (agree/disagree) on a prediction.
 * One position per user per prediction.
 */
export interface PredictionPosition {
  id: string
  predictionId: string
  userId: string
  position: PositionType
  pointsAwarded: number | null // null until prediction is resolved
  createdAt: string
  updatedAt: string
}

/**
 * Request payload for creating a new prediction
 */
export interface CreatePredictionRequest {
  statement: string
  settlementDate: string // ISO timestamp
}

/**
 * Request payload for taking a position on a prediction
 */
export interface TakePositionRequest {
  predictionId: string
  position: PositionType
}

/**
 * Request payload for resolving a prediction
 */
export interface ResolvePredictionRequest {
  predictionId: string
  resolution: boolean
}

/**
 * Computed odds based on agree/disagree counts
 */
export interface PredictionOdds {
  agreeCount: number
  disagreeCount: number
  agreePercentage: number
  disagreePercentage: number
}

/**
 * Database row type for predictions table (snake_case)
 */
export interface PredictionRow {
  id: string
  user_id: string
  statement: string
  settlement_date: string
  resolved_at: string | null
  resolution: boolean | null
  created_at: string
  updated_at: string
}

/**
 * Database row type for prediction_positions table (snake_case)
 */
export interface PredictionPositionRow {
  id: string
  prediction_id: string
  user_id: string
  position: string
  points_awarded: number | null
  created_at: string
  updated_at: string
}

/**
 * Convert database row to Prediction interface
 */
export function predictionFromRow(row: PredictionRow): Prediction {
  return {
    id: row.id,
    userId: row.user_id,
    statement: row.statement,
    settlementDate: row.settlement_date,
    resolvedAt: row.resolved_at,
    resolution: row.resolution,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Convert database row to PredictionPosition interface
 */
export function positionFromRow(row: PredictionPositionRow): PredictionPosition {
  return {
    id: row.id,
    predictionId: row.prediction_id,
    userId: row.user_id,
    position: normalizePositionType(row.position),
    pointsAwarded: row.points_awarded,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
