import { describe, expect, it } from "vitest"

import type { ExerciseDetailResponseDTO, ExerciseVideoResponseDTO } from "../dto/exercise.dto"
import { toExerciseDetail, toExerciseVideo } from "./exercise.mapper"

const DETAIL: ExerciseDetailResponseDTO = {
  id: 31,
  trainingPlanId: 5,
  planTitle: "Fuerza · Torso-pierna",
  trainingDayId: 22,
  dayNumber: 2,
  dayLabel: "Pierna",
  exerciseOrder: 1,
  name: "Prensa",
  sets: 4,
  reps: 10,
  weightValue: 120,
  weightUnit: "KG",
  restSeconds: 90,
  durationSeconds: null,
  mediaUrl: "http://localhost:8080/api/files/exercise-videos/31/clip.mp4",
  trainerNotes: "Controla el descenso",
  catalogExerciseId: 77,
  muscleGroup: "Quadriceps",
  secondaryMuscles: ["Glutes", "  Glutes  ", "", "Hamstrings"],
  equipment: "Machine",
  instructions: "  Siéntate y empuja.  ",
}

describe("toExerciseDetail", () => {
  it("routes mediaUrl through the authenticated media proxy", () => {
    // /api/files/** needs a bearer token, so a raw <video src> would 401.
    expect(toExerciseDetail(DETAIL).mediaUrl).toBe("/api/media/exercise-videos/31/clip.mp4")
  })

  it("renames exerciseOrder to order", () => {
    expect(toExerciseDetail(DETAIL).order).toBe(1)
  })

  it("trims, dedupes and drops blank secondary muscles", () => {
    expect(toExerciseDetail(DETAIL).secondaryMuscles).toEqual(["Glutes", "Hamstrings"])
  })

  it("trims instructions and nulls them when blank", () => {
    expect(toExerciseDetail(DETAIL).instructions).toBe("Siéntate y empuja.")
    expect(toExerciseDetail({ ...DETAIL, instructions: "   " }).instructions).toBeNull()
  })

  it("survives an exercise with no catalogue link", () => {
    const detail = toExerciseDetail({
      ...DETAIL,
      catalogExerciseId: null,
      muscleGroup: null,
      equipment: null,
      secondaryMuscles: [],
      instructions: null,
      mediaUrl: null,
      planTitle: null,
      dayLabel: null,
      trainerNotes: null,
    })

    expect(detail.catalogExerciseId).toBeNull()
    expect(detail.secondaryMuscles).toEqual([])
    expect(detail.mediaUrl).toBeNull()
    expect(detail.trainerNotes).toBe("")
  })
})

describe("toExerciseVideo", () => {
  const VIDEO: ExerciseVideoResponseDTO = {
    id: 12,
    exerciseId: 31,
    originalFileName: "sentadilla.mp4",
    contentType: "video/mp4",
    fileSizeBytes: 5_242_880,
    url: "http://localhost:8080/api/files/exercise-videos/31/abc.mp4",
    uploadedByTrainerId: 7,
    createdAt: "2026-07-20T12:00:00",
  }

  it("proxies the video URL so <video> can play it", () => {
    expect(toExerciseVideo(VIDEO).url).toBe("/api/media/exercise-videos/31/abc.mp4")
  })

  it("keeps the original file name and size", () => {
    const video = toExerciseVideo(VIDEO)

    expect(video.fileName).toBe("sentadilla.mp4")
    expect(video.sizeBytes).toBe(5_242_880)
  })
})
