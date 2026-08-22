"use client"

import { ArrowRight, Clock, Loader2, RotateCcw, Send, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { billingSuffix } from "@/features/subscription-plans/model/subscription-plan.model"
import { formatCurrency, formatDate } from "@/lib/format"
import {
  useCancelInvitation,
  useInvitationCounts,
  useResendInvitation,
  useSentInvitations,
} from "../hooks/use-plan-invitations"
import {
  INVITATION_FILTERS,
  canCancel,
  canResend,
  daysUntilExpiry,
  isAwaitingPayment,
  isEnrolled,
  type InvitationStatus,
  type PlanInvitation,
} from "../model/plan-invitation.model"
import { InviteStudentSheet } from "./invite-student-sheet"
import { InvitationStatusBadge } from "./invitation-status-badge"

/** `null` (the "all" filter) has no place in a tab value, so it travels as this. */
const ALL = "ALL"

function toStatus(value: string): InvitationStatus | null {
  return value === ALL ? null : (value as InvitationStatus)
}

export function InvitationsScreen() {
  const [tab, setTab] = useState<string>("PENDING")
  const [inviteOpen, setInviteOpen] = useState(false)

  const counts = useInvitationCounts()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body text-muted-foreground text-pretty">
          Ofrece tus planes a alumnos concretos y sigue el estado de cada propuesta.
        </p>
        <Button onClick={() => setInviteOpen(true)} className="sm:shrink-0">
          <Send className="size-4" />
          Enviar plan
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
        <TabsList className="w-full sm:w-fit">
          {INVITATION_FILTERS.map((filter) => {
            const value = filter.value ?? ALL
            const count =
              filter.value === "PENDING"
                ? counts?.pending
                : filter.value === "ACCEPTED"
                  ? counts?.accepted
                  : filter.value === "REJECTED"
                    ? counts?.rejected
                    : undefined

            return (
              <TabsTrigger key={value} value={value}>
                {filter.label}
                {count !== undefined && count > 0 && (
                  <span className="ml-1 rounded-full bg-secondary px-1.5 text-caption font-semibold">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/*
          One panel, whose value tracks the active tab. Rendering four would
          either mount four lists (four requests) or rely on the primitive's
          unmount behaviour; this keeps the tab/panel association correct with
          exactly one query in flight.
        */}
        <TabsContent value={tab} className="pt-4">
          <InvitationList status={toStatus(tab)} onInvite={() => setInviteOpen(true)} />
        </TabsContent>
      </Tabs>

      <InviteStudentSheet open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  )
}

function InvitationList({
  status,
  onInvite,
}: {
  status: InvitationStatus | null
  onInvite: () => void
}) {
  const list = useSentInvitations(status)
  const cancel = useCancelInvitation()
  const resend = useResendInvitation()
  const [pendingCancel, setPendingCancel] = useState<PlanInvitation | null>(null)

  if (list.isLoading) {
    return (
      <ul className="flex flex-col gap-3">
        {[0, 1, 2].map((key) => (
          <li key={key}>
            <Skeleton className="h-28 w-full rounded-xl" />
          </li>
        ))}
      </ul>
    )
  }

  if (list.isError) {
    return <ErrorState error={list.error} onRetry={() => list.refetch()} />
  }

  if (list.invitations.length === 0) {
    return (
      <EmptyState
        icon={Send}
        title={status === null ? "Aún no has enviado invitaciones" : "No hay invitaciones aquí"}
        description="Busca un alumno, elige uno de tus planes y envíale la propuesta. Aquí verás si la acepta o la rechaza."
        actionLabel="Enviar plan"
        onAction={onInvite}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {list.invitations.map((invitation) => (
          <InvitationRow
            key={invitation.id}
            invitation={invitation}
            busy={cancel.isPending || resend.isPending}
            onCancel={() => setPendingCancel(invitation)}
            onResend={() => resend.mutate(invitation.id)}
          />
        ))}
      </ul>

      {list.hasNextPage && (
        <Button
          variant="outline"
          className="self-center"
          disabled={list.isFetchingNextPage}
          onClick={() => list.fetchNextPage()}
        >
          {list.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
          {list.isFetchingNextPage ? "Cargando…" : "Cargar más"}
        </Button>
      )}

      <ConfirmDialog
        open={pendingCancel !== null}
        onOpenChange={(open) => !open && setPendingCancel(null)}
        title={`¿Cancelar la invitación a ${pendingCancel?.student.name ?? ""}?`}
        description="El alumno dejará de poder aceptarla. Podrás volver a enviársela cuando quieras."
        confirmLabel="Cancelar invitación"
        destructive
        loading={cancel.isPending}
        onConfirm={() => {
          if (!pendingCancel) return
          cancel.mutate(pendingCancel.id, { onSettled: () => setPendingCancel(null) })
        }}
      />
    </div>
  )
}

function InvitationRow({
  invitation,
  busy,
  onCancel,
  onResend,
}: {
  invitation: PlanInvitation
  busy: boolean
  onCancel: () => void
  onResend: () => void
}) {
  const daysLeft = daysUntilExpiry(invitation)

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <UserAvatar
          name={invitation.student.name}
          src={invitation.student.avatarUrl}
          className="size-10"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{invitation.student.name}</p>
          <p className="truncate text-body text-muted-foreground">
            {invitation.plan.name} · {formatCurrency(invitation.plan.price)}
            {billingSuffix(invitation.plan.billingPeriod)}
          </p>
          <p className="mt-0.5 text-caption text-muted-foreground">
            Enviada el {formatDate(invitation.createdAt)}
            {daysLeft !== null &&
              (daysLeft === 0
                ? " · caduca hoy"
                : ` · caduca en ${daysLeft} ${daysLeft === 1 ? "día" : "días"}`)}
            {invitation.respondedAt &&
              ` · respondida el ${formatDate(invitation.respondedAt)}`}
          </p>
        </div>

        <InvitationStatusBadge status={invitation.status} />
      </div>

      {invitation.rejectionReason && (
        <p className="rounded-lg border border-border bg-secondary/40 p-3 text-body text-muted-foreground text-pretty">
          <span className="font-medium text-foreground">Motivo del rechazo: </span>
          {invitation.rejectionReason}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
        {/*
          Accepting is not enrolling: a paid plan leaves the subscription in
          PENDING_PAYMENT, and offering "Ver alumno" there would present someone
          who has not paid as a student. Say what is actually happening instead.
        */}
        {isAwaitingPayment(invitation) && (
          <p className="mr-auto flex items-center gap-1.5 text-caption text-muted-foreground">
            <Clock className="size-3.5" />
            Aceptada · pendiente de pago
          </p>
        )}

        {isEnrolled(invitation) && invitation.subscriptionId !== null && (
          <Button variant="ghost" size="sm" render={<Link href={`/dashboard/students/${invitation.subscriptionId}`} />}>
            Ver alumno
            <ArrowRight className="size-4" />
          </Button>
        )}

        {canResend(invitation.status) && (
          <Button variant="outline" size="sm" disabled={busy} onClick={onResend}>
            <RotateCcw className="size-4" />
            Reenviar
          </Button>
        )}

        {canCancel(invitation.status) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-error-text focus-visible:text-error-text"
            disabled={busy}
            onClick={onCancel}
          >
            <Trash2 className="size-4" />
            Cancelar
          </Button>
        )}
      </div>
    </li>
  )
}
