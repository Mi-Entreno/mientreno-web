"use client"

import { Check, Gift, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { StatusPill } from "@/features/brand/components/status-pill"
import { formatDate } from "@/lib/format"

import { useMarkDelivered } from "../hooks/use-challenges"
import {
  PARTICIPATION_LABELS,
  PARTICIPATION_TONES,
  isPendingDelivery,
  type Redemption,
} from "../model/challenge.model"

/**
 * Un canje, con el botón que lo cierra.
 *
 * Vive fuera de la pantalla de canjes porque la home también lo muestra: si el
 * comercio entra al panel y hay algo esperando en el mostrador, tiene que poder
 * entregarlo sin navegar a otra pantalla primero. Un componente y no dos para
 * que "entregar" siga siendo la misma acción —mismo texto, misma mutación, misma
 * invalidación— desde los dos lugares.
 */
export function RedemptionRow({
  redemption,
  /** Dentro de otra tarjeta (el buscador de códigos): sin borde ni fondo propios. */
  bare,
}: {
  redemption: Redemption
  bare?: boolean
}) {
  const deliver = useMarkDelivered()
  const pending = isPendingDelivery(redemption)
  const delivered = redemption.deliveredAt !== null

  return (
    <li className={bare ? "list-none" : "rounded-xl border border-border bg-card p-4"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="flex items-center gap-2 text-body-strong">
            <Gift className="size-4 shrink-0" /> {redemption.rewardName}
          </p>
          <p className="text-caption text-muted-foreground">Por completar “{redemption.challengeName}”</p>
          <p className="font-heading text-subtitle tracking-widest">{redemption.redemptionCode}</p>
          <p className="text-caption text-muted-foreground tabular-nums">
            Canjeado el {redemption.redeemedAt ? formatDate(redemption.redeemedAt) : "—"}
            {redemption.deliveredAt && ` · entregado el ${formatDate(redemption.deliveredAt)}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/*
            Tres estados y no dos. Antes la píldora decía "entregado" para todo
            lo que no estuviera pendiente, así que un canje con el premio vencido
            —que nadie entregó ni va a entregar— se anunciaba como entregado y
            encima ofrecía el botón. El estado de la participación es el que
            manda cuando no es ninguno de los dos casos felices.
          */}
          <StatusPill
            tone={pending ? "warning" : delivered ? "success" : PARTICIPATION_TONES[redemption.status]}
          >
            {pending ? "Para entregar" : delivered ? "Entregado" : PARTICIPATION_LABELS[redemption.status]}
          </StatusPill>
          {pending && (
            <Button size="sm" onClick={() => deliver.mutate(redemption.id)} disabled={deliver.isPending}>
              {deliver.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Check className="size-4" />
              )}
              Entregar
            </Button>
          )}
        </div>
      </div>
    </li>
  )
}
