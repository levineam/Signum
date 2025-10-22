/**
 * Audio Codec Detection Utility
 *
 * Detects browser support for audio recording codecs and provides
 * fallback strategy for voice transcription feature (Story 2.5).
 *
 * Priority order:
 * 1. audio/webm;codecs=opus (Chrome, Firefox) - Best compression (~24 kbps)
 * 2. audio/mp4 (Safari/iOS) - Native Safari support
 * 3. audio/wav (Universal fallback) - Larger files, requires Web Audio API
 *
 * See: docs/stories/story-2.5-voice-transcription.md (AC8)
 */

export type SupportedCodec = 'webm-opus' | 'mp4' | 'wav' | 'none';

export interface CodecInfo {
  codec: SupportedCodec;
  mimeType: string;
  displayName: string;
  estimatedBitrate: number; // kbps (mono, 16 kHz)
  maxDurationSeconds: number; // Based on 4.5 MB serverless limit
  isNativeRecording: boolean; // false for WAV (requires Web Audio API)
}

const CODECS_TO_TEST: Array<{
  codec: SupportedCodec;
  mimeType: string;
  displayName: string;
  estimatedBitrate: number;
  isNativeRecording: boolean;
}> = [
  {
    codec: 'webm-opus',
    mimeType: 'audio/webm;codecs=opus',
    displayName: 'WebM (Opus)',
    estimatedBitrate: 24, // ~24 kbps mono at 16 kHz
    isNativeRecording: true,
  },
  {
    codec: 'mp4',
    mimeType: 'audio/mp4',
    displayName: 'MP4 (AAC)',
    estimatedBitrate: 32, // ~32 kbps mono at 16 kHz
    isNativeRecording: true,
  },
  {
    codec: 'wav',
    mimeType: 'audio/wav',
    displayName: 'WAV (PCM)',
    estimatedBitrate: 256, // 16-bit, 16 kHz, mono = 256 kbps
    isNativeRecording: false, // Requires Web Audio API + AudioWorklet
  },
];

const MAX_FILE_SIZE_MB = 4.5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Calculate maximum recording duration based on estimated bitrate
 * to stay under 4.5 MB serverless body limit.
 */
function calculateMaxDuration(bitrateKbps: number): number {
  const bytesPerSecond = (bitrateKbps * 1000) / 8;
  const maxSeconds = Math.floor(MAX_FILE_SIZE_BYTES / bytesPerSecond);
  // Cap at 5 minutes (300 seconds) for UX reasons
  return Math.min(maxSeconds, 300);
}

/**
 * Detect the best supported audio codec for recording.
 * Returns codec info with duration limits based on file size constraints.
 *
 * @returns CodecInfo object with selected codec and constraints
 */
export function detectBestCodec(): CodecInfo {
  // Server-side: return default (will be re-detected on client)
  if (typeof window === 'undefined' || !window.MediaRecorder) {
    return {
      codec: 'none',
      mimeType: '',
      displayName: 'Not supported',
      estimatedBitrate: 0,
      maxDurationSeconds: 0,
      isNativeRecording: false,
    };
  }

  // Try each codec in priority order
  for (const codecConfig of CODECS_TO_TEST) {
    // WAV is always "supported" as fallback (via Web Audio API)
    if (codecConfig.codec === 'wav') {
      return {
        ...codecConfig,
        maxDurationSeconds: calculateMaxDuration(codecConfig.estimatedBitrate),
      };
    }

    // Test MediaRecorder support for native codecs
    if (MediaRecorder.isTypeSupported(codecConfig.mimeType)) {
      const maxDuration = calculateMaxDuration(codecConfig.estimatedBitrate);

      console.log(
        `[audioCodecDetection] Selected codec: ${codecConfig.displayName} ` +
        `(${codecConfig.mimeType}), max duration: ${Math.floor(maxDuration / 60)}m ${maxDuration % 60}s`
      );

      return {
        ...codecConfig,
        maxDurationSeconds: maxDuration,
      };
    }
  }

  // Fallback to WAV (should never reach here due to WAV fallback above)
  const wavCodec = CODECS_TO_TEST.find((c) => c.codec === 'wav')!;
  return {
    ...wavCodec,
    maxDurationSeconds: calculateMaxDuration(wavCodec.estimatedBitrate),
  };
}

/**
 * Check if voice transcription is supported in current browser.
 * Returns false for browsers without MediaRecorder OR getUserMedia.
 */
export function isVoiceTranscriptionSupported(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for MediaRecorder (or Web Audio API for WAV fallback)
  const hasMediaRecorder = !!window.MediaRecorder;
  const hasWebAudio = !!(
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );

  // Check for getUserMedia (including legacy prefixed versions)
  const nav = navigator as unknown as {
    getUserMedia?: typeof navigator.mediaDevices.getUserMedia;
    webkitGetUserMedia?: typeof navigator.mediaDevices.getUserMedia;
    mozGetUserMedia?: typeof navigator.mediaDevices.getUserMedia;
  };

  const hasGetUserMedia = !!(
    navigator.mediaDevices?.getUserMedia ||
    nav.getUserMedia ||
    nav.webkitGetUserMedia ||
    nav.mozGetUserMedia
  );

  return (hasMediaRecorder || hasWebAudio) && hasGetUserMedia;
}

/**
 * Get user-friendly error message for unsupported browsers.
 */
export function getUnsupportedMessage(): string {
  if (typeof window === 'undefined') {
    return 'Voice transcription is only available in the browser.';
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    return 'Your browser does not support microphone access. Please use a modern browser like Chrome, Firefox, or Safari.';
  }

  if (!window.MediaRecorder && !window.AudioContext) {
    return 'Voice transcription is not supported on this browser. Please try Chrome, Firefox, Safari 14.1+, or Edge.';
  }

  return 'Voice transcription is not available in your current browser.';
}

/**
 * Format duration in seconds to human-readable "M:SS" format.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size in bytes to human-readable "X.X MB" format.
 */
export function formatFileSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

/**
 * Calculate estimated file size based on codec and duration.
 * Used for real-time size estimation during recording.
 *
 * @param codec - Selected codec info
 * @param durationSeconds - Current recording duration
 * @returns Estimated file size in bytes
 */
export function estimateFileSize(codec: CodecInfo, durationSeconds: number): number {
  const bytesPerSecond = (codec.estimatedBitrate * 1000) / 8;
  return Math.floor(bytesPerSecond * durationSeconds);
}

/**
 * Check if recording is approaching file size limit (90% threshold).
 * Used to show "Recording nearly full" warning.
 */
export function isApproachingLimit(currentBytes: number): boolean {
  return currentBytes >= MAX_FILE_SIZE_BYTES * 0.9;
}

/**
 * Check if recording has exceeded file size limit.
 */
export function hasExceededLimit(currentBytes: number): boolean {
  return currentBytes >= MAX_FILE_SIZE_BYTES;
}
