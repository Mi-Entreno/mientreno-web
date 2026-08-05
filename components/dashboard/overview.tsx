"use client"

import { Apple, CreditCard, Dumbbell, PauseCircle, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMyPlans } from "@/features/subscription-plans/hooks/use-subscription-plans"
import { useStudents } from "@/features/students/hooks/use-students"
import { EmptyState } from "./empty-state"
import { StatCard } from "./stat-card"

export function Overview() {
  const { students, isLoading } = useStudents()
  const plans = useMyPlans()

  const activeCount = students.filter((student) => student.status === "ACTIVE").length
  const pausedCount = students.filter((student) => student.status === "PAUSED").length

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
        The training and nutrition summaries used to render here from invented
        types — `TrainingPlanRow` never matched `TrainerStudentPlanSummaryDTO`.
        Phases 4 and 5 rebuild them against the real contracts.
      */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-body-lg">
              <Dumbbell className="size-4 text-primary-text" />
              Alumnos — Planes de entrenamiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Dumbbell}
              title="Resumen de entrenamiento"
              description="Llega en la fase 4, con la vista consolidada del plan actual de cada alumno."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-body-lg">
              <Apple className="size-4 text-primary-text" />
              Alumnos — Planes de nutrición
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Apple}
              title="Resumen de nutrición"
              description="Llega en la fase 5, con las comidas y los macros de cada alumno."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
