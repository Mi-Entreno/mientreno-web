import { apiFetch } from "@/core/http/client"

import type {
  UserDetailRequestDTO,
  UserDetailResponseDTO,
  UserPreferencesDTO,
  UserProfileResponseDTO,
} from "../dto/user.dto"
import {
  toUserPreferences,
  toUserProfile,
  toUserProfileUpdateRequest,
  type UserProfileFormValues,
} from "../mappers/user.mapper"
import type { UserPreferences, UserProfile } from "../model/user.model"

export const userRepository = {
  async getProfile(): Promise<UserProfile> {
    return toUserProfile(await apiFetch<UserProfileResponseDTO>("/api/user-detail"))
  },

  async updateProfile(values: UserProfileFormValues): Promise<UserProfile> {
    return toUserProfile(
      await apiFetch<UserProfileResponseDTO>("/api/user-detail", {
        method: "PUT",
        body: toUserProfileUpdateRequest(values),
      }),
    )
  },

  /**
   * `POST /api/user-detail` — the initial-setup variant, where every field is
   * `@NotBlank` and `city` / `bio` are required.
   *
   * The trainer flow does not use it: `POST /api/trainer/profile/complete`
   * already creates the user detail from the same data and returns a refreshed
   * JWT, so calling this as well would be a second, weaker path to the same
   * state. Kept because it is part of the API surface and the student-facing
   * setup needs it.
   */
  async createDetail(body: UserDetailRequestDTO): Promise<string> {
    const response = await apiFetch<UserDetailResponseDTO>("/api/user-detail", {
      method: "POST",
      body,
    })
    return response.mensaje
  },

  async getPreferences(): Promise<UserPreferences> {
    return toUserPreferences(await apiFetch<UserPreferencesDTO>("/api/users/preferences"))
  },

  async updatePreferences(preferences: UserPreferences): Promise<UserPreferences> {
    return toUserPreferences(
      await apiFetch<UserPreferencesDTO>("/api/users/preferences", {
        method: "PUT",
        body: { onboardingMode: preferences.onboardingMode },
      }),
    )
  },
}
