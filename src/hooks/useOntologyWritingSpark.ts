import { useEffect, useMemo, useState } from 'react'
import { hasPublicSupabase } from '@/lib/supabase'
import { getPinnedNotes } from '@/lib/notes'
import { useAuth } from '@/contexts/AuthContext'
import { analyzeOntologyForWritingSpark, type OntologyWritingSparkInput } from '@/lib/ontology/writingSparkAnalysis'

type WritingSparkState = {
  text: string
  input: OntologyWritingSparkInput
}

const SESSION_KEY = 'signum-writing-spark-v1'

const FALLBACK: WritingSparkState = {
  text: "What's been feeling important to you lately? Sometimes our priorities shift in ways we don't fully notice until we pause to reflect.",
  input: { focus: 'values', signal: 'empty' },
}

export function useOntologyWritingSpark() {
  const { user } = useAuth()
  const [state, setState] = useState<WritingSparkState>(FALLBACK)
  const [loading, setLoading] = useState(true)

  const canUseSupabase = useMemo(() => hasPublicSupabase() && !!user?.id, [user?.id])

  useEffect(() => {
    let cancelled = false

    async function run() {
      try {
        // Session cache first (fast, avoids repeat AI calls)
        const cached = sessionStorage.getItem(SESSION_KEY)
        if (cached) {
          const parsed = JSON.parse(cached) as WritingSparkState
          if (!cancelled && parsed?.text) {
            setState(parsed)
            setLoading(false)
            return
          }
        }

        // If Supabase isn't available, keep a high-quality fallback (no slow timeouts)
        if (!canUseSupabase) {
          if (!cancelled) setLoading(false)
          return
        }

        const pinned = await getPinnedNotes(user!.id)
        const input = analyzeOntologyForWritingSpark(pinned)

        const res = await fetch('/api/ontology/writing-spark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })

        if (!res.ok) {
          if (!cancelled) {
            const next = { ...FALLBACK, input }
            setState(next)
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
            setLoading(false)
          }
          return
        }

        const data = (await res.json()) as { ok: boolean; text?: string }
        const text = data?.text?.trim() || FALLBACK.text
        const next = { text, input }

        if (!cancelled) {
          setState(next)
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(next))
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
  }, [canUseSupabase, user])

  return { ...state, loading }
}


