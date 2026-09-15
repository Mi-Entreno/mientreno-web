/**
 * Literal mirror of `brand/dto/response/BrandProfileResponseDTO.java`.
 *
 * The product and redemption shapes left with the currency: a reward is not a
 * catalogue item any more, it is what a challenge hands over, and it lives in
 * `features/challenges`.
 */

export type BrandStatus = "ACTIVE" | "SUSPENDED"

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
}
