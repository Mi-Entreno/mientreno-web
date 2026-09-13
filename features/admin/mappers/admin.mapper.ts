import { toMediaUrl } from "@/core/http/media"

import type { AdminBrandDTO, AdminChallengeDTO, AdminProductDTO } from "../dto/admin.dto"
import type { AdminBrand, AdminChallenge, AdminProduct } from "../model/admin.model"

export function toAdminProduct(dto: AdminProductDTO): AdminProduct {
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
    brandId: dto.brandId,
    brandName: dto.brandName,
    updatedAt: dto.updatedAt,
  }
}

export function toAdminBrand(dto: AdminBrandDTO): AdminBrand {
  return {
    id: dto.id,
    displayName: dto.displayName,
    legalName: dto.legalName,
    taxId: dto.taxId,
    logoUrl: toMediaUrl(dto.logoUrl),
    contactEmail: dto.contactEmail,
    contactPhone: dto.contactPhone,
    pickupAddress: dto.pickupAddress,
    status: dto.status,
    createdAt: dto.createdAt,
  }
}

/** Los desafíos no tienen imagen propia, así que esto es una copia directa. */
export function toAdminChallenge(dto: AdminChallengeDTO): AdminChallenge {
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
    brandId: dto.brandId,
    brandName: dto.brandName,
    requirements: dto.requirements.map((requirement) => ({
      id: requirement.id,
      metric: requirement.metric,
      label: requirement.label,
      unit: requirement.unit,
      targetValue: requirement.targetValue,
      window: requirement.window,
      windowDays: requirement.windowDays,
    })),
    updatedAt: dto.updatedAt,
  }
}
