import {
  MERCHANT_BRAND,
  TRAINER_BRAND,
  type AuthBrandCopy,
} from "../components/auth-brand-panel"

/**
 * The two audiences the panel serves.
 *
 * Both sign in through the same `POST /auth/login` — the backend does not
 * distinguish them, and the response's `home` says where the session belongs.
 * What differs is the pitch beside the form, the registration endpoint and the
 * onboarding path, and that is exactly what lives here.
 *
 * The forms take this as a prop instead of branching internally: a second copy
 * of the login form would be a second place for the OTP and profile-completion
 * flows to drift out of sync.
 */
export type AudienceId = "trainer" | "brand"

export interface AudienceCopy {
  id: AudienceId
  brand: AuthBrandCopy
  loginTitle: string
  loginDescription: string
  registerTitle: string
  registerDescription: string
  loginHref: string
  registerHref: string
  /** BFF route that creates the account. */
  registerEndpoint: string
  /** Where onboarding continues when the profile is missing. */
  profilePath: string
  /** Prefix a `?from=` redirect must match to be honoured. */
  homePrefix: string
}

export const TRAINER_AUDIENCE: AudienceCopy = {
  id: "trainer",
  brand: TRAINER_BRAND,
  loginTitle: "Iniciá sesión en tu panel",
  loginDescription: "Gestioná tus alumnos, planes y programas en un solo lugar.",
  registerTitle: "Creá tu cuenta de entrenador",
  registerDescription: "Empezá a gestionar tus alumnos, planes y programas.",
  loginHref: "/login",
  registerHref: "/register",
  registerEndpoint: "/auth/trainer/register",
  profilePath: "/dashboard/profile",
  homePrefix: "/dashboard",
}

export const BRAND_AUDIENCE: AudienceCopy = {
  id: "brand",
  brand: MERCHANT_BRAND,
  loginTitle: "Iniciá sesión como comercio",
  loginDescription: "Cargá tus productos y seguí las entregas desde tu panel.",
  registerTitle: "Registrá tu comercio",
  registerDescription: "Sumá tus productos al catálogo de premios de Mi Entreno.",
  loginHref: "/comercio/login",
  registerHref: "/comercio/register",
  registerEndpoint: "/auth/brand/register",
  profilePath: "/comercio/perfil",
  homePrefix: "/comercio",
}

export const AUDIENCES: Record<AudienceId, AudienceCopy> = {
  trainer: TRAINER_AUDIENCE,
  brand: BRAND_AUDIENCE,
}
