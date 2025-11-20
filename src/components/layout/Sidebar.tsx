'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Logo } from '@/components/branding/Logo'
import { Menu, X, BookOpen, StickyNote, Target, MessageCircle, FileText, Users, Coins, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import { useOntologyBadge } from '@/hooks/useOntologyBadge'
import { isForcedTestUserEnabled } from '@/lib/e2eTestUtils'

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  // Manual collapse state with localStorage persistence
  const [manuallyCollapsed, setManuallyCollapsed] = useState<boolean | null>(null)
  // Mobile drawer state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const { user, signOut } = useAuth()
  // Story 2.4.7: Ontology update notification badge
  const unreadCount = useOntologyBadge()
  const [isTestMode, setIsTestMode] = useState(false)

  // Check for test mode on mount
  useEffect(() => {
    setIsTestMode(isForcedTestUserEnabled())
  }, [])

  // Load manual collapse preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setManuallyCollapsed(saved === 'true')
    } else {
      setManuallyCollapsed(null) // Let responsive behavior handle it
    }
  }, [])

  // Save manual preference to localStorage
  const toggleManualCollapse = () => {
    const newState = manuallyCollapsed === null ? true : !manuallyCollapsed
    setManuallyCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  // Determine if sidebar should be collapsed based on manual preference
  // If no manual preference, let Tailwind responsive classes handle it
  const isCollapsed = manuallyCollapsed ?? false

  const sections = [
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'notes', label: 'Notes', icon: StickyNote },
    { id: 'ontology', label: 'Ontology', icon: Target },
    { id: 'feedback', label: 'Feedback', icon: MessageCircle },
    { id: 'articles', label: 'Articles', icon: FileText },
    { id: 'meets', label: 'Meets', icon: Users },
    { id: 'karma', label: 'Karma', icon: Coins },
  ]

  return (
    <>
      {/* Mobile Hamburger Button - Only visible on mobile (<768px) */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="bg-background/80 backdrop-blur-sm"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Manual Toggle Button - Desktop/Tablet only (>=768px) */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleManualCollapse}
        className={`
          hidden md:flex
          fixed top-4 z-50
          transition-all duration-300 ease-in-out
          ${
            manuallyCollapsed !== null
              ? (isCollapsed ? 'left-[72px]' : 'left-[248px]')
              : 'md:left-[72px] xl:left-[248px]'
          }
        `}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {
          manuallyCollapsed !== null
            ? (isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />)
            : <><ChevronRight className="h-5 w-5 xl:hidden" /><ChevronLeft className="h-5 w-5 hidden xl:block" /></>
        }
      </Button>

      {/* Sidebar - Desktop/Tablet (>=768px): Always visible, width changes */}
      <div className={`
        hidden md:flex
        fixed left-0 top-0 h-dvh bg-sidebar border-r border-sidebar-border z-40
        flex-col
        transition-all duration-300 ease-in-out
        ${
          // Manual override takes precedence
          manuallyCollapsed !== null
            ? (isCollapsed ? 'w-20' : 'w-64')
            // No manual override: responsive behavior
            : 'md:w-20 xl:w-64'
        }
      `}>
        {/* Responsive behavior:
          - Desktop (>=1280px xl:): Default to w-64 (full), unless manually collapsed -> w-20
          - Tablet (768px-1279px md:): Default to w-20 (icon-only), unless manually expanded -> w-64
          - Manual toggle overrides automatic responsive behavior
        */}
        <div className={`
          h-full flex flex-col
          transition-all duration-300 ease-in-out
          ${
            manuallyCollapsed !== null
              ? (isCollapsed ? 'p-4' : 'p-6')
              : 'md:p-4 xl:p-6'
          }
        `}>
          {/* Test Mode Banner */}
          {isTestMode && (
            <div className={`
              mb-4 p-2 rounded-md bg-warning/10 border border-warning/20
              ${manuallyCollapsed !== null ? (isCollapsed ? 'px-1' : '') : 'md:px-1 xl:px-2'}
            `}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className={`
                      flex items-center gap-2
                      ${manuallyCollapsed !== null ? (isCollapsed ? 'justify-center' : '') : 'md:justify-center xl:justify-start'}
                    `}>
                      <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />
                      <span className={`
                        text-xs font-medium text-warning
                        ${manuallyCollapsed !== null ? (isCollapsed ? 'hidden' : '') : 'md:hidden xl:inline'}
                      `}>
                        Test Mode
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-sm">
                      Test Mode Active: Using local-only data that won&apos;t persist. Great for fast iteration without Supabase!
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          {/* Header */}
          <div className={`
            mb-8 flex
            ${
              manuallyCollapsed !== null
                ? (isCollapsed ? 'justify-center' : 'justify-start')
                : 'md:justify-center xl:justify-start'
            }
          `}>
            <Logo size={
              manuallyCollapsed !== null
                ? (isCollapsed ? 28 : 32)
                : 32 // Keep consistent size, responsive handled by breakpoints
            } className={manuallyCollapsed === null ? 'md:w-7 md:h-7 xl:w-8 xl:h-8' : ''} />
          </div>

          {/* Navigation */}
          <TooltipProvider delayDuration={300}>
            <nav className="space-y-2 flex-1">
              {sections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                // Story 2.4.7: Show badge on Ontology button
                const showBadge = section.id === 'ontology' && unreadCount > 0

                const button = (
                  <Button
                    key={section.id}
                    variant={isActive ? "secondary" : "ghost"}
                    className={`
                      w-full transition-all duration-300 relative
                      ${
                        manuallyCollapsed !== null
                          ? (isCollapsed ? 'justify-center px-2' : 'justify-start')
                          : 'md:justify-center md:px-2 xl:justify-start xl:px-4'
                      }
                      ${
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                      }
                    `}
                    onClick={() => onSectionChange(section.id)}
                    aria-label={section.label}
                  >
                    <Icon className={`
                      h-5 w-5
                      ${
                        manuallyCollapsed !== null
                          ? (isCollapsed ? '' : 'mr-3')
                          : 'xl:mr-3'
                      }
                    `} />
                    <span className={`
                      text-lg
                      transition-opacity duration-300
                      ${
                        manuallyCollapsed !== null
                          ? (isCollapsed ? 'hidden opacity-0 w-0' : 'opacity-100')
                          : 'md:hidden md:opacity-0 md:w-0 xl:block xl:opacity-100 xl:w-auto'
                      }
                    `}>
                      {section.label}
                    </span>
                    {/* Story 2.4.7: Notification badge */}
                    {showBadge && (
                      <Badge
                        variant="destructive"
                        className={`
                          ml-auto
                          ${
                            manuallyCollapsed !== null
                              ? (isCollapsed ? 'absolute -top-1 -right-1' : '')
                              : 'md:absolute md:-top-1 md:-right-1 xl:relative xl:top-0 xl:right-0'
                          }
                        `}
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                )

                // Wrap button in tooltip if in icon-only mode
                return (
                  <Tooltip key={section.id}>
                    <TooltipTrigger asChild>
                      {button}
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={8}
                      className={`
                        ${
                          manuallyCollapsed !== null
                            ? (isCollapsed ? '' : 'hidden')
                            : 'xl:hidden'
                        }
                      `}
                    >
                      {section.label}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </nav>
          </TooltipProvider>

          {/* User Status - Hidden when collapsed or on tablet */}
          {(manuallyCollapsed !== null ? !isCollapsed : true) && (
            <div className={`
              border-t border-sidebar-border pt-4 mt-auto
              ${manuallyCollapsed === null ? 'md:hidden xl:block' : ''}
            `}>
              {user ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-base font-medium text-sidebar-foreground">Signed in as:</p>
                    <p className="text-base text-sidebar-foreground/60 truncate">{user.email}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={signOut} className="w-full" data-testid="sign-out-button">
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <a href="/auth" data-testid="sign-up-link">Sign Up</a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer - Only on mobile (<768px) */}
      <div className={`
        md:hidden
        fixed left-0 top-0 h-dvh bg-sidebar border-r border-sidebar-border z-40
        w-64
        transition-transform duration-300 ease-in-out
        ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <Logo size={32} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileDrawerOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2 flex-1">
            {sections.map((section) => {
              const Icon = section.icon
              const isActive = activeSection === section.id
              // Story 2.4.7: Show badge on Ontology button
              const showBadge = section.id === 'ontology' && unreadCount > 0

              return (
                <Button
                  key={section.id}
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                  onClick={() => {
                    onSectionChange(section.id)
                    setMobileDrawerOpen(false)
                  }}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <span className="text-lg">{section.label}</span>
                  {/* Story 2.4.7: Notification badge */}
                  {showBadge && (
                    <Badge variant="destructive" className="ml-auto">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              )
            })}
          </nav>

          {/* User Status */}
          <div className="border-t border-sidebar-border pt-4 mt-auto">
            {user ? (
              <div className="space-y-3">
                <div>
                  <p className="text-base font-medium text-sidebar-foreground">Signed in as:</p>
                  <p className="text-base text-sidebar-foreground/60 truncate">{user.email}</p>
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

      {/* Mobile Overlay - Only visible when drawer is open */}
      {mobileDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}
    </>
  )
}