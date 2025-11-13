'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
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
  // Story 2.4.7: Track unread note IDs for highlighting
  const [unreadNoteIds, setUnreadNoteIds] = useState<Set<string>>(new Set())

  const loadNotes = async () => {
    if (!user) return
    setPinnedNotes(await getPinnedNotes(user.id))
  }

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

  // Story 2.4.7: Fetch unread updates for highlighting with realtime subscription
  useEffect(() => {
    if (!user) {
      setUnreadNoteIds(new Set())
      return
    }

    const fetchUnreadUpdates = async () => {
      const { data, error } = await supabase
        .from('ontology_updates')
        .select('note_id')
        .eq('user_id', user.id)
        .is('viewed_at', null)

      if (!error && data) {
        setUnreadNoteIds(new Set(data.map((u) => u.note_id)))
      } else if (error) {
        console.error('[OntologyPage] Error fetching unread updates:', error)
      }
    }

    // Fetch initial unread updates
    fetchUnreadUpdates()

    // Subscribe to real-time changes on ontology_updates table
    // This ensures new updates are highlighted immediately after analysis completes
    const channel = supabase
      .channel(`ontology-highlights-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'ontology_updates',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[OntologyPage] Realtime event for highlights:', payload)
          // Refetch unread IDs on any change to ontology_updates
          fetchUnreadUpdates()
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Story 2.4.7: Mark updates as viewed when user leaves page
  useEffect(() => {
    return () => {
      // Cleanup: mark all updates as viewed when user navigates away
      if (user && unreadNoteIds.size > 0) {
        fetch('/api/ontology/mark-viewed', {
          method: 'POST',
          credentials: 'include',
        }).catch((error) => {
          console.error('[OntologyPage] Error marking updates as viewed:', error)
        })
      }
    }
  }, [user, unreadNoteIds])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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
                isNew={unreadNoteIds.has(note.id)} // Story 2.4.7: Highlight new items
              />
            )
          })}
        </div>
      </section>
    </div>
  )
}
