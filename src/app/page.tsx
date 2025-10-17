'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { JournalStream } from '@/components/journal/JournalStream'
import { AppHeader } from '@/components/layout/AppHeader'
import { DuplicateChecker } from '@/components/diagnostic/DuplicateChecker'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const [activeSection, setActiveSection] = useState('journal')
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    const handleNavigateToNotes = () => {
      setActiveSection('notes')
    }

    window.addEventListener('navigate-to-notes', handleNavigateToNotes)
    return () => window.removeEventListener('navigate-to-notes', handleNavigateToNotes)
  }, [])

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    if (section === 'notes') {
      router.push('/notes')
    }
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'journal':
        return (
          <>
            {user && <DuplicateChecker />}
            <JournalStream />
          </>
        )
      case 'feedback':
        return <div className="p-6 text-center text-muted-foreground">Feedback feature coming soon...</div>
      case 'articles':
        return <div className="p-6 text-center text-muted-foreground">Articles feature coming soon...</div>
      case 'meets':
        return <div className="p-6 text-center text-muted-foreground">Meets feature coming soon...</div>
      case 'karma':
        return <div className="p-6 text-center text-muted-foreground">Karma feature coming soon...</div>
      default:
        return <JournalStream />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      <main className="lg:pl-64">
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
