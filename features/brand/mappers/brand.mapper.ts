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
    instagram: dto.instagram,
    websiteUrl: dto.websiteUrl,
    // Un backend anterior a V66 no manda ninguno de los dos.
    category: dto.category ?? "OTHER",
    location:
      dto.latitude != null && dto.longitude != null ? { lat: dto.latitude, lng: dto.longitude } : null,
    status: dto.status,
  }
}
