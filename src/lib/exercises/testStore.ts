import type { ExerciseResult, ExerciseType } from '@/types/exercise'

const resultsByUser = new Map<string, ExerciseResult[]>()

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

export const testExerciseStore = {
  save(result: ExerciseResult) {
    const userId = result.userId
    const existing = resultsByUser.get(userId) ?? []
    const withId = { ...result, id: result.id ?? createId() }
    resultsByUser.set(userId, [...existing, withId])
    return withId
  },
  getLatest(userId: string, type: ExerciseType): ExerciseResult | null {
    const results = resultsByUser.get(userId) ?? []
    const filtered = results.filter((item) => item.exerciseType === type)
    if (!filtered.length) return null
    return filtered.sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1))[0] ?? null
  },
  getCompletionStatus(userId: string): Record<ExerciseType, boolean> {
    const results = resultsByUser.get(userId) ?? []
    return {
      'higher-power': results.some((item) => item.exerciseType === 'higher-power'),
      beliefs: results.some((item) => item.exerciseType === 'beliefs'),
      values: results.some((item) => item.exerciseType === 'values'),
      people: results.some((item) => item.exerciseType === 'people'),
      mission: results.some((item) => item.exerciseType === 'mission'),
      goals: results.some((item) => item.exerciseType === 'goals'),
      projects: results.some((item) => item.exerciseType === 'projects'),
      tasks: results.some((item) => item.exerciseType === 'tasks')
    }
  },
  update(resultId: string, userId: string, updates: Partial<ExerciseResult>) {
    const results = resultsByUser.get(userId) ?? []
    const next = results.map((item) => (item.id === resultId ? { ...item, ...updates } : item))
    resultsByUser.set(userId, next)
    return next.find((item) => item.id === resultId) ?? null
  },
  clear() {
    resultsByUser.clear()
  }
}
