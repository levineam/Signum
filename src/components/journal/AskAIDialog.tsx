'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import type { AIAnswerRequest, AIAnswerResponse, AIAnswerErrorResponse } from '@/lib/ai/types'

interface AskAIDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedText: string
  entryId?: string
  onAnswerCreated?: (noteId: string) => void
}

type ButtonState = 'idle' | 'loading' | 'success' | 'error'

export function AskAIDialog({
  isOpen,
  onClose,
  selectedText,
  entryId,
  onAnswerCreated
}: AskAIDialogProps) {
  const { session } = useAuth()
  const [query, setQuery] = useState('')
  const [state, setState] = useState<ButtonState>('idle')
  const [isTruncated, setIsTruncated] = useState(false)
  const suppressAutoOpenRef = useRef(false)

  // Initialize query from selected text when dialog opens
  useEffect(() => {
    if (isOpen && selectedText) {
      // Truncate to 500 chars if needed
      if (selectedText.length > 500) {
        setQuery(selectedText.substring(0, 500))
        setIsTruncated(true)
      } else {
        setQuery(selectedText)
        setIsTruncated(false)
      }
    }
  }, [isOpen, selectedText])

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setState('idle')
      setQuery('')
      setIsTruncated(false)
    }
  }, [isOpen])

  // Track if user manually closed dialog while a request is in-flight
  useEffect(() => {
    if (!isOpen && state === 'loading') {
      suppressAutoOpenRef.current = true
    } else if (isOpen && state === 'idle') {
      suppressAutoOpenRef.current = false
    }
  }, [isOpen, state])

  const handleGenerateAnswer = async () => {
    if (!session?.access_token) {
      toast.error('Please sign in to use AI features')
      return
    }

    if (!query.trim()) {
      toast.error('Please enter a question')
      return
    }

    suppressAutoOpenRef.current = false
    setState('loading')

    try {
      const requestBody: AIAnswerRequest = {
        sourceType: 'journal',
        query: query.trim(),
        selectedText,
        ...(entryId && { entryId }),
      }

      const response = await fetch('/api/ai/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData: AIAnswerErrorResponse = await response.json().catch(() => ({
          error: 'Unknown error',
          code: 'INTERNAL_ERROR' as const
        }))

        // Handle specific error codes
        if (response.status === 429) {
          throw new Error('Daily AI limit reached. Try again tomorrow.')
        }

        throw new Error(errorData.error || 'Failed to generate answer')
      }

      const data: AIAnswerResponse = await response.json()
      setState('success')

      // Log for debugging
      console.log('[Ask AI] Answer received:', {
        noteId: data.noteId,
        tokensUsed: data.tokensUsed,
        model: data.model
      })

      if (data.noteId) {
        if (!suppressAutoOpenRef.current) {
          // Notify parent component
          onAnswerCreated?.(data.noteId)
          toast.success('AI answer created! Opening note...', {
            duration: 2000
          })

          // Close dialog after short delay
          setTimeout(() => {
            onClose()
          }, 500)
        } else {
          toast.success('AI answer created. Open the note when you are ready.', {
            duration: 2000
          })
        }
      } else if (data.warning) {
        toast.warning(data.warning)
        onClose()
      } else {
        toast.success('AI answer generated!')
        onClose()
      }

    } catch (error) {
      setState('error')
      const errorMessage = error instanceof Error
        ? error.message
        : 'Unable to generate answer. Please try again.'

      toast.error(errorMessage)

      // Reset to idle after 3 seconds
      setTimeout(() => setState('idle'), 3000)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  // Character count and validation
  const charCount = query.length
  const isOverLimit = charCount > 500
  const isNearLimit = charCount > 480
  const isDisabled = state === 'loading' || !query.trim() || isOverLimit

  // Preview text for selected text display (max 200 chars)
  const previewText = selectedText.length > 200
    ? selectedText.substring(0, 197) + '...'
    : selectedText

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onKeyDown={handleKeyDown}
        data-ask-ai-dialog
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Ask AI About Your Journaling
          </DialogTitle>
          <DialogDescription>
            Refine your question below, then generate an AI-powered answer that will be saved as a note.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Selected Text Display */}
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Selected Text
            </label>
            <div className="p-3 bg-muted rounded-md text-sm border border-border">
              {previewText}
            </div>
          </div>

          {/* Truncation Warning */}
          {isTruncated && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-900 dark:text-amber-100">
                <strong>Selection truncated to 500 characters.</strong> Edit as needed.
              </div>
            </div>
          )}

          {/* Query Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Your Question
            </label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What would you like to know about this text?"
              className="min-h-[120px] resize-none"
              disabled={state === 'loading'}
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <div className={`text-sm ${
                isOverLimit
                  ? 'text-destructive font-medium'
                  : isNearLimit
                  ? 'text-amber-600 dark:text-amber-500'
                  : 'text-muted-foreground'
              }`}>
                {charCount}/500
              </div>
              {isOverLimit && (
                <div className="text-sm text-destructive">
                  Query too long
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={state === 'loading'}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerateAnswer}
            disabled={isDisabled}
            className={
              state === 'idle'
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                : state === 'loading'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                : state === 'success'
                ? 'bg-gradient-to-r from-green-600 to-green-700'
                : 'bg-destructive hover:bg-destructive/90'
            }
          >
            {state === 'loading' ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : state === 'success' ? (
              <>
                Answer Created
              </>
            ) : state === 'error' ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Try Again
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Answer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
