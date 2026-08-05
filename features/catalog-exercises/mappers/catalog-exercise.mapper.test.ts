import { describe, expect, it } from "vitest"

import type {
  CatalogExerciseDetailDTO,
  CatalogExerciseSummaryDTO,
  CatalogFilterOptionsDTO,
} from "../dto/catalog-exercise.dto"
import {
  toCatalogExercise,
  toCatalogExerciseDetail,
  toCatalogFilterOptions,
} from "./catalog-exercise.mapper"

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

describe("toCatalogFilterOptions", () => {
  it("passes values through verbatim", () => {
    // The repository filters with `ce.muscleGroup = :muscleGroup` — exact
    // equality — so trimming or re-casing here would stop matching anything.
    const dto: CatalogFilterOptionsDTO = {
      muscleGroups: ["Chest", "Upper Back"],
      equipment: ["Barbell", "Cable Machine"],
    }

    expect(toCatalogFilterOptions(dto).muscleGroups).toEqual(["Chest", "Upper Back"])
    expect(toCatalogFilterOptions(dto).equipment).toEqual(["Barbell", "Cable Machine"])
  })

  it("drops blanks and duplicates", () => {
    const options = toCatalogFilterOptions({
      muscleGroups: ["Chest", "", "Chest"],
      equipment: [],
    })

    expect(options.muscleGroups).toEqual(["Chest"])
    expect(options.equipment).toEqual([])
  })
})
