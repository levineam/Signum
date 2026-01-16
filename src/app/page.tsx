'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { JournalStream } from '@/components/journal/JournalStream'
import { AppHeader } from '@/components/layout/AppHeader'
import { HomepagePrimer } from '@/components/home/HomepagePrimer'
import { RightPanel } from '@/components/layout/RightPanel'

export default function Home() {
  const { user, loading: authLoading } = useAuth()
  const [activeSection, setActiveSection] = useState('journal')
  const router = useRouter()

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
    } else if (section === 'ontology') {
      router.push('/ontology')
    }
  }

  const renderContent = () => {
    const isGuest = !user && !authLoading

    switch (activeSection) {
      case 'journal':
        return (
          <div>
            <HomepagePrimer />
            {/* Journal Stream */}
            <JournalStream isGuest={isGuest} />
          </div>
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
        return <JournalStream isGuest={isGuest} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      <RightPanel />
      {/* Note: lg:pr-80 removed while RightPanel is hidden. Re-add when panel is enabled. */}
      <main className="md:pl-20 xl:pl-64 transition-all duration-300">
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
