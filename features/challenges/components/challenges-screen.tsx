"use client"

import { Gift, Loader2, Plus, Target, Users } from "lucide-react"
import { useState } from "react"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusPill } from "@/features/brand/components/status-pill"
import { formatDate } from "@/lib/format"

import type { ChallengeStatus } from "../dto/challenge.dto"
import {
  useAddStock,
  useCancelChallenge,
  useChallenges,
  usePauseChallenge,
  usePublishChallenge,
} from "../hooks/use-challenges"
import {
  CHALLENGE_STATUS_LABELS,
  CHALLENGE_STATUS_TONES,
  describeMode,
  describeRequirement,
  notLiveReason,
  type BrandChallenge,
} from "../model/challenge.model"
import { ChallengeParticipantsSheet } from "./challenge-participants-sheet"
import { ChallengeWizard } from "./challenge-wizard"

const FILTERS: { label: string; value: ChallengeStatus | undefined }[] = [
  { label: "Todos", value: undefined },
  { label: "Borradores", value: "DRAFT" },
  { label: "Publicados", value: "PUBLISHED" },
  { label: "Terminados", value: "ENDED" },
]

/**
 * Los desafíos del comercio.
 *
 * Cada fila cuenta la promesa completa —qué hay que lograr y qué se lleva— y
 * cuánta gente está adentro. Antes hacían falta dos pantallas para eso: una en
 * el panel del admin, con el desafío, y otra acá, con el producto.
 */
