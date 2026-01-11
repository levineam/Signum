'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { takePosition } from '@/lib/supabase/predictions'
import { PositionType } from '@/types/prediction'
import { Button } from '@/components/ui/button'
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PositionButtonProps {
  predictionId: string
  position: PositionType
  currentPosition?: PositionType | null
  disabled?: boolean
  onPositionTaken: () => void
}

export function PositionButton({
  predictionId,
  position,
  currentPosition,
  disabled,
  onPositionTaken,
}: PositionButtonProps) {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const isSelected = currentPosition === position
  const isAgree = position === 'agree'

  const handleClick = async () => {
    if (!user) {
      toast.error('You must be signed in to take a position')
      return
    }

    if (isSelected) {
      // Already selected this position
      return
    }

    setIsLoading(true)

    try {
      await takePosition(
        {
          predictionId,
          position,
        },
        user.id
      )

      toast.success(
        currentPosition
          ? `Changed position to ${position}`
          : `You ${position === 'agree' ? 'agreed' : 'disagreed'} with this prediction`
      )
      onPositionTaken()
    } catch (error) {
      console.error('Error taking position:', error)
      toast.error('Failed to take position. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={isSelected ? (isAgree ? 'default' : 'destructive') : 'outline'}
      className={cn(
        'flex-1',
        !isSelected && isAgree && 'hover:bg-green-100 hover:text-green-700 hover:border-green-300 dark:hover:bg-green-950 dark:hover:text-green-400',
        !isSelected && !isAgree && 'hover:bg-red-100 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-950 dark:hover:text-red-400',
        isSelected && isAgree && 'bg-green-600 hover:bg-green-700',
      )}
      onClick={handleClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isAgree ? (
        <>
          <ThumbsUp className="h-4 w-4 mr-2" />
          Agree
        </>
      ) : (
        <>
          <ThumbsDown className="h-4 w-4 mr-2" />
          Disagree
        </>
      )}
    </Button>
  )
}
