import type { ChallengeRequirementMode, ProductApprovalStatus } from "@/features/brand/dto/brand.dto"
import type { ChallengeRequirement } from "@/features/brand/model/challenge.model"

export interface AdminProduct {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  costReps: number
  stock: number
  active: boolean
  approvalStatus: ProductApprovalStatus
  rejectionReason: string | null
  brandId: number | null
  brandName: string | null
  updatedAt: string
}

export interface AdminBrand {
  id: number
  displayName: string
  legalName: string | null
  taxId: string | null
  logoUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  pickupAddress: string | null
  status: "ACTIVE" | "SUSPENDED"
  createdAt: string
}

/**
 * What a moderator is actually deciding.
 *
 * Approving is not "is this product fine" but "is this price fine": a product
 * costing one rep drains the economy in an afternoon, and that is the failure
 * moderation exists to prevent. So the checklist leads with cost.
 */
export const REVIEW_CHECKLIST = [
  "El costo en repes es razonable para lo que se entrega",
  "La foto muestra el producto real",
  "El nombre y la descripción dicen lo mismo que la foto",
  "El comercio puede entregarlo en la dirección que cargó",
] as const

/** A product with no owner was loaded by the platform, not by a merchant. */
export function isPlatformProduct(product: AdminProduct): boolean {
  return product.brandId === null
}

/**
 * How many reps this product takes out of circulation if it sells out.
 *
 * The number nobody computes until the inventory is gone: a 25-rep prize with
 * 40 units in stock is a thousand reps of liability.
 */
export function maxExposure(product: AdminProduct): number {
  return product.costReps * Math.max(0, product.stock)
}

// ── Reward challenges ──────────────────────────────────────────────────────

export interface AdminChallenge {
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
  brandId: number | null
  brandName: string | null
  requirements: ChallengeRequirement[]
  updatedAt: string
}

/**
 * What a moderator is deciding on a challenge — and it is the opposite question
 * from a product.
 *
 * A product **spends** reps: a price too low drains the economy. A challenge
 * **mints** them: a prize too large for the effort asked prints money, and
 * every student who trains collects it. So the checklist leads with the ratio
 * between prize and effort, not with the prize alone.
 */
export const CHALLENGE_REVIEW_CHECKLIST = [
  "El premio es razonable para el esfuerzo que pide",
  "Los requisitos se pueden cumplir entrenando de verdad, no en un día",
  "El nombre y la descripción dicen qué hay que lograr",
  "Si no tiene cupo, el premio aguanta que la gane todo el mundo",
] as const

/** A challenge with no owner was loaded by the platform, not by a merchant. */
export function isPlatformChallenge(challenge: AdminChallenge): boolean {
  return challenge.brandId === null
}

/**
 * Cuántas repes acuña esta recompensa como máximo.
 *
 * `null` cuando no tiene cupo, y ese es el caso que hay que mirar dos veces: sin
 * tope, el total depende de cuánta gente entrene, o sea de nada que se pueda
 * acotar desde acá.
 */
export function maxMintedReps(challenge: AdminChallenge): number | null {
  if (challenge.maxGrants === null) return null
  return challenge.prizeReps * challenge.maxGrants
}
