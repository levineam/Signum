'use client'

import React, { useState, useEffect } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { detectBestCodec, isVoiceTranscriptionSupported } from '@/utils/audioCodecDetection'

export type RecordingState = 'idle' | 'recording' | 'processing'

interface VoiceRecordButtonProps {
  onTranscriptionComplete?: (text: string) => void
  disabled?: boolean
}

export function VoiceRecordButton({
  onTranscriptionComplete,
  disabled = false
}: VoiceRecordButtonProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
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

  const handleClick = () => {
    if (recordingState === 'idle') {
      // Start recording
      setRecordingState('recording')
      // TODO: Implement actual recording logic in Phase 3
    } else if (recordingState === 'recording') {
      // Stop recording
      setRecordingState('processing')
      // TODO: Implement transcription API call in Phase 6

      // Placeholder: simulate processing
      setTimeout(() => {
        setRecordingState('idle')
        onTranscriptionComplete?.('Placeholder transcription text')
      }, 2000)
    }
  }

  const getTooltipText = () => {
    if (!isSupported) {
      return 'Voice transcription not supported on this browser'
    }
    if (recordingState === 'idle') {
      return `Transcribe${codecInfo ? ` (${codecInfo})` : ''}`
    }
    if (recordingState === 'recording') {
      return 'Stop recording'
    }
    return 'Processing audio...'
  }

  const getButtonIcon = () => {
    if (recordingState === 'processing') {
      return <Loader2 className="h-4 w-4 animate-spin" />
    }
    if (recordingState === 'recording') {
      return <Square className="h-3 w-3 fill-current" />
    }
    return <Mic className="h-4 w-4" />
  }

  const isButtonDisabled = disabled || !isSupported || recordingState === 'processing'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant={recordingState === 'recording' ? 'destructive' : 'ghost'}
            onClick={handleClick}
            disabled={isButtonDisabled}
            className={`h-8 w-8 p-0 ${recordingState === 'recording' ? 'animate-pulse' : ''}`}
            type="button"
            aria-label={getTooltipText()}
            aria-pressed={recordingState === 'recording'}
            aria-busy={recordingState === 'processing'}
          >
            {getButtonIcon()}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
