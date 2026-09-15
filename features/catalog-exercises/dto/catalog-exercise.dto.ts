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
