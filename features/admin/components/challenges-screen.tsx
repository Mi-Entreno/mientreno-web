"use client"

import { Pause, Play, Plus, Trophy, Undo2, Upload } from "lucide-react"
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
import { StatusPill } from "@/features/brand/components/status-pill"

import {
  usePublishChallenge,
  useSetChallengeActive,
  useUnpublishChallenge,
  useAdminChallenges,
} from "../hooks/use-admin"
import type { AdminChallenge } from "../model/admin.model"
import { maxMintedReps } from "../model/admin.model"
import {
  CHALLENGE_STATUS_LABELS,
  CHALLENGE_STATUS_TONES,
  describeMode,
  describeRequirement,
  notLiveReason,
} from "../model/challenge.model"
import { ChallengeFormDialog } from "./challenge-form-dialog"

/**
 * Dos filtros y no cinco.
 *
 * Un desafío que carga el admin sólo puede estar en borrador o publicado: no hay
 * revisión, así que no hay "en revisión" ni "rechazado" que filtrar. El tipo los
 * sigue admitiendo porque se comparte con los productos del comercio, que sí pasan
 * por las cuatro.
 */
const FILTERS: { label: string; value: AdminChallenge["approvalStatus"] | undefined }[] = [
  { label: "Todos", value: undefined },
  { label: "Borradores", value: "DRAFT" },
  { label: "Publicados", value: "APPROVED" },
]

/**
 * Los desafíos de la plataforma: dónde se define cómo se ganan repes.
 *
 * Es la mitad de la economía que **acuña** moneda, y por eso vive en la zona de
 * administración y no en el panel del comercio: el que decide cuántas repes entran al
 * sistema tiene que ser el que responde por él. La otra mitad —los productos, que las
 * gastan— la carga cada comercio y se revisa en `moderation-queue`.
 */
export function AdminChallengesScreen() {
  const [filter, setFilter] = useState<AdminChallenge["approvalStatus"] | undefined>(undefined)
  const [editing, setEditing] = useState<AdminChallenge | null>(null)
  const [creating, setCreating] = useState(false)

  const query = useAdminChallenges(filter)

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
          Nuevo desafío
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
          title={filter ? "No hay desafíos en este estado" : "Todavía no creaste desafíos"}
          description="Un desafío premia el esfuerzo real: definís qué tiene que lograr el alumno —series, días consecutivos, kilos levantados— y cuántas repes gana al cumplirlo. El sistema calcula el progreso solo y acredita el premio cuando se completa."
          actionLabel={filter ? undefined : "Crear desafío"}
          onAction={filter ? undefined : () => setCreating(true)}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table label="Desafíos de la plataforma">
            <TableHeader>
              <TableRow>
                <TableHead>Desafío</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Requisitos</TableHead>
                <TableHead className="text-right">Premio</TableHead>
                <TableHead className="text-right">Ganado por</TableHead>
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
  challenge: AdminChallenge
  onEdit: () => void
}) {
  const publish = usePublishChallenge()
  const unpublish = useUnpublishChallenge()
  const setActive = useSetChallengeActive()

  const blocked = notLiveReason(challenge)
  const published = challenge.approvalStatus === "APPROVED"
  const exposure = maxMintedReps(challenge)
  const pending = publish.isPending || unpublish.isPending || setActive.isPending

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
          {/* Una fila vieja de cuando los desafíos los cargaba un comercio puede
              seguir teniendo motivo de rechazo. Se muestra en vez de esconderlo. */}
          {challenge.rejectionReason && (
            <p className="text-caption text-error-text text-pretty">{challenge.rejectionReason}</p>
          )}
          {blocked && (
            <p className="text-caption text-muted-foreground">
              Publicado, pero no se puede ganar: {blocked.toLowerCase()}
            </p>
          )}
          {!challenge.editableRequirements && (
            <p className="text-caption text-muted-foreground">
              Condiciones congeladas: ya lo ganó alguien
            </p>
          )}
        </div>
      </TableCell>

      <TableCell>
        <StatusPill tone={CHALLENGE_STATUS_TONES[challenge.approvalStatus]}>
          {CHALLENGE_STATUS_LABELS[challenge.approvalStatus]}
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
        <div>
          {challenge.prizeReps} {challenge.prizeReps === 1 ? "repe" : "repes"}
        </div>
        {/* Cuántas repes acuña el desafío como techo. Es el número que nadie calcula
            hasta que ya se emitieron: sin cupo no hay techo, y eso hay que verlo. */}
        <p className="text-caption text-muted-foreground">
          {exposure === null ? "Sin cupo: total abierto" : `Hasta ${exposure} en total`}
        </p>
      </TableCell>

      <TableCell className="text-right tabular-nums">
        {/* Cuántos lo ganaron, nunca quiénes: para administrar la economía alcanza
            el número. */}
        {challenge.grantedCount}
        {challenge.maxGrants !== null && ` / ${challenge.maxGrants}`}
      </TableCell>

      <TableCell>
        <div className="flex items-center justify-end gap-1">
          {published && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={challenge.active ? `Pausar ${challenge.name}` : `Reanudar ${challenge.name}`}
              disabled={pending}
              onClick={() => setActive.mutate({ id: challenge.id, active: !challenge.active })}
            >
              {challenge.active ? <Pause /> : <Play />}
            </Button>
          )}

          {/* Despublicar sólo mientras nadie lo ganó. Con otorgamientos encima el
              backend responde 409 y lo correcto es pausarlo, así que el botón no se
              ofrece: proponer algo que va a fallar es peor que no ofrecerlo. */}
          {published && challenge.editableRequirements && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Volver ${challenge.name} a borrador`}
              disabled={pending}
              onClick={() => unpublish.mutate(challenge.id)}
            >
              <Undo2 />
            </Button>
          )}

          {!published && (
            <Button size="sm" disabled={pending} onClick={() => publish.mutate(challenge.id)}>
              <Upload />
              Publicar
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  )
}
