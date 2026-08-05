import type {
  CatalogExerciseDetailDTO,
  CatalogExerciseSummaryDTO,
  CatalogFilterOptionsDTO,
} from "../dto/catalog-exercise.dto"
import type {
  CatalogExercise,
  CatalogExerciseDetail,
  CatalogFilterOptions,
} from "../model/catalog-exercise.model"

function blankToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function toCatalogExercise(dto: CatalogExerciseSummaryDTO): CatalogExercise {
  return {
    id: dto.id,
    title: dto.title,
    muscleGroup: blankToNull(dto.muscleGroup),
    equipment: blankToNull(dto.equipment),
  }
}

export function toCatalogExerciseDetail(dto: CatalogExerciseDetailDTO): CatalogExerciseDetail {
  return {
    id: dto.id,
    title: dto.title,
    instructions: blankToNull(dto.instructions),
    muscleGroup: blankToNull(dto.muscleGroup),
    equipment: blankToNull(dto.equipment),
    // The importer can leave duplicates and blanks behind.
    secondaryMuscles: [
      ...new Set((dto.secondaryMuscles ?? []).map((item) => item.trim()).filter(Boolean)),
    ],
  }
}

/**
 * The filter values are compared with `=` upstream, so they are passed through
 * verbatim — trimming or re-casing them here would silently stop matching.
 * Only blanks and duplicates are dropped.
 */
export function toCatalogFilterOptions(dto: CatalogFilterOptionsDTO): CatalogFilterOptions {
  return {
    muscleGroups: [...new Set((dto.muscleGroups ?? []).filter(Boolean))],
    equipment: [...new Set((dto.equipment ?? []).filter(Boolean))],
  }
}
