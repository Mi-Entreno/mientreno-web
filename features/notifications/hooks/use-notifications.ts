"use client"

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { toast } from "sonner"

import { specificMessage } from "@/core/http/user-message"
import { nextPageParam } from "@/core/http/pagination"
import { qk } from "@/core/http/query-keys"
import { notificationsRepository } from "../api/notifications.repository"
import { UNREAD_POLL_MS, type AppNotification } from "../model/notification.model"

/**
 * Unread badge count.
 *
 * Polled, because the backend has no websocket or SSE channel — notifications
 * are rows written by other requests. One minute is frequent enough for a
 * badge and cheap enough to leave running.
 */
export function useUnreadCount() {
  const query = useQuery({
    queryKey: qk.notifications.unreadCount,
    queryFn: () => notificationsRepository.unreadCount(),
    refetchInterval: UNREAD_POLL_MS,
    // The tab regaining focus is the moment a stale badge is most visible.
    refetchOnWindowFocus: true,
    staleTime: UNREAD_POLL_MS / 2,
  })

  return query.data ?? 0
}

export function useNotifications() {
  const query = useInfiniteQuery({
    queryKey: qk.notifications.list,
    queryFn: ({ pageParam }) => notificationsRepository.list(pageParam),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    staleTime: 30_000,
  })

  const notifications = useMemo<AppNotification[]>(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  )

  return {
    notifications,
    totalItems: query.data?.pages[0]?.totalItems ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}

/**
 * Marks one notification read, optimistically.
 *
 * Worth the optimism here: the change is a boolean the user just clicked, and
 * rolling it back is restoring one snapshot. Waiting for a round trip to grey
 * out a row reads as a broken click.
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => notificationsRepository.markAsRead(id),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: qk.notifications.all })

      const previous = queryClient.getQueriesData({ queryKey: qk.notifications.all })

      queryClient.setQueryData(qk.notifications.unreadCount, (count?: number) =>
        Math.max(0, (count ?? 1) - 1),
      )
      queryClient.setQueryData(
        qk.notifications.list,
        (data?: { pages: { items: AppNotification[] }[] }) =>
          data && {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === id ? { ...item, read: true } : item,
              ),
            })),
          },
      )

      return { previous }
    },

    onError: (error, _id, context) => {
      for (const [key, value] of context?.previous ?? []) {
        queryClient.setQueryData(key, value)
      }
      toast.error(specificMessage(error) ?? "No pudimos marcarla como leída.")
    },

    // Reconcile with the server either way — the optimistic count is a guess.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.notifications.all })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    // 204 — one more endpoint that used to 500 before the phase 0 proxy fix.
    mutationFn: () => notificationsRepository.markAllAsRead(),
    onSuccess: () => {
      queryClient.setQueryData(qk.notifications.unreadCount, 0)
      queryClient.invalidateQueries({ queryKey: qk.notifications.all })
      toast.success("Todas marcadas como leídas")
    },
    onError: (error) =>
      toast.error(specificMessage(error) ?? "No pudimos marcarlas como leídas."),
  })
}
