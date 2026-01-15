import { useCallback, useEffect, useMemo, useState } from 'react'
import { hasPublicSupabase } from '@/lib/supabase'
import { getPinnedNotes } from '@/lib/notes'
import { useAuth } from '@/contexts/AuthContext'
import { analyzeOntologyForWritingSpark, type OntologyWritingSparkInput } from '@/lib/ontology/writingSparkAnalysis'
import { getLatestExerciseResult } from '@/lib/exercises/exerciseService'
import type { ExerciseType } from '@/types/exercise'
import type { OntologyCategory } from '@/types/note'

type ExerciseStatusDetail = {
  completed: boolean
  lastCompletedAt?: string
}

type WritingSparkState = {
  text: string
  input: OntologyWritingSparkInput
  exerciseStatus: Record<ExerciseType, ExerciseStatusDetail>
  allExercisesCompleted: boolean
  suggestedExercise: ExerciseType | null
  isRejuvenateMode: boolean
  // Comparison mode fields
  prewrittenText?: string
  aiText?: string
}

const SESSION_KEY_PREFIX = 'signum-writing-spark-v6-'

const REJUVENATE_THRESHOLD_DAYS = 90

// Exercise types now match ontology categories 1:1
const EXERCISE_TYPES: ExerciseType[] = [
  'higher-power',
  'beliefs',
  'values',
  'people',
  'mission',
  'goals',
  'projects',
  'tasks'
]

const DEFAULT_EXERCISE_STATUS: Record<ExerciseType, ExerciseStatusDetail> = {
  'higher-power': { completed: false },
  beliefs: { completed: false },
  values: { completed: false },
  people: { completed: false },
  mission: { completed: false },
  goals: { completed: false },
  projects: { completed: false },
  tasks: { completed: false }
}

const FALLBACK: WritingSparkState = {
  text: "What's been feeling important to you lately? Sometimes our priorities shift in ways we don't fully notice until we pause to reflect.",
  input: { focus: 'higher-power', signal: 'empty' },
  exerciseStatus: DEFAULT_EXERCISE_STATUS,
  allExercisesCompleted: false,
  suggestedExercise: 'higher-power',
  isRejuvenateMode: false
}

/**
 * Map ontology category to exercise type.
 * They now match 1:1.
 */
function ontologyCategoryToExerciseType(category: OntologyCategory): ExerciseType {
  return category as ExerciseType
}

/**
 * Compute which exercise to suggest based on ontology focus.
 * The exercise should match what the ontology analysis determined needs attention.
 *
 * - If the focused exercise is not completed, suggest it (first time mode)
 * - If the focused exercise is completed but stale (>90 days), suggest it (rejuvenate mode)
 * - If the focused exercise is fresh, still suggest it (they can redo if they want)
 */
function computeExerciseSuggestion(
  focus: OntologyCategory,
  status: Record<ExerciseType, ExerciseStatusDetail>
): { suggestedExercise: ExerciseType; isRejuvenateMode: boolean } {
  const exerciseType = ontologyCategoryToExerciseType(focus)
  const exerciseStatus = status[exerciseType]

  // If not completed, it's first time
  if (!exerciseStatus?.completed) {
    return { suggestedExercise: exerciseType, isRejuvenateMode: false }
  }

  // If completed, check staleness
  const now = Date.now()
  const completedAt = exerciseStatus.lastCompletedAt
  if (completedAt) {
    const ageMs = now - Date.parse(completedAt)
    const thresholdMs = REJUVENATE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
    if (ageMs > thresholdMs) {
      return { suggestedExercise: exerciseType, isRejuvenateMode: true }
    }
  }

  // Fresh completion - still suggest the exercise (user can choose to redo)
  return { suggestedExercise: exerciseType, isRejuvenateMode: false }
}

