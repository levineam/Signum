'use client'

/**
 * Enable Encryption Button Component
 * Story 2.10 AC7: Migration UI with opt-in flow
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { initializeEncryptionForUser } from '@/lib/crypto/keyManagement'
import { migrateAllUserNotes } from '@/lib/crypto/migration'

interface EnableEncryptionButtonProps {
  onEncryptionEnabled?: () => void
}

export function EnableEncryptionButton({
  onEncryptionEnabled,
}: EnableEncryptionButtonProps) {
  const { user } = useAuth()
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 1 }) // Initialize total to 1 to avoid NaN

  const handleEnableEncryption = async () => {
    if (!user?.id) {
      toast.error('You must be logged in to enable encryption.')
      return
    }

    setShowDialog(false)
    setIsEncrypting(true)

    try {
      // Generate encryption key
      await initializeEncryptionForUser(user.id)

      // Migrate all notes
      await migrateAllUserNotes(user.id, (current, total) => {
        setProgress({ current, total })
      })

      toast.success('✅ All notes encrypted. Your privacy is now protected.')

      onEncryptionEnabled?.()
    } catch (error) {
      console.error('Encryption failed:', error)
      toast.error('Failed to enable encryption. Please try again.')
    } finally {
      setIsEncrypting(false)
    }
  }

  // Don't render if no user is authenticated
  if (!user) {
    return null
  }

  // Calculate progress percentage safely (avoid NaN)
  const progressPercent =
    progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        disabled={isEncrypting}
        variant="default"
      >
        {isEncrypting ? 'Encrypting...' : 'Enable Encryption'}
      </Button>

      {isEncrypting && progress.total > 0 && (
        <div className="mt-4">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Encrypting {progress.current} of {progress.total} notes...
          </p>
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable End-to-End Encryption</DialogTitle>
            <DialogDescription className="space-y-3">
              <p>
                This will encrypt all your notes using AES-256-GCM encryption.
                Only you will be able to read them.
              </p>
              <div className="bg-muted p-3 rounded-md text-sm">
                <p className="font-medium mb-2">What happens:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Your notes will be encrypted with a key only you control</li>
                  <li>The encryption key is stored securely in your browser</li>
                  <li>Notes are encrypted before being sent to our servers</li>
                  <li>We cannot read your encrypted notes</li>
                </ul>
              </div>
              <p className="text-sm text-amber-600 font-medium">
                ⚠️ Important: This action cannot be undone. Make sure you have a
                backup if needed.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnableEncryption}>
              Enable Encryption
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
