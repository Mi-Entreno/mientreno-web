"use client"

import { Apple, Check, CreditCard, Users } from "lucide-react"
import Link from "next/link"

import { ErrorState } from "@/components/dashboard/error-state"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useMyPlans } from "@/features/subscription-plans/hooks/use-subscription-plans"
import {
  billingLabel,
  billingSuffix,
  type SubscriptionPlan,
} from "@/features/subscription-plans/model/subscription-plan.model"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"

interface PlanPickerProps {
  selectedId: number | null
  onSelect: (plan: SubscriptionPlan) => void
}

/**
 * The trainer's own plans, as radio-like cards.
 *
 * Reuses `useMyPlans` rather than re-fetching: the plans screen has usually
 * warmed that cache already, so this step renders instantly in the common path.
 */
export function PlanPicker({ selectedId, onSelect }: PlanPickerProps) {
  const { data: plans, isLoading, isError, error, refetch } = useMyPlans()

  if (isLoading) {
    return (
      <ul className="flex flex-col gap-2">
        {[0, 1].map((key) => (
          <li key={key}>
            <Skeleton className="h-24 w-full rounded-xl" />
          </li>
        ))}
      </ul>
    )
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => refetch()} inline />
  }

  if (!plans || plans.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
        <CreditCard className="size-6 text-muted-foreground" />
        <p className="text-body text-muted-foreground text-pretty">
          No tienes ningún plan de suscripción, así que no hay nada que ofrecer todavía.
        </p>
        <Link
          href="/dashboard/plans"
          className="text-body font-medium underline underline-offset-4"
        >
          Crear un plan
        </Link>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-2" role="listbox" aria-label="Planes disponibles">
      {plans.map((plan) => {
        const selected = plan.id === selectedId

        return (
          // See `student-search-panel`: the `li` is presentational so the
          // listbox owns its options directly.
          <li key={plan.id} role="presentation">
            <button
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(plan)}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                selected
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-input",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{plan.name}</p>
                  <Badge variant="secondary">{billingLabel(plan.billingPeriod)}</Badge>
                </div>

                <p className="mt-1 text-body-lg font-semibold tracking-tight">
                  {formatCurrency(plan.price)}
                  <span className="text-body font-normal text-muted-foreground">
                    {billingSuffix(plan.billingPeriod)}
                  </span>
                </p>

                {plan.description && (
                  <p className="mt-1 line-clamp-2 text-body text-muted-foreground text-pretty">
                    {plan.description}
                  </p>
                )}

                <ul className="mt-2 flex flex-wrap gap-3 text-caption text-muted-foreground">
                  <li className="flex items-center gap-1.5">
                    <Users className="size-3.5" />
                    {plan.maxStudents === null ? "Sin límite" : `${plan.maxStudents} plazas`}
                  </li>
                  {plan.includesNutrition && (
                    <li className="flex items-center gap-1.5">
                      <Apple className="size-3.5" />
                      Con nutrición
                    </li>
                  )}
                </ul>
              </div>

              {selected && (
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="size-4" />
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
