import { describe, expect, it } from "vitest"

import type {
  CatalogExerciseDetailDTO,
  CatalogExerciseSummaryDTO,
} from "../dto/catalog-exercise.dto"
import { toCatalogExercise, toCatalogExerciseDetail } from "./catalog-exercise.mapper"

const SUMMARY: CatalogExerciseSummaryDTO = {
  id: 12,
  title: "Barbell Bench Press",
  muscleGroup: "Chest",
  equipment: "Barbell",
}

describe("toCatalogExercise", () => {
  it("maps the summary row", () => {
    expect(toCatalogExercise(SUMMARY)).toEqual({
      id: 12,
      title: "Barbell Bench Press",
      muscleGroup: "Chest",
      equipment: "Barbell",
    })
  })

  it("collapses blank strings to null so badges do not render empty", () => {
    const exercise = toCatalogExercise({ ...SUMMARY, muscleGroup: "   ", equipment: null })

    expect(exercise.muscleGroup).toBeNull()
    expect(exercise.equipment).toBeNull()
  })
})

describe("toCatalogExerciseDetail", () => {
  const DETAIL: CatalogExerciseDetailDTO = {
    id: 12,
    title: "Barbell Bench Press",
    instructions: "Lie on the bench.\nLower the bar to your chest.",
    muscleGroup: "Chest",
    secondaryMuscles: ["Triceps", "  Shoulders  ", "Triceps", ""],
    equipment: "Barbell",
  }

  it("keeps the line breaks the importer stored", () => {
    // Rendered with `whitespace-pre-line`, so the breaks are meaningful.
    expect(toCatalogExerciseDetail(DETAIL).instructions).toContain("\n")
  })

  it("trims, dedupes and drops blanks from secondary muscles", () => {
    expect(toCatalogExerciseDetail(DETAIL).secondaryMuscles).toEqual(["Triceps", "Shoulders"])
  })

  it("tolerates a missing secondary muscle list", () => {
    const detail = toCatalogExerciseDetail({
      ...DETAIL,
      secondaryMuscles: undefined as unknown as string[],
      instructions: null,
    })

    expect(detail.secondaryMuscles).toEqual([])
    expect(detail.instructions).toBeNull()
  })
})
