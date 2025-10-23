'use client'

import React, { useRef, useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Bold, Italic, Underline, List, ListOrdered, Heading1, Heading2, Quote, AlignLeft, AlignCenter, AlignRight, FileText } from 'lucide-react'
import { VoiceRecordButton } from '@/components/editor/VoiceRecordButton'

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
  onTranscription
}: SimpleRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [selectedText, setSelectedText] = useState('')
  const [hasSelection, setHasSelection] = useState(false)

  const formatText = useCallback((command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus()
      document.execCommand(command, false, value)

      // Trigger change event after formatting
      if (onChange) {
        const content = editorRef.current.innerHTML || ''
        onChange(content)
      }
    }
  }, [onChange])

  const insertHeading = useCallback((level: number) => {
    if (editorRef.current) {
      editorRef.current.focus()
      const selection = window.getSelection()
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        const headingElement = document.createElement(`h${level}`)
        headingElement.style.fontSize = level === 1 ? '1.5em' : '1.25em'
        headingElement.style.fontWeight = 'bold'
        headingElement.style.marginBottom = '0.5em'

        try {
          range.surroundContents(headingElement)
        } catch {
          // If can't surround, insert at cursor
          headingElement.textContent = 'Heading'
          range.insertNode(headingElement)
        }

        // Trigger change event
        if (onChange) {
          const content = editorRef.current.innerHTML || ''
          onChange(content)
        }
      }
    }
  }, [onChange])

  const insertList = useCallback((ordered: boolean) => {
    formatText(ordered ? 'insertOrderedList' : 'insertUnorderedList')
  }, [formatText])

  const setAlignment = useCallback((align: string) => {
    formatText(`justify${align.charAt(0).toUpperCase() + align.slice(1)}`)
  }, [formatText])

  const handleInput = useCallback(() => {
    if (onChange && editorRef.current) {
      const content = editorRef.current.innerHTML || ''
      onChange(content)
    }
  }, [onChange])

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
            return
          }
        }
      }

      setHasSelection(false)
    }, 50)
  }, [])

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
          // Append to end
          editorRef.current.innerHTML += text
        }
      } else {
        // Append to end
        editorRef.current.innerHTML += text
      }

      // Trigger onChange
      const content = editorRef.current.innerHTML || ''
      onChange(content)

      // Call parent callback if provided
      onTranscription?.(text)
    }
  }, [onChange, onTranscription])

  // Set initial content when value changes
  React.useEffect(() => {
    if (editorRef.current && value !== undefined) {
      const currentContent = editorRef.current.innerHTML || ''
      if (currentContent !== value) {
        editorRef.current.innerHTML = value
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
    <div className="relative min-h-[120px] w-full border rounded-md overflow-hidden">
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b bg-muted/50 flex-wrap">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => formatText('bold')}
            className="h-8 w-8 p-0"
            type="button"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => formatText('italic')}
            className="h-8 w-8 p-0"
            type="button"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => formatText('underline')}
            className="h-8 w-8 p-0"
            type="button"
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </Button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r pr-2 mr-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => insertHeading(1)}
            className="h-8 w-8 p-0"
            type="button"
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
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
            variant="ghost"
            onClick={() => insertList(false)}
            className="h-8 w-8 p-0"
            type="button"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
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
          variant="ghost"
          onClick={() => formatText('indent')}
          className="h-8 w-8 p-0"
          type="button"
          title="Quote/Indent"
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
            >
              <FileText className="h-4 w-4" />
              <span className="text-xs">Make Note</span>
            </Button>
          </div>
        )}

        {/* Voice Transcription Button */}
        <div className="flex items-center border-l pl-2 ml-2" data-voice-button>
          <VoiceRecordButton onTranscriptionComplete={handleTranscription} />
        </div>
      </div>

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
          className="min-h-[120px] w-full resize-none border-0 bg-transparent p-4 text-foreground focus:outline-none focus:ring-0 text-base leading-relaxed"
          style={{ whiteSpace: 'pre-wrap' }}
        />
        {/* Placeholder */}
        {(!value && !initialValue) && (
          <div className="absolute left-4 top-4 text-muted-foreground pointer-events-none select-none text-base">
            {placeholder}
          </div>
        )}
      </div>

    </div>
  )
}