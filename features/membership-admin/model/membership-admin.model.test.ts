import { describe, expect, it } from "vitest"

import { canPublish, canReconcile, groupByAudience, grantEndsAt, parseLimit, percent, splitKey, type MembershipPlan } from "./membership-admin.model"

const plan = (overrides: Partial<MembershipPlan>): MembershipPlan => ({
  id: 1, code: "TRAINER_PRO", name: "Pro", description: null, audience: "TRAINER", tierRank: 10,
  defaultPlan: false, highlightLabel: null, current: false, active: true, visible: false, prices: [], benefits: [],
  ...overrides,
})

describe("parseLimit", () => {
  it("reads empty as unlimited and rejects anything that is not a whole number", () => {
    expect(parseLimit("")).toEqual({ ok: true, value: null })
    expect(parseLimit(" 15 ")).toEqual({ ok: true, value: 15 })
    expect(parseLimit("0")).toEqual({ ok: true, value: 0 })
    expect(parseLimit("-1")).toEqual({ ok: false })
    expect(parseLimit("1.5")).toEqual({ ok: false })
    expect(parseLimit("diez")).toEqual({ ok: false })
  })
})

describe("groupByAudience", () => {
  it("lists students, trainers, merchants, each cheapest tier first", () => {
    const groups = groupByAudience([
      plan({ id: 1, code: "TRAINER_PRO", tierRank: 10 }),
      plan({ id: 2, code: "STUDENT_FREE", audience: "STUDENT", tierRank: 0 }),
      plan({ id: 3, code: "TRAINER_FREE", tierRank: 0 }),
    ])
    expect(groups.map((g) => [g.audience, g.plans.map((p) => p.code)])).toEqual([
      ["STUDENT", ["STUDENT_FREE"]],
      ["TRAINER", ["TRAINER_FREE", "TRAINER_PRO"]],
    ])
  })
})

describe("canPublish and canReconcile", () => {
  it("needs an active price to publish a paid plan", () => {
    expect(canPublish(plan({}))).toBe(false)
    expect(canPublish(plan({ defaultPlan: true }))).toBe(true)
    expect(canPublish(plan({ prices: [{ id: 1, billingPeriod: "MONTHLY", amount: 1, currency: "ARS", trialDays: 0,
      label: null, active: true, validFrom: "", validTo: null, appStoreProductId: null, playStoreProductId: null }] }))).toBe(true)
  })

  it("only reconciles what has a remote counterpart", () => {
    const base = { id: 1, userId: 1, userEmail: null, planCode: "X", status: "ACTIVE" as const, billingPeriod: null,
      amount: 0, currentPeriodEnd: null, cancelAtPeriodEnd: false, cancelledAt: null, cancelReason: null,
      endedAt: null, createdAt: "" }
    expect(canReconcile({ ...base, provider: "MERCADO_PAGO", externalId: "pre-1" })).toBe(true)
    expect(canReconcile({ ...base, provider: "MANUAL", externalId: null })).toBe(false)
  })
})

describe("metrics formatting", () => {
  it("shows a rate as a percentage, or a dash when there is nothing to divide by", () => {
    expect(percent(0.0453)).toBe("4,5 %")
    expect(percent(null)).toBe("—")
  })

  it("splits composite keys", () => {
    expect(splitKey("MERCADO_PAGO:ARS")).toEqual(["MERCADO_PAGO", "ARS"])
    expect(splitKey("SOLO")).toEqual(["SOLO", ""])
  })
})

describe("grantEndsAt", () => {
  it("counts whole days from now", () => {
    expect(grantEndsAt(30, new Date("2026-10-04T12:00:00Z"))).toBe("2026-11-03T12:00:00.000Z")
  })
})
