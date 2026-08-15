"use client"

import { Apple, CreditCard, Pencil, Plus, Send, Trash2, Users, Wallet } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { EmptyState } from "@/components/dashboard/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useMercadoPagoConnection } from "@/features/payments/hooks/use-mercado-pago"
import { isOperational } from "@/features/payments/model/mercado-pago.model"
import { InviteStudentSheet } from "@/features/plan-invitations/components/invite-student-sheet"
import { formatCurrency } from "@/lib/format"
import { useDeactivatePlan, useMyPlans } from "../hooks/use-subscription-plans"
import { billingLabel, billingSuffix, type SubscriptionPlan } from "../model/subscription-plan.model"
import { PlanFormSheet } from "./plan-form-sheet"

export function PlansScreen() {
  const { data: plans, isLoading, isError } = useMyPlans()
  const deactivate = useDeactivatePlan()

  const [editing, setEditing] = useState<SubscriptionPlan | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<SubscriptionPlan | null>(null)
  const [offering, setOffering] = useState<SubscriptionPlan | null>(null)

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(plan: SubscriptionPlan) {
    setEditing(plan)
    setSheetOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body text-muted-foreground text-pretty">
          Crea y gestiona los planes de suscripción a los que pueden suscribirse tus alumnos.
        </p>
        <Button onClick={openCreate} className="sm:shrink-0">
          <Plus className="size-4" />
          Nuevo plan
        </Button>
      </div>

      <PaymentsNotice hasPaidPlans={(plans ?? []).some((plan) => plan.price > 0)} />

      {isLoading && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((key) => (
            <li key={key}>
              <Skeleton className="h-48 w-full rounded-xl" />
            </li>
          ))}
        </ul>
      )}

      {isError && (
        <p className="text-body text-error-text">No se han podido cargar tus planes.</p>
      )}

      {plans && plans.length === 0 && (
        <EmptyState
          icon={CreditCard}
          title="Aún no tienes planes de suscripción"
          description="Crea tu primer plan para que los alumnos puedan suscribirse a tus servicios."
          actionLabel="Crear plan"
          onAction={openCreate}
        />
      )}

      {plans && plans.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <li
              key={plan.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-success-surface text-primary-text">
                  <CreditCard className="size-5" />
                </div>
                <Badge variant="secondary">{billingLabel(plan.billingPeriod)}</Badge>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="font-heading text-body-lg font-semibold tracking-tight text-balance">
                  {plan.name}
                </h3>
                <p className="text-title font-semibold tracking-tight">
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
              </div>

              <ul className="flex flex-wrap gap-3 text-body text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <Users className="size-4" />
                  {plan.maxStudents === null ? "Sin límite" : `${plan.maxStudents} plazas`}
                </li>
                {plan.includesNutrition && (
                  <li className="flex items-center gap-1.5">
                    <Apple className="size-4" />
                    Con nutrición
                  </li>
                )}
              </ul>

              <div className="mt-auto flex flex-col gap-2 border-t border-border pt-3">
                <Button variant="outline" size="sm" onClick={() => setOffering(plan)}>
                  <Send className="size-4" />
                  Enviar a un alumno
                </Button>

                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}>
                    <Pencil className="size-4" />
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-error-text focus-visible:text-error-text"
                    onClick={() => setPendingDelete(plan)}
                  >
                    <Trash2 className="size-4" />
                    Desactivar
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <PlanFormSheet open={sheetOpen} onOpenChange={setSheetOpen} plan={editing} />

      {/* Opened from a plan card, so the wizard starts with that plan chosen. */}
      <InviteStudentSheet
        open={offering !== null}
        onOpenChange={(open) => !open && setOffering(null)}
        initialPlan={offering}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title={`¿Desactivar "${pendingDelete?.name ?? ""}"?`}
        description="El plan dejará de aceptar nuevas altas. Los alumnos ya suscritos mantienen su suscripción y su acceso."
        confirmLabel="Desactivar"
        destructive
        loading={deactivate.isPending}
        onConfirm={() => {
          if (!pendingDelete) return
          deactivate.mutate(pendingDelete.id, { onSettled: () => setPendingDelete(null) })
        }}
      />
    </div>
  )
}

/**
 * A paid plan with no Mercado Pago account behind it cannot be charged, so the
 * trainer would collect acceptances and no money.
 *
 * Shown only once there is a paid plan to charge for — a trainer who has not
 * created anything yet does not need a payments errand — and only when the
 * status is actually known, so a failing or missing endpoint stays quiet here
 * and reports itself on the payments screen.
 */
function PaymentsNotice({ hasPaidPlans }: { hasPaidPlans: boolean }) {
  const connection = useMercadoPagoConnection()

  if (!hasPaidPlans || !connection.isSuccess || isOperational(connection.data)) return null

  return (
    <p className="flex items-start gap-2 rounded-lg border border-warning bg-warning-surface p-3 text-body text-warning-text">
      <Wallet className="mt-0.5 size-4 shrink-0" />
      <span className="text-pretty">
        Tus alumnos no pueden pagar estos planes todavía: falta vincular tu cuenta de Mercado
        Pago.{" "}
        <Link href="/dashboard/payments" className="font-medium underline underline-offset-4">
          Configurar cobros
        </Link>
      </span>
    </p>
  )
}
