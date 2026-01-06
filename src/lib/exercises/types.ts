/**
 * Micro-Exercise Type Definitions
 * Story: Micro-Exercises for Ontology Population
 * 
 * These types support the two-layer data model:
 * - Exercise Results (input layer): Raw data from micro-exercises
 * - Ontology (output layer): Curated items synthesized from exercises
 */

// =============================================================================
// Core Types
// =============================================================================

/**
 * Types of exercises available in the system.
 * Maps to exercise_type column in exercise_results table.
 */
export type ExerciseType = 'values' | 'strengths' | 'impact' | 'purpose'

/**
 * Input types for exercise steps.
 * Determines which UI component to render.
 */
export type ExerciseInputType = 'multi-select' | 'ranking' | 'free-text'

/**
 * A selectable option within an exercise.
 * Used for values, strengths, and beneficiary selections.
 */
export interface ExerciseOption {
  /** Unique identifier for the option */
  id: string
  /** Display name */
  name: string
  /** Category for grouping (e.g., 'Wisdom', 'Courage') */
  category: string
  /** Optional description shown on hover/selection */
  description?: string
  /** Optional clarifying question for reflection prompts */
  clarifyingQuestion?: string
}

/**
 * A single step in a multi-step exercise.
 */
export interface ExerciseStep {
  /** Unique identifier for the step */
  id: string
  /** Step title (e.g., "Select values that resonate") */
  title: string
  /** Detailed description/prompt */
  description: string
  /** Type of input required */
  inputType: ExerciseInputType
  /** Available options for multi-select/ranking steps */
  options?: ExerciseOption[]
  /** Minimum selections required (for multi-select) */
  minSelections?: number
  /** Maximum selections allowed (for multi-select) */
  maxSelections?: number
  /** Placeholder text (for free-text steps) */
  placeholder?: string
  /** Whether this step uses selections from previous step */
  usesPreviousSelections?: boolean
}

/**
 * Complete definition of an exercise.
 */
export interface ExerciseDefinition {
  /** Exercise type identifier */
  id: ExerciseType
  /** Main title (e.g., "Discover Your Values") */
  title: string
  /** Subtitle shown below title */
  subtitle: string
  /** Which ontology section this exercise populates */
  targetOntologySection: 'ontology-value' | 'ontology-belief' | 'ontology-aim'
  /** Estimated time to complete (e.g., "60 seconds") */
  estimatedDuration: string
  /** Ordered list of steps */
  steps: ExerciseStep[]
  /** Message shown on completion */
  completionMessage: string
}

// =============================================================================
// Result Types
// =============================================================================

/**
 * A selection made by the user during an exercise.
 * Extends ExerciseOption with optional rank.
 */
export interface ExerciseSelection extends ExerciseOption {
  /** Optional rank (1-based) for ranking exercises */
  rank?: number
}

/**
 * Result of a completed exercise.
 * Stored in exercise_results table.
 */
export interface ExerciseResult {
  /** UUID of the result (set by database) */
  id?: string
  /** User who completed the exercise */
  userId: string
  /** Type of exercise completed */
  exerciseType: ExerciseType
  /** Selected options with optional rankings */
  selections: ExerciseSelection[]
  /** Free-form text response (for impact/purpose) */
  freeText?: string
  /** When the exercise was completed */
  completedAt: string
  /** Version number (incremented on redo) */
  version: number
  /** Links to ontology items generated from this result */
  generatedItems?: Array<{
    noteId: string
    itemName: string
  }>
}

// =============================================================================
// State Types (for UI)
// =============================================================================

/**
 * Current state of an exercise in progress.
 */
export interface ExerciseState {
  /** Current step index (0-based) */
  currentStepIndex: number
  /** Selections made in each step, indexed by step ID */
  selectionsByStep: Record<string, ExerciseSelection[]>
  /** Free text responses by step ID */
  freeTextByStep: Record<string, string>
  /** Whether exercise is complete */
  isComplete: boolean
  /** Whether submit is in progress */
  isSubmitting: boolean
}

/**
 * Status of exercise completion for a user.
 */
export interface ExerciseCompletionStatus {
  exerciseType: ExerciseType
  completed: boolean
  lastCompletedAt: string | null
  version: number
}

// =============================================================================
// Mapping Types
// =============================================================================

/**
 * Maps ontology section to available exercise.
 */
export const ONTOLOGY_TO_EXERCISE_MAP: Record<string, ExerciseType | null> = {
  'ontology-value': 'values',
  'ontology-belief': null, // No exercise yet
  'ontology-aim': 'purpose'
}

/**
 * Maps exercise type to ontology section.
 */
export const EXERCISE_TO_ONTOLOGY_MAP: Record<ExerciseType, string> = {
  values: 'ontology-value',
  strengths: 'ontology-aim', // Used as input for purpose synthesis
  impact: 'ontology-aim',    // Used as input for purpose synthesis
  purpose: 'ontology-aim'
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the exercise type available for an ontology section.
 * Returns null if no exercise is available.
 */
export function getExerciseForSection(noteType: string): ExerciseType | null {
  return ONTOLOGY_TO_EXERCISE_MAP[noteType] ?? null
}

/**
 * Check if an exercise should be shown for a section.
 * Shows exercise if section is empty or hasn't been exercised recently.
 */
export function shouldShowExercise(
  noteType: string,
  itemCount: number,
  completionStatus?: ExerciseCompletionStatus
): boolean {
  const exerciseType = getExerciseForSection(noteType)
  if (!exerciseType) return false
  
  // Show if section is empty
  if (itemCount === 0) return true
  
  // Show if exercise hasn't been done
  if (!completionStatus?.completed) return true
  
  return false
}
