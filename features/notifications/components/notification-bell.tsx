"use client"

import { Bell, CheckCheck, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from "../hooks/use-notifications"
import { badgeLabel } from "../model/notification.model"
import { NotificationItem } from "./notification-item"

/** Header bell with the unread badge, opening a panel of the latest ones. */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const unread = useUnreadCount()

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        aria-label={
          unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"
        }
        onClick={() => setOpen(true)}
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground"
          >
            {badgeLabel(unread)}
          </span>
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {/* Mounted only while open, so the list is not fetched on every page. */}
          {open && <NotificationPanel onNavigate={() => setOpen(false)} />}
        </SheetContent>
      </Sheet>
    </>
  )
}

function NotificationPanel({ onNavigate }: { onNavigate: () => void }) {
  const list = useNotifications()
  const unread = useUnreadCount()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  // The panel is a preview; the full history lives on its own page.
  const latest = list.notifications.slice(0, 8)

  return (
    <>
      <SheetHeader>
        <SheetTitle>Notificaciones</SheetTitle>
        <SheetDescription>
          {unread > 0 ? `${unread} sin leer` : "Estás al día."}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-2">
        {list.isLoading && (
          <p className="flex items-center gap-2 text-body text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando…
          </p>
        )}

        {list.isError && (
          <p className="text-body text-error-text">No se han podido cargar.</p>
        )}

        {!list.isLoading && latest.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-4 text-body text-muted-foreground">
            No tienes notificaciones.
          </p>
        )}

        {latest.length > 0 && (
          <ul className="flex flex-col gap-3">
            {latest.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                isPending={markRead.isPending}
                onMarkRead={(id) => markRead.mutate(id)}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border p-4">
        <Link
          href="/dashboard/notifications"
          onClick={onNavigate}
          className="text-body font-medium underline underline-offset-4"
        >
          Ver todas
        </Link>

        {unread > 0 && (
          <Button
            variant="ghost"
            size="sm"
            disabled={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            {markAll.isPending && <Loader2 className="size-4 animate-spin" />}
            <CheckCheck className="size-4" />
            Marcar todas
          </Button>
        )}
      </div>
    </>
  )
}
