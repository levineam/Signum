'use client'

import React, { useState, useEffect } from 'react'
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { detectBestCodec, isVoiceTranscriptionSupported, isApproachingLimit } from '@/utils/audioCodecDetection'
import { useVoiceRecording } from '@/hooks/useVoiceRecording'
import { RecordingIndicator } from '@/components/editor/RecordingIndicator'

interface VoiceRecordButtonProps {
  onTranscriptionComplete?: (text: string) => void
  disabled?: boolean
}

export function VoiceRecordButton({
  onTranscriptionComplete,
  disabled = false
}: VoiceRecordButtonProps) {
  const [isSupported, setIsSupported] = useState<boolean>(true)
  const [codecInfo, setCodecInfo] = useState<string>('')

  // Check browser support on mount
  useEffect(() => {
    const supported = isVoiceTranscriptionSupported()
    setIsSupported(supported)

    if (supported) {
      const codec = detectBestCodec()
      setCodecInfo(`Using ${codec.codec.toUpperCase()} codec`)
    }
  }, [])

  // Handle audio recording
  const { status, startRecording, stopRecording, resetState } = useVoiceRecording({
    onRecordingComplete: async (audioBlob) => {
      console.log(`[VoiceRecordButton] Recording complete: ${audioBlob.size} bytes`)

      try {
        // Send audio to transcription API
        console.log('[VoiceRecordButton] Sending to /api/transcribe...')
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': audioBlob.type,
          },
          body: audioBlob,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Transcription failed: ${response.status}`)
        }

        const data = await response.json()
        console.log('[VoiceRecordButton] Transcription successful:', {
          textLength: data.text.length,
          metadata: data.metadata,
        })

        // Insert transcribed text into editor
        onTranscriptionComplete?.(data.text)
        resetState()
      } catch (error) {
        console.error('[VoiceRecordButton] Transcription error:', error)
        // Fall back to showing error message to user
        // For now, just reset - Phase 7 will add proper error toast
        resetState()
      }
    },
    onError: (error) => {
      console.error('[VoiceRecordButton] Recording error:', error)
      // Reset after error - Phase 7 will add error toast
      setTimeout(() => {
        resetState()
      }, 3000)
    },
  })

  const handleClick = () => {
    if (status.state === 'idle') {
      startRecording()
    } else if (status.state === 'recording') {
      stopRecording()
    }
  }

  const getTooltipText = () => {
    if (!isSupported) {
      return 'Voice transcription not supported on this browser'
    }
    if (status.state === 'error') {
      return status.errorMessage || 'Recording error'
    }
    if (status.state === 'idle') {
      return `Transcribe${codecInfo ? ` (${codecInfo})` : ''}`
    }
    if (status.state === 'recording') {
      return 'Stop recording'
    }
    return 'Processing audio...'
  }

  const getButtonIcon = () => {
    if (status.state === 'processing') {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    if (status.state === 'error') {
      return <AlertCircle className="h-4 w-4" />
    }
    if (status.state === 'recording') {
      return <Square className="h-3 w-3 fill-current" />
    }
    return <Mic className="h-4 w-4" />
  }

  const getButtonVariant = () => {
    if (status.state === 'error') return 'destructive'
    if (status.state === 'recording') return 'destructive'
    return 'ghost'
  }

  const isButtonDisabled = disabled || !isSupported || status.state === 'processing'
  const showRecordingIndicator = status.state === 'recording'
  const isNearLimit = isApproachingLimit(status.actualSizeBytes)

  return (
    <div className="flex items-center gap-2">
      {/* Recording indicator (shown during recording) */}
      {showRecordingIndicator && (
        <RecordingIndicator
          durationSeconds={status.durationSeconds}
          actualSizeBytes={status.actualSizeBytes}
          isApproachingLimit={isNearLimit}
        />
      )}

      {/* Microphone button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant={getButtonVariant()}
              onClick={handleClick}
              disabled={isButtonDisabled}
              className={`h-8 w-8 p-0 ${status.state === 'recording' ? 'animate-pulse' : ''}`}
              type="button"
              aria-label={getTooltipText()}
              aria-pressed={status.state === 'recording'}
              aria-busy={status.state === 'processing'}
            >
              {getButtonIcon()}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{getTooltipText()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
