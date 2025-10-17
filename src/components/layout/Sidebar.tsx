'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/branding/Logo'
import { Menu, X, BookOpen, StickyNote, MessageCircle, FileText, Users, Coins } from 'lucide-react'

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, signOut } = useAuth()

  const sections = [
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'feedback', label: 'Feedback', icon: MessageCircle },
    { id: 'articles', label: 'Articles', icon: FileText },
    { id: 'meets', label: 'Meets', icon: Users },
    { id: 'karma', label: 'Karma', icon: Coins },
  ]

  return (
    <>
      {/* Mobile/Collapsed Toggle */}
      <div className={`fixed top-4 left-4 z-50 ${isCollapsed ? '' : 'lg:hidden'}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-dvh bg-sidebar border-r border-sidebar-border z-40 transition-transform duration-300
        ${isCollapsed ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'}
        w-64
      `}>
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="mb-8">
            <Logo size={32} />
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id

              return (
                <Button
                  key={section.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                  onClick={() => onSectionChange(section.id)}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {section.label}
                </Button>
              )
            })}
          </nav>

          {/* User Status */}
          <div className="border-t border-sidebar-border pt-4 mt-auto">
            {user ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-sidebar-foreground">Signed in as:</p>
                  <p className="text-sm text-sidebar-foreground/60 truncate">{user.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={signOut} className="w-full">
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href="/auth">Sign Up</a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  )
}