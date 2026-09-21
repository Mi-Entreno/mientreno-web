"use client"

import { ArrowRight, Gift, PackageCheck, Target, TriangleAlert, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { EmptyState } from "@/components/dashboard/empty-state"
import { ErrorState } from "@/components/dashboard/error-state"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useBrandProfile } from "@/features/brand/hooks/use-brand"
import { StatusPill } from "@/features/brand/components/status-pill"
import { profileBlockedReason } from "@/features/brand/model/brand.model"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

import { useChallenges, useRedemptions } from "../hooks/use-challenges"
import {
  CHALLENGE_STATUS_LABELS,
  CHALLENGE_STATUS_TONES,
  attentionReason,
  describeRequirement,
  isLive,
  stockUsedRatio,
  type BrandChallenge,
} from "../model/challenge.model"
import { ChallengeParticipantsSheet } from "./challenge-participants-sheet"
import { RedemptionRow } from "./redemption-row"

/**
 * La home del comercio.
 *
 * Responde las tres preguntas con las que se abre el panel: ¿hay algo esperando
 * que entregue?, ¿cuántos desafíos míos están corriendo?, ¿cuánta gente está
 * adentro? Todo lo que se muestra lleva a algún lado — un número que no se puede
 * accionar es decoración.
 *
 * Por eso dejó de ser cuatro números y una ayuda. Los números seguían siendo
 * correctos y seguían sin alcanzar: el comercio entraba, leía "3 para entregar",
 * y tenía que navegar a otra pantalla para hacer cualquier cosa con ese 3. Ahora
 * la cola del mostrador se resuelve acá mismo, los desafíos que necesitan una
 * decisión —publicar, reponer, extender— están listados con el motivo, y desde
 * cada desafío se abre quiénes están anotados.
 *
 * "Cómo funciona" quedó sólo para el comercio que todavía no creó nada: cuando
 * hay desafíos, la pantalla ya está contando la misma historia con datos reales.
 */
