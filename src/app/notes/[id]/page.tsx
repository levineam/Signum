'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getNoteById, updateNote } from '@/lib/notes'
import { Note } from '@/types/note'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'
import { OntologyCardViewer } from '@/components/notes/OntologyCardViewer'

interface AimsContent {
  todos: string
  goals: string
}

export default function NoteEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [note, setNote] = useState<Note | null>(null)
  const [content, setContent] = useState('')
  const [aimsContent, setAimsContent] = useState<AimsContent>({ todos: '', goals: '' })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadNote() {
      const resolvedParams = await params
      const loadedNote = getNoteById(resolvedParams.id)
      if (loadedNote) {
        setNote(loadedNote)

        // Support both old (type) and new (noteType) field names during migration
        const noteType = 'type' in loadedNote ? (loadedNote as { type: string }).type : loadedNote.noteType
        if (noteType === 'aims' || noteType === 'ontology-aim') {
          try {
            const parsed = JSON.parse(loadedNote.content)
            setAimsContent(parsed)
          } catch {
            setAimsContent({ todos: '', goals: '' })
          }
        } else {
          setContent(loadedNote.content)
        }
      }
      setIsLoading(false)
    }
    loadNote()
  }, [params])

  const handleSave = () => {
    if (!note) return

    // Support both old (type) and new (noteType) field names during migration
    const noteType = 'type' in note ? (note as { type: string }).type : note.noteType
    const newContent = (noteType === 'aims' || noteType === 'ontology-aim')
      ? JSON.stringify(aimsContent)
      : content

    const updated = updateNote(note.id, { content: newContent })
    if (updated) {
      setNote(updated)
    }
  }

  const handleBack = () => {
    router.push('/notes')
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Notes
          </Button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold mb-2">Note Not Found</h2>
          <p className="text-muted-foreground">This note could not be found.</p>
        </div>
      </div>
    )
  }

  // Check if this is an AI-populated ontology note (read-only)
  // Support both old (type) and new (noteType) field names during migration
  const noteType = 'type' in note ? (note as { type: string }).type : note.noteType
  const isOntologyNote = noteType === 'values' || noteType === 'beliefs' || noteType === 'aims' ||
    noteType === 'ontology-value' || noteType === 'ontology-belief' || noteType === 'ontology-aim'

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header with Back Button */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Notes
        </Button>
        {!isOntologyNote && (
          <Button onClick={handleSave} size="sm">
            Save
          </Button>
        )}
      </div>

      {/* Note Title */}
      <h1 className="text-3xl font-bold mb-6">{note.title}</h1>

      {/* Ontology note description */}
      {isOntologyNote && (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-md px-4 py-3 mb-6">
          <p className="text-sm text-yellow-900 dark:text-yellow-100">
            This note is automatically updated as you write in your journal.
          </p>
        </div>
      )}

      {/* Editor Content */}
      <div className="space-y-6">
        {isOntologyNote ? (
          // Use OntologyCardViewer for Values, Beliefs, Aims
          <div className="min-h-[400px] p-6 rounded-md border bg-muted/30">
            <OntologyCardViewer note={note} />
          </div>
        ) : (
          // Editable for regular notes
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Write your ${note.title.toLowerCase()} here...`}
            className="min-h-[400px] resize-none"
            onBlur={handleSave}
          />
        )}
      </div>

      {/* Footer Instructions */}
      {!isOntologyNote && (
        <div className="mt-8 text-sm text-muted-foreground">
          <p>Changes are auto-saved when you click outside the text area or click Save.</p>
        </div>
      )}
    </div>
  )
}