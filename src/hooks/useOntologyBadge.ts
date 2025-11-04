/**
 * Story 2.4.7: Ontology Update Notifications
 * Hook to track unread ontology update count with real-time subscriptions
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Returns the count of unread ontology updates for the current user.
 * Updates in real-time via Supabase Realtime subscriptions.
 *
 * @returns Number of unread ontology updates (0 if not authenticated)
 */
export function useOntologyBadge(): number {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      return
    }

    // Fetch initial count of unread updates
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('ontology_updates')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('viewed_at', null)

      if (!error && count !== null) {
        setUnreadCount(count)
      } else if (error) {
        console.error('[useOntologyBadge] Error fetching count:', error)
      }
    }

    fetchCount()

    // Subscribe to real-time changes on ontology_updates table
    const channel = supabase
      .channel(`ontology-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'ontology_updates',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[useOntologyBadge] Realtime event:', payload)
          // Refetch count on any change to ontology_updates
          fetchCount()
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return unreadCount
}
