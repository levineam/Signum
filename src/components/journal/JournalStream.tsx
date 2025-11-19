'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { SimpleRichEditor } from '@/components/editor/SimpleRichEditor'
import { Card, CardContent } from '@/components/ui/card'
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
import { HelperTileGrid } from '@/components/journal/helpers/HelperTileGrid'
import { HelperInfoDialog } from '@/components/journal/helpers/HelperInfoDialog'
import { HelperDialogContent } from '@/components/journal/helpers/HelperDialogContent'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HelperType } from '@/types/helper'
import { HELPER_TILES } from '@/constants/helperTitles'
import { sanitizeHtml, useDOMPurifyReady } from '@/utils/sanitizeHtml'
import { useGuestDraft } from '@/hooks/useGuestDraft'
import { useIdleTimer } from '@/hooks/useIdleTimer'
import { GuestAuthModal } from '@/components/auth/GuestAuthModal'
import { IDLE_TIMER_MS } from '@/types/guest'

interface JournalEntry {
  id: string
  date: string  // YYYY-MM-DD format
  content: string
  lastModified: string
  isSample?: boolean
  metadata?: {
    journalDate?: string
    prompt?: string
    [key: string]: unknown  // Allow other metadata fields
  } | null
}

// Helper: Get today's date in local timezone as YYYY-MM-DD
function getLocalDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper function to check if content is truly empty (handles HTML markup)
function isContentEmpty(html: string): boolean {
  if (!html || html.trim() === '') return true
  // Use regex to strip HTML tags for SSR-safe text extraction
  const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
  return text.trim() === ''
}

interface JournalStreamProps {
  isGuest?: boolean
}

