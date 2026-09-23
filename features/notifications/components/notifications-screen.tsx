"use client"

import { Bell, CheckCheck } from "lucide-react"

import { ErrorState } from "@/components/dashboard/error-state"
import { EmptyState } from "@/components/dashboard/empty-state"
import { BarsLoader } from "@/components/ui/bars-loader"
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
            ? `Tenés ${unread} ${unread === 1 ? "notificación sin leer" : "notificaciones sin leer"}.`
            : "Estás al día."}
        </p>

        {unread > 0 && (
          <Button variant="outline" disabled={markAll.isPending} onClick={() => markAll.mutate()}>
            {markAll.isPending && <BarsLoader />}
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
          title="No tenés notificaciones"
          description="Te avisaremos acá cuando un alumno se suscriba a uno de tus planes."
        />
      )}

      {list.notifications.length > 0 && (
        <>
          <ul className="flex flex-col gap-3">
            {list.notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                // Sólo la fila en vuelo: `isPending` a secas desactivaba el
                // botón de todas las no leídas a la vez.
                isPending={markRead.isPending && markRead.variables === notification.id}
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
              {list.isFetchingNextPage && <BarsLoader />}
              {list.isFetchingNextPage ? "Cargando…" : "Cargar más"}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
