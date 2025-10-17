'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { OntologyPage } from '@/components/ontology/OntologyPage'
import { AppHeader } from '@/components/layout/AppHeader'

export default function OntologyRoute() {
  const [activeSection, setActiveSection] = useState('ontology')
  const router = useRouter()

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    if (section === 'journal') {
      router.push('/')
    } else if (section === 'notes') {
      router.push('/notes')
    } else if (section !== 'ontology') {
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
            <OntologyPage />
          </div>
        </div>
      </main>
    </div>
  )
}
