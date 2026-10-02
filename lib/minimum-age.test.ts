import { describe, expect, it } from "vitest"

import { birthDateError } from "./minimum-age"

const today = new Date(2026, 9, 1) // 1 de octubre de 2026, hora local

describe("birthDateError", () => {
  it("lets in someone who turns 18 today", () => {
    expect(birthDateError("2008-10-01", { required: true, today })).toBeNull()
  })

  it("rejects someone one day short of 18", () => {
    expect(birthDateError("2008-10-02", { required: true, today })).toMatch(/mayor de 18/)
  })

  it("rejects a future date", () => {
    expect(birthDateError("2027-01-01", { required: true, today })).toMatch(/futura/)
  })

  it("requires the date only when asked to", () => {
    expect(birthDateError("", { required: true, today })).toMatch(/obligatoria/)
    expect(birthDateError(null, { required: false, today })).toBeNull()
  })
})
