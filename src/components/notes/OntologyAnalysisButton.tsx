'use client'

/**
 * Ontology Analysis Button Component
 * Story 2.4: AI Personal Ontology Extraction
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Note } from '@/types/note'
import { getNotes, updateNote } from '@/lib/notes'
import { ExtractionResult } from '@/utils/ontologyPrompts'
import { sampleJournalEntries } from '@/data/sampleEntries'

interface OntologyAnalysisButtonProps {
  onComplete?: () => void
}

export function OntologyAnalysisButton({
  onComplete
}: OntologyAnalysisButtonProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)

    try {
      // 1. Get all notes from localStorage
      const allNotes = getNotes()

      // 2. Convert journal entries to Note format
      const journalNotes: Note[] = sampleJournalEntries.map(entry => ({
        id: entry.id,
        userId: '',
        title: `Journal Entry - ${entry.date}`,
        content: entry.content,
        noteType: 'journal-entry' as const,
        isPinned: false,
        metadata: {},
        createdAt: entry.lastModified,
        updatedAt: entry.lastModified
      }))

      // 3. Combine notes and journal entries
      const allContent = [...allNotes, ...journalNotes]

      // 4. Filter to analyzable notes (exclude ontology notes)
      const notesToAnalyze = allContent.filter(
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
      const currentNotes = getNotes()

      // Update Values card
      const valuesCard = currentNotes.find(n => n.id === 'pinned-values')
      if (valuesCard && extraction.values.length > 0) {
        const valuesList = extraction.values
          .map(v => `• ${v.text}\n  ${v.reasoning}`)
          .join('\n\n')
        updateNote('pinned-values', { content: valuesList })
      }

      // Update Beliefs card
      const beliefsCard = currentNotes.find(n => n.id === 'pinned-beliefs')
      if (beliefsCard && extraction.beliefs.length > 0) {
        const beliefsList = extraction.beliefs
          .map(b => `• ${b.text}\n  ${b.reasoning}`)
          .join('\n\n')
        updateNote('pinned-beliefs', { content: beliefsList })
      }

      // Update Aims card
      const aimsCard = currentNotes.find(n => n.id === 'pinned-aims')
      if (aimsCard && extraction.aims.length > 0) {
        const aimsList = extraction.aims
          .map(a => `• ${a.text}\n  ${a.reasoning}`)
          .join('\n\n')
        // Aims uses JSON format
        updateNote('pinned-aims', {
          content: JSON.stringify({ todos: '', goals: aimsList })
        })
      }

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
