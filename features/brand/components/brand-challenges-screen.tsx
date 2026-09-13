"use client"

import { Pause, Play, Plus, Send, Trophy } from "lucide-react"
import { useState } from "react"

import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { ProductApprovalStatus } from "../dto/brand.dto"
import {
  useBrandChallenges,
  useSetChallengeActive,
  useSubmitChallenge,
} from "../hooks/use-brand"
import { APPROVAL_LABELS, APPROVAL_TONES } from "../model/brand.model"
import {
  describeMode,
  describeRequirement,
  notLiveReason,
  type BrandChallenge,
} from "../model/challenge.model"
import { ChallengeFormDialog } from "./challenge-form-dialog"
import { StatusPill } from "./status-pill"

const FILTERS: { label: string; value: ProductApprovalStatus | undefined }[] = [
  { label: "Todas", value: undefined },
  { label: "Borradores", value: "DRAFT" },
  { label: "En revisión", value: "PENDING_APPROVAL" },
  { label: "Publicadas", value: "APPROVED" },
  { label: "Rechazadas", value: "REJECTED" },
]

/**
 * Las recompensas por requisitos del comercio.
 *
 * Misma forma que la tabla de productos —mismos filtros, mismos estados de
 * moderación— porque para el comercio son dos cosas del mismo tipo. Lo que
 * cambia es qué se configura: en un producto, el precio; acá, el esfuerzo.
 */
export function BrandChallengesScreen() {
  const [filter, setFilter] = useState<ProductApprovalStatus | undefined>(undefined)
  const [editing, setEditing] = useState<BrandChallenge | null>(null)
  const [creating, setCreating] = useState(false)

  const query = useBrandChallenges(filter)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
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

        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Nueva recompensa
        </Button>
      </div>

      {query.isError ? (
        <ErrorState error={query.error} context="load" onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (query.data?.items.length ?? 0) === 0 ? (
        <EmptyState
          icon={Trophy}
          title={filter ? "No hay recompensas en este estado" : "Todavía no creaste recompensas"}
          description="Una recompensa premia el esfuerzo real: definís qué tiene que lograr el alumno —series, días consecutivos, kilos levantados— y cuántas repes gana al cumplirlo. El sistema calcula el progreso solo."
          actionLabel={filter ? undefined : "Crear recompensa"}
          onAction={filter ? undefined : () => setCreating(true)}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table label="Recompensas del comercio">
            <TableHeader>
              <TableRow>
                <TableHead>Recompensa</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Requisitos</TableHead>
                <TableHead className="text-right">Premio</TableHead>
                <TableHead className="text-right">Ganada por</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.data?.items.map((challenge) => (
                <ChallengeRow
                  key={challenge.id}
                  challenge={challenge}
                  onEdit={() => setEditing(challenge)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ChallengeFormDialog
        open={creating || editing !== null}
        challenge={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
      />
    </div>
  )
}

function ChallengeRow({
  challenge,
  onEdit,
}: {
  challenge: BrandChallenge
  onEdit: () => void
}) {
  const submit = useSubmitChallenge()
  const setActive = useSetChallengeActive()

  const blocked = notLiveReason(challenge)
  const canSubmit = challenge.approvalStatus === "DRAFT" || challenge.approvalStatus === "REJECTED"

  return (
    <TableRow>
      <TableCell>
        <div className="min-w-0">
          <button
            type="button"
            onClick={onEdit}
            className="truncate text-left font-medium underline-offset-4 hover:underline"
          >
            {challenge.name}
          </button>
          {/* El motivo del rechazo va junto a la recompensa y no en un detalle:
              es lo que hay que corregir. */}
          {challenge.rejectionReason && (
            <p className="text-caption text-error-text text-pretty">{challenge.rejectionReason}</p>
          )}
          {blocked && (
            <p className="text-caption text-muted-foreground">
              Publicada, pero no se puede ganar: {blocked.toLowerCase()}
            </p>
          )}
          {!challenge.editableRequirements && (
            <p className="text-caption text-muted-foreground">
              Condiciones congeladas: ya la ganó alguien
            </p>
          )}
        </div>
      </TableCell>

      <TableCell>
        <StatusPill tone={APPROVAL_TONES[challenge.approvalStatus]}>
          {APPROVAL_LABELS[challenge.approvalStatus]}
        </StatusPill>
      </TableCell>

      <TableCell>
        <ul className="flex flex-col gap-0.5">
          {challenge.requirements.map((requirement) => (
            <li key={requirement.id} className="text-caption">
              {describeRequirement(requirement)}
            </li>
          ))}
        </ul>
        {challenge.requirements.length > 1 && (
          <p className="text-caption text-muted-foreground">{describeMode(challenge)}</p>
        )}
      </TableCell>

      <TableCell className="text-right tabular-nums">
        {challenge.prizeReps} {challenge.prizeReps === 1 ? "repe" : "repes"}
      </TableCell>

      <TableCell className="text-right tabular-nums">
        {/* Cuántos la ganaron, nunca quiénes: el comercio no tiene relación con el
            alumno hasta que hay un canje. */}
        {challenge.grantedCount}
        {challenge.maxGrants !== null && ` / ${challenge.maxGrants}`}
      </TableCell>

      <TableCell>
        <div className="flex items-center justify-end gap-1">
          {challenge.approvalStatus === "APPROVED" && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={challenge.active ? `Pausar ${challenge.name}` : `Reanudar ${challenge.name}`}
              disabled={setActive.isPending}
              onClick={() => setActive.mutate({ id: challenge.id, active: !challenge.active })}
            >
              {challenge.active ? <Pause /> : <Play />}
            </Button>
          )}

          {canSubmit && (
            <Button size="sm" disabled={submit.isPending} onClick={() => submit.mutate(challenge.id)}>
              <Send />
              Enviar
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
