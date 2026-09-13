import type { ProductApprovalStatus } from "@/features/brand/dto/brand.dto"

import type { ChallengeRequirementMode, RewardMetricType, RewardMetricWindow } from "../dto/admin.dto"

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

// ── Desafíos ───────────────────────────────────────────────────────────────

export interface ChallengeRequirement {
  id: number
  metric: RewardMetricType
  /** Viene del enum del backend para que los dos clientes digan la misma palabra. */
  label: string
  unit: string
  targetValue: number
  window: RewardMetricWindow
  windowDays: number | null
}

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
  /** False en cuanto alguien lo ganó: el premio y los requisitos quedan congelados. */
  editableRequirements: boolean
  approvalStatus: ProductApprovalStatus
  rejectionReason: string | null
  brandId: number | null
  brandName: string | null
  requirements: ChallengeRequirement[]
  updatedAt: string
}

/**
 * Qué hay que mirar antes de publicar un desafío.
 *
 * Ya no es una checklist de moderación —el admin no se modera a sí mismo— pero las
 * preguntas siguen siendo las mismas, y siguen siendo la opuestas a las de un
 * producto. Un producto **gasta** repes: un precio bajo de más vacía la economía. Un
 * desafío las **acuña**: un premio grande de más para el esfuerzo que pide imprime
 * moneda, y lo cobra todo el que entrena. Por eso la lista arranca por la relación
 * entre premio y esfuerzo, no por el premio solo.
 */
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
