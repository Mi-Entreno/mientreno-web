import { toMediaUrl } from "@/core/http/media"

import type { AdminBrandDTO, AdminProductDTO } from "../dto/admin.dto"
import type { AdminBrand, AdminProduct } from "../model/admin.model"

export function toAdminProduct(dto: AdminProductDTO): AdminProduct {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    imageUrl: toMediaUrl(dto.imageUrl),
    costDumbbells: dto.costDumbbells,
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
