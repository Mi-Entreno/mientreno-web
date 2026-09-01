import { describe, expect, it } from "vitest"

import { isPlatformProduct, maxExposure, REVIEW_CHECKLIST } from "./admin.model"
import type { AdminProduct } from "./admin.model"

const product = (overrides: Partial<AdminProduct> = {}): AdminProduct => ({
  id: 1,
  name: "Botella",
  description: null,
  imageUrl: null,
  costDumbbells: 3,
  stock: 10,
  active: true,
  approvalStatus: "PENDING_APPROVAL",
  rejectionReason: null,
  brandId: 30,
  brandName: "Suplementos Norte",
  updatedAt: "2026-09-01T10:00:00Z",
  ...overrides,
})

describe("isPlatformProduct", () => {
  it("is false for a merchant's product", () => {
    expect(isPlatformProduct(product())).toBe(false)
  })

  it("is true when nobody owns it", () => {
    // Not a degenerate case: it is how the platform loads its own without
    // inventing a merchant to represent itself.
    expect(isPlatformProduct(product({ brandId: null, brandName: null }))).toBe(true)
  })
})

describe("maxExposure", () => {
  it("multiplies cost by stock", () => {
    // The number nobody computes until the inventory is gone: 25 dumbbells
    // times 40 units is a thousand dumbbells of liability.
    expect(maxExposure(product({ costDumbbells: 25, stock: 40 }))).toBe(1000)
  })

  it("is zero with no stock", () => {
    expect(maxExposure(product({ stock: 0 }))).toBe(0)
  })

  it("never goes negative on a corrupt stock value", () => {
    // The CHECK upstream makes this impossible, but a negative exposure shown
    // to a moderator would read as if approving *created* dumbbells.
    expect(maxExposure(product({ stock: -5 }))).toBe(0)
  })
})

describe("REVIEW_CHECKLIST", () => {
  it("leads with the cost", () => {
    // What moderation exists to prevent is a one-dumbbell prize draining the
    // economy — not a typo in the description.
    expect(REVIEW_CHECKLIST[0]).toContain("costo")
  })
})
