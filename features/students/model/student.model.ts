import type { SubscriptionPlan } from "@/features/subscription-plans/model/subscription-plan.model"

import type { SubscriptionStatus } from "../dto/student.dto"

/**
 * What the trainer may see of a student's allergies. A health datum: the
 * backend sends it only with the student's explicit consent, so an empty value
 * means "nothing shared", never "no allergies".
 */
export interface StudentAllergies {
  list: string[]
  other: string | null
}

export function hasAllergies(allergies: StudentAllergies): boolean {
  return allergies.list.length > 0 || Boolean(allergies.other?.trim())
}

export interface StudentSubscription {
  subscriptionId: number
  studentId: number | null
  studentName: string
  /** Display URL through the media proxy. */
  studentAvatarUrl: string | null
  plan: SubscriptionPlan | null
  status: SubscriptionStatus
  /** ISO-8601 instants, or null. */
  startedAt: string | null
  expiresAt: string | null
}

export interface SubscriptionDetail extends StudentSubscription {
  /** Allergies the student consented to share for nutrition planning; empty without consent. */
  allergies: StudentAllergies
  cancelledAt: string | null
  paymentProvider: string | null
  externalPaymentId: string | null
}

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  PENDING_PAYMENT: "Pago pendiente",
  ACTIVE: "Activa",
  PAUSED: "Pausada",
  CANCELLED: "Cancelada",
  EXPIRED: "Caducada",
}

/** Only ACTIVE can be paused, only PAUSED can be resumed (409 otherwise). */
export function canPause(status: SubscriptionStatus): boolean {
  return status === "ACTIVE"
}

export function canResume(status: SubscriptionStatus): boolean {
  return status === "PAUSED"
}

export type { SubscriptionStatus }
