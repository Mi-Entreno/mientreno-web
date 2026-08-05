import { describe, expect, it } from "vitest"

import type { SpecialtyDTO } from "../dto/specialty.dto"
import { resolveSpecialtyIds, toSpecialties, toSpecialty } from "./specialty.mapper"

/** The endpoint returns the JPA entity, so audit columns come along. */
const DTO: SpecialtyDTO = {
  id: 4,
  name: "Ganancia de masa muscular",
  slug: "ganancia-de-masa-muscular",
  createdAt: "2025-01-01T00:00:00",
  updatedAt: "2025-01-01T00:00:00",
  deletedAt: null,
}

describe("toSpecialty", () => {
  it("drops the BaseEntity audit columns", () => {
    expect(toSpecialty(DTO)).toEqual({
      id: 4,
      name: "Ganancia de masa muscular",
      slug: "ganancia-de-masa-muscular",
    })
  })
})

describe("resolveSpecialtyIds", () => {
  // The profile response lists specialties as names; the write endpoints take
  // ids. This bridges the two.
  const catalogue = toSpecialties([
    DTO,
    { id: 1, name: "Fuerza", slug: "fuerza" },
    { id: 9, name: "Pérdida de peso", slug: "perdida-de-peso" },
  ])

  it("maps names back to ids", () => {
    expect(resolveSpecialtyIds(["Fuerza", "Pérdida de peso"], catalogue)).toEqual([1, 9])
  })

  it("ignores case and accents", () => {
    expect(resolveSpecialtyIds(["  perdida de peso ", "FUERZA"], catalogue)).toEqual([9, 1])
  })

  it("silently drops names not in the catalogue", () => {
    // A renamed or deleted specialty must not become `undefined` in the payload.
    expect(resolveSpecialtyIds(["Fuerza", "Yoga aéreo"], catalogue)).toEqual([1])
  })

  it("returns an empty list for no names", () => {
    expect(resolveSpecialtyIds([], catalogue)).toEqual([])
  })
})
