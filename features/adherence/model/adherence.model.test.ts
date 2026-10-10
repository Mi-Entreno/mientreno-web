import { describe, expect, it } from "vitest"

import { describeLastSession, describeRhythm, type StudentAdherence } from "./adherence.model"

const student = (overrides: Partial<StudentAdherence>): StudentAdherence => ({
  subscriptionId: 1, studentId: 1, studentName: "Ana", plannedPerWeek: 4, sessionsLast7Days: 3,
  sessionsLast28Days: 12, ratio: 0.75, lastSessionDate: "2026-10-05", status: "ON_TRACK", ...overrides,
})

describe("adherence wording", () => {
  it("compares the weekly average against the plan", () => {
    expect(describeRhythm(student({}))).toBe("3 de 4 por semana")
    expect(describeRhythm(student({ sessionsLast28Days: 10 }))).toBe("2,5 de 4 por semana")
    expect(describeRhythm(student({ plannedPerWeek: null }))).toBe("Sin plan vigente")
  })

  it("says how long ago the last session was", () => {
    const today = new Date(2026, 9, 7)
    expect(describeLastSession("2026-10-07", today)).toBe("Entrenó hoy")
    expect(describeLastSession("2026-10-06", today)).toBe("Entrenó ayer")
    expect(describeLastSession("2026-09-27", today)).toBe("Último entrenamiento hace 10 días")
    expect(describeLastSession(null, today)).toBe("Nunca entrenó")
  })
})
