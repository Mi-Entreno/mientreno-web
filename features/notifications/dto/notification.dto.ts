/** Literal mirrors of `notification/dto/response`. */

/**
 * `NotificationType.java` — nine constants, but only four are ever produced:
 *
 *   PLAN_READY        -> the student, from `TrainingPlanService.create`
 *   PAYMENT_APPROVED  -> the student, from `PaymentService`
 *   PAYMENT_REJECTED  -> the student, from `PaymentService`
 *   NEW_STUDENT       -> the **trainer**, from `SubscriptionService.subscribe`
 *
 * The remaining five (`PLAN_UPDATED`, `NUTRITION_PLAN_READY`,
 * `SUBSCRIPTION_EXPIRING`, `SUBSCRIPTION_EXPIRED`, `TRAINER_ANNOUNCEMENT`) have
 * no `send()` call anywhere. They are still handled here: an unused constant
 * today is a notification arriving tomorrow, and an unknown type must not
 * render blank.
 */
export type NotificationType =
  | "PLAN_READY"
  | "PLAN_UPDATED"
  | "NUTRITION_PLAN_READY"
  | "PAYMENT_APPROVED"
  | "PAYMENT_REJECTED"
  | "SUBSCRIPTION_EXPIRING"
  | "SUBSCRIPTION_EXPIRED"
  | "NEW_STUDENT"
  | "TRAINER_ANNOUNCEMENT"
  // ── Plan invitations (BACKEND_REQUIREMENTS.md §4) ─────────────────────────
  /** -> the **student**: a trainer has offered them a plan. */
  | "PLAN_INVITATION_RECEIVED"
  /** -> the **trainer**: the student accepted. */
  | "PLAN_INVITATION_ACCEPTED"
  /** -> the **trainer**: the student declined. */
  | "PLAN_INVITATION_REJECTED"
  /** -> the **trainer**: nobody answered before `expiresAt`. */
  | "PLAN_INVITATION_EXPIRED"

export interface NotificationResponseDTO {
  id: number
  type: NotificationType
  title: string
  body: string | null
  read: boolean
  /** `Instant`, null while unread. */
  readAt: string | null
  /**
   * Free-form String column.
   *
   * Every call site upstream passes null today, which is why a notification
   * cannot be clicked through to anything. `BACKEND_REQUIREMENTS.md` §4.2 asks
   * for a small JSON object here — `{"invitationId":12,"subscriptionId":7}` —
   * and `notification.mapper.ts` parses it defensively so a null, a malformed
   * string or an unknown key all degrade to "no link" rather than to a crash.
   */
  metadata: string | null
  createdAt: string
}

/** `UnreadCountResponseDTO(long count)`. */
export interface UnreadCountResponseDTO {
  count: number
}
