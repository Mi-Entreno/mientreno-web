"use client"

import { ArrowLeft, Pause, Play } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { ErrorState } from "@/components/dashboard/error-state"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/format"
import { billingSuffix } from "@/features/subscription-plans/model/subscription-plan.model"
import { NutritionPlanTab } from "@/features/nutrition-plans/components/nutrition-plan-tab"
import { ProgressTab } from "@/features/progress/components/progress-tab"
import { TrainingPlanTab } from "@/features/training-plans/components/training-plan-tab"
import { WorkoutSessionSheet } from "@/features/workout-sessions/components/workout-session-sheet"
import { useStudents, useSubscriptionDetail, useSubscriptionStatus } from "../hooks/use-students"
import { canPause, canResume } from "../model/student.model"

const TABS = ["summary", "training", "nutrition", "progress"] as const

/**
 * Student detail as a route rather than a drawer.
 *
 * The old drawer fired six queries at once the moment it opened, could not be
 * linked to, and did not survive a refresh. Phases 4, 5 and 9 add training,
 * nutrition and progress here, so each tab loads on demand instead.
 */
export function StudentDetailScreen({ subscriptionId }: { subscriptionId: number }) {
  const { data, isLoading, isError, error, refetch } = useSubscriptionDetail(subscriptionId)
  const { trackPaused, untrackPaused } = useStudents()
  const status = useSubscriptionStatus({ onPaused: trackPaused, onResumed: untrackPaused })

  const params = useSearchParams()
  const router = useRouter()

  // The consolidated plans view links straight to a tab.
  const requestedTab = params.get("tab")
  const defaultTab = TABS.find((tab) => tab === requestedTab) ?? "summary"

  // `?session=<id>` is the only entry point to a workout session today: nothing
  // lists them for a trainer (see workout-sessions.repository.ts).
  const requestedSession = Number(params.get("session"))
  const sessionId = Number.isInteger(requestedSession) && requestedSession > 0
    ? requestedSession
    : null

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      <header className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <UserAvatar name={data.studentName} src={data.studentAvatarUrl} className="size-14" />
          <div className="min-w-0">
            <h2 className="truncate font-heading text-subtitle font-semibold tracking-tight">
              {data.studentName}
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <StatusBadge status={data.status} />
              {data.plan && (
                <span className="text-body text-muted-foreground">
                  {data.plan.name} · {formatCurrency(data.plan.price)}
                  {billingSuffix(data.plan.billingPeriod)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 sm:shrink-0">
          {canPause(data.status) && (
            <Button
              variant="outline"
              disabled={status.isPending}
              onClick={() => status.mutate({ subscriptionId, action: "pause" })}
            >
              <Pause className="size-4" />
              Pausar
            </Button>
          )}
          {canResume(data.status) && (
            <Button
              variant="outline"
              disabled={status.isPending}
              onClick={() => status.mutate({ subscriptionId, action: "resume" })}
            >
              <Play className="size-4" />
              Reanudar
            </Button>
          )}
        </div>
      </header>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="training">Entrenamiento</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrición</TabsTrigger>
          <TabsTrigger value="progress">Progreso</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="pt-4">
          <dl className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
            <Field label="Inicio" value={formatDate(data.startedAt ?? undefined)} />
            <Field label="Caducidad" value={formatDate(data.expiresAt ?? undefined)} />
            {data.cancelledAt && (
              <Field label="Cancelada" value={formatDate(data.cancelledAt)} />
            )}
            <Field
              label="Plazas del plan"
              value={
                data.plan?.maxStudents === null || data.plan === null
                  ? "Sin límite"
                  : String(data.plan.maxStudents)
              }
            />
            <Field
              label="Incluye nutrición"
              value={data.plan?.includesNutrition ? "Sí" : "No"}
            />
            {data.paymentProvider && (
              <Field label="Pasarela de pago" value={data.paymentProvider} />
            )}
          </dl>
        </TabsContent>

        <TabsContent value="training" className="pt-4">
          <TrainingPlanTab subscriptionId={subscriptionId} />
        </TabsContent>

        <TabsContent value="nutrition" className="pt-4">
          <NutritionPlanTab
            subscriptionId={subscriptionId}
            // The backend does not gate on this, so it drives a warning only.
            planIncludesNutrition={data.plan?.includesNutrition ?? true}
          />
        </TabsContent>

        <TabsContent value="progress" className="pt-4">
          <ProgressTab subscriptionId={subscriptionId} />
        </TabsContent>
      </Tabs>

      <WorkoutSessionSheet
        sessionId={sessionId}
        onOpenChange={(open) => {
          // Clearing the param is what closes it, so the URL stays the source
          // of truth for this sheet.
          if (!open) router.replace(`/dashboard/students/${subscriptionId}?tab=progress`)
        }}
      />
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/dashboard/students"
      className="flex w-fit items-center gap-1.5 text-body text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Volver a mis alumnos
    </Link>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-body font-medium">{value}</dd>
    </div>
  )
}
