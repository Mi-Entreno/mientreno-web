"use client"

import { useState } from "react"

import { useDebouncedValue } from "@/core/hooks/use-debounced-value"
import { useFoodSearch } from "../hooks/use-foods"
import { EMPTY_FOOD_SEARCH, type FoodSearchParams } from "../model/food.model"
import { FoodDetailSheet } from "./food-detail-sheet"
import { FoodFilters } from "./food-filters"
import { FoodList } from "./food-list"

/**
 * Standalone food catalogue browser, mirroring the exercise one: a trainer
 * needs to look up nutritional values without opening a plan first.
 */
export function FoodsScreen() {
  const [params, setParams] = useState<FoodSearchParams>(EMPTY_FOOD_SEARCH)
  const [detailId, setDetailId] = useState<number | null>(null)

  const debouncedSearch = useDebouncedValue(params.search, 300)
  const search = useFoodSearch({ ...params, search: debouncedSearch })

  return (
    <div className="flex flex-col gap-6">
      <p className="text-body text-muted-foreground text-pretty">
        Consulta el catálogo de alimentos. Todos los valores nutricionales están expresados por
        100 g.
      </p>

      <FoodFilters value={params} categories={search.categories} onChange={setParams} />

      <FoodList
        foods={search.foods}
        totalItems={search.totalItems}
        isLoading={search.isLoading}
        isError={search.isError}
        hasNextPage={search.hasNextPage}
        isFetchingNextPage={search.isFetchingNextPage}
        onLoadMore={() => search.fetchNextPage()}
        onSelect={(food) => setDetailId(food.id)}
      />

      <FoodDetailSheet
        foodId={detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
    </div>
  )
}
