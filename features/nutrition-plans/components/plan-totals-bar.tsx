import { AlertTriangle } from "lucide-react"

import type { PlanTotals } from "../model/nutrition-plan.model"

/**
 * Daily totals for a nutrition plan.
 *
 * The API models no plan-level macros — only meals carry them — so this figure
 * is computed by summing the meals. When a meal has no calories the total
 * understates the plan, which is worth saying rather than showing a number that
 * looks authoritative.
 */
export function PlanTotalsBar({ totals, mealCount }: { totals: PlanTotals; mealCount: number }) {
  if (mealCount === 0) return null

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <p className="text-caption text-muted-foreground">Total diario (suma de las comidas)</p>

      <dl className="flex flex-wrap gap-x-6 gap-y-2">
        <Total label="Calorías" value={totals.calories} unit="kcal" emphasis />
        <Total label="Proteína" value={totals.protein} unit="g" />
        <Total label="Carbohidratos" value={totals.carbs} unit="g" />
        <Total label="Grasas" value={totals.fat} unit="g" />
      </dl>

      {!totals.complete && (
        <p className="flex items-start gap-2 text-caption text-warning-text">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          Alguna comida no tiene calorías, así que el total se queda corto.
        </p>
      )}
    </div>
  )
}

function Total({
  label,
  value,
  unit,
  emphasis,
}: {
  label: string
  value: number
  unit: string
  emphasis?: boolean
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className={emphasis ? "text-subtitle font-semibold tracking-tight" : "text-body font-medium"}>
        {value} {unit}
      </dd>
    </div>
  )
}
