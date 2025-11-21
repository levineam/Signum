'use client'

import { useState, useEffect, useRef, useId } from 'react'
import type { KeyboardEvent } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { createNote } from '@/lib/supabase/notes'
import type { NoteMetadata } from '@/types/note'
import type { AIAnswerRequest, AIAnswerResponse, AIAnswerErrorResponse } from '@/lib/ai/types'

interface AskAIDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedText: string
  entryId?: string
  onAnswerCreated?: (noteId: string, selectedText: string, entryId?: string) => void
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
  const [generatedAnswer, setGeneratedAnswer] = useState<string | null>(null)
  const [isSelectionTruncated, setIsSelectionTruncated] = useState(false)
  const suppressAutoOpenRef = useRef(false)
  const promptLabelId = useId()

  // P2 FIX: Capture selection context when dialog opens to prevent linking to wrong text
  // if user changes selection while AI request is in-flight
  const capturedSelectionRef = useRef<string>('')
  const capturedEntryIdRef = useRef<string | undefined>(undefined)

  // Initialize query from selected text when dialog opens
  useEffect(() => {
    if (isOpen && selectedText) {
      // Capture selection metadata at dialog open time
      capturedSelectionRef.current = selectedText
      capturedEntryIdRef.current = entryId

      // Truncate to 500 chars if needed
      const wasTruncated = selectedText.length > 500
      const nextQuery = wasTruncated
        ? selectedText.substring(0, 500)
        : selectedText

      setQuery(nextQuery)
      setIsSelectionTruncated(wasTruncated)
    }
  }, [isOpen, selectedText, entryId])

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setState('idle')
      setQuery('')
      setGeneratedAnswer(null)
      setIsSelectionTruncated(false)
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
      const truncatedSelectedText = selectedText.length > 500
        ? selectedText.substring(0, 500)
        : selectedText

      const requestBody: AIAnswerRequest = {
        sourceType: 'journal',
        query: query.trim(),
        selectedText: truncatedSelectedText,
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

      // Log for debugging
      console.log('[Ask AI] Answer received:', {
        tokensUsed: data.tokensUsed,
        model: data.model,
        hasTitle: !!data.title,
        hasMetadata: !!data.metadata
      })

      // SECURITY FIX (PR #164 P1): Create note client-side to support encryption
      // The createNote function checks hasEncryptionKey() and encrypts if enabled
      if (!session?.user?.id) {
        throw new Error('User session lost')
      }

      try {
        const note = await createNote(
          {
            title: data.title || 'AI Answer',
            content: data.answer,
            noteType: 'custom',
            isPinned: false,
            metadata: data.metadata as Partial<NoteMetadata> | undefined,
          },
          session.user.id
        )

        console.log('[Ask AI] Note created with encryption support:', {
          noteId: note.id,
          hasMetadata: !!data.metadata
        })

        setState('success')

        // P1 FIX: Always call onAnswerCreated to link the note, regardless of suppressAutoOpenRef
        // P2 FIX: Pass captured selection context to prevent linking to wrong text if selection changed
        onAnswerCreated?.(note.id, capturedSelectionRef.current, capturedEntryIdRef.current)

        if (!suppressAutoOpenRef.current) {
          toast.success('AI answer created! Opening note...', {
            duration: 2000
          })

          // Close dialog after short delay
          setTimeout(() => {
            onClose()
          }, 500)
        } else {
          // Dialog was closed during loading, but note was still created and linked
          toast.success('AI answer created. Open the note when you are ready.', {
            duration: 2000
          })
        }
      } catch (noteError) {
        console.error('[Ask AI] Failed to create note:', noteError)
        setState('success') // AI succeeded, just note creation failed

        // P2 FIX: When note creation fails, display the generated answer so it's not lost
        setGeneratedAnswer(data.answer)
        toast.warning('Answer generated but failed to save as note. See below.', {
          duration: 4000
        })
        // Keep dialog open so user can see the answer
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

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  // Character count and validation
  const charCount = query.length
  const isOverLimit = charCount > 500
  const isNearLimit = charCount > 480
  const isDisabled = state === 'loading' || !query.trim() || isOverLimit

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
            Ask AI
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Display Generated Answer if note creation failed */}
          {generatedAnswer && (
            <div className="space-y-2">
              <label className="text-sm font-medium mb-2 block">
                Generated Answer (Note creation failed, but here&apos;s your answer)
              </label>
              <div
                className="p-4 bg-muted rounded-md text-sm border border-border prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: generatedAnswer }}
              />
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900 dark:text-amber-100">
                  The AI generated this answer, but it couldn&apos;t be saved as a note. You can copy the text above.
                </div>
              </div>
            </div>
          )}

          {/* Only show input fields if no answer is being displayed */}
          {!generatedAnswer && (
            <>
              {/* Query Input */}
              <div>
                <h2 id={promptLabelId} className="text-xl font-semibold mb-2">
                  Your prompt
                </h2>
                {isSelectionTruncated && (
                  <div className="flex items-start gap-2 p-3 mb-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md text-sm text-amber-900 dark:text-amber-100">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                    Selection truncated to 500 characters. Refine the prompt if you need more context.
                  </div>
                )}
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What would you like to know about this text?"
                  className="min-h-[120px] resize-none"
                  disabled={state === 'loading'}
                  autoFocus
                  aria-labelledby={promptLabelId}
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
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          {generatedAnswer ? (
            // If answer is displayed (note creation failed), just show a close button
            <Button onClick={onClose}>
              Close
            </Button>
          ) : (
            // Normal flow: Cancel and Generate buttons
            <>
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
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
