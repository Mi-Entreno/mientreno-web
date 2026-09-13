"use client"

import { Check, ShieldCheck, Store, Trophy, X } from "lucide-react"
import { useState } from "react"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
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
import { StatusPill } from "@/features/brand/components/status-pill"
import type { ProductApprovalStatus } from "@/features/brand/dto/brand.dto"
import { APPROVAL_LABELS, APPROVAL_TONES } from "@/features/brand/model/brand.model"
import { describeRequirement, MODE_LABELS } from "@/features/brand/model/challenge.model"

import { useModerateChallenge, usePendingChallenges } from "../hooks/use-admin"
import {
  CHALLENGE_REVIEW_CHECKLIST,
  isPlatformChallenge,
  maxMintedReps,
  type AdminChallenge,
} from "../model/admin.model"

const FILTERS: { label: string; value: ProductApprovalStatus }[] = [
  { label: "En revisión", value: "PENDING_APPROVAL" },
  { label: "Publicadas", value: "APPROVED" },
  { label: "Rechazadas", value: "REJECTED" },
]

/**
 * La cola de revisión de recompensas por requisitos.
 *
 * La pregunta que se responde acá es la inversa de la de los productos. Un
 * producto **gasta** repes: un precio bajo de más vacía la economía. Una
 * recompensa las **acuña**: un premio alto de más imprime moneda, y la cobra todo
 * el que entrene. Por eso lo que se muestra arriba de todo es la relación entre
 * el premio y el esfuerzo pedido, y la acuñación máxima cuando hay cupo.
 *
 * Sin aprobación en lote, también a diferencia de los productos: esa relación hay
 * que leerla recompensa por recompensa.
 */
