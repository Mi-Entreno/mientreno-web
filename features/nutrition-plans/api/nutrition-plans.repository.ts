import { apiFetch } from "@/core/http/client"
import { ApiError } from "@/core/http/errors"

import type {
  NutritionPlanResponseDTO,
  TrainerStudentNutritionSummaryDTO,
} from "../dto/nutrition-plan.dto"
import {
  toCreateNutritionRequest,
  toNutritionPlan,
  toNutritionPlanBody,
  toStudentNutritionSummary,
} from "../mappers/nutrition-plan.mapper"
import type {
  EditorNutritionPlan,
  NutritionPlan,
  StudentNutritionSummary,
} from "../model/nutrition-plan.model"

/**
 * Nutrition plans.
 *
 * `NutritionPlanService` mirrors `TrainingPlanService` exactly, including the
 * mismatch between the Swagger annotations and the behaviour:
 *
 *  - **POST** demotes the current plan, inserts `version + 1`, marks it current.
 *  - **PUT** rewrites the given version in place; `version` and `current` are
 *    untouched and no history entry appears.
 *
 * One difference from training: **nothing is notified here.**
 * `TrainingPlanService.create` sends `NotificationType.PLAN_READY`;
 * `NutritionPlanService.create` sends nothing at all, so publishing a nutrition
 * plan is silent for the student.
 */
export const nutritionPlansRepository = {
  /** Publishes a new version — POST. The student is *not* notified. */
  async publishVersion(
    subscriptionId: number,
    plan: EditorNutritionPlan,
  ): Promise<NutritionPlan> {
    return toNutritionPlan(
      await apiFetch<NutritionPlanResponseDTO>("/api/nutrition-plans", {
        method: "POST",
        body: toCreateNutritionRequest(plan, subscriptionId),
      }),
    )
  },

  /** Edits a version in place — PUT. No new version. */
  async editInPlace(planId: number, plan: EditorNutritionPlan): Promise<NutritionPlan> {
    return toNutritionPlan(
      await apiFetch<NutritionPlanResponseDTO>(`/api/nutrition-plans/${planId}`, {
        method: "PUT",
        body: toNutritionPlanBody(plan),
      }),
    )
  },

  /** 204. Deleting the current version promotes the highest remaining one. */
  async deleteVersion(planId: number): Promise<void> {
    await apiFetch<void>(`/api/nutrition-plans/${planId}`, { method: "DELETE" })
  },

  /** Null when the subscription has no current plan (the endpoint 404s). */
  async getCurrent(subscriptionId: number): Promise<NutritionPlan | null> {
    try {
      return toNutritionPlan(
        await apiFetch<NutritionPlanResponseDTO>(
          `/api/nutrition-plans/subscription/${subscriptionId}/current`,
        ),
      )
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null
      throw error
    }
  },

  async getHistory(subscriptionId: number): Promise<NutritionPlan[]> {
    const dtos = await apiFetch<NutritionPlanResponseDTO[]>(
      `/api/nutrition-plans/subscription/${subscriptionId}/history`,
    )
    return dtos.map(toNutritionPlan)
  },

  async getStudentPlans(): Promise<StudentNutritionSummary[]> {
    const dtos = await apiFetch<TrainerStudentNutritionSummaryDTO[]>(
      "/api/nutrition-plans/trainer/students",
    )
    return dtos.map(toStudentNutritionSummary)
  },
}
