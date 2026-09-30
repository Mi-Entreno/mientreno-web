import { toMediaUrl } from "@/core/http/media"

import type { AdminBrandDTO } from "../dto/admin.dto"
import type { AdminBrand } from "../model/admin.model"

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
    categoryLabel: dto.categoryLabel ?? "Otros",
    located: dto.latitude != null && dto.longitude != null,
    status: dto.status,
    createdAt: dto.createdAt,
  }
}
