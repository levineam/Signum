'use client'

/**
 * Ontology Analysis Button Component
 * Story 2.4: AI Personal Ontology Extraction
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getNotes, updateNote, getPinnedNotes } from '@/lib/notes'
import { ExtractionResult } from '@/utils/ontologyPrompts'
import { useAuth } from '@/contexts/AuthContext'

interface OntologyAnalysisButtonProps {
  onComplete?: () => void
}

export function OntologyAnalysisButton({
  onComplete
}: OntologyAnalysisButtonProps) {
  const { user } = useAuth()
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!user) {
      toast.error('Please sign in to analyze your ontology')
      return
    }

    setIsAnalyzing(true)

    try {
      // 1. Get all notes from Supabase
      const allNotes = await getNotes(user.id)

      // 2. Filter to analyzable notes (exclude ontology notes)
      const notesToAnalyze = allNotes.filter(
        (note) =>
          note.noteType === 'custom' ||
          note.noteType === 'journal-entry' ||
          note.noteType === 'reflection'
      )

      // 5. Check minimum threshold
      if (notesToAnalyze.length < 5) {
        toast.error('Need at least 5 notes for meaningful extraction', {
          description: 'Keep journaling to build your ontology!'
        })
        setIsAnalyzing(false)
        return
      }

      // 6. Call API
      const response = await fetch('/api/extract-ontology', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: notesToAnalyze
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || 'Extraction failed')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Extraction failed')
      }

      // 7. Store results by updating the 3 pinned ontology cards
      const extraction: ExtractionResult = result.extraction

      // Fetch actual pinned notes to get their real Supabase UUIDs
      const pinnedNotes = await getPinnedNotes(user.id)
      const valuesNote = pinnedNotes.find(n => n.noteType === 'ontology-value')
      const beliefsNote = pinnedNotes.find(n => n.noteType === 'ontology-belief')
      const aimsNote = pinnedNotes.find(n => n.noteType === 'ontology-aim')

      if (!valuesNote || !beliefsNote || !aimsNote) {
        throw new Error('Pinned ontology notes not found. Try refreshing the page.')
      }

      // Update Values card - store structured data in metadata
      // Always update, even if empty, to prevent stale metadata
      await updateNote(valuesNote.id, {
        content: '', // Keep empty - data is in metadata
        metadata: {
          items: extraction.values.map(v => ({
            name: v.text,
            confidence: v.confidence,
            excerpts: v.sourceExcerpts
          }))
        }
      }, user.id)

      // Update Beliefs card - always update to prevent stale metadata
      await updateNote(beliefsNote.id, {
        content: '',
        metadata: {
          items: extraction.beliefs.map(b => ({
            name: b.text,
            confidence: b.confidence,
            excerpts: b.sourceExcerpts
          }))
        }
      }, user.id)

      // Update Aims card - always update to prevent stale metadata
      await updateNote(aimsNote.id, {
        content: '',
        metadata: {
          items: extraction.aims.map(a => ({
            name: a.text,
            confidence: a.confidence,
            excerpts: a.sourceExcerpts
          }))
        }
      }, user.id)

      // 8. Show success message
      const { counts } = result
      toast.success('Ontology updated!', {
        description: `Analyzed ${notesToAnalyze.length} entries. Found ${counts.values} values, ${counts.beliefs} beliefs, ${counts.aims} aims`
      })

      // 9. Trigger refresh
      onComplete?.()
    } catch (error) {
      console.error('Analysis failed:', error)
      toast.error('Extraction failed', {
        description:
          error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Button
      onClick={handleAnalyze}
      disabled={isAnalyzing}
      className="gap-2"
      size="lg"
    >
      {isAnalyzing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Analyze My Notes
        </>
      )}
    </Button>
  )
}
