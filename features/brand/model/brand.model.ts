import type { ProductApprovalStatus, RedemptionStatus } from "../dto/brand.dto"

/**
 * Domain types and pure predicates for the merchant panel.
 *
 * Everything here is a statement about what the backend already decided, never
 * a second opinion: whether a product is published, whether a redemption can
 * still move. Recomputing those client-side would create a second definition
 * that drifts from the server's.
 */

export interface BrandProfile {
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
  status: "ACTIVE" | "SUSPENDED"
}

export interface BrandProduct {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  costDumbbells: number
  stock: number
  active: boolean
  approvalStatus: ProductApprovalStatus
  rejectionReason: string | null
  canSubmit: boolean
  updatedAt: string
}

export interface Redemption {
  id: number
  productName: string
  productImageUrl: string | null
  quantity: number
  totalCostDumbbells: number
  status: RedemptionStatus
  deliveryNotes: string | null
  cancelledReason: string | null
  createdAt: string
}

export const APPROVAL_LABELS: Record<ProductApprovalStatus, string> = {
  DRAFT: "Borrador",
  PENDING_APPROVAL: "En revisión",
  APPROVED: "Publicado",
  REJECTED: "Rechazado",
}

/** Visual weight of each state, mapped to the badge variants of the kit. */
export const APPROVAL_TONES: Record<ProductApprovalStatus, "neutral" | "warning" | "success" | "error"> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  REJECTED: "error",
}

export const REDEMPTION_LABELS: Record<RedemptionStatus, string> = {
  PENDING: "Para preparar",
  READY: "Listo para retirar",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
}

export const REDEMPTION_TONES: Record<RedemptionStatus, "neutral" | "warning" | "success" | "error"> = {
  PENDING: "warning",
  READY: "neutral",
  DELIVERED: "success",
  CANCELLED: "error",
}

/**
 * Whether the product reaches the students' catalogue.
 *
 * Published is not enough: the merchant can pause it, and a product with no
 * stock is not really on offer either. Saying "publicado" over an empty shelf
 * would have the merchant wondering why nobody redeems it.
 */
export function isLive(product: BrandProduct): boolean {
  return product.approvalStatus === "APPROVED" && product.active && product.stock > 0
}

/** Why a published product still is not visible, or null when it is. */
export function notLiveReason(product: BrandProduct): string | null {
  if (product.approvalStatus !== "APPROVED") return null
  if (!product.active) return "Pausado por vos"
  if (product.stock <= 0) return "Sin stock"
  return null
}

/** Transitions the merchant may apply, mirroring `RedemptionStatus` upstream. */
export function nextStatuses(status: RedemptionStatus): RedemptionStatus[] {
  if (status === "PENDING") return ["READY", "CANCELLED"]
  if (status === "READY") return ["DELIVERED", "CANCELLED"]
  return []
}

export function isFinalStatus(status: RedemptionStatus): boolean {
  return status === "DELIVERED" || status === "CANCELLED"
}
