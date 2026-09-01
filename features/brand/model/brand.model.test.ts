import { describe, expect, it } from "vitest"

import { isLive, nextStatuses, notLiveReason, isFinalStatus } from "./brand.model"
import type { BrandProduct } from "./brand.model"

const product = (overrides: Partial<BrandProduct> = {}): BrandProduct => ({
  id: 1,
  name: "Botella",
  description: null,
  imageUrl: null,
  costDumbbells: 3,
  stock: 5,
  active: true,
  approvalStatus: "APPROVED",
  rejectionReason: null,
  canSubmit: false,
  updatedAt: "2026-09-01T10:00:00Z",
  ...overrides,
})

describe("isLive", () => {
  it("is true only when approved, active and in stock", () => {
    expect(isLive(product())).toBe(true)
  })

  it("is false while under review", () => {
    expect(isLive(product({ approvalStatus: "PENDING_APPROVAL" }))).toBe(false)
  })

  it("is false when the merchant paused it", () => {
    expect(isLive(product({ active: false }))).toBe(false)
  })

  it("is false with no stock", () => {
    // "Publicado" over an empty shelf would have the merchant wondering why
    // nobody redeems it.
    expect(isLive(product({ stock: 0 }))).toBe(false)
  })
})

describe("notLiveReason", () => {
  it("says nothing when the product is actually live", () => {
    expect(notLiveReason(product())).toBeNull()
  })

  it("says nothing for a product that was never approved", () => {
    // The status pill already says "En revisión"; repeating it as a warning
    // would read as two different problems.
    expect(notLiveReason(product({ approvalStatus: "DRAFT" }))).toBeNull()
  })

  it("names the pause", () => {
    expect(notLiveReason(product({ active: false }))).toBe("Pausado por vos")
  })

  it("names the empty shelf", () => {
    expect(notLiveReason(product({ stock: 0 }))).toBe("Sin stock")
  })

  it("reports the pause first when both apply", () => {
    // The one the merchant can undo with a single click comes first.
    expect(notLiveReason(product({ active: false, stock: 0 }))).toBe("Pausado por vos")
  })
})

describe("nextStatuses", () => {
  it("offers ready and cancel from pending", () => {
    expect(nextStatuses("PENDING")).toEqual(["READY", "CANCELLED"])
  })

  it("offers delivered and cancel from ready", () => {
    expect(nextStatuses("READY")).toEqual(["DELIVERED", "CANCELLED"])
  })

  it("offers nothing from a final state", () => {
    expect(nextStatuses("DELIVERED")).toEqual([])
    expect(nextStatuses("CANCELLED")).toEqual([])
  })

  it("never lets pending jump straight to delivered", () => {
    // Mirrors `RedemptionStatus.canTransitionTo` upstream: a product cannot be
    // handed over before it was ever marked ready.
    expect(nextStatuses("PENDING")).not.toContain("DELIVERED")
  })
})

describe("isFinalStatus", () => {
  it("recognises the two terminal states", () => {
    expect(isFinalStatus("DELIVERED")).toBe(true)
    expect(isFinalStatus("CANCELLED")).toBe(true)
    expect(isFinalStatus("PENDING")).toBe(false)
    expect(isFinalStatus("READY")).toBe(false)
  })
})
