import { describe, expect, it } from "vitest"

import type { SpecialtyDTO } from "../dto/specialty.dto"
import { toSpecialties, toSpecialty } from "./specialty.mapper"

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

describe("toSpecialties", () => {
  it("maps a catalogue page", () => {
    const catalogue = toSpecialties([DTO, { id: 1, name: "Fuerza", slug: "fuerza" }])

    expect(catalogue).toHaveLength(2)
    expect(catalogue.map((item) => item.name)).toEqual(["Ganancia de masa muscular", "Fuerza"])
  })
})
