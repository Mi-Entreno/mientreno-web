import { describe, expect, it } from "vitest"

import type { WorkoutSessionDetailResponseDTO } from "../dto/workout-session.dto"
import { groupSetsByExercise, totalVolume } from "../model/workout-session.model"
import { toWorkoutSession } from "./workout-session.mapper"

const DTO: WorkoutSessionDetailResponseDTO = {
  id: 55,
  status: "COMPLETED",
  startedAt: "2026-07-20T17:00:00Z",
  completedAt: "2026-07-20T18:05:00Z",
  notes: "Buena sesión",
  trainingDay: { id: 22, dayNumber: 2, label: "Pierna", planTitle: "Fuerza · Torso-pierna" },
  sets: [
    // Interleaved on purpose: the student alternated exercises.
    { id: 2, exerciseId: 31, exerciseName: "Prensa", setNumber: 2, repsCompleted: 10, weightKg: 120, durationSeconds: null, difficulty: 8, notes: null, createdAt: "2026-07-20T17:20:00" },
    { id: 1, exerciseId: 31, exerciseName: "Prensa", setNumber: 1, repsCompleted: 12, weightKg: 100, durationSeconds: null, difficulty: 7, notes: null, createdAt: "2026-07-20T17:10:00" },
    { id: 3, exerciseId: 32, exerciseName: "Zancadas", setNumber: 1, repsCompleted: 10, weightKg: null, durationSeconds: null, difficulty: null, notes: null, createdAt: "2026-07-20T17:40:00" },
  ],
  feedback: { id: 9, overallRating: 4, fatigueLevel: 6, notes: "Cansado al final", createdAt: "2026-07-20T18:06:00" },
  createdAt: "2026-07-20T17:00:00",
}

describe("toWorkoutSession", () => {
  it("flattens the training day info", () => {
    const session = toWorkoutSession(DTO)

    expect(session.dayNumber).toBe(2)
    expect(session.dayLabel).toBe("Pierna")
    expect(session.planTitle).toBe("Fuerza · Torso-pierna")
  })

  it("tolerates a session whose training day is gone", () => {
    // Deleting a plan version removes its days, but sessions survive.
    const session = toWorkoutSession({ ...DTO, trainingDay: null, notes: null, feedback: null })

    expect(session.dayNumber).toBeNull()
    expect(session.dayLabel).toBe("")
    expect(session.notes).toBe("")
    expect(session.feedback).toBeNull()
  })
})

describe("groupSetsByExercise", () => {
  it("groups sets by exercise and orders them by set number", () => {
    const groups = groupSetsByExercise(toWorkoutSession(DTO).sets)

    expect(groups.map((group) => group.exerciseName)).toEqual(["Prensa", "Zancadas"])
    expect(groups[0].sets.map((set) => set.setNumber)).toEqual([1, 2])
  })
})

describe("totalVolume", () => {
  it("multiplies reps by weight across the sets that have both", () => {
    // 12×100 + 10×120 = 2400. The bodyweight lunges contribute nothing.
    expect(totalVolume(toWorkoutSession(DTO).sets)).toBe(2400)
  })

  it("returns null when no set has both, rather than a misleading 0", () => {
    const bodyweightOnly = toWorkoutSession({
      ...DTO,
      sets: [DTO.sets[2]],
    }).sets

    expect(totalVolume(bodyweightOnly)).toBeNull()
  })
})
