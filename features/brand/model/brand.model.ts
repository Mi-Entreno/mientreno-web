/**
 * El comercio: quién es y dónde se retira.
 *
 * Acá vivían también el producto del catálogo y el canje con sus transiciones.
 * Los dos se fueron a `features/challenges`, donde la recompensa es parte del
 * desafío que la entrega.
 */

export interface BrandProfile {
  id: number
  displayName: string
  legalName: string | null
  taxId: string | null
  logoUrl: string | null
  description: string | null
  contactEmail: string | null
  contactPhone: string | null
  pickupAddress: string | null
  pickupNotes: string | null
  /** Usuario de Instagram, sin arroba: quien lo muestre arma el enlace. */
  instagram: string | null
  websiteUrl: string | null
  status: "ACTIVE" | "SUSPENDED"
}

// ── Redes ──────────────────────────────────────────────────────────────────
//
// Las dos son opcionales y públicas, a diferencia del email y el teléfono de
// contacto: existen para que el alumno llegue al comercio, no para que le
// escriba la plataforma.
//
// El comercio va a pegar cualquier cosa —"@micomercio", el enlace entero con el
// `?hl=es` que Instagram agrega al compartir, "micomercio.com" sin esquema— así
// que la normalización ocurre una sola vez, acá, antes de guardar. El backend
// rechaza lo que llegue sin normalizar (CHECK `ck_brands_instagram` y el
// `@Pattern` del DTO), así que esto no es cosmética: es lo que hace que el alta
// no falle por cómo se copió un enlace.

/** Usuario de Instagram sin arroba, sin URL, sin barra ni query. */
export function normalizeInstagram(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""

  const withoutUrl = trimmed.replace(/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i, "")
  const handle = withoutUrl.split(/[/?#]/)[0] ?? ""
  return handle.replace(/^@+/, "")
}

export const INSTAGRAM_HANDLE = /^[A-Za-z0-9._]{1,30}$/

/** Enlace público del perfil, para mostrar. Nunca se guarda así. */
export function instagramUrl(handle: string): string {
  return `https://instagram.com/${handle}`
}

/**
 * Sitio web con esquema.
 *
 * Sin `https://` el navegador resuelve "micomercio.com" como ruta relativa y el
 * alumno termina en un 404 dentro de nuestro propio dominio.
 */
export function normalizeWebsite(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

export const WEBSITE_URL = /^https?:\/\/[^\s/?#.]+\.[^\s]+$/

/**
 * ¿Puede publicar desafíos?
 *
 * Sin dirección de retiro, el premio es algo que el alumno no sabe dónde buscar;
 * suspendido, sus desafíos no están en el catálogo. Las dos condiciones las
 * vuelve a verificar el backend: esto sólo decide qué mostrarle al comercio
 * antes de que intente publicar.
 */
export function canPublishChallenges(profile: BrandProfile): boolean {
  return profile.status === "ACTIVE" && !!profile.pickupAddress?.trim()
}

export function profileBlockedReason(profile: BrandProfile): string | null {
  if (profile.status === "SUSPENDED") return "Tu comercio está suspendido"
  if (!profile.pickupAddress?.trim()) return "Cargá la dirección de retiro para poder publicar"
  return null
}
