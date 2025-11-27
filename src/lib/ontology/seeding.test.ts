import { describe, expect, it } from 'vitest'
import { buildSampleExecutionSeed, buildSeedStatus, shouldSeedExecutionStack } from './seeding'
import { HierarchicalOntologyItem } from '@/types/note'

const goal = (id: string, name: string, order: number): HierarchicalOntologyItem => ({
  id,
  name,
  confidence: 'high',
  parentId: undefined,
  order,
  excerpts: []
})

describe('Execution Stack seeding helpers', () => {
  it('should seed only when empty and not already seeded', () => {
    expect(shouldSeedExecutionStack([], [], undefined)).toBe(true)
    expect(shouldSeedExecutionStack([{ ...goal('p1', 'p', 0), parentId: 'g1' }], [], undefined)).toBe(false)
    expect(
      shouldSeedExecutionStack([], [], buildSeedStatus('empty-seeded', '2024-01-01T00:00:00.000Z'))
    ).toBe(false)
  })

  it('builds sample projects and tasks per goal with parent links', () => {
    let counter = 0
    const idFactory = () => {
      counter += 1
      return `id-${counter}`
    }

    const goals: HierarchicalOntologyItem[] = [goal('g1', 'Goal One', 0), goal('g2', 'Goal Two', 1)]
    const { projects, tasks } = buildSampleExecutionSeed(goals, idFactory)

    expect(projects).toHaveLength(4) // 2 per goal
    expect(tasks).toHaveLength(8) // 2 per project

    const [p1, p2, p3, p4] = projects
    expect(p1.parentId).toBe('g1')
    expect(p2.parentId).toBe('g1')
    expect(p1.order).toBe(0)
    expect(p2.order).toBe(1)

    expect(p3.parentId).toBe('g2')
    expect(p4.parentId).toBe('g2')
    expect(p3.order).toBe(0)
    expect(p4.order).toBe(1)

    const tasksForP1 = tasks.filter((t) => t.parentId === p1.id)
    expect(tasksForP1).toHaveLength(2)
    expect(tasksForP1.map((t) => t.order)).toEqual([0, 1])

    const tasksForP3 = tasks.filter((t) => t.parentId === p3.id)
    expect(tasksForP3).toHaveLength(2)
  })

  it('returns empty data when there are no goals', () => {
    const { projects, tasks } = buildSampleExecutionSeed([], () => 'id')
    expect(projects).toHaveLength(0)
    expect(tasks).toHaveLength(0)
  })
})
