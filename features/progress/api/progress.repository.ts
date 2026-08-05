import { apiFetch } from "@/core/http/client"

import type { ProgressResponseDTO } from "../dto/progress.dto"
import { toProgressEntry } from "../mappers/progress.mapper"
import type { ProgressEntry } from "../model/progress.model"

export const progressRepository = {
  /**
   * `GET /api/progress/subscription/{id}`.
   *
   * Comes back `ORDER BY recordedAt DESC` — newest first, which suits the list
   * but not the chart; the series builder re-sorts ascending.
   *
   * Access is checked against the subscription's trainer or student, so a
   * trainer reads their own students' history and nobody else's.
   */
  async listBySubscription(subscriptionId: number): Promise<ProgressEntry[]> {
    const dtos = await apiFetch<ProgressResponseDTO[]>(
      `/api/progress/subscription/${subscriptionId}`,
    )
    return dtos.map(toProgressEntry)
  },

  /**
   * `GET /api/progress/{progressId}`.
   *
   * The list already returns complete entries, so this exists to refresh one
   * record on demand rather than to reveal anything new.
   */
  async getById(progressId: number): Promise<ProgressEntry> {
    return toProgressEntry(await apiFetch<ProgressResponseDTO>(`/api/progress/${progressId}`))
  },
}
