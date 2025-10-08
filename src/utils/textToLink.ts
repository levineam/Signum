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

  // Find the position of the selected text
  const textIndex = fullText.indexOf(selectedText)

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

export function convertTextToLink(
  editorElement: HTMLElement,
  targetText: string,
  noteId: string,
  linkId: string,
  onLinkClick: (noteId: string) => void
): boolean {
  console.log('🔗 convertTextToLink called', { targetText, noteId, linkId, editorElement: !!editorElement })

  if (!editorElement || !targetText.trim()) {
    console.log('❌ Missing editorElement or targetText')
    return false
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

  // Find the text node containing our target text
  for (const textNode of textNodes) {
    const content = textNode.textContent || ''
    const index = content.indexOf(targetText)

    console.log('🔍 Checking text node:', { content, targetText, index })

    if (index !== -1) {
      console.log('✅ Found target text, creating link')

      // Found the text, now replace it with a link
      const beforeText = content.substring(0, index)
      const afterText = content.substring(index + targetText.length)

      // Create the link element
      const linkElement = document.createElement('a')
      linkElement.href = '#'
      linkElement.textContent = targetText
      linkElement.className = 'note-link text-primary hover:text-primary/80 underline cursor-pointer'
      linkElement.setAttribute('data-note-id', noteId)
      linkElement.setAttribute('data-link-id', linkId) // Phase 1: Add link ID for persistence
      linkElement.setAttribute('contenteditable', 'false') // Prevent editing the link itself

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