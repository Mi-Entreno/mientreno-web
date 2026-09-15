import type {
  CatalogExerciseDetailDTO,
  CatalogExerciseSummaryDTO,
} from "../dto/catalog-exercise.dto"
import type { CatalogExercise, CatalogExerciseDetail } from "../model/catalog-exercise.model"

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
