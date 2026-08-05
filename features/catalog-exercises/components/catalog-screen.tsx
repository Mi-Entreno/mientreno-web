"use client"

import { useState } from "react"

import { useDebouncedValue } from "@/core/hooks/use-debounced-value"
import { useCatalogSearch } from "../hooks/use-catalog-exercises"
import { EMPTY_SEARCH, type CatalogSearchParams } from "../model/catalog-exercise.model"
import { ExerciseDetailSheet } from "./exercise-detail-sheet"
import { ExerciseFilters } from "./exercise-filters"
import { ExerciseList } from "./exercise-list"

/**
 * Standalone catalogue browser.
 *
 * The picker inside the plan editor is the catalogue's main consumer, but a
 * trainer also needs to look things up on their own — checking what an exercise
 * targets, or what the catalogue even contains — without opening a plan first.
 */
export function CatalogScreen() {
  const [params, setParams] = useState<CatalogSearchParams>(EMPTY_SEARCH)
  const [detailId, setDetailId] = useState<number | null>(null)

  const debouncedSearch = useDebouncedValue(params.search, 300)
  const search = useCatalogSearch({ ...params, search: debouncedSearch })

  return (
    <div className="flex flex-col gap-6">
      <p className="text-body text-muted-foreground text-pretty">
        Consulta el catálogo maestro de ejercicios. Al asignarlos a un plan, el alumno hereda las
        instrucciones y los músculos implicados.
      </p>

      <ExerciseFilters value={params} onChange={setParams} />

      <ExerciseList
        exercises={search.exercises}
        totalItems={search.totalItems}
        isLoading={search.isLoading}
        isError={search.isError}
        hasNextPage={search.hasNextPage}
        isFetchingNextPage={search.isFetchingNextPage}
        onLoadMore={() => search.fetchNextPage()}
        onSelect={(exercise) => setDetailId(exercise.id)}
      />

      <ExerciseDetailSheet
        exerciseId={detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
      />
    </div>
  )
}
