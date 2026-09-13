import { apiFetch } from "@/core/http/client"
import { mapPage, pageQuery, type PageParams, type PageResponse, type SpringPage } from "@/core/http/pagination"

import type {
  BrandChallengeDTO,
  BrandProductDTO,
  BrandProfileDTO,
  CompleteBrandProfileInput,
  ProductApprovalStatus,
  RedemptionDTO,
  RedemptionStatus,
  SaveChallengeInput,
  SaveProductInput,
} from "../dto/brand.dto"
import { toBrandChallenge, toBrandProduct, toBrandProfile, toRedemption } from "../mappers/brand.mapper"
import type { BrandProduct, BrandProfile, Redemption } from "../model/brand.model"
import type { BrandChallenge } from "../model/challenge.model"

/**
 * The only caller of `apiFetch` in this slice.
 *
 * No method takes a `brandId`: the backend resolves it from the JWT on every
 * call. Sending it would be a claim about identity that the client is in no
 * position to make.
 */
export const brandRepository = {
  // ── Profile ─────────────────────────────────────────────────────────────

  async profile(): Promise<BrandProfile> {
    return toBrandProfile(await apiFetch<BrandProfileDTO>("/api/brands/me"))
  },

  async updateProfile(input: Omit<CompleteBrandProfileInput, "firstName" | "lastName">): Promise<BrandProfile> {
    return toBrandProfile(
      await apiFetch<BrandProfileDTO>("/api/brands/me", { method: "PUT", body: input }),
    )
  },

  async uploadLogo(file: File): Promise<BrandProfile> {
    const formData = new FormData()
    formData.append("file", file)
    return toBrandProfile(
      await apiFetch<BrandProfileDTO>("/api/brands/me/logo", { method: "POST", formData }),
    )
  },

  // ── Products ────────────────────────────────────────────────────────────

  async products(
    status?: ProductApprovalStatus,
    params?: PageParams,
  ): Promise<PageResponse<BrandProduct>> {
    const page = await apiFetch<SpringPage<BrandProductDTO>>("/api/brand/rewards/products", {
      query: { ...pageQuery(params), status },
    })
    return mapPage(page, toBrandProduct)
  },

  async product(id: number): Promise<BrandProduct> {
    return toBrandProduct(await apiFetch<BrandProductDTO>(`/api/brand/rewards/products/${id}`))
  },

  async createProduct(input: SaveProductInput): Promise<BrandProduct> {
    return toBrandProduct(
      await apiFetch<BrandProductDTO>("/api/brand/rewards/products", { method: "POST", body: input }),
    )
  },

  async updateProduct(id: number, input: SaveProductInput): Promise<BrandProduct> {
    return toBrandProduct(
      await apiFetch<BrandProductDTO>(`/api/brand/rewards/products/${id}`, {
        method: "PUT",
        body: input,
      }),
    )
  },

  /** Upstream validates image and stock before queueing. */
  async submitProduct(id: number): Promise<BrandProduct> {
    return toBrandProduct(
      await apiFetch<BrandProductDTO>(`/api/brand/rewards/products/${id}/submit`, { method: "POST" }),
    )
  },

  /** By delta, never an absolute value — see the DTO's comment upstream. */
  async adjustStock(id: number, delta: number, reason?: string): Promise<BrandProduct> {
    return toBrandProduct(
      await apiFetch<BrandProductDTO>(`/api/brand/rewards/products/${id}/stock`, {
        method: "PATCH",
        body: { delta, reason },
      }),
    )
  },

  async setProductActive(id: number, active: boolean): Promise<BrandProduct> {
    return toBrandProduct(
      await apiFetch<BrandProductDTO>(`/api/brand/rewards/products/${id}/status`, {
        method: "PATCH",
        body: { active },
      }),
    )
  },

  async uploadProductImage(id: number, file: File): Promise<BrandProduct> {
    const formData = new FormData()
    formData.append("file", file)
    return toBrandProduct(
      await apiFetch<BrandProductDTO>(`/api/brand/rewards/products/${id}/image`, {
        method: "POST",
        formData,
      }),
    )
  },

  // ── Reward challenges ───────────────────────────────────────────────────
  // Same shape as products, one difference that matters: the prize creates reps
  // out of nothing, so the backend caps it and re-moderates every change to the
  // conditions. `editableRequirements` comes back false once somebody won it.

  async challenges(
    status?: ProductApprovalStatus,
    params?: PageParams,
  ): Promise<PageResponse<BrandChallenge>> {
    const page = await apiFetch<SpringPage<BrandChallengeDTO>>("/api/brand/rewards/challenges", {
      query: { ...pageQuery(params), status },
    })
    return mapPage(page, toBrandChallenge)
  },

  async challenge(id: number): Promise<BrandChallenge> {
    return toBrandChallenge(await apiFetch<BrandChallengeDTO>(`/api/brand/rewards/challenges/${id}`))
  },

  async createChallenge(input: SaveChallengeInput): Promise<BrandChallenge> {
    return toBrandChallenge(
      await apiFetch<BrandChallengeDTO>("/api/brand/rewards/challenges", {
        method: "POST",
        body: input,
      }),
    )
  },

  /** The requirement list replaces the previous one: editing is redefining. */
  async updateChallenge(id: number, input: SaveChallengeInput): Promise<BrandChallenge> {
    return toBrandChallenge(
      await apiFetch<BrandChallengeDTO>(`/api/brand/rewards/challenges/${id}`, {
        method: "PUT",
        body: input,
      }),
    )
  },

  /** Upstream rejects a challenge with no requirements: it would unlock for everyone. */
  async submitChallenge(id: number): Promise<BrandChallenge> {
    return toBrandChallenge(
      await apiFetch<BrandChallengeDTO>(`/api/brand/rewards/challenges/${id}/submit`, {
        method: "POST",
      }),
    )
  },

  async setChallengeActive(id: number, active: boolean): Promise<BrandChallenge> {
    return toBrandChallenge(
      await apiFetch<BrandChallengeDTO>(`/api/brand/rewards/challenges/${id}/status`, {
        method: "PATCH",
        body: { active },
      }),
    )
  },

  // ── Redemptions ─────────────────────────────────────────────────────────

  async redemptions(
    status?: RedemptionStatus,
    params?: PageParams,
  ): Promise<PageResponse<Redemption>> {
    const page = await apiFetch<SpringPage<RedemptionDTO>>("/api/brand/rewards/redemptions", {
      query: { ...pageQuery(params), status },
    })
    return mapPage(page, toRedemption)
  },

  async changeRedemptionStatus(
    id: number,
    status: RedemptionStatus,
    reason?: string,
  ): Promise<Redemption> {
    return toRedemption(
      await apiFetch<RedemptionDTO>(`/api/brand/rewards/redemptions/${id}/status`, {
        method: "PATCH",
        body: { status, reason },
      }),
    )
  },
}
