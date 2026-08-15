import type { SubscriptionPlan } from "@/features/subscription-plans/model/subscription-plan.model"
import type { SubscriptionStatus } from "@/features/students/model/student.model"

import type { InvitationStatus } from "../dto/plan-invitation.dto"

export interface InvitationParty {
  id: number
  name: string
  /** Display URL through the media proxy. */
  avatarUrl: string | null
}

export interface PlanInvitation {
  id: number
  status: InvitationStatus
  message: string
  rejectionReason: string | null
  student: InvitationParty & { email: string | null }
  trainer: InvitationParty
  plan: SubscriptionPlan
  createdAt: string
  expiresAt: string | null
  respondedAt: string | null
  subscriptionId: number | null
  /** Null until the invitation is accepted. See `isEnrolled`. */
  subscriptionStatus: SubscriptionStatus | null
  /** Only ever set on the student's token view of an unpaid subscription. */
  checkoutUrl: string | null
}

export interface AcceptedInvitation {
  invitationId: number
  subscriptionId: number
  subscriptionStatus: SubscriptionStatus
  checkoutUrl: string | null
}

export interface InvitationCounts {
  pending: number
  accepted: number
  rejected: number
}

/** `@PageableDefault(size = 20)` upstream. */
export const INVITATIONS_PAGE_SIZE = 20

/** How long the trainer's note can be; `@Size(max = 500)` in the request DTO. */
export const MAX_MESSAGE_LENGTH = 500

export type InvitationTone = "info" | "success" | "warning" | "danger" | "neutral"

interface StatusDescriptor {
  label: string
  tone: InvitationTone
}

const STATUSES: Record<InvitationStatus, StatusDescriptor> = {
  PENDING: { label: "Pendiente", tone: "warning" },
  ACCEPTED: { label: "Aceptada", tone: "success" },
  REJECTED: { label: "Rechazada", tone: "danger" },
  CANCELLED: { label: "Cancelada", tone: "neutral" },
  EXPIRED: { label: "Caducada", tone: "neutral" },
}

/**
 * Falls back instead of rendering blank, the same way `describeType` does for
 * notifications: the backend can add a state without this build knowing it.
 */
export function describeStatus(status: InvitationStatus): StatusDescriptor {
  return STATUSES[status] ?? { label: status, tone: "neutral" }
}

/**
 * Whether the person on the other end is actually a student yet.
 *
 * Accepting an offer creates a subscription, but a paid plan leaves it in
 * `PENDING_PAYMENT`; the backend only moves it to `ACTIVE` when a payment is
 * approved. So "did they accept" and "are they my student" are two different
 * questions, and this is the second one. `PAUSED` counts: they paid, the
 * trainer paused them afterwards.
 *
 * A missing `subscriptionStatus` reads as "not enrolled" on purpose — the
 * failure mode of guessing the other way is offering the trainer a student
 * page for someone who never paid.
 */
export function isEnrolled(
  invitation: Pick<PlanInvitation, "status" | "subscriptionStatus">,
): boolean {
  if (invitation.status !== "ACCEPTED") return false
  return invitation.subscriptionStatus === "ACTIVE" || invitation.subscriptionStatus === "PAUSED"
}

/** Accepted, but the money has not arrived. The one state worth explaining. */
export function isAwaitingPayment(
  invitation: Pick<PlanInvitation, "status" | "subscriptionStatus">,
): boolean {
  return invitation.status === "ACCEPTED" && invitation.subscriptionStatus === "PENDING_PAYMENT"
}

/** Only a live invitation can be withdrawn; anything else is a 409 upstream. */
export function canCancel(status: InvitationStatus): boolean {
  return status === "PENDING"
}

/**
 * Resending is for invitations that died without an answer. A rejection is an
 * answer — re-offering the same plan on a click would be nagging, and the
 * backend rate-limits it anyway.
 */
export function canResend(status: InvitationStatus): boolean {
  return status === "EXPIRED" || status === "CANCELLED"
}

/** Tabs on the invitations screen. `null` is "all". */
export const INVITATION_FILTERS: { value: InvitationStatus | null; label: string }[] = [
  { value: "PENDING", label: "Pendientes" },
  { value: "ACCEPTED", label: "Aceptadas" },
  { value: "REJECTED", label: "Rechazadas" },
  { value: null, label: "Todas" },
]

export interface InvitationFormValues {
  studentId: number | null
  planId: number | null
  message: string
}

export function emptyInvitationForm(): InvitationFormValues {
  return { studentId: null, planId: null, message: "" }
}

/**
 * Days left before an invitation expires, or null when it has no deadline or
 * is no longer live.
 *
 * Rounded up, so "expires in 4 hours" reads as 1 day rather than 0 — a zero
 * would render as "caduca hoy" for something that is still perfectly usable.
 */
export function daysUntilExpiry(
  invitation: Pick<PlanInvitation, "status" | "expiresAt">,
  now: number = Date.now(),
): number | null {
  if (invitation.status !== "PENDING" || !invitation.expiresAt) return null

  const time = Date.parse(invitation.expiresAt)
  if (!Number.isFinite(time)) return null

  const days = Math.ceil((time - now) / 86_400_000)
  return days > 0 ? days : 0
}

export type { InvitationStatus }
