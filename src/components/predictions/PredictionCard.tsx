'use client'

import { Prediction } from '@/types/prediction'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PositionButton } from './PositionButton'
import { ResolutionPanel } from './ResolutionPanel'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { Calendar, CheckCircle2, XCircle, Clock, Share2 } from 'lucide-react'
import { toast } from 'sonner'

interface PredictionCardProps {
  prediction: Prediction
  currentUserId?: string
  onUpdate: () => void
}

export function PredictionCard({ prediction, currentUserId, onUpdate }: PredictionCardProps) {
  const isResolved = prediction.resolvedAt !== null
  const isCreator = currentUserId === prediction.userId
  const settlementDate = new Date(prediction.settlementDate)
  const isSettlementPast = isPast(settlementDate)

  const agreeCount = prediction.agreeCount || 0
  const disagreeCount = prediction.disagreeCount || 0
  const totalPositions = agreeCount + disagreeCount

  // Calculate percentages for odds display
  const agreePercentage = totalPositions > 0 ? Math.round((agreeCount / totalPositions) * 100) : 50
  const disagreePercentage = totalPositions > 0 ? 100 - agreePercentage : 50

  const handleShare = async () => {
    const url = `${window.location.origin}/predictions/${prediction.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    } catch {
      // Fallback for browsers that don't support clipboard API
      toast.error('Failed to copy link')
    }
  }

  return (
    <Card className={isResolved ? 'opacity-80' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-lg font-medium leading-snug">{prediction.statement}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleShare}
              title="Share prediction"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            {isResolved && (
              <Badge
                variant={prediction.resolution ? 'default' : 'secondary'}
              >
                {prediction.resolution ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    True
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1" />
                    False
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        {/* Settlement date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Calendar className="h-4 w-4" />
          <span>
            {isResolved ? (
              <>Resolved {formatDistanceToNow(new Date(prediction.resolvedAt!), { addSuffix: true })}</>
            ) : isSettlementPast ? (
              <>Settlement date passed ({format(settlementDate, 'PP')})</>
            ) : (
              <>Settles {format(settlementDate, 'PP')} ({formatDistanceToNow(settlementDate, { addSuffix: true })})</>
            )}
          </span>
        </div>

        {/* Odds display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600 dark:text-green-400 font-medium">
              Agree: {agreeCount} ({agreePercentage}%)
            </span>
            <span className="text-red-600 dark:text-red-400 font-medium">
              Disagree: {disagreeCount} ({disagreePercentage}%)
            </span>
          </div>

          {/* Visual odds bar */}
          <div className="h-2 rounded-full overflow-hidden bg-muted flex">
            <div
              className="bg-green-500 transition-all duration-300"
              style={{ width: `${agreePercentage}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-300"
              style={{ width: `${disagreePercentage}%` }}
            />
          </div>

          {totalPositions === 0 && (
            <p className="text-xs text-muted-foreground text-center">
              No positions yet - be the first to take a stance!
            </p>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-0">
        {/* Position buttons (only show if not resolved and user is logged in) */}
        {!isResolved && currentUserId && (
          <div className="w-full flex gap-2">
            <PositionButton
              predictionId={prediction.id}
              position="agree"
              currentPosition={prediction.userPosition}
              disabled={isResolved}
              onPositionTaken={onUpdate}
            />
            <PositionButton
              predictionId={prediction.id}
              position="disagree"
              currentPosition={prediction.userPosition}
              disabled={isResolved}
              onPositionTaken={onUpdate}
            />
          </div>
        )}

        {/* User's position indicator */}
        {currentUserId && prediction.userPosition && (
          <div className="w-full text-center">
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              You {prediction.userPosition === 'agree' ? 'agreed' : 'disagreed'}
            </Badge>
          </div>
        )}

        {/* Resolution panel (only show to creator if not resolved) */}
        {!isResolved && isCreator && (
          <ResolutionPanel
            predictionId={prediction.id}
            isSettlementPast={isSettlementPast}
            onResolved={onUpdate}
          />
        )}
      </CardFooter>
    </Card>
  )
}
