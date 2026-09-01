"use client"

import { Check, PackageCheck, X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

import type { RedemptionStatus } from "../dto/brand.dto"
import { useBrandRedemptions, useChangeRedemptionStatus } from "../hooks/use-brand"
import { REDEMPTION_LABELS, REDEMPTION_TONES, type Redemption } from "../model/brand.model"
import { StatusPill } from "./status-pill"

const FILTERS: { label: string; value: RedemptionStatus | undefined }[] = [
  { label: "Para preparar", value: "PENDING" },
  { label: "Listos", value: "READY" },
  { label: "Entregados", value: "DELIVERED" },
  { label: "Todos", value: undefined },
]

/**
 * Bandeja de canjes.
 *
 * Arranca en "para preparar" y no en "todos": es una cola de trabajo, y lo
 * primero que el comercio necesita ver es lo que tiene pendiente. El backend
 * devuelve los filtrados del más viejo al más nuevo por el mismo motivo.
 */
export function BrandRedemptionsScreen() {
  const [filter, setFilter] = useState<RedemptionStatus | undefined>("PENDING")
  const [cancelling, setCancelling] = useState<Redemption | null>(null)

  const query = useBrandRedemptions(filter)
  const changeStatus = useChangeRedemptionStatus()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Button
            key={option.label}
            variant={filter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {query.isError ? (
        <ErrorState error={query.error} context="load" onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : (query.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          icon={PackageCheck}
          title={filter === "PENDING" ? "No tenés canjes pendientes" : "No hay canjes acá"}
          description="Cuando un alumno canjee uno de tus productos, el pedido aparece en esta lista para que lo prepares."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {query.data?.items.map((redemption) => (
            <li
              key={redemption.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                {redemption.productImageUrl ? (
                  <Image
                    src={redemption.productImageUrl}
                    alt=""
                    width={48}
                    height={48}
                    className="size-full object-cover"
                    unoptimized
                  />
                ) : (
                  <PackageCheck className="size-4 text-muted-foreground" />
                )}
              </span>

              <div className="min-w-40 flex-1">
                <p className="font-medium">{redemption.productName}</p>
                <p className="text-caption text-muted-foreground tabular-nums">
                  {formatDate(redemption.createdAt)} · {redemption.totalCostDumbbells}{" "}
                  {redemption.totalCostDumbbells === 1 ? "mancuerna" : "mancuernas"}
                </p>
                {/* La nota de entrega es lo único que el alumno escribe: talle,
                    color, cuándo pasa. Va visible y no detrás de un detalle. */}
                {redemption.deliveryNotes && (
                  <p className="mt-1 text-body text-muted-foreground text-pretty">
                    “{redemption.deliveryNotes}”
                  </p>
                )}
                {redemption.cancelledReason && (
                  <p className="mt-1 text-caption text-error-text">
                    Cancelado: {redemption.cancelledReason}
                  </p>
                )}
              </div>

              <StatusPill tone={REDEMPTION_TONES[redemption.status]}>
                {REDEMPTION_LABELS[redemption.status]}
              </StatusPill>

              <div className="flex gap-2">
                {redemption.status === "PENDING" && (
                  <Button
                    size="sm"
                    disabled={changeStatus.isPending}
                    onClick={() => changeStatus.mutate({ id: redemption.id, status: "READY" })}
                  >
                    <Check />
                    Listo para retirar
                  </Button>
                )}
                {redemption.status === "READY" && (
                  <Button
                    size="sm"
                    disabled={changeStatus.isPending}
                    onClick={() => changeStatus.mutate({ id: redemption.id, status: "DELIVERED" })}
                  >
                    <Check />
                    Entregado
                  </Button>
                )}
                {(redemption.status === "PENDING" || redemption.status === "READY") && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={changeStatus.isPending}
                    onClick={() => setCancelling(redemption)}
                  >
                    <X />
                    Cancelar
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <CancelDialog redemption={cancelling} onClose={() => setCancelling(null)} />
    </div>
  )
}

/**
 * Cancelación.
 *
 * El motivo es obligatorio y el backend lo exige igual: el alumno recibe la
 * notificación con el texto, y un reintegro sin explicación es una pregunta que
 * llega igual, pero por otro canal.
 */
function CancelDialog({
  redemption,
  onClose,
}: {
  redemption: Redemption | null
  onClose: () => void
}) {
  const [reason, setReason] = useState("")
  const changeStatus = useChangeRedemptionStatus()

  function confirm() {
    if (!redemption || !reason.trim()) return
    changeStatus
      .mutateAsync({ id: redemption.id, status: "CANCELLED", reason: reason.trim() })
      .then(() => {
        setReason("")
        onClose()
      })
      .catch(() => {
        // El hook ya mostró el toast; el diálogo queda abierto.
      })
  }

  return (
    <Dialog open={redemption !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar canje</DialogTitle>
          <DialogDescription>
            Le devolvemos {redemption?.totalCostDumbbells ?? 0}{" "}
            {redemption?.totalCostDumbbells === 1 ? "mancuerna" : "mancuernas"} al alumno y el stock
            vuelve a tu producto. El motivo le llega a él.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cancel-reason">Motivo</Label>
          <Input
            id="cancel-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Nos quedamos sin stock del talle"
            maxLength={200}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={changeStatus.isPending}>
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={changeStatus.isPending || !reason.trim()}
          >
            Cancelar el canje
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}
