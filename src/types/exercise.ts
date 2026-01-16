export type ExerciseType =
  | 'higher-power'
  | 'beliefs'
  | 'values'
  | 'people'
  | 'mission'
  | 'goals'
  | 'projects'
  | 'tasks'
export type StepType = 'multi-select' | 'ranking' | 'free-text'

export interface SelectionItem {
  id: string
  name: string
  category: string
  description?: string
  clarifyingQuestion?: string
}

export interface ExerciseStep {
  id: string
  type: StepType
  title: string
  description: string
  minSelections?: number
  maxSelections?: number
  placeholder?: string
  usesPreviousSelections?: boolean
}

export interface ExerciseDefinition {
  id: ExerciseType
  title: string
  subtitle?: string
  estimatedDuration?: string
  steps: ExerciseStep[]
  outputType: 'direct' | 'context' | 'ai-synthesis'
}

export interface ExerciseSelection extends SelectionItem {
  rank?: number
}

export interface ExerciseResult {
  id?: string
  userId: string
  exerciseType: ExerciseType
  selections: ExerciseSelection[]
  freeText?: string
  completedAt: string
  version: number
  generatedItems?: Array<{ noteId: string; itemName: string }>
}

/**
 * Default completion status for all exercise types (all false).
 * Used to initialize exercise completion tracking.
 */
export const DEFAULT_EXERCISE_COMPLETION: Record<ExerciseType, boolean> = {
  'higher-power': false,
  beliefs: false,
  values: false,
  people: false,
  mission: false,
  goals: false,
  projects: false,
  tasks: false,
}
