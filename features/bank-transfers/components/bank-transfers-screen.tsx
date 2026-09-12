"use client"

import { Inbox, Landmark } from "lucide-react"
import { useState } from "react"

import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

import { useBankTransferInfo, useTrainerPayments } from "../hooks/use-bank-transfers"
import type { TrainerPayment } from "../model/bank-transfer.model"
import { BankInfoForm } from "./bank-info-form"
import { PaymentsTable } from "./payments-table"
import { ReviewPaymentDialog } from "./review-payment-dialog"

type ProviderFilter = "all" | "mercadopago" | "bank_transfer"
type StatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED"

/**
 * Transfers tab: the queue first, the account details second.
 *
 * The order is the point. A trainer opens this screen because something is
 * waiting for them, not to re-read their own CBU — and until the details are
 * filled in there is nothing in the queue anyway, which is what the empty state
 * says.
 */
export function BankTransfersScreen() {
  const [provider, setProvider] = useState<ProviderFilter>("all")
  const [status, setStatus] = useState<StatusFilter>("PENDING")
  const [reviewing, setReviewing] = useState<TrainerPayment | null>(null)

  const info = useBankTransferInfo()
  const payments = useTrainerPayments({
    provider: provider === "all" ? undefined : provider,
    status: status === "all" ? undefined : status,
    size: 20,
  })

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-heading text-subtitle font-semibold tracking-tight">Cobros</h2>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filter-provider" className="text-caption text-muted-foreground">
                Método
              </Label>
              <Select value={provider} onValueChange={(value) => setProvider(value as ProviderFilter)}>
                <SelectTrigger id="filter-provider" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                  <SelectItem value="bank_transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="filter-status" className="text-caption text-muted-foreground">
                Estado
              </Label>
              <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
                <SelectTrigger id="filter-status" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PENDING">Pendientes</SelectItem>
                  <SelectItem value="APPROVED">Aprobados</SelectItem>
                  <SelectItem value="REJECTED">Rechazados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {payments.isLoading && <Skeleton className="h-64 w-full rounded-xl" />}

        {payments.isError && (
          <ErrorState error={payments.error} context="load" onRetry={() => payments.refetch()} inline />
        )}

        {payments.data?.isEmpty && (
          <EmptyState
            icon={info.isMissing ? Landmark : Inbox}
            title={info.isMissing ? "Todavía no aceptás transferencias" : "No hay cobros para mostrar"}
            description={
              info.isMissing
                ? "Cargá tus datos bancarios acá abajo y tus alumnos van a poder pagarte por transferencia."
                : "Probá cambiando los filtros. Los cobros aparecen apenas un alumno inicia el pago."
            }
          />
        )}

        {payments.data && !payments.data.isEmpty && (
          <PaymentsTable
            payments={payments.data.items}
            onReview={setReviewing}
            reviewingId={reviewing?.id ?? null}
          />
        )}
      </section>

      <BankInfoForm />

      <ReviewPaymentDialog
        payment={reviewing}
        open={reviewing !== null}
        onOpenChange={(open) => !open && setReviewing(null)}
      />
    </div>
  )
}
