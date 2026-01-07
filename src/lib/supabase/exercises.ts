import { supabase, hasPublicSupabase } from '@/lib/supabase'
import type { ExerciseResult, ExerciseType } from '@/types/exercise'

const EMPTY_COMPLETION: Record<ExerciseType, boolean> = {
  values: false,
  strengths: false,
  impact: false,
  purpose: false
}

function requireSupabase() {
  if (!hasPublicSupabase()) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  }
}

type ExerciseResultRow = {
  id: string
  user_id: string
  exercise_type: ExerciseType
  selections: ExerciseResult['selections']
  free_text: string | null
  completed_at: string
  version: number
  generated_items: ExerciseResult['generatedItems'] | null
}

const mapRow = (row: ExerciseResultRow): ExerciseResult => ({
  id: row.id,
  userId: row.user_id,
  exerciseType: row.exercise_type,
  selections: row.selections ?? [],
  freeText: row.free_text ?? undefined,
  completedAt: row.completed_at,
  version: row.version,
  generatedItems: row.generated_items ?? undefined
})

export async function saveExerciseResult(result: Omit<ExerciseResult, 'id'>): Promise<ExerciseResult> {
  requireSupabase()

  const { data, error } = await supabase
    .from('exercise_results')
    .insert({
      user_id: result.userId,
      exercise_type: result.exerciseType,
      selections: result.selections,
      free_text: result.freeText ?? null,
      completed_at: result.completedAt,
      version: result.version,
      generated_items: result.generatedItems ?? []
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to save exercise result: ${error.message}`)
  }

  return mapRow(data as ExerciseResultRow)
}

export async function updateExerciseResult(
  id: string,
  userId: string,
  updates: Partial<Pick<ExerciseResult, 'generatedItems' | 'freeText' | 'selections'>>
): Promise<ExerciseResult> {
  requireSupabase()

  const { data, error } = await supabase
    .from('exercise_results')
    .update({
      generated_items: updates.generatedItems ?? undefined,
      free_text: updates.freeText ?? undefined,
      selections: updates.selections ?? undefined
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    throw new Error(`Failed to update exercise result: ${error.message}`)
  }

  return mapRow(data as ExerciseResultRow)
}

export async function getLatestExerciseResult(userId: string, type: ExerciseType): Promise<ExerciseResult | null> {
  requireSupabase()

  const { data, error } = await supabase
    .from('exercise_results')
    .select('*')
    .eq('user_id', userId)
    .eq('exercise_type', type)
    .order('completed_at', { ascending: false })
    .limit(1)

  if (error) {
    throw new Error(`Failed to fetch exercise results: ${error.message}`)
  }

  const row = (data as ExerciseResultRow[] | null)?.[0]
  return row ? mapRow(row) : null
}

export async function getExerciseCompletionStatus(userId: string): Promise<Record<ExerciseType, boolean>> {
  requireSupabase()

  const { data, error } = await supabase
    .from('exercise_results')
    .select('exercise_type')
    .eq('user_id', userId)

  if (error) {
    throw new Error(`Failed to fetch exercise completion status: ${error.message}`)
  }

  const status = { ...EMPTY_COMPLETION }
  ;(data as Array<{ exercise_type: ExerciseType }> | null)?.forEach((row) => {
    if (row.exercise_type in status) {
      status[row.exercise_type] = true
    }
  })

  return status
}
