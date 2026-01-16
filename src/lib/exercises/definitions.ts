import type { ExerciseDefinition, ExerciseType, SelectionItem } from '@/types/exercise'
import { VALUES_EXERCISE_ITEMS } from '@/lib/exercises/content/valuesExercise'
import { HIGHER_POWER_EXERCISE_ITEMS } from '@/lib/exercises/content/higherPowerExercise'
import { BELIEFS_EXERCISE_ITEMS } from '@/lib/exercises/content/beliefsExercise'
import { PEOPLE_EXERCISE_ITEMS } from '@/lib/exercises/content/peopleExercise'
import { GOALS_EXERCISE_ITEMS } from '@/lib/exercises/content/goalsExercise'
import { PROJECTS_EXERCISE_ITEMS } from '@/lib/exercises/content/projectsExercise'
import { TASKS_EXERCISE_ITEMS } from '@/lib/exercises/content/tasksExercise'

export const EXERCISE_CONTENT: Record<ExerciseType, ReadonlyArray<SelectionItem>> = {
  'higher-power': HIGHER_POWER_EXERCISE_ITEMS,
  beliefs: BELIEFS_EXERCISE_ITEMS,
  values: VALUES_EXERCISE_ITEMS,
  people: PEOPLE_EXERCISE_ITEMS,
  mission: Object.freeze([]) as ReadonlyArray<SelectionItem>, // Mission uses free-text, no selection items
  goals: GOALS_EXERCISE_ITEMS,
  projects: PROJECTS_EXERCISE_ITEMS,
  tasks: TASKS_EXERCISE_ITEMS
}

export const EXERCISE_DEFINITIONS: Record<ExerciseType, ExerciseDefinition> = {
  'higher-power': {
    id: 'higher-power',
    title: 'Connect with something greater',
    outputType: 'direct',
    steps: [
      {
        id: 'higher-power-select',
        type: 'multi-select',
        title: 'What feels larger than yourself?',
        description: 'Choose 1-3 sources of meaning or transcendence.',
        minSelections: 1,
        maxSelections: 3
      },
      {
        id: 'higher-power-text',
        type: 'free-text',
        title: 'Describe your connection',
        description: 'In a few words, how does this shape your life?',
        placeholder: 'When I think about this, I feel...'
      }
    ]
  },
  beliefs: {
    id: 'beliefs',
    title: 'Name your core beliefs',
    outputType: 'direct',
    steps: [
      {
        id: 'beliefs-select',
        type: 'multi-select',
        title: 'What do you believe to be true?',
        description: 'Choose 4-6 beliefs that guide how you live.',
        minSelections: 4,
        maxSelections: 6
      },
      {
        id: 'beliefs-rank',
        type: 'ranking',
        title: 'Order your beliefs',
        description: 'Drag to rank from most foundational to least.',
        usesPreviousSelections: true
      }
    ]
  },
  values: {
    id: 'values',
    title: 'Discover your values',
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
  people: {
    id: 'people',
    title: 'Recognize who matters most',
    outputType: 'direct',
    steps: [
      {
        id: 'people-select',
        type: 'multi-select',
        title: 'Who do you want to show up for?',
        description: 'Choose 3-5 people or groups you care about most.',
        minSelections: 3,
        maxSelections: 5
      },
      {
        id: 'people-rank',
        type: 'ranking',
        title: 'Order by importance',
        description: 'Drag to rank who matters most.',
        usesPreviousSelections: true
      }
    ]
  },
  mission: {
    id: 'mission',
    title: 'Shape your mission',
    outputType: 'ai-synthesis',
    steps: [
      {
        id: 'mission-text',
        type: 'free-text',
        title: 'What change do you want to create?',
        description: 'A few sentences about the impact you want to have.',
        placeholder: 'I want to help...'
      }
    ]
  },
  goals: {
    id: 'goals',
    title: 'Clarify your goals',
    outputType: 'direct',
    steps: [
      {
        id: 'goals-select',
        type: 'multi-select',
        title: 'What are you working toward?',
        description: 'Choose 3-5 goal areas that matter right now.',
        minSelections: 3,
        maxSelections: 5
      },
      {
        id: 'goals-rank',
        type: 'ranking',
        title: 'Prioritize your goals',
        description: 'Drag to rank what matters most.',
        usesPreviousSelections: true
      }
    ]
  },
  projects: {
    id: 'projects',
    title: 'Focus your projects',
    outputType: 'direct',
    steps: [
      {
        id: 'projects-select',
        type: 'multi-select',
        title: 'What projects deserve your energy?',
        description: 'Choose 2-4 project types you want to focus on.',
        minSelections: 2,
        maxSelections: 4
      },
      {
        id: 'projects-rank',
        type: 'ranking',
        title: 'Order your priorities',
        description: 'Drag to rank what needs attention first.',
        usesPreviousSelections: true
      }
    ]
  },
  tasks: {
    id: 'tasks',
    title: 'Prioritize your tasks',
    outputType: 'direct',
    steps: [
      {
        id: 'tasks-select',
        type: 'multi-select',
        title: 'What deserves your attention today?',
        description: 'Choose 3-5 task categories to focus on.',
        minSelections: 3,
        maxSelections: 5
      },
      {
        id: 'tasks-rank',
        type: 'ranking',
        title: 'Order by urgency',
        description: 'Drag to rank what needs doing first.',
        usesPreviousSelections: true
      }
    ]
  }
}
