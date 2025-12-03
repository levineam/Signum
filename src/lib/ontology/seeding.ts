import { HierarchicalOntologyItem } from '@/types/note'

export type ExecutionSeedReason = 'empty-seeded' | 'existing-data' | 'user-edit'

export interface ExecutionSeedStatus {
  seeded: boolean
  seededAt?: string
  reason?: ExecutionSeedReason
}

type IdFactory = () => string

const defaultIdFactory: IdFactory = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

interface ProjectTemplate {
  title: string
  tasks: string[]
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    title: 'Clarify direction',
    tasks: ['Define success for the next 7 days', 'List constraints and supports']
  },
  {
    title: 'First visible win',
    tasks: ['Pick the smallest deliverable', 'Schedule a 60-minute focus block']
  },
  {
    title: 'Support system',
    tasks: ['Invite an accountability buddy', 'Set a weekly check-in']
  },
  {
    title: 'Momentum checklist',
    tasks: ['Create a 3-step checklist', 'Book the first work session']
  }
]

function rotateTemplates(startIndex: number): ProjectTemplate[] {
  const rotated: ProjectTemplate[] = []
  for (let i = 0; i < PROJECT_TEMPLATES.length; i++) {
    rotated.push(PROJECT_TEMPLATES[(startIndex + i) % PROJECT_TEMPLATES.length])
  }
  return rotated
}

export function shouldSeedExecutionStack(
  projects: HierarchicalOntologyItem[],
  tasks: HierarchicalOntologyItem[],
  status?: ExecutionSeedStatus
): boolean {
  if (status?.seeded) return false
  return projects.length === 0 && tasks.length === 0
}

export function buildSeedStatus(reason: ExecutionSeedReason, seededAt?: string): ExecutionSeedStatus {
  return {
    seeded: true,
    seededAt: seededAt ?? new Date().toISOString(),
    reason
  }
}

export function buildDefaultGoals(idFactory: IdFactory = defaultIdFactory): HierarchicalOntologyItem[] {
  const DEFAULT_GOAL_TITLES = [
    'Build mental-health work',
    'Ship first visible win',
    'Create a support system'
  ]

  return DEFAULT_GOAL_TITLES.map((name, index) => ({
    id: idFactory(),
    name,
    confidence: 'high',
    order: index,
    excerpts: []
  }))
}

export function buildSampleExecutionSeed(
  goals: HierarchicalOntologyItem[],
  idFactory: IdFactory = defaultIdFactory
): { projects: HierarchicalOntologyItem[]; tasks: HierarchicalOntologyItem[] } {
  if (!Array.isArray(goals) || goals.length === 0) {
    return { projects: [], tasks: [] }
  }

  const projects: HierarchicalOntologyItem[] = []
  const tasks: HierarchicalOntologyItem[] = []

  goals.forEach((goal, goalIndex) => {
    const templates = rotateTemplates(goalIndex).slice(0, 2)
    templates.forEach((template, projectIndex) => {
      const projectId = idFactory()
      projects.push({
        id: projectId,
        name: `${template.title} — ${goal.name}`,
        confidence: 'high',
        parentId: goal.id,
        order: projectIndex,
        excerpts: []
      })

      template.tasks.slice(0, 2).forEach((taskName, taskIndex) => {
        tasks.push({
          id: idFactory(),
          name: taskName,
          confidence: 'high',
          parentId: projectId,
          order: taskIndex,
          excerpts: []
        })
      })
    })
  })

  return { projects, tasks }
}