export function ChallengesOverview() {
  const challenges = useChallenges()
  const pending = useRedemptions("PENDING")
  const profile = useBrandProfile()
  // El id y no el objeto: entregar un canje invalida la lista, y una copia
  // guardada en el estado dejaría los totales de la ficha congelados.
  const [viewingId, setViewingId] = useState<number | null>(null)

  if (challenges.isError) {
    return <ErrorState error={challenges.error} context="load" onRetry={() => challenges.refetch()} />
  }

  // OJO: estos dos agregados cubren sólo las páginas cargadas, y esta pantalla no
  // pagina — o sea, la primera. Es una limitación PREEXISTENTE (antes el hook
  // pedía la página 0 sin saberlo) y no una regresión: un comercio con más de 20
  // desafíos ya veía estos números cortos. Calcularlos bien no es cuestión de
  // traer más páginas —sería bajar el padrón entero para sumar dos columnas—
  // sino de un endpoint que los devuelva agregados desde la base.
  const items = challenges.items
  const live = items.filter((challenge) => isLive(challenge)).length
  const participants = items.reduce((total, challenge) => total + challenge.acceptedCount, 0)
  const loading = challenges.isLoading || pending.isLoading

  const blocked = profile.data ? profileBlockedReason(profile.data) : null

  // Lo que necesita una decisión, con el motivo ya resuelto para no calcularlo
  // dos veces al pintar la lista.
  const needsAttention = items
    .map((challenge) => ({ challenge, reason: attentionReason(challenge) }))
    .filter((row): row is { challenge: BrandChallenge; reason: string } => row.reason !== null)

  // Los que están corriendo primero y, dentro de esos, los que más gente juntaron:
  // es el orden en el que el comercio quiere mirarlos.
  const highlighted = [...items]
    .sort((a, b) => {
      const byLive = Number(isLive(b)) - Number(isLive(a))
      return byLive !== 0 ? byLive : b.acceptedCount - a.acceptedCount
    })
    .slice(0, 4)

  const pendingItems = pending.data?.items ?? []
  const viewing = items.find((challenge) => challenge.id === viewingId) ?? null

  return (
    <div className="flex flex-col gap-6">
      {blocked && (
        <Card className="border-warning/30 bg-warning-surface/40">
          <CardHeader>
            <CardTitle className="text-body-lg">{blocked}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3">
            <p className="text-body text-muted-foreground text-pretty">
              Sin eso resuelto, tus desafíos no llegan a la app de los alumnos.
            </p>
            <Link
              href="/comercio/perfil"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Ir a mi comercio
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={PackageCheck}
          label="Para entregar"
          value={pending.data?.totalItems ?? 0}
          href="/comercio/canjes"
          loading={loading}
          highlight
        />
        <StatCard
          icon={Target}
          label="Desafíos activos"
          value={live}
          href="/comercio/desafios"
          loading={loading}
        />
        <StatCard
          icon={Users}
          label="Alumnos participando"
          value={participants}
          href="/comercio/desafios"
          loading={loading}
        />
        <StatCard
          icon={Gift}
          label="Desafíos creados"
          value={items.length}
          href="/comercio/desafios"
          loading={loading}
        />
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-52" />
          <Skeleton className="h-52" />
        </div>
      ) : items.length === 0 ? (
        <>
          <EmptyState
            icon={Target}
            title="Todavía no creaste desafíos"
            description="Un desafío es una promesa: el alumno cumple lo que pedís —días entrenados, series, kilos— y se lleva la recompensa que vos ponés."
          />
          <HowItWorks />
        </>
      ) : (
        <>
          <div className="grid items-start gap-4 lg:grid-cols-2">
            <Section
              title="Para entregar"
              icon={PackageCheck}
              href="/comercio/canjes"
              linkLabel="Ir al mostrador"
              empty={
                pendingItems.length === 0
                  ? "No hay nada esperando. Cuando un alumno canjee, aparece acá con su código."
                  : null
              }
            >
              <ul className="flex flex-col gap-2" aria-label="Canjes para entregar">
                {/* Tres y no más: es un resumen, y el resto está a un clic. */}
                {pendingItems.slice(0, 3).map((redemption) => (
                  <RedemptionRow key={redemption.id} redemption={redemption} />
                ))}
              </ul>
              {pendingItems.length > 3 && (
                <p className="text-caption text-muted-foreground">
                  Y {pendingItems.length - 3} más en el mostrador.
                </p>
              )}
            </Section>

            <Section
              title="Necesitan una decisión"
              icon={TriangleAlert}
              href="/comercio/desafios"
              linkLabel="Ver desafíos"
              empty={
                needsAttention.length === 0
                  ? "Ningún desafío tuyo está frenado ni a punto de terminar."
                  : null
              }
            >
              <ul className="flex flex-col gap-2" aria-label="Desafíos que necesitan una decisión">
                {needsAttention.slice(0, 4).map(({ challenge, reason }) => (
                  <li
                    key={challenge.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex min-w-0 flex-col">
                      <p className="truncate text-body-strong">{challenge.name}</p>
                      <p className="text-caption text-warning-text">{reason}</p>
                    </div>
                    <StatusPill tone={CHALLENGE_STATUS_TONES[challenge.status]}>
                      {CHALLENGE_STATUS_LABELS[challenge.status]}
                    </StatusPill>
                  </li>
                ))}
              </ul>
            </Section>
          </div>

          <Section
            title="Tus desafíos"
            icon={Target}
            href="/comercio/desafios"
            linkLabel="Ver todos"
            empty={null}
          >
            <ul className="grid gap-3 sm:grid-cols-2" aria-label="Resumen de desafíos">
              {highlighted.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onViewParticipants={() => setViewingId(challenge.id)}
                />
              ))}
            </ul>
          </Section>
        </>
      )}

      <ChallengeParticipantsSheet
        challenge={viewing}
        open={viewing !== null}
        onOpenChange={(open) => !open && setViewingId(null)}
      />
    </div>
  )
}

