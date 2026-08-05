"use client"

import { AlertTriangle, Pause, Play, Users } from "lucide-react"
import Link from "next/link"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { EmptyState } from "@/components/dashboard/empty-state"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/format"
import { useState } from "react"
import { useStudentPrefetch, useStudents, useSubscriptionStatus } from "../hooks/use-students"
import { canPause, canResume, type StudentSubscription } from "../model/student.model"

function initialsOf(name: string): string {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A"
  )
}

export function StudentsScreen() {
  const { students, isLoading, isError, trackPaused, untrackPaused } = useStudents()
  const prefetch = useStudentPrefetch()
  const [pendingPause, setPendingPause] = useState<StudentSubscription | null>(null)

  const status = useSubscriptionStatus({
    onPaused: trackPaused,
    onResumed: untrackPaused,
  })

  if (isLoading) {
    return (
      <ul className="flex flex-col gap-3">
        {[0, 1, 2].map((key) => (
          <li key={key}>
            <Skeleton className="h-20 w-full rounded-xl" />
          </li>
        ))}
      </ul>
    )
  }

  if (isError) {
    return <p className="text-body text-error-text">No se han podido cargar tus alumnos.</p>
  }

  if (students.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aún no tienes alumnos"
        description="Cuando un alumno se suscriba a uno de tus planes aparecerá aquí."
      />
    )
  }

  const hasPaused = students.some((student) => student.status === "PAUSED")

  return (
    <div className="flex flex-col gap-4">
      {hasPaused && (
        <p className="flex items-start gap-2 rounded-lg border border-warning bg-warning-surface p-3 text-body text-warning-text">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {/* getActiveByTrainer filters to ACTIVE, so paused subscriptions are
              only visible because this browser remembers them. */}
          <span className="text-pretty">
            Las suscripciones pausadas solo se listan en este navegador hasta que el backend las
            incluya. Reanúdalas desde aquí para no perderlas de vista.
          </span>
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {students.map((student) => (
          <li
            key={student.subscriptionId}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <Link
              href={`/dashboard/students/${student.subscriptionId}`}
              onMouseEnter={() => prefetch(student.subscriptionId)}
              onFocus={() => prefetch(student.subscriptionId)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <Avatar className="size-10 shrink-0">
                <AvatarImage src={student.studentAvatarUrl ?? "/placeholder.svg"} alt="" />
                <AvatarFallback>{initialsOf(student.studentName)}</AvatarFallback>
              </Avatar>

              <div className="min-w-0">
                <p className="truncate font-medium">{student.studentName}</p>
                <p className="truncate text-body text-muted-foreground">
                  {student.plan?.name ?? "Sin plan"}
                  {student.expiresAt && ` · caduca ${formatDate(student.expiresAt)}`}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-3 sm:shrink-0">
              <StatusBadge status={student.status} />

              {canPause(student.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={status.isPending}
                  onClick={() => setPendingPause(student)}
                >
                  <Pause className="size-4" />
                  Pausar
                </Button>
              )}

              {canResume(student.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={status.isPending}
                  onClick={() =>
                    status.mutate({ subscriptionId: student.subscriptionId, action: "resume" })
                  }
                >
                  <Play className="size-4" />
                  Reanudar
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pendingPause !== null}
        onOpenChange={(open) => !open && setPendingPause(null)}
        title={`¿Pausar la suscripción de ${pendingPause?.studentName ?? ""}?`}
        description="El alumno dejará de tener acceso a sus planes hasta que la reanudes. Podrás reanudarla desde esta misma lista."
        confirmLabel="Pausar"
        loading={status.isPending}
        onConfirm={() => {
          if (!pendingPause) return
          status.mutate(
            { subscriptionId: pendingPause.subscriptionId, action: "pause" },
            { onSettled: () => setPendingPause(null) },
          )
        }}
      />
    </div>
  )
}
