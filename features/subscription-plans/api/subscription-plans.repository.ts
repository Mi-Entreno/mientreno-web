import { apiFetch } from "@/core/http/client"

import type { SubscriptionPlanResponseDTO } from "../dto/subscription-plan.dto"
import { toCreatePlanRequest, toSubscriptionPlan } from "../mappers/subscription-plan.mapper"
import type { PlanFormValues, SubscriptionPlan } from "../model/subscription-plan.model"

export const subscriptionPlansRepository = {
  async listMine(): Promise<SubscriptionPlan[]> {
    const dtos = await apiFetch<SubscriptionPlanResponseDTO[]>("/api/plans/my")
    return dtos.map(toSubscriptionPlan)
  },

  async create(values: PlanFormValues): Promise<SubscriptionPlan> {
    return toSubscriptionPlan(
      await apiFetch<SubscriptionPlanResponseDTO>("/api/plans", {
        method: "POST",
        body: toCreatePlanRequest(values),
      }),
    )
  },

  async update(planId: number, values: PlanFormValues): Promise<SubscriptionPlan> {
    return toSubscriptionPlan(
      await apiFetch<SubscriptionPlanResponseDTO>(`/api/plans/${planId}`, {
        method: "PUT",
        body: toCreatePlanRequest(values),
      }),
    )
  },

  /**
   * Deactivates a plan. Answers 204.
   *
   * Not a hard delete: students already subscribed keep their subscription.
   * `GET /api/plans/my` still lists it, so the UI cannot tell active from
   * deactivated — the response DTO has no `active` flag.
   */
  async deactivate(planId: number): Promise<void> {
    await apiFetch<void>(`/api/plans/${planId}`, { method: "DELETE" })
  },
}
