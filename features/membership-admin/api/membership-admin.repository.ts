import { apiFetch } from "@/core/http/client"
import { mapPage, pageQuery, type PageResponse, type SpringPage } from "@/core/http/pagination"
import { toMembershipPlan } from "@/features/membership/mappers/membership.mapper"

import type {
  AdminEntitlementRequestDTO,
  AdminMembershipDTO,
  AdminPlanUpdateDTO,
  AdminPriceRequestDTO,
  AdminStoreProductsRequestDTO,
  MembershipPlanDTO,
} from "../dto/membership-admin.dto"
import type { MembershipMetricsDTO } from "../dto/membership-metrics.dto"
import { toAdminMembership } from "../mappers/membership-admin.mapper"
import type { AdminMembership, MembershipPlan, MembershipStatus } from "../model/membership-admin.model"

/**
 * Plan configuration and membership operations. Every write is audited
 * upstream (`membership_config_audit`) and takes effect on the next request:
 * prices and limits are data, not deploys.
 */
export const membershipAdminRepository = {
  async plans(signal?: AbortSignal): Promise<MembershipPlan[]> {
    return (await apiFetch<MembershipPlanDTO[]>("/api/admin/membership/plans", { signal })).map(toMembershipPlan)
  },

  async updatePlan(planId: number, patch: AdminPlanUpdateDTO): Promise<MembershipPlan> {
    return toMembershipPlan(
      await apiFetch<MembershipPlanDTO>(`/api/admin/membership/plans/${planId}`, { method: "PUT", body: patch }),
    )
  },

  /** A price is never edited: this closes the current one for the period and opens a new one. */
  async addPrice(planId: number, price: AdminPriceRequestDTO): Promise<MembershipPlan> {
    return toMembershipPlan(
      await apiFetch<MembershipPlanDTO>(`/api/admin/membership/plans/${planId}/prices`, {
        method: "POST",
        body: price,
      }),
    )
  },

  /** Which App Store / Google Play product is this price, for in-app purchases. */
  async setStoreProducts(priceId: number, body: AdminStoreProductsRequestDTO): Promise<MembershipPlan> {
    return toMembershipPlan(
      await apiFetch<MembershipPlanDTO>(`/api/admin/membership/prices/${priceId}/store-products`, {
        method: "PUT",
        body,
      }),
    )
  },

  async setEntitlement(planId: number, featureCode: string, body: AdminEntitlementRequestDTO): Promise<MembershipPlan> {
    return toMembershipPlan(
      await apiFetch<MembershipPlanDTO>(`/api/admin/membership/plans/${planId}/entitlements/${featureCode}`, {
        method: "PUT",
        body,
      }),
    )
  },

  /** The plan falls back to the feature default. */
  async removeEntitlement(planId: number, featureCode: string): Promise<MembershipPlan> {
    return toMembershipPlan(
      await apiFetch<MembershipPlanDTO>(`/api/admin/membership/plans/${planId}/entitlements/${featureCode}`, {
        method: "DELETE",
      }),
    )
  },

  async memberships(status: MembershipStatus | null, page?: number, signal?: AbortSignal): Promise<PageResponse<AdminMembership>> {
    const dto = await apiFetch<SpringPage<AdminMembershipDTO>>("/api/admin/memberships", {
      signal,
      query: { ...pageQuery({ page }), status },
    })
    return mapPage(dto, toAdminMembership)
  },

  async metrics(signal?: AbortSignal): Promise<MembershipMetricsDTO> {
    return apiFetch<MembershipMetricsDTO>("/api/admin/membership/metrics", { signal })
  },

  /** Asks Mercado Pago and applies what it says, like a webhook. Returns what was applied. */
  /** A courtesy plan (MANUAL, no charge) until `endsAt`, for testers and support. */
  async grant(body: { email: string; planCode: string; endsAt: string; reason: string }): Promise<AdminMembership> {
    return toAdminMembership(
      await apiFetch<AdminMembershipDTO>("/api/admin/memberships/grant", { method: "POST", body }),
    )
  },

  async reconcile(membershipId: number): Promise<string[]> {
    return apiFetch<string[]>(`/api/admin/memberships/${membershipId}/reconcile`, { method: "POST" })
  },
}
