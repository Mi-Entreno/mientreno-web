import {
  MERCHANT_BRAND,
  NEUTRAL_BRAND,
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
  registerDescription: "Proponé desafíos con premio y llegá a alumnos que ya están entrenando.",
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

/**
 * `/login`: la puerta que no pregunta quién sos.
 *
 * El login no necesita saberlo. Los dos públicos mandan el mismo
 * `POST /auth/login`, el backend no los distingue, y `home` —derivado del JWT
 * por el route handler— dice a qué panel pertenece la sesión. Preguntar
 * "¿entrenador o comercio?" antes del formulario sería pedirle al usuario que
 * responda algo que el token ya sabe, y una respuesta equivocada no cambiaría
 * dónde termina: el guard de `proxy.ts` corrige el destino igual.
 *
 * Por eso esto **no** es una `AudienceCopy` y no entra en `AUDIENCES`. No tiene
 * endpoint de registro ni panel propio, y sumarla al registro sería un bug: ahí
 * la elección sí importa, porque `/auth/trainer/register` y `/auth/brand/register`
 * son endpoints distintos y crean cuentas con roles distintos.
 *
 * `/comercio/login` sigue existiendo para los enlaces directos y para la tarjeta
 * de la portada — lo que cambia es el pitch, no lo que el formulario acepta.
 */
export interface LoginCopy {
  brand: AuthBrandCopy
  title: string
  description: string
}

export const NEUTRAL_LOGIN: LoginCopy = {
  brand: NEUTRAL_BRAND,
  title: "Iniciá sesión",
  description: "Entrenadores y comercios entran por acá. Te llevamos a tu panel.",
}

/** La copy del login para una audiencia, o la neutra cuando no hay ninguna. */
export function loginCopyFor(audience: AudienceCopy | null): LoginCopy {
  if (!audience) return NEUTRAL_LOGIN
  return {
    brand: audience.brand,
    title: audience.loginTitle,
    description: audience.loginDescription,
  }
}
