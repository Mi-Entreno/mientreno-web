import { describe, expect, it } from "vitest"

import type { BrandProductDTO, BrandProfileDTO, RedemptionDTO } from "../dto/brand.dto"
import { toBrandProduct, toBrandProfile, toRedemption } from "./brand.mapper"

const profileDto: BrandProfileDTO = {
  id: 30,
  displayName: "Suplementos Norte",
  legalName: "NORTE NUTRICION SRL",
  taxId: "30-12345678-9",
  logoUrl: "http://localhost:8080/api/files/brand-logos/abc.webp",
  description: "Suplementos y accesorios.",
  contactEmail: "hola@norte.test",
  contactPhone: "+5491199999999",
  pickupAddress: "Av. Siempreviva 742",
  pickupNotes: "Lunes a viernes de 10 a 19.",
  status: "ACTIVE",
  createdAt: "2026-09-01T10:00:00Z",
}

describe("toBrandProfile", () => {
  it("routes the logo through the authenticated media proxy", () => {
    // With the backend's default local storage the file sits behind
    // /api/files/**, which is authenticated — an <img src> sends no header.
    expect(toBrandProfile(profileDto).logoUrl).toBe("/api/media/brand-logos/abc.webp")
  })

  it("keeps a missing logo as null instead of an empty string", () => {
    expect(toBrandProfile({ ...profileDto, logoUrl: null }).logoUrl).toBeNull()
  })

  it("carries the pickup address through untouched", () => {
    expect(toBrandProfile(profileDto).pickupAddress).toBe("Av. Siempreviva 742")
  })
})

describe("toBrandProduct", () => {
  const dto: BrandProductDTO = {
    id: 7,
    name: "Botella",
    description: null,
    imageUrl: "http://localhost:8080/api/files/reward-products/x.webp",
    costReps: 3,
    stock: 5,
    active: true,
    sortOrder: 1,
    approvalStatus: "PENDING_APPROVAL",
    rejectionReason: null,
    canSubmit: false,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
  }

  it("routes the image through the media proxy", () => {
    expect(toBrandProduct(dto).imageUrl).toBe("/api/media/reward-products/x.webp")
  })

  it("preserves the approval state and whether it can be submitted", () => {
    const model = toBrandProduct(dto)
    expect(model.approvalStatus).toBe("PENDING_APPROVAL")
    expect(model.canSubmit).toBe(false)
  })

  it("preserves the rejection reason, which is what the merchant has to fix", () => {
    const rejected = toBrandProduct({
      ...dto,
      approvalStatus: "REJECTED",
      rejectionReason: "La foto no se ve",
      canSubmit: true,
    })
    expect(rejected.rejectionReason).toBe("La foto no se ve")
  })
})

describe("toRedemption", () => {
  const dto: RedemptionDTO = {
    id: 900,
    productId: 7,
    productName: "Botella FitEvolution",
    productImageUrl: null,
    quantity: 1,
    totalCostReps: 3,
    status: "PENDING",
    deliveryNotes: "Talle M",
    cancelledReason: null,
    canCancel: false,
    createdAt: "2026-09-01T10:00:00Z",
    history: [],
  }

  it("keeps the frozen product name, not a live lookup", () => {
    // The redemption has to render even if the product was renamed since.
    expect(toRedemption(dto).productName).toBe("Botella FitEvolution")
  })

  it("keeps the delivery note, which is the only thing the student wrote", () => {
    expect(toRedemption(dto).deliveryNotes).toBe("Talle M")
  })

  it("does not expose anything about the student", () => {
    // The merchant sees what to hand over, not who is behind it. If the DTO
    // ever grows a student field, this test is where that shows up.
    expect(Object.keys(toRedemption(dto))).not.toContain("student")
  })
})
