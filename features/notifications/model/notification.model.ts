import type { NotificationType } from "../dto/notification.dto"

/**
 * The parsed `metadata` payload.
 *
 * Every field is optional: the backend adds keys as features land, and an
 * older dashboard must ignore what it does not know rather than fail to render
 * the notification.
 */
export interface NotificationMetadata {
  invitationId?: number
  subscriptionId?: number
  studentId?: number
  planId?: number
}

export interface AppNotification {
  id: number
  type: NotificationType
  title: string
  body: string
  read: boolean
  readAt: string | null
  createdAt: string
  metadata: NotificationMetadata
}

/** Page size for the list; `@PageableDefault(size = 20)` upstream. */
export const NOTIFICATIONS_PAGE_SIZE = 20

/**
 * How often the badge re-checks. There are no websockets upstream.
 *
 * Was `1000_000` — sixteen minutes — while the comment beside it claimed one
 * minute, so the badge and the list disagreed for a quarter of an hour at a
 * time and a fresh notification looked like it had arrived twice.
 */
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
  PLAN_INVITATION_RECEIVED: { label: "Invitación recibida", tone: "info" },
  PLAN_INVITATION_ACCEPTED: { label: "Invitación aceptada", tone: "success" },
  PLAN_INVITATION_REJECTED: { label: "Invitación rechazada", tone: "danger" },
  PLAN_INVITATION_EXPIRED: { label: "Invitación caducada", tone: "warning" },
}

/**
 * Falls back rather than rendering blank for a type this build has not seen —
 * the backend can add constants without the dashboard being redeployed.
 */
export function describeType(type: NotificationType): TypeDescriptor {
  return TYPES[type] ?? { label: "Notificación", tone: "info" }
}

/**
 * Where clicking a notification should take the trainer, or null when there is
 * nowhere useful to go.
 *
 * Driven by `metadata`, so a type whose payload the backend has not filled in
 * yet simply renders as text — the row must never link somewhere that 404s.
 * Invitation notifications fall back to the invitations list, which is always a
 * sensible destination even without an id.
 *
 * That fallback carries a business rule for `PLAN_INVITATION_ACCEPTED`: the
 * backend omits `subscriptionId` while the subscription is still
 * `PENDING_PAYMENT`, precisely so this row cannot open a student page for
 * someone who has not paid. `NEW_STUDENT` — which only fires after an approved
 * payment — is the notification that does carry it.
 */
export function linkFor(notification: AppNotification): string | null {
  const { subscriptionId } = notification.metadata
  const student = subscriptionId ? `/dashboard/students/${subscriptionId}` : null

  switch (notification.type) {
    case "PLAN_INVITATION_ACCEPTED":
      return student ?? "/dashboard/invitations"
    case "PLAN_INVITATION_REJECTED":
    case "PLAN_INVITATION_EXPIRED":
    case "PLAN_INVITATION_RECEIVED":
      return "/dashboard/invitations"

    case "PLAN_READY":
    case "PLAN_UPDATED":
      return student && `${student}?tab=training`
    case "NUTRITION_PLAN_READY":
      return student && `${student}?tab=nutrition`

    case "NEW_STUDENT":
      return student ?? "/dashboard/students"

    case "PAYMENT_APPROVED":
    case "PAYMENT_REJECTED":
    case "SUBSCRIPTION_EXPIRING":
    case "SUBSCRIPTION_EXPIRED":
      return student

    default:
      return null
  }
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
