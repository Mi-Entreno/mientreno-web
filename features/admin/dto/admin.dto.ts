import type {
  BrandStatus,
  ChallengeRequirementDTO,
  ChallengeRequirementMode,
  ProductApprovalStatus,
} from "@/features/brand/dto/brand.dto"

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
  costReps: number
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

/**
 * Mirror of `AdminRewardChallengeResponseDTO`.
 *
 * The moderator's view adds the owner to what the merchant already sees. There
 * are no student identities here by design: the merchant has no relationship
 * with the student until a redemption exists, and neither does this queue.
 */
export interface AdminChallengeDTO {
  id: number
  name: string
  description: string | null
  prizeReps: number
  requirementMode: ChallengeRequirementMode
  requiredCount: number | null
  active: boolean
  validFrom: string | null
  validTo: string | null
  maxGrants: number | null
  grantedCount: number
  approvalStatus: ProductApprovalStatus
  rejectionReason: string | null
  /** Null = challenge loaded by the platform itself. */
  brandId: number | null
  brandName: string | null
  requirements: ChallengeRequirementDTO[]
  createdAt: string
  updatedAt: string
}
