"use client"

import { Badge } from "@/components/ui/badge"
import {
  sumMealMacros,
  timeOfDayLabel,
  type Meal,
  type NutritionPlan,
} from "../model/nutrition-plan.model"
import { PlanTotalsBar } from "./plan-totals-bar"

export function NutritionPlanView({ plan }: { plan: NutritionPlan }) {
  const totals = sumMealMacros(plan.meals)

  return (
    <div className="flex flex-col gap-4">
      {plan.notes && (
        <p className="whitespace-pre-line rounded-xl border border-border bg-card p-4 text-body text-muted-foreground text-pretty">
          {plan.notes}
        </p>
      )}

      <PlanTotalsBar totals={totals} mealCount={plan.meals.length} />

      <ul className="flex flex-col gap-4">
        {plan.meals.map((meal) => (
          <MealView key={meal.id} meal={meal} />
        ))}
      </ul>
    </div>
  )
}

function MealView({ meal }: { meal: Meal }) {
  const macros = buildMacroLine(meal)

  return (
    <li className="rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-heading text-body-lg font-semibold tracking-tight">{meal.name}</h3>
          <Badge variant="secondary" className="mt-1.5">
            {timeOfDayLabel(meal.timeOfDay)}
          </Badge>
        </div>
        {macros && <p className="text-body text-muted-foreground">{macros}</p>}
      </div>

      {meal.foods.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1.5">
          {meal.foods.map((food) => (
            <li
              key={food.id}
              className="flex items-baseline justify-between gap-4 border-b border-border pb-1.5 last:border-0 last:pb-0"
            >
              <span className="text-body">{food.foodName}</span>
              <span className="shrink-0 text-body text-muted-foreground">
                {food.quantity} {food.unit}
              </span>
            </li>
          ))}
        </ul>
      )}

      {meal.notes && (
        <p className="mt-3 whitespace-pre-line text-body text-muted-foreground text-pretty">
          {meal.notes}
        </p>
      )}
    </li>
  )
}

/** Skips macros the trainer left blank rather than printing them as zero. */
function buildMacroLine(meal: Meal): string | null {
  const parts: string[] = []

  if (meal.calories !== null) parts.push(`${meal.calories} kcal`)
  if (meal.proteinG !== null) parts.push(`P ${meal.proteinG}g`)
  if (meal.carbsG !== null) parts.push(`C ${meal.carbsG}g`)
  if (meal.fatG !== null) parts.push(`G ${meal.fatG}g`)

  return parts.length > 0 ? parts.join(" · ") : null
}
