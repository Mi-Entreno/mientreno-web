import { toMediaUrl } from "@/core/http/media"

import type { BrandProductDTO, BrandProfileDTO, RedemptionDTO } from "../dto/brand.dto"
import type { BrandProduct, BrandProfile, Redemption } from "../model/brand.model"

/**
 * DTO → model.
 *
 * Every URL-bearing field goes through `toMediaUrl`: with the backend's default
 * local storage those files sit behind `/api/files/**`, which is authenticated,
 * and an `<img src>` sends no `Authorization` header.
 */

export function toBrandProfile(dto: BrandProfileDTO): BrandProfile {
  return {
    id: dto.id,
    displayName: dto.displayName,
    legalName: dto.legalName,
    taxId: dto.taxId,
    logoUrl: toMediaUrl(dto.logoUrl),
    description: dto.description,
    contactEmail: dto.contactEmail,
    contactPhone: dto.contactPhone,
    pickupAddress: dto.pickupAddress,
    pickupNotes: dto.pickupNotes,
    status: dto.status,
  }
}

export function toBrandProduct(dto: BrandProductDTO): BrandProduct {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    imageUrl: toMediaUrl(dto.imageUrl),
    costReps: dto.costReps,
    stock: dto.stock,
    active: dto.active,
    approvalStatus: dto.approvalStatus,
    rejectionReason: dto.rejectionReason,
    canSubmit: dto.canSubmit,
    updatedAt: dto.updatedAt,
  }
}

export function toRedemption(dto: RedemptionDTO): Redemption {
  return {
    id: dto.id,
    productName: dto.productName,
    productImageUrl: toMediaUrl(dto.productImageUrl),
    quantity: dto.quantity,
    totalCostReps: dto.totalCostReps,
    status: dto.status,
    deliveryNotes: dto.deliveryNotes,
    cancelledReason: dto.cancelledReason,
    createdAt: dto.createdAt,
  }
}
