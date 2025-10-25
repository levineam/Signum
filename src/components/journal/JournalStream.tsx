'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SimpleRichEditor } from '@/components/editor/SimpleRichEditor'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, BookOpen } from 'lucide-react'
import { NoteCreationModal } from '@/components/notes/NoteCreationModal'
import { NoteViewer } from '@/components/notes/NoteViewer'
import { Note } from '@/types/note'
import { createLink, getOutgoingLinks } from '@/lib/supabase/notes'
import { convertTextToLink, captureSelectionMetadata, rehydrateLinksFromMetadata } from '@/utils/textToLink'
import { getNotes, createNote, updateNote as updateNoteInDb, deleteNote } from '@/lib/notes'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { CbtDistortions } from '@/components/journal/helpers/CbtDistortions'
import { TaskCard } from '@/components/tasks/TaskCard'

interface JournalEntry {
  id: string
  date: string  // YYYY-MM-DD format
  content: string
  lastModified: string
  isSample?: boolean
}

interface ParsedTask {
  id: string
  title: string
  paragraphHash: string
  dueAt: string | null
  rrule: string | null
  status: 'pending' | 'accepted' | 'rejected'
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
  const { user, session } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const taskDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [currentEditingEntry, setCurrentEditingEntry] = useState<string | null>(null)
  const [showNoteViewer, setShowNoteViewer] = useState(false)
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null)
  const [noteLinkClicked, setNoteLinkClicked] = useState(false)
  const [creatingLink, setCreatingLink] = useState(false)
  const [entryTasks, setEntryTasks] = useState<Map<string, ParsedTask[]>>(new Map())

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

        // Clean up empty journal entries older than 24 hours (Issue #10, #67)
        const now = new Date()
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

        // Helper function to check if content is truly empty (handles HTML markup)
        const isContentEmpty = (html: string): boolean => {
          if (!html || html.trim() === '') return true
          // Create a temporary element to parse HTML and extract text
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = html
          const text = tempDiv.textContent || tempDiv.innerText || ''
          return text.trim() === ''
        }

        const emptyJournalEntries = allNotes.filter(note =>
          note.noteType === 'journal-entry' &&
          isContentEmpty(note.content) &&
          new Date(note.createdAt) < oneDayAgo
        )

        if (emptyJournalEntries.length > 0) {
          console.log(`[JournalStream] Cleaning up ${emptyJournalEntries.length} empty journal entries older than 24 hours`)
          await Promise.all(
            emptyJournalEntries.map(note => deleteNote(note.id, user.id))
          )
        }

        // Filter to journal entries only (excluding the ones we just deleted)
        const journalNotes = allNotes.filter(note =>
          note.noteType === 'journal-entry' &&
          !emptyJournalEntries.some(empty => empty.id === note.id)
        )

        // Convert Note format to JournalEntry format and restore tasks
        const tasksMap = new Map<string, ParsedTask[]>()
        const journalEntries: JournalEntry[] = journalNotes.map(note => {
          // Safely handle metadata (can be null for legacy notes)
          const meta = note.metadata || {}
          const journalDate = (meta as { journalDate?: string }).journalDate
          const isSample = (meta as { isSample?: boolean }).isSample
          const tasks = (meta as { tasks?: Array<{ id: string; paragraphHash: string; status: 'pending' | 'accepted' | 'rejected' }> }).tasks

          // Restore tasks for this entry
          if (tasks && tasks.length > 0) {
            tasksMap.set(note.id, tasks.map(t => ({
              id: t.id,
              title: '', // Will be fetched from tasks table via bulk API
              paragraphHash: t.paragraphHash,
              dueAt: null, // Will be fetched from tasks table if needed
              rrule: null,
              status: t.status
            })))
          }

          return {
            id: note.id,
            date: journalDate || note.createdAt.split('T')[0],
            content: note.content,
            lastModified: note.updatedAt,
            isSample: Boolean(isSample)
          }
        })

        // Restore tasks from metadata and fetch full details
        if (tasksMap.size > 0 && session?.access_token) {
          // Collect all task IDs
          const allTaskIds = Array.from(tasksMap.values()).flat().map(t => t.id)

          if (allTaskIds.length > 0) {
            try {
              // Fetch full task details (dueAt, rrule)
              const response = await fetch('/api/tasks/bulk', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({ taskIds: allTaskIds })
              })

              if (response.ok) {
                const { tasks } = await response.json()
                const taskDetailsMap = new Map(
                  tasks.map((t: { id: string; title: string; dueAt: string | null; rrule: string | null }) => [t.id, t])
                )

                // Merge task details with metadata, filtering out orphaned tasks
                // IMPORTANT: This filter prevents "ghost" UI elements when:
                // 1. Tasks are deleted from DB but metadata still references them
                // 2. Database cleanup removes tasks but note.metadata.tasks[] isn't updated
                // Without this filter, UI would display "Pending" TaskCards for non-existent tasks
                for (const [entryId, entryTaskList] of tasksMap.entries()) {
                  tasksMap.set(entryId, entryTaskList
                    .map(t => {
                      const details = taskDetailsMap.get(t.id) as { id: string; title: string; dueAt: string | null; rrule: string | null } | undefined
                      return {
                        ...t,
                        title: details?.title ?? '',
                        dueAt: details?.dueAt ?? null,
                        rrule: details?.rrule ?? null,
                        exists: !!details // Mark whether task exists in DB
                      }
                    })
                    .filter(t => t.exists) // Remove orphaned tasks that don't exist in DB
                  )
                }
              }
            } catch (error) {
              console.error('Failed to fetch task details:', error)
            }
          }
        }

        setEntryTasks(tasksMap)

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

        console.log('[JournalStream] Setting entries:', initialEntries.length)
        setEntries(initialEntries)
        setIsLoading(false)
        console.log('[JournalStream] Load complete')

        // Phase 2: Link rehydration - run after DOM updates
        // Use setTimeout to ensure entries are rendered in DOM before rehydration
        setTimeout(async () => {
          console.log('[JournalStream] Starting link rehydration...')

          for (const entry of initialEntries) {
            try {
              // Fetch outgoing links for this entry
              const links = await getOutgoingLinks(entry.id, user.id)

              if (links.length === 0) {
                continue
              }

              console.log(`[JournalStream] Entry ${entry.id} has ${links.length} links`)

              // Find the editor element for this entry
              const editorElement = document.querySelector(
                `[data-entry-id="${entry.id}"] [contenteditable]`
              ) as HTMLElement

              if (!editorElement) {
                console.warn(`[JournalStream] Could not find editor for entry ${entry.id}`)
                continue
              }

              // Rehydrate links in this entry
              const result = rehydrateLinksFromMetadata(
                editorElement,
                links.map(link => ({
                  id: link.id,
                  targetNoteId: link.targetNoteId,
                  metadata: link.metadata
                })),
                handleLinkClick
              )

              console.log(
                `[JournalStream] Entry ${entry.id}: ${result.rehydrated} rehydrated, ${result.skipped} skipped`
              )
            } catch (error) {
              console.error(`[JournalStream] Error rehydrating links for entry ${entry.id}:`, error)
            }
          }

          console.log('[JournalStream] Link rehydration complete')
        }, 100)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Only re-run when user ID changes (login/logout), not on user object updates

  // Save task metadata to note when tasks change (Story 1.2.1)
  useEffect(() => {
    if (!user) return

    const saveTaskMetadata = async () => {
      for (const [entryId, tasks] of entryTasks.entries()) {
        try {
          // Update note metadata with current tasks
          await updateNoteInDb(
            entryId,
            {
              metadata: {
                tasks: tasks.map(t => ({
                  id: t.id,
                  paragraphHash: t.paragraphHash,
                  status: t.status
                }))
              }
            },
            user.id
          )
        } catch (error) {
          console.error(`Failed to save task metadata for entry ${entryId}:`, error)
        }
      }
    }

    // Debounce to avoid excessive saves
    const timeout = setTimeout(saveTaskMetadata, 500)
    return () => clearTimeout(timeout)
  }, [entryTasks, user])

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

    // Clear existing timeouts
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    if (taskDetectionTimeoutRef.current) {
      clearTimeout(taskDetectionTimeoutRef.current)
    }

    // NOTE: We intentionally DON'T clear the processedParagraphs cache here
    // The cache prevents duplicate task creation even if user edits content
    // The deduplication_key in the database provides additional protection

    // Update content immediately for responsive UI
    setEntries(prev => prev.map(entry =>
      entry.id === entryId
        ? { ...entry, content: newContent, lastModified: new Date().toISOString() }
        : entry
    ))

    // Debounce task detection to avoid duplicate tasks while typing (Story 1.2)
    // Wait 3 seconds after user stops typing before detecting tasks
    taskDetectionTimeoutRef.current = setTimeout(() => {
      detectTasksInContent(newContent, entryId)
    }, 3000)

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

  // Task detection from journal paragraphs (Story 1.2)
  const processedParagraphs = useRef<Set<string>>(new Set())

  const detectTasksInContent = async (content: string, entryId: string) => {
    if (!user || !session?.access_token) return

    // Extract paragraphs from HTML content
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = content

    // Get all block-level elements (p, div, or split by br)
    // ContentEditable creates different structures in different browsers
    const blockElements = Array.from(tempDiv.querySelectorAll('p, div'))

    // Filter out container elements that have other block-level children
    // to avoid processing the same paragraph twice (e.g., <div><p>Task</p></div>)
    const leafParagraphs = blockElements.filter(el => {
      const hasBlockChildren = el.querySelector('p, div') !== null
      return !hasBlockChildren
    })

    // If no leaf paragraphs, treat whole content as one paragraph
    const paragraphs = leafParagraphs.length > 0
      ? leafParagraphs
      : [tempDiv]

    console.log(`[Task Detection] Checking ${paragraphs.length} leaf paragraphs in entry ${entryId}`)

    for (const para of paragraphs) {
      const paragraphText = para.textContent?.trim() || ''

      // Skip empty paragraphs or already processed ones
      const paraHash = `${entryId}-${paragraphText}`
      if (!paragraphText) {
        continue
      }

      if (processedParagraphs.current.has(paraHash)) {
        console.log('[Task Detection] Skipping already processed paragraph:', paragraphText.substring(0, 50))
        continue
      }

      console.log('[Task Detection] Processing paragraph:', paragraphText)

      // Mark as processed to avoid duplicate API calls
      processedParagraphs.current.add(paraHash)

      // Call task parsing API (with user's timezone info for DST handling)
      try {
        const response = await fetch('/api/tasks/parse', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            paragraphText,
            userId: user.id,
            entryId,
            timezoneOffset: new Date().getTimezoneOffset(), // Offset in minutes
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone // IANA timezone ID for DST
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.task) {
            console.log('✅ Task created from paragraph:', data.task)
            toast.success(`Task created: ${data.task.title}`)

            // Store task for inline display
            const parsedTask: ParsedTask = {
              id: data.task.id,
              title: data.task.title,
              paragraphHash: paraHash,
              dueAt: data.task.dueAt,
              rrule: data.task.rrule,
              status: 'pending'
            }

            setEntryTasks(prev => {
              const updated = new Map(prev)
              const existing = updated.get(entryId) || []
              updated.set(entryId, [...existing, parsedTask])
              return updated
            })
          } else {
            console.log('[Task Detection] No task detected in:', paragraphText.substring(0, 50))
          }
        } else {
          const error = await response.json()
          console.error('[Task Detection] API error:', error)
        }
      } catch (error) {
        console.error('[Task Detection] Failed to parse task:', error)
      }
    }
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

  const handleHelperInsertion = async (entryId: string, helperText: string) => {
    if (!user) {
      return
    }

    console.log('📝 Inserting helper text', { entryId, helperText })

    // Clear any pending auto-save timeout to prevent race condition
    // If user typed then quickly inserted helper, pending timeout would overwrite helper text
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
      console.log('⏱️ Cleared pending auto-save timeout before helper insertion')
    }

    // Set flag to prevent content change interference (same as link creation)
    setCreatingLink(true)

    try {
      // Ensure entry is in edit mode before inserting
      if (editingEntryId !== entryId) {
        console.log('⚠️ Entry not in edit mode, entering edit mode first')
        setEditingEntryId(entryId)
        // Wait for edit mode to activate and DOM to update
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Find the editor element for this entry using DOM query
      const editorElement = document.querySelector(
        `[data-entry-id="${entryId}"] [contenteditable]`
      ) as HTMLElement

      if (!editorElement) {
        console.error('❌ Could not find editor element for entry:', entryId)
        toast.error('Failed to insert helper text: editor not found')
        setCreatingLink(false)
        return
      }

      // Read current content from DOM
      const currentContent = editorElement.innerHTML || ''

      // Prepend helper text to top (plain paragraphs)
      const updatedContent = helperText + currentContent

      // Update DOM directly
      editorElement.innerHTML = updatedContent

      // Wait for DOM to settle, then read the actual content
      setTimeout(() => {
        const finalContent = editorElement.innerHTML

        // Update state with the content that includes the helper text
        setEntries(prev => prev.map(entry => {
          if (entry.id === entryId) {
            return { ...entry, content: finalContent, lastModified: new Date().toISOString() }
          }
          return entry
        }))

        // Persist to Supabase
        updateNoteInDb(entryId, { content: finalContent }, user.id)
          .then(() => console.log('💾 Persisted helper insertion to Supabase'))
          .catch(error => console.error('Error persisting helper insertion:', error))

        setCreatingLink(false)
      }, 50)
    } catch (error) {
      console.error('❌ Error inserting helper text:', error)
      toast.error('Failed to insert helper text. Please try again.')
      setCreatingLink(false)
    }
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
    const today = getLocalDateString()
    return dateStr === today
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Accessible heading for screen readers and tests - visually hidden */}
      <h1 className="sr-only">Journal</h1>

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

              {/* CBT Distortions Helper (only on today's entry) */}
              {isTodayEntry && user && (
                <CbtDistortions
                  entryId={entry.id}
                  userId={user.id}
                  onInsert={(helperText) => handleHelperInsertion(entry.id, helperText)}
                />
              )}

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

              {/* Task Cards - Display parsed tasks inline */}
              {entryTasks.get(entry.id)?.map((task) => (
                  <TaskCard
                    key={task.id}
                    title={task.title}
                    dueAt={task.dueAt}
                    rrule={task.rrule}
                    status={task.status}
                  onAccept={async () => {
                    // Accept task - update status
                    setEntryTasks(prev => {
                      const updated = new Map(prev)
                      const tasks = updated.get(entry.id) || []
                      updated.set(entry.id, tasks.map(t =>
                        t.id === task.id ? { ...t, status: 'accepted' as const } : t
                      ))
                      return updated
                    })
                    toast.success('Task accepted')
                  }}
                  onReject={async () => {
                    // Reject task - remove from list and delete from database
                    try {
                      const response = await fetch(`/api/tasks/${task.id}`, {
                        method: 'DELETE',
                        headers: {
                          'Authorization': `Bearer ${session?.access_token}`
                        }
                      })

                      if (response.ok) {
                        setEntryTasks(prev => {
                          const updated = new Map(prev)
                          const tasks = updated.get(entry.id) || []
                          updated.set(entry.id, tasks.filter(t => t.id !== task.id))
                          return updated
                        })
                        toast.success('Task rejected and deleted')
                      } else {
                        toast.error('Failed to delete task')
                      }
                    } catch (error) {
                      console.error('Failed to delete task:', error)
                      toast.error('Failed to delete task')
                    }
                  }}
                  onEdit={() => {
                    // TODO: Implement task editing in future story
                    toast.info('Task editing coming soon!')
                  }}
                />
              ))}
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