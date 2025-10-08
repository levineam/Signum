'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SimpleRichEditor } from '@/components/editor/SimpleRichEditor'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, BookOpen, X, RefreshCw } from 'lucide-react'
import { getNextPrompt, dismissPromptForSession } from '@/utils/journalPrompts'
import { NoteCreationModal } from '@/components/notes/NoteCreationModal'
import { NoteViewer } from '@/components/notes/NoteViewer'
import { Note } from '@/types/note'
import { createLink } from '@/lib/supabase/notes'
import { convertTextToLink, captureSelectionMetadata } from '@/utils/textToLink'
import { getNotes, createNote, updateNote as updateNoteInDb } from '@/lib/notes'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface JournalEntry {
  id: string
  date: string  // YYYY-MM-DD format
  content: string
  lastModified: string
  isSample?: boolean
}

// Helper: Get today's date in local timezone as YYYY-MM-DD
function getLocalDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function JournalStream() {
  const router = useRouter()
  const { user } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [currentPrompt, setCurrentPrompt] = useState<string>('')
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [currentEditingEntry, setCurrentEditingEntry] = useState<string | null>(null)
  const [showNoteViewer, setShowNoteViewer] = useState(false)
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null)
  const [noteLinkClicked, setNoteLinkClicked] = useState(false)
  const [creatingLink, setCreatingLink] = useState(false)

  // Cache editor element reference before opening modal (Phase 1 bug fix)
  const cachedEditorRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Load journal entries from Supabase
    async function loadEntries() {
      if (!user) {
        console.log('[JournalStream] No user, clearing entries')
        // Clear entries and reset loading state when user signs out
        setEntries([])
        setIsLoading(false)
        return
      }

      console.log('[JournalStream] Starting to load entries for user:', user.id)

      try {
        const today = getLocalDateString() // Use local date instead of UTC
        console.log('[JournalStream] Today\'s date:', today)

        // Get all notes from Supabase
        console.log('[JournalStream] Fetching notes from Supabase...')
        const allNotes = await getNotes(user.id)
        console.log('[JournalStream] Fetched notes:', allNotes.length)

        // Filter to journal entries only
        const journalNotes = allNotes.filter(note => note.noteType === 'journal-entry')

        // Convert Note format to JournalEntry format
        const journalEntries: JournalEntry[] = journalNotes.map(note => {
          // Safely handle metadata (can be null for legacy notes)
          const meta = note.metadata || {}
          const journalDate = (meta as { journalDate?: string }).journalDate
          const isSample = (meta as { isSample?: boolean }).isSample

          return {
            id: note.id,
            date: journalDate || note.createdAt.split('T')[0],
            content: note.content,
            lastModified: note.updatedAt,
            isSample: Boolean(isSample)
          }
        })

        // Check if today's entry exists
        const todayEntry = journalEntries.find(e => e.date === today)
        console.log('[JournalStream] Today entry exists?', !!todayEntry)

        let initialEntries: JournalEntry[] = journalEntries
        if (!todayEntry) {
          // Create today's entry if it doesn't exist
          console.log('[JournalStream] Creating today\'s entry...')
          const newNote = await createNote({
            title: `Journal Entry - ${today}`,
            content: '',
            noteType: 'journal-entry',
            metadata: { journalDate: today }
          }, user.id)
          console.log('[JournalStream] Created new note:', newNote.id)

          const newTodayEntry: JournalEntry = {
            id: newNote.id,
            date: today,
            content: '',
            lastModified: newNote.createdAt
          }
          initialEntries = [newTodayEntry, ...journalEntries]
        }

        // Phase 2: Link rehydration will be implemented here
        // For now, links already in HTML (with data-link-id) will remain functional
        console.log('[JournalStream] Setting entries:', initialEntries.length)
        setEntries(initialEntries)
        setIsLoading(false)
        console.log('[JournalStream] Load complete')
      } catch (error) {
        console.error('[JournalStream] Error loading journal entries:', error)
        // Set safe fallback state - show empty array on error
        setEntries([])
        setIsLoading(false)
        // Optionally show user-facing error message
        // toast.error('Failed to load journal entries. Please refresh the page.')
      }
    }

    // Safely invoke async function
    loadEntries().catch(error => {
      console.error('Unhandled error in loadEntries:', error)
      setEntries([])
      setIsLoading(false)
    })

    // Initialize prompt display - always get a new prompt on page reload
    // Clear any previous dismissal since we want new prompt on each page load
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('prompt-dismissed')
    }

    const newPrompt = getNextPrompt()
    setCurrentPrompt(newPrompt)
    setShowPrompt(true)
  }, [user])

  const handleContentChange = (entryId: string, newContent: string) => {
    // Don't override content changes while we're creating a link
    if (creatingLink) {
      return
    }

    // Get current entry to check if content actually changed
    const currentEntry = entries.find(e => e.id === entryId)
    if (currentEntry && currentEntry.content === newContent) {
      return // No change, don't trigger saves
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Update content immediately for responsive UI
    setEntries(prev => prev.map(entry =>
      entry.id === entryId
        ? { ...entry, content: newContent, lastModified: new Date().toISOString() }
        : entry
    ))

    // Auto-save after 2 seconds of no typing (longer delay to reduce noise)
    saveTimeoutRef.current = setTimeout(async () => {
      const previousContent = currentEntry?.content || ''

      // Save if content is non-empty OR if we're clearing previously non-empty content
      const shouldSave = newContent.trim() !== '' || previousContent.trim() !== ''

      if (shouldSave && user) {
        console.log('Auto-saving entry:', entryId)
        try {
          // Update the note in Supabase
          await updateNoteInDb(entryId, { content: newContent }, user.id)
        } catch (error) {
          console.error('Error auto-saving journal entry:', error)
        }
      }
    }, 2000)
  }

  const handlePromptDismiss = () => {
    setShowPrompt(false)
    dismissPromptForSession()
  }

  const handlePromptRefresh = () => {
    const newPrompt = getNextPrompt()
    setCurrentPrompt(newPrompt)
  }

  const handleMakeNote = (selectedText: string) => {
    setSelectedText(selectedText)
    setCurrentEditingEntry(editingEntryId)

    // Phase 1 bug fix: Cache editor element BEFORE opening modal
    // Modal opening causes entry to exit edit mode, losing contenteditable
    if (editingEntryId) {
      const editorElement = document.querySelector(`[data-entry-id="${editingEntryId}"] [contenteditable]`) as HTMLElement
      cachedEditorRef.current = editorElement
      console.log('💾 Cached editor element:', !!editorElement)
    }

    setShowNoteModal(true)
  }

  const handleNoteCreated = async (note: Note) => {
    if (!currentEditingEntry || !selectedText || !user) {
      console.log('❌ Missing currentEditingEntry, selectedText, or user', { currentEditingEntry, selectedText, user: !!user })
      return
    }

    console.log('📝 Creating note link', { selectedText, noteId: note.id, entryId: currentEditingEntry })

    // Set flag to prevent content change interference
    setCreatingLink(true)

    // Phase 1 bug fix: Use cached editor ref and re-enter edit mode if needed
    let editorElement = cachedEditorRef.current

    // If cached ref is stale, try to find editor and re-enter edit mode
    if (!editorElement || !document.contains(editorElement)) {
      console.log('⚠️ Cached editor stale, re-entering edit mode')

      // Re-enter edit mode
      setEditingEntryId(currentEditingEntry)

      // Wait for edit mode to be active
      await new Promise(resolve => setTimeout(resolve, 100))

      // Try to find editor again
      editorElement = document.querySelector(`[data-entry-id="${currentEditingEntry}"] [contenteditable]`) as HTMLElement
    }

    // Hard fail with toast if editor still missing
    if (!editorElement) {
      console.error('❌ Could not find editor element after re-entry attempt')
      toast.error('Failed to create link: editor not found. Please try again.')
      setCreatingLink(false)
      cachedEditorRef.current = null
      return
    }

    try {
      // Phase 1: Capture metadata BEFORE DOM manipulation
      const metadata = captureSelectionMetadata(editorElement, selectedText)
      console.log('📊 Captured selection metadata:', metadata)

      // Phase 1: Create link in Supabase with metadata
      const link = await createLink({
        sourceNoteId: currentEditingEntry,
        targetNoteId: note.id,
        linkType: 'created_from',
        metadata: metadata || undefined
      }, user.id)
      console.log('💾 Link created in Supabase:', link)

      // Convert the selected text to a link in the DOM with linkId
      const linkCreated = convertTextToLink(editorElement, selectedText, note.id, link.id, handleLinkClick)

      if (!linkCreated) {
        console.error('❌ Failed to create link in editor')
        setCreatingLink(false)
        return
      }

      console.log('🔗 Created link in editor DOM')

      // Now read the updated HTML from the editor after the link was created
      // Wait for DOM to settle, then read the actual content
      setTimeout(() => {
        const updatedContent = editorElement.innerHTML
        console.log('📄 Read updated content from editor after link creation')

        // Update state with the content that includes the link at the correct position
        setEntries(prev => prev.map(entry => {
          if (entry.id === currentEditingEntry) {
            return { ...entry, content: updatedContent, lastModified: new Date().toISOString() }
          }
          return entry
        }))

        // Persist the linked content to Supabase
        updateNoteInDb(currentEditingEntry, { content: updatedContent }, user.id)
          .then(() => console.log('💾 Persisted link to Supabase'))
          .catch(error => console.error('Error persisting link to Supabase:', error))

        setCreatingLink(false)

        // Clear cached ref after successful link creation
        cachedEditorRef.current = null
      }, 50)
    } catch (error) {
      console.error('❌ Error creating link:', error)
      toast.error('Failed to create link. Please try again.')
      setCreatingLink(false)
      cachedEditorRef.current = null
    }
  }

  const handleLinkClick = (noteId: string) => {
    setNoteLinkClicked(true)
    setViewingNoteId(noteId)
    setShowNoteViewer(true)
    // Reset the flag after a short delay
    setTimeout(() => setNoteLinkClicked(false), 100)
  }

  const handleCloseNoteModal = () => {
    setShowNoteModal(false)
    setSelectedText('')
  }

  const handleCloseNoteViewer = () => {
    setShowNoteViewer(false)
    setViewingNoteId(null)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00') // Ensure consistent date parsing
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.getTime() === today.getTime()) {
      return 'Today'
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  const isToday = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0]
    return dateStr === today
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Journal</h1>
        <p className="text-muted-foreground">Your thoughts, reflections, and daily insights</p>
      </div>

      {/* Gentle Prompt Element */}
      {showPrompt && currentPrompt && (
        <Card className="p-6 mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="relative">
            <p className="text-lg leading-relaxed text-amber-900 italic pr-20">
              {currentPrompt}
            </p>
            <div className="absolute top-0 right-0 flex gap-1">
              <button
                onClick={handlePromptRefresh}
                className="p-1 rounded-md hover:bg-amber-100 transition-colors"
                aria-label="Get new prompt"
              >
                <RefreshCw className="h-5 w-5 text-amber-600 hover:text-amber-800" />
              </button>
              <button
                onClick={handlePromptDismiss}
                className="p-1 rounded-md hover:bg-amber-100 transition-colors"
                aria-label="Dismiss prompt"
              >
                <X className="h-5 w-5 text-amber-600 hover:text-amber-800" />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Journal Entries - One per day */}
      <div className="space-y-4">
        {!user ? (
          <Card className="p-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-4">Sign in to start journaling</h3>
              <Button onClick={() => router.push('/auth')}>
                Sign In
              </Button>
            </div>
          </Card>
        ) : isLoading ? (
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              Loading your journal...
            </div>
          </Card>
        ) : null}
        {entries.map((entry) => {
          const isEditingThis = editingEntryId === entry.id
          const isTodayEntry = isToday(entry.date)

          return (
            <Card
              key={entry.id}
              data-entry-id={entry.id}
              className={`p-6 bg-card transition-all ${
                isTodayEntry ? 'border-2 border-primary/20' : ''
              } ${
                isEditingThis ? 'ring-2 ring-primary/30' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span className="font-medium">{formatDate(entry.date)}</span>
                  {entry.isSample && (
                    <span className="text-xs px-2 py-1 bg-muted rounded-md ml-2">Sample</span>
                  )}
                </div>
                {entry.content && (
                  <span className="text-xs text-muted-foreground">
                    Last saved: {new Date(entry.lastModified).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                )}
              </div>

              <div
                onClick={() => setEditingEntryId(entry.id)}
                className="cursor-text hover:bg-muted/30 p-2 rounded-md transition-colors"
              >
                {isEditingThis ? (
                  <SimpleRichEditor
                    value={entry.content}
                    placeholder={isTodayEntry ? "What's on your mind today? Start writing..." : "Continue your thoughts..."}
                    onChange={(content) => handleContentChange(entry.id, content)}
                    onBlur={(e) => {
                      // Don't exit edit mode if the user clicked on a note link
                      if (noteLinkClicked) {
                        return
                      }
                      const relatedTarget = e.relatedTarget as HTMLElement
                      if (relatedTarget && relatedTarget.closest('a[data-note-id]')) {
                        return
                      }
                      setEditingEntryId(null)
                    }}
                    onMakeNote={handleMakeNote}
                    onFocus={() => {
                      // Phase 2: Link rehydration from Supabase will be implemented here
                      // For now, links already in HTML remain functional
                    }}
                    autoFocus
                  />
                ) : (
                  <div className="min-h-[100px]">
                    {entry.content ? (
                      <div
                        className="text-base leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: entry.content }}
                        onClick={(e) => {
                          // Handle link clicks in read-only mode
                          const target = e.target as HTMLElement

                          // Find the closest link element (in case click is on nested content)
                          const linkElement = target.closest('a[data-note-id]') as HTMLElement

                          console.log('🖱️ Read-only click:', {
                            targetTag: target.tagName,
                            linkElement: !!linkElement,
                            noteId: linkElement?.getAttribute('data-note-id')
                          })

                          if (linkElement) {
                            console.log('✅ Valid link click in read-only mode')
                            e.preventDefault()
                            e.stopPropagation()
                            const noteId = linkElement.getAttribute('data-note-id')
                            if (noteId) {
                              console.log('📱 Opening note viewer for:', noteId)
                              handleLinkClick(noteId)
                            }
                          }
                        }}
                      />
                    ) : (
                      <p className="text-muted-foreground italic">
                        {isTodayEntry ? "Click here to start today's entry..." : "Click to add to this day's entry..."}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

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