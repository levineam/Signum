import { useState, useRef, useCallback, useEffect } from 'react'
import {
  detectBestCodec,
  estimateFileSize,
  isApproachingLimit,
  hasExceededLimit,
  type CodecInfo,
} from '@/utils/audioCodecDetection'

export type RecordingState = 'idle' | 'recording' | 'processing' | 'error'

export interface RecordingStatus {
  state: RecordingState
  durationSeconds: number
  estimatedSizeBytes: number
  actualSizeBytes: number
  errorMessage?: string
}

interface UseVoiceRecordingOptions {
  onRecordingComplete?: (audioBlob: Blob) => void
  onError?: (error: string) => void
}

export function useVoiceRecording({
  onRecordingComplete,
  onError,
}: UseVoiceRecordingOptions = {}) {
  const [status, setStatus] = useState<RecordingStatus>({
    state: 'idle',
    durationSeconds: 0,
    estimatedSizeBytes: 0,
    actualSizeBytes: 0,
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const actualSizeBytesRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const codecInfoRef = useRef<CodecInfo | null>(null)
  const hasErroredRef = useRef<boolean>(false)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const updateDurationAndSize = useCallback(() => {
    if (!codecInfoRef.current || !startTimeRef.current) return

    const durationSeconds = (Date.now() - startTimeRef.current) / 1000
    const estimatedSizeBytes = estimateFileSize(codecInfoRef.current, durationSeconds)
    const actualSizeBytes = actualSizeBytesRef.current

    setStatus((prev) => ({
      ...prev,
      durationSeconds,
      estimatedSizeBytes,
      actualSizeBytes,
    }))

    // IMPORTANT: Use actualSizeBytes (not estimated) to prevent exceeding serverless limit
    // Safari's AAC and other browsers may record at higher bitrates than estimated
    if (hasExceededLimit(actualSizeBytes)) {
      // Hard stop at 4.5 MB
      console.warn(`[useVoiceRecording] Exceeded size limit: ${actualSizeBytes} bytes`)
      stopRecording()
    } else if (isApproachingLimit(actualSizeBytes)) {
      // Show warning at 90%
      console.warn(`[useVoiceRecording] Approaching size limit (90%): ${actualSizeBytes} bytes`)
      // TODO: Phase 5 will add UI warning prompt
    }

    // Check if exceeded max duration
    if (durationSeconds >= codecInfoRef.current.maxDurationSeconds) {
      stopRecording()
    }
  }, [stopRecording])

  const startRecording = useCallback(async () => {
    let stream: MediaStream | null = null

    // Reset error flag for new recording attempt
    hasErroredRef.current = false

    try {
      // Detect best codec
      const codec = detectBestCodec()
      if (codec.codec === 'none') {
        const error = 'Voice recording not supported on this browser'
        setStatus({ state: 'error', durationSeconds: 0, estimatedSizeBytes: 0, actualSizeBytes: 0, errorMessage: error })
        onError?.(error)
        return
      }

      codecInfoRef.current = codec
      console.log(`[useVoiceRecording] Using codec: ${codec.displayName} (${codec.mimeType})`)

      // Request microphone permission
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // Mono
          sampleRate: { ideal: 16000 }, // Prefer 16 kHz (Whisper optimized) but don't fail if unavailable
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      // Create MediaRecorder with selected codec
      const options: MediaRecorderOptions = {
        mimeType: codec.mimeType,
      }

      // Set bitrate for native recording (not WAV fallback)
      if (codec.isNativeRecording && codec.codec === 'webm-opus') {
        options.audioBitsPerSecond = codec.estimatedBitrate * 1000
      }

      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      actualSizeBytesRef.current = 0

      // Handle data available - track actual bytes as they arrive
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          actualSizeBytesRef.current += event.data.size
        }
      }

      // Handle recording stop
      mediaRecorder.onstop = () => {
        // Stop all tracks
        stream?.getTracks().forEach((track) => track.stop())

        // Clear timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
        }

        // IMPORTANT: Skip completion logic if an error occurred
        // MediaRecorder fires 'stop' after 'error', so we need to avoid
        // overwriting the error state with 'processing'
        if (hasErroredRef.current) {
          console.log('[useVoiceRecording] Skipping completion handler due to prior error')
          hasErroredRef.current = false // Reset for next recording
          return
        }

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, { type: codec.mimeType })
        audioChunksRef.current = []

        console.log(`[useVoiceRecording] Recording complete: ${audioBlob.size} bytes`)

        // Update status to processing
        setStatus((prev) => ({
          ...prev,
          state: 'processing',
        }))

        // Call completion handler
        onRecordingComplete?.(audioBlob)
      }

      // Handle errors
      mediaRecorder.onerror = (event) => {
        const error = `Recording error: ${(event as ErrorEvent).error?.message || 'Unknown error'}`
        console.error('[useVoiceRecording]', error)

        // Set error flag to prevent onstop from running completion logic
        // MediaRecorder fires 'stop' after 'error', so we need to skip completion
        hasErroredRef.current = true

        // Clean up resources on error (prevent privacy/resource leak)
        // Stop microphone stream
        stream?.getTracks().forEach((track) => track.stop())

        // Clear timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
        }

        setStatus({ state: 'error', durationSeconds: 0, estimatedSizeBytes: 0, actualSizeBytes: 0, errorMessage: error })
        onError?.(error)
      }

      // Start recording
      mediaRecorder.start(100) // Collect data every 100ms
      startTimeRef.current = Date.now()

      // Update status
      setStatus({
        state: 'recording',
        durationSeconds: 0,
        estimatedSizeBytes: 0,
        actualSizeBytes: 0,
      })

      // Start timer for duration and size updates
      timerIntervalRef.current = setInterval(updateDurationAndSize, 100)
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to start recording'
      console.error('[useVoiceRecording] Start recording error:', err)

      // IMPORTANT: Stop microphone stream if it was obtained but recording failed
      // This prevents resource/privacy leak (microphone stays active)
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        console.log('[useVoiceRecording] Stopped microphone stream after error')
      }

      // Handle specific permission errors
      if (error.includes('Permission denied') || error.includes('NotAllowedError')) {
        setStatus({
          state: 'error',
          durationSeconds: 0,
          estimatedSizeBytes: 0,
          actualSizeBytes: 0,
          errorMessage: 'Microphone access required for transcription',
        })
      } else {
        setStatus({
          state: 'error',
          durationSeconds: 0,
          estimatedSizeBytes: 0,
          actualSizeBytes: 0,
          errorMessage: 'Unable to access microphone. Please check browser permissions.',
        })
      }

      onError?.(error)
    }
  }, [onRecordingComplete, onError, updateDurationAndSize])

  const resetState = useCallback(() => {
    setStatus({
      state: 'idle',
      durationSeconds: 0,
      estimatedSizeBytes: 0,
      actualSizeBytes: 0,
    })
  }, [])

  return {
    status,
    startRecording,
    stopRecording,
    resetState,
  }
}
