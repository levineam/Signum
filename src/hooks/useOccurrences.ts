'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { occurrenceQueries } from '@/lib/supabase/occurrences'
import type { Occurrence } from '@/types/temporal'
import {
  CreateOccurrenceRequest,
  UpdateOccurrenceRequest,
  OccurrencesQuery,
} from '@/types/temporal'

const OCCURRENCES_QUERY_KEY = ['occurrences']

/**
 * Query hook for fetching occurrences with optional filtering
 *
 * @example
 * const { data: occurrences } = useOccurrences({
 *   status: 'pending',
 *   scheduledAfter: '2025-11-12T00:00:00Z',
 * })
 */
export function useOccurrences(query?: OccurrencesQuery) {
  return useQuery<Occurrence[]>({
    queryKey: [OCCURRENCES_QUERY_KEY, query],
    queryFn: () => occurrenceQueries.getOccurrences(query),
    staleTime: 30 * 1000,
  })
}

/**
 * Query hook for fetching a single occurrence by ID
 *
 * @example
 * const { data: occurrence } = useOccurrence('occurrence-id-123')
 */
export function useOccurrence(id: string) {
  return useQuery<Occurrence | undefined>({
    queryKey: [OCCURRENCES_QUERY_KEY, id],
    queryFn: () => occurrenceQueries.getOccurrence(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

/**
 * Query hook for fetching occurrences within a date range
 * Commonly used for "what's due today" queries
 *
 * @example
 * const { data: todayItems } = useOccurrencesByDateRange(
 *   '2025-11-12T00:00:00Z',
 *   '2025-11-13T00:00:00Z'
 * )
 */
export function useOccurrencesByDateRange(
  startDate: string,
  endDate: string,
  itemId?: string
) {
  return useQuery<Occurrence[]>({
    queryKey: [OCCURRENCES_QUERY_KEY, 'dateRange', startDate, endDate, itemId],
    queryFn: () =>
      occurrenceQueries.getOccurrencesByDateRange(startDate, endDate, itemId),
    staleTime: 30 * 1000,
  })
}

/**
 * Mutation hook for creating a new occurrence
 *
 * @example
 * const { mutate } = useCreateOccurrence()
 * mutate({
 *   itemId: 'item-id-123',
 *   scheduledAt: '2025-11-15T10:00:00Z',
 * })
 */
export function useCreateOccurrence() {
  const queryClient = useQueryClient()
  return useMutation<Occurrence, Error, CreateOccurrenceRequest>({
    mutationFn: (req) => occurrenceQueries.createOccurrence(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OCCURRENCES_QUERY_KEY })
    },
  })
}

/**
 * Mutation hook for updating an occurrence
 *
 * @example
 * const { mutate } = useUpdateOccurrence()
 * mutate({
 *   id: 'occurrence-id-123',
 *   req: { title: 'Updated title' },
 * })
 */
export function useUpdateOccurrence() {
  const queryClient = useQueryClient()
  return useMutation<
    Occurrence,
    Error,
    { id: string; req: UpdateOccurrenceRequest }
  >({
    mutationFn: ({ id, req }) => occurrenceQueries.updateOccurrence(id, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: OCCURRENCES_QUERY_KEY })
      queryClient.setQueryData([OCCURRENCES_QUERY_KEY, data.id], data)
    },
  })
}

/**
 * Mutation hook for deleting an occurrence
 *
 * @example
 * const { mutate } = useDeleteOccurrence()
 * mutate('occurrence-id-123')
 */
export function useDeleteOccurrence() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => occurrenceQueries.deleteOccurrence(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OCCURRENCES_QUERY_KEY })
    },
  })
}

/**
 * Mutation hook for completing an occurrence
 *
 * @example
 * const { mutate } = useCompleteOccurrence()
 * mutate('occurrence-id-123')
 */
export function useCompleteOccurrence() {
  const queryClient = useQueryClient()
  return useMutation<Occurrence, Error, string>({
    mutationFn: (id) => occurrenceQueries.completeOccurrence(id),
    onSuccess: (data) => {
      queryClient.setQueryData([OCCURRENCES_QUERY_KEY, data.id], data)
      queryClient.invalidateQueries({ queryKey: OCCURRENCES_QUERY_KEY })
    },
  })
}

/**
 * Mutation hook for skipping an occurrence
 *
 * @example
 * const { mutate } = useSkipOccurrence()
 * mutate('occurrence-id-123')
 */
export function useSkipOccurrence() {
  const queryClient = useQueryClient()
  return useMutation<Occurrence, Error, string>({
    mutationFn: (id) => occurrenceQueries.skipOccurrence(id),
    onSuccess: (data) => {
      queryClient.setQueryData([OCCURRENCES_QUERY_KEY, data.id], data)
      queryClient.invalidateQueries({ queryKey: OCCURRENCES_QUERY_KEY })
    },
  })
}
