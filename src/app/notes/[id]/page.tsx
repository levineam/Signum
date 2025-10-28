'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getNoteById, updateNote } from '@/lib/notes'
import { Note, getNoteDisplayTitle } from '@/types/note'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { OntologyCardViewer } from '@/components/notes/OntologyCardViewer'
import { useAuth } from '@/contexts/AuthContext'
import { SimpleRichEditor } from '@/components/editor/SimpleRichEditor'
import { NoteCreationModal } from '@/components/notes/NoteCreationModal'
import { NoteViewer } from '@/components/notes/NoteViewer'
import { sanitizeHtml } from '@/utils/sanitizeHtml'

export default function NoteEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user } = useAuth()
  const [note, setNote] = useState<Note | null>(null)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Make Note functionality
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedText, setSelectedText] = useState('')

  // Note Viewer functionality
  const [showNoteViewer, setShowNoteViewer] = useState(false)
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const userId = user.id // Capture user.id for closure

    async function loadNote() {
      const resolvedParams = await params

      // Get note from Supabase
      const loadedNote = await getNoteById(resolvedParams.id, userId)

      if (loadedNote) {
        setNote(loadedNote)
        // Set content for all note types
        setContent(loadedNote.content)
      }
      setIsLoading(false)
    }
    loadNote()
  }, [params, user])

  // Auto-save with debounce (like JournalStream.tsx:266-282)
  const handleContentChange = (newContent: string) => {
    if (!note || !user) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Update content immediately for responsive UI
    setContent(newContent)

    // Auto-save after 2 seconds of no typing
    saveTimeoutRef.current = setTimeout(async () => {
      const previousContent = note.content || ''

      // Save if content is non-empty OR if we're clearing previously non-empty content
      const shouldSave = newContent.trim() !== '' || previousContent.trim() !== ''

      if (shouldSave) {
        console.log('Auto-saving note:', note.id)
        try {
          const updated = await updateNote(note.id, { content: newContent }, user.id)
          if (updated) {
            setNote(updated)
          }
        } catch (error) {
          console.error('Error auto-saving note:', error)
        }
      }
    }, 2000)
  }

  // Make Note functionality
  const handleMakeNote = (text: string) => {
    setSelectedText(text)
    setShowNoteModal(true)
  }

  const handleCloseNoteModal = () => {
    setShowNoteModal(false)
    setSelectedText('')
  }

  const handleNoteCreated = (newNote: Note) => {
    // Note created successfully - could show toast notification here
    console.log('Sub-note created:', newNote)
  }

  // Note Viewer functionality
  const handleLinkClick = (noteId: string) => {
    setViewingNoteId(noteId)
    setShowNoteViewer(true)
  }

  const handleCloseNoteViewer = () => {
    setShowNoteViewer(false)
    setViewingNoteId(null)
  }

  const handleBack = () => {
    // Return to Ontology page for ontology notes, Notes page for others
    const noteType = 'type' in note! ? (note as { type: string }).type : note!.noteType
    const isOntology = noteType === 'values' || noteType === 'beliefs' || noteType === 'aims' ||
      noteType === 'ontology-value' || noteType === 'ontology-belief' || noteType === 'ontology-aim'

    if (isOntology) {
      router.push('/ontology')
    } else {
      router.push('/notes')
    }
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
          <Button variant="ghost" onClick={() => router.push('/notes')} className="gap-2">
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
  const backButtonLabel = isOntologyNote ? 'Back to Ontology' : 'Back to Notes'

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header with Back Button */}
      <div className="mb-6">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {backButtonLabel}
        </Button>
      </div>

      {/* Note Title */}
      <h1 className="text-3xl font-bold mb-6">{getNoteDisplayTitle(note)}</h1>

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
          // Use OntologyCardViewer for Values, Beliefs, Aims (read-only)
          <div className="min-h-[400px] p-6 rounded-md border bg-muted/30">
            <OntologyCardViewer note={note} />
          </div>
        ) : (
          // Rich text editor for regular notes - matches JournalStream.tsx pattern
          <Card className="p-6">
            <div
              onClick={() => setIsEditing(true)}
              className="cursor-text hover:bg-muted/30 p-2 rounded-md transition-colors"
            >
              {isEditing ? (
                <SimpleRichEditor
                  value={content}
                  placeholder={`Write your ${note.title.toLowerCase()} here...`}
                  onChange={handleContentChange}
                  onBlur={() => setIsEditing(false)}
                  onMakeNote={handleMakeNote}
                  autoFocus
                />
              ) : (
                <div className="min-h-[100px]">
                  {content ? (
                    <div
                      className="text-base leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
                      onClick={(e) => {
                        // Handle link clicks in read-only mode
                        const target = e.target as HTMLElement
                        const linkElement = target.closest('a[data-note-id]') as HTMLElement

                        if (linkElement) {
                          e.preventDefault()
                          e.stopPropagation()
                          const noteId = linkElement.getAttribute('data-note-id')
                          if (noteId) {
                            handleLinkClick(noteId)
                          }
                        }
                      }}
                    />
                  ) : (
                    <p className="text-muted-foreground italic">
                      Click here to start writing...
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Footer Instructions */}
      {!isOntologyNote && (
        <div className="mt-8 text-sm text-muted-foreground">
          <p>Changes are auto-saved 2 seconds after you stop typing.</p>
        </div>
      )}

      {/* Note Creation Modal */}
      <NoteCreationModal
        isOpen={showNoteModal}
        onClose={handleCloseNoteModal}
        initialTitle={selectedText}
        onNoteCreated={handleNoteCreated}
      />

      {/* Note Viewer Modal */}
      <NoteViewer
        isOpen={showNoteViewer}
        onClose={handleCloseNoteViewer}
        noteId={viewingNoteId}
      />
    </div>
  )
}