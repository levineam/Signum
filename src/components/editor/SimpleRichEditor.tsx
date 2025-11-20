'use client'

import React, { useRef, useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bold, Italic, Underline, Highlighter, List, ListOrdered, Heading1, Heading2, Quote, AlignLeft, AlignCenter, AlignRight, FileText, Search } from 'lucide-react'
import { VoiceRecordButton } from '@/components/editor/VoiceRecordButton'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NoteLinkPicker, type NoteLinkSearchResult } from '@/components/editor/NoteLinkPicker'
import { useNoteLinkInsertion } from '@/hooks/useNoteLinkInsertion'
import { cn } from '@/lib/utils'

interface SimpleRichEditorProps {
  value?: string
  placeholder?: string
  initialValue?: string
  onChange?: (content: string) => void
  onFocus?: () => void
  onBlur?: (e: React.FocusEvent) => void
  autoFocus?: boolean
  onMakeNote?: (selectedText: string) => void
  onTranscription?: (text: string) => void
  variant?: 'default' | 'flush'
  className?: string
  isGuest?: boolean
  onNoteLinkInsert?: (note: NoteLinkSearchResult) => Promise<void> | void
}

export function SimpleRichEditor({
  value,
  placeholder = "Start writing your thoughts...",
  initialValue = "",
  onChange,
  onFocus,
  onBlur,
  autoFocus = false,
  onMakeNote,
  onTranscription,
  variant = 'default',
  className,
  isGuest = false,
  onNoteLinkInsert,
}: SimpleRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [selectedText, setSelectedText] = useState('')
  const [hasSelection, setHasSelection] = useState(false)
  const isInternalChangeRef = useRef(false)
  const [showNotePicker, setShowNotePicker] = useState(false)
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    highlight: false,
    h1: false,
    h2: false,
    ul: false,
    ol: false,
    blockquote: false
  })

  // Hook for note link insertion
  const { saveCursorPosition, insertNoteLinkAtCursor } = useNoteLinkInsertion()

  const updateActiveFormats = useCallback(() => {
    if (!editorRef.current) return

    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    let node: Node | null = range.commonAncestorContainer

    // If text node, get parent element
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement
    }

    const element = node as HTMLElement
    if (!element || !editorRef.current.contains(element)) return

    // Check for inline formats (bold, italic, underline)
    const formats = {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      highlight: false,
      h1: false,
      h2: false,
      ul: false,
      ol: false,
      blockquote: false
    }

    // Check for block-level formats and highlight by traversing up the DOM
    let currentEl: HTMLElement | null = element
    while (currentEl && editorRef.current.contains(currentEl)) {
      const tagName = currentEl.tagName?.toLowerCase()
      if (tagName === 'h1') formats.h1 = true
      if (tagName === 'h2') formats.h2 = true
      if (tagName === 'ul') formats.ul = true
      if (tagName === 'ol') formats.ol = true
      if (tagName === 'blockquote') formats.blockquote = true
      if (tagName === 'mark') formats.highlight = true
      currentEl = currentEl.parentElement
    }

    setActiveFormats(formats)
  }, [])

  const formatText = useCallback((command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
      document.execCommand(command, false, value)

      // Trigger change event after formatting
      if (onChange) {
        const content = editorRef.current.innerHTML || ''
        isInternalChangeRef.current = true
        onChange(content)
      }

      // Update active format states
      setTimeout(updateActiveFormats, 10)
    }
  }, [onChange, updateActiveFormats])

  // Helper: Get text nodes intersecting a range, skipping contenteditable=false
  const getTextNodesInRange = useCallback((range: Range): Text[] => {
    const textNodes: Text[] = []
    const container = range.commonAncestorContainer
    const walker = document.createTreeWalker(
      container.nodeType === Node.TEXT_NODE ? container.parentNode! : container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip nodes inside contenteditable="false"
          let parent = node.parentElement
          while (parent) {
            if (parent.contentEditable === 'false') return NodeFilter.FILTER_REJECT
            if (parent === editorRef.current) break
            parent = parent.parentElement
          }
          // Check if node intersects range
          if (range.intersectsNode(node)) {
            return NodeFilter.FILTER_ACCEPT
          }
          return NodeFilter.FILTER_REJECT
        }
      }
    )

    let node: Node | null
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text)
    }
    return textNodes
  }, [])

  // Helper: Check if node is fully inside a mark
  const isFullyInMark = useCallback((node: Node): HTMLElement | null => {
    let parent = node.parentElement
    while (parent && editorRef.current?.contains(parent)) {
      if (parent.tagName === 'MARK') return parent
      parent = parent.parentElement
    }
    return null
  }, [])

  // Helper: Wrap node with mark
  const wrapNodeWithMark = useCallback((node: Node) => {
    const mark = document.createElement('mark')
    // Don't set inline styles - rely on CSS
    node.parentNode?.insertBefore(mark, node)
    mark.appendChild(node)
  }, [])

  // Helper: Unwrap node from mark, preserving siblings
  const unwrapNodeFromMark = useCallback((node: Node, mark: HTMLElement) => {
    mark.parentNode?.insertBefore(node, mark)
    // If mark is now empty, remove it
    if (!mark.hasChildNodes()) {
      mark.remove()
    }
  }, [])

  // Helper: Merge adjacent mark siblings
  const mergeAdjacentMarks = useCallback((container: Node) => {
    if (!container.parentElement) return
    const marks = Array.from(container.parentElement.querySelectorAll('mark'))
    marks.forEach(mark => {
      let next = mark.nextSibling
      while (next && next.nodeName === 'MARK') {
        // Merge next mark into current
        while (next.firstChild) {
          mark.appendChild(next.firstChild)
        }
        const toRemove = next
        next = next.nextSibling
        toRemove.remove()
      }
    })
  }, [])

  const toggleHighlight = useCallback(() => {
    if (!editorRef.current) return

    editorRef.current.focus()
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return
    if (selection.isCollapsed) return // Don't highlight empty selection

    const range = selection.getRangeAt(0).cloneRange()

    // Trim whitespace from selection boundaries
    const startContainer = range.startContainer
    let startOffset = range.startOffset
    const endContainer = range.endContainer
    let endOffset = range.endOffset

    // Trim leading whitespace
    if (startContainer.nodeType === Node.TEXT_NODE) {
      const text = (startContainer as Text).data
      while (startOffset < text.length && /\s/.test(text[startOffset])) {
        startOffset++
      }
    }

    // Trim trailing whitespace
    if (endContainer.nodeType === Node.TEXT_NODE) {
      const text = (endContainer as Text).data
      while (endOffset > 0 && /\s/.test(text[endOffset - 1])) {
        endOffset--
      }
    }

    // Update range with trimmed boundaries
    range.setStart(startContainer, startOffset)
    range.setEnd(endContainer, endOffset)

    if (range.collapsed) return // Nothing to highlight after trimming

    // Get all text nodes in range
    const textNodes = getTextNodesInRange(range)
    if (textNodes.length === 0) return

    // Check if all text nodes are fully highlighted
    const allHighlighted = textNodes.every(node => isFullyInMark(node))

    // Save selection for restoration
    const savedSelection = {
      startContainer: range.startContainer,
      startOffset: range.startOffset,
      endContainer: range.endContainer,
      endOffset: range.endOffset
    }

    textNodes.forEach(textNode => {
      const nodeRange = document.createRange()
      nodeRange.selectNodeContents(textNode)

      // Calculate intersection with selection range
      const start = textNode === range.startContainer ? range.startOffset : 0
      const end = textNode === range.endContainer ? range.endOffset : textNode.length

      // Split text node to isolate selected portion
      let targetNode = textNode
      if (end < textNode.length) {
        targetNode = textNode.splitText(end)
        targetNode = targetNode.previousSibling as Text
      }
      if (start > 0) {
        targetNode = (targetNode as Text).splitText(start) as Text
      }

      const existingMark = isFullyInMark(targetNode)

      if (allHighlighted && existingMark) {
        // Unhighlight: remove from mark
        unwrapNodeFromMark(targetNode, existingMark)
      } else if (!allHighlighted && !existingMark) {
        // Highlight: wrap with mark
        wrapNodeWithMark(targetNode)
      }
    })

    // Merge adjacent marks to reduce fragmentation
    textNodes.forEach(node => {
      if (node.parentElement) {
        mergeAdjacentMarks(node.parentElement)
        node.parentElement.normalize()
      }
    })

    // Restore selection (approximate - nodes may have changed)
    try {
      const newRange = document.createRange()
      newRange.setStart(savedSelection.startContainer, savedSelection.startOffset)
      newRange.setEnd(savedSelection.endContainer, savedSelection.endOffset)
      selection.removeAllRanges()
      selection.addRange(newRange)
    } catch {
      // If restoration fails, just collapse at end
      selection.collapseToEnd()
    }

    // Trigger change event
    if (onChange) {
      const content = editorRef.current.innerHTML || ''
      isInternalChangeRef.current = true
      onChange(content)
    }

    // Update active format states
    setTimeout(updateActiveFormats, 10)
  }, [onChange, updateActiveFormats, getTextNodesInRange, isFullyInMark, wrapNodeWithMark, unwrapNodeFromMark, mergeAdjacentMarks])

  const insertHeading = useCallback((level: number) => {
    if (editorRef.current) {
      editorRef.current.focus()
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        let node: Node | null = range.commonAncestorContainer

        // If text node, get parent element
        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentElement
        }

        // Check if already in a heading of this level
        let currentEl: HTMLElement | null = node as HTMLElement
        let existingHeading: HTMLElement | null = null

        while (currentEl && editorRef.current.contains(currentEl)) {
          if (currentEl.tagName === `H${level}`) {
            existingHeading = currentEl
            break
          }
          currentEl = currentEl.parentElement
        }

        if (existingHeading) {
          // Remove heading: unwrap contents back to parent
          const parent = existingHeading.parentElement
          if (parent) {
            const fragment = document.createDocumentFragment()
            while (existingHeading.firstChild) {
              fragment.appendChild(existingHeading.firstChild)
            }
            parent.replaceChild(fragment, existingHeading)
          }
        } else {
          // Add heading
          const headingElement = document.createElement(`h${level}`)
          headingElement.style.fontSize = level === 1 ? '1.5em' : '1.25em'
          headingElement.style.fontWeight = 'bold'
          headingElement.style.marginBottom = '0.5em'

          try {
            // Try to wrap the selection (preserves HTML content)
            range.surroundContents(headingElement)
          } catch {
            // If surroundContents fails (e.g., selection spans multiple elements),
            // extract contents as document fragment to preserve HTML
            const fragment = range.extractContents()
            headingElement.appendChild(fragment)
            range.insertNode(headingElement)
          }

          // Move cursor after the heading
          range.setStartAfter(headingElement)
          range.setEndAfter(headingElement)
          selection.removeAllRanges()
          selection.addRange(range)
        }

        // Trigger change event
        if (onChange) {
          const content = editorRef.current.innerHTML || ''
          isInternalChangeRef.current = true
          onChange(content)
        }

        // Update active format states
        setTimeout(updateActiveFormats, 10)
      }
    }
  }, [onChange, updateActiveFormats])

  const insertList = useCallback((ordered: boolean) => {
    console.log('[insertList] Called with ordered:', ordered)
    if (editorRef.current) {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0) {
        console.warn('[insertList] No selection available')
        return
      }

      // Save the range before focusing
      const range = selection.getRangeAt(0).cloneRange()
      console.log('[insertList] Range:', range, 'Collapsed:', range.collapsed)

      editorRef.current.focus()

      // Restore selection after focus
      selection.removeAllRanges()
      selection.addRange(range)

      let node: Node | null = range.commonAncestorContainer

      // If text node, get parent element
      if (node.nodeType === Node.TEXT_NODE) {
        node = node.parentElement
      }

      const listTag = ordered ? 'OL' : 'UL'
      const otherListTag = ordered ? 'UL' : 'OL'

      // Check if already in a list of this type
      let currentEl: HTMLElement | null = node as HTMLElement
      let existingList: HTMLElement | null = null
      let existingOtherList: HTMLElement | null = null

      while (currentEl && editorRef.current.contains(currentEl)) {
        if (currentEl.tagName === listTag) {
          existingList = currentEl
          break
        }
        if (currentEl.tagName === otherListTag) {
          existingOtherList = currentEl
          break
        }
        currentEl = currentEl.parentElement
      }

      const moveChildren = (source: Node, target: HTMLElement) => {
        while (source.firstChild) {
          target.appendChild(source.firstChild)
        }
      }

      const wasCollapsed = selection.isCollapsed

      if (existingList) {
        // Remove list: unwrap LI elements back into block content
        const parent = existingList.parentElement
        if (parent) {
          const fragment = document.createDocumentFragment()
          Array.from(existingList.children).forEach(child => {
            if (!(child instanceof HTMLLIElement)) return
            const block = document.createElement('div')
            moveChildren(child, block)
            if (!block.hasChildNodes()) {
              block.appendChild(document.createElement('br'))
            }
            fragment.appendChild(block)
          })
          parent.replaceChild(fragment, existingList)
        }
      } else if (existingOtherList) {
        // Convert from one list type to another
        const newList = document.createElement(listTag)
        Array.from(existingOtherList.children).forEach(child => {
          if (!(child instanceof HTMLLIElement)) return
          const newLi = document.createElement('li')
          moveChildren(child, newLi)
          if (!newLi.hasChildNodes()) {
            newLi.appendChild(document.createElement('br'))
          }
          newList.appendChild(newLi)
        })
        existingOtherList.parentElement?.replaceChild(newList, existingOtherList)
      } else {
        const listElement = document.createElement(listTag)

        const finishCurrentItem = (items: HTMLLIElement[], currentItem: HTMLLIElement, forceEmpty = false) => {
          if (!currentItem.hasChildNodes()) {
            if (!forceEmpty) {
              return { items, currentItem }
            }
            currentItem.appendChild(document.createElement('br'))
          }
          items.push(currentItem)
          return { items, currentItem: document.createElement('li') }
        }

        try {
          // If selection is collapsed (just cursor), expand to include current block
          if (wasCollapsed && range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
            const textNode = range.commonAncestorContainer as Text
            const parentBlock = textNode.parentElement

            if (parentBlock && editorRef.current.contains(parentBlock)) {
              // Expand range to select the entire parent block content
              range.selectNodeContents(parentBlock)
              console.log('[insertList] Expanded collapsed range to parent block:', parentBlock)
            }
          }

          const fragment = range.extractContents()
          const nodes = Array.from(fragment.childNodes)

          let listItems: HTMLLIElement[] = []
          let currentItem = document.createElement('li')

          nodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent ?? ''
              const parts = text.split(/\n/)
              parts.forEach((part, index) => {
                if (index > 0) {
                  const result = finishCurrentItem(listItems, currentItem, true)
                  listItems = result.items
                  currentItem = result.currentItem
                }
                if (part.length > 0) {
                  currentItem.appendChild(document.createTextNode(part))
                }
              })
              return
            }

            if (node.nodeName === 'BR') {
              const result = finishCurrentItem(listItems, currentItem, true)
              listItems = result.items
              currentItem = result.currentItem
              return
            }

            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement
              const tag = element.tagName.toLowerCase()

              if (tag === 'div' || tag === 'p') {
                const before = finishCurrentItem(listItems, currentItem)
                listItems = before.items
                currentItem = before.currentItem
                const newItem = document.createElement('li')
                moveChildren(element, newItem)
                if (!newItem.hasChildNodes()) {
                  newItem.appendChild(document.createElement('br'))
                }
                listItems.push(newItem)
                return
              }

              if (tag === 'ul' || tag === 'ol') {
                const before = finishCurrentItem(listItems, currentItem)
                listItems = before.items
                currentItem = before.currentItem
                Array.from(element.children).forEach(child => {
                  if (!(child instanceof HTMLLIElement)) return
                  const newItem = document.createElement('li')
                  moveChildren(child, newItem)
                  if (!newItem.hasChildNodes()) {
                    newItem.appendChild(document.createElement('br'))
                  }
                  listItems.push(newItem)
                })
                return
              }

              if (tag === 'li') {
                const before = finishCurrentItem(listItems, currentItem)
                listItems = before.items
                currentItem = before.currentItem
                const newItem = document.createElement('li')
                moveChildren(element, newItem)
                if (!newItem.hasChildNodes()) {
                  newItem.appendChild(document.createElement('br'))
                }
                listItems.push(newItem)
                return
              }

              currentItem.appendChild(element)
              return
            }

            currentItem.appendChild(node)
          })

          if (currentItem.hasChildNodes()) {
            listItems.push(currentItem)
          }

          if (listItems.length === 0) {
            const emptyItem = document.createElement('li')
            emptyItem.appendChild(document.createElement('br'))
            listItems.push(emptyItem)
          }

          listItems.forEach(item => listElement.appendChild(item))
          console.log('[insertList] Created list with', listItems.length, 'items')
          range.insertNode(listElement)
          listElement.normalize()

          // Clean up empty list items (items with only <br> or whitespace)
          Array.from(listElement.children).forEach(child => {
            if (child instanceof HTMLLIElement) {
              const hasContent = Array.from(child.childNodes).some(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                  return node.textContent && node.textContent.trim() !== ''
                }
                if (node.nodeType === Node.ELEMENT_NODE) {
                  const el = node as HTMLElement
                  return el.tagName !== 'BR'
                }
                return false
              })
              if (!hasContent && listElement.children.length > 1) {
                child.remove()
              }
            }
          })

          // Clean up empty adjacent nodes that may be left after extraction
          const cleanupEmptyNode = (node: Node | null) => {
            if (!node || !node.parentNode) return
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement
              // Remove if empty div/p/br or just whitespace
              if ((el.tagName === 'DIV' || el.tagName === 'P' || el.tagName === 'BR') &&
                  (!el.textContent || el.textContent.trim() === '')) {
                node.parentNode.removeChild(node)
              }
            } else if (node.nodeType === Node.TEXT_NODE && (!node.textContent || node.textContent.trim() === '')) {
              node.parentNode.removeChild(node)
            }
          }

          cleanupEmptyNode(listElement.previousSibling)
          cleanupEmptyNode(listElement.nextSibling)

          console.log('[insertList] List inserted into DOM:', listElement)

          const firstItem = listElement.firstElementChild as HTMLLIElement | null
          const lastItem = listElement.lastElementChild as HTMLLIElement | null
          console.log('[insertList] First item:', firstItem, 'Last item:', lastItem)
          if (firstItem && lastItem) {
            const newRange = document.createRange()
            if (wasCollapsed) {
              newRange.setStart(firstItem, 0)
              newRange.collapse(true)
            } else {
              newRange.setStart(firstItem, 0)
              newRange.setEnd(lastItem, lastItem.childNodes.length)
            }
            selection.removeAllRanges()
            selection.addRange(newRange)
          }
        } catch (error) {
          console.error('[insertList] Error creating list:', error)
          const fallbackItem = document.createElement('li')
          fallbackItem.appendChild(document.createElement('br'))
          listElement.appendChild(fallbackItem)
          range.insertNode(listElement)

          const newRange = document.createRange()
          newRange.setStart(fallbackItem, 0)
          newRange.collapse(true)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
      }

      // Trigger change event
      if (onChange) {
        const content = editorRef.current.innerHTML || ''
        console.log('[insertList] Triggering onChange with content length:', content.length)
        isInternalChangeRef.current = true
        onChange(content)
      }

      // Update active format states
      setTimeout(updateActiveFormats, 10)
      console.log('[insertList] Complete')
    }
  }, [onChange, updateActiveFormats])

  const setAlignment = useCallback((align: string) => {
    formatText(`justify${align.charAt(0).toUpperCase() + align.slice(1)}`)
  }, [formatText])

  const toggleBlockquoteOrIndent = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus()
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        let node: Node | null = range.commonAncestorContainer

        // If text node, get parent element
        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentElement
        }

        // Check if we're in a list - if so, use indent
        let currentEl: HTMLElement | null = node as HTMLElement
        let inList = false
        let existingBlockquote: HTMLElement | null = null

        while (currentEl && editorRef.current.contains(currentEl)) {
          if (currentEl.tagName === 'UL' || currentEl.tagName === 'OL' || currentEl.tagName === 'LI') {
            inList = true
          }
          if (currentEl.tagName === 'BLOCKQUOTE') {
            existingBlockquote = currentEl
          }
          currentEl = currentEl.parentElement
        }

        if (inList) {
          // In a list: use indent command to increase nesting
          document.execCommand('indent', false)
        } else if (existingBlockquote) {
          // Remove blockquote: unwrap contents
          const parent = existingBlockquote.parentElement
          if (parent) {
            const fragment = document.createDocumentFragment()
            while (existingBlockquote.firstChild) {
              fragment.appendChild(existingBlockquote.firstChild)
            }
            parent.replaceChild(fragment, existingBlockquote)
          }
        } else {
          // Create blockquote with custom logic (similar to list insertion)
          const wasCollapsed = selection.isCollapsed

          // If selection is collapsed (just cursor), expand to include current block
          if (wasCollapsed && range.commonAncestorContainer.nodeType === Node.TEXT_NODE) {
            const textNode = range.commonAncestorContainer as Text
            const parentBlock = textNode.parentElement

            if (parentBlock && editorRef.current.contains(parentBlock)) {
              // Expand range to select the entire parent block content
              range.selectNodeContents(parentBlock)
            }
          }

          // Extract the selected content
          const fragment = range.extractContents()

          // Create blockquote element
          const blockquote = document.createElement('blockquote')
          blockquote.appendChild(fragment)

          // Insert blockquote at the range position
          range.insertNode(blockquote)

          // Place cursor at the end of the blockquote
          range.selectNodeContents(blockquote)
          range.collapse(false)
          selection.removeAllRanges()
          selection.addRange(range)
        }

        // Trigger change event
        if (onChange) {
          const content = editorRef.current.innerHTML || ''
          isInternalChangeRef.current = true
          onChange(content)
        }

        // Update active format states
        setTimeout(updateActiveFormats, 10)
      }
    }
  }, [onChange, updateActiveFormats])

  const handleInput = useCallback(() => {
    if (onChange && editorRef.current) {
      const content = editorRef.current.innerHTML || ''
      onChange(content)
    }
    updateActiveFormats()
  }, [onChange, updateActiveFormats])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }, [])

  const handleTextSelection = useCallback(() => {
    // Add a small delay to ensure the selection has been processed
    setTimeout(() => {
      const selection = window.getSelection()

      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const selectedText = selection.toString().trim()

        // Additional check: ensure the selection is within our editor
        if (selectedText.length > 0 && editorRef.current) {
          const range = selection.getRangeAt(0)
          const isWithinEditor = editorRef.current.contains(range.commonAncestorContainer)

          if (isWithinEditor) {
            setSelectedText(selectedText)
            setHasSelection(true)
            updateActiveFormats()
            return
          }
        }
      }

      setHasSelection(false)
      updateActiveFormats()
    }, 50)
  }, [updateActiveFormats])

  const handleMakeNoteClick = useCallback(() => {
    if (selectedText && onMakeNote) {
      onMakeNote(selectedText)
      setHasSelection(false)
      setSelectedText('')
    }
  }, [selectedText, onMakeNote])

  const handleClickOutside = useCallback((e: Event) => {
    const target = e.target as HTMLElement
    if (target && !target.closest('[contenteditable]') && !target.closest('[data-make-note-button]')) {
      setHasSelection(false)
      setSelectedText('')
    }
  }, [])

  const handleTranscription = useCallback((text: string) => {
    if (editorRef.current && onChange) {
      // Insert transcribed text at cursor position or append to end
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const isWithinEditor = editorRef.current.contains(range.commonAncestorContainer)

        if (isWithinEditor) {
          // Insert at cursor
          const textNode = document.createTextNode(text)
          range.insertNode(textNode)

          // Move cursor after inserted text
          range.setStartAfter(textNode)
          range.setEndAfter(textNode)
          selection.removeAllRanges()
          selection.addRange(range)
        } else {
          // Append to end as text node (prevents XSS from transcription service)
          const textNode = document.createTextNode(text)
          editorRef.current.appendChild(textNode)
        }
      } else {
        // Append to end as text node (prevents XSS from transcription service)
        const textNode = document.createTextNode(text)
        editorRef.current.appendChild(textNode)
      }

      // Trigger onChange
      const content = editorRef.current.innerHTML || ''
      onChange(content)

      // Call parent callback if provided
      onTranscription?.(text)
    }
  }, [onChange, onTranscription])

  // Handle opening note picker - save cursor position
  const handleSearchClick = useCallback(() => {
    saveCursorPosition()
    setShowNotePicker(true)
  }, [saveCursorPosition])

  // Handle note selection - insert link at saved cursor position
  const handleNoteSelect = useCallback((note: NoteLinkSearchResult) => {
    const inserted = insertNoteLinkAtCursor(note, editorRef)
    if (inserted) {
      // Trigger onChange
      if (onChange && editorRef.current) {
        const content = editorRef.current.innerHTML || ''
        isInternalChangeRef.current = true
        onChange(content)
      }
      if (onNoteLinkInsert) {
        Promise.resolve(onNoteLinkInsert(note)).catch(error => {
          console.error('Error persisting note link:', error)
        })
      }
    }
    setShowNotePicker(false)
  }, [insertNoteLinkAtCursor, onChange, onNoteLinkInsert])

  // Set initial content when value changes
  React.useEffect(() => {
    console.log('[useEffect] value changed, isInternalChangeRef:', isInternalChangeRef.current)

    // Skip updating if this was an internal change (formatting, list creation, etc.)
    if (isInternalChangeRef.current) {
      console.log('[useEffect] Skipping update - this was an internal change')
      isInternalChangeRef.current = false
      return
    }

    if (editorRef.current && value !== undefined) {
      const currentContent = editorRef.current.innerHTML || ''
      console.log('[useEffect] Current content length:', currentContent.length, 'New value length:', value?.length)
      console.log('[useEffect] Has <ul>/<ol> in DOM:', currentContent.includes('<ul>') || currentContent.includes('<ol>'))
      console.log('[useEffect] Has <ul>/<ol> in value:', value?.includes('<ul>') || value?.includes('<ol>'))

      if (currentContent !== value) {
        console.log('[useEffect] Content mismatch - OVERWRITING innerHTML')
        editorRef.current.innerHTML = value
      } else {
        console.log('[useEffect] Content matches - no overwrite needed')
      }
    }
  }, [value])

  // Auto focus
  React.useEffect(() => {
    if (autoFocus && editorRef.current) {
      editorRef.current.focus()
    }
  }, [autoFocus])

  // Selection detection and event listeners
  useEffect(() => {
    const handleSelection = () => {
      // Add a small delay to ensure selection has been processed
      setTimeout(handleTextSelection, 50)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hasSelection) {
        setHasSelection(false)
        setSelectedText('')
      }
    }

    // Listen for selection changes more comprehensively
    document.addEventListener('mouseup', handleSelection)
    document.addEventListener('keyup', handleSelection)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('selectionchange', handleSelection)

    // Also listen on the editor element directly
    const editor = editorRef.current
    if (editor) {
      editor.addEventListener('mouseup', handleSelection)
      editor.addEventListener('keyup', handleSelection)
    }

    return () => {
      document.removeEventListener('mouseup', handleSelection)
      document.removeEventListener('keyup', handleSelection)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('selectionchange', handleSelection)

      if (editor) {
        editor.removeEventListener('mouseup', handleSelection)
        editor.removeEventListener('keyup', handleSelection)
      }
    }
  }, [handleTextSelection, handleClickOutside, hasSelection])

  return (
    <div className={cn(
      "relative min-h-[120px] w-full overflow-hidden",
      variant === 'default' && "border rounded-md",
      className
    )}>
      {/* Editor */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning={true}
          onInput={handleInput}
          onFocus={onFocus}
          onBlur={onBlur}
          onPaste={handlePaste}
          className={cn(
            "rich-editor-body min-h-[120px] w-full resize-none border-0 bg-transparent text-foreground focus:outline-none focus:ring-0 text-base leading-relaxed",
            variant === 'default' ? "p-4" : "px-2 py-0"
          )}
          style={{ whiteSpace: 'pre-wrap' }}
        />
        {/* Placeholder */}
        {(!value && !initialValue) && (
          <div className={cn(
            "absolute text-muted-foreground pointer-events-none select-none text-base",
            variant === 'default' ? "left-4 top-4" : "left-2 top-0"
          )}>
            {placeholder}
          </div>
        )}
      </div>

      {/* Formatting Toolbar */}
      <div className={cn(
        "flex items-center gap-1 p-2 bg-muted/50 flex-wrap",
        variant === 'flush' ? "border rounded-md" : "border-t mt-2"
      )}>
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            size="sm"
            variant={activeFormats.bold ? "secondary" : "ghost"}
            onMouseDown={(e) => {
              e.preventDefault()
            }}
            onClick={() => formatText('bold')}
            className="h-8 w-8 p-0"
            type="button"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeFormats.italic ? "secondary" : "ghost"}
            onMouseDown={(e) => {
              e.preventDefault()
            }}
            onClick={() => formatText('italic')}
            className="h-8 w-8 p-0"
            type="button"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeFormats.underline ? "secondary" : "ghost"}
            onMouseDown={(e) => {
              e.preventDefault()
            }}
            onClick={() => formatText('underline')}
            className="h-8 w-8 p-0"
            type="button"
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeFormats.highlight ? "secondary" : "ghost"}
            onMouseDown={(e) => {
              e.preventDefault()
            }}
            onClick={toggleHighlight}
            className="h-8 w-8 p-0"
            type="button"
            title="Highlight"
          >
            <Highlighter className="h-4 w-4" />
          </Button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            size="sm"
            variant={activeFormats.h1 ? "secondary" : "ghost"}
            onMouseDown={(e) => {
              e.preventDefault()
            }}
            onClick={() => insertHeading(1)}
            className="h-8 w-8 p-0"
            type="button"
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeFormats.h2 ? "secondary" : "ghost"}
            onMouseDown={(e) => {
              e.preventDefault()
            }}
            onClick={() => insertHeading(2)}
            className="h-8 w-8 p-0"
            type="button"
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            size="sm"
            variant={activeFormats.ul ? "secondary" : "ghost"}
            onMouseDown={(e) => {
              e.preventDefault()
            }}
            onClick={() => insertList(false)}
            className="h-8 w-8 p-0"
            type="button"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={activeFormats.ol ? "secondary" : "ghost"}
            onMouseDown={(e) => {
              e.preventDefault()
            }}
            onClick={() => insertList(true)}
            className="h-8 w-8 p-0"
            type="button"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            size="sm"
            variant="ghost"
            onMouseDown={(e) => {
              e.preventDefault()
            }}
            onClick={() => setAlignment('left')}
            className="h-8 w-8 p-0"
            type="button"
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onMouseDown={(e) => {
              e.preventDefault()
            }}
            onClick={() => setAlignment('center')}
            className="h-8 w-8 p-0"
            type="button"
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onMouseDown={(e) => {
              e.preventDefault()
            }}
            onClick={() => setAlignment('right')}
            className="h-8 w-8 p-0"
            type="button"
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Quote */}
        <Button
          size="sm"
          variant={activeFormats.blockquote ? "secondary" : "ghost"}
          onMouseDown={(e) => {
            e.preventDefault()
          }}
          onClick={toggleBlockquoteOrIndent}
          className="h-8 w-8 p-0"
          type="button"
          title="Quote/Blockquote (or Indent in lists)"
        >
          <Quote className="h-4 w-4" />
        </Button>

        {/* Make Note - only show when text is selected and onMakeNote is provided */}
        {hasSelection && onMakeNote && (
          <div className="flex items-center border-l pl-2 ml-2" data-make-note-button>
            <Button
              size="sm"
              variant="ghost"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleMakeNoteClick()
              }}
              className="h-8 px-2 flex items-center gap-1"
              type="button"
              title="Create a note from selected text"
              data-make-note-button
              data-testid="make-note-button"
            >
              <FileText className="h-4 w-4" />
              <span className="text-xs">Make Note</span>
            </Button>
          </div>
        )}

        {/* Note Link Search */}
        <div className="flex items-center border-l pl-2 ml-2" data-note-link-button>
          <Popover open={showNotePicker} onOpenChange={setShowNotePicker}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onMouseDown={(e) => {
                  e.preventDefault()
                }}
                onClick={handleSearchClick}
                className="h-8 w-8 p-0"
                type="button"
                title="Link to a note or journal entry"
              >
                <Search className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[400px] p-0"
              align="start"
              data-note-link-popover
              onOpenAutoFocus={(e) => {
                // Prevent focus from moving to popover trigger
                e.preventDefault()
              }}
            >
              <NoteLinkPicker onSelect={handleNoteSelect} isGuest={isGuest} />
            </PopoverContent>
          </Popover>
        </div>

        {/* Voice Transcription Button */}
        <div className="flex items-center border-l pl-2 ml-2" data-voice-button>
          <VoiceRecordButton onTranscriptionComplete={handleTranscription} />
        </div>
      </div>

    </div>
  )
}
