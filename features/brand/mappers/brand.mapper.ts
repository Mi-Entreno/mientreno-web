import { toMediaUrl } from "@/core/http/media"

import type { BrandChallengeDTO, BrandProductDTO, BrandProfileDTO, RedemptionDTO } from "../dto/brand.dto"
import type { BrandProduct, BrandProfile, Redemption } from "../model/brand.model"
import type { BrandChallenge } from "../model/challenge.model"

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

/**
 * Challenges carry no media of their own — the brand logo comes from the profile
 * — so this is a straight copy. It exists anyway so the components never see a
 * DTO, which is the rule that keeps a backend rename from reaching the UI.
 */
export function toBrandChallenge(dto: BrandChallengeDTO): BrandChallenge {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    prizeReps: dto.prizeReps,
    requirementMode: dto.requirementMode,
    requiredCount: dto.requiredCount,
    active: dto.active,
    validFrom: dto.validFrom,
    validTo: dto.validTo,
    maxGrants: dto.maxGrants,
    grantedCount: dto.grantedCount,
    editableRequirements: dto.editableRequirements,
    approvalStatus: dto.approvalStatus,
    rejectionReason: dto.rejectionReason,
    requirements: dto.requirements.map((requirement) => ({
      id: requirement.id,
      metric: requirement.metric,
      label: requirement.label,
      unit: requirement.unit,
      targetValue: requirement.targetValue,
      window: requirement.window,
      windowDays: requirement.windowDays,
    })),
  }
}
