"use client"

import { Loader2, Star } from "lucide-react"

import { ErrorState } from "@/components/dashboard/error-state"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { formatDate } from "@/lib/format"
import { useWorkoutSession } from "../hooks/use-workout-session"
import {
  WORKOUT_STATUS_LABELS,
  groupSetsByExercise,
  totalVolume,
  type WorkoutSet,
} from "../model/workout-session.model"

/**
 * A completed workout session: what the student actually did, set by set.
 *
 * Reachable today only via `?session=<id>` — see the repository for why nothing
 * lists sessions for a trainer.
 */
export function WorkoutSessionSheet({
  sessionId,
  onOpenChange,
}: {
  sessionId: number | null
  onOpenChange: (open: boolean) => void
}) {
  const { data, isLoading, isError, error, refetch } = useWorkoutSession(sessionId)

  const groups = data ? groupSetsByExercise(data.sets) : []
  const volume = data ? totalVolume(data.sets) : null

  return (
    <Sheet open={sessionId !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {data?.dayLabel || (data?.dayNumber ? `Día ${data.dayNumber}` : "Sesión")}
          </SheetTitle>
          <SheetDescription>
            {data?.planTitle || "Sesión de entrenamiento del alumno."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2">
          {isLoading && (
            <p className="flex items-center gap-2 text-body text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando sesión…
            </p>
          )}

          {isError && (
            <ErrorState error={error} onRetry={() => refetch()} inline />
          )}

          {data && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={data.status === "COMPLETED" ? "default" : "secondary"}>
                  {WORKOUT_STATUS_LABELS[data.status]}
                </Badge>
                {data.startedAt && (
                  <span className="text-body text-muted-foreground">
                    {formatDate(data.startedAt)}
                  </span>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-4 rounded-xl border border-border p-4">
                <div>
                  <dt className="text-caption text-muted-foreground">Series registradas</dt>
                  <dd className="text-body font-medium">{data.sets.length}</dd>
                </div>
                <div>
                  <dt className="text-caption text-muted-foreground">Volumen total</dt>
                  <dd className="text-body font-medium">
                    {/* Needs both weight and reps; null when the student logged
                        neither, rather than a misleading 0. */}
                    {volume === null ? "—" : `${volume} kg`}
                  </dd>
                </div>
              </dl>

              {data.feedback && (
                <section className="flex flex-col gap-2 rounded-xl border border-border p-4">
                  <h3 className="flex items-center gap-2 font-medium">
                    <Star className="size-4" />
                    Valoración del alumno
                  </h3>
                  <p className="text-body">
                    {data.feedback.overallRating}/5
                    {data.feedback.fatigueLevel !== null && (
                      <span className="text-muted-foreground">
                        {" "}
                        · fatiga {data.feedback.fatigueLevel}/10
                      </span>
                    )}
                  </p>
                  {data.feedback.notes && (
                    <p className="whitespace-pre-line text-body text-muted-foreground text-pretty">
                      {data.feedback.notes}
                    </p>
                  )}
                </section>
              )}

              {groups.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border p-4 text-body text-muted-foreground">
                  El alumno no registró ninguna serie en esta sesión.
                </p>
              ) : (
                <section className="flex flex-col gap-3">
                  <h3 className="font-medium">Series</h3>
                  <ul className="flex flex-col gap-3">
                    {groups.map((group) => (
                      <li
                        key={group.exerciseId}
                        className="rounded-xl border border-border p-3"
                      >
                        <p className="font-medium">{group.exerciseName}</p>
                        <ul className="mt-2 flex flex-col gap-1">
                          {group.sets.map((set) => (
                            <li
                              key={set.id}
                              className="flex items-baseline justify-between gap-3 text-body"
                            >
                              <span className="text-muted-foreground">Serie {set.setNumber}</span>
                              <span>{describeSet(set)}</span>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.notes && (
                <section className="flex flex-col gap-2">
                  <h3 className="font-medium">Notas de la sesión</h3>
                  <p className="whitespace-pre-line text-body text-muted-foreground text-pretty">
                    {data.notes}
                  </p>
                </section>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Skips whatever the student did not log, instead of printing zeroes. */
function describeSet(set: WorkoutSet): string {
  const parts: string[] = []

  if (set.repsCompleted !== null) parts.push(`${set.repsCompleted} reps`)
  if (set.weightKg !== null) parts.push(`${set.weightKg} kg`)
  if (set.durationSeconds !== null) parts.push(`${set.durationSeconds}s`)
  if (set.difficulty !== null) parts.push(`RPE ${set.difficulty}`)

  return parts.length > 0 ? parts.join(" · ") : "Sin datos"
}
