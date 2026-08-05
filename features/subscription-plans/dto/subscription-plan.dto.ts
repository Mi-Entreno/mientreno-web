/** Literal mirrors of the `subscription/dto` records. */

/** `BillingPeriod.java` — note it is `YEARLY`, not `ANNUAL`. */
export type BillingPeriod = "MONTHLY" | "QUARTERLY" | "YEARLY"

/** `SubscriptionPlanResponseDTO` — `price` is a `BigDecimal` serialised as a number. */
export interface SubscriptionPlanResponseDTO {
  id: number
  name: string
  description: string | null
  price: number
  billingPeriod: BillingPeriod
  maxStudents: number | null
  includesNutrition: boolean
}

/**
 * `CreatePlanRequestDTO`, used by both POST and PUT.
 *  - `name`: `@NotBlank`
 *  - `price`: `@NotNull @Positive` — zero is rejected upstream
 *  - `billingPeriod`: `@NotNull`
 */
export interface CreatePlanRequestDTO {
  name: string
  description: string | null
  price: number
  billingPeriod: BillingPeriod
  maxStudents: number | null
  includesNutrition: boolean
}
