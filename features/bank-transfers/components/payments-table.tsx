"use client"

import { Ban, Clock, Eye } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BarsLoader } from "@/components/ui/bars-loader"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/shared/user-avatar"
import { formatCurrency, formatDate } from "@/lib/format"

import {
  PROVIDER_LABELS,
  canCancelPending,
  isAwaitingProof,
  isReviewable,
  type TrainerPayment,
} from "../model/bank-transfer.model"
import { PaymentStatusBadge } from "./payment-status-badge"

/**
 * Both ways of charging in one table.
 *
 * Mercado Pago rows cannot be approved or rejected here: their state is moved
 * by the webhook, so those buttons would promise something this panel cannot
 * do. What any pending row *can* do is be given up on — "Cancelar cobro" acts
 * on the subscription upstream, not on Mercado Pago. The action column stays,
 * because the alternative — two tables — asks the trainer to know which method
 * a charge used before they can find it.
 *
 * On narrow screens the table scrolls inside its own container rather than
 * pushing the page sideways.
 */
export function PaymentsTable({
  payments,
  onReview,
  reviewingId,
  onCancel,
}: {
  payments: TrainerPayment[]
  onReview: (payment: TrainerPayment) => void
  reviewingId: number | null
  onCancel: (payment: TrainerPayment) => void
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <Table label="Cobros recibidos">
        <TableHeader>
          <TableRow>
            <TableHead>Alumno</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Importe</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <UserAvatar name={payment.studentName} src={payment.studentImageUrl} size="sm" />
                  <span className="font-medium">{payment.studentName}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{payment.planName}</TableCell>
              <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
              <TableCell className="text-muted-foreground">{formatDate(payment.createdAt)}</TableCell>
              <TableCell className="text-muted-foreground">
                {PROVIDER_LABELS[payment.provider]}
              </TableCell>
              <TableCell>
                <PaymentStatusBadge status={payment.status} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {isReviewable(payment) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReview(payment)}
                      disabled={reviewingId === payment.id}
                    >
                      {reviewingId === payment.id ? (
                        <BarsLoader />
                      ) : (
                        <Eye className="size-4" />
                      )}
                      Ver comprobante
                    </Button>
                  )}

                  {isAwaitingProof(payment) && (
                    <span className="inline-flex items-center gap-1.5 text-caption text-muted-foreground">
                      <Clock className="size-3.5" />
                      Esperando el comprobante
                    </span>
                  )}

                  {payment.status === "REJECTED" && payment.rejectionReason && (
                    <span className="text-caption text-muted-foreground">
                      {payment.rejectionReason}
                    </span>
                  )}

                  {canCancelPending(payment) && (
                    <Button size="sm" variant="ghost" onClick={() => onCancel(payment)}>
                      <Ban className="size-4" />
                      Cancelar cobro
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