export function JournalStream({ isGuest = false }: JournalStreamProps) {
  const router = useRouter()
  const { user, session } = useAuth()
  const isDOMPurifyReady = useDOMPurifyReady()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [currentEditingEntry, setCurrentEditingEntry] = useState<string | null>(null)
  const [showNoteViewer, setShowNoteViewer] = useState(false)
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null)
  const [noteLinkClicked, setNoteLinkClicked] = useState(false)
  const [creatingLink, setCreatingLink] = useState(false)

  // Guest mode state
  const { draft: guestDraft, saveDraft: saveGuestDraft, clearDraft: clearGuestDraft } = useGuestDraft()
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Idle timer callback: show auth modal after 2s idle (only for guests)
  const handleIdle = () => {
    if (isGuest) {
      setShowAuthModal(true)
    }
  }

  const { reset: resetIdleTimer, setDismissed: setAuthModalDismissed } = useIdleTimer(handleIdle, IDLE_TIMER_MS)

  // Story 2.8: Helper tile UI state
  const [activeHelper, setActiveHelper] = useState<HelperType | null>(null)
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null)

  // Story 2.9: Helper mode state (info vs use)
  const [activeHelperMode, setActiveHelperMode] = useState<'info' | 'use' | null>(null)

  // Cache editor element reference before opening modal (Phase 1 bug fix)
  const cachedEditorRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Load journal entries from Supabase or create guest entry
    async function loadEntries() {
      // Guest mode: create a single local entry with guest draft
      if (isGuest) {
        console.log('[JournalStream] Guest mode: creating local guest entry')
        const today = getLocalDateString()
        const guestEntry: JournalEntry = {
          id: 'guest-entry',
          date: today,
          content: guestDraft || '',
          lastModified: new Date().toISOString()
        }
        setEntries([guestEntry])
        setEditingEntryId('guest-entry') // Auto-enter edit mode
        setIsLoading(false)
        return
      }

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

        // Convert Note format to JournalEntry format
        const journalEntriesWithDuplicates: JournalEntry[] = journalNotes.map(note => {
          // Safely handle metadata (can be null for legacy notes)
          const meta = note.metadata || {}
          const journalDate = (meta as { journalDate?: string }).journalDate
          const isSample = (meta as { isSample?: boolean }).isSample

          return {
            id: note.id,
            date: journalDate || note.createdAt.split('T')[0],
            content: note.content,
            lastModified: note.updatedAt,
            isSample: Boolean(isSample),
            metadata: note.metadata as JournalEntry['metadata']  // Preserve original metadata for autosave merge
          }
        })

        // Deduplicate entries by date (keep most recent if duplicates exist)
        // This handles legacy notes that may not have journalDate metadata
        const dateMap = new Map<string, JournalEntry>()
        for (const entry of journalEntriesWithDuplicates) {
          const existing = dateMap.get(entry.date)
          if (!existing || new Date(entry.lastModified) > new Date(existing.lastModified)) {
            dateMap.set(entry.date, entry)
          }
        }
        const journalEntries = Array.from(dateMap.values()).sort((a, b) =>
          b.date.localeCompare(a.date)
        )

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

        // Auto-enter edit mode for today's entry
        const todayEntryInList = initialEntries.find(e => e.date === today)
        if (todayEntryInList) {
          console.log('[JournalStream] Auto-entering edit mode for today\'s entry')
          setEditingEntryId(todayEntryInList.id)
        }

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
  }, [user?.id, isGuest, guestDraft]) // Re-run when user ID, guest mode, or guest draft changes

  // Story 2.8: Deep linking support - check URL for ?helper=type on mount
  // Story 2.9: Updated to set mode to 'use' for deep links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const helperParam = params.get('helper') as HelperType | null
    if (helperParam && helperParam in HELPER_TILES) {
      setActiveHelper(helperParam)
      setActiveHelperMode('use')
      // Set activeEntryId to today's entry when it's available
      const today = getLocalDateString()
      const todayEntry = entries.find(e => e.date === today)
      if (todayEntry) {
        setActiveEntryId(todayEntry.id)
      }
      // Preserve existing scroll position - do NOT auto-scroll to helpers
      // User may have deep link but still want to see their entry
    }
  }, [entries])


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

    // Guest mode: save to localStorage and reset idle timer
    if (isGuest) {
      saveGuestDraft(newContent)
      resetIdleTimer() // Reset idle timer on every content change
      return // Skip Supabase saves for guests
    }

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

  // Guest auth modal handlers
  const handleAuthModalClose = () => {
    setShowAuthModal(false)
    setAuthModalDismissed() // Record dismissal for cooldown
  }

  const handleAuthSuccess = async (userId: string) => {
    console.log('[GuestJournal] Auth success, transferring content for user:', userId)

    // Get the current guest draft content
    const currentContent = guestDraft || ''

    if (!currentContent.trim()) {
      console.log('[GuestJournal] No content to transfer, clearing draft')
      clearGuestDraft()
      setShowAuthModal(false)
      // Router will redirect after auth context updates
      return
    }

    try {
      // Wait for session to be available (up to 5 seconds)
      let accessToken: string | null = null
      const maxWaitTime = 5000
      const startTime = Date.now()

      while (!accessToken && (Date.now() - startTime) < maxWaitTime) {
        // Import supabase client dynamically to get session
        const { supabase } = await import('@/lib/supabase')
        const { data: { session: currentSession } } = await supabase.auth.getSession()

        if (currentSession?.access_token) {
          accessToken = currentSession.access_token
          break
        }

        // Wait 200ms before trying again
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      if (!accessToken) {
        throw new Error('Failed to get authentication token')
      }

      // Call transfer API with auth token
      const response = await fetch('/api/transfer-guest-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ content: currentContent })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Transfer failed')
      }

      const { entryId } = await response.json()
      console.log('[GuestJournal] Content transferred successfully to entry:', entryId)

      // Clear local draft after successful transfer
      clearGuestDraft()

      // Close modal
      setShowAuthModal(false)

      // Show success toast
      toast.success('Welcome! Your journal entry has been saved.')

      // Navigation will happen automatically when auth context updates
    } catch (error) {
      console.error('[GuestJournal] Transfer failed:', error)
      toast.error('Failed to save your entry. Please try again.')
      // Keep modal open and draft preserved for retry
    }
  }

  // Story 2.9: Handler for info icon clicks
  const handleInfoClick = (helperType: HelperType) => {
    setActiveHelper(helperType)
    setActiveHelperMode('info')
    // No need to set activeEntryId for info mode
  }

  // Story 2.9: Handler for closing helper dialog
  const handleHelperClose = () => {
    setActiveHelper(null)
    setActiveHelperMode(null)
    setActiveEntryId(null)
  }

  // Story 2.9: URL management for helper state
  useEffect(() => {
    if (activeHelper && activeHelperMode) {
      // Update URL with ?helper=type when dialog opens
      const url = new URL(window.location.href)
      url.searchParams.set('helper', activeHelper)
      window.history.replaceState({}, '', url)
    } else {
      // Clear URL parameter when closing
      const url = new URL(window.location.href)
      url.searchParams.delete('helper')
      window.history.replaceState({}, '', url)
    }
  }, [activeHelper, activeHelperMode])

  const handleHelperInsertion = async (entryId: string, helperText: string) => {
    console.log('📝 Inserting helper text', { entryId, helperText, isGuest })

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

        // Persist based on mode
        if (isGuest) {
          // Guest mode: save to localStorage
          console.log('💾 Saving helper insertion to guest draft')
          saveGuestDraft(finalContent)
        } else if (user) {
          // Authenticated mode: persist to Supabase
          updateNoteInDb(entryId, { content: finalContent }, user.id)
            .then(() => console.log('💾 Persisted helper insertion to Supabase'))
            .catch(error => console.error('Error persisting helper insertion:', error))
        }

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
        {!user && !isGuest ? (
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
              className={`py-0 bg-card transition-all ${
                isTodayEntry ? 'border-2 border-primary/20' : ''
              } ${
                isEditingThis ? 'ring-2 ring-primary/30' : ''
              }`}
            >
              {/* Header Section */}
              <div className="flex items-center justify-between px-3 md:px-2 py-3 md:py-2">
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

              {/* Helpers (only on today's entry) - Story 2.8: Tile-based UI */}
              {isTodayEntry && (user || isGuest) && (
                <div className="px-3 md:px-2">
                  <HelperTileGrid
                    helperTypes={[
                      'day-planning',
                      'cbt-distortions',
                      'gratitude',
                      'values-affirmation',
                      'woop',
                      'best-possible-self',
                    ]}
                    onTileClick={(helperType) => {
                      setActiveHelper(helperType)
                      setActiveEntryId(entry.id)
                      setActiveHelperMode('use')
                    }}
                    onInfoClick={handleInfoClick}
                  />
                </div>
              )}

              {/* Content Section */}
              <CardContent
                onClick={(event) => {
                  // Toggle edit mode
                  setEditingEntryId(entry.id);
                }}
                className="px-3 md:px-2 pb-3 md:pb-2 pt-0 cursor-text hover:bg-muted/30 rounded-md transition-colors"
              >
                {isEditingThis ? (
                  <SimpleRichEditor
                    variant="flush"
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
                      // Don't exit edit mode if the user clicked on the voice button
                      if (relatedTarget && relatedTarget.closest('[data-voice-button]')) {
                        return
                      }
                      // Don't exit edit mode if the user clicked on the note link picker
                      if (relatedTarget && relatedTarget.closest('[data-note-link-button]')) {
                        return
                      }
                      // Don't exit edit mode if the user clicked on the helper expand/collapse toggle
                      if (relatedTarget && relatedTarget.closest('[data-helper-toggle]')) {
                        return
                      }
                      setEditingEntryId(null)
                    }}
                    onMakeNote={handleMakeNote}
                    isGuest={isGuest}
                    onFocus={() => {
                      // Phase 2: Link rehydration from Supabase will be implemented here
                      // For now, links already in HTML remain functional
                    }}
                    autoFocus
                  />
                ) : (
                  <div className="min-h-[100px]">
                    {!isContentEmpty(entry.content) ? (
                      isDOMPurifyReady ? (
                        <div
                          className="text-base leading-relaxed prose prose-sm max-w-none px-2"
                          dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.content) }}
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
                        <div className="text-muted-foreground px-2">Loading content...</div>
                      )
                    ) : (
                      <p className="text-muted-foreground italic px-2">
                        {isTodayEntry ? "What's on your mind today? Start writing..." : "What's on your mind today? Start writing..."}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>

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


      {/* Story 2.9: Helper Dialog (rendered once, outside entry loop) */}
      {activeHelper && (user || isGuest) && (activeHelperMode === 'info' || activeEntryId) && (
        <Dialog open={true} onOpenChange={(open) => !open && handleHelperClose()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {activeHelperMode === 'info' ? (
              <>
                <DialogHeader>
                  <DialogTitle>{HELPER_TILES[activeHelper].fullTitle}</DialogTitle>
                </DialogHeader>
                <HelperInfoDialog helperType={activeHelper} />
              </>
            ) : activeHelperMode === 'use' ? (
              <>
                <DialogHeader>
                  <DialogTitle>{HELPER_TILES[activeHelper].fullTitle}</DialogTitle>
                </DialogHeader>
                <HelperDialogContent
                  helperType={activeHelper}
                  entryId={activeEntryId!}
                  userId={user?.id || 'guest'}
                  onInsert={(helperText) => handleHelperInsertion(activeEntryId!, helperText)}
                  onClose={handleHelperClose}
                />
              </>
            ) : null}
          </DialogContent>
        </Dialog>
      )}

      {/* Story 1.8: Guest Auth Modal */}
      {isGuest && (
        <GuestAuthModal
          isOpen={showAuthModal}
          onClose={handleAuthModalClose}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  )
}
