"use client"

import { AlertTriangle, Pause, Play, Send, Users } from "lucide-react"
import Link from "next/link"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { InviteStudentSheet } from "@/features/plan-invitations/components/invite-student-sheet"
import { formatDate } from "@/lib/format"
import { useState } from "react"
import { useStudentPrefetch, useStudents, useSubscriptionStatus } from "../hooks/use-students"
import { canPause, canResume, type StudentSubscription } from "../model/student.model"

export function StudentsScreen() {
  const { students, isLoading, isError, error, refetch, trackPaused, untrackPaused } = useStudents()
  const prefetch = useStudentPrefetch()
  const [pendingPause, setPendingPause] = useState<StudentSubscription | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)

  const status = useSubscriptionStatus({
    onPaused: trackPaused,
    onResumed: untrackPaused,
  })

  /**
   * The invite action lives above every branch on purpose.
   *
   * "Aún no tienes alumnos" is exactly the state in which a trainer most needs
   * to send an invitation, and it used to be an early return with no way out.
   */
  const header = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href="/dashboard/invitations"
        className="text-body text-muted-foreground underline-offset-4 hover:underline"
      >
        Ver invitaciones enviadas
      </Link>
      <Button onClick={() => setInviteOpen(true)} className="sm:shrink-0">
        <Send className="size-4" />
        Invitar alumno
      </Button>
    </div>
  )

  const inviteSheet = <InviteStudentSheet open={inviteOpen} onOpenChange={setInviteOpen} />

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <ul className="flex flex-col gap-3">
          {[0, 1, 2].map((key) => (
            <li key={key}>
              <Skeleton className="h-20 w-full rounded-xl" />
            </li>
          ))}
        </ul>
        {inviteSheet}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <ErrorState error={error} onRetry={refetch} />
        {inviteSheet}
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {header}
        <EmptyState
          icon={Users}
          title="Aún no tienes alumnos"
          description="Invita a un alumno a uno de tus planes, o espera a que alguien se suscriba desde el directorio."
          actionLabel="Invitar alumno"
          onAction={() => setInviteOpen(true)}
        />
        {inviteSheet}
      </div>
    )
  }

  const hasPaused = students.some((student) => student.status === "PAUSED")

  return (
    <div className="flex flex-col gap-4">
      {header}

      {hasPaused && (
        <p className="flex items-start gap-2 rounded-lg border border-warning bg-warning-surface p-3 text-body text-warning-text">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {/* getActiveByTrainer filters to ACTIVE, so paused subscriptions are
              only visible because this browser remembers them. The user does
              not need to know that — only that this list is the safe place to
              resume them from. */}
          <span className="text-pretty">
            Tenés suscripciones pausadas. Reanudalas desde acá para no perderlas de vista.
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
              <UserAvatar
                name={student.studentName}
                src={student.studentAvatarUrl}
                className="size-10"
              />

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

      {inviteSheet}
    </div>
  )
}
