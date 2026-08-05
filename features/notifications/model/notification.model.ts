import type { NotificationType } from "../dto/notification.dto"

export interface AppNotification {
  id: number
  type: NotificationType
  title: string
  body: string
  read: boolean
  readAt: string | null
  createdAt: string
}

/** Page size for the list; `@PageableDefault(size = 20)` upstream. */
export const NOTIFICATIONS_PAGE_SIZE = 20

/** How often the badge re-checks. There are no websockets upstream. */
export const UNREAD_POLL_MS = 60_000

export type NotificationTone = "info" | "success" | "warning" | "danger"

interface TypeDescriptor {
  label: string
  tone: NotificationTone
}

const TYPES: Record<NotificationType, TypeDescriptor> = {
  NEW_STUDENT: { label: "Nuevo alumno", tone: "success" },
  PLAN_READY: { label: "Plan publicado", tone: "info" },
  PLAN_UPDATED: { label: "Plan actualizado", tone: "info" },
  NUTRITION_PLAN_READY: { label: "Plan nutricional", tone: "info" },
  PAYMENT_APPROVED: { label: "Pago aprobado", tone: "success" },
  PAYMENT_REJECTED: { label: "Pago rechazado", tone: "danger" },
  SUBSCRIPTION_EXPIRING: { label: "Suscripción por vencer", tone: "warning" },
  SUBSCRIPTION_EXPIRED: { label: "Suscripción vencida", tone: "warning" },
  TRAINER_ANNOUNCEMENT: { label: "Anuncio", tone: "info" },
}

/**
 * Falls back rather than rendering blank for a type this build has not seen —
 * the backend can add constants without the dashboard being redeployed.
 */
export function describeType(type: NotificationType): TypeDescriptor {
  return TYPES[type] ?? { label: "Notificación", tone: "info" }
}

/** Relative time in Spanish; the exact timestamp stays in the title attribute. */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const time = Date.parse(iso)
  if (!Number.isFinite(time)) return ""

  const seconds = Math.round((now - time) / 1000)
  if (seconds < 60) return "ahora mismo"

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`

  const days = Math.round(hours / 24)
  if (days < 7) return `hace ${days} ${days === 1 ? "día" : "días"}`

  const weeks = Math.round(days / 7)
  if (weeks < 5) return `hace ${weeks} ${weeks === 1 ? "semana" : "semanas"}`

  const months = Math.round(days / 30)
  return `hace ${months} ${months === 1 ? "mes" : "meses"}`
}

/** Caps the badge so a large number does not stretch the header. */
export function badgeLabel(count: number): string {
  if (count <= 0) return ""
  return count > 99 ? "99+" : String(count)
}