export function ChallengesScreen() {
  const [filter, setFilter] = useState<ChallengeStatus | undefined>(undefined)
  const [editing, setEditing] = useState<BrandChallenge | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [cancelling, setCancelling] = useState<BrandChallenge | null>(null)
  // El id y no el objeto: publicar o pausar invalida la lista, y una copia
  // guardada acá dejaría los totales de la ficha congelados en lo de antes.
  const [viewingId, setViewingId] = useState<number | null>(null)

  const query = useChallenges(filter)
  const publish = usePublishChallenge()
  const pause = usePauseChallenge()
  const cancel = useCancelChallenge()

  const challenges = query.items
  const viewing = challenges.find((challenge) => challenge.id === viewingId) ?? null

  function openNew() {
    setEditing(null)
    setWizardOpen(true)
  }

  function openEdit(challenge: BrandChallenge) {
    setEditing(challenge)
    setWizardOpen(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
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
        <Button onClick={openNew}>
          <Plus className="size-4" /> Nuevo desafío
        </Button>
      </div>

      {query.isError ? (
        <ErrorState error={query.error} context="load" onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : challenges.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Todavía no creaste desafíos"
          description="Un desafío es una promesa: el alumno cumple lo que pedís —días entrenados, series, kilos— y se lleva la recompensa que vos ponés. Se define todo junto, en un solo paso."
          actionLabel="Crear el primero"
          onAction={openNew}
        />
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Desafíos del comercio">
          {challenges.map((challenge) => (
            <ChallengeRow
              key={challenge.id}
              challenge={challenge}
              publishing={publish.isPending && publish.variables === challenge.id}
              onEdit={() => openEdit(challenge)}
              onPublish={() => publish.mutate(challenge.id)}
              onTogglePause={() =>
                pause.mutate({ id: challenge.id, paused: challenge.status !== "PAUSED" })
              }
              onCancel={() => setCancelling(challenge)}
              onViewParticipants={() => setViewingId(challenge.id)}
            />
          ))}
        </ul>
      )}

      {query.hasNextPage && (
        <Button
          variant="outline"
          className="self-center"
          disabled={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
        >
          {query.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
          {query.isFetchingNextPage ? "Cargando…" : "Cargar más"}
        </Button>
      )}

      <ChallengeWizard open={wizardOpen} onOpenChange={setWizardOpen} challenge={editing} />

      <ChallengeParticipantsSheet
        challenge={viewing}
        open={viewing !== null}
        onOpenChange={(open) => !open && setViewingId(null)}
      />

      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(open) => !open && setCancelling(null)}
        title="Cancelar el desafío"
        description={
          cancelling
            ? `Los ${cancelling.acceptedCount} alumnos que lo tienen en curso van a recibir un aviso y les devolvemos el cupo del mes. Los canjes ya hechos siguen en pie.`
            : ""
        }
        confirmLabel="Cancelar el desafío"
        loading={cancel.isPending}
        onConfirm={() => {
          if (!cancelling) return
          cancel.mutate({ id: cancelling.id }, { onSuccess: () => setCancelling(null) })
        }}
      />
    </div>
  )
}

function ChallengeRow({
  challenge,
  publishing,
  onEdit,
  onPublish,
  onTogglePause,
  onCancel,
  onViewParticipants,
}: {
  challenge: BrandChallenge
  publishing: boolean
  onEdit: () => void
  onPublish: () => void
  onTogglePause: () => void
  onCancel: () => void
  onViewParticipants: () => void
}) {
  const blocked = notLiveReason(challenge)
  const closed = challenge.status === "CANCELLED" || challenge.status === "ENDED"

  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-subtitle uppercase">{challenge.name}</h3>
            <StatusPill tone={CHALLENGE_STATUS_TONES[challenge.status]}>
              {CHALLENGE_STATUS_LABELS[challenge.status]}
            </StatusPill>
          </div>
          <p className="flex flex-wrap items-center gap-1 text-body text-muted-foreground">
            <Target className="size-4" />
            {challenge.requirements.map((requirement) => describeRequirement(requirement)).join(" + ")}
            <span className="text-caption">· {describeMode(challenge)}</span>
          </p>
          <p className="flex items-center gap-1 text-body">
            <Gift className="size-4" /> {challenge.reward.name}
          </p>
          <p className="text-caption text-muted-foreground tabular-nums">
            Del {formatDate(challenge.startsAt)} al {formatDate(challenge.endsAt)} · la recompensa vence el{" "}
            {formatDate(challenge.reward.expiresAt)}
          </p>
          {blocked && challenge.status !== "DRAFT" && (
            <p className="text-caption text-warning-text">{blocked}</p>
          )}
        </div>

        <dl className="flex gap-4 text-caption tabular-nums">
          <div>
            <dt className="text-muted-foreground">Aceptaron</dt>
            <dd className="text-body-strong">{challenge.acceptedCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Completaron</dt>
            <dd className="text-body-strong">{challenge.completedCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Canjearon</dt>
            <dd className="text-body-strong">{challenge.redeemedCount}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Quedan</dt>
            <dd className="text-body-strong">{challenge.stockLeft}</dd>
          </div>
        </dl>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/*
          Primero en la fila y siempre presente, incluso en un desafío terminado:
          los números de arriba no se podían abrir, y saber quién está adentro es
          lo que el comercio pregunta antes que cualquier otra cosa.
        */}
        <Button size="sm" variant="outline" onClick={onViewParticipants}>
          <Users className="size-4" />
          Ver alumnos
          {challenge.acceptedCount > 0 && ` (${challenge.acceptedCount})`}
        </Button>
        {challenge.status === "DRAFT" && (
          <Button size="sm" onClick={onPublish} disabled={publishing}>
            {publishing && <Loader2 className="size-4 animate-spin" />} Publicar
          </Button>
        )}
        {(challenge.status === "PUBLISHED" || challenge.status === "PAUSED") && (
          <Button size="sm" variant="outline" onClick={onTogglePause}>
            {challenge.status === "PAUSED" ? "Reanudar" : "Pausar"}
          </Button>
        )}
        {!closed && (
          <Button size="sm" variant="ghost" onClick={onEdit} disabled={!challenge.editable}>
            Editar
          </Button>
        )}
        {!closed && <AddStockButton challenge={challenge} />}
        {!closed && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>

      {!challenge.editable && !closed && (
        <p className="mt-2 text-caption text-muted-foreground">
          Ya hay alumnos que lo aceptaron: las condiciones y la recompensa quedaron congeladas. Podés
          agregar unidades o crear un desafío nuevo.
        </p>
      )}
    </li>
  )
}

/** Sumar unidades: el stock nunca baja, porque hay gente que ya lo tiene reservado. */
function AddStockButton({ challenge }: { challenge: BrandChallenge }) {
  const [open, setOpen] = useState(false)
  const [units, setUnits] = useState(10)
  const addStock = useAddStock()

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Agregar unidades
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Agregar unidades"
        description={`Hoy hay ${challenge.reward.stock} en total y quedan ${challenge.stockLeft} libres. El stock no se puede bajar: cada alumno que aceptó tiene la suya reservada.`}
        confirmLabel="Agregar"
        loading={addStock.isPending}
        onConfirm={() =>
          addStock.mutate({ id: challenge.id, units }, { onSuccess: () => setOpen(false) })
        }
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="units">Unidades a agregar</Label>
          <Input
            id="units"
            type="number"
            min={1}
            value={units}
            onChange={(event) => setUnits(Number(event.target.value))}
          />
        </div>
      </ConfirmDialog>
    </>
  )
}
