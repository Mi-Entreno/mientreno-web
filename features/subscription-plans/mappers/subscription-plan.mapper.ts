import type { CreatePlanRequestDTO, SubscriptionPlanResponseDTO } from "../dto/subscription-plan.dto"
import type { PlanFormValues, SubscriptionPlan } from "../model/subscription-plan.model"

export function toSubscriptionPlan(dto: SubscriptionPlanResponseDTO): SubscriptionPlan {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description ?? "",
    price: dto.price,
    billingPeriod: dto.billingPeriod,
    maxStudents: dto.maxStudents ?? null,
    includesNutrition: dto.includesNutrition,
  }
}

export function toPlanFormValues(plan: SubscriptionPlan): PlanFormValues {
  return {
    name: plan.name,
    description: plan.description,
    price: String(plan.price),
    billingPeriod: plan.billingPeriod,
    maxStudents: plan.maxStudents === null ? "" : String(plan.maxStudents),
    includesNutrition: plan.includesNutrition,
  }
}

/**
 * `CreatePlanRequestDTO` serves both POST and PUT.
 *
 * `price` is `@NotNull @Positive`, so zero and blank are rejected upstream —
 * the form validates for that before getting here. `maxStudents` is genuinely
 * optional and null means "no cap".
 */
export function toCreatePlanRequest(values: PlanFormValues): CreatePlanRequestDTO {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    price: Number(values.price.replace(",", ".")),
    billingPeriod: values.billingPeriod,
    maxStudents: values.maxStudents.trim() ? Number(values.maxStudents) : null,
    includesNutrition: values.includesNutrition,
  }
}
