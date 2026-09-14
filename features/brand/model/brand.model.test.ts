import { describe, expect, it } from "vitest"

import { canPublishChallenges, profileBlockedReason, type BrandProfile } from "./brand.model"

function profile(overrides: Partial<BrandProfile> = {}): BrandProfile {
  return {
    id: 1,
    displayName: "Café Central",
    legalName: null,
    taxId: null,
    logoUrl: null,
    description: null,
    contactEmail: null,
    contactPhone: null,
    pickupAddress: "Av. Siempreviva 742",
    pickupNotes: null,
    status: "ACTIVE",
    ...overrides,
  }
}

describe("canPublishChallenges", () => {
  it("activo y con dirección de retiro puede publicar", () => {
    expect(canPublishChallenges(profile())).toBe(true)
  })

  it("sin dirección de retiro no: el premio quedaría sin dónde buscarse", () => {
    expect(canPublishChallenges(profile({ pickupAddress: "  " }))).toBe(false)
    expect(profileBlockedReason(profile({ pickupAddress: null }))).toContain("dirección de retiro")
  })

  it("suspendido no, aunque tenga todo cargado", () => {
    expect(canPublishChallenges(profile({ status: "SUSPENDED" }))).toBe(false)
    expect(profileBlockedReason(profile({ status: "SUSPENDED" }))).toContain("suspendido")
  })
})
