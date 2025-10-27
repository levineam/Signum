'use client'

/**
 * HelperModal Component
 * Issue #92: Tile-based Helpers UI
 *
 * Modal popup that displays full helper content when a tile is clicked.
 * Uses Dialog component for accessibility and overlay behavior.
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { HelperType } from '@/types/helper'
import { getHelperById } from '@/data/helpers'
import { ReactNode } from 'react'

interface HelperModalProps {
  isOpen: boolean
  onClose: () => void
  helperId: HelperType | null
  children: ReactNode
}

export function HelperModal({ isOpen, onClose, helperId, children }: HelperModalProps) {
  const helper = helperId ? getHelperById(helperId) : null

  if (!helper) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid={`helper-modal-${helper.id}`}>
        <DialogHeader>
          <DialogTitle className="text-2xl">{helper.fullTitle}</DialogTitle>
          <DialogDescription className="text-base">
            {helper.description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
