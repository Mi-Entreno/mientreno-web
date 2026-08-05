import { isoToDmy, toIsoDate } from "@/core/format/date"
import { toMediaUrl } from "@/core/http/media"

import type {
  UserProfileResponseDTO,
  UserProfileUpdateRequestDTO,
  UserPreferencesDTO,
} from "../dto/user.dto"
import type { UserPreferences, UserProfile } from "../model/user.model"

/**
 * Anticorruption layer for `/api/user-detail`.
 *
 * Two asymmetries live here so no component ever sees them:
 *
 *  1. `birthDate` arrives ISO and must be written back as `dd-MM-yyyy`
 *     (`@JsonFormat` on the request record only).
 *  2. `pathProfilePicture` is rewritten to the media proxy for display, but the
 *     original value is kept for writes.
 */
export function toUserProfile(dto: UserProfileResponseDTO): UserProfile {
  return {
    userId: dto.userId,
    email: dto.email ?? "",
    phone: dto.phone ?? "",
    firstName: dto.firstName ?? "",
    lastName: dto.lastName ?? "",
    birthDate: toIsoDate(dto.birthDate),
    gender: dto.gender ?? "",
    country: dto.country ?? "",
    avatarUrl: toMediaUrl(dto.pathProfilePicture),
    avatarPath: dto.pathProfilePicture ?? null,
  }
}

export interface UserProfileFormValues {
  firstName: string
  lastName: string
  birthDate: string | null
  gender: string
  country: string
  avatarPath: string
}

export function toUserProfileUpdateRequest(
  values: UserProfileFormValues,
): UserProfileUpdateRequestDTO {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    // ISO in the form (native date input) -> dd-MM-yyyy on the wire.
    birthDate: isoToDmy(values.birthDate),
    gender: emptyToNull(values.gender),
    country: emptyToNull(values.country),
    pathProfilePicture: emptyToNull(values.avatarPath),
  }
}

export function toUserPreferences(dto: UserPreferencesDTO): UserPreferences {
  return { onboardingMode: dto.onboardingMode }
}

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}
