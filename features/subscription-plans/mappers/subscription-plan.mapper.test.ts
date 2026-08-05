import { describe, expect, it } from "vitest"

import type { SubscriptionPlanResponseDTO } from "../dto/subscription-plan.dto"
import type { PlanFormValues } from "../model/subscription-plan.model"
import { toCreatePlanRequest, toPlanFormValues, toSubscriptionPlan } from "./subscription-plan.mapper"

const DTO: SubscriptionPlanResponseDTO = {
  id: 3,
  name: "Plan Premium",
  description: "Todo incluido",
  price: 49.9,
  // BillingPeriod.java is MONTHLY | QUARTERLY | YEARLY — never ANNUAL, which is
  // what the pre-API types assumed.
  billingPeriod: "YEARLY",
  maxStudents: 20,
  includesNutrition: true,
}

describe("toSubscriptionPlan", () => {
  it("maps the response", () => {
    expect(toSubscriptionPlan(DTO)).toEqual({
      id: 3,
      name: "Plan Premium",
      description: "Todo incluido",
      price: 49.9,
      billingPeriod: "YEARLY",
      maxStudents: 20,
      includesNutrition: true,
    })
  })

  it("keeps a null cap as null rather than zero", () => {
    // null means "no limit"; 0 would read as "no places left".
    const plan = toSubscriptionPlan({ ...DTO, maxStudents: null, description: null })

    expect(plan.maxStudents).toBeNull()
    expect(plan.description).toBe("")
  })
})

describe("toPlanFormValues", () => {
  it("renders an absent cap as an empty input", () => {
    const values = toPlanFormValues(toSubscriptionPlan({ ...DTO, maxStudents: null }))

    expect(values.maxStudents).toBe("")
    expect(values.price).toBe("49.9")
  })
})

describe("toCreatePlanRequest", () => {
  const FORM: PlanFormValues = {
    name: "  Plan Premium  ",
    description: "  ",
    price: "49,90",
    billingPeriod: "QUARTERLY",
    maxStudents: "",
    includesNutrition: false,
  }

  it("accepts a comma decimal separator", () => {
    expect(toCreatePlanRequest(FORM).price).toBe(49.9)
  })

  it("trims the name and nulls a blank description", () => {
    const request = toCreatePlanRequest(FORM)

    expect(request.name).toBe("Plan Premium")
    expect(request.description).toBeNull()
  })

  it("sends null for an unset cap, meaning no limit", () => {
    expect(toCreatePlanRequest(FORM).maxStudents).toBeNull()
  })

  it("sends a numeric cap when one is given", () => {
    expect(toCreatePlanRequest({ ...FORM, maxStudents: "15" }).maxStudents).toBe(15)
  })

  it("carries the billing period through unchanged", () => {
    expect(toCreatePlanRequest(FORM).billingPeriod).toBe("QUARTERLY")
  })
})
