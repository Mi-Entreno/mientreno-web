import { describe, expect, it } from "vitest"

import { canPublish, isMissingPickupAddress, type AdminBrand } from "./admin.model"

function brand(overrides: Partial<AdminBrand> = {}): AdminBrand {
  return {
    id: 1,
    displayName: "Café Central",
    legalName: null,
    taxId: null,
    logoUrl: null,
    contactEmail: null,
    contactPhone: null,
    pickupAddress: "Av. Siempreviva 742",
    status: "ACTIVE",
    createdAt: "2026-09-01T10:00:00Z",
    ...overrides,
  }
}

describe("canPublish", () => {
  it("un comercio activo puede publicar", () => {
    expect(canPublish(brand())).toBe(true)
  })

  it("uno suspendido no: suspenderlo saca sus desafíos del catálogo", () => {
    expect(canPublish(brand({ status: "SUSPENDED" }))).toBe(false)
  })
})

describe("isMissingPickupAddress", () => {
  it("sin dirección de retiro el alumno no sabe dónde buscar el premio", () => {
    expect(isMissingPickupAddress(brand({ pickupAddress: null }))).toBe(true)
    expect(isMissingPickupAddress(brand({ pickupAddress: "   " }))).toBe(true)
  })

  it("con dirección cargada, no hay nada que marcar", () => {
    expect(isMissingPickupAddress(brand())).toBe(false)
  })
})
