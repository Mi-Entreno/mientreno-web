import { apiFetch, publicApiFetch } from "@/core/http/client"
import { mapPage, type PageResponse, type SpringPage } from "@/core/http/pagination"

import type {
  AcceptInvitationResponseDTO,
  InvitationCountsDTO,
  InvitationStatus,
  PlanInvitationResponseDTO,
} from "../dto/plan-invitation.dto"
import { toAcceptedInvitation, toCreateInvitationRequest, toPlanInvitation } from "../mappers/plan-invitation.mapper"
import {
  INVITATIONS_PAGE_SIZE,
  type AcceptedInvitation,
  type InvitationCounts,
  type PlanInvitation,
} from "../model/plan-invitation.model"

/**
 * Plan invitations, from both ends.
 *
 * The trainer's calls go through `/api/backend/*` (session attached server-side).
 * The three `byToken` calls go through `/api/public/*` instead: a student
 * opening the link from their notification has no session in *this* app, which
 * is trainer-only.
 */
const BASE = "/api/plan-invitations"

export const planInvitationsRepository = {
  /** `POST /api/plan-invitations` — 201. */
  async create(input: { studentId: number; planId: number; message: string }): Promise<PlanInvitation> {
    return toPlanInvitation(
      await apiFetch<PlanInvitationResponseDTO>(BASE, {
        method: "POST",
        body: toCreateInvitationRequest(input),
      }),
    )
  },

  /**
   * `GET /api/plan-invitations/sent?status=&page=&size=`.
   *
   * Sorted newest first upstream. `status` is omitted rather than sent empty
   * for the "all" tab — `apiFetch` drops null and undefined query values, so
   * passing `null` is enough.
   */
  async listSent(
    status: InvitationStatus | null,
    page: number,
    size: number = INVITATIONS_PAGE_SIZE,
  ): Promise<PageResponse<PlanInvitation>> {
    const dto = await apiFetch<SpringPage<PlanInvitationResponseDTO>>(
      `${BASE}/sent`,
      { query: { status, page, size } },
    )

    return mapPage(dto, toPlanInvitation)
  },

  async counts(): Promise<InvitationCounts> {
    const dto = await apiFetch<InvitationCountsDTO>(
      `${BASE}/sent/counts`,
    )

    return {
      pending: dto.pending ?? 0,
      accepted: dto.accepted ?? 0,
      rejected: dto.rejected ?? 0,
    }
  },

  /** `DELETE /api/plan-invitations/{id}` — withdraws a PENDING invitation. 204. */
  async cancel(invitationId: number): Promise<void> {
    await apiFetch<void>(`${BASE}/${invitationId}`, {
      method: "DELETE",
    })
  },

  /** `POST /api/plan-invitations/{id}/resend` — new token, new deadline. */
  async resend(invitationId: number): Promise<PlanInvitation> {
    return toPlanInvitation(
      await apiFetch<PlanInvitationResponseDTO>(
        `${BASE}/${invitationId}/resend`,
        { method: "POST" },
      ),
    )
  },

  // ── The student's side, by opaque token ────────────────────────────────────

  /** `GET /api/plan-invitations/token/{token}` — `permitAll`. */
  async getByToken(token: string): Promise<PlanInvitation> {
    return toPlanInvitation(
      await publicApiFetch<PlanInvitationResponseDTO>(
        `${BASE}/token/${encodeURIComponent(token)}`,
      ),
    )
  },

  async acceptByToken(token: string): Promise<AcceptedInvitation> {
    return toAcceptedInvitation(
      await publicApiFetch<AcceptInvitationResponseDTO>(
        `${BASE}/token/${encodeURIComponent(token)}/accept`,
        { method: "POST" },
      ),
    )
  },

  /** 204. `reason` is optional and free text. */
  async rejectByToken(token: string, reason: string): Promise<void> {
    await publicApiFetch<void>(
      `${BASE}/token/${encodeURIComponent(token)}/reject`,
      { method: "POST", body: { reason: reason.trim() || null } },
    )
  },
}
