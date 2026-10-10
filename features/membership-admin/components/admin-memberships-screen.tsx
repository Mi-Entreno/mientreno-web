"use client"

import { RefreshCw } from "lucide-react"
import { useState } from "react"

import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import { OptionGroup } from "@/components/shared/option-group"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { STATUS_LABELS } from "@/features/membership/model/membership.model"
import { formatCurrency, formatDate } from "@/lib/format"
import { useAdminMemberships, useReconcileMembership } from "../hooks/use-membership-admin"
import { canReconcile, type MembershipStatus } from "../model/membership-admin.model"
import { GrantMembershipDialog } from "./grant-membership-dialog"

const FILTERS = [
  { value: "ALL", label: "Todas" },
  { value: "ACTIVE", label: "Activas" },
  { value: "TRIALING", label: "En prueba" },
  { value: "PAST_DUE", label: "Con problemas de pago" },
  { value: "PENDING", label: "Pago pendiente" },
  { value: "CANCELLED", label: "Canceladas" },
  { value: "EXPIRED", label: "Vencidas" },
] as const

/**
 * Who pays for what. Two actions: asking Mercado Pago again ("pagué y no tengo
 * Pro"), which applies exactly what a webhook would, and giving a courtesy plan.
 */
export function AdminMembershipsScreen() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("ALL")
  const [page, setPage] = useState(0)
  const status = filter === "ALL" ? null : (filter as MembershipStatus)
  const memberships = useAdminMemberships(status, page)
  const reconcile = useReconcileMembership()

  return (
    <div className="flex flex-col gap-4">
      <GrantMembershipDialog />
      <OptionGroup
        name="membership-status"
        label="Estado"
        options={FILTERS}
        value={filter}
        onChange={(value) => {
          setFilter(value)
          setPage(0)
        }}
      />

      {memberships.isError ? (
        <ErrorState error={memberships.error} onRetry={() => memberships.refetch()} />
      ) : memberships.isLoading || !memberships.data ? (
        <Skeleton className="h-64" />
      ) : memberships.data.items.length === 0 ? (
        <EmptyState icon={RefreshCw} title="No hay membresías" description="Ninguna coincide con este filtro." />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-body">
              <thead className="text-left text-caption text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-4 py-2.5 font-medium">Usuario</th>
                  <th className="px-4 py-2.5 font-medium">Plan</th>
                  <th className="px-4 py-2.5 font-medium">Estado</th>
                  <th className="px-4 py-2.5 font-medium">Monto</th>
                  <th className="px-4 py-2.5 font-medium">Fin del período</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {memberships.data.items.map((membership) => (
                  <tr key={membership.id}>
                    <td className="px-4 py-2.5">{membership.userEmail ?? `#${membership.userId}`}</td>
                    <td className="px-4 py-2.5">
                      {membership.planCode}
                      {membership.provider === "MANUAL" && <span className="text-muted-foreground"> · cortesía</span>}
                    </td>
                    <td className="px-4 py-2.5">
                      {STATUS_LABELS[membership.status]}
                      {membership.cancelAtPeriodEnd && <span className="text-muted-foreground"> · baja pedida</span>}
                    </td>
                    <td className="px-4 py-2.5">{formatCurrency(membership.amount)}</td>
                    <td className="px-4 py-2.5">{formatDate(membership.currentPeriodEnd ?? undefined)}</td>
                    <td className="px-4 py-2.5 text-right">
                      {canReconcile(membership) && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reconcile.isPending}
                          onClick={() => reconcile.mutate(membership.id)}
                        >
                          Consultar a Mercado Pago
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={memberships.data.isLast}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
