import type { BillingPeriod } from "../dto/subscription-plan.dto"

export interface SubscriptionPlan {
  id: number
  name: string
  description: string
  price: number
  billingPeriod: BillingPeriod
  /** null means no cap on how many students can subscribe. */
  maxStudents: number | null
  includesNutrition: boolean
}

export interface PlanFormValues {
  name: string
  description: string
  /** Kept as a string so an empty input stays empty instead of becoming 0. */
  price: string
  billingPeriod: BillingPeriod
  maxStudents: string
  includesNutrition: boolean
}

export const BILLING_PERIODS: { value: BillingPeriod; label: string; suffix: string }[] = [
  { value: "MONTHLY", label: "Mensual", suffix: "/mes" },
  { value: "QUARTERLY", label: "Trimestral", suffix: "/trimestre" },
  { value: "YEARLY", label: "Anual", suffix: "/año" },
]

export function billingLabel(period: BillingPeriod): string {
  return BILLING_PERIODS.find((item) => item.value === period)?.label ?? period
}

export function billingSuffix(period: BillingPeriod): string {
  return BILLING_PERIODS.find((item) => item.value === period)?.suffix ?? ""
}

export function emptyPlanForm(): PlanFormValues {
  return {
    name: "",
    description: "",
    price: "",
    billingPeriod: "MONTHLY",
    maxStudents: "",
    includesNutrition: false,
  }
}

export type { BillingPeriod }
