'use client'

/**
 * HelperSheet Component
 * Story 2.8: Sheet (desktop) / Dialog (mobile) for helper content
 *
 * Uses Sheet on >=lg screens (keeps journal context visible)
 * Uses full-screen Dialog on mobile
 */

import { ReactNode, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { HelperType } from '@/types/helper'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface HelperSheetProps {
  isOpen: boolean
  onClose: () => void
  helperType: HelperType
  title: string
  children: ReactNode
}

export function HelperSheet({
  isOpen,
  onClose,
  helperType,
  title,
  children,
}: HelperSheetProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  // Update URL with ?helper=type on open (use replaceState to avoid flooding history)
  useEffect(() => {
    if (isOpen) {
      const url = new URL(window.location.href)
      url.searchParams.set('helper', helperType)
      window.history.replaceState({}, '', url)
    } else {
      const url = new URL(window.location.href)
      url.searchParams.delete('helper')
      window.history.replaceState({}, '', url)
    }
  }, [isOpen, helperType])

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Desktop: Sheet (side panel)
  if (isDesktop) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          id={`helper-sheet-${helperType}`}
          side="right"
          className="w-full sm:w-[540px] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  // Mobile: Full-screen Dialog
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        id={`helper-sheet-${helperType}`}
        className="max-w-full h-full max-h-full overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
