import { useCallback, useEffect, useMemo, useState } from 'react'
import { hasPublicSupabase } from '@/lib/supabase'
import { getPinnedNotes } from '@/lib/notes'
import { useAuth } from '@/contexts/AuthContext'
import { analyzeOntologyForWritingSpark, type OntologyWritingSparkInput } from '@/lib/ontology/writingSparkAnalysis'
import { getExerciseCompletionStatus, getLatestExerciseResult } from '@/lib/exercises/exerciseService'
import type { ExerciseType } from '@/types/exercise'

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
}

const SESSION_KEY_PREFIX = 'signum-writing-spark-v3-'

const REJUVENATE_THRESHOLD_DAYS = 90

const EXERCISE_ORDER: ExerciseType[] = ['values', 'strengths', 'impact', 'purpose']

const DEFAULT_EXERCISE_STATUS: Record<ExerciseType, ExerciseStatusDetail> = {
  values: { completed: false },
  strengths: { completed: false },
  impact: { completed: false },
  purpose: { completed: false }
}

const FALLBACK: WritingSparkState = {
  text: "What's been feeling important to you lately? Sometimes our priorities shift in ways we don't fully notice until we pause to reflect.",
  input: { focus: 'values', signal: 'empty' },
  exerciseStatus: DEFAULT_EXERCISE_STATUS,
  allExercisesCompleted: false,
  suggestedExercise: 'values',
  isRejuvenateMode: false
}

/**
 * Compute which exercise to suggest next:
 * - First uncompleted exercise in order (values → strengths → impact → purpose)
 * - OR stalest exercise if all completed and any >90 days old
 * - OR null if all fresh
 */
function computeExerciseSuggestion(
  status: Record<ExerciseType, ExerciseStatusDetail>
): { suggestedExercise: ExerciseType | null; isRejuvenateMode: boolean } {
  // Find first uncompleted
  for (const type of EXERCISE_ORDER) {
    if (!status[type].completed) {
      return { suggestedExercise: type, isRejuvenateMode: false }
    }
  }

  // All completed - check for staleness
  const now = Date.now()
  let stalestType: ExerciseType | null = null
  let stalestAge = 0

  for (const type of EXERCISE_ORDER) {
    const completedAt = status[type].lastCompletedAt
    if (!completedAt) continue
    const age = now - Date.parse(completedAt)
    if (age > stalestAge) {
      stalestAge = age
      stalestType = type
    }
  }

  const thresholdMs = REJUVENATE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
  if (stalestAge > thresholdMs && stalestType) {
    return { suggestedExercise: stalestType, isRejuvenateMode: true }
  }

  return { suggestedExercise: null, isRejuvenateMode: false }
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
        // If no user, skip caching and use fallback
        if (!sessionKey || !user?.id) {
          if (!cancelled) setLoading(false)
          return
        }

        // Session cache first (fast, avoids repeat AI calls)
        const cached = sessionStorage.getItem(sessionKey)
        if (cached) {
          const parsed = JSON.parse(cached) as WritingSparkState
          if (!cancelled && parsed?.text) {
            setState(parsed)
            setLoading(false)
            return
          }
        }

        // Fetch exercise status (works in both test and production mode)
        let exerciseStatus = DEFAULT_EXERCISE_STATUS
        try {
          const completionStatus = await getExerciseCompletionStatus(user.id)
          const statusWithDates: Record<ExerciseType, ExerciseStatusDetail> = { ...DEFAULT_EXERCISE_STATUS }

          for (const type of EXERCISE_ORDER) {
            if (completionStatus[type]) {
              const latest = await getLatestExerciseResult(user.id, type)
              statusWithDates[type] = {
                completed: true,
                lastCompletedAt: latest?.completedAt
              }
            }
          }
          exerciseStatus = statusWithDates
        } catch (err) {
          console.warn('[useOntologyWritingSpark] Failed to fetch exercise status:', err)
        }

        const allExercisesCompleted = EXERCISE_ORDER.every((type) => exerciseStatus[type].completed)
        const { suggestedExercise, isRejuvenateMode } = computeExerciseSuggestion(exerciseStatus)

        // If Supabase isn't available, keep a high-quality fallback (no slow timeouts)
        if (!canUseSupabase) {
          if (!cancelled) {
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
            sessionStorage.setItem(sessionKey, JSON.stringify(next))
            setLoading(false)
          }
          return
        }

        const data = (await res.json()) as { ok: boolean; text?: string }
        const text = data?.text?.trim() || FALLBACK.text
        const next: WritingSparkState = {
          text,
          input,
          exerciseStatus,
          allExercisesCompleted,
          suggestedExercise,
          isRejuvenateMode
        }

        if (!cancelled) {
          setState(next)
          sessionStorage.setItem(sessionKey, JSON.stringify(next))
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
  }, [canUseSupabase, sessionKey, user])

  return { ...state, loading, clearCache }
}


