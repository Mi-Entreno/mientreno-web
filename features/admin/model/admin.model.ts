import type { ProductApprovalStatus } from "@/features/brand/dto/brand.dto"

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
 * costing one rep drains the economy in an afternoon, and that is the
 * failure moderation exists to prevent. So the checklist leads with cost.
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
 * The number nobody computes until the inventory is gone: a 25-rep prize
 * with 40 units in stock is a thousand reps of liability.
 */
export function maxExposure(product: AdminProduct): number {
  return product.costReps * Math.max(0, product.stock)
}
