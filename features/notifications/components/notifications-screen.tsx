"use client"

import { Bell, CheckCheck, Loader2 } from "lucide-react"

import { ErrorState } from "@/components/dashboard/error-state"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from "../hooks/use-notifications"
import { NotificationItem } from "./notification-item"

export function NotificationsScreen() {
  const list = useNotifications()
  const unread = useUnreadCount()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body text-muted-foreground">
          {unread > 0
            ? `Tienes ${unread} ${unread === 1 ? "notificación sin leer" : "notificaciones sin leer"}.`
            : "Estás al día."}
        </p>

        {unread > 0 && (
          <Button variant="outline" disabled={markAll.isPending} onClick={() => markAll.mutate()}>
            {markAll.isPending && <Loader2 className="size-4 animate-spin" />}
            <CheckCheck className="size-4" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {list.isLoading && (
        <ul className="flex flex-col gap-3">
          {[0, 1, 2].map((key) => (
            <li key={key}>
              <Skeleton className="h-24 w-full rounded-xl" />
            </li>
          ))}
        </ul>
      )}

      {list.isError && (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      )}

      {!list.isLoading && !list.isError && list.notifications.length === 0 && (
        <EmptyState
          icon={Bell}
          title="No tienes notificaciones"
          description="Te avisaremos aquí cuando un alumno se suscriba a uno de tus planes."
        />
      )}

      {list.notifications.length > 0 && (
        <>
          <ul className="flex flex-col gap-3">
            {list.notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isPending={markRead.isPending}
                onMarkRead={(id) => markRead.mutate(id)}
              />
            ))}
          </ul>

          {list.hasNextPage && (
            <Button
              variant="outline"
              className="self-center"
              disabled={list.isFetchingNextPage}
              onClick={() => list.fetchNextPage()}
            >
              {list.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
              {list.isFetchingNextPage ? "Cargando…" : "Cargar más"}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
