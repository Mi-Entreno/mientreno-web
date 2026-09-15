import { describe, expect, it } from "vitest"

import {
  MAX_REPS_DIGITS,
  MAX_SECONDS_DIGITS,
  cloneDay,
  cloneExercise,
  countExercises,
  emptyDay,
  emptyExercise,
  emptyPlan,
  exerciseIssue,
  resizeSets,
  sanitizeDecimal,
  sanitizeInteger,
  type EditorExercise,
} from "./training-plan.model"

const exercise = (overrides: Partial<EditorExercise> = {}): EditorExercise => ({
  ...emptyExercise(),
  name: "Press banca",
  catalogExerciseId: 12,
  muscleGroup: "Pecho",
  equipment: "Barra",
  sets: [
    { key: "set-a", reps: "8", weightValue: "60" },
    { key: "set-b", reps: "6", weightValue: "65" },
  ],
  weightUnit: "KG",
  restSeconds: "90",
  trainerNotes: "Bajar controlado",
  mediaUrl: "/api/media/files/press.mp4",
  ...overrides,
})

describe("cloneExercise", () => {
  it("copies every target and note", () => {
    const copy = cloneExercise(exercise())

    expect(copy.name).toBe("Press banca")
    expect(copy.catalogExerciseId).toBe(12)
    expect(copy.restSeconds).toBe("90")
    expect(copy.trainerNotes).toBe("Bajar controlado")
    expect(copy.sets.map((set) => [set.reps, set.weightValue])).toEqual([
      ["8", "60"],
      ["6", "65"],
    ])
  })

  it("keeps the attached video — dropping it silently would unlink it", () => {
    expect(cloneExercise(exercise()).mediaUrl).toBe("/api/media/files/press.mp4")
  })

  it("gives the copy and every set a fresh key", () => {
    const original = exercise()
    const copy = cloneExercise(original)

    expect(copy.key).not.toBe(original.key)
    expect(copy.sets.map((set) => set.key)).not.toEqual(original.sets.map((set) => set.key))
    expect(new Set(copy.sets.map((set) => set.key)).size).toBe(2)
  })

  it("does not share set objects with the original", () => {
    const original = exercise()
    const copy = cloneExercise(original)

    copy.sets[0].reps = "12"
    expect(original.sets[0].reps).toBe("8")
  })
})

describe("cloneDay", () => {
  it("copies the exercises and marks the label as a copy", () => {
    const day = { ...emptyDay(0), label: "Torso · Empuje", exercises: [exercise(), exercise()] }
    const copy = cloneDay(day)

    expect(copy.label).toBe("Torso · Empuje (copia)")
    expect(copy.exercises).toHaveLength(2)
    expect(copy.key).not.toBe(day.key)
  })

  it("leaves an unnamed day unnamed rather than calling it '(copia)'", () => {
    expect(cloneDay({ ...emptyDay(0), label: "   " }).label).toBe("")
  })

  it("keeps a rest day a rest day", () => {
    const copy = cloneDay({ ...emptyDay(0), restDay: true })
    expect(copy.restDay).toBe(true)
  })

  it("produces exercises the original does not share", () => {
    const day = { ...emptyDay(0), exercises: [exercise()] }
    const copy = cloneDay(day)

    copy.exercises[0].name = "Otro"
    expect(day.exercises[0].name).toBe("Press banca")
  })
})

describe("countExercises", () => {
  it("ignores the exercises sitting on a rest day", () => {
    const plan = {
      ...emptyPlan(),
      days: [
        { ...emptyDay(0), exercises: [exercise(), exercise()] },
        { ...emptyDay(1), restDay: true, exercises: [exercise()] },
      ],
    }

    expect(countExercises(plan)).toBe(2)
  })
})

describe("resizeSets", () => {
  it("keeps what is filled in when shrinking", () => {
    const sets = exercise().sets
    expect(resizeSets(sets, 1)).toEqual([sets[0]])
  })

  it("copies the last row when growing", () => {
    const grown = resizeSets(exercise().sets, 3)
    expect(grown).toHaveLength(3)
    expect(grown[2].reps).toBe("6")
    expect(grown[2].key).not.toBe(grown[1].key)
  })
})

describe("sanitizeInteger", () => {
  it("drops anything that is not a digit", () => {
    // El caso que motivó el filtro: un rango de repeticiones se convertía en
    // NaN en el mapper y el ejercicio se publicaba sin objetivo.
    expect(sanitizeInteger("10-12", MAX_REPS_DIGITS)).toBe("101")
    expect(sanitizeInteger("90 seg", MAX_SECONDS_DIGITS)).toBe("90")
    expect(sanitizeInteger("-3", MAX_REPS_DIGITS)).toBe("3")
    expect(sanitizeInteger("8.5", MAX_REPS_DIGITS)).toBe("85")
  })

  it("keeps an empty field empty instead of collapsing it to zero", () => {
    expect(sanitizeInteger("", MAX_REPS_DIGITS)).toBe("")
    expect(sanitizeInteger("kg", MAX_REPS_DIGITS)).toBe("")
  })

  it("caps the digit count", () => {
    expect(sanitizeInteger("123456", MAX_REPS_DIGITS)).toBe("123")
    expect(sanitizeInteger("123456", MAX_SECONDS_DIGITS)).toBe("1234")
  })
})

describe("sanitizeDecimal", () => {
  it("normalises the comma typed on the numpad", () => {
    expect(sanitizeDecimal("62,5")).toBe("62.5")
  })

  it("keeps the separator while it is still being typed", () => {
    expect(sanitizeDecimal("80.")).toBe("80.")
  })

  it("collapses extra separators instead of producing NaN", () => {
    expect(sanitizeDecimal("1.2.3")).toBe("1.23")
  })

  it("stays inside numeric(6,2)", () => {
    expect(sanitizeDecimal("123456")).toBe("1234")
    expect(sanitizeDecimal("62.567")).toBe("62.56")
  })
})

describe("exerciseIssue", () => {
  it("passes a complete exercise", () => {
    expect(exerciseIssue(exercise())).toBeNull()
  })

  it("demands a name when there is no catalogue link", () => {
    expect(exerciseIssue(exercise({ name: "  ", catalogExerciseId: null }))).toBe(
      "Este ejercicio necesita un nombre",
    )
  })

  it("accepts a nameless exercise that comes from the catalogue", () => {
    // `resolveExerciseName` copia el título del catálogo en ese caso.
    expect(exerciseIssue(exercise({ name: "", catalogExerciseId: 12 }))).toBeNull()
  })

  it("demands a unit once a weight is written", () => {
    expect(exerciseIssue(exercise({ weightUnit: "" }))).toBe(
      "Elegí la unidad del peso: kg, lb o peso corporal",
    )
  })

  it("does not demand a unit when no set carries a weight", () => {
    const sets = [{ key: "set-a", reps: "8", weightValue: "" }]
    expect(exerciseIssue(exercise({ weightUnit: "", sets }))).toBeNull()
  })
})
