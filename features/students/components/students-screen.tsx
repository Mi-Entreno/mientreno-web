"use client"

import { AlertTriangle, Pause, Play, Search, Send, Users } from "lucide-react"
import Link from "next/link"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { InviteStudentSheet } from "@/features/plan-invitations/components/invite-student-sheet"
import { useInvitationCounts } from "@/features/plan-invitations/hooks/use-plan-invitations"
import { formatDate } from "@/lib/format"
import { useState } from "react"
import { useStudentPrefetch, useStudents, useSubscriptionStatus } from "../hooks/use-students"
import { canPause, canResume, type StudentSubscription } from "../model/student.model"

export function StudentsScreen() {
  const { students, isLoading, isError, error, refetch, trackPaused, untrackPaused } = useStudents()
  const prefetch = useStudentPrefetch()
  const [pendingPause, setPendingPause] = useState<StudentSubscription | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [term, setTerm] = useState("")

  const status = useSubscriptionStatus({
    onPaused: trackPaused,
    onResumed: untrackPaused,
  })

  // Turns a mute link into one that says whether anything is waiting.
  const pendingInvitations = useInvitationCounts()?.pending ?? 0

  /**
   * The one place in the app that starts an invitation.
   *
   * It sits above every branch because "todavía no tenés alumnos" is exactly
   * the state in which a trainer most needs to send one, and the empty state
   * below deliberately does not repeat the button: two identical calls to
   * action, both on screen at once, was the confusion this screen shipped with.
   */
  const header = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Link
        href="/dashboard/invitations"
        className="flex w-fit items-center gap-2 text-body text-muted-foreground underline-offset-4 hover:underline"
      >
        Invitaciones enviadas
        {pendingInvitations > 0 && (
          <span className="rounded-full bg-secondary px-2 text-caption font-semibold text-foreground">
            {pendingInvitations} pendiente{pendingInvitations === 1 ? "" : "s"}
          </span>
        )}
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
          title="Todavía no tenés alumnos"
          description="Invitá a alguien a uno de tus planes con el botón de arriba, o esperá a que se suscriban desde el directorio."
        />
        {inviteSheet}
      </div>
    )
  }

  const hasPaused = students.some((student) => student.status === "PAUSED")

  /**
   * Filtered in memory rather than through the API.
   *
   * `GET /api/subscriptions/students` returns the trainer's whole roster in one
   * page, so a request per keystroke would buy nothing and cost a spinner. The
   * search box that *does* hit the network is the one inside the invite wizard,
   * which looks for people who are not students yet.
   */
  const query = term.trim().toLowerCase()
  const visible = query
    ? students.filter(
        (student) =>
          student.studentName.toLowerCase().includes(query) ||
          (student.plan?.name ?? "").toLowerCase().includes(query),
      )
    : students

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

      <div className="flex flex-col gap-2">
        <Label htmlFor="student-search" className="sr-only">
          Buscar alumno
        </Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="student-search"
            type="search"
            value={term}
            placeholder="Buscar por nombre o plan"
            className="pl-9"
            onChange={(event) => setTerm(event.target.value)}
          />
        </div>
      </div>

      {visible.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-4 text-body text-muted-foreground">
          Ningún alumno coincide con “{term.trim()}”.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {visible.map((student) => (
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
