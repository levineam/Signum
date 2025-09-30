'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getNoteById, updateNote } from '@/lib/notes'
import { Note } from '@/types/note'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'

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

        if (loadedNote.type === 'aims') {
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

    const newContent = note.type === 'aims'
      ? JSON.stringify(aimsContent)
      : content

    const updated = updateNote(note.id, { content: newContent })
    if (updated) {
      setNote(updated)
    }
  }

  const handleBack = () => {
    router.push('/')
    // Small delay to ensure state updates before navigation
    setTimeout(() => {
      // Trigger section change via URL state or event
      window.dispatchEvent(new CustomEvent('navigate-to-notes'))
    }, 0)
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
  const isOntologyNote = note.type === 'values' || note.type === 'beliefs' || note.type === 'aims'

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
        {note.type === 'aims' ? (
          <>
            {/* Todos Section */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Todos</h2>
              {aimsContent.todos ? (
                <div className="min-h-[200px] p-4 rounded-md border bg-muted/30 whitespace-pre-wrap">
                  {aimsContent.todos}
                </div>
              ) : (
                <div className="min-h-[200px] p-4 rounded-md border bg-muted/30 text-muted-foreground italic">
                  No todos extracted yet. Keep journaling to populate this automatically.
                </div>
              )}
            </div>

            {/* Goals Section */}
            <div>
              <h2 className="text-xl font-semibold mb-3">Goals</h2>
              {aimsContent.goals ? (
                <div className="min-h-[200px] p-4 rounded-md border bg-muted/30 whitespace-pre-wrap">
                  {aimsContent.goals}
                </div>
              ) : (
                <div className="min-h-[200px] p-4 rounded-md border bg-muted/30 text-muted-foreground italic">
                  No goals extracted yet. Keep journaling to populate this automatically.
                </div>
              )}
            </div>
          </>
        ) : isOntologyNote ? (
          // Read-only display for Values and Beliefs
          content ? (
            <div className="min-h-[400px] p-4 rounded-md border bg-muted/30 whitespace-pre-wrap">
              {content}
            </div>
          ) : (
            <div className="min-h-[400px] p-4 rounded-md border bg-muted/30 text-muted-foreground italic">
              No {note.title.toLowerCase()} extracted yet. Keep journaling to populate this automatically.
            </div>
          )
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