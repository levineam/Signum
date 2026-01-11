'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getPredictions } from '@/lib/supabase/predictions'
import { Prediction } from '@/types/prediction'
import { PredictionCard } from './PredictionCard'
import { CreatePredictionForm } from './CreatePredictionForm'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Loader2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function PredictionsPage() {
  const { user } = useAuth()
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active')

  const loadPredictions = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getPredictions({
        userId: user?.id,
        includeResolved: true,
      })
      setPredictions(data)
    } catch (error) {
      console.error('Error loading predictions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadPredictions()
  }, [loadPredictions])

  const activePredictions = predictions.filter(p => !p.resolvedAt)
  const resolvedPredictions = predictions.filter(p => p.resolvedAt)

  const handlePredictionCreated = () => {
    loadPredictions()
  }

  const handlePredictionUpdated = () => {
    loadPredictions()
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with ALPHA badge */}
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-semibold">Predictions</h1>
        <Badge variant="secondary" className="text-xs">ALPHA</Badge>
      </div>

      {/* Description */}
      <p className="text-muted-foreground">
        Make predictions about the future and see how accurate you and your friends are.
        Agree or disagree with predictions to earn points when they&apos;re resolved.
      </p>

      {/* Create prediction form */}
      {user && (
        <CreatePredictionForm onCreated={handlePredictionCreated} />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Predictions feed */}
      {!isLoading && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'active' | 'resolved')}>
          <TabsList>
            <TabsTrigger value="active">
              Active ({activePredictions.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedPredictions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-4">
            {activePredictions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active predictions yet.</p>
                {user && <p className="text-sm mt-2">Create one above to get started!</p>}
              </div>
            ) : (
              activePredictions.map(prediction => (
                <PredictionCard
                  key={prediction.id}
                  prediction={prediction}
                  currentUserId={user?.id}
                  onUpdate={handlePredictionUpdated}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4 mt-4">
            {resolvedPredictions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No resolved predictions yet.</p>
              </div>
            ) : (
              resolvedPredictions.map(prediction => (
                <PredictionCard
                  key={prediction.id}
                  prediction={prediction}
                  currentUserId={user?.id}
                  onUpdate={handlePredictionUpdated}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Not logged in state */}
      {!user && !isLoading && (
        <div className="text-center py-6 text-muted-foreground border rounded-lg">
          <p>Sign in to create predictions and take positions.</p>
        </div>
      )}
    </div>
  )
}
