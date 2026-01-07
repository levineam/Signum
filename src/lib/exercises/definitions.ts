import type { ExerciseDefinition, ExerciseType } from '@/types/exercise'
import { valuesExerciseItems } from '@/lib/exercises/content/valuesExercise'
import { strengthsExerciseItems } from '@/lib/exercises/content/strengthsExercise'
import { impactExerciseItems } from '@/lib/exercises/content/impactExercise'

export const EXERCISE_CONTENT: Record<ExerciseType, typeof valuesExerciseItems> = {
  values: valuesExerciseItems,
  strengths: strengthsExerciseItems,
  impact: impactExerciseItems,
  purpose: []
}

export const EXERCISE_DEFINITIONS: Record<ExerciseType, ExerciseDefinition> = {
  values: {
    id: 'values',
    title: 'Discover your values',
    subtitle: '60 seconds to name what matters most.',
    estimatedDuration: '60 seconds',
    outputType: 'direct',
    steps: [
      {
        id: 'values-select',
        type: 'multi-select',
        title: 'What would you fight to protect?',
        description: 'Choose 5-8 values that feel non-negotiable right now.',
        minSelections: 5,
        maxSelections: 8
      },
      {
        id: 'values-rank',
        type: 'ranking',
        title: 'Put your values in order',
        description: 'Drag to rank the values you chose.',
        usesPreviousSelections: true
      }
    ]
  },
  strengths: {
    id: 'strengths',
    title: 'Spot your strengths',
    subtitle: '60 seconds to name what you rely on most.',
    estimatedDuration: '60 seconds',
    outputType: 'context',
    steps: [
      {
        id: 'strengths-select',
        type: 'multi-select',
        title: 'What feels most like you?',
        description: 'Choose 4-6 strengths you lean on often.',
        minSelections: 4,
        maxSelections: 6
      },
      {
        id: 'strengths-rank',
        type: 'ranking',
        title: 'Order your strengths',
        description: 'Drag to rank what feels most natural.',
        usesPreviousSelections: true
      }
    ]
  },
  impact: {
    id: 'impact',
    title: 'Choose your impact',
    subtitle: '60 seconds to name who you want to serve.',
    estimatedDuration: '60 seconds',
    outputType: 'context',
    steps: [
      {
        id: 'impact-select',
        type: 'multi-select',
        title: 'Who do you most want to help?',
        description: 'Choose 2-4 groups you feel drawn to serve.',
        minSelections: 2,
        maxSelections: 4
      },
      {
        id: 'impact-rank',
        type: 'ranking',
        title: 'Order your impact',
        description: 'Drag to rank who you feel most called to serve.',
        usesPreviousSelections: true
      }
    ]
  },
  purpose: {
    id: 'purpose',
    title: 'Shape your purpose',
    subtitle: '90 seconds to name the change you want to create.',
    estimatedDuration: '90 seconds',
    outputType: 'ai-synthesis',
    steps: [
      {
        id: 'purpose-text',
        type: 'free-text',
        title: 'What change do you want to create?',
        description: 'A few sentences is enough. Keep it real and personal.',
        placeholder: 'I want to help...'
      }
    ]
  }
}
