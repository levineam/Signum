'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { itemQueries } from '@/lib/supabase/items'
import type { Item } from '@/types/temporal'
import {
  CreateItemRequest,
  UpdateItemRequest,
  ItemsQuery,
} from '@/types/temporal'

const ITEMS_QUERY_KEY = 'items' as const

/**
 * Query hook for fetching items with optional filtering
 *
 * @example
 * const { data: items, isLoading } = useItems({
 *   itemType: 'task',
 *   status: 'pending',
 * })
 */
export function useItems(query?: ItemsQuery) {
  return useQuery<Item[]>({
    queryKey: [ITEMS_QUERY_KEY, query],
    queryFn: () => itemQueries.getItems(query),
    staleTime: 30 * 1000, // 30 seconds
  })
}

/**
 * Query hook for fetching a single item by ID
 *
 * @example
 * const { data: item } = useItem('item-id-123')
 */
export function useItem(id: string) {
  return useQuery<Item | undefined>({
    queryKey: [ITEMS_QUERY_KEY, id],
    queryFn: () => itemQueries.getItem(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

/**
 * Mutation hook for creating a new item
 *
 * @example
 * const { mutate, isPending } = useCreateItem()
 * mutate({
 *   itemType: 'task',
 *   title: 'Buy groceries',
 *   priority: 'high',
 * })
 */
export function useCreateItem() {
  const queryClient = useQueryClient()
  return useMutation<Item, Error, CreateItemRequest>({
    mutationFn: (req) => itemQueries.createItem(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_QUERY_KEY] })
    },
  })
}

/**
 * Mutation hook for updating an item
 *
 * @example
 * const { mutate } = useUpdateItem()
 * mutate({
 *   id: 'item-id-123',
 *   req: { title: 'Updated title', priority: 'medium' },
 * })
 */
export function useUpdateItem() {
  const queryClient = useQueryClient()
  return useMutation<Item, Error, { id: string; req: UpdateItemRequest }>({
    mutationFn: ({ id, req }) => itemQueries.updateItem(id, req),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_QUERY_KEY] })
      queryClient.setQueryData([ITEMS_QUERY_KEY, data.id], data)
    },
  })
}

/**
 * Mutation hook for deleting an item
 *
 * @example
 * const { mutate } = useDeleteItem()
 * mutate('item-id-123')
 */
export function useDeleteItem() {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: (id) => itemQueries.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ITEMS_QUERY_KEY] })
    },
  })
}

/**
 * Mutation hook for completing an item
 *
 * @example
 * const { mutate } = useCompleteItem()
 * mutate('item-id-123')
 */
export function useCompleteItem() {
  const queryClient = useQueryClient()
  return useMutation<Item, Error, string>({
    mutationFn: (id) => itemQueries.completeItem(id),
    onSuccess: (data) => {
      queryClient.setQueryData([ITEMS_QUERY_KEY, data.id], data)
      queryClient.invalidateQueries({ queryKey: [ITEMS_QUERY_KEY] })
    },
  })
}

/**
 * Mutation hook for snoozing a reminder
 *
 * @example
 * const { mutate } = useSnoozeReminder()
 * mutate({
 *   id: 'reminder-id-123',
 *   until: '2025-11-13T09:00:00Z',
 * })
 */
export function useSnoozeReminder() {
  const queryClient = useQueryClient()
  return useMutation<Item, Error, { id: string; until: string }>({
    mutationFn: ({ id, until }) => itemQueries.snoozeReminder(id, until),
    onSuccess: (data) => {
      queryClient.setQueryData([ITEMS_QUERY_KEY, data.id], data)
      queryClient.invalidateQueries({ queryKey: [ITEMS_QUERY_KEY] })
    },
  })
}
