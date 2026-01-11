'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { PredictionsPage } from '@/components/predictions/PredictionsPage'
import { AppHeader } from '@/components/layout/AppHeader'
import { getSectionRoute } from '@/lib/sections'

export default function PredictionsRoute() {
  const [activeSection, setActiveSection] = useState('predictions')
  const router = useRouter()

  const handleSectionChange = (section: string) => {
    if (section === 'predictions') return
    setActiveSection(section)
    const route = getSectionRoute(section)
    router.push(route ?? '/')
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      <main className="lg:pl-64">
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <div className="flex-1">
            <PredictionsPage />
          </div>
        </div>
      </main>
    </div>
  )
}
