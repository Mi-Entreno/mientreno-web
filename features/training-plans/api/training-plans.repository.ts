import { apiFetch } from "@/core/http/client"
import { ApiError } from "@/core/http/errors"

import type {
  TrainerStudentPlanSummaryDTO,
  TrainingPlanResponseDTO,
} from "../dto/training-plan.dto"
import {
  toCreateRequest,
  toPlanBody,
  toStudentPlanSummary,
  toTrainingPlan,
} from "../mappers/training-plan.mapper"
import type { EditorPlan, StudentPlanSummary, TrainingPlan } from "../model/training-plan.model"

/**
 * Training plans.
 *
 * ## Versioning, as the code actually behaves
 *
 * The Swagger annotations say `POST` "crea el primer plan (versión 1)" and
 * `PUT` "crea una nueva versión del plan, mantiene historial". Reading
 * `TrainingPlanService`, both are wrong — it is the other way round:
 *
 *  - **POST** (`create`) demotes the current plan (`old.setCurrent(false)`),
 *    computes `version = max(version) + 1`, inserts a new row with
 *    `current = true`, and notifies the student. It is the versioning
 *    operation, whether or not a plan already exists.
 *  - **PUT** (`update`) mutates the existing row: sets title and notes, clears
 *    `days` and rebuilds them. It never touches `version` or `current`, and
 *    creates no history entry.
 *
 * The method names here follow the behaviour, not the annotations.
 */
export const trainingPlansRepository = {
  /**
   * Publishes a new version — POST. Sends `PLAN_READY` to the student.
   */
  async publishVersion(subscriptionId: number, plan: EditorPlan): Promise<TrainingPlan> {
    return toTrainingPlan(
      await apiFetch<TrainingPlanResponseDTO>("/api/training-plans", {
        method: "POST",
        body: toCreateRequest(plan, subscriptionId),
      }),
    )
  },

  /** Edits a version in place — PUT. No new version, no notification. */
  async editInPlace(planId: number, plan: EditorPlan): Promise<TrainingPlan> {
    return toTrainingPlan(
      await apiFetch<TrainingPlanResponseDTO>(`/api/training-plans/${planId}`, {
        method: "PUT",
        body: toPlanBody(plan),
      }),
    )
  },

  /**
   * Deletes one version. Answers 204.
   *
   * If it was the current one, the highest remaining version is promoted to
   * current. Deleting the only version leaves the subscription with no plan.
   */
  async deleteVersion(planId: number): Promise<void> {
    await apiFetch<void>(`/api/training-plans/${planId}`, { method: "DELETE" })
  },

  /**
   * Current plan for a subscription, or null.
   *
   * `getCurrentBySubscription` throws `AppException.notFound` when nothing is
   * marked current, which is the normal state for a student who has no plan
   * yet — not an error worth surfacing.
   */
  async getCurrent(subscriptionId: number): Promise<TrainingPlan | null> {
    try {
      return toTrainingPlan(
        await apiFetch<TrainingPlanResponseDTO>(
          `/api/training-plans/subscription/${subscriptionId}/current`,
        ),
      )
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null
      throw error
    }
  },

  /** Every version, newest first (`findBySubscriptionIdOrderByVersionDesc`). */
  async getHistory(subscriptionId: number): Promise<TrainingPlan[]> {
    const dtos = await apiFetch<TrainingPlanResponseDTO[]>(
      `/api/training-plans/subscription/${subscriptionId}/history`,
    )
    return dtos.map(toTrainingPlan)
  },

  /** One row per active student, with their current plan or null. */
  async getStudentPlans(): Promise<StudentPlanSummary[]> {
    const dtos = await apiFetch<TrainerStudentPlanSummaryDTO[]>(
      "/api/training-plans/trainer/students",
    )
    return dtos.map(toStudentPlanSummary)
  },
}
