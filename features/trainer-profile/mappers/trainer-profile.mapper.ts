import { toIsoDate } from "@/core/format/date"
import { toMediaUrl } from "@/core/http/media"
import { normaliseSpecialties } from "@/features/specialties/model/specialty.model"

import type {
  CertificationDTO,
  CertificationRequestDTO,
  CompleteTrainerProfileRequestDTO,
  TrainerProfileResponseDTO,
  UpdateTrainerProfileRequestDTO,
} from "../dto/trainer-profile.dto"
import type {
  Certification,
  CompleteProfileIdentityValues,
  TrainerProfile,
  TrainerProfileFormValues,
} from "../model/trainer-profile.model"

/**
 * Anticorruption layer for `/api/trainer/profile`.
 *
 * This is the mapper the old `lib/types.ts` got wrong in nine separate fields
 * (`bio`/`description`, `hourlyRate`/`basePrice`, `profilePictureUrl`/
 * `profileImageUrl`, `rating`/`avgRating`, and so on), which is why the header
 * avatar never rendered.
 */
export function toCertification(dto: CertificationDTO): Certification {
  return {
    id: dto.id,
    name: dto.name,
    issuedBy: dto.issuedBy ?? "",
    issuedAt: toIsoDate(dto.issuedAt),
    expiresAt: toIsoDate(dto.expiresAt),
    certificateUrl: dto.certificateUrl ?? null,
  }
}

export function toTrainerProfile(dto: TrainerProfileResponseDTO): TrainerProfile {
  return {
    id: dto.id,
    fullName: dto.fullName ?? "",
    bio: dto.description ?? "",
    basePrice: dto.basePrice ?? null,
    experienceYears: dto.experienceYears ?? null,
    location: dto.location ?? "",
    avatarUrl: toMediaUrl(dto.profileImageUrl),
    avatarPath: dto.profileImageUrl ?? null,
    rating: {
      average: dto.avgRating ?? null,
      total: dto.totalReviews ?? 0,
    },
    activeStudents: dto.currentStudents ?? 0,
    specialtyNames: dto.specialties ?? [],
    certifications: (dto.certifications ?? []).map(toCertification),
  }
}

/**
 * Seeds the edit form from a loaded profile.
 *
 * Specialties go straight in: read and write both speak names now, so there is
 * no catalogue lookup between loading a profile and editing it — and no way for
 * a saved specialty to disappear from the form because the catalogue did not
 * contain it.
 */
export function toFormValues(profile: TrainerProfile): TrainerProfileFormValues {
  return {
    bio: profile.bio,
    // Numeric fields are strings in the form so an empty input stays empty
    // instead of collapsing to 0 — which the backend would treat as a real
    // price of zero.
    basePrice: profile.basePrice === null ? "" : String(profile.basePrice),
    experienceYears: profile.experienceYears === null ? "" : String(profile.experienceYears),
    location: profile.location,
    avatarPath: profile.avatarPath ?? "",
    specialties: normaliseSpecialties(profile.specialtyNames),
    certifications: profile.certifications,
  }
}

function toCertificationRequest(certification: Certification): CertificationRequestDTO {
  return {
    name: certification.name.trim(),
    issuedBy: emptyToNull(certification.issuedBy),
    // ISO on the wire — `CertificationRequestDTO` has no `@JsonFormat`.
    issuedAt: certification.issuedAt || null,
    expiresAt: certification.expiresAt || null,
    certificateUrl: emptyToNull(certification.certificateUrl),
  }
}

function sharedFields(values: TrainerProfileFormValues) {
  return {
    description: emptyToNull(values.bio),
    basePrice: toNumberOrNull(values.basePrice),
    experienceYears: toNumberOrNull(values.experienceYears),
    location: emptyToNull(values.location),
    // The raw stored path, never the `/api/media/...` display form.
    profileImageUrl: emptyToNull(values.avatarPath),
    // Names, not ids. Re-normalised on the way out because the form is not the
    // only thing that can put values here.
    specialties: normaliseSpecialties(values.specialties),
    certifications: values.certifications
      .filter((item) => item.name.trim().length > 0)
      .map(toCertificationRequest),
  }
}

export function toUpdateRequest(
  values: TrainerProfileFormValues,
): UpdateTrainerProfileRequestDTO {
  return sharedFields(values)
}

export function toCompleteRequest(
  values: TrainerProfileFormValues,
  identity: CompleteProfileIdentityValues,
): CompleteTrainerProfileRequestDTO {
  return {
    firstName: identity.firstName.trim(),
    lastName: identity.lastName.trim(),
    // ISO here, unlike PUT /api/user-detail which demands dd-MM-yyyy.
    birthDate: identity.birthDate || null,
    gender: emptyToNull(identity.gender),
    country: emptyToNull(identity.country),
    ...sharedFields(values),
  }
}

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/** Blank stays blank; anything unparseable is dropped rather than sent as NaN. */
function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = Number(trimmed.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}
