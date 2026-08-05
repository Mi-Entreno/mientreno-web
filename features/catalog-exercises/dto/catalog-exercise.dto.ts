/** Literal mirrors of `exercisecatalog/dto/response`. */

/** `CatalogExerciseSummaryDTO` — the row shape of the paginated search. */
export interface CatalogExerciseSummaryDTO {
  id: number
  title: string
  muscleGroup: string | null
  equipment: string | null
}

/** `CatalogExerciseDetailDTO` — adds instructions and secondary muscles. */
export interface CatalogExerciseDetailDTO {
  id: number
  title: string
  instructions: string | null
  muscleGroup: string | null
  secondaryMuscles: string[]
  equipment: string | null
}

/**
 * `CatalogFilterOptionsDTO` — the distinct values present in the catalogue.
 *
 * These matter more than they look: the repository query filters with
 * `ce.muscleGroup = :muscleGroup`, i.e. **exact equality**. Free text typed by
 * a user will never match, so the filter UI must offer only these values.
 */
export interface CatalogFilterOptionsDTO {
  muscleGroups: string[]
  equipment: string[]
}
