import { apiFetch } from "@/core/http/client"
import { ApiError, normalizeError, readErrorBody } from "@/core/http/errors"

import type { TrainerProfileResponseDTO } from "../dto/trainer-profile.dto"
import { toCompleteRequest, toTrainerProfile, toUpdateRequest } from "../mappers/trainer-profile.mapper"
import type {
  CompleteProfileIdentityValues,
  TrainerProfile,
  TrainerProfileFormValues,
} from "../model/trainer-profile.model"

export const trainerProfileRepository = {
  /**
   * `GET /api/trainer/profile`.
   *
   * Returns null instead of throwing on 404: `TrainerProfileService.getProfile`
   * answers `AppException.notFound` for a trainer who has not completed the
   * profile yet, which is an expected state during onboarding, not a failure.
   */
  async get(): Promise<TrainerProfile | null> {
    try {
      return toTrainerProfile(await apiFetch<TrainerProfileResponseDTO>("/api/trainer/profile"))
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null
      throw error
    }
  },

  async update(values: TrainerProfileFormValues): Promise<TrainerProfile> {
    return toTrainerProfile(
      await apiFetch<TrainerProfileResponseDTO>("/api/trainer/profile", {
        method: "PUT",
        body: toUpdateRequest(values),
      }),
    )
  },

  /**
   * `POST /api/trainer/profile/complete`, routed through our own BFF handler
   * rather than the generic proxy.
   *
   * The endpoint answers with an `AuthResponseDTO` carrying a **new JWT** —
   * the `profileCompleted` claim has flipped to true. That token has to replace
   * the session cookie server-side, or the user keeps a stale claim and the
   * route guard bounces them back into onboarding forever.
   */
  async complete(
    values: TrainerProfileFormValues,
    identity: CompleteProfileIdentityValues,
  ): Promise<void> {
    const response = await fetch("/auth/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toCompleteRequest(values, identity)),
      credentials: "include",
    })

    if (!response.ok) {
      throw new ApiError(normalizeError(response.status, await readErrorBody(response)))
    }
  },
}
