'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { migrateLocalStorageToSupabase, MigrationProgress } from '@/lib/migrations/migrateToSupabase'

interface MigrationModalProps {
  userId: string
  onComplete: () => void
  onSkip: () => void
}

export function MigrationModal({ userId, onComplete, onSkip }: MigrationModalProps) {
  const [migrating, setMigrating] = useState(false)
  const [progress, setProgress] = useState<MigrationProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleMigrate = async () => {
    setMigrating(true)
    setError(null)

    try {
      const result = await migrateLocalStorageToSupabase(
        userId,
        (progress) => setProgress(progress)
      )

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onComplete()
        }, 2000)
      } else {
        setError(
          `Migration completed with ${result.errors.length} error(s). ` +
          `First error: ${result.errors[0]?.error || 'Unknown error'}`
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Migration failed. Please try again.')
    } finally {
      setMigrating(false)
    }
  }

  const handleSkip = () => {
    localStorage.setItem('migration-skipped', 'true')
    onSkip()
  }

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      journal: 'Migrating journal entries',
      notes: 'Migrating notes',
      links: 'Migrating links',
      content: 'Updating references',
      cleanup: 'Finalizing'
    }
    return labels[stage] || 'Processing'
  }

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {success ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Migration Complete!
              </>
            ) : error ? (
              <>
                <AlertCircle className="h-5 w-5 text-red-600" />
                Migration Error
              </>
            ) : (
              'Welcome to Signum Cloud Sync!'
            )}
          </DialogTitle>
          <DialogDescription>
            {success ? (
              'Your journal entries and notes have been synced to the cloud.'
            ) : error ? (
              'An error occurred during migration. Your local data is safe.'
            ) : (
              'We found local journal entries on this device. Would you like to sync them to your account for cloud access?'
            )}
          </DialogDescription>
        </DialogHeader>

        {!success && !error && (
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>All your journal entries will be preserved</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Access from any device</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Automatic backups</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <span>This is a one-time process (cannot be undone)</span>
              </div>
            </div>

            {migrating && progress && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{getStageLabel(progress.stage)}</span>
                  <span className="ml-auto">
                    {progress.current} / {progress.total}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 text-sm text-green-800">
            Successfully migrated {progress?.total || 0} items to your account!
          </div>
        )}

        <DialogFooter>
          {!success && !error && (
            <>
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={migrating}
              >
                Skip for Now
              </Button>
              <Button
                onClick={handleMigrate}
                disabled={migrating}
              >
                {migrating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  'Sync to Cloud'
                )}
              </Button>
            </>
          )}

          {error && (
            <>
              <Button variant="outline" onClick={handleSkip}>
                Skip for Now
              </Button>
              <Button onClick={handleMigrate}>
                Retry Migration
              </Button>
            </>
          )}

          {success && (
            <Button onClick={onComplete}>
              Continue to App
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
