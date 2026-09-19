import { apiFetch } from "@/core/http/client"
import { mapPage, type PageResponse } from "@/core/http/pagination"
import type { SpringPage } from "@/core/http/pagination"

import type {
  CatalogExerciseDetailDTO,
  CatalogExerciseSummaryDTO,
} from "../dto/catalog-exercise.dto"
import { toCatalogExercise, toCatalogExerciseDetail } from "../mappers/catalog-exercise.mapper"
import {
  CATALOG_PAGE_SIZE,
  type CatalogExercise,
  type CatalogExerciseDetail,
  type CatalogSearchParams,
} from "../model/catalog-exercise.model"

export const catalogExercisesRepository = {
  /**
   * `GET /api/catalog-exercises` — the first paginated endpoint wired up, so
   * the first real use of `PageResponse<T>`.
   *
   * A blank search is omitted entirely rather than sent empty: the service
   * normalises blank to null, but leaving it out keeps the query key and the
   * request URL honest.
   */
  async search(
    params: CatalogSearchParams,
    page: number,
    size: number = CATALOG_PAGE_SIZE,
    signal?: AbortSignal,
  ): Promise<PageResponse<CatalogExercise>> {
    const dto = await apiFetch<SpringPage<CatalogExerciseSummaryDTO>>("/api/catalog-exercises", {
      signal,
      query: {
        search: params.search.trim() || undefined,
        page,
        size,
      },
    })

    return mapPage(dto, toCatalogExercise)
  },

  async getById(id: number): Promise<CatalogExerciseDetail> {
    return toCatalogExerciseDetail(
      await apiFetch<CatalogExerciseDetailDTO>(`/api/catalog-exercises/${id}`),
    )
  },
}
