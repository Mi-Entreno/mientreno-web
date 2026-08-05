import { apiFetch } from "@/core/http/client"
import { ApiError } from "@/core/http/errors"

import type {
  SubscriptionDetailResponseDTO,
  SubscriptionResponseDTO,
  TrainerStudentIdentityDTO,
} from "../dto/student.dto"
import {
  joinStudentIdentities,
  toStudentSubscription,
  toSubscriptionDetail,
} from "../mappers/student.mapper"
import type { StudentSubscription, SubscriptionDetail } from "../model/student.model"

export const studentsRepository = {
  /**
   * The trainer's student roster.
   *
   * ## Why two requests
   *
   * `GET /api/subscriptions/students` has everything except who the student is
   * (`docs/BACKEND_CHANGE_REQUEST.md`, problem 1).
   * `GET /api/training-plans/trainer/students` has the names and avatars.
   *
   * Both are built from the identical repository query
   * (`findByTrainerIdAndStatus(trainerId, ACTIVE)`), so they cover the same
   * subscriptions and can be joined on `subscriptionId`. Two parallel requests,
   * not N+1.
   *
   * **This is the only place that knows about the workaround.** When the
   * backend adds `student` to `SubscriptionResponseDTO`, delete the second
   * request and the join — `toStudentSubscription` already prefers `dto.student`
   * when present, so nothing else changes.
   */
  async list(): Promise<StudentSubscription[]> {
    const [subscriptions, identities] = await Promise.all([
      apiFetch<SubscriptionResponseDTO[]>("/api/subscriptions/students"),
      // Tolerated failure: names are worth having, but not at the cost of the
      // whole roster.
      apiFetch<TrainerStudentIdentityDTO[]>("/api/training-plans/trainer/students").catch(
        () => [] as TrainerStudentIdentityDTO[],
      ),
    ])

    if (subscriptions.length > 0 && subscriptions[0].student) {
      // Backend fixed: the join is dead weight.
      return subscriptions.map((dto) => toStudentSubscription(dto))
    }

    return joinStudentIdentities(subscriptions, identities)
  },

  async getById(subscriptionId: number): Promise<SubscriptionDetail> {
    return toSubscriptionDetail(
      await apiFetch<SubscriptionDetailResponseDTO>(`/api/subscriptions/${subscriptionId}`),
    )
  },

  /**
   * Fetches subscriptions the roster endpoint hides.
   *
   * `getActiveByTrainer` filters to ACTIVE only, so a paused subscription
   * vanishes from the list and `resume` becomes unreachable
   * (`docs/BACKEND_CHANGE_REQUEST.md`, problem 2). The detail endpoint has no
   * such filter, so remembered ids can still be resolved.
   *
   * Missing or already-resumed ids are dropped rather than surfaced as errors.
   */
  async getManyByIds(subscriptionIds: number[]): Promise<SubscriptionDetail[]> {
    if (subscriptionIds.length === 0) return []

    const results = await Promise.all(
      subscriptionIds.map((id) =>
        studentsRepository.getById(id).catch((error) => {
          if (error instanceof ApiError) return null
          throw error
        }),
      ),
    )

    return results.filter((item): item is SubscriptionDetail => item !== null)
  },

  /** 204 on success; 409 when the subscription is not in a pausable state. */
  async pause(subscriptionId: number): Promise<void> {
    await apiFetch<void>(`/api/subscriptions/${subscriptionId}/pause`, { method: "PATCH" })
  },

  async resume(subscriptionId: number): Promise<void> {
    await apiFetch<void>(`/api/subscriptions/${subscriptionId}/resume`, { method: "PATCH" })
  },
}
