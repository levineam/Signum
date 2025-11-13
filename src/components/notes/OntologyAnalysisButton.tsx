'use client'

/**
 * Ontology Analysis Button Component
 * Story 2.4.4: Incremental AI Ontology Analysis (Updated)
 *
 * Now calls the incremental analysis endpoint and shows last run info.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface OntologyAnalysisButtonProps {
  onComplete?: () => void
}

export function OntologyAnalysisButton({
  onComplete
}: OntologyAnalysisButtonProps) {
  const { user } = useAuth()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastRunInfo, setLastRunInfo] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load last run info on mount
  useEffect(() => {
    if (user) {
      loadLastRunInfo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const loadLastRunInfo = async () => {
    if (!user) return

    try {
      // Fetch analysis state from safe API endpoint
      const response = await fetch('/api/ontology/analysis-state')

      if (!response.ok) {
        throw new Error('Failed to fetch analysis state')
      }

      const { state } = await response.json()

      if (state?.lastAnalyzedAt) {
        const lastRun = new Date(state.lastAnalyzedAt)
        const now = new Date()
        const diffMs = now.getTime() - lastRun.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        let timeAgo = ''
        if (diffDays > 0) {
          timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
        } else if (diffHours > 0) {
          timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
        } else if (diffMins > 0) {
          timeAgo = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
        } else {
          timeAgo = 'just now'
        }

        setLastRunInfo(timeAgo)
      }
    } catch (error) {
      console.error('Failed to load last run info:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!user) {
      toast.error('Please sign in to analyze your ontology')
      return
    }

    setIsAnalyzing(true)

    try {
      // Call incremental analysis endpoint (same pipeline as scheduled runs)
      // Note: userId is derived from session on server for security
      const response = await fetch('/api/ontology/incremental-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          triggeredBy: 'manual'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.details || error.error || 'Analysis failed')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Analysis failed')
      }

      // Check if skipped (no new notes)
      if (result.skipped) {
        toast.info('No new notes to analyze', {
          description: 'Your ontology is already up to date!'
        })
        setIsAnalyzing(false)
        return
      }

      // Show success message
      const { extraction, noteCount } = result
      const totalNew =
        (extraction?.newValues || 0) +
        (extraction?.newBeliefs || 0) +
        (extraction?.newAims || 0)

      toast.success('Ontology updated!', {
        description: `Analyzed ${noteCount} note${noteCount > 1 ? 's' : ''}. ${
          totalNew > 0 ? `Found ${totalNew} new insight${totalNew > 1 ? 's' : ''}` : 'Refreshed existing items'
        }`
      })

      // Refresh last run info
      await loadLastRunInfo()

      // Trigger refresh
      onComplete?.()
    } catch (error) {
      console.error('Analysis failed:', error)
      toast.error('Analysis failed', {
        description:
          error instanceof Error ? error.message : 'Please try again'
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        data-testid="ontology-analyze-button"
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="gap-2"
        size="lg"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Analyze My Notes
          </>
        )}
      </Button>

      {!isLoading && lastRunInfo && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground justify-center">
          <Clock className="h-3 w-3" />
          <span>Last updated {lastRunInfo}</span>
        </div>
      )}
    </div>
  )
}
