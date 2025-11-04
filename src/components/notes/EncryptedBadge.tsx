/**
 * Encrypted Badge Component
 * Story 2.10 AC8: UI indicator for encrypted notes
 */

import { Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface EncryptedBadgeProps {
  isEncrypted: boolean
  className?: string
}

export function EncryptedBadge({ isEncrypted, className }: EncryptedBadgeProps) {
  if (!isEncrypted) return null

  return (
    <Badge variant="secondary" className={`gap-1 ${className || ''}`}>
      <Lock className="h-3 w-3" />
      Encrypted
    </Badge>
  )
}
