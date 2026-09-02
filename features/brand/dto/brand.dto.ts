/**
 * Literal mirrors of the backend DTOs.
 *
 * Sources: `brand/dto/response/BrandProfileResponseDTO.java`,
 * `rewards/dto/response/BrandRewardProductResponseDTO.java` and
 * `rewards/dto/response/RedemptionResponseDTO.java`.
 */

export type BrandStatus = "ACTIVE" | "SUSPENDED"

export type ProductApprovalStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED"

export type RedemptionStatus = "PENDING" | "READY" | "DELIVERED" | "CANCELLED"

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
  status: BrandStatus
  createdAt: string
}

export interface BrandProductDTO {
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
  canSubmit: boolean
  createdAt: string
  updatedAt: string
}

export interface RedemptionStatusChangeDTO {
  from: RedemptionStatus | null
  to: RedemptionStatus
  reason: string | null
  at: string
}

export interface RedemptionDTO {
  id: number
  productId: number | null
  productName: string
  productImageUrl: string | null
  quantity: number
  totalCostReps: number
  status: RedemptionStatus
  deliveryNotes: string | null
  cancelledReason: string | null
  canCancel: boolean
  createdAt: string
  history: RedemptionStatusChangeDTO[]
}

export interface SaveProductInput {
  name: string
  description?: string
  costReps: number
  stock: number
  active?: boolean
  sortOrder?: number
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
}
