/**
 * Utility functions for converting selected text to hyperlinks in contentEditable elements
 */

import { LinkMetadata } from '@/types/note'

/**
 * Capture metadata about the selected text for link resilience.
 * Call this BEFORE manipulating the DOM.
 */
export function captureSelectionMetadata(
  editorElement: HTMLElement,
  selectedText: string,
  contextLength: number = 50
): LinkMetadata | null {
  if (!editorElement || !selectedText.trim()) {
    return null
  }

  // Get the full text content
  const fullText = editorElement.textContent || ''

  // Attempt to determine the exact position of the selection using the current Range
  let textIndex = -1

  if (typeof window !== 'undefined') {
    const selection = window.getSelection()
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0)

      if (editorElement.contains(range.commonAncestorContainer)) {
        try {
          const preRange = range.cloneRange()
          preRange.selectNodeContents(editorElement)
          preRange.setEnd(range.startContainer, range.startOffset)
          textIndex = preRange.toString().length
        } catch (error) {
          console.warn('Failed to compute selection offset, falling back to text search', error)
        }
      }
    }
  }

  // Fall back to a simple text search if we couldn't compute an exact offset
  if (textIndex === -1) {
    textIndex = fullText.indexOf(selectedText)
  }

  if (textIndex === -1) {
    console.warn('Selected text not found in editor content')
    return null
  }

  // Capture context before and after
  const contextStart = Math.max(0, textIndex - contextLength)
  const contextEnd = Math.min(fullText.length, textIndex + selectedText.length + contextLength)

  const contextBefore = fullText.substring(contextStart, textIndex)
  const contextAfter = fullText.substring(textIndex + selectedText.length, contextEnd)

  return {
    snippet: selectedText,
    contextBefore,
    contextAfter,
    textContentPos: textIndex
  }
}

/**
 * Helper function to create and insert a link element, replacing a text node
 */
function createAndInsertLink(
  textNode: Text,
  beforeText: string,
  afterText: string,
  targetText: string,
  noteId: string,
  linkId: string,
  onLinkClick: (noteId: string) => void
): boolean {
  // Create the link element
  const linkElement = document.createElement('a')
  linkElement.href = '#'
  linkElement.textContent = targetText
  linkElement.className = 'note-link text-primary hover:text-primary/80 underline cursor-pointer'
  linkElement.setAttribute('data-note-id', noteId)
  linkElement.setAttribute('data-link-id', linkId)
  linkElement.setAttribute('contenteditable', 'false')

  // Add click handler
  linkElement.addEventListener('click', (e) => {
    console.log('🖱️ Link clicked:', noteId)
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    onLinkClick(noteId)
  })

  // Create new text nodes for before and after
  const beforeNode = beforeText ? document.createTextNode(beforeText) : null
  const afterNode = afterText ? document.createTextNode(afterText) : null

  // Get the parent element
  const parent = textNode.parentNode
  if (!parent) {
    console.log('❌ No parent node found')
    return false
  }

  // Replace the text node with our new elements
  if (beforeNode) parent.insertBefore(beforeNode, textNode)
  parent.insertBefore(linkElement, textNode)
  if (afterNode) parent.insertBefore(afterNode, textNode)
  parent.removeChild(textNode)

  console.log('✅ Link created successfully')
  return true
}

export function convertTextToLink(
  editorElement: HTMLElement,
  targetText: string,
  noteId: string,
  linkId: string,
  onLinkClick: (noteId: string) => void,
  metadata?: LinkMetadata | null
): boolean {
  console.log('🔗 convertTextToLink called', { targetText, noteId, linkId, metadata, editorElement: !!editorElement })

  if (!editorElement || !targetText.trim()) {
    console.log('❌ Missing editorElement or targetText')
    return false
  }

  // If we have metadata with position info, use it to find the correct occurrence
  // This handles cases where the same text appears multiple times
  let targetPosition: number | null = null
  if (metadata?.textContentPos !== undefined) {
    targetPosition = metadata.textContentPos
    console.log('📍 Using metadata position:', targetPosition)
  }

  // Create a TreeWalker to find text nodes
  const walker = document.createTreeWalker(
    editorElement,
    NodeFilter.SHOW_TEXT,
    null
  )

  const textNodes: Text[] = []
  let node: Node | null

  // Collect all text nodes
  while (node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node as Text)
    }
  }

  console.log('📝 Found text nodes:', textNodes.length)

  // Build a cumulative text position tracker to match against metadata position
  let cumulativePosition = 0

  // Find the text node containing our target text
  for (const textNode of textNodes) {
    const content = textNode.textContent || ''
    const nodeLength = content.length

    // If we have a target position from metadata, check if it falls within this node
    if (targetPosition !== null) {
      const textStartInNode = targetPosition - cumulativePosition
      const textEndInNode = textStartInNode + targetText.length

      // Check if the target position falls within this text node
      if (textStartInNode >= 0 && textEndInNode <= nodeLength) {
        const textAtPosition = content.substring(textStartInNode, textEndInNode)

        console.log('🎯 Checking position-based match:', {
          cumulativePosition,
          textStartInNode,
          nodeLength,
          textAtPosition,
          targetText,
          matches: textAtPosition === targetText
        })

        if (textAtPosition === targetText) {
          console.log('✅ Found target text at exact position from metadata')
          const index = textStartInNode

          // Found the text, now replace it with a link
          const beforeText = content.substring(0, index)
          const afterText = content.substring(index + targetText.length)

          // Create link and insert (common code moved below)
          return createAndInsertLink(textNode, beforeText, afterText, targetText, noteId, linkId, onLinkClick)
        }
      }

      cumulativePosition += nodeLength
    } else {
      // Fallback to indexOf when no metadata (finds first occurrence)
      const index = content.indexOf(targetText)

      console.log('🔍 Checking text node (no metadata):', { content, targetText, index })

      if (index !== -1) {
        console.log('✅ Found target text using indexOf (first occurrence)')

        // Found the text, now replace it with a link
        const beforeText = content.substring(0, index)
        const afterText = content.substring(index + targetText.length)

        return createAndInsertLink(textNode, beforeText, afterText, targetText, noteId, linkId, onLinkClick)
      }
    }
  }

  console.log('❌ Target text not found in any text node')
  return false
}

