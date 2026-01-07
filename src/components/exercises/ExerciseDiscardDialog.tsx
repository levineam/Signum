'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ExerciseDiscardDialogProps {
  isOpen: boolean
  onContinue: () => void
  onDiscard: () => void
}

export function ExerciseDiscardDialog({ isOpen, onContinue, onDiscard }: ExerciseDiscardDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onContinue() : null)}>
      <DialogContent className="max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Discard this exercise?</DialogTitle>
          <DialogDescription>
            You&apos;ll lose your progress. Exit anyway?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={onContinue}>Continue</Button>
          <Button variant="destructive" onClick={onDiscard}>Discard</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
