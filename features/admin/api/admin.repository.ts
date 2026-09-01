import { apiFetch } from "@/core/http/client"
import { mapPage, pageQuery, type PageParams, type PageResponse, type SpringPage } from "@/core/http/pagination"
import type { BrandStatus, ProductApprovalStatus } from "@/features/brand/dto/brand.dto"

import type { AdminBrandDTO, AdminProductDTO } from "../dto/admin.dto"
import { toAdminBrand, toAdminProduct } from "../mappers/admin.mapper"
import type { AdminBrand, AdminProduct } from "../model/admin.model"

export const adminRepository = {
  /** The queue. Upstream orders it oldest-first: what has waited longest goes first. */
  async pendingProducts(
    status: ProductApprovalStatus = "PENDING_APPROVAL",
    params?: PageParams,
  ): Promise<PageResponse<AdminProduct>> {
    const page = await apiFetch<SpringPage<AdminProductDTO>>("/api/admin/rewards/products/pending", {
      query: { ...pageQuery(params), status },
    })
    return mapPage(page, toAdminProduct)
  },

  async moderate(
    productId: number,
    status: ProductApprovalStatus,
    reason?: string,
  ): Promise<AdminProduct> {
    return toAdminProduct(
      await apiFetch<AdminProductDTO>(`/api/admin/rewards/products/${productId}/approval`, {
        method: "PATCH",
        body: { status, reason },
      }),
    )
  },

  async brands(params?: PageParams): Promise<PageResponse<AdminBrand>> {
    const page = await apiFetch<SpringPage<AdminBrandDTO>>("/api/admin/rewards/brands", {
      query: pageQuery(params),
    })
    return mapPage(page, toAdminBrand)
  },

  async setBrandStatus(brandId: number, status: BrandStatus): Promise<AdminBrand> {
    return toAdminBrand(
      await apiFetch<AdminBrandDTO>(`/api/admin/rewards/brands/${brandId}/status`, {
        method: "PATCH",
        body: { status },
      }),
    )
  },
}