/**
 * Phase 2: Rehydrate links from Supabase metadata on journal entry load.
 * Uses exact text matching with metadata context.
 */
export function rehydrateLinksFromMetadata(
  editorElement: HTMLElement,
  links: Array<{
    id: string
    targetNoteId: string
    metadata?: LinkMetadata
  }>,
  onLinkClick: (noteId: string) => void
): { rehydrated: number; skipped: number } {
  if (!editorElement || links.length === 0) {
    return { rehydrated: 0, skipped: 0 }
  }

  console.log('🔄 Rehydrating links from metadata:', links.length)

  let rehydratedCount = 0
  let skippedCount = 0

  // First, attach event listeners to any existing links (already in HTML)
  const existingLinks = editorElement.querySelectorAll('a[data-link-id]')
  const existingLinkIds = new Set(
    Array.from(existingLinks).map(link => link.getAttribute('data-link-id'))
  )

  console.log('📌 Found existing links in HTML:', existingLinkIds.size)

  // Attach click handlers to existing links
  existingLinks.forEach(link => {
    const noteId = link.getAttribute('data-note-id')
    if (noteId) {
      const handleClick = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        onLinkClick(noteId)
      }
      link.removeEventListener('click', handleClick)
      link.addEventListener('click', handleClick)
    }
  })

  // Rehydrate missing links using metadata
  links.forEach(link => {
    // Skip if link already exists in HTML
    if (existingLinkIds.has(link.id)) {
      console.log(`⏭️ Skipping link ${link.id} (already in HTML)`)
      skippedCount++
      return
    }

    // Skip if no metadata
    if (!link.metadata?.snippet) {
      console.warn(`⚠️ Link ${link.id} missing metadata.snippet, cannot rehydrate`)
      skippedCount++
      return
    }

    // Try to find and convert the text using exact match
    const success = convertTextToLink(
      editorElement,
      link.metadata.snippet,
      link.targetNoteId,
      link.id,
      onLinkClick
    )

    if (success) {
      console.log(`✅ Rehydrated link ${link.id} for "${link.metadata.snippet}"`)
      rehydratedCount++
    } else {
      console.warn(`❌ Failed to rehydrate link ${link.id} - text not found: "${link.metadata.snippet}"`)
      skippedCount++
    }
  })

  console.log(`📊 Rehydration complete: ${rehydratedCount} rehydrated, ${skippedCount} skipped`)
  return { rehydrated: rehydratedCount, skipped: skippedCount }
}

export function restoreLinksInEditor(
  editorElement: HTMLElement,
  links: Array<{ text: string; noteId: string; linkId?: string }>,
  onLinkClick: (noteId: string) => void
): void {
  if (!editorElement) return

  // First, attach event listeners to any existing links
  const existingLinks = editorElement.querySelectorAll('a[data-note-id]')
  existingLinks.forEach(link => {
    const noteId = link.getAttribute('data-note-id')
    if (noteId) {
      // Create a new event handler for this specific link
      const handleClick = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        onLinkClick(noteId)
      }

      // Remove any existing listeners and add new one
      link.removeEventListener('click', handleClick)
      link.addEventListener('click', handleClick)
    }
  })

  // Then convert any text that should be links but isn't yet
  // This handles cases where content was restored from storage
  links.forEach(({ text, noteId, linkId }) => {
    // Only convert if text isn't already a link
    const isAlreadyLinked = Array.from(existingLinks).some(link =>
      link.textContent === text && link.getAttribute('data-note-id') === noteId
    )

    if (!isAlreadyLinked) {
      // Use provided linkId or generate a temporary one for Phase 1
      const effectiveLinkId = linkId || `temp-${Date.now()}-${Math.random()}`
      convertTextToLink(editorElement, text, noteId, effectiveLinkId, onLinkClick)
    }
  })
}