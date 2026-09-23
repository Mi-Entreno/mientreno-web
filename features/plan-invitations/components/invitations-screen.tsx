"use client"

import { ArrowRight, Clock, RotateCcw, Send, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import { UserAvatar } from "@/components/shared/user-avatar"
import { BarsLoader } from "@/components/ui/bars-loader"
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
import { InvitationStatusBadge } from "./invitation-status-badge"

/** `null` (the "all" filter) has no place in a tab value, so it travels as this. */
const ALL = "ALL"

function toStatus(value: string): InvitationStatus | null {
  return value === ALL ? null : (value as InvitationStatus)
}

export function InvitationsScreen() {
  const [tab, setTab] = useState<string>("PENDING")

  const counts = useInvitationCounts()

  return (
    <div className="flex flex-col gap-6">
      {/*
        No "enviar plan" button here.

        Inviting used to be offered from this screen and from "Mis alumnos",
        which made two sections look like they did the same job. This one is a
        queue: what has been sent, what is still waiting, what was answered.
        Sending starts where the roster is.
      */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body text-muted-foreground text-pretty">
          El estado de cada propuesta que enviaste.
        </p>
        <Link
          href="/dashboard/students"
          className="flex w-fit shrink-0 items-center gap-1.5 text-body font-medium text-primary-text underline-offset-4 hover:underline"
        >
          Ir a mis alumnos
          <ArrowRight className="size-3.5" />
        </Link>
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
          <InvitationList status={toStatus(tab)} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InvitationList({ status }: { status: InvitationStatus | null }) {
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
        title={status === null ? "Todavía no enviaste invitaciones" : "No hay invitaciones acá"}
        description="Las invitaciones se envían desde Mis alumnos. Acá vas a ver si cada una se acepta o se rechaza."
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
            /*
             * Per row, not per screen.
             *
             * `isPending` alone is a single flag shared by every row, so one
             * click used to freeze Reenviar and Cancelar on the whole list with
             * nothing saying which invitation was working. `variables` carries
             * the id of the call in flight — the same fix `students-screen`
             * already applies to Pausar/Reanudar.
             */
            cancelling={cancel.isPending && cancel.variables === invitation.id}
            resending={resend.isPending && resend.variables === invitation.id}
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
          {list.isFetchingNextPage && <BarsLoader />}
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
  cancelling,
  resending,
  onCancel,
  onResend,
}: {
  invitation: PlanInvitation
  cancelling: boolean
  resending: boolean
  onCancel: () => void
  onResend: () => void
}) {
  const daysLeft = daysUntilExpiry(invitation)
  const busy = cancelling || resending

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
                ? " · vence hoy"
                : ` · vence en ${daysLeft} ${daysLeft === 1 ? "día" : "días"}`)}
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
            {/* Reenviar no pasa por un diálogo, así que este spinner es su
                único acuse de recibo hasta que llega el toast. */}
            {resending ? (
              <BarsLoader />
            ) : (
              <RotateCcw className="size-4" />
            )}
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
            {cancelling ? (
              <BarsLoader />
            ) : (
              <Trash2 className="size-4" />
            )}
            Cancelar
          </Button>
        )}
      </div>
    </li>
  )
}
