'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  GUEST_DRAFT_KEY,
  MAX_DRAFT_SIZE,
  type GuestDraft,
} from '@/types/guest'

export const useGuestDraft = () => {
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Client-side only - load from localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(GUEST_DRAFT_KEY)
        if (saved) {
          const parsed: GuestDraft = JSON.parse(saved)
          setDraft(parsed.content || '')
        }
      } catch (error) {
        console.error('Failed to load guest draft:', error)
        // Clear corrupted data
        localStorage.removeItem(GUEST_DRAFT_KEY)
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  const saveDraft = useCallback((content: string) => {
    if (typeof window === 'undefined') return

    try {
      // Check size limit
      if (content.length > MAX_DRAFT_SIZE) {
        console.warn('Draft exceeds maximum size, truncating')
        content = content.substring(0, MAX_DRAFT_SIZE)
      }

      const draftData: GuestDraft = {
        content,
        lastModified: new Date().toISOString(),
        version: 1,
      }

      localStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(draftData))
      setDraft(content)
    } catch (error) {
      // Handle QuotaExceededError
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('localStorage quota exceeded, attempting sessionStorage fallback')

        try {
          // Try sessionStorage as fallback
          const draftData: GuestDraft = {
            content,
            lastModified: new Date().toISOString(),
            version: 1,
          }
          sessionStorage.setItem(GUEST_DRAFT_KEY, JSON.stringify(draftData))
          setDraft(content)
        } catch (sessionError) {
          console.error('Failed to save to sessionStorage:', sessionError)
          // Can't save - user will need to sign up immediately
          throw new Error('Storage quota exceeded. Please sign up to save your entry.')
        }
      } else {
        console.error('Failed to save guest draft:', error)
        throw error
      }
    }
  }, [])

  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(GUEST_DRAFT_KEY)
      sessionStorage.removeItem(GUEST_DRAFT_KEY)
      setDraft('')
    } catch (error) {
      console.error('Failed to clear guest draft:', error)
    }
  }, [])

  const getDraftSize = useCallback(() => {
    return draft.length
  }, [draft])

  return {
    draft,
    saveDraft,
    clearDraft,
    getDraftSize,
    isLoading,
  }
}
