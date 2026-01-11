'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { resolvePrediction } from '@/lib/supabase/predictions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

interface ResolutionPanelProps {
  predictionId: string
  isSettlementPast: boolean
  onResolved: () => void
}

export function ResolutionPanel({
  predictionId,
  isSettlementPast,
  onResolved,
}: ResolutionPanelProps) {
  const { user } = useAuth()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedResolution, setSelectedResolution] = useState<boolean | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  const handleOpenDialog = (resolution: boolean) => {
    setSelectedResolution(resolution)
    setIsDialogOpen(true)
  }

  const handleResolve = async () => {
    if (!user || selectedResolution === null) return

    setIsResolving(true)

    try {
      await resolvePrediction(
        {
          predictionId,
          resolution: selectedResolution,
        },
        user.id
      )

      toast.success(`Prediction resolved as ${selectedResolution ? 'TRUE' : 'FALSE'}`)
      setIsDialogOpen(false)
      onResolved()
    } catch (error) {
      console.error('Error resolving prediction:', error)
      toast.error('Failed to resolve prediction. Please try again.')
    } finally {
      setIsResolving(false)
    }
  }

  return (
    <div className="w-full border-t pt-3 mt-1">
      <p className="text-xs text-muted-foreground mb-2 text-center">
        You created this prediction. Resolve it when the outcome is known.
      </p>

      {!isSettlementPast && (
        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 mb-2 justify-center">
          <AlertTriangle className="h-3 w-3" />
          <span>Settlement date hasn&apos;t passed yet</span>
        </div>
      )}

      <div className="flex gap-2">
        <Dialog open={isDialogOpen && selectedResolution === true} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
              onClick={() => handleOpenDialog(true)}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Resolve True
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve as True?</DialogTitle>
              <DialogDescription>
                {!isSettlementPast && (
                  <span className="block text-amber-600 dark:text-amber-400 mb-2">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Warning: The settlement date hasn&apos;t passed yet. Are you sure you want to resolve early?
                  </span>
                )}
                This will mark the prediction as TRUE and award points to all participants who agreed.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isResolving}>
                Cancel
              </Button>
              <Button onClick={handleResolve} disabled={isResolving} className="bg-green-600 hover:bg-green-700">
                {isResolving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Confirm True
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDialogOpen && selectedResolution === false} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              onClick={() => handleOpenDialog(false)}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Resolve False
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Resolve as False?</DialogTitle>
              <DialogDescription>
                {!isSettlementPast && (
                  <span className="block text-amber-600 dark:text-amber-400 mb-2">
                    <AlertTriangle className="h-4 w-4 inline mr-1" />
                    Warning: The settlement date hasn&apos;t passed yet. Are you sure you want to resolve early?
                  </span>
                )}
                This will mark the prediction as FALSE and award points to all participants who disagreed.
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isResolving}>
                Cancel
              </Button>
              <Button onClick={handleResolve} disabled={isResolving} variant="destructive">
                {isResolving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resolving...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Confirm False
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
