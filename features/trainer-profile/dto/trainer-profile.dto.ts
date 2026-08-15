/** Literal mirrors of the `trainer/dto` records. Do not edit without the Java. */

/** `CertificationDTO` — dates are ISO (no `@JsonFormat`). */
export interface CertificationDTO {
  id: number
  name: string
  issuedBy: string | null
  issuedAt: string | null
  expiresAt: string | null
  certificateUrl: string | null
}

/** `CertificationRequestDTO` — `name` is `@NotBlank`, dates ISO. */
export interface CertificationRequestDTO {
  name: string
  issuedBy: string | null
  issuedAt: string | null
  expiresAt: string | null
  certificateUrl: string | null
}

/**
 * `GET /api/trainer/profile` — `TrainerProfileResponseDTO`.
 *
 * Specialties come back as **names**, and — since the field became free text —
 * both write endpoints accept names too (`List<String> specialties`). The old
 * `specialtyIds` still exists upstream for clients that pick from the closed
 * catalogue, but this app no longer sends it: an id can only ever name
 * something that already existed, which is the constraint we removed.
 */
export interface TrainerProfileResponseDTO {
  id: number
  fullName: string | null
  profileImageUrl: string | null
  description: string | null
  /** `BigDecimal` — Jackson serialises it as a JSON number. */
  basePrice: number | null
  experienceYears: number | null
  location: string | null
  avgRating: number | null
  totalReviews: number | null
  currentStudents: number | null
  specialties: string[]
  certifications: CertificationDTO[]
}

/**
 * `POST /api/trainer/profile/complete` — `CompleteTrainerProfileRequestDTO`.
 *
 * `firstName` / `lastName` are `@NotBlank` and appear only here, not in the
 * update request: completing the profile also creates the user detail.
 * `birthDate` is ISO — unlike `PUT /api/user-detail`, which wants `dd-MM-yyyy`.
 */
export interface CompleteTrainerProfileRequestDTO {
  firstName: string
  lastName: string
  birthDate: string | null
  gender: string | null
  country: string | null
  description: string | null
  basePrice: number | null
  experienceYears: number | null
  location: string | null
  profileImageUrl: string | null
  /** Free text; the server resolves or creates each one. */
  specialties: string[]
  certifications: CertificationRequestDTO[]
}

/** `PUT /api/trainer/profile` — `UpdateTrainerProfileRequestDTO`. */
export interface UpdateTrainerProfileRequestDTO {
  description: string | null
  basePrice: number | null
  experienceYears: number | null
  location: string | null
  profileImageUrl: string | null
  /** Free text; the server resolves or creates each one. */
  specialties: string[]
  certifications: CertificationRequestDTO[]
}
