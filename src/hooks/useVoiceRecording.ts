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
  })

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const codecInfoRef = useRef<CodecInfo | null>(null)

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

    setStatus((prev) => ({
      ...prev,
      durationSeconds,
      estimatedSizeBytes,
    }))

    // Check if approaching or exceeded limit
    if (hasExceededLimit(estimatedSizeBytes)) {
      // Hard stop at 4.5 MB
      stopRecording()
    } else if (isApproachingLimit(estimatedSizeBytes)) {
      // Show warning at 90%
      console.warn('[useVoiceRecording] Approaching file size limit (90%)')
      // TODO: Phase 5 will add UI warning prompt
    }

    // Check if exceeded max duration
    if (durationSeconds >= codecInfoRef.current.maxDurationSeconds) {
      stopRecording()
    }
  }, [stopRecording])

  const startRecording = useCallback(async () => {
    try {
      // Detect best codec
      const codec = detectBestCodec()
      if (codec.codec === 'none') {
        const error = 'Voice recording not supported on this browser'
        setStatus({ state: 'error', durationSeconds: 0, estimatedSizeBytes: 0, errorMessage: error })
        onError?.(error)
        return
      }

      codecInfoRef.current = codec
      console.log(`[useVoiceRecording] Using codec: ${codec.displayName} (${codec.mimeType})`)

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // Mono
          sampleRate: 16000, // 16 kHz
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

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // Handle recording stop
      mediaRecorder.onstop = () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())

        // Clear timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
          timerIntervalRef.current = null
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
        setStatus({ state: 'error', durationSeconds: 0, estimatedSizeBytes: 0, errorMessage: error })
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
      })

      // Start timer for duration and size updates
      timerIntervalRef.current = setInterval(updateDurationAndSize, 100)
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to start recording'
      console.error('[useVoiceRecording] Start recording error:', err)

      // Handle specific permission errors
      if (error.includes('Permission denied') || error.includes('NotAllowedError')) {
        setStatus({
          state: 'error',
          durationSeconds: 0,
          estimatedSizeBytes: 0,
          errorMessage: 'Microphone access required for transcription',
        })
      } else {
        setStatus({
          state: 'error',
          durationSeconds: 0,
          estimatedSizeBytes: 0,
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
    })
  }, [])

  return {
    status,
    startRecording,
    stopRecording,
    resetState,
  }
}
