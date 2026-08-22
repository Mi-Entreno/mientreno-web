"use client"

import { ArrowRight, Dumbbell, Users } from "lucide-react"
import Link from "next/link"

import { ErrorState } from "@/components/dashboard/error-state"
import { EmptyState } from "@/components/dashboard/empty-state"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/format"
import { useTrainerStudentPlans } from "../hooks/use-training-plans"
import type { StudentPlanSummary } from "../model/training-plan.model"

/**
 * One row per active student with their current plan — the consolidated view
 * `GET /api/training-plans/trainer/students` was built for.
 *
 * This replaces a grid of hardcoded cards whose "Nuevo plan" button could never
 * work: `CreateTrainingPlanRequestDTO.subscriptionId` is `@NotNull`, so a plan
 * cannot exist without a student. Here the student is the entry point, and the
 * most useful thing on screen is who has no plan yet.
 */
export function TrainerPlansScreen() {
  const { data, isLoading, isError, error, refetch } = useTrainerStudentPlans()

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
    return <ErrorState error={error} onRetry={() => refetch()} />
  }

  const rows = data ?? []

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aún no tienes alumnos activos"
        description="Cuando un alumno se suscriba a uno de tus planes podrás asignarle un programa."
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
              <StudentPlanRow key={row.subscriptionId} row={row} />
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
              <StudentPlanRow key={row.subscriptionId} row={row} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function StudentPlanRow({ row }: { row: StudentPlanSummary }) {
  const dayCount = row.currentPlan?.days.length ?? 0

  return (
    <li>
      <Link
        href={`/dashboard/students/${row.subscriptionId}?tab=training`}
        className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-input focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <UserAvatar name={row.studentName} src={row.studentAvatarUrl} className="size-10" />

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{row.studentName}</p>
          {row.currentPlan ? (
            <p className="truncate text-body text-muted-foreground">
              {row.currentPlan.title} · v{row.currentPlan.version} · {dayCount}{" "}
              {dayCount === 1 ? "día" : "días"} · {formatDate(row.currentPlan.createdAt)}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-body text-muted-foreground">
              <Dumbbell className="size-3.5" />
              Sin plan asignado
            </p>
          )}
        </div>

        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  )
}
