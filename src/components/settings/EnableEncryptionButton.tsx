'use client'

/**
 * Enable Encryption Button Component
 * Story 2.10 AC7: Migration UI with opt-in flow
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { initializeEncryptionForUser } from '@/lib/crypto/keyManagement'
import { migrateAllUserNotes } from '@/lib/crypto/migration'

interface EnableEncryptionButtonProps {
  userId: string
  onEncryptionEnabled?: () => void
}

export function EnableEncryptionButton({
  userId,
  onEncryptionEnabled,
}: EnableEncryptionButtonProps) {
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 1 }) // Initialize total to 1 to avoid NaN
  const { toast } = useToast()

  const handleEnableEncryption = async () => {
    setShowDialog(false)
    setIsEncrypting(true)

    try {
      // Generate encryption key
      await initializeEncryptionForUser(userId)

      // Migrate all notes
      await migrateAllUserNotes(userId, (current, total) => {
        setProgress({ current, total })
      })

      toast({
        title: 'Encryption Enabled',
        description:
          '✅ All notes encrypted. Your privacy is now protected.',
      })

      onEncryptionEnabled?.()
    } catch (error) {
      console.error('Encryption failed:', error)
      toast({
        title: 'Encryption Failed',
        description: 'Failed to enable encryption. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsEncrypting(false)
    }
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

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable End-to-End Encryption</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
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
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEnableEncryption}>
              Enable Encryption
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
