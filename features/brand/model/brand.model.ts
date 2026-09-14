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
  status: "ACTIVE" | "SUSPENDED"
}

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
