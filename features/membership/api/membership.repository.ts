import { apiFetch } from "@/core/http/client"

import type {
  CheckoutDTO,
  EntitlementsDTO,
  MembershipPaymentDTO,
  MembershipPlanDTO,
  MyMembershipDTO,
} from "../dto/membership.dto"
import {
  toCheckout,
  toEntitlements,
  toMembershipPayment,
  toMembershipPlan,
  toMyMembership,
} from "../mappers/membership.mapper"
import type { Checkout, Entitlements, MembershipPayment, MembershipPlan, MyMembership } from "../model/membership.model"

/**
 * The trainer's membership with the platform.
 *
 * Every endpoint is about the account in the session: none takes a membership
 * id, so there is nobody else's to reach.
 */
export const membershipRepository = {
  /** `GET /api/entitlements/me` — what the current plan unlocks, with usage. For the UI only. */
  async entitlements(signal?: AbortSignal): Promise<Entitlements> {
    return toEntitlements(await apiFetch<EntitlementsDTO>("/api/entitlements/me", { signal }))
  },

  async me(signal?: AbortSignal): Promise<MyMembership> {
    return toMyMembership(await apiFetch<MyMembershipDTO>("/api/membership/me", { signal }))
  },

  async plans(signal?: AbortSignal): Promise<MembershipPlan[]> {
    return (await apiFetch<MembershipPlanDTO[]>("/api/membership/plans", { signal })).map(toMembershipPlan)
  },

  /**
   * `POST /api/membership/checkout`. Only the price travels: amount, period and
   * trial are decided server-side. `idempotencyKey` makes a double click (or a
   * retry after a timeout) return the same checkout instead of a second one.
   */
  async checkout(priceId: number, idempotencyKey: string): Promise<Checkout> {
    return toCheckout(
      await apiFetch<CheckoutDTO>("/api/membership/checkout", {
        method: "POST",
        body: { priceId },
        headers: { "Idempotency-Key": idempotencyKey },
      }),
    )
  },

  /** Stops renewing; benefits stay until the paid period ends. Repeating it is a no-op upstream. */
  async cancel(reason?: string): Promise<MyMembership> {
    return toMyMembership(
      await apiFetch<MyMembershipDTO>("/api/membership/me/cancel", {
        method: "POST",
        body: reason ? { reason } : {},
      }),
    )
  },

  async resume(): Promise<MyMembership> {
    return toMyMembership(await apiFetch<MyMembershipDTO>("/api/membership/me/resume", { method: "POST" }))
  },

  async payments(signal?: AbortSignal): Promise<MembershipPayment[]> {
    return (await apiFetch<MembershipPaymentDTO[]>("/api/membership/me/payments", { signal })).map(
      toMembershipPayment,
    )
  },
}
