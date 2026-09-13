import { apiFetch } from "@/core/http/client"
import { mapPage, pageQuery, type PageParams, type PageResponse, type SpringPage } from "@/core/http/pagination"
import type { BrandStatus, ProductApprovalStatus } from "@/features/brand/dto/brand.dto"

import type {
  AdminBrandDTO,
  AdminChallengeDTO,
  AdminProductDTO,
  SaveChallengeInput,
} from "../dto/admin.dto"
import { toAdminBrand, toAdminChallenge, toAdminProduct } from "../mappers/admin.mapper"
import type { AdminBrand, AdminChallenge, AdminProduct } from "../model/admin.model"

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

  // ── Desafíos ──────────────────────────────────────────────────────────────
  // CRUD y no cola de moderación: desde la V52 los desafíos los carga el admin, así
  // que no hay a quién pedirle la revisión.

  /** Del más nuevo al más viejo. Sin `status`, todos. */
  async challenges(
    status?: ProductApprovalStatus,
    params?: PageParams,
  ): Promise<PageResponse<AdminChallenge>> {
    const page = await apiFetch<SpringPage<AdminChallengeDTO>>("/api/admin/rewards/challenges", {
      query: { ...pageQuery(params), ...(status ? { status } : {}) },
    })
    return mapPage(page, toAdminChallenge)
  },

  async challenge(challengeId: number): Promise<AdminChallenge> {
    return toAdminChallenge(
      await apiFetch<AdminChallengeDTO>(`/api/admin/rewards/challenges/${challengeId}`),
    )
  },

  async createChallenge(input: SaveChallengeInput): Promise<AdminChallenge> {
    return toAdminChallenge(
      await apiFetch<AdminChallengeDTO>("/api/admin/rewards/challenges", {
        method: "POST",
        body: input,
      }),
    )
  },

  async updateChallenge(challengeId: number, input: SaveChallengeInput): Promise<AdminChallenge> {
    return toAdminChallenge(
      await apiFetch<AdminChallengeDTO>(`/api/admin/rewards/challenges/${challengeId}`, {
        method: "PUT",
        body: input,
      }),
    )
  },

  /** Upstream rechaza publicar sin requisitos: se desbloquearía para todos al instante. */
  async publishChallenge(challengeId: number): Promise<AdminChallenge> {
    return toAdminChallenge(
      await apiFetch<AdminChallengeDTO>(`/api/admin/rewards/challenges/${challengeId}/publish`, {
        method: "POST",
      }),
    )
  },

  /** Upstream responde 409 si alguien ya lo ganó: entonces se pausa, no se despublica. */
  async unpublishChallenge(challengeId: number): Promise<AdminChallenge> {
    return toAdminChallenge(
      await apiFetch<AdminChallengeDTO>(`/api/admin/rewards/challenges/${challengeId}/unpublish`, {
        method: "POST",
      }),
    )
  },

  async setChallengeActive(challengeId: number, active: boolean): Promise<AdminChallenge> {
    return toAdminChallenge(
      await apiFetch<AdminChallengeDTO>(`/api/admin/rewards/challenges/${challengeId}/status`, {
        method: "PATCH",
        body: { active },
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
