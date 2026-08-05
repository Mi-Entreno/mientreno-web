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

export interface NotificationResponseDTO {
  id: number
  type: NotificationType
  title: string
  body: string | null
  read: boolean
  /** `Instant`, null while unread. */
  readAt: string | null
  /**
   * Free-form String column. **Every call site passes null today**, so there is
   * nothing to parse and no id to deep-link with.
   */
  metadata: string | null
  createdAt: string
}

/** `UnreadCountResponseDTO(long count)`. */
export interface UnreadCountResponseDTO {
  count: number
}
