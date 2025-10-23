'use client'

import React from 'react'
import { formatDuration, formatFileSize } from '@/utils/audioCodecDetection'
import { AlertCircle } from 'lucide-react'

interface RecordingIndicatorProps {
  durationSeconds: number
  estimatedSizeBytes: number
  maxSizeBytes?: number
  isApproachingLimit?: boolean
}

export function RecordingIndicator({
  durationSeconds,
  estimatedSizeBytes,
  maxSizeBytes = 4.5 * 1024 * 1024, // 4.5 MB default
  isApproachingLimit = false,
}: RecordingIndicatorProps) {
  const sizeText = formatFileSize(estimatedSizeBytes)
  const maxSizeText = formatFileSize(maxSizeBytes)
  const timeText = formatDuration(durationSeconds)
  const percentage = Math.min((estimatedSizeBytes / maxSizeBytes) * 100, 100)

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 bg-muted rounded-md text-sm"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Recording indicator dot */}
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" aria-hidden="true" />
        <span className="font-medium">Recording</span>
      </div>

      {/* Duration */}
      <span className="text-muted-foreground">{timeText}</span>

      {/* File size with warning */}
      <div className="flex items-center gap-1.5">
        {isApproachingLimit && (
          <AlertCircle className="h-4 w-4 text-orange-500" aria-label="Warning" />
        )}
        <span className={isApproachingLimit ? 'text-orange-600 font-medium' : 'text-muted-foreground'}>
          {sizeText} / {maxSizeText}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex-1 min-w-[80px] h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            isApproachingLimit ? 'bg-orange-500' : 'bg-primary'
          }`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={Math.round(percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Recording progress: ${Math.round(percentage)}%`}
        />
      </div>
    </div>
  )
}
