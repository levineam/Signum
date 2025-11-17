'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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

const DEBUG_TASK_DETECTION = process.env.NODE_ENV === 'development'

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

interface ParsedTask {
  id: string
  title: string
  paragraphHash: string
  dueAt: string | null
  rrule: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'
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
  const taskDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [currentEditingEntry, setCurrentEditingEntry] = useState<string | null>(null)
  const [showNoteViewer, setShowNoteViewer] = useState(false)
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null)
  const [noteLinkClicked, setNoteLinkClicked] = useState(false)
  const [creatingLink, setCreatingLink] = useState(false)
  const [, setEntryTasks] = useState<Map<string, ParsedTask[]>>(new Map())
  const rejectedTaskHashes = useRef<Map<string, Set<string>>>(new Map())

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

    // Debounce task detection to avoid duplicate tasks while typing (Story 1.2)
    if (taskDetectionTimeoutRef.current) {
      clearTimeout(taskDetectionTimeoutRef.current)
    }
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

  // Story 1.2.2: Normalize paragraph text for consistent hashing
  // Handles punctuation, whitespace, and case variations
  const normalizeParagraphText = (text: string): string => {
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .replace(/[.,;!?]+$/, '') // Remove trailing punctuation
  }

  const detectTasksInContent = async (content: string, entryId: string) => {
    if (!user || !session?.access_token) return

    // Story 1.2.2: Get rejected task hashes from state
    const rejectedHashes = rejectedTaskHashes.current.get(entryId) || new Set<string>()

    if (DEBUG_TASK_DETECTION && rejectedHashes.size > 0) {
      console.log(`[Task Detection] Loaded ${rejectedHashes.size} rejected task hashes for entry ${entryId}`)
    }

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

    if (DEBUG_TASK_DETECTION) {
      console.log(`[Task Detection] Checking ${paragraphs.length} leaf paragraphs in entry ${entryId}`)
    }

    for (const para of paragraphs) {
      const paragraphText = para.textContent?.trim() || ''

      // Story 1.2.2: Use normalized text for hashing
      const normalizedText = normalizeParagraphText(paragraphText)
      const paraHash = `${entryId}-${normalizedText}`

      if (DEBUG_TASK_DETECTION) {
        console.log('[Task Detection] Examining paragraph:', {
          paragraphText: paragraphText.substring(0, 50),
          normalizedText: normalizedText.substring(0, 50),
          isEmpty: !paragraphText,
          paraHash
        })
      }

      // Skip empty paragraphs
      if (!paragraphText) {
        if (DEBUG_TASK_DETECTION) {
          console.log('[Task Detection] Skipping empty paragraph')
        }
        continue
      }

      // Story 1.2.2: Skip paragraphs that are too long (API limit is 1000 chars)
      if (paragraphText.length > 1000) {
        if (DEBUG_TASK_DETECTION) {
          console.log('[Task Detection] Skipping paragraph too long:', paragraphText.length, 'chars')
        }
        continue
      }

      // Story 1.2.2: Check if this paragraph was rejected
      if (rejectedHashes.has(paraHash)) {
        if (DEBUG_TASK_DETECTION) {
          console.log('[Task Detection] Skipping rejected paragraph:', paragraphText.substring(0, 50))
        }
        continue
      }

      // Check if already processed - but only mark as processed AFTER successful task creation
      if (processedParagraphs.current.has(paraHash)) {
        if (DEBUG_TASK_DETECTION) {
          console.log('[Task Detection] Skipping already processed paragraph:', paragraphText.substring(0, 50))
        }
        continue
      }

      if (DEBUG_TASK_DETECTION) {
        console.log('[Task Detection] Processing paragraph:', paragraphText)
      }

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
            const { task, alreadyExisted } = data

            // Check if this task already exists in entryTasks to avoid duplicates
            setEntryTasks(prev => {
              const updated = new Map(prev)
              const existing = updated.get(entryId) || []

              // Story 1.2.2: Check for duplicates by both ID and paragraphHash
              const taskExistsById = existing.some(t => t.id === task.id)
              const taskExistsByHash = existing.some(t => t.paragraphHash === paraHash)

              if (taskExistsById) {
                console.log('⏭️ Task already exists in entryTasks (by ID), skipping:', task.id)
                return prev
              }

              if (taskExistsByHash) {
                console.log('⏭️ Task already exists in entryTasks (by hash), skipping:', paraHash)
                return prev
              }

              // Use the status from the server (for existing tasks) or 'pending' for new tasks
              const parsedTask: ParsedTask = {
                id: task.id,
                title: task.title,
                paragraphHash: paraHash,
                dueAt: task.dueAt,
                rrule: task.rrule,
                status: task.status || 'pending'
              }

              updated.set(entryId, [...existing, parsedTask])

              // Mark paragraph as processed now that task was successfully created
              processedParagraphs.current.add(paraHash)

              // Only show toast for newly created tasks
              if (!alreadyExisted) {
                console.log('✅ New task created from paragraph:', task)
                toast.success(`Task created: ${task.title}`)
              } else {
                console.log('✅ Loaded existing task from paragraph:', task)
              }

              return updated
            })
          } else {
            if (DEBUG_TASK_DETECTION) {
              console.log('[Task Detection] No task detected in:', paragraphText.substring(0, 50))
            }
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

  const captureSelectionContext = useCallback((selection: string) => {
    if (!selection) return
    setSelectedText(selection)
    setCurrentEditingEntry(editingEntryId)

    if (editingEntryId) {
      const editorElement = document.querySelector(`[data-entry-id="${editingEntryId}"] [contenteditable]`) as HTMLElement | null
      cachedEditorRef.current = editorElement
      console.log('💾 Cached editor element:', !!editorElement)
    }
  }, [editingEntryId])

  const handleMakeNote = (selection: string) => {
    captureSelectionContext(selection)
    setShowNoteModal(true)
  }

  const handleLinkClick = useCallback((noteId: string) => {
    setNoteLinkClicked(true)
    setViewingNoteId(noteId)
    setShowNoteViewer(true)
    setTimeout(() => setNoteLinkClicked(false), 100)
  }, [])

  const linkSelectionToNote = useCallback(async (noteId: string) => {
    const entryId = currentEditingEntry
    const selectionText = selectedText

    if (!entryId || !selectionText || !user) {
      console.log('❌ Missing context for linking', { entryId, selectionTextLength: selectionText?.length, hasUser: !!user })
      return false
    }

    console.log('📝 Creating note link', { selectedText: selectionText, noteId, entryId })
    setCreatingLink(true)

    let editorElement = cachedEditorRef.current

    if (!editorElement || !document.contains(editorElement)) {
      console.log('⚠️ Cached editor stale, re-entering edit mode')
      setEditingEntryId(entryId)
      await new Promise(resolve => setTimeout(resolve, 100))
      editorElement = document.querySelector(`[data-entry-id="${entryId}"] [contenteditable]`) as HTMLElement | null
    }

    if (!editorElement) {
      console.error('❌ Could not find editor element after re-entry attempt')
      toast.error('Failed to create link: editor not found. Please try again.')
      setCreatingLink(false)
      cachedEditorRef.current = null
      return false
    }

    try {
      const metadata = captureSelectionMetadata(editorElement, selectionText)
      console.log('📊 Captured selection metadata:', metadata)

      const link = await createLink({
        sourceNoteId: entryId,
        targetNoteId: noteId,
        linkType: 'created_from',
        metadata: metadata || undefined
      }, user.id)
      console.log('💾 Link created in Supabase:', link)

      const linkCreated = convertTextToLink(editorElement, selectionText, noteId, link.id, handleLinkClick)

      if (!linkCreated) {
        console.error('❌ Failed to create link in editor')
        setCreatingLink(false)
        return false
      }

      console.log('🔗 Created link in editor DOM')

      setTimeout(() => {
        const updatedContent = editorElement?.innerHTML ?? ''
        console.log('📄 Read updated content from editor after link creation')

        setEntries(prev => prev.map(entry => {
          if (entry.id === entryId) {
            return { ...entry, content: updatedContent, lastModified: new Date().toISOString() }
          }
          return entry
        }))

        updateNoteInDb(entryId, { content: updatedContent }, user.id)
          .then(() => console.log('💾 Persisted link to Supabase'))
          .catch(error => console.error('Error persisting link to Supabase:', error))

        setCreatingLink(false)
        cachedEditorRef.current = null
        setSelectedText('')
      }, 50)

      return true
    } catch (error) {
      console.error('❌ Error creating link:', error)
      toast.error('Failed to create link. Please try again.')
      setCreatingLink(false)
      cachedEditorRef.current = null
      return false
    }
  }, [currentEditingEntry, selectedText, user, handleLinkClick, setEntries])

  const handleNoteCreated = useCallback(async (note: Note) => {
    await linkSelectionToNote(note.id)
  }, [linkSelectionToNote])

  const handleAskAIAnswerCreated = useCallback(async (noteId: string, capturedSelection: string, capturedEntryId?: string) => {
    if (!noteId) {
      console.warn('[Ask AI] Missing noteId from dialog callback')
      return
    }

    // P2 FIX: Use captured selection context instead of current state
    // This prevents linking to wrong text if user changed selection during AI generation
    if (capturedEntryId && capturedSelection && user) {
      const editorElement = cachedEditorRef.current

      if (!editorElement) {
        console.log('❌ No editor element cached for linking')
        setViewingNoteId(noteId)
        setShowNoteViewer(true)
        return
      }

      const linkResult = await convertTextToLink(editorElement, capturedSelection, noteId)

      if (linkResult.success) {
        const metadata = captureSelectionMetadata(editorElement, capturedSelection)
        console.log('📝 Creating link with metadata:', { noteId, targetId: capturedEntryId, metadata })

        try {
          await createLink(
            noteId,
            capturedEntryId,
            user.id,
            metadata.snippet,
            metadata
          )

          const currentEntry = entries.find(e => e.id === capturedEntryId)
          if (currentEntry && linkResult.newHtml) {
            console.log('📝 Updating entry content with link')
            await saveEntry(capturedEntryId, linkResult.newHtml, currentEntry.metadata, user.id, currentEntry.noteType)
          }

          toast.success('Answer linked to journal entry')
        } catch (error) {
          console.error('Failed to create link:', error)
        }
      }
    }

    setViewingNoteId(noteId)
    setShowNoteViewer(true)
  }, [user, entries, cachedEditorRef])

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

              {/* Helpers (only on today's entry) - Story 2.8: Tile-based UI */}
              {isTodayEntry && (user || isGuest) && (
                <HelperTileGrid
                  helperTypes={[
                    'day-planning',
                    'cbt-distortions',
                    'gratitude',
                    'values-affirmation',
                    'self-compassion',
                    'woop',
                    'best-possible-self',
                    'savoring',
                    'loving-kindness',
                  ]}
                  onTileClick={(helperType) => {
                    setActiveHelper(helperType)
                    setActiveEntryId(entry.id)
                    setActiveHelperMode('use')
                  }}
                  onInfoClick={handleInfoClick}
                />
              )}

              <div
                onClick={() => {
                  // Toggle edit mode
                  setEditingEntryId(entry.id);
                }}
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
                      // Don't exit edit mode if the user clicked on the voice button
                      if (relatedTarget && relatedTarget.closest('[data-voice-button]')) {
                        return
                      }
                      // Don't exit edit mode if the user clicked on the helper expand/collapse toggle
                      if (relatedTarget && relatedTarget.closest('[data-helper-toggle]')) {
                        return
                      }
                      setEditingEntryId(null)
                    }}
                    onMakeNote={handleMakeNote}
                    entryId={entry.id}
                    onNoteCreated={handleAskAIAnswerCreated}
                    onAskAISelection={captureSelectionContext}
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
                          className="text-base leading-relaxed prose prose-sm max-w-none"
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
                        <div className="text-muted-foreground">Loading content...</div>
                      )
                    ) : (
                      <p className="text-muted-foreground italic">
                        {isTodayEntry ? "What's on your mind today? Start writing..." : "What's on your mind today? Start writing..."}
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
