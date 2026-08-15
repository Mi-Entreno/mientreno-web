import { describe, expect, it } from "vitest"

import {
  MAX_SPECIALTY_LENGTH,
  addSpecialty,
  isDuplicateSpecialty,
  normaliseSpecialties,
  specialtyKey,
} from "./specialty.model"

describe("specialtyKey", () => {
  it("matches the slug the backend derives, so both sides agree on what is a duplicate", () => {
    expect(specialtyKey("Preparación Física")).toBe("preparacion-fisica")
    expect(specialtyKey("  CrossFit ")).toBe("crossfit")
    expect(specialtyKey("Cross-Fit")).toBe("cross-fit")
  })

  it("is empty for something that carries no letters", () => {
    // `addSpecialty` leans on this: a chip whose key is empty could never be
    // matched against anything the server stores.
    expect(specialtyKey("   ")).toBe("")
    expect(specialtyKey("!!!")).toBe("")
  })
})

describe("addSpecialty", () => {
  it("adds a specialty that exists in no catalogue", () => {
    expect(addSpecialty([], "Rehabilitación deportiva")).toEqual(["Rehabilitación deportiva"])
  })

  it("accumulates several", () => {
    const list = ["Musculación", "Running"].reduce(
      (acc, name) => addSpecialty(acc, name),
      [] as string[],
    )

    expect(list).toEqual(["Musculación", "Running"])
  })

  it("keeps the exact text the trainer typed", () => {
    // The slug is for matching; what gets shown is what they wrote.
    expect(addSpecialty([], "CrossFit")).toEqual(["CrossFit"])
  })

  it("refuses what the backend would merge into an existing row", () => {
    const list = ["CrossFit"]

    // Same reference back means "nothing changed" — the caller skips the
    // re-render rather than flashing a chip that then vanishes on reload.
    expect(addSpecialty(list, " crossfit ")).toBe(list)
    expect(addSpecialty(list, "CROSSFIT")).toBe(list)
  })

  it("refuses blanks", () => {
    const list = ["Running"]

    expect(addSpecialty(list, "   ")).toBe(list)
    expect(addSpecialty(list, "")).toBe(list)
  })

  it("collapses internal whitespace", () => {
    expect(addSpecialty([], "Entrenamiento   funcional")).toEqual(["Entrenamiento funcional"])
  })

  it("truncates to what the column accepts", () => {
    const [only] = addSpecialty([], "a".repeat(MAX_SPECIALTY_LENGTH + 50))
    expect(only).toHaveLength(MAX_SPECIALTY_LENGTH)
  })

  it("stops at the cap", () => {
    const full = ["a", "b", "c"]
    expect(addSpecialty(full, "d", 3)).toBe(full)
  })
})

describe("isDuplicateSpecialty", () => {
  it("ignores case, accents and punctuation", () => {
    expect(isDuplicateSpecialty(["Pérdida de peso"], "perdida de peso")).toBe(true)
    expect(isDuplicateSpecialty(["Pérdida de peso"], "Pérdida de grasa")).toBe(false)
  })
})

describe("normaliseSpecialties", () => {
  it("cleans a list from anywhere into what the request can carry", () => {
    expect(
      normaliseSpecialties(["Musculación", null, "  ", "musculacion", undefined, "CrossFit"]),
    ).toEqual(["Musculación", "CrossFit"])
  })
})
