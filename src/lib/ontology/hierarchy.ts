import { HierarchicalOntologyItem } from '@/types/note'

const FALLBACK_ID = () => `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return FALLBACK_ID()
}

export type ProjectNode = HierarchicalOntologyItem & { tasks: HierarchicalOntologyItem[] }
export type GoalNode = HierarchicalOntologyItem & { projects: ProjectNode[] }

export interface ExecutionStackHierarchy {
  goals: GoalNode[]
  unassignedProjects: ProjectNode[]
  unassignedTasks: HierarchicalOntologyItem[]
}

export function normalizeOntologyItems(
  items: HierarchicalOntologyItem[] | undefined
): { normalized: HierarchicalOntologyItem[]; changed: boolean } {
  if (!Array.isArray(items)) {
    return { normalized: [], changed: false }
  }

  let changed = false
  const normalized = items.map((item, index) => {
    const hasId = Boolean((item as { id?: string }).id)
    const hasOrder = typeof (item as { order?: number }).order === 'number'

    const normalizedItem: HierarchicalOntologyItem = {
      id: hasId ? (item as { id: string }).id : generateId(),
      name: (item as { name?: string }).name ?? '',
      confidence: (item as { confidence?: HierarchicalOntologyItem['confidence'] }).confidence ?? 'high',
      parentId: (item as { parentId?: string }).parentId,
      order: hasOrder ? (item as { order: number }).order : index,
      excerpts: Array.isArray((item as { excerpts?: unknown }).excerpts) ? (item as { excerpts: HierarchicalOntologyItem['excerpts'] }).excerpts : []
    }

    if (!hasId || !hasOrder) {
      changed = true
    }

    return normalizedItem
  })

  return { normalized, changed }
}

export function sortByOrder<T extends HierarchicalOntologyItem>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const orderDiff = a.order - b.order
    if (orderDiff !== 0) return orderDiff
    return a.name.localeCompare(b.name)
  })
}

export function buildExecutionHierarchy(
  goals: HierarchicalOntologyItem[],
  projects: HierarchicalOntologyItem[],
  tasks: HierarchicalOntologyItem[]
): ExecutionStackHierarchy {
  const goalNodes = sortByOrder(goals).map<GoalNode>((goal) => ({
    ...goal,
    projects: []
  }))
  const goalMap = new Map(goalNodes.map((goal) => [goal.id, goal]))

  const projectsByParent = new Map<string | undefined, ProjectNode[]>()
  projects.forEach((project) => {
    const key = project.parentId
    const list = projectsByParent.get(key) ?? []
    list.push({ ...project, tasks: [] })
    projectsByParent.set(key, list)
  })

  const sortedProjectsByParent = new Map<string | undefined, ProjectNode[]>(
    Array.from(projectsByParent.entries()).map(([parentId, list]) => [
      parentId,
      sortByOrder(list)
    ])
  )

  const projectMap = new Map<string, ProjectNode>()
  const unassignedProjects: ProjectNode[] = []

  sortedProjectsByParent.forEach((list, parentId) => {
    list.forEach((project) => {
      projectMap.set(project.id, project)
      if (parentId && goalMap.has(parentId)) {
        goalMap.get(parentId)?.projects.push(project)
      } else {
        unassignedProjects.push(project)
      }
    })
  })

  const tasksByParent = new Map<string | undefined, HierarchicalOntologyItem[]>()
  tasks.forEach((task) => {
    const key = task.parentId
    const list = tasksByParent.get(key) ?? []
    list.push(task)
    tasksByParent.set(key, list)
  })

  const sortedTasksByParent = new Map<string | undefined, HierarchicalOntologyItem[]>(
    Array.from(tasksByParent.entries()).map(([parentId, list]) => [
      parentId,
      sortByOrder(list)
    ])
  )

  const unassignedTasks = sortedTasksByParent.get(undefined) ?? []

  sortedTasksByParent.forEach((list, parentId) => {
    if (!parentId) return
    const project = projectMap.get(parentId)
    if (project) {
      project.tasks.push(...list)
    } else {
      unassignedTasks.push(...list)
    }
  })

  return {
    goals: goalNodes,
    unassignedProjects,
    unassignedTasks
  }
}

export function countDescendants(goal: GoalNode): { projects: number; tasks: number } {
  const projects = goal.projects.length
  const tasks = goal.projects.reduce((acc, project) => acc + project.tasks.length, 0)
  return { projects, tasks }
}

export function countProjectTasks(project: ProjectNode): { tasks: number } {
  return { tasks: project.tasks.length }
}

export function resequenceByParent(items: HierarchicalOntologyItem[]): HierarchicalOntologyItem[] {
  const grouped = new Map<string | undefined, HierarchicalOntologyItem[]>()

  items.forEach((item) => {
    const key = item.parentId
    const list = grouped.get(key) ?? []
    list.push(item)
    grouped.set(key, list)
  })

  const orderMap = new Map<string, number>()

  grouped.forEach((list) => {
    sortByOrder(list).forEach((item, index) => {
      orderMap.set(item.id, index)
    })
  })

  return items.map((item) => ({
    ...item,
    order: orderMap.get(item.id) ?? item.order
  }))
}
