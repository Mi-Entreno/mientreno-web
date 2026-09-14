import { toMediaUrl } from "@/core/http/media"

import type { BrandProfileDTO } from "../dto/brand.dto"
import type { BrandProfile } from "../model/brand.model"

/**
 * DTO → model.
 *
 * El logo pasa por `toMediaUrl`: con el almacenamiento local del backend esos
 * archivos están detrás de `/api/files/**`, que es autenticado, y un `<img src>`
 * no manda cabecera `Authorization`.
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
