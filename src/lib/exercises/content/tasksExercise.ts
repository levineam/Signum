import type { SelectionItem } from '@/types/exercise'

export const TASKS_EXERCISE_ITEMS: ReadonlyArray<SelectionItem> = Object.freeze([
  {
    id: 'urgent-important',
    name: 'Urgent & Important',
    category: 'Priority Matrix',
    description: 'Crises, deadlines, problems.',
    clarifyingQuestion: 'What absolutely must get done today?'
  },
  {
    id: 'important-not-urgent',
    name: 'Important but Not Urgent',
    category: 'Priority Matrix',
    description: 'Planning, growth, relationships.',
    clarifyingQuestion: 'What important thing keeps getting pushed back?'
  },
  {
    id: 'urgent-not-important',
    name: 'Urgent but Not Important',
    category: 'Priority Matrix',
    description: 'Interruptions, some calls, some emails.',
    clarifyingQuestion: 'What could you delegate or batch?'
  },
  {
    id: 'not-urgent-not-important',
    name: 'Not Urgent & Not Important',
    category: 'Priority Matrix',
    description: 'Low-value distractions or time wasters.',
    clarifyingQuestion: 'What could you drop or minimize?'
  },
  {
    id: 'deep-work',
    name: 'Deep Work',
    category: 'Work Types',
    description: 'Focused, cognitively demanding tasks.',
    clarifyingQuestion: 'What requires your best concentration?'
  },
  {
    id: 'shallow-work',
    name: 'Shallow Work',
    category: 'Work Types',
    description: 'Administrative, routine tasks.',
    clarifyingQuestion: 'What can you handle with less energy?'
  },
  {
    id: 'creative-tasks',
    name: 'Creative Tasks',
    category: 'Work Types',
    description: 'Tasks requiring imagination.',
    clarifyingQuestion: 'What creative work needs your attention?'
  },
  {
    id: 'work-professional',
    name: 'Work / Professional',
    category: 'Life Domains',
    description: 'Job-related tasks.',
    clarifyingQuestion: 'What work tasks need attention today?'
  },
  {
    id: 'health-tasks',
    name: 'Health & Wellness',
    category: 'Life Domains',
    description: 'Exercise, appointments, self-care.',
    clarifyingQuestion: 'What health tasks are you prioritizing?'
  },
  {
    id: 'relationship-tasks',
    name: 'Relationship Tasks',
    category: 'Life Domains',
    description: 'Connecting with people who matter.',
    clarifyingQuestion: 'Who needs your attention today?'
  },
  {
    id: 'home-tasks',
    name: 'Home & Household',
    category: 'Life Domains',
    description: 'Chores, maintenance, errands.',
    clarifyingQuestion: 'What home tasks are piling up?'
  },
  {
    id: 'financial-tasks',
    name: 'Financial Tasks',
    category: 'Life Domains',
    description: 'Bills, budgeting, planning.',
    clarifyingQuestion: 'What financial tasks need handling?'
  },
  {
    id: 'personal-admin',
    name: 'Personal Admin',
    category: 'Life Domains',
    description: 'Paperwork, scheduling, organizing.',
    clarifyingQuestion: 'What administrative tasks are waiting?'
  },
  {
    id: 'learning-tasks',
    name: 'Learning Tasks',
    category: 'Growth',
    description: 'Study, practice, skill-building.',
    clarifyingQuestion: 'What learning tasks are you committed to?'
  },
  {
    id: 'planning-tasks',
    name: 'Planning & Reflection',
    category: 'Growth',
    description: 'Thinking ahead, reviewing progress.',
    clarifyingQuestion: 'What needs thoughtful planning?'
  },
  {
    id: 'maintenance-routines',
    name: 'Maintenance & Routines',
    category: 'Sustaining',
    description: 'Keeping systems running.',
    clarifyingQuestion: 'What routines keep your life on track?'
  },
  {
    id: 'waiting-for',
    name: 'Waiting For',
    category: 'Tracking',
    description: 'Things blocked by others.',
    clarifyingQuestion: 'What are you waiting on from someone else?'
  }
])
