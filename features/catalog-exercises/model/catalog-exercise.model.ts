export interface CatalogExercise {
  id: number
  title: string
  muscleGroup: string | null
  equipment: string | null
}

export interface CatalogExerciseDetail extends CatalogExercise {
  /** Free text from the importer; may contain line breaks. */
  instructions: string | null
  secondaryMuscles: string[]
}

export interface CatalogFilterOptions {
  muscleGroups: string[]
  equipment: string[]
}

export interface CatalogSearchParams {
  search: string
  muscleGroup: string | null
  equipment: string | null
}

/**
 * `CatalogExerciseQueryService` clamps `size` to 1..200 and sorts by title.
 * 24 keeps each infinite-scroll page cheap while filling a wide grid.
 */
export const CATALOG_PAGE_SIZE = 24

export const EMPTY_SEARCH: CatalogSearchParams = {
  search: "",
  muscleGroup: null,
  equipment: null,
}

export function hasActiveFilters(params: CatalogSearchParams): boolean {
  return Boolean(params.search.trim() || params.muscleGroup || params.equipment)
}
