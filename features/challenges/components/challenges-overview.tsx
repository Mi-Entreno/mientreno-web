"use client"

import { Gift, PackageCheck, Target, Users } from "lucide-react"
import Link from "next/link"

import { ErrorState } from "@/components/dashboard/error-state"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useBrandProfile } from "@/features/brand/hooks/use-brand"
import { profileBlockedReason } from "@/features/brand/model/brand.model"
import { cn } from "@/lib/utils"

import { useChallenges, useRedemptions } from "../hooks/use-challenges"
import { isLive } from "../model/challenge.model"

/**
 * La home del comercio.
 *
 * Responde las tres preguntas con las que se abre el panel: ¿hay algo esperando
 * que entregue?, ¿cuántos desafíos míos están corriendo?, ¿cuánta gente está
 * adentro? Todo lo que se muestra lleva a algún lado — un número que no se puede
 * accionar es decoración.
 */
export function ChallengesOverview() {
  const challenges = useChallenges()
  const pending = useRedemptions("PENDING")
  const profile = useBrandProfile()

  if (challenges.isError) {
    return <ErrorState error={challenges.error} context="load" onRetry={() => challenges.refetch()} />
  }

  const items = challenges.data?.items ?? []
  const live = items.filter((challenge) => isLive(challenge)).length
  const participants = items.reduce((total, challenge) => total + challenge.acceptedCount, 0)
  const loading = challenges.isLoading || pending.isLoading

  const blocked = profile.data ? profileBlockedReason(profile.data) : null

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

      <Card>
        <CardHeader>
          <CardTitle className="text-body-lg">Cómo funciona</CardTitle>
        </CardHeader>
        <CardContent className="text-body text-muted-foreground">
          <ol className="flex list-decimal flex-col gap-1.5 pl-4">
            <li>Creás un desafío: qué tiene que lograr el alumno y qué se lleva al conseguirlo.</li>
            <li>Lo publicás. Aparece en la app y cada alumno que lo acepta reserva una unidad.</li>
            <li>Cuando completa, canjea y te llega acá. Validás el código y lo marcás entregado.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
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
