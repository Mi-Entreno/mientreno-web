"use client"

import { ArrowRight, Check } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { describeType, linkFor, relativeTime, type AppNotification } from "../model/notification.model"

const TONE_CLASSES: Record<string, string> = {
  info: "bg-secondary text-muted-foreground",
  success: "bg-success-surface text-success-text",
  warning: "bg-warning-surface text-warning-text",
  danger: "bg-error-surface text-error-text",
}

interface NotificationItemProps {
  notification: AppNotification
  onMarkRead: (id: number) => void
  isPending?: boolean
  /** Lets the bell's panel close itself when a row navigates away. */
  onNavigate?: () => void
}

export function NotificationItem({
  notification,
  onMarkRead,
  isPending,
  onNavigate,
}: NotificationItemProps) {
  const descriptor = describeType(notification.type)
  const href = linkFor(notification)

  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4 transition-colors",
        notification.read ? "border-border bg-card" : "border-primary/40 bg-primary/5",
      )}
    >
      {/* Unread state is a dot AND a background AND the button's presence —
          never colour alone. */}
      <span
        aria-hidden
        className={cn(
          "mt-1.5 size-2 shrink-0 rounded-full",
          notification.read ? "bg-transparent" : "bg-primary",
        )}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={cn("text-body", notification.read ? "font-medium" : "font-semibold")}>
            {notification.title}
          </p>
          <Badge className={cn("border-transparent", TONE_CLASSES[descriptor.tone])}>
            {descriptor.label}
          </Badge>
          {!notification.read && <span className="sr-only">No leída</span>}
        </div>

        {notification.body && (
          <p className="mt-1 text-body text-muted-foreground text-pretty">{notification.body}</p>
        )}

        <p
          className="mt-1 text-caption text-muted-foreground"
          title={new Date(notification.createdAt).toLocaleString("es-AR")}
        >
          {relativeTime(notification.createdAt)}
        </p>

        {/* Only rendered when `metadata` actually carried an id — a link that
            cannot be built must not appear as a dead affordance. */}
        {href && (
          <Link
            href={href}
            onClick={() => {
              if (!notification.read) onMarkRead(notification.id)
              onNavigate?.()
            }}
            className="mt-2 inline-flex items-center gap-1 text-body font-medium text-primary-text underline-offset-4 hover:underline"
          >
            Ver detalle
            <ArrowRight className="size-3.5" />
          </Link>
        )}
      </div>

      {!notification.read && (
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          aria-label={`Marcar "${notification.title}" como leída`}
          onClick={() => onMarkRead(notification.id)}
        >
          <Check className="size-4" />
        </Button>
      )}
    </li>
  )
}
