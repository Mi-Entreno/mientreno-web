import { describe, expect, it } from "vitest"

import type { TrainingPlanResponseDTO } from "../dto/training-plan.dto"
import type { EditorPlan } from "../model/training-plan.model"
import { emptyExercise, nextKey } from "../model/training-plan.model"
import { toCreateRequest, toEditorPlan, toPlanBody, toTrainingPlan } from "./training-plan.mapper"

const RESPONSE: TrainingPlanResponseDTO = {
  id: 5,
  version: 3,
  title: "Fuerza · Torso-pierna",
  notes: "Calienta 10 minutos.",
  current: true,
  createdAt: "2026-07-01T10:30:00",
  days: [
    // Deliberately out of order: the API does not promise a sorted array.
    {
      id: 22,
      dayNumber: 2,
      label: "Pierna",
      restDay: false,
      exercises: [
        {
          id: 31,
          order: 2,
          name: "Prensa",
          sets: 4,
          reps: 10,
          weightValue: 120,
          weightUnit: "KG",
          restSeconds: 90,
          durationSeconds: null,
          mediaUrl: "http://localhost:8080/api/files/videos/31.mp4",
          trainerNotes: "Controla el descenso",
          catalogExerciseId: 77,
          muscleGroup: "Quadriceps",
          equipment: "Machine",
          // Deliberately out of order, and with a different target per set.
          plannedSets: [
            { id: 3, setNumber: 3, targetReps: 8, targetWeightValue: 110, targetWeightUnit: "KG", restSeconds: null },
            { id: 1, setNumber: 1, targetReps: 10, targetWeightValue: 120, targetWeightUnit: "KG", restSeconds: null },
            { id: 2, setNumber: 2, targetReps: 10, targetWeightValue: 120, targetWeightUnit: "KG", restSeconds: null },
            { id: 4, setNumber: 4, targetReps: 6, targetWeightValue: 100, targetWeightUnit: "KG", restSeconds: null },
          ],
        },
        {
          id: 30,
          order: 1,
          name: "Sentadilla",
          sets: 5,
          reps: 5,
          weightValue: null,
          weightUnit: "BODYWEIGHT",
          restSeconds: null,
          durationSeconds: null,
          mediaUrl: null,
          trainerNotes: null,
          catalogExerciseId: null,
          muscleGroup: null,
          equipment: null,
          plannedSets: [1, 2, 3, 4, 5].map((setNumber) => ({
            id: setNumber,
            setNumber,
            targetReps: 5,
            targetWeightValue: null,
            targetWeightUnit: "BODYWEIGHT" as const,
            restSeconds: null,
          })),
        },
      ],
    },
    { id: 21, dayNumber: 1, label: "Torso", restDay: false, exercises: [] },
    { id: 23, dayNumber: 3, label: null, restDay: true, exercises: [] },
  ],
}

describe("toTrainingPlan", () => {
  it("sorts days by dayNumber and exercises by order", () => {
    const plan = toTrainingPlan(RESPONSE)

    expect(plan.days.map((day) => day.dayNumber)).toEqual([1, 2, 3])
    expect(plan.days[1].exercises.map((exercise) => exercise.order)).toEqual([1, 2])
  })

  it("keeps the catalogue-derived fields", () => {
    const plan = toTrainingPlan(RESPONSE)
    const linked = plan.days[1].exercises[1]

    // muscleGroup and equipment are read from the linked catalogue entry, so a
    // custom exercise has neither.
    expect(linked.catalogExerciseId).toBe(77)
    expect(linked.muscleGroup).toBe("Quadriceps")
    expect(plan.days[1].exercises[0].muscleGroup).toBeNull()
  })

  it("normalises a null label and null notes to empty strings", () => {
    const plan = toTrainingPlan({ ...RESPONSE, notes: null })

    expect(plan.notes).toBe("")
    expect(plan.days[2].label).toBe("")
  })

  it("drops exercises on a rest day", () => {
    // `buildDays` never persists them, so a stale row should not render either.
    const plan = toTrainingPlan({
      ...RESPONSE,
      days: [{ id: 9, dayNumber: 1, label: "X", restDay: true, exercises: RESPONSE.days[0].exercises }],
    })

    expect(plan.days[0].exercises).toEqual([])
  })
})

