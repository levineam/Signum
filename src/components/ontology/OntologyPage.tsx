'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { initializePinnedNotes, getPinnedNotes } from '@/lib/notes'
import { Note } from '@/types/note'
import { OntologyAnalysisButton } from '../notes/OntologyAnalysisButton'
import { ExpandableOntologyRow } from './ExpandableOntologyRow'
import { useAuth } from '@/contexts/AuthContext'

// Helper: SSR-safe localStorage access
function getStoredExpanded(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const stored = localStorage.getItem('ontology-expanded')
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

export function OntologyPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [pinnedNotes, setPinnedNotes] = useState<Note[]>([])
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [isHydrated, setIsHydrated] = useState(false)

  const loadNotes = useCallback(async () => {
    if (!user) return
    setPinnedNotes(await getPinnedNotes(user.id))
  }, [user])

  // Hydrate expansion state from URL params and localStorage
  // CRITICAL: URL params ALWAYS override localStorage
  useEffect(() => {
    const urlParam = searchParams.get('expanded')
    const urlExpanded = urlParam?.split(',').filter(Boolean) || []

    if (urlExpanded.length > 0) {
      // URL params present: use ONLY URL params (ignore localStorage)
      setExpandedCards(new Set(urlExpanded))
    } else {
      // No URL params: restore from localStorage
      const stored = getStoredExpanded()
      setExpandedCards(stored)
    }

    setIsHydrated(true)
  }, [searchParams])

  // Persist expansion state to localStorage
  useEffect(() => {
    if (!isHydrated) return // Skip initial render to avoid race
    if (typeof window !== 'undefined') {
      localStorage.setItem('ontology-expanded', JSON.stringify([...expandedCards]))
    }
  }, [expandedCards, isHydrated])

  useEffect(() => {
    if (!user) {
      // Clear notes when user signs out to prevent data leakage
      setPinnedNotes([])
      return
    }

    // Initialize pinned notes if they don't exist, then load all notes
    (async () => {
      await initializePinnedNotes(user.id)
      await loadNotes()
    })()
  }, [user, loadNotes])

  const toggleCard = (category: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  // Sort notes to ensure consistent order: Values, Beliefs, Goals
  const sortedNotes = [...pinnedNotes].sort((a, b) => {
    const order = { 'ontology-value': 0, 'ontology-belief': 1, 'ontology-aim': 2 }
    return (order[a.noteType as keyof typeof order] || 999) - (order[b.noteType as keyof typeof order] || 999)
  })

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Ontology Cards Section */}
      <section>
        <div className="flex items-center justify-end mb-4">
          <OntologyAnalysisButton onComplete={loadNotes} />
        </div>

        {/* Expandable rows stacked vertically */}
        <div className="space-y-4">
          {sortedNotes.map((note) => {
            const category = note.noteType.replace('ontology-', '')
            return (
              <ExpandableOntologyRow
                key={note.id}
                note={note}
                isExpanded={expandedCards.has(category)}
                onToggle={() => toggleCard(category)}
                onItemsUpdated={loadNotes}
              />
            )
          })}
        </div>
      </section>
    </div>
  )
}
