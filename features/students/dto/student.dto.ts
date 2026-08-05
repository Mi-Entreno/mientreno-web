import type { SubscriptionPlanResponseDTO } from "@/features/subscription-plans/dto/subscription-plan.dto"

/** `SubscriptionStatus.java` — five states, not the three the old types assumed. */
export type SubscriptionStatus =
  | "PENDING_PAYMENT"
  | "ACTIVE"
  | "PAUSED"
  | "CANCELLED"
  | "EXPIRED"

/**
 * `SubscriptionResponseDTO` — what `GET /api/subscriptions/students` returns.
 *
 * Modelled from the *student's* point of view: it names the trainer, never the
 * student. See `docs/BACKEND_CHANGE_REQUEST.md`.
 *
 * `student` is the field that request proposes adding; it is optional here so
 * the repository can prefer it as soon as the backend ships it, without another
 * frontend change.
 */
export interface SubscriptionResponseDTO {
  id: number
  trainerId: number
  trainerName: string | null
  trainerImageUrl: string | null
  plan: SubscriptionPlanResponseDTO
  status: SubscriptionStatus
  /** `Instant` — ISO-8601 with offset. */
  startedAt: string | null
  expiresAt: string | null
  student?: { id: number; fullName: string | null; profileImageUrl: string | null }
}

/** `SubscriptionDetailResponseDTO` — this one *does* carry the student. */
export interface SubscriptionDetailResponseDTO {
  id: number
  status: SubscriptionStatus
  student: { id: number; fullName: string | null; profileImageUrl: string | null }
  trainer: { id: number; fullName: string | null; profileImageUrl: string | null }
  plan: SubscriptionPlanResponseDTO
  startedAt: string | null
  expiresAt: string | null
  cancelledAt: string | null
  paymentProvider: string | null
  externalPaymentId: string | null
}

/**
 * `TrainerStudentPlanSummaryDTO` from
 * `GET /api/training-plans/trainer/students`.
 *
 * Only the identity fields are typed here — this endpoint is borrowed purely as
 * a source of student names until the change request lands. Its `currentPlan`
 * belongs to phase 4.
 */
export interface TrainerStudentIdentityDTO {
  subscriptionId: number
  studentId: number
  studentFullName: string | null
  studentImageUrl: string | null
}