export function ChallengeModerationQueue() {
  const [filter, setFilter] = useState<ProductApprovalStatus>("PENDING_APPROVAL")
  const [approving, setApproving] = useState<AdminChallenge | null>(null)
  const [rejecting, setRejecting] = useState<AdminChallenge | null>(null)

  const query = usePendingChallenges(filter)
  const moderate = useModerateChallenge()

  const items = query.data?.items ?? []

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((option) => (
          <Button
            key={option.value}
            variant={filter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {filter === "PENDING_APPROVAL" && items.length > 0 && (
        <section className="rounded-xl border border-border bg-muted/40 p-4">
          <p className="flex items-center gap-2 font-heading text-body font-semibold uppercase">
            <ShieldCheck className="size-4 text-primary" />
            Antes de aprobar
          </p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 text-body text-muted-foreground">
            {CHALLENGE_REVIEW_CHECKLIST.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      {query.isError ? (
        <ErrorState error={query.error} context="load" onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title={
            filter === "PENDING_APPROVAL"
              ? "No hay recompensas esperando revisión"
              : "No hay recompensas en este estado"
          }
          description="Cuando un comercio envíe una recompensa a revisión, va a aparecer acá con sus requisitos y su premio."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onApprove={() => setApproving(challenge)}
              onReject={() => setRejecting(challenge)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={approving !== null}
        title="¿Publicar esta recompensa?"
        description={
          approving
            ? `${approving.name} va a pagar ${approving.prizeReps} ${
                approving.prizeReps === 1 ? "repe" : "repes"
              } a cada alumno que cumpla los requisitos${
                approving.maxGrants === null ? ", sin tope de cantidad" : `, hasta ${approving.maxGrants} veces`
              }.`
            : ""
        }
        confirmLabel="Publicar"
        loading={moderate.isPending}
        onConfirm={() => {
          if (!approving) return
          moderate.mutate({ challengeId: approving.id, status: "APPROVED" })
          setApproving(null)
        }}
        onOpenChange={(next) => !next && setApproving(null)}
      />

      <RejectDialog
        challenge={rejecting}
        pending={moderate.isPending}
        onCancel={() => setRejecting(null)}
        onConfirm={(reason) => {
          if (!rejecting) return
          moderate.mutate({ challengeId: rejecting.id, status: "REJECTED", reason })
          setRejecting(null)
        }}
      />
    </div>
  )
}

function ChallengeCard({
  challenge,
  onApprove,
  onReject,
}: {
  challenge: AdminChallenge
  onApprove: () => void
  onReject: () => void
}) {
  const minted = maxMintedReps(challenge)
  const pendingReview = challenge.approvalStatus === "PENDING_APPROVAL"

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-body-lg font-semibold">{challenge.name}</h2>
            <StatusPill tone={APPROVAL_TONES[challenge.approvalStatus]}>
              {APPROVAL_LABELS[challenge.approvalStatus]}
            </StatusPill>
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-caption text-muted-foreground">
            <Store className="size-3.5" />
            {isPlatformChallenge(challenge) ? "Mi Entreno (plataforma)" : challenge.brandName}
          </p>
          {challenge.description && (
            <p className="mt-2 text-body text-muted-foreground text-pretty">{challenge.description}</p>
          )}
        </div>

        <div className="text-right">
          <p className="font-heading text-body-lg font-semibold tabular-nums">
            {challenge.prizeReps} {challenge.prizeReps === 1 ? "repe" : "repes"}
          </p>
          {/* El número que nadie calcula hasta que la economía ya se infló. */}
          <p className="text-caption text-muted-foreground">
            {minted === null
              ? "Sin cupo: lo acuñado depende de cuánta gente entrene"
              : `Acuña hasta ${minted.toLocaleString("es-AR")} repes`}
          </p>
        </div>
      </div>

      <div className="rounded-lg bg-muted/40 p-3">
        <p className="text-caption font-semibold uppercase text-muted-foreground">
          {MODE_LABELS[challenge.requirementMode]}
          {challenge.requirementMode === "N_OF_M" &&
            challenge.requiredCount !== null &&
            ` (${challenge.requiredCount} de ${challenge.requirements.length})`}
        </p>
        <ul className="mt-1.5 flex list-disc flex-col gap-1 pl-5 text-body">
          {challenge.requirements.map((requirement) => (
            <li key={requirement.id}>{describeRequirement(requirement)}</li>
          ))}
        </ul>
      </div>

      {challenge.rejectionReason && (
        <p className="text-caption text-error-text">Rechazada: {challenge.rejectionReason}</p>
      )}

      {challenge.grantedCount > 0 && (
        <p className="text-caption text-muted-foreground">
          Ya la ganaron {challenge.grantedCount}{" "}
          {challenge.grantedCount === 1 ? "alumno" : "alumnos"}
        </p>
      )}

      {pendingReview && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onReject}>
            <X className="size-4" />
            Rechazar
          </Button>
          <Button size="sm" onClick={onApprove}>
            <Check className="size-4" />
            Aprobar
          </Button>
        </div>
      )}
    </article>
  )
}

/**
 * El rechazo pide motivo porque el backend lo exige, y lo exige por una razón:
 * sin explicación el comercio reenvía lo mismo.
 */
function RejectDialog({
  challenge,
  pending,
  onCancel,
  onConfirm,
}: {
  challenge: AdminChallenge | null
  pending: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState("")

  return (
    <Dialog
      open={challenge !== null}
      onOpenChange={(next) => {
        if (!next) {
          setReason("")
          onCancel()
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar recompensa</DialogTitle>
          <DialogDescription>
            {challenge
              ? `El comercio va a recibir el motivo para poder corregir ${challenge.name}.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reject-reason">Motivo</Label>
          <Input
            id="reject-reason"
            value={reason}
            maxLength={200}
            placeholder="El premio es muy alto para el esfuerzo que pide"
            onChange={(event) => setReason(event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => {
              setReason("")
              onCancel()
            }}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={pending || reason.trim().length === 0}
            onClick={() => {
              onConfirm(reason.trim())
              setReason("")
            }}
          >
            Rechazar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
