/** Literal mirrors of the `user/dto` records. Do not edit without the Java. */

/** `GET /api/user-detail` — `UserProfileResponseDTO`. birthDate is ISO here. */
export interface UserProfileResponseDTO {
  userId: number
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  /** ISO `yyyy-MM-dd` on read (no `@JsonFormat` on the response record). */
  birthDate: string | null
  gender: string | null
  pathProfilePicture: string | null
  country: string | null
}

/**
 * `PUT /api/user-detail` — `UserProfileUpdateRequestDTO`.
 * `firstName` and `lastName` are `@NotBlank`.
 * `birthDate` carries `@JsonFormat(pattern = "dd-MM-yyyy")` — *not* ISO.
 */
export interface UserProfileUpdateRequestDTO {
  firstName: string
  lastName: string
  birthDate: string | null
  gender: string | null
  pathProfilePicture: string | null
  country: string | null
}

/**
 * `POST /api/user-detail` — `UserDetailRequestDTO`, the initial-setup variant.
 * Every field is `@NotBlank`, and it carries `city` and `bio`, which the
 * response record does not expose. `birthDate` is `dd-MM-yyyy` here too.
 */
export interface UserDetailRequestDTO {
  firstName: string
  lastName: string
  email: string
  phone: string
  birthDate: string
  gender: string
  pathProfilePicture: string
  city: string
  country: string
  bio: string
}

/** `POST /api/user-detail` response — `UserDetailResponseDTO(String mensaje)`. */
export interface UserDetailResponseDTO {
  mensaje: string
}

/** The only preference the backend models. */
export type OnboardingMode = "OWN_PLAN" | "TRAINER_SEARCH"

export interface UserPreferencesDTO {
  onboardingMode: OnboardingMode
}
