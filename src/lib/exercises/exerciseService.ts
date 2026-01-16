import { hasPublicSupabase, supabase } from '@/lib/supabase'
import { isForcedTestUserEnabled } from '@/lib/e2eTestUtils'
import type { ExerciseResult, ExerciseType } from '@/types/exercise'
import {
  saveExerciseResult as saveExerciseResultDb,
  getLatestExerciseResult as getLatestExerciseResultDb,
  getExerciseCompletionStatus as getExerciseCompletionStatusDb,
  updateExerciseResult as updateExerciseResultDb
} from '@/lib/supabase/exercises'
import { testExerciseStore } from '@/lib/exercises/testStore'

const TEST_MODE = ['1', 'true'].includes(process.env.NEXT_PUBLIC_E2E_TEST_MODE ?? '')

const shouldUseTestStore = () => {
  if (TEST_MODE) return true
  if (!hasPublicSupabase()) return true
  if (typeof window !== 'undefined' && isForcedTestUserEnabled()) return true
  return false
}

export async function getAccessToken(): Promise<string | null> {
  if (!hasPublicSupabase()) return null
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  } catch (error) {
    console.warn('[exerciseService] Unable to load access token', error)
    return null
  }
}

export async function saveExerciseResult(
  input: Omit<ExerciseResult, 'id' | 'version'>
): Promise<ExerciseResult> {
  const useTestStore = shouldUseTestStore()

  if (useTestStore) {
    const latest = testExerciseStore.getLatest(input.userId, input.exerciseType)
    const nextVersion = (latest?.version ?? 0) + 1
    const stored = testExerciseStore.save({ ...input, version: nextVersion })
    return stored
  }

  const latest = await getLatestExerciseResultDb(input.userId, input.exerciseType)
  const nextVersion = (latest?.version ?? 0) + 1
  return await saveExerciseResultDb({ ...input, version: nextVersion })
}

export async function updateExerciseResultGeneratedItems(
  id: string,
  userId: string,
  generatedItems: ExerciseResult['generatedItems']
): Promise<ExerciseResult | null> {
  const useTestStore = shouldUseTestStore()

  if (useTestStore) {
    return testExerciseStore.update(id, userId, { generatedItems })
  }

  return await updateExerciseResultDb(id, userId, { generatedItems })
}

export async function getLatestExerciseResult(userId: string, type: ExerciseType): Promise<ExerciseResult | null> {
  const useTestStore = shouldUseTestStore()
  if (useTestStore) {
    return testExerciseStore.getLatest(userId, type)
  }
  return await getLatestExerciseResultDb(userId, type)
}

export async function getExerciseCompletionStatus(userId: string): Promise<Record<ExerciseType, boolean>> {
  const useTestStore = shouldUseTestStore()
  if (useTestStore) {
    return testExerciseStore.getCompletionStatus(userId)
  }
  return await getExerciseCompletionStatusDb(userId)
}
