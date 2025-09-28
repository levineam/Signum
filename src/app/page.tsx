'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { JournalStream } from '@/components/journal/JournalStream'

export default function Home() {
  const [activeSection, setActiveSection] = useState('journal')

  const renderContent = () => {
    switch (activeSection) {
      case 'journal':
        return <JournalStream />
      case 'notes':
        return <div className="p-6 text-center text-muted-foreground">Notes feature coming soon...</div>
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
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="lg:pl-64">
        {renderContent()}
      </main>
    </div>
  )
}
