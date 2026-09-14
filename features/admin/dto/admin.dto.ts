import type { BrandStatus } from "@/features/brand/dto/brand.dto"

/**
 * Mirror of `BrandProfileResponseDTO`, as the platform sees it.
 *
 * The product and challenge shapes used to live here too. Both are gone: a
 * reward is now part of the challenge that grants it, and challenges belong to
 * the merchant who pays for them.
 */
export interface AdminBrandDTO {
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
  status: BrandStatus
  createdAt: string
}
