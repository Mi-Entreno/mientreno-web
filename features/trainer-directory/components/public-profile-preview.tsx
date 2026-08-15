"use client"

import { ArrowLeft, Eye, MapPin, Star, Users } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/dashboard/empty-state"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/format"
import { billingSuffix } from "@/features/subscription-plans/model/subscription-plan.model"
import { useTrainerProfile } from "@/features/trainer-profile/hooks/use-trainer-profile"
import { usePublicTrainer, useRatingDistribution } from "../hooks/use-directory"
import { RatingDistributionChart } from "./rating-distribution"
import { ReviewList } from "./review-list"

/**
 * The trainer's own page as a student sees it.
 *
 * `TrainerProfileResponseDTO.id` and the id in `/api/trainers/{id}` are the
 * same `Trainer` primary key, so the trainer's own profile is what identifies
 * them in the public directory.
 */
export function PublicProfilePreview() {
  const own = useTrainerProfile()
  const trainerId = own.data?.id ?? null

  const detail = usePublicTrainer(trainerId)
  const distribution = useRatingDistribution(trainerId)

  if (own.isLoading || detail.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (own.data === null) {
    return (
      <EmptyState
        icon={Eye}
        title="Aún no tienes perfil público"
        description="Completa tu perfil profesional para aparecer en el directorio de entrenadores."
      />
    )
  }

  if (detail.isError || !detail.data) {
    return <p className="text-body text-error-text">No se ha podido cargar tu ficha pública.</p>
  }

  const trainer = detail.data
  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/profile"
        className="flex w-fit items-center gap-1.5 text-body text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a mi perfil
      </Link>

      <p className="flex items-start gap-2 rounded-lg border border-border bg-secondary/50 p-3 text-body text-muted-foreground">
        <Eye className="mt-0.5 size-4 shrink-0" />
        <span className="text-pretty">
          Así te ven los alumnos en el directorio. Los datos vienen de los mismos endpoints
          públicos que consume su aplicación.
        </span>
      </p>

      <header className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row">
        <UserAvatar name={trainer.fullName} src={trainer.avatarUrl} className="size-20" />

        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-title font-semibold tracking-tight">
            {trainer.fullName}
          </h2>

          <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-body text-muted-foreground">
            {trainer.location && (
              <li className="flex items-center gap-1.5">
                <MapPin className="size-4" />
                {trainer.location}
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <Star className="size-4" />
              {trainer.avgRating === null
                ? "Sin valoraciones"
                : `${trainer.avgRating.toFixed(1)} (${trainer.totalReviews})`}
            </li>
            <li className="flex items-center gap-1.5">
              <Users className="size-4" />
              {trainer.activeStudents}{" "}
              {trainer.activeStudents === 1 ? "alumno" : "alumnos"}
            </li>
            {trainer.experienceYears !== null && (
              <li>{trainer.experienceYears} años de experiencia</li>
            )}
          </ul>

          {trainer.bio && (
            <p className="mt-3 whitespace-pre-line text-body text-muted-foreground text-pretty">
              {trainer.bio}
            </p>
          )}

          {trainer.specialties.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {trainer.specialties.map((specialty) => (
                <li key={specialty}>
                  <Badge variant="secondary">{specialty}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {/* The public detail carries the trainer's commercial plans — this is the
          view where a student decides which one to buy. */}
      <section className="flex flex-col gap-3">
        <h3 className="font-heading text-subtitle font-semibold tracking-tight">
          Planes que ven tus alumnos
        </h3>
        {trainer.plans.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-body text-muted-foreground">
            No tienes planes publicados, así que nadie puede suscribirse todavía.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trainer.plans.map((plan) => (
              <li key={plan.id} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium">{plan.name}</p>
                <p className="mt-1 text-body-lg font-semibold tracking-tight">
                  {formatCurrency(plan.price)}
                  <span className="text-body font-normal text-muted-foreground">
                    {billingSuffix(plan.billingPeriod)}
                  </span>
                </p>
                {plan.description && (
                  <p className="mt-1 line-clamp-2 text-body text-muted-foreground">
                    {plan.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {trainer.certifications.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="font-heading text-subtitle font-semibold tracking-tight">
            Certificaciones
          </h3>
          <ul className="flex flex-wrap gap-2">
            {trainer.certifications.map((certification) => (
              <li key={certification.id ?? certification.name}>
                <Badge variant="outline">
                  {certification.name}
                  {certification.issuedBy && ` · ${certification.issuedBy}`}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h3 className="font-heading text-subtitle font-semibold tracking-tight">Valoraciones</h3>
        {distribution.data && <RatingDistributionChart data={distribution.data} />}
        {trainerId !== null && <ReviewList trainerId={trainerId} />}
      </section>
    </div>
  )
}
