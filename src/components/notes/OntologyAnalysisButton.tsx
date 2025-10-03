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

      // Update Values card - store structured data in metadata
      if (extraction.values.length > 0) {
        updateNote('pinned-values', {
          content: '', // Keep empty - data is in metadata
          metadata: {
            items: extraction.values.map(v => ({
              name: v.text,
              confidence: v.confidence,
              excerpts: v.sourceExcerpts
            }))
          }
        })
      }

      // Update Beliefs card
      if (extraction.beliefs.length > 0) {
        updateNote('pinned-beliefs', {
          content: '',
          metadata: {
            items: extraction.beliefs.map(b => ({
              name: b.text,
              confidence: b.confidence,
              excerpts: b.sourceExcerpts
            }))
          }
        })
      }

      // Update Aims card
      if (extraction.aims.length > 0) {
        updateNote('pinned-aims', {
          content: '',
          metadata: {
            items: extraction.aims.map(a => ({
              name: a.text,
              confidence: a.confidence,
              excerpts: a.sourceExcerpts
            }))
          }
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
