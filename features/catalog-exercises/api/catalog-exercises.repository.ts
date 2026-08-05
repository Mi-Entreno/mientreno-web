import { apiFetch } from "@/core/http/client"
import { mapPage, type PageResponse } from "@/core/http/pagination"
import type { SpringPage } from "@/core/http/pagination"

import type {
  CatalogExerciseDetailDTO,
  CatalogExerciseSummaryDTO,
  CatalogFilterOptionsDTO,
} from "../dto/catalog-exercise.dto"
import {
  toCatalogExercise,
  toCatalogExerciseDetail,
  toCatalogFilterOptions,
} from "../mappers/catalog-exercise.mapper"
import {
  CATALOG_PAGE_SIZE,
  type CatalogExercise,
  type CatalogExerciseDetail,
  type CatalogFilterOptions,
  type CatalogSearchParams,
} from "../model/catalog-exercise.model"

export const catalogExercisesRepository = {
  /**
   * `GET /api/catalog-exercises` — the first paginated endpoint wired up, so
   * the first real use of `PageResponse<T>`.
   *
   * Blank filters are omitted entirely rather than sent empty: the service
   * normalises blank to null, but leaving them out keeps the query key and the
   * request URL honest.
   */
  async search(
    params: CatalogSearchParams,
    page: number,
    size: number = CATALOG_PAGE_SIZE,
  ): Promise<PageResponse<CatalogExercise>> {
    const dto = await apiFetch<SpringPage<CatalogExerciseSummaryDTO>>("/api/catalog-exercises", {
      query: {
        search: params.search.trim() || undefined,
        muscleGroup: params.muscleGroup ?? undefined,
        equipment: params.equipment ?? undefined,
        page,
        size,
      },
    })

    return mapPage(dto, toCatalogExercise)
  },

  async getFilters(): Promise<CatalogFilterOptions> {
    return toCatalogFilterOptions(
      await apiFetch<CatalogFilterOptionsDTO>("/api/catalog-exercises/filters"),
    )
  },

  async getById(id: number): Promise<CatalogExerciseDetail> {
    return toCatalogExerciseDetail(
      await apiFetch<CatalogExerciseDetailDTO>(`/api/catalog-exercises/${id}`),
    )
  },
}
