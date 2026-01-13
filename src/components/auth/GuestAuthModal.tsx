'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

interface GuestAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthSuccess?: (userId: string) => void
}

export function GuestAuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
}: GuestAuthModalProps) {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [autoDismissTimer, setAutoDismissTimer] = useState<NodeJS.Timeout>()

  // Auto-dismiss after 30s of inactivity
  useEffect(() => {
    if (!isOpen) {
      setAutoDismissTimer((prevTimer) => {
        if (prevTimer) clearTimeout(prevTimer)
        return undefined
      })
      return
    }

    const timer = setTimeout(() => {
      onClose()
    }, 30000) // 30 seconds

    setAutoDismissTimer(timer)

    return () => {
      clearTimeout(timer)
    }
  }, [isOpen, onClose])

  // Reset auto-dismiss timer on user interaction
  const resetAutoDismissTimer = () => {
    if (autoDismissTimer) clearTimeout(autoDismissTimer)

    const timer = setTimeout(() => {
      onClose()
    }, 30000)

    setAutoDismissTimer(timer)
  }

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMode('signin')
      setEmail('')
      setPassword('')
      setMessage('')
      setLoading(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    resetAutoDismissTimer()

    const currentEmail = email.trim()
    const currentPassword = password

    // Validation
    if (!currentEmail) {
      setMessage('Email is required')
      return
    }

    if (mode !== 'reset' && !currentPassword) {
      setMessage('Password is required')
      return
    }

    if (mode === 'signup' && currentPassword.length < 6) {
      setMessage('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      if (mode === 'reset') {
        const { error } = await resetPassword(currentEmail)
        if (error && typeof error === 'object' && 'message' in error) {
          setMessage((error as { message: string }).message)
        } else {
          setMessage('Password reset email sent! Check your inbox.')
        }
      } else if (mode === 'signup') {
        const { error, data } = await signUp(currentEmail, currentPassword)
        if (error && typeof error === 'object' && 'message' in error) {
          setMessage((error as { message: string }).message)
        } else if (data && typeof data === 'object' && 'user' in data && data.user && typeof data.user === 'object' && 'id' in data.user) {
          // Call success callback with user ID
          onAuthSuccess?.((data.user as { id: string }).id)
          // Don't close modal yet - let parent handle it after content transfer
        } else {
          setMessage('Check your email for the confirmation link!')
        }
      } else {
        const { error, data } = await signIn(currentEmail, currentPassword)
        if (error && typeof error === 'object' && 'message' in error) {
          setMessage((error as { message: string }).message)
        } else if (data && typeof data === 'object' && 'user' in data && data.user && typeof data.user === 'object' && 'id' in data.user) {
          // Call success callback with user ID
          onAuthSuccess?.((data.user as { id: string }).id)
          // Don't close modal yet - let parent handle it after content transfer
        }
      }
    } catch (error) {
      console.error('Auth modal error:', error)
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return // Don't allow close during auth
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => {
          e.preventDefault() // Prevent closing on outside click
        }}
        aria-labelledby="guest-auth-title"
        aria-describedby="guest-auth-description"
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <DialogHeader>
          <DialogTitle id="guest-auth-title">
            {mode === 'reset'
              ? 'Reset Password'
              : mode === 'signup'
                ? 'Start Your Journey'
                : 'Welcome Back'}
          </DialogTitle>
          <DialogDescription id="guest-auth-description">
            {mode === 'reset'
              ? "Enter your email and we'll send you a reset link"
              : mode === 'signup'
                ? 'Create an account to save your journal entry'
                : 'Sign in to save your journal entry'}
          </DialogDescription>
        </DialogHeader>

        {/* Google Sign In - only show for signin/signup, not reset */}
        {mode !== 'reset' && (
          <>
            <GoogleSignInButton
              disabled={loading}
              onError={(msg) => setMessage(msg)}
              className="w-full mt-4"
            />

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  or continue with email
                </span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guest-email">Email</Label>
            <Input
              id="guest-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                resetAutoDismissTimer()
              }}
              required
              autoComplete="email"
              autoFocus
              disabled={loading}
            />
          </div>

          {mode !== 'reset' && (
            <div className="space-y-2">
              <Label htmlFor="guest-password">Password</Label>
              <Input
                id="guest-password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  resetAutoDismissTimer()
                }}
                required
                minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                disabled={loading}
              />
              {mode === 'signup' && (
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              )}
            </div>
          )}

          {message && (
            <div
              className={`text-sm ${message.includes('sent') || message.includes('Check your email') ? 'text-green-600' : 'text-red-600'}`}
              role="alert"
            >
              {message}
            </div>
          )}

          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? 'Loading...'
                : mode === 'reset'
                  ? 'Send Reset Email'
                  : mode === 'signup'
                    ? 'Sign Up'
                    : 'Sign In'}
            </Button>

            {mode === 'signin' && (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setMode('reset')
                  setMessage('')
                  resetAutoDismissTimer()
                }}
                disabled={loading}
              >
                Forgot your password?
              </Button>
            )}

            {mode === 'reset' && (
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setMode('signin')
                  setMessage('')
                  resetAutoDismissTimer()
                }}
                disabled={loading}
              >
                Back to Sign In
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {mode === 'signup' ? (
              <>
                Already have an account?{' '}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setMode('signin')
                    setMessage('')
                    resetAutoDismissTimer()
                  }}
                  className="p-0 h-auto"
                  disabled={loading}
                >
                  Sign in
                </Button>
              </>
            ) : mode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setMode('signup')
                    setMessage('')
                    resetAutoDismissTimer()
                  }}
                  className="p-0 h-auto"
                  disabled={loading}
                >
                  Sign up
                </Button>
              </>
            ) : null}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
