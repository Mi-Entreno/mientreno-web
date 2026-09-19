import { apiFetch } from "@/core/http/client"
import { mapPage, pageQuery, type PageResponse, type SpringPage } from "@/core/http/pagination"
import type { BrandStatus } from "@/features/brand/dto/brand.dto"

import type { AdminBrandDTO } from "../dto/admin.dto"
import { toAdminBrand } from "../mappers/admin.mapper"
import type { AdminBrand } from "../model/admin.model"

/**
 * Lo único que la plataforma sigue decidiendo sobre los comercios.
 *
 * Este repositorio tenía tres mitades: moderar productos, administrar desafíos y
 * el padrón de comercios. Las dos primeras desaparecieron con el modelo nuevo —
 * el desafío y su premio son del comercio, que los paga y los entrega, así que
 * no hay contenido que aprobar de a uno. Queda habilitar o suspender un comercio
 * entero, que saca de circulación todos sus desafíos de una vez.
 */
export const adminRepository = {
  async brands(page?: number, signal?: AbortSignal): Promise<PageResponse<AdminBrand>> {
    const dto = await apiFetch<SpringPage<AdminBrandDTO>>("/api/admin/brands", {
      signal,
      query: pageQuery({ page }),
    })
    return mapPage(dto, toAdminBrand)
  },

  async setBrandStatus(brandId: number, status: BrandStatus): Promise<AdminBrand> {
    return toAdminBrand(
      await apiFetch<AdminBrandDTO>(`/api/admin/brands/${brandId}/status`, {
        method: "PATCH",
        body: { status },
      }),
    )
  },
}
