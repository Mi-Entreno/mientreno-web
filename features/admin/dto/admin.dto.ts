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

// ── Desafíos ───────────────────────────────────────────────────────────────
// Un desafío es la imagen espejada de un producto: el producto *gasta* repes, el
// desafío las *acuña*. Por eso lo carga sólo el admin y por eso el backend le pone
// techo al premio. Estos tipos vivían en `features/brand` cuando los desafíos eran
// del comercio; se mudaron acá con el resto de la función.

/** `rewards/enums/RewardMetricType.java`. Agregar una arriba no necesita migración. */
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
  /** Resuelto arriba, para que la app y este panel nunca digan palabras distintas. */
  label: string
  unit: string
  targetValue: number
  window: RewardMetricWindow
  windowDays: number | null
  sortOrder: number
}

/**
 * Espejo de `AdminRewardChallengeResponseDTO`.
 *
 * No hay identidades de alumnos, por diseño: para administrar la economía alcanza
 * saber cuántos lo ganaron, y el nombre recién aparece cuando hay un canje que
 * alguien tiene que entregar.
 *
 * De los cuatro valores de `approvalStatus` un desafío usa sólo dos —`DRAFT` y
 * `APPROVED`—: el tipo se comparte con los productos, que sí tienen los cuatro.
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
  /** False en cuanto alguien lo ganó: el premio y los requisitos quedan congelados. */
  editableRequirements: boolean
  approvalStatus: ProductApprovalStatus
  rejectionReason: string | null
  /** Null en todos los que carga este panel. Ver el comentario de la V52. */
  brandId: number | null
  brandName: string | null
  requirements: ChallengeRequirementDTO[]
  createdAt: string
  updatedAt: string
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
