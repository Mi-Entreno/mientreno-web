"use client"

import { Apple, ArrowRight, CreditCard, Dumbbell, PauseCircle, Users, type LucideIcon } from "lucide-react"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useTrainerStudentNutrition } from "@/features/nutrition-plans/hooks/use-nutrition-plans"
import { useMyPlans } from "@/features/subscription-plans/hooks/use-subscription-plans"
import { useStudents } from "@/features/students/hooks/use-students"
import { useTrainerStudentPlans } from "@/features/training-plans/hooks/use-training-plans"
import { StatCard } from "./stat-card"

export function Overview() {
  const { students, isLoading } = useStudents()
  const plans = useMyPlans()
  const training = useTrainerStudentPlans()
  const nutrition = useTrainerStudentNutrition()

  const activeCount = students.filter((student) => student.status === "ACTIVE").length
  const pausedCount = students.filter((student) => student.status === "PAUSED").length

  const trainingPending = (training.data ?? []).filter((row) => row.currentPlan === null).length
  const nutritionPending = (nutrition.data ?? []).filter((row) => row.currentPlan === null).length

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Alumnos activos"
          value={activeCount}
          icon={Users}
          accent="primary"
          loading={isLoading}
        />
        <StatCard
          label="Suscripciones pausadas"
          value={pausedCount}
          icon={PauseCircle}
          accent="warning"
          loading={isLoading}
        />
        <StatCard
          label="Planes de suscripción"
          value={plans.data?.length ?? 0}
          icon={CreditCard}
          loading={plans.isLoading}
        />
        <StatCard
          label="Alumnos totales"
          value={students.length}
          icon={Users}
          loading={isLoading}
        />
      </div>

      {/*
        These two cards used to be placeholders announcing internal delivery
        phases. The consolidated views they were waiting for now exist, so they
        link to them and lead with the number that actually needs attention:
        how many students are still without a plan.
      */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PlanSummaryCard
          icon={Dumbbell}
          title="Planes de entrenamiento"
          href="/dashboard/training-plans"
          pending={trainingPending}
          total={training.data?.length ?? 0}
          isLoading={training.isLoading}
          isError={training.isError}
          emptyLabel="Cuando tengas alumnos activos verás aquí quién necesita rutina."
          pendingLabel="sin rutina asignada"
        />

        <PlanSummaryCard
          icon={Apple}
          title="Planes de nutrición"
          href="/dashboard/nutrition-plans"
          pending={nutritionPending}
          total={nutrition.data?.length ?? 0}
          isLoading={nutrition.isLoading}
          isError={nutrition.isError}
          emptyLabel="Cuando tengas alumnos activos verás aquí quién necesita pauta."
          pendingLabel="sin plan de nutrición"
        />
      </div>
    </div>
  )
}

/**
 * One consolidated view, summarised.
 *
 * Leads with the count of students still waiting for a plan, because that is
 * the only number on this card that asks the trainer to do something. A
 * failure stays quiet: the dashboard is a glance, and the destination screen
 * reports its own problems properly.
 */
function PlanSummaryCard({
  icon: Icon,
  title,
  href,
  pending,
  total,
  isLoading,
  isError,
  emptyLabel,
  pendingLabel,
}: {
  icon: LucideIcon
  title: string
  href: string
  pending: number
  total: number
  isLoading: boolean
  isError: boolean
  emptyLabel: string
  pendingLabel: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-body-lg">
          <Icon className="size-4 text-primary-text" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <Skeleton className="h-12 w-full rounded-lg" />
        ) : isError ? (
          <p className="text-body text-muted-foreground text-pretty">
            No pudimos cargar este resumen. Abrilo para verlo en detalle.
          </p>
        ) : total === 0 ? (
          <p className="text-body text-muted-foreground text-pretty">{emptyLabel}</p>
        ) : pending > 0 ? (
          <p className="text-body text-pretty">
            <span className="text-title font-semibold tracking-tight text-warning-text">
              {pending}
            </span>{" "}
            <span className="text-muted-foreground">
              de {total} {total === 1 ? "alumno" : "alumnos"} {pendingLabel}
            </span>
          </p>
        ) : (
          <p className="text-body text-muted-foreground text-pretty">
            Todos tus alumnos tienen plan al día.
          </p>
        )}

        <Link
          href={href}
          className="flex w-fit items-center gap-1.5 text-body font-medium text-primary-text underline-offset-4 hover:underline"
        >
          Ver detalle
          <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  )
}
