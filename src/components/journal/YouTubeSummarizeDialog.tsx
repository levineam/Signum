'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface YouTubeSummarizeDialogProps {
  isOpen: boolean
  onClose: () => void
  videoId: string
  videoUrl?: string
  entryId: string
  onSummaryCreated: (
    noteId: string,
    noteTitle: string,
    videoId: string,
    entryId: string,
    summaryHtml: string,
    isLocal?: boolean
  ) => void
}

type DialogState = 'idle' | 'loading' | 'success' | 'error'

export function YouTubeSummarizeDialog({
  isOpen,
  onClose,
  videoId,
  videoUrl,
  entryId,
  onSummaryCreated
}: YouTubeSummarizeDialogProps) {
  const { session } = useAuth()
  const [state, setState] = useState<DialogState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasStartedRef = useRef(false)
  const isMountedRef = useRef(true)
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Define generateSummary first so it can be used in useEffect
  const generateSummary = useCallback(async () => {
    if (!session?.access_token) {
      toast.error('Please sign in to use AI features')
      onClose()
      return
    }

    setState('loading')
    setErrorMessage(null)

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/youtube/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          videoId,
          videoUrl,
          entryId,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        // Safely parse error response, including HTTP status for non-JSON responses
        let errorMessage = `Failed to generate summary (${response.status})`
        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch {
          // Response was not JSON, try raw text for more context
          try {
            const raw = await response.text()
            if (raw) {
              errorMessage = `${errorMessage}: ${raw}`
            }
          } catch {
            // ignore secondary parse failure
          }
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()

      // Only update state if component is still mounted
      if (!isMountedRef.current) return

      setState('success')

      // Brief delay to show success state, then close and insert link
      // Store timeout ref so we can clear it on unmount
      successTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return

        // The API returns noteId and creates a note with title "Video Summary: {videoId}"
        const noteTitle = data.noteTitle || `Video Summary: ${videoId}`
        onSummaryCreated(
          data.noteId,
          noteTitle,
          videoId,
          entryId,
          data.summary,
          data.isLocal
        )
        onClose()
        toast.success('Video summary created!', {
          description: 'Click the link in your entry to view the summary.',
          action: {
            label: 'View Note',
            onClick: () => {
              window.dispatchEvent(new CustomEvent('openNote', { detail: { noteId: data.noteId } }))
            },
          },
        })
      }, 500)

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      const message = error instanceof Error ? error.message : 'Failed to generate summary'
      setState('error')
      setErrorMessage(message)
    }
  }, [session?.access_token, videoId, videoUrl, entryId, onSummaryCreated, onClose])

  // Auto-start generation when dialog opens
  useEffect(() => {
    if (isOpen && !hasStartedRef.current && state === 'idle') {
      hasStartedRef.current = true
      generateSummary()
    }
  }, [isOpen, state, generateSummary])

  // Track mount status for cleanup
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Clear any pending success timeout
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
        successTimeoutRef.current = null
      }
    }
  }, [])

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      // Clear any pending success timeout
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
        successTimeoutRef.current = null
      }
      setState('idle')
      setErrorMessage(null)
      hasStartedRef.current = false
    }
  }, [isOpen])

  const handleRetry = () => {
    generateSummary()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        data-youtube-summarize-dialog
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Video Summary
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8 gap-4">
          {state === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
              <div className="text-center">
                <p className="font-medium">Generating Summary...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Fetching transcript and creating summary
                </p>
              </div>
            </>
          )}

          {state === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-medium">Summary Created!</p>
            </>
          )}

          {state === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div className="text-center">
                <p className="font-medium text-destructive">Generation Failed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {errorMessage}
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleRetry}>
                  Try Again
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