export function useOntologyWritingSpark() {
  const { user } = useAuth()
  const [state, setState] = useState<WritingSparkState>(FALLBACK)
  const [loading, setLoading] = useState(true)

  const canUseSupabase = useMemo(() => hasPublicSupabase() && !!user?.id, [user?.id])

  // Scope cache key to user ID to prevent cross-account leakage
  const sessionKey = user?.id ? `${SESSION_KEY_PREFIX}${user.id}` : null

  const clearCache = useCallback(() => {
    if (sessionKey) {
      try {
        sessionStorage.removeItem(sessionKey)
      } catch {
        // ignore
      }
    }
  }, [sessionKey])

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        if (!cancelled) setLoading(true)
        // If no user, skip caching and use fallback
        if (!sessionKey || !user?.id) {
          if (!cancelled) setLoading(false)
          return
        }

        // Session cache first (fast, avoids repeat AI calls)
        let cached: string | null = null
        try {
          cached = sessionStorage.getItem(sessionKey)
        } catch {
          // ignore
        }
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as WritingSparkState
            if (!cancelled && parsed?.text) {
              setState(parsed)
              setLoading(false)
              return
            }
          } catch {
            // ignore
          }
        }

        // Fetch exercise status for all exercise types
        let exerciseStatus = { ...DEFAULT_EXERCISE_STATUS }
        try {
          const statusWithDates: Record<ExerciseType, ExerciseStatusDetail> = { ...DEFAULT_EXERCISE_STATUS }

          // Fetch status for each exercise type
          await Promise.all(
            EXERCISE_TYPES.map(async (type) => {
              try {
                const latest = await getLatestExerciseResult(user.id, type)
                if (latest) {
                  statusWithDates[type] = {
                    completed: true,
                    lastCompletedAt: latest.completedAt
                  }
                }
              } catch {
                // Individual fetch failed, keep default
              }
            })
          )
          exerciseStatus = statusWithDates
        } catch (err) {
          console.warn('[useOntologyWritingSpark] Failed to fetch exercise status:', err)
        }

        const allExercisesCompleted = EXERCISE_TYPES.every((type) => exerciseStatus[type].completed)

        // If Supabase isn't available, keep a high-quality fallback (no slow timeouts)
        if (!canUseSupabase) {
          if (!cancelled) {
            const { suggestedExercise, isRejuvenateMode } = computeExerciseSuggestion(
              FALLBACK.input.focus,
              exerciseStatus
            )
            const next: WritingSparkState = {
              ...FALLBACK,
              exerciseStatus,
              allExercisesCompleted,
              suggestedExercise,
              isRejuvenateMode
            }
            setState(next)
            setLoading(false)
          }
          return
        }

        const pinned = await getPinnedNotes(user.id)
        const input = analyzeOntologyForWritingSpark(pinned)

        // Exercise suggestion is now based on ontology analysis focus
        const { suggestedExercise, isRejuvenateMode } = computeExerciseSuggestion(
          input.focus,
          exerciseStatus
        )

        const res = await fetch('/api/ontology/writing-spark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        if (!res.ok) {
          if (!cancelled) {
            const next: WritingSparkState = {
              ...FALLBACK,
              input,
              exerciseStatus,
              allExercisesCompleted,
              suggestedExercise,
              isRejuvenateMode
            }
            setState(next)
            try {
              sessionStorage.setItem(sessionKey, JSON.stringify(next))
            } catch {
              // ignore
            }
            setLoading(false)
          }
          return
        }

        const data = (await res.json()) as { ok: boolean; text?: string; prewrittenText?: string; aiText?: string }
        const text = data?.text?.trim() || FALLBACK.text
        const next: WritingSparkState = {
          text,
          input,
          exerciseStatus,
          allExercisesCompleted,
          suggestedExercise,
          isRejuvenateMode,
          prewrittenText: data?.prewrittenText,
          aiText: data?.aiText,
        }

        if (!cancelled) {
          setState(next)
          try {
            sessionStorage.setItem(sessionKey, JSON.stringify(next))
          } catch {
            // ignore
          }
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [canUseSupabase, sessionKey, user?.id])

  return { ...state, loading, clearCache }
}
