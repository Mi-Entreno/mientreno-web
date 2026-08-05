import { apiFetch } from "@/core/http/client"
import { mapPage, type PageResponse, type SpringPage } from "@/core/http/pagination"

import type { FoodResponseDTO } from "../dto/food.dto"
import { toFood } from "../mappers/food.mapper"
import { FOODS_PAGE_SIZE, type Food, type FoodSearchParams } from "../model/food.model"

export const foodsRepository = {
  /**
   * `GET /api/foods`.
   *
   * Paging goes through Spring's `Pageable` resolver here rather than explicit
   * `@RequestParam`s like the exercise catalogue, but the wire params are the
   * same `page` / `size`. `sort` is left off: `@PageableDefault(sort = "name")`
   * already orders by name.
   */
  async search(
    params: FoodSearchParams,
    page: number,
    size: number = FOODS_PAGE_SIZE,
  ): Promise<PageResponse<Food>> {
    const dto = await apiFetch<SpringPage<FoodResponseDTO>>("/api/foods", {
      query: {
        // Matched against name OR brand, partial and case-insensitive.
        q: params.search.trim() || undefined,
        // Exact equality upstream, so only values seen in results are useful.
        category: params.category ?? undefined,
        page,
        size,
      },
    })

    return mapPage(dto, toFood)
  },

  async getById(id: number): Promise<Food> {
    return toFood(await apiFetch<FoodResponseDTO>(`/api/foods/${id}`))
  },
}
