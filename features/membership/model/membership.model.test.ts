import { describe, expect, it } from "vitest"

import {
  canCancel,
  canResume,
  describeBenefit,
  isSettled,
  isStoreManaged,
  limitUsage,
  yearlySavingsPercent,
  type CurrentMembership,
  type FeatureEntitlement,
  type MembershipPlan,
} from "./membership.model"

const feature = (overrides: Partial<FeatureEntitlement>): FeatureEntitlement => ({
  code: "TRAINER_MAX_ACTIVE_STUDENTS",
  name: "Alumnos activos",
  description: null,
  type: "LIMIT",
  unit: "alumnos",
  enabled: true,
  limit: 10,
  used: 2,
  upgradePlanCode: null,
  ...overrides,
})

const membership = (overrides: Partial<CurrentMembership>): CurrentMembership => ({
  id: 1,
  planCode: "TRAINER_PRO",
  planName: "Pro",
  status: "ACTIVE",
  billingPeriod: "MONTHLY",
  amount: 14999,
  currency: "ARS",
  provider: "MERCADO_PAGO",
  currentPeriodEnd: "2026-11-03T12:00:00Z",
  trialEndsAt: null,
  graceUntil: null,
  cancelAtPeriodEnd: false,
  accessUntil: "2026-11-03T12:00:00Z",
  renewsAt: "2026-11-03T12:00:00Z",
  checkoutUrl: null,
  ...overrides,
})

describe("limitUsage", () => {
  it("meters a limit with the usage the backend reported", () => {
    expect(limitUsage(feature({ used: 8 }))).toMatchObject({ used: 8, limit: 10, remaining: 2, exhausted: false, nearLimit: true })
  })

  it("caps the bar at full when a downgrade left the trainer over the limit", () => {
    expect(limitUsage(feature({ used: 30 }))).toMatchObject({ ratio: 1, remaining: 0, exhausted: true })
  })

  it("has nothing to meter when the plan is unlimited, it is not a limit, or usage is unknown", () => {
    expect(limitUsage(feature({ limit: null }))).toBeNull()
    expect(limitUsage(feature({ type: "CONFIG", limit: 10 }))).toBeNull()
    expect(limitUsage(feature({ used: null }))).toBeNull()
  })
})

describe("describeBenefit", () => {
  it("phrases each kind of benefit for the comparison", () => {
    expect(describeBenefit({ type: "BOOLEAN", enabled: true, limit: null, unit: null })).toBe("Incluido")
    expect(describeBenefit({ type: "BOOLEAN", enabled: false, limit: null, unit: null })).toBe("No incluido")
    expect(describeBenefit({ type: "LIMIT", enabled: true, limit: null, unit: "alumnos" })).toBe("Ilimitado")
    expect(describeBenefit({ type: "LIMIT", enabled: true, limit: 10, unit: "alumnos" })).toBe("Hasta 10 alumnos")
    expect(describeBenefit({ type: "CONFIG", enabled: true, limit: 5, unit: "%" })).toBe("5 %")
  })
})

describe("yearlySavingsPercent", () => {
  const plan = (monthly: number, yearly: number): MembershipPlan => ({
    id: 1, code: "TRAINER_PRO", name: "Pro", description: null, audience: "TRAINER", tierRank: 10,
    defaultPlan: false, highlightLabel: null, current: false, active: true, visible: true, benefits: [],
    prices: [
      { id: 1, billingPeriod: "MONTHLY", amount: monthly, currency: "ARS", trialDays: 14, label: null, active: true, validFrom: "", validTo: null, appStoreProductId: null, playStoreProductId: null },
      { id: 2, billingPeriod: "YEARLY", amount: yearly, currency: "ARS", trialDays: 14, label: null, active: true, validFrom: "", validTo: null, appStoreProductId: null, playStoreProductId: null },
    ],
  })

  it("compares the yearly price against twelve monthly ones", () => {
    expect(yearlySavingsPercent(plan(14999, 149990))).toBe(17)
  })

  it("says nothing when the yearly price is not a saving", () => {
    expect(yearlySavingsPercent(plan(10000, 130000))).toBeNull()
  })
})

describe("cancel and resume", () => {
  it("lets a paying trainer cancel, and only undo it before the period ends", () => {
    expect(canCancel(membership({}))).toBe(true)
    expect(canCancel(membership({ cancelAtPeriodEnd: true }))).toBe(false)
    expect(canCancel(membership({ status: "EXPIRED" }))).toBe(false)

    const now = new Date("2026-10-10T00:00:00Z")
    expect(canResume(membership({ cancelAtPeriodEnd: true }), now)).toBe(true)
    expect(canResume(membership({ cancelAtPeriodEnd: true, accessUntil: "2026-10-01T00:00:00Z" }), now)).toBe(false)
  })
})

describe("store-managed memberships", () => {
  it("never offers cancel or resume for a purchase made in the app: the store owns it", () => {
    const store = membership({ provider: "REVENUECAT" })
    expect(isStoreManaged(store)).toBe(true)
    expect(canCancel(store)).toBe(false)
    expect(canResume(membership({ provider: "REVENUECAT", cancelAtPeriodEnd: true }), new Date("2026-10-10T00:00:00Z"))).toBe(false)
  })
})

describe("isSettled", () => {
  it("only trusts the membership status, never Mercado Pago's query string", () => {
    const me = (status: CurrentMembership["status"]) => ({
      effectivePlanCode: null, effectivePlanName: null, trialEligible: false, billingEnabled: true,
      membership: membership({ status }),
    })
    expect(isSettled(me("ACTIVE"))).toBe(true)
    expect(isSettled(me("TRIALING"))).toBe(true)
    expect(isSettled(me("PENDING"))).toBe(false)
    expect(isSettled(undefined)).toBe(false)
  })
})
