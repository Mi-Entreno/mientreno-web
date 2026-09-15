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

/**
 * Sólo texto libre.
 *
 * El catálogo se filtraba además por grupo muscular y equipamiento, con las
 * opciones que devuelve `/api/catalog-exercises/filters`. Se sacaron del
 * selector: al armar una rutina el entrenador ya sabe qué ejercicio busca y lo
 * escribe, y las dos filas de chips empujaban la lista fuera de la pantalla
 * justo cuando hay que elegir. El endpoint sigue existiendo upstream si alguna
 * vez hace falta una pantalla de exploración del catálogo.
 */
export interface CatalogSearchParams {
  search: string
}

/**
 * `CatalogExerciseQueryService` clamps `size` to 1..200 and sorts by title.
 * 24 keeps each infinite-scroll page cheap while filling a wide grid.
 */
export const CATALOG_PAGE_SIZE = 24

export const EMPTY_SEARCH: CatalogSearchParams = { search: "" }
