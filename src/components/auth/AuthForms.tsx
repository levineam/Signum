'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface AuthFormsProps {
  mode: 'signin' | 'signup'
  onToggleMode: () => void
}

export function AuthForms({ mode, onToggleMode }: AuthFormsProps) {
  const { signIn, signUp, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Capture current values before any async operations
    const currentEmail = email.trim()
    const currentPassword = password
    
    console.log('Form submitted with:', {
      email: currentEmail,
      password: currentPassword ? '***' : 'missing',
      emailLength: currentEmail.length,
      passwordLength: currentPassword.length
    })

    // Validate email is always required
    if (!currentEmail) {
      setMessage('Email is required')
      return
    }

    // Password is only required for sign in/up, not for password reset
    if (!showResetPassword && !currentPassword) {
      setMessage('Password is required')
      return
    }
    
    setLoading(true)
    setMessage('')

    try {
      if (showResetPassword) {
        const { error } = await resetPassword(currentEmail)
        if (error && typeof error === 'object' && 'message' in error) {
          setMessage((error as { message: string }).message)
        } else {
          setMessage('Password reset email sent! Check your inbox.')
        }
      } else if (mode === 'signup') {
        const { error } = await signUp(currentEmail, currentPassword)
        if (error && typeof error === 'object' && 'message' in error) {
          setMessage((error as { message: string }).message)
        } else {
          setMessage('Check your email for the confirmation link!')
        }
      } else {
        console.log('Attempting sign in with:', { email: currentEmail, password: currentPassword ? '***' : 'missing' })
        const { error } = await signIn(currentEmail, currentPassword)
        if (error && typeof error === 'object' && 'message' in error) {
          setMessage((error as { message: string }).message)
        }
      }
    } catch (error) {
      console.error('Auth form error:', error)
      setMessage('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (showResetPassword) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
          <CardDescription>
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {message && (
              <div className={`text-sm ${message.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </div>
            )}

            <div className="space-y-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Email'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setShowResetPassword(false)}
              >
                Back to Sign In
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{mode === 'signup' ? 'Create Account' : 'Welcome Back'}</CardTitle>
        <CardDescription>
          {mode === 'signup'
            ? 'Create your account to start journaling with Signum'
            : 'Sign in to your Signum account'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
            />
          </div>

          {message && (
            <div className={`text-sm ${message.includes('Check your email') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}

          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Loading...' : (mode === 'signup' ? 'Create Account' : 'Sign In')}
            </Button>

            {mode === 'signin' && (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setShowResetPassword(true)}
              >
                Forgot your password?
              </Button>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Button variant="link" onClick={onToggleMode} className="p-0 h-auto">
              {mode === 'signup' ? 'Sign in' : 'Sign up'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}