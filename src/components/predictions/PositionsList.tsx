'use client'

import { useEffect, useState } from 'react'
import { PositionWithUser } from '@/types/prediction'
import { getPositionsWithUsers } from '@/lib/supabase/predictions'
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'

interface PositionsListProps {
  predictionId: string
  currentUserId?: string
  refreshKey?: number // Increment to trigger refresh
}

export function PositionsList({ predictionId, currentUserId, refreshKey }: PositionsListProps) {
  const [positions, setPositions] = useState<PositionWithUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPositions() {
      setLoading(true)
      const data = await getPositionsWithUsers(predictionId)
      setPositions(data)
      setLoading(false)
    }
    loadPositions()
  }, [predictionId, refreshKey])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (positions.length === 0) {
    return null
  }

  const agreePositions = positions.filter(p => p.position === 'agree')
  const disagreePositions = positions.filter(p => p.position === 'disagree')

  const renderEmail = (position: PositionWithUser) => {
    const isCurrentUser = currentUserId === position.userId
    return (
      <span
        key={position.id}
        className={`text-sm ${isCurrentUser ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
      >
        {position.email}
        {isCurrentUser && <span className="text-xs ml-1">(you)</span>}
      </span>
    )
  }

  return (
    <div className="w-full space-y-3 pt-2 border-t">
      {agreePositions.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>Agreed ({agreePositions.length})</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 pl-5">
            {agreePositions.map(renderEmail)}
          </div>
        </div>
      )}

      {disagreePositions.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
            <ThumbsDown className="h-3.5 w-3.5" />
            <span>Disagreed ({disagreePositions.length})</span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 pl-5">
            {disagreePositions.map(renderEmail)}
          </div>
        </div>
      )}
    </div>
  )
}
