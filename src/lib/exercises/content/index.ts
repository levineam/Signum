/**
 * Exercise Content Index
 * Exports all exercise definitions for easy import
 */

export { VALUES_EXERCISE, VALUES_OPTIONS } from './valuesExercise'
export { STRENGTHS_EXERCISE, STRENGTHS_OPTIONS } from './strengthsExercise'
export { IMPACT_EXERCISE, BENEFICIARY_OPTIONS } from './impactExercise'

import { ExerciseDefinition, ExerciseType } from '../types'
import { VALUES_EXERCISE } from './valuesExercise'
import { STRENGTHS_EXERCISE } from './strengthsExercise'
import { IMPACT_EXERCISE } from './impactExercise'

/**
 * Map of exercise type to definition
 */
export const EXERCISE_DEFINITIONS: Record<ExerciseType, ExerciseDefinition> = {
    values: VALUES_EXERCISE,
    strengths: STRENGTHS_EXERCISE,
    impact: IMPACT_EXERCISE,
    purpose: VALUES_EXERCISE // Purpose uses synthesis from other exercises, placeholder for now
}

/**
 * Get exercise definition by type
 */
export function getExerciseDefinition(type: ExerciseType): ExerciseDefinition {
    return EXERCISE_DEFINITIONS[type]
}
