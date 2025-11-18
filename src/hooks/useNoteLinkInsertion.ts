import { useCallback, useRef } from 'react'

interface Note {
  id: string
  title: string
  noteType: string
  metadata?: {
    journalDate?: string
  }
}

/**
 * Hook for managing cursor position and inserting note links into contentEditable
 * Based on the pattern from SimpleRichEditor's handleTranscription
 */
export function useNoteLinkInsertion() {
  const savedRangeRef = useRef<Range | null>(null)

  /**
   * Save the current cursor position/selection
   */
  const saveCursorPosition = useCallback(() => {
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange()
    }
  }, [])

  /**
   * Restore the previously saved cursor position
   */
  const restoreCursorPosition = useCallback(() => {
    if (!savedRangeRef.current) return false

    const selection = window.getSelection()
    if (selection) {
      selection.removeAllRanges()
      selection.addRange(savedRangeRef.current)
      return true
    }
    return false
  }, [])

  /**
   * Insert a note link at the current cursor position
   * Returns true if successful, false otherwise
   */
  const insertNoteLinkAtCursor = useCallback(
    (note: Note, editorRef: React.RefObject<HTMLDivElement | null>) => {
      const editor = editorRef.current
      if (!editor) return false

      // Restore cursor position first
      if (!restoreCursorPosition()) {
        // Fallback: append to end of editor if cursor restoration fails
        const selection = window.getSelection()
        if (!selection) return false

        const range = document.createRange()
        range.selectNodeContents(editor)
        range.collapse(false) // Collapse to end
        selection.removeAllRanges()
        selection.addRange(range)
      }

      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) return false

      const range = selection.getRangeAt(0)

      // Create the link element
      const link = document.createElement('a')
      link.setAttribute('data-note-id', note.id)
      link.setAttribute('class', 'note-link')
      link.contentEditable = 'false' // Prevent editing the link itself

      // Set href based on note type
      if (note.noteType === 'journal-entry' && note.metadata?.journalDate) {
        link.href = `/journal?date=${note.metadata.journalDate}`
      } else {
        link.href = `/notes/${note.id}`
      }

      // Set link text to note title
      link.textContent = note.title

      // Insert the link at cursor
      range.deleteContents() // Remove any selected text first
      range.insertNode(link)

      // Add a space after the link for better UX
      const space = document.createTextNode('\u00A0') // Non-breaking space
      range.setStartAfter(link)
      range.insertNode(space)

      // Move cursor after the space
      range.setStartAfter(space)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)

      // Clear saved range
      savedRangeRef.current = null

      return true
    },
    [restoreCursorPosition]
  )

  return {
    saveCursorPosition,
    restoreCursorPosition,
    insertNoteLinkAtCursor,
  }
}