describe("toEditorPlan", () => {
  it("keeps blank numbers blank instead of zero", () => {
    const editor = toEditorPlan(toTrainingPlan(RESPONSE))
    const bodyweight = editor.days[1].exercises[0]

    expect(bodyweight.sets.every((set) => set.weightValue === "")).toBe(true)
    expect(bodyweight.restSeconds).toBe("")
    expect(bodyweight.weightUnit).toBe("BODYWEIGHT")
  })

  it("always leaves at least one day to edit", () => {
    const editor = toEditorPlan(toTrainingPlan({ ...RESPONSE, days: [] }))
    expect(editor.days).toHaveLength(1)
  })
})

describe("toPlanBody", () => {
  const plan: EditorPlan = {
    title: "  Fuerza  ",
    notes: "   ",
    days: [
      {
        key: nextKey("day"),
        label: "Torso",
        restDay: false,
        exercises: [
          {
            ...emptyExercise(),
            name: "Press banca",
            weightUnit: "KG",
            sets: [
              { key: nextKey("set"), reps: "8", weightValue: "60,5" },
              { key: nextKey("set"), reps: "6", weightValue: "65" },
            ],
          },
          { ...emptyExercise(), catalogExerciseId: 12, name: "Remo", sets: [{ key: nextKey("set"), reps: "", weightValue: "" }] },
        ],
      },
      {
        key: nextKey("day"),
        label: "Descanso",
        restDay: true,
        exercises: [{ ...emptyExercise(), name: "No debería viajar" }],
      },
    ],
  }

  it("derives dayNumber and order from position", () => {
    const body = toPlanBody(plan)

    expect(body.days.map((day) => day.dayNumber)).toEqual([1, 2])
    expect(body.days[0].exercises.map((exercise) => exercise.order)).toEqual([1, 2])
  })

  it("sends no exercises for a rest day", () => {
    // `buildDays` would discard them anyway; not sending them keeps the request
    // describing what actually gets stored.
    expect(toPlanBody(plan).days[1].exercises).toEqual([])
  })

  it("trims the title and nulls a blank note", () => {
    const body = toPlanBody(plan)

    expect(body.title).toBe("Fuerza")
    expect(body.notes).toBeNull()
  })

  it("accepts a comma decimal separator for the weight", () => {
    expect(toPlanBody(plan).days[0].exercises[0].weightValue).toBe(60.5)
    expect(toPlanBody(plan).days[0].exercises[0].plannedSets?.[0].targetWeightValue).toBe(60.5)
  })

  it("sends one plannedSet per row, numbered by position", () => {
    const exercise = toPlanBody(plan).days[0].exercises[0]

    expect(exercise.plannedSets).toEqual([
      { setNumber: 1, targetReps: 8, targetWeightValue: 60.5, targetWeightUnit: "KG", restSeconds: null },
      { setNumber: 2, targetReps: 6, targetWeightValue: 65, targetWeightUnit: "KG", restSeconds: null },
    ])
  })

  it("keeps the flat summary in sync with the sets", () => {
    // It is what any consumer still on the old contract reads.
    const exercise = toPlanBody(plan).days[0].exercises[0]

    expect(exercise.sets).toBe(2)
    expect(exercise.reps).toBe(8)
    expect(exercise.weightValue).toBe(60.5)
  })

  it("nulls unset numbers rather than sending zero or NaN", () => {
    const exercise = toPlanBody(plan).days[0].exercises[1]

    expect(exercise.reps).toBeNull()
    expect(exercise.weightUnit).toBeNull()
    expect(exercise.plannedSets?.[0].targetReps).toBeNull()
  })

  it("keeps the catalogue link so the backend can snapshot the title", () => {
    expect(toPlanBody(plan).days[0].exercises[1].catalogExerciseId).toBe(12)
  })

  it("round-trips mediaUrl so an edit never unlinks a video", () => {
    // Phase 8 sets this field; the editor must not be the thing that wipes it.
    const editor = toEditorPlan(toTrainingPlan(RESPONSE))
    const body = toPlanBody(editor)

    expect(body.days[1].exercises[1].mediaUrl).toBe(
      "http://localhost:8080/api/files/videos/31.mp4",
    )
  })
})

describe("toCreateRequest", () => {
  it("adds the subscriptionId POST requires", () => {
    const request = toCreateRequest(
      { title: "Plan", notes: "", days: [] },
      42,
    )

    expect(request.subscriptionId).toBe(42)
    expect(request.title).toBe("Plan")
  })
})
