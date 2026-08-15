"use client"

import { ArrowRight, Salad, Users } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/dashboard/empty-state"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/format"
import { useTrainerStudentNutrition } from "../hooks/use-nutrition-plans"
import { sumMealMacros, type StudentNutritionSummary } from "../model/nutrition-plan.model"

/** Consolidated view from `GET /api/nutrition-plans/trainer/students`. */
export function TrainerNutritionScreen() {
  const { data, isLoading, isError } = useTrainerStudentNutrition()

  if (isLoading) {
    return (
      <ul className="flex flex-col gap-3">
        {[0, 1, 2].map((key) => (
          <li key={key}>
            <Skeleton className="h-24 w-full rounded-xl" />
          </li>
        ))}
      </ul>
    )
  }

  if (isError) {
    return <p className="text-body text-error-text">No se han podido cargar los planes.</p>
  }

  const rows = data ?? []

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aún no tienes alumnos activos"
        description="Cuando un alumno se suscriba podrás asignarle un plan nutricional."
      />
    )
  }

  const pending = rows.filter((row) => row.currentPlan === null)
  const assigned = rows.filter((row) => row.currentPlan !== null)

  return (
    <div className="flex flex-col gap-8">
      {pending.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-subtitle font-semibold tracking-tight">
            Pendientes de asignar
            <Badge variant="secondary" className="ml-2">
              {pending.length}
            </Badge>
          </h2>
          <ul className="flex flex-col gap-3">
            {pending.map((row) => (
              <NutritionRow key={row.subscriptionId} row={row} />
            ))}
          </ul>
        </section>
      )}

      {assigned.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-subtitle font-semibold tracking-tight">
            Con plan asignado
          </h2>
          <ul className="flex flex-col gap-3">
            {assigned.map((row) => (
              <NutritionRow key={row.subscriptionId} row={row} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function NutritionRow({ row }: { row: StudentNutritionSummary }) {
  // No plan-level calories exist upstream, so the headline figure is summed
  // from the meals.
  const totals = row.currentPlan ? sumMealMacros(row.currentPlan.meals) : null

  return (
    <li>
      <Link
        href={`/dashboard/students/${row.subscriptionId}?tab=nutrition`}
        className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-input focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <UserAvatar name={row.studentName} src={row.studentAvatarUrl} className="size-10" />

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{row.studentName}</p>
          {row.currentPlan && totals ? (
            <p className="truncate text-body text-muted-foreground">
              {row.currentPlan.title} · v{row.currentPlan.version} ·{" "}
              {row.currentPlan.meals.length}{" "}
              {row.currentPlan.meals.length === 1 ? "comida" : "comidas"}
              {totals.calories > 0 && ` · ${totals.calories} kcal`}
              {` · ${formatDate(row.currentPlan.createdAt)}`}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-body text-muted-foreground">
              <Salad className="size-3.5" />
              Sin plan nutricional
            </p>
          )}
        </div>

        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  )
}
