'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { NotesPage } from '@/components/notes/NotesPage'
import { AppHeader } from '@/components/layout/AppHeader'

export default function NotesRoute() {
  const [activeSection, setActiveSection] = useState('notes')
  const router = useRouter()

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    if (section === 'journal') {
      router.push('/')
    } else if (section !== 'notes') {
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
            <NotesPage />
          </div>
        </div>
      </main>
    </div>
  )
}
