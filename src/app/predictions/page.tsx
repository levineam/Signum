'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { PredictionsPage } from '@/components/predictions/PredictionsPage'
import { AppHeader } from '@/components/layout/AppHeader'

export default function PredictionsRoute() {
  const [activeSection, setActiveSection] = useState('predictions')
  const router = useRouter()

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    if (section === 'journal') {
      router.push('/')
    } else if (section === 'notes') {
      router.push('/notes')
    } else if (section === 'ontology') {
      router.push('/ontology')
    } else if (section !== 'predictions') {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      <main className="lg:pl-64">
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <div className="flex-1">
            <Suspense fallback={<div className="max-w-4xl mx-auto p-6">Loading predictions...</div>}>
              <PredictionsPage />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
