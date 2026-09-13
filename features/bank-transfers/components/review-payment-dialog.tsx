"use client"

import { Check, Loader2, X } from "lucide-react"
import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatCurrency, formatDate } from "@/lib/format"

import { useApprovePayment, useRejectPayment } from "../hooks/use-bank-transfers"
import { OTHER_REASON, REJECTION_REASONS, type TrainerPayment } from "../model/bank-transfer.model"
import { ProofViewer } from "./proof-viewer"

/**
 * Where the trainer decides. Everything needed for that decision is on screen
 * at once — expected amount, who and when, and the receipt — because the whole
 * job is comparing the number on the photo against the number we expect.
 *
 * Rejecting always takes a reason. A rejection is the only thing that tells the
 * student what to fix, and one without a reason leaves them re-uploading the
 * same wrong receipt.
 */
export function ReviewPaymentDialog({
  payment,
  open,
  onOpenChange,
}: {
  payment: TrainerPayment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!payment) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        The body is keyed by payment so opening a different one starts clean.
        Resetting the three pieces of state from an effect would work too, but
        it re-renders the dialog once with the previous trainer's half-written
        rejection still on screen — and here that would be another student's.
      */}
      <ReviewDialogBody key={payment.id} payment={payment} onClose={() => onOpenChange(false)} />
    </Dialog>
  )
}

function ReviewDialogBody({
  payment,
  onClose,
}: {
  payment: TrainerPayment
  onClose: () => void
}) {
  const approve = useApprovePayment()
  const reject = useRejectPayment()

  const [mode, setMode] = useState<"review" | "reject">("review")
  const [reason, setReason] = useState<string>(REJECTION_REASONS[0])
  const [otherReason, setOtherReason] = useState("")

  const busy = approve.isPending || reject.isPending
  const finalReason = reason === OTHER_REASON ? otherReason.trim() : reason
  const canReject = finalReason.length > 0

  const close = onClose

  return (
    <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "review" ? "Revisar comprobante" : "¿Por qué lo rechazás?"}
          </DialogTitle>
          <DialogDescription>
            {mode === "review"
              ? "Compará el importe y la fecha del comprobante con lo que esperás cobrar."
              : "El alumno ve este motivo y puede cargar un comprobante nuevo."}
          </DialogDescription>
        </DialogHeader>

        {mode === "review" ? (
          <div className="flex flex-col gap-5">
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Alumno" value={payment.studentName} />
              <Field label="Plan" value={payment.planName} />
              <Field label="Importe esperado" value={formatCurrency(payment.amount)} />
              <Field label="Comprobante cargado" value={formatDate(payment.proofUploadedAt ?? undefined)} />
              {payment.transferReference && (
                <Field label="Referencia informada" value={payment.transferReference} />
              )}
            </dl>

            <ProofViewer paymentId={payment.id} fileName={payment.proofFileName} />

            <p className="rounded-lg border border-border bg-secondary/40 p-3 text-body text-muted-foreground text-pretty">
              Al aprobar, el plan del alumno queda activo de inmediato. Verificá primero que el
              dinero haya entrado en tu cuenta: Mi Entreno no puede confirmarlo por vos.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">Motivo del rechazo</legend>
              {[...REJECTION_REASONS, OTHER_REASON].map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 text-body has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="rejection-reason"
                    value={option}
                    checked={reason === option}
                    onChange={() => setReason(option)}
                    className="size-4 accent-primary"
                  />
                  {option}
                </label>
              ))}
            </fieldset>

            {reason === OTHER_REASON && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="other-reason">Contale al alumno qué pasó</Label>
                <Textarea
                  id="other-reason"
                  value={otherReason}
                  maxLength={500}
                  rows={3}
                  placeholder="Ej.: la transferencia figura a nombre de otra persona"
                  onChange={(event) => setOtherReason(event.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {mode === "review" ? (
            <>
              <Button variant="ghost" onClick={() => setMode("reject")} disabled={busy}>
                <X className="size-4" />
                Rechazar
              </Button>
              <Button
                onClick={() =>
                  approve.mutate(payment.id, { onSuccess: close })
                }
                disabled={busy}
              >
                {approve.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                Aprobar pago
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setMode("review")} disabled={busy}>
                Volver
              </Button>
              <Button
                variant="destructive"
                disabled={busy || !canReject}
                onClick={() =>
                  reject.mutate(
                    { paymentId: payment.id, reason: finalReason },
                    { onSuccess: close },
                  )
                }
              >
                {reject.isPending && <Loader2 className="size-4 animate-spin" />}
                Rechazar comprobante
              </Button>
            </>
          )}
      </DialogFooter>
    </DialogContent>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="truncate text-body font-medium">{value}</dd>
    </div>
  )
}
