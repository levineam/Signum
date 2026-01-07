export type ExerciseType = 'values' | 'strengths' | 'impact' | 'purpose'
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
  subtitle: string
  estimatedDuration: string
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
