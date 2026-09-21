import { apiFetch } from "@/core/http/client"
import { mapPage, pageQuery, type PageParams, type PageResponse, type SpringPage } from "@/core/http/pagination"

import type {
  BrandChallengeDTO,
  ChallengeParticipantDTO,
  ChallengeStatus,
  RedemptionDTO,
  SaveChallengeInput,
} from "../dto/challenge.dto"
import { toBrandChallenge, toParticipant, toRedemption } from "../mappers/challenge.mapper"
import type { BrandChallenge, ChallengeParticipant, Redemption } from "../model/challenge.model"

/**
 * The only caller of `apiFetch` in this slice.
 *
 * No method takes a `brandId`: the backend resolves it from the JWT on every
 * call. Sending it would be a claim about identity the client is in no position
 * to make.
 */
export const challengesRepository = {
  async list(
    status?: ChallengeStatus,
    page?: number,
    signal?: AbortSignal,
  ): Promise<PageResponse<BrandChallenge>> {
    const dto = await apiFetch<SpringPage<BrandChallengeDTO>>("/api/brand/challenges", {
      signal,
      query: { ...pageQuery({ page }), status },
    })
    return mapPage(dto, toBrandChallenge)
  },

  async detail(id: number): Promise<BrandChallenge> {
    return toBrandChallenge(await apiFetch<BrandChallengeDTO>(`/api/brand/challenges/${id}`))
  },

  /** Desafío y recompensa en un solo POST: es el punto del refactor. */
  async create(input: SaveChallengeInput): Promise<BrandChallenge> {
    return toBrandChallenge(
      await apiFetch<BrandChallengeDTO>("/api/brand/challenges", { method: "POST", body: input }),
    )
  },

  async update(id: number, input: SaveChallengeInput): Promise<BrandChallenge> {
    return toBrandChallenge(
      await apiFetch<BrandChallengeDTO>(`/api/brand/challenges/${id}`, { method: "PUT", body: input }),
    )
  },

  async publish(id: number): Promise<BrandChallenge> {
    return toBrandChallenge(
      await apiFetch<BrandChallengeDTO>(`/api/brand/challenges/${id}/publish`, { method: "POST" }),
    )
  },

  async pause(id: number): Promise<BrandChallenge> {
    return toBrandChallenge(
      await apiFetch<BrandChallengeDTO>(`/api/brand/challenges/${id}/pause`, { method: "POST" }),
    )
  },

  async resume(id: number): Promise<BrandChallenge> {
    return toBrandChallenge(
      await apiFetch<BrandChallengeDTO>(`/api/brand/challenges/${id}/resume`, { method: "POST" }),
    )
  },

  async cancel(id: number, reason?: string): Promise<BrandChallenge> {
    return toBrandChallenge(
      await apiFetch<BrandChallengeDTO>(`/api/brand/challenges/${id}/cancel`, {
        method: "POST",
        body: { reason },
      }),
    )
  },

  /** Sólo suma unidades: bajar el stock dejaría alumnos con un premio prometido que no existe. */
  async addStock(id: number, additionalUnits: number): Promise<BrandChallenge> {
    return toBrandChallenge(
      await apiFetch<BrandChallengeDTO>(`/api/brand/challenges/${id}/stock`, {
        method: "PATCH",
        body: { additionalUnits },
      }),
    )
  },

  async uploadImage(id: number, file: File, target: "challenge" | "reward"): Promise<BrandChallenge> {
    const formData = new FormData()
    formData.append("file", file)
    const path = target === "reward" ? "reward-image" : "image"
    return toBrandChallenge(
      await apiFetch<BrandChallengeDTO>(`/api/brand/challenges/${id}/${path}`, { method: "POST", formData }),
    )
  },

  async participants(
    id: number,
    params?: PageParams,
    signal?: AbortSignal,
  ): Promise<PageResponse<ChallengeParticipant>> {
    const page = await apiFetch<SpringPage<ChallengeParticipantDTO>>(
      `/api/brand/challenges/${id}/participants`,
      { query: pageQuery(params), signal },
    )
    return mapPage(page, toParticipant)
  },

  /**
   * La bandeja del mostrador: por defecto lo que falta entregar.
   *
   * `status=DELIVERED` trae lo ya entregado y `ALL`, todo lo canjeado.
   */
  async redemptions(status?: "PENDING" | "DELIVERED" | "ALL", params?: PageParams): Promise<PageResponse<Redemption>> {
    const page = await apiFetch<SpringPage<RedemptionDTO>>("/api/brand/challenges/redemptions", {
      query: { ...pageQuery(params), status },
    })
    return mapPage(page, toRedemption)
  },

  /** Lo que el mostrador hace antes de entregar: buscar el código que muestra el alumno. */
  async validateCode(code: string): Promise<Redemption> {
    return toRedemption(
      await apiFetch<RedemptionDTO>("/api/brand/challenges/redemptions/validate", {
        method: "POST",
        body: { code },
      }),
    )
  },

  async markDelivered(participationId: number): Promise<Redemption> {
    return toRedemption(
      await apiFetch<RedemptionDTO>(
        `/api/brand/challenges/redemptions/${participationId}/deliver`,
        { method: "POST" },
      ),
    )
  },
}
