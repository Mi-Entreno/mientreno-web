"use client"

import { Clock, Eye, Loader2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/shared/user-avatar"
import { formatCurrency, formatDate } from "@/lib/format"

import {
  PROVIDER_LABELS,
  isAwaitingProof,
  isReviewable,
  type TrainerPayment,
} from "../model/bank-transfer.model"
import { PaymentStatusBadge } from "./payment-status-badge"

/**
 * Both ways of charging in one table.
 *
 * Mercado Pago rows are read-only and that is deliberate: their state is moved
 * by the webhook, so an action button next to one would promise something this
 * panel cannot do. The action column stays, because the alternative — two
 * tables — asks the trainer to know which method a charge used before they can
 * find it.
 *
 * On narrow screens the table scrolls inside its own container rather than
 * pushing the page sideways.
 */
export function PaymentsTable({
  payments,
  onReview,
  reviewingId,
}: {
  payments: TrainerPayment[]
  onReview: (payment: TrainerPayment) => void
  reviewingId: number | null
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
                {isReviewable(payment) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onReview(payment)}
                    disabled={reviewingId === payment.id}
                  >
                    {reviewingId === payment.id ? (
                      <Loader2 className="size-4 animate-spin" />
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
