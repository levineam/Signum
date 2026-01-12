'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getPredictionById } from '@/lib/supabase/predictions'
import { Prediction } from '@/types/prediction'
import { PredictionCard } from '@/components/predictions/PredictionCard'
import { Sidebar } from '@/components/layout/Sidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import { getSectionRoute } from '@/lib/sections'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, TrendingUp, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function PredictionPage() {
  const params = useParams()
  const router = useRouter()
  const predictionId = params.id as string
  const { user, loading: authLoading } = useAuth()

  const [activeSection, setActiveSection] = useState('predictions')
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isGuest = !user && !authLoading

  const handleSectionChange = (section: string) => {
    if (section === 'predictions') {
      router.push('/predictions')
      return
    }
    setActiveSection(section)
    const route = getSectionRoute(section)
    router.push(route ?? '/')
  }

  const loadPrediction = async () => {
    if (!predictionId) return

    setLoading(true)
    setError(null)

    try {
      const data = await getPredictionById(predictionId, user?.id)
      if (!data) {
        setError('Prediction not found')
      } else {
        setPrediction(data)
      }
    } catch (err) {
      console.error('Error loading prediction:', err)
      setError('Failed to load prediction')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadPrediction()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predictionId, user?.id, authLoading])

  const renderContent = () => {
    if (loading || authLoading) {
      return (
        <div className="container max-w-2xl mx-auto py-8 px-4">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      )
    }

    if (error || !prediction) {
      return (
        <div className="container max-w-2xl mx-auto py-8 px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Prediction Not Found</h2>
              <p className="text-muted-foreground mb-6">
                This prediction may have been deleted or doesn&apos;t exist.
              </p>
              <Link href="/predictions">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  View All Predictions
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        {/* Back link */}
        <Link
          href="/predictions"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          All Predictions
        </Link>

        {/* Prediction card */}
        <PredictionCard
          prediction={prediction}
          currentUserId={user?.id}
          onUpdate={loadPrediction}
        />

        {/* Guest CTA */}
        {isGuest && (
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardContent className="py-6 text-center">
              <h3 className="text-lg font-semibold mb-2">
                Want to weigh in on this prediction?
              </h3>
              <p className="text-muted-foreground mb-4">
                Sign up to agree or disagree and earn points when predictions are resolved.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href={`/auth?redirect=/predictions/${predictionId}`}>
                  <Button>Sign Up</Button>
                </Link>
                <Link href={`/auth?redirect=/predictions/${predictionId}`}>
                  <Button variant="outline">Sign In</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      <main className="md:pl-20 xl:pl-64">
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  )
}
