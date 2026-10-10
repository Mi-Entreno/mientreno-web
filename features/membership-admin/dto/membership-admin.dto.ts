/**
 * Admin-side membership DTOs (`AdminMembershipController`). Plans reuse the
 * shopfront shape (`MembershipPlanResponseDTO`), which for the admin also
 * carries closed prices and hidden plans.
 */
import type { BillingPeriodDTO, MembershipStatusDTO } from "@/features/membership/dto/membership.dto"

export type { MembershipPlanDTO } from "@/features/membership/dto/membership.dto"

/** `AdminMembershipResponseDTO`. */
export interface AdminMembershipDTO {
  id: number
  userId: number
  userEmail: string | null
  planCode: string
  status: MembershipStatusDTO
  provider: "MERCADO_PAGO" | "MANUAL" | "REVENUECAT"
  externalId: string | null
  billingPeriod: BillingPeriodDTO | null
  amount: number
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  cancelledAt: string | null
  cancelReason: string | null
  endedAt: string | null
  createdAt: string
}

/** `AdminPlanUpdateDTO`: null fields are left untouched upstream. */
export interface AdminPlanUpdateDTO {
  name?: string
  description?: string
  tierRank?: number
  sortOrder?: number
  highlightLabel?: string
  active?: boolean
  visible?: boolean
}

/** `AdminPriceRequestDTO`: creates a new price and closes the current one for that period. */
export interface AdminPriceRequestDTO {
  billingPeriod: BillingPeriodDTO
  amount: number
  trialDays?: number
  label?: string
}

/** `AdminStoreProductsRequestDTO`. Empty or null removes the product for that store. */
export interface AdminStoreProductsRequestDTO {
  appStoreProductId: string | null
  playStoreProductId: string | null
}

/** `AdminEntitlementRequestDTO`. `limit: null` = unlimited. */
export interface AdminEntitlementRequestDTO {
  enabled: boolean
  limit: number | null
  config?: string | null
}