/**
 * Un bloque de la home: título, atajo a la pantalla completa y contenido o vacío.
 *
 * Una `<section>` y no una `Card`: adentro van filas que ya son tarjetas, y
 * `Card` sobre `Card` pinta el mismo fondo dos veces, así que el borde interior
 * queda flotando sin nada que separar.
 */
function Section({
  title,
  icon: Icon,
  href,
  linkLabel,
  empty,
  children,
}: {
  title: string
  icon: typeof Gift
  href: string
  linkLabel: string
  /** El texto a mostrar cuando no hay nada. `null` significa que sí hay. */
  empty: string | null
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-heading text-subtitle uppercase">
          <Icon className="size-4" />
          {title}
        </h2>
        <Link
          href={href}
          className="flex shrink-0 items-center gap-1 text-caption text-muted-foreground hover:text-foreground"
        >
          {linkLabel}
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
      {empty ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-body text-muted-foreground text-pretty">
          {empty}
        </p>
      ) : (
        <div className="flex flex-col gap-2">{children}</div>
      )}
    </section>
  )
}

/**
 * Un desafío visto de reojo.
 *
 * La barra mide stock comprometido, no premios entregados: cada alumno que
 * acepta reserva su unidad, así que es lo que contesta "¿me queda para más
 * gente?" — que es la única pregunta que se responde reponiendo.
 */
function ChallengeCard({
  challenge,
  onViewParticipants,
}: {
  challenge: BrandChallenge
  onViewParticipants: () => void
}) {
  const used = stockUsedRatio(challenge)

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-heading text-subtitle uppercase">{challenge.name}</h3>
        <StatusPill tone={CHALLENGE_STATUS_TONES[challenge.status]}>
          {CHALLENGE_STATUS_LABELS[challenge.status]}
        </StatusPill>
      </div>

      <p className="text-caption text-muted-foreground">
        {challenge.requirements.map((requirement) => describeRequirement(requirement)).join(" + ")} ·{" "}
        {challenge.reward.name}
      </p>

      <div className="flex flex-col gap-1">
        <div
          className="h-1.5 overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-label="Unidades comprometidas"
          aria-valuemin={0}
          aria-valuemax={challenge.reward.stock}
          aria-valuenow={challenge.reward.stock - challenge.stockLeft}
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${used * 100}%` }} />
        </div>
        <p className="text-caption text-muted-foreground tabular-nums">
          {challenge.reward.stock - challenge.stockLeft} de {challenge.reward.stock} unidades tomadas ·
          termina el {formatDate(challenge.endsAt)}
        </p>
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
      </dl>

      <Button size="sm" variant="outline" className="self-start" onClick={onViewParticipants}>
        <Users className="size-4" />
        Ver alumnos
      </Button>
    </li>
  )
}

function HowItWorks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-body-lg">Cómo funciona</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-4 text-body text-muted-foreground">
        <ol className="flex list-decimal flex-col gap-1.5 pl-4">
          <li>Creás un desafío: qué tiene que lograr el alumno y qué se lleva al conseguirlo.</li>
          <li>Lo publicás. Aparece en la app y cada alumno que lo acepta reserva una unidad.</li>
          <li>Cuando completa, canjea y te llega acá. Validás el código y lo marcás entregado.</li>
        </ol>
        {/* El alta vive en "Desafíos": la home no abre el asistente, lo lleva. */}
        <Link href="/comercio/desafios" className={cn(buttonVariants())}>
          Crear mi primer desafío
        </Link>
      </CardContent>
    </Card>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  loading,
  highlight,
}: {
  icon: typeof Gift
  label: string
  value: number
  href: string
  loading: boolean
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-xl border border-border bg-card p-5 transition-colors hover:bg-muted/40",
        // La cola lleva el acento: es la única tarjeta con trabajo detrás.
        highlight && value > 0 && "border-primary/40 bg-primary/5",
      )}
    >
      <span className="flex items-center gap-2 text-body text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </span>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-12" />
      ) : (
        <p className="mt-2 font-heading text-display tabular-nums">{value}</p>
      )}
    </Link>
  )
}
