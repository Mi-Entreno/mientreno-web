/**
 * Literal mirrors of the backend DTOs.
 *
 * Sources: `brand/dto/response/BrandProfileResponseDTO.java`,
 * `rewards/dto/response/BrandRewardProductResponseDTO.java`,
 * `rewards/dto/response/RedemptionResponseDTO.java` and
 * `rewards/dto/response/BrandRewardChallengeResponseDTO.java`.
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

// ── Recompensas por requisitos ─────────────────────────────────────────────
// A challenge is the mirror image of a product: a product *spends* reps, a
// challenge *mints* them. That is why the backend caps the prize and moderates
// every change, and why this form shows the cap instead of letting the merchant
// discover it as a 400.

/** `rewards/enums/RewardMetricType.java`. Adding one upstream needs no migration. */
export type RewardMetricType =
  | "SETS_COMPLETED"
  | "REPS_TOTAL"
  | "VOLUME_KG"
  | "WORKOUTS_COMPLETED"
  | "EXERCISES_COMPLETED"
  | "TRAINING_MINUTES"
  | "CURRENT_STREAK_DAYS"
  | "BEST_STREAK_DAYS"
  | "ACTIVE_WEEKS"

/** `rewards/enums/RewardMetricWindow.java`. */
export type RewardMetricWindow = "LIFETIME" | "LAST_N_DAYS" | "SINCE_CHALLENGE_START"

/** `rewards/enums/ChallengeRequirementMode.java`. */
export type ChallengeRequirementMode = "ALL" | "ANY" | "N_OF_M"

export interface ChallengeRequirementDTO {
  id: number
  metric: RewardMetricType
  /** Resolved upstream so the app and this panel never disagree on wording. */
  label: string
  unit: string
  targetValue: number
  window: RewardMetricWindow
  windowDays: number | null
  sortOrder: number
}

export interface BrandChallengeDTO {
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
  /** False once somebody won it: the prize and requirements are frozen. */
  editableRequirements: boolean
  approvalStatus: ProductApprovalStatus
  rejectionReason: string | null
  requirements: ChallengeRequirementDTO[]
}

export interface SaveChallengeRequirementInput {
  metric: RewardMetricType
  targetValue: number
  window: RewardMetricWindow
  windowDays?: number | null
}

export interface SaveChallengeInput {
  name: string
  description?: string
  prizeReps: number
  requirementMode: ChallengeRequirementMode
  requiredCount?: number | null
  validFrom?: string | null
  validTo?: string | null
  maxGrants?: number | null
  active?: boolean
  requirements: SaveChallengeRequirementInput[]
}
