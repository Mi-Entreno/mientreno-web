import type { OnboardingMode } from "../dto/user.dto"

export interface UserProfile {
  userId: number
  email: string
  phone: string
  firstName: string
  lastName: string
  /** Always ISO `yyyy-MM-dd`, which is also what `<input type="date">` wants. */
  birthDate: string | null
  gender: string
  country: string
  /**
   * Display URL, routed through the authenticated media proxy.
   * Never send this back to the backend — use `avatarPath`.
   */
  avatarUrl: string | null
  /**
   * The value exactly as the backend stores it. Writes must echo this back,
   * or the proxied `/api/media/...` form would be persisted and the original
   * location lost.
   */
  avatarPath: string | null
}

export interface UserPreferences {
  onboardingMode: OnboardingMode
}

export type { OnboardingMode }

export function fullNameOf(profile: Pick<UserProfile, "firstName" | "lastName">): string {
  return [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim()
}
