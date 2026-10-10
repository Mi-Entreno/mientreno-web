/**
 * Literal mirror of the backend's membership DTOs — the trainer's plan with the
 * platform (Pro), paid to Mi Entreno. Not to be confused with
 * `subscription-plans`, the plans a trainer sells to their students.
 *
 * Amounts arrive as JSON numbers (`BigDecimal` serialised by Jackson), dates
 * as ISO-8601 instants.
 */

/** `MembershipStatus`. */
export type MembershipStatusDTO = "PENDING" | "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED"

/** `MembershipBillingPeriod`. */
export type BillingPeriodDTO = "MONTHLY" | "YEARLY"

/** `FeatureType`. */
export type FeatureTypeDTO = "BOOLEAN" | "LIMIT" | "CONFIG"

/** `FeatureEntitlementResponseDTO`. */
export interface FeatureEntitlementDTO {
  code: string
  name: string
  description: string | null
  type: FeatureTypeDTO
  unit: string | null
  enabled: boolean
  /** null = unlimited. For a CONFIG feature, the value that applies (e.g. the fee %). */
  limit: number | null
  /** How much is used right now, when the backend can count it cheaply. */
  used: number | null
  upgradePlanCode: string | null
}

/** `EntitlementsResponseDTO` — `GET /api/entitlements/me`. */
export interface EntitlementsDTO {
  planCode: string | null
  planName: string | null
  audience: "STUDENT" | "TRAINER" | "BRAND" | null
  defaultPlan: boolean
  membershipStatus: MembershipStatusDTO | null
  features: FeatureEntitlementDTO[]
}

/** `MyMembershipResponseDTO.CurrentMembership`. */
export interface CurrentMembershipDTO {
  id: number
  planCode: string
  planName: string
  status: MembershipStatusDTO
  billingPeriod: BillingPeriodDTO | null
  amount: number
  currency: string
  /** REVENUECAT = bought in the mobile app; App Store / Google Play manage renewal and cancellation. */
  provider: "MERCADO_PAGO" | "MANUAL" | "REVENUECAT"
  currentPeriodEnd: string | null
  trialEndsAt: string | null
  graceUntil: string | null
  cancelAtPeriodEnd: boolean
  accessUntil: string | null
  renewsAt: string | null
  /** Only while PENDING: to resume an unfinished payment. */
  checkoutUrl: string | null
}

/** `MyMembershipResponseDTO` — `GET /api/membership/me`. */
export interface MyMembershipDTO {
  effectivePlanCode: string | null
  effectivePlanName: string | null
  membership: CurrentMembershipDTO | null
  trialEligible: boolean
  billingEnabled: boolean
}

/** `PlanPriceResponseDTO`. */
export interface PlanPriceDTO {
  id: number
  billingPeriod: BillingPeriodDTO
  amount: number
  currency: string
  trialDays: number
  label: string | null
  active: boolean
  validFrom: string
  validTo: string | null
  /** The App Store product that is this price, for in-app purchases. */
  appStoreProductId: string | null
  /** The Google Play product, as RevenueCat reports it ("product:basePlan"). */
  playStoreProductId: string | null
}

/** `PlanBenefitResponseDTO`. */
export interface PlanBenefitDTO {
  featureCode: string
  name: string
  description: string | null
  type: FeatureTypeDTO
  unit: string | null
  enabled: boolean
  limit: number | null
  fromPlan: boolean
}

/** `MembershipPlanResponseDTO` — `GET /api/membership/plans` and the admin listing. */
export interface MembershipPlanDTO {
  id: number
  code: string
  name: string
  description: string | null
  audience: "STUDENT" | "TRAINER" | "BRAND"
  tierRank: number
  defaultPlan: boolean
  highlightLabel: string | null
  current: boolean
  /** Can be subscribed to. The shopfront only lists active plans; the admin sees all. */
  active: boolean
  /** Published in the shopfront. */
  visible: boolean
  prices: PlanPriceDTO[]
  benefits: PlanBenefitDTO[]
}

/** `CheckoutResponseDTO` — `POST /api/membership/checkout`. */
export interface CheckoutDTO {
  membershipId: number
  status: MembershipStatusDTO
  checkoutUrl: string | null
  trialIncluded: boolean
}

/** `MembershipPaymentResponseDTO` — `GET /api/membership/me/payments`. */
export interface MembershipPaymentDTO {
  id: number
  membershipId: number
  amount: number
  currency: string
  status: string
  statusDetail: string | null
  periodStart: string | null
  periodEnd: string | null
  paidAt: string | null
}
