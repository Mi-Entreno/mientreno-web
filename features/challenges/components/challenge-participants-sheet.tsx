"use client"

import { Loader2, Users } from "lucide-react"

import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { StatusPill } from "@/features/brand/components/status-pill"
import { formatDate } from "@/lib/format"

import { useChallengeParticipants } from "../hooks/use-challenges"
import {
  PARTICIPATION_LABELS,
  PARTICIPATION_TONES,
  lastParticipantEvent,
  type BrandChallenge,
  type ChallengeParticipant,
} from "../model/challenge.model"

/**
 * Quiénes están anotados en un desafío.
 *
 * El endpoint existía desde el principio y no lo miraba nadie: el comercio veía
 * "12 aceptaron" y no tenía forma de saber quiénes eran ni en qué estado
 * estaban. Ahora el número es la puerta de entrada a la lista.
 *
 * El backend manda **sólo el nombre de pila** —es deliberado, ver
 * `ChallengeParticipantResponseDTO`—: alcanza para reconocer a quien viene a
 * retirar y no convierte un desafío en un padrón de alumnos ajenos. Por eso acá
 * no hay email, teléfono ni foto: no hay nada de eso para mostrar.
 *
 * Los totales del encabezado salen del desafío y no de las filas cargadas: la
 * lista pagina, así que contar lo que está en pantalla mentiría en cuanto el
 * desafío pasara de veinte participantes.
 */
export function ChallengeParticipantsSheet({
  challenge,
  open,
  onOpenChange,
}: {
  challenge: BrandChallenge | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Alumnos anotados</SheetTitle>
          <SheetDescription>{challenge?.name ?? ""}</SheetDescription>
        </SheetHeader>

        {/* Con key: cambiar de desafío nunca muestra la lista del anterior. */}
        {challenge && <ParticipantList key={challenge.id} challenge={challenge} enabled={open} />}
      </SheetContent>
    </Sheet>
  )
}

function ParticipantList({ challenge, enabled }: { challenge: BrandChallenge; enabled: boolean }) {
  const query = useChallengeParticipants(challenge.id, enabled)

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
      <dl className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-card p-3 text-center tabular-nums">
        <Tally label="Aceptaron" value={challenge.acceptedCount} />
        <Tally label="Completaron" value={challenge.completedCount} />
        <Tally label="Canjearon" value={challenge.redeemedCount} />
      </dl>

      {query.isError ? (
        <ErrorState error={query.error} context="load" inline onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : query.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Todavía no se anotó nadie"
          description="Cuando un alumno acepte el desafío desde la app, va a aparecer acá con el estado en el que está."
        />
      ) : (
        <ul className="flex flex-col gap-2" aria-label="Alumnos anotados">
          {query.items.map((participant) => (
            <ParticipantRow key={participant.id} participant={participant} />
          ))}
        </ul>
      )}

      {query.hasNextPage && (
        <Button
          variant="outline"
          size="sm"
          className="self-center"
          disabled={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
        >
          {query.isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
          {query.isFetchingNextPage ? "Cargando…" : "Cargar más"}
        </Button>
      )}
    </div>
  )
}

function Tally({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className="font-heading text-subtitle">{value}</dd>
    </div>
  )
}

function ParticipantRow({ participant }: { participant: ChallengeParticipant }) {
  const event = lastParticipantEvent(participant)

  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      {/*
        Sin `src`: el DTO del participante no trae foto a propósito, así que el
        avatar siempre cae en las iniciales —o en el ícono, cuando el alumno ni
        siquiera cargó su nombre—.
      */}
      <UserAvatar name={participant.studentFirstName} src={null} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-body-strong">
          {participant.studentFirstName?.trim() || "Alumno sin nombre"}
        </p>
        <p className="text-caption text-muted-foreground tabular-nums">
          {event.label} el {formatDate(event.at)}
        </p>
        {participant.redemptionCode && participant.deliveredAt === null && (
          <p className="font-heading text-body tracking-widest">{participant.redemptionCode}</p>
        )}
      </div>
      <StatusPill tone={PARTICIPATION_TONES[participant.status]}>
        {PARTICIPATION_LABELS[participant.status]}
      </StatusPill>
    </li>
  )
}
