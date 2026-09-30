/**
 * Literal mirror of `brand/dto/response/BrandProfileResponseDTO.java`.
 *
 * The product and redemption shapes left with the currency: a reward is not a
 * catalogue item any more, it is what a challenge hands over, and it lives in
 * `features/challenges`.
 */

export type BrandStatus = "ACTIVE" | "SUSPENDED"

/** Mirror of `brand/enums/BrandCategory.java`. The CHECK in V66 holds the same list. */
export type BrandCategory =
  | "FOOD"
  | "CAFE"
  | "HEALTHY"
  | "SPORTSWEAR"
  | "SUPPLEMENTS"
  | "GYM"
  | "WELLNESS"
  | "OTHER"

export interface BrandProfileDTO {
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
  /** Usuario canónico, sin arroba ni URL: el backend lo garantiza con un CHECK. */
  instagram: string | null
  websiteUrl: string | null
  category: BrandCategory
  /** Texto para mostrar, resuelto por el backend. */
  categoryLabel: string
  /** Punto de retiro confirmado en el mapa. Las dos o ninguna (CHECK `ck_brands_location`). */
  latitude: number | null
  longitude: number | null
  status: BrandStatus
  createdAt: string
}

export interface CompleteBrandProfileInput {
  firstName: string
  lastName: string
  displayName: string
  legalName?: string
  taxId?: string
  description?: string
  contactEmail?: string
  contactPhone?: string
  pickupAddress: string
  pickupNotes?: string
  instagram?: string
  websiteUrl?: string
  /** Sin mandar, el backend conserva la que había (OTHER en el alta). */
  category?: BrandCategory
  /**
   * De a par. Sin mandarlas, el backend conserva las que había salvo que haya
   * cambiado la dirección: ahí las borra, porque el pin quedó apuntando a otro lado.
   */
  latitude?: number
  longitude?: number
}
