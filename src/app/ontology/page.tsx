'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { OntologyPage } from '@/components/ontology/OntologyPage'
import { AppHeader } from '@/components/layout/AppHeader'
import { getSectionRoute } from '@/lib/sections'

export default function OntologyRoute() {
  const [activeSection, setActiveSection] = useState('ontology')
  const router = useRouter()

  const handleSectionChange = (section: string) => {
    if (section === 'ontology') return
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
            <Suspense fallback={<div className="max-w-5xl mx-auto p-6">Loading...</div>}>
              <OntologyPage />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  )
}
