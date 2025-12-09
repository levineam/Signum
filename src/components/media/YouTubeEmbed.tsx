'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getEmbedUrl, validateVideoId } from '@/utils/youtube'

interface YouTubeEmbedProps {
  /**
   * The YouTube video ID (11 characters)
   */
  videoId: string
  /**
   * The original YouTube URL (for display/reference)
   */
  videoUrl?: string
  /**
   * Optional journal entry ID for linking the summary note
   */
  entryId?: string
  /**
   * Callback when summarization is triggered
   * Will be wired up in Story 2.14.4
   */
  onSummarize?: () => Promise<void>
  /**
   * Callback when a summary note is created
   */
  onSummaryCreated?: (noteId: string) => void
  /**
   * Whether the summarize button should be shown
   * @default true
   */
  showSummarizeButton?: boolean
}

/**
 * YouTubeEmbed Component
 *
 * Renders an embedded YouTube video player with an optional "Summarize Video" button.
 * Uses youtube-nocookie.com for enhanced privacy.
 *
 * @example
 * ```tsx
 * <YouTubeEmbed
 *   videoId="dQw4w9WgXcQ"
 *   videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *   showSummarizeButton={true}
 * />
 * ```
 */
export function YouTubeEmbed({
  videoId,
  videoUrl: _videoUrl,  // Reserved for future use (storing with note metadata)
  entryId: _entryId,    // Reserved for future use (linking to journal entry)
  onSummarize,
  onSummaryCreated: _onSummaryCreated,  // Reserved for future use (callback after note creation)
  showSummarizeButton = true,
}: YouTubeEmbedProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validate video ID
  if (!validateVideoId(videoId)) {
    return (
      <div className="youtube-embed-container">
        <div className="flex items-center justify-center bg-muted rounded-lg aspect-video">
          <p className="text-muted-foreground text-sm">Invalid video ID</p>
        </div>
      </div>
    )
  }

  const embedUrl = getEmbedUrl(videoId)

  const handleSummarize = async () => {
    if (!onSummarize) return

    setIsLoading(true)
    setError(null)

    try {
      await onSummarize()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to summarize video')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="youtube-embed-container" data-video-id={videoId}>
      <iframe
        src={embedUrl}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />

      {showSummarizeButton && (
        <div className="youtube-embed-actions">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSummarize}
            disabled={isLoading || !onSummarize}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating summary...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Summarize Video
              </>
            )}
          </Button>

          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default YouTubeEmbed
