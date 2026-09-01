import type { BrandStatus, ProductApprovalStatus } from "@/features/brand/dto/brand.dto"

/**
 * Mirrors of `AdminRewardProductResponseDTO` and `BrandProfileResponseDTO`.
 *
 * The admin view of a product carries what the merchant's does not: who owns it
 * and, therefore, whose catalogue is about to change.
 */
export interface AdminProductDTO {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  costDumbbells: number
  stock: number
  active: boolean
  sortOrder: number
  approvalStatus: ProductApprovalStatus
  rejectionReason: string | null
  /** Null = product loaded by the platform itself. */
  brandId: number | null
  brandName: string | null
  createdAt: string
  updatedAt: string
}

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
