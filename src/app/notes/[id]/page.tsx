'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getNoteById, updateNote, deleteNote } from '@/lib/notes'
import { Note, getNoteDisplayTitle } from '@/types/note'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Trash2 } from 'lucide-react'
import { OntologyCardViewer } from '@/components/notes/OntologyCardViewer'
import { useAuth } from '@/contexts/AuthContext'
import { SimpleRichEditor } from '@/components/editor/SimpleRichEditor'
import { NoteCreationModal } from '@/components/notes/NoteCreationModal'
import { NoteViewer } from '@/components/notes/NoteViewer'
import { createLink } from '@/lib/supabase/notes'
import { convertTextToLink, captureSelectionMetadata } from '@/utils/textToLink'
import { toast } from 'sonner'
import { sanitizeHtml, useDOMPurifyReady } from '@/utils/sanitizeHtml'
import { Sidebar } from '@/components/layout/Sidebar'
import { AppHeader } from '@/components/layout/AppHeader'

export default function NoteEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user } = useAuth()
  const isDOMPurifyReady = useDOMPurifyReady()
  const [note, setNote] = useState<Note | null>(null)
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const editorRef = useRef<HTMLElement | null>(null)
  const selectionMetadataRef = useRef<ReturnType<typeof captureSelectionMetadata> | null>(null)

  // Refs to track latest values for cleanup effects
  const noteRef = useRef<Note | null>(null)
  const userRef = useRef(user)
  const contentRef = useRef(content)

  // Sync refs with latest state values
  useEffect(() => {
    noteRef.current = note
  }, [note])

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    contentRef.current = content
  }, [content])

  // Sidebar state
  const [activeSection, setActiveSection] = useState('notes')

  // Make Note functionality
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [creatingLink, setCreatingLink] = useState(false)

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

        // Always set content (including for ontology notes which display via OntologyCardViewer)
        setContent(loadedNote.content)
      }
      setIsLoading(false)
    }
    loadNote()
  }, [params, user])

  // Cleanup: Flush pending autosave before unmount
  // Use empty dependency array so cleanup only runs on unmount, not on every keystroke
  useEffect(() => {
    return () => {
      // If there's a pending save when component unmounts, execute it immediately
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)

        // Flush the save immediately if there's unsaved content
        // Access latest values via refs (not closure) to get current state at cleanup time
        const latestNote = noteRef.current
        const latestUser = userRef.current

        if (latestNote && latestUser) {
          // Get the latest content from the specific editor ref (not generic querySelector)
          // This ensures we read from the correct editor if multiple exist (e.g., NoteViewer modal)
          const currentContent = editorRef.current?.innerHTML || contentRef.current
          if (currentContent !== latestNote.content) {
            updateNote(latestNote.id, { content: currentContent }, latestUser.id).catch(error => {
              console.error('Error flushing autosave on unmount:', error)
            })
          }
        }
      }
    }
  }, []) // Empty array - cleanup only runs on unmount

  // Handle browser close/navigation: Flush pending save before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      // If there's a pending save timeout, clear it and save immediately
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)

        // Access latest values via refs (not closure) to get current state at unload time
        const latestNote = noteRef.current
        const latestUser = userRef.current

        // Get the latest content from the specific editor ref (not generic querySelector)
        // This ensures we read from the correct editor if multiple exist (e.g., NoteViewer modal)
        const currentContent = editorRef.current?.innerHTML || contentRef.current
        if (latestNote && latestUser && currentContent !== latestNote.content) {
          // Attempt to save before page unloads
          updateNote(latestNote.id, { content: currentContent }, latestUser.id).catch(error => {
            console.error('Error flushing autosave on page unload:', error)
          })
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, []) // Empty array - register once on mount

  // Auto-save with debounce (like JournalStream.tsx:266-282)
  const handleContentChange = (newContent: string) => {
    if (!note || !user) return

    // Don't override content changes while we're creating a link
    if (creatingLink) {
      return
    }

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

    // Cache editor element BEFORE opening modal to prevent "editor not found" error
    // Modal opening causes editor to blur (onBlur sets isEditing=false), removing contenteditable from DOM
    const editorElement = document.querySelector('[contenteditable="true"]') as HTMLElement
    if (editorElement) {
      editorRef.current = editorElement
      console.log('💾 Cached editor element before modal open')

      // CRITICAL: Capture selection metadata NOW, while selection is still active
      // After modal opens and editor blurs, window.getSelection() is lost and
      // captureSelectionMetadata falls back to indexOf(), which finds the FIRST
      // occurrence of the text, not the one the user actually selected
      const metadata = captureSelectionMetadata(editorElement, text)
      selectionMetadataRef.current = metadata
      console.log('📍 Captured selection metadata before blur:', metadata)
    } else {
      console.warn('⚠️ No contenteditable element found when caching')
    }

    setShowNoteModal(true)
  }

  const handleCloseNoteModal = () => {
    setShowNoteModal(false)
    setSelectedText('')
    selectionMetadataRef.current = null // Clear cached metadata
  }

  const handleNoteCreated = async (newNote: Note) => {
    if (!note || !selectedText || !user) {
      console.log('❌ Missing note, selectedText, or user', { note, selectedText, user: !!user })
      return
    }

    console.log('📝 Creating note link', { selectedText, noteId: newNote.id, sourceNoteId: note.id })

    // Clear any pending autosave to prevent stale content from overwriting the link
    if (saveTimeoutRef.current) {
      console.log('🛑 Clearing pending autosave timeout before link creation')
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }

    // Set flag to prevent content change interference
    setCreatingLink(true)

    // Use cached editor element (cached in handleMakeNote before modal opened)
    const editorElement = editorRef.current

    // Hard fail with toast if editor missing (shouldn't happen if properly cached)
    if (!editorElement) {
      console.error('❌ No cached editor element - modal may have opened before caching')
      toast.error('Failed to create link: editor not found. Please try again.')
      setCreatingLink(false)
      return
    }

    console.log('✅ Using cached editor element')

    try {
      // Use cached selection metadata (captured in handleMakeNote before blur)
      // This ensures we link the CORRECT occurrence when text appears multiple times
      const metadata = selectionMetadataRef.current
      console.log('📊 Using cached selection metadata:', metadata)

      // Create link in Supabase with metadata
      const link = await createLink({
        sourceNoteId: note.id,
        targetNoteId: newNote.id,
        linkType: 'created_from',
        metadata: metadata || undefined
      }, user.id)
      console.log('💾 Link created in Supabase:', link)

      // Convert the selected text to a link in the DOM with linkId
      // Pass metadata to ensure we link the CORRECT occurrence (not just the first one via indexOf)
      const linkCreated = convertTextToLink(editorElement, selectedText, newNote.id, link.id, handleLinkClick, metadata)

      if (!linkCreated) {
        console.error('❌ Failed to create link in editor')
        toast.error('Failed to create link in editor. Please try again.')
        setCreatingLink(false)
        return
      }

      console.log('🔗 Created link in editor DOM')

      // Read the updated HTML from the editor after the link was created
      // Wait for DOM to settle, then read the actual content
      setTimeout(() => {
        const updatedContent = editorElement.innerHTML
        console.log('📄 Read updated content from editor after link creation')

        // Update state with the content that includes the link
        setContent(updatedContent)
        setNote(prev => prev ? { ...prev, content: updatedContent } : null)

        // Persist the linked content to Supabase
        updateNote(note.id, { content: updatedContent }, user.id)
          .then(() => {
            console.log('💾 Persisted link to Supabase')
            toast.success('Note created and linked successfully!')
          })
          .catch(error => {
            console.error('Error persisting link to Supabase:', error)
            toast.error('Failed to save link. Please try again.')
          })

        // Reset the creating link flag after a brief delay to ensure state updates complete
        setTimeout(() => {
          setCreatingLink(false)
        }, 100)
      }, 50)
    } catch (error) {
      console.error('❌ Error in handleNoteCreated:', error)
      toast.error('Failed to create linked note. Please try again.')
      setCreatingLink(false)
    }
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

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    if (section === 'journal') {
      router.push('/')
    } else if (section === 'ontology') {
      router.push('/ontology')
    } else if (section === 'notes') {
      router.push('/notes')
    } else {
      router.push('/')
    }
  }

  const handleDelete = async () => {
    if (!note || !user) return

    const confirmed = window.confirm(`Are you sure you want to delete "${note.title}"? This action cannot be undone.`)
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const success = await deleteNote(note.id, user.id)
      if (success) {
        // Navigate back to notes page after successful deletion
        router.push('/notes')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
    } finally {
      setIsDeleting(false)
    }
  }
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
        <main className="lg:pl-64">
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <div className="flex-1">
              <div className="max-w-3xl mx-auto p-6">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
        <main className="lg:pl-64">
          <div className="flex min-h-screen flex-col">
            <AppHeader />
            <div className="flex-1">
              <div className="max-w-3xl mx-auto p-6">
                <div className="text-center py-12">
                  <h2 className="text-2xl font-semibold mb-2">Note Not Found</h2>
                  <p className="text-muted-foreground">This note could not be found.</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Check if this is an AI-populated ontology note (read-only)
  // Support both old (type) and new (noteType) field names during migration
  const noteType = 'type' in note ? (note as { type: string }).type : note.noteType
  const isOntologyNote = noteType === 'values' || noteType === 'beliefs' || noteType === 'aims' ||
    noteType === 'ontology-value' || noteType === 'ontology-belief' || noteType === 'ontology-aim'

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      <main className="lg:pl-64">
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <div className="flex-1">
            <div className="max-w-3xl mx-auto p-6">
      {/* Note Title with Delete Button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{getNoteDisplayTitle(note)}</h1>
        {!isOntologyNote && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-destructive hover:text-destructive"
            aria-label="Delete note"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        )}
      </div>

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
                    isDOMPurifyReady ? (
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
                      <div className="text-muted-foreground">Loading content...</div>
                    )
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
          </div>
        </div>
      </main>
    </div>
  )
}