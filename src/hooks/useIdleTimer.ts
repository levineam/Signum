'use client'

import { useRef, useCallback, useEffect } from 'react'
import { AUTH_MODAL_DISMISSED_KEY, COOLDOWN_MS, type AuthModalState } from '@/types/guest'

export const useIdleTimer = (callback: () => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>()

  const checkCooldown = useCallback((): boolean => {
    if (typeof window === 'undefined') return false

    try {
      const dismissed = sessionStorage.getItem(AUTH_MODAL_DISMISSED_KEY)
      if (!dismissed) return false

      const state: AuthModalState = JSON.parse(dismissed)
      const now = Date.now()
      const elapsed = now - state.dismissedAt

      // Still in cooldown period
      return elapsed < state.cooldownMs
    } catch (error) {
      console.error('Failed to check cooldown:', error)
      return false
    }
  }, [])

  const reset = useCallback(() => {
    // Cancel existing timer
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Check if we're in cooldown period
    if (checkCooldown()) {
      return
    }

    // Start new timer
    timeoutRef.current = setTimeout(callback, delay)
  }, [callback, delay, checkCooldown])

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }
  }, [])

  const setDismissed = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      const state: AuthModalState = {
        dismissedAt: Date.now(),
        cooldownMs: COOLDOWN_MS,
      }
      sessionStorage.setItem(AUTH_MODAL_DISMISSED_KEY, JSON.stringify(state))
    } catch (error) {
      console.error('Failed to set dismissal state:', error)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    reset,
    cancel,
    setDismissed,
    checkCooldown,
  }
}
