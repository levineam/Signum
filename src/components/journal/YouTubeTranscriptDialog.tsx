'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle, CheckCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface YouTubeTranscriptDialogProps {
  isOpen: boolean
  onClose: () => void
  videoId: string
  videoUrl?: string
  entryId: string
  onTranscriptCreated: (
    noteId: string,
    noteTitle: string,
    videoId: string,
    entryId: string,
    noteHtml: string,
    isLocal?: boolean
  ) => void
}

type DialogState = 'idle' | 'loading' | 'success' | 'error'

export function YouTubeTranscriptDialog({
  isOpen,
  onClose,
  videoId,
  videoUrl,
  entryId,
  onTranscriptCreated,
}: YouTubeTranscriptDialogProps) {
  const { session } = useAuth()
  const [state, setState] = useState<DialogState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const hasStartedRef = useRef(false)
  const isMountedRef = useRef(true)
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const generateTranscript = useCallback(async () => {
    if (!session?.access_token) {
      toast.error('Please sign in to use this feature')
      onClose()
      return
    }

    setState('loading')
    setErrorMessage(null)

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/youtube/transcript-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          videoId,
          videoUrl,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        let message = `Failed to create transcript (${response.status})`
        try {
          const errorData = await response.json()
          const base = (errorData?.error as string | undefined) || message
          const debugId = errorData?.debugId as string | undefined
          const code = errorData?.code as string | undefined
          message = debugId ? `${base} (debugId: ${debugId})` : base
          // Surface code in console for debugging without spamming the UI.
          if (code) {
            console.warn('[YouTubeTranscriptDialog] transcript-note error code:', code)
          }
        } catch {
          const raw = await response.text().catch(() => '')
          if (raw) message = `${message}: ${raw}`
        }
        throw new Error(message)
      }

      const data = await response.json()
      if (!isMountedRef.current) return

      setState('success')

      successTimeoutRef.current = setTimeout(() => {
        if (!isMountedRef.current) return
        const noteTitle = data.noteTitle || `Video: ${videoId}`
        const noteHtml = data.html || ''
        onTranscriptCreated(
          data.noteId,
          noteTitle,
          videoId,
          entryId,
          noteHtml,
          data.isLocal
        )
        onClose()
        toast.success('Transcript created!', {
          description: 'Click the link in your entry to view the transcript.',
          action: {
            label: 'View Note',
            onClick: () => {
              window.dispatchEvent(new CustomEvent('openNote', { detail: { noteId: data.noteId } }))
            },
          },
        })
      }, 300)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }
      const message = error instanceof Error ? error.message : 'Failed to create transcript'
      setState('error')
      setErrorMessage(message)
    }
  }, [session?.access_token, videoId, videoUrl, entryId, onTranscriptCreated, onClose])

  useEffect(() => {
    if (isOpen && !hasStartedRef.current && state === 'idle') {
      hasStartedRef.current = true
      generateTranscript()
    }
  }, [isOpen, state, generateTranscript])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
        successTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!isOpen) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
        successTimeoutRef.current = null
      }
      setState('idle')
      setErrorMessage(null)
      hasStartedRef.current = false
    }
  }, [isOpen])

  const handleRetry = () => generateTranscript()

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md" data-youtube-transcript-dialog>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Video Transcript
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8 gap-4">
          {state === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin" />
              <div className="text-center">
                <p className="font-medium">Creating transcript note...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Fetching title and transcript
                </p>
              </div>
            </>
          )}

          {state === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="font-medium">Transcript Created!</p>
            </>
          )}

          {state === 'error' && (
            <>
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div className="text-center">
                <p className="font-medium text-destructive">Transcript Failed</p>
                <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={handleRetry}>Try Again</Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

