import { describe, expect, it } from "vitest"

import { emptyExercise, emptyPlan, type EditorPlan } from "@/features/training-plans/model/training-plan.model"
import { fromTemplateContent, templateCounts, toTemplateContent } from "./plan-template.model"

function samplePlan(): EditorPlan {
  const plan = emptyPlan()
  const exercise = {
    ...emptyExercise(),
    name: "Dominadas",
    catalogExerciseId: 12,
    muscleGroup: "Espalda",
    weightUnit: "BODYWEIGHT" as const,
    trainerNotes: "Controlá la bajada",
    mediaUrl: "https://media/x.mp4",
  }
  return {
    title: "Fuerza 3 días",
    notes: "Bloque base",
    days: [
      { ...plan.days[0], label: "Tirón", exercises: [exercise] },
      { key: "d2", label: "Descanso", restDay: true, exercises: [] },
    ],
  }
}

describe("plan template content", () => {
  it("round-trips everything the editor shows, with fresh keys", () => {
    const plan = samplePlan()
    const loaded = fromTemplateContent(JSON.parse(JSON.stringify(toTemplateContent(plan))))!

    const original = plan.days[0].exercises[0]
    const restored = loaded.days[0].exercises[0]
    expect(loaded.title).toBe("Fuerza 3 días")
    expect(restored).toMatchObject({
      name: "Dominadas",
      catalogExerciseId: 12,
      muscleGroup: "Espalda",
      weightUnit: "BODYWEIGHT",
      trainerNotes: "Controlá la bajada",
      mediaUrl: "https://media/x.mp4",
    })
    expect(restored.sets).toHaveLength(original.sets.length)
    expect(restored.key).not.toBe(original.key)
    expect(loaded.days[1].restDay).toBe(true)
  })

  it("does not store the editor's local keys", () => {
    expect(JSON.stringify(toTemplateContent(samplePlan()))).not.toContain('"key"')
  })

  it("refuses something that is not a plan, and fills gaps in one that is", () => {
    expect(fromTemplateContent(null)).toBeNull()
    expect(fromTemplateContent({ title: "x" })).toBeNull()
    const partial = fromTemplateContent({ days: [{ exercises: [{ name: "Remo", sets: [{}] }] }] })!
    expect(partial.days[0].exercises[0]).toMatchObject({ name: "Remo", weightUnit: "", trackingMode: "REPS_WEIGHT" })
  })

  it("counts training days, not rest days", () => {
    expect(templateCounts(samplePlan())).toEqual({ dayCount: 1, exerciseCount: 1 })
  })
})
