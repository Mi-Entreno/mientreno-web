import type { SubscriptionPlanResponseDTO } from "@/features/subscription-plans/dto/subscription-plan.dto"
import type { SubscriptionStatus } from "@/features/students/dto/student.dto"

/**
 * Contract for plan invitations — a trainer offering one of their subscription
 * plans to a specific student.
 *
 * **None of this exists upstream yet.** Today a subscription can only start
 * from the student's side (`SubscriptionService.subscribe`), so a trainer who
 * has just closed a deal in person has no way to hand the plan over. The whole
 * entity, its state machine and its endpoints are specified in
 * `BACKEND_REQUIREMENTS.md` §3.2–§3.4; these types are that specification in
 * TypeScript.
 */

/**
 * `InvitationStatus`.
 *
 * PENDING is the only live state. The other four are terminal, which is what
 * makes the list safe to cache and the badges safe to render without a second
 * lookup:
 *
 *   ACCEPTED  -> a Subscription now exists (`subscriptionId` is set)
 *   REJECTED  -> the student declined, optionally with a reason
 *   CANCELLED -> the trainer withdrew it before an answer
 *   EXPIRED   -> `expiresAt` passed with no answer
 *
 * **ACCEPTED does not mean the person is a student.** It means they said yes;
 * the subscription it created is `PENDING_PAYMENT` until a payment is approved.
 * `subscriptionStatus` is the field that answers "are they a student", and
 * everything in this feature that talks about *alumnos* reads that one.
 */
export type InvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "EXPIRED"

export interface InvitationPartyDTO {
  id: number
  fullName: string | null
  profileImageUrl: string | null
}

/** The student side also carries the (masked) email, to tell namesakes apart. */
export interface InvitationStudentDTO extends InvitationPartyDTO {
  email: string | null
}

export interface PlanInvitationResponseDTO {
  id: number
  status: InvitationStatus
  /** Optional note from the trainer, shown to the student with the offer. */
  message: string | null
  /** Only ever set on REJECTED, and only when the student wrote one. */
  rejectionReason: string | null
  student: InvitationStudentDTO
  trainer: InvitationPartyDTO
  /**
   * A snapshot embedded in the invitation, not a reference: a trainer editing
   * the plan's price must not change what an already-sent offer says.
   */
  plan: SubscriptionPlanResponseDTO
  /** `Instant` — ISO-8601 with offset. */
  createdAt: string
  expiresAt: string | null
  respondedAt: string | null
  /** Set once accepted; null in every other state. */
  subscriptionId: number | null
  /**
   * Status of the subscription acceptance created, or null when there is none.
   *
   * `PENDING_PAYMENT` is the whole point of this field: an accepted invitation
   * whose money has not arrived. Only `ACTIVE` (or a later `PAUSED`) means the
   * person is actually enrolled.
   */
  subscriptionStatus: SubscriptionStatus | null
  /**
   * Mercado Pago `init_point` for an unpaid subscription.
   *
   * Only the token endpoint fills this in — the payment link belongs to the
   * student, not to the trainer looking at their sent list.
   */
  checkoutUrl: string | null
}

/** `POST /api/plan-invitations`. */
export interface CreatePlanInvitationRequestDTO {
  studentId: number
  planId: number
  message: string | null
}

/** `POST /api/plan-invitations/{id}/reject`. */
export interface RejectInvitationRequestDTO {
  reason: string | null
}

/**
 * What acceptance answers.
 *
 * `checkoutUrl` is the Mercado Pago `init_point` when the plan has a price and
 * the trainer has a linked account. It is null for a free plan, and — this is
 * the case worth handling — also null when the trainer has *not* linked
 * Mercado Pago, which leaves the subscription in PENDING_PAYMENT with no way to
 * pay. See `BACKEND_REQUIREMENTS.md` §5.6.
 */
export interface AcceptInvitationResponseDTO {
  invitationId: number
  subscriptionId: number
  subscriptionStatus: SubscriptionStatus
  checkoutUrl: string | null
}

/** `GET /api/plan-invitations/sent/counts` — badge numbers for the tabs. */
export interface InvitationCountsDTO {
  pending: number
  accepted: number
  rejected: number
}
