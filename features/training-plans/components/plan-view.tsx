"use client"

import { Film, Moon, Video } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExerciseVideosSheet } from "@/features/exercises/components/exercise-videos-sheet"
import type { PlanExercise, TrainingPlan } from "../model/training-plan.model"

/**
 * Read-only rendering of a plan version.
 *
 * Video management hangs off here rather than off the editor: exercises only
 * have ids once the plan is saved, and a draft's rows have none.
 */
export function PlanView({ plan }: { plan: TrainingPlan }) {
  const [videosFor, setVideosFor] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-4">
      {plan.notes && (
        <p className="whitespace-pre-line rounded-xl border border-border bg-card p-4 text-body text-muted-foreground text-pretty">
          {plan.notes}
        </p>
      )}

      <ul className="flex flex-col gap-4">
        {plan.days.map((day) => (
          <li key={day.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-heading text-body-lg font-semibold tracking-tight">
                {day.label || `Día ${day.dayNumber}`}
              </h3>
              {day.restDay ? (
                <Badge variant="secondary" className="gap-1">
                  <Moon className="size-3" />
                  Descanso
                </Badge>
              ) : (
                <span className="text-body text-muted-foreground">
                  {day.exercises.length}{" "}
                  {day.exercises.length === 1 ? "ejercicio" : "ejercicios"}
                </span>
              )}
            </div>

            {!day.restDay && day.exercises.length > 0 && (
              <ol className="mt-4 flex flex-col gap-3">
                {day.exercises.map((exercise) => (
                  <ExerciseView
                    key={exercise.id}
                    exercise={exercise}
                    onManageVideos={() => setVideosFor(exercise.id)}
                  />
                ))}
              </ol>
            )}
          </li>
        ))}
      </ul>

      <ExerciseVideosSheet
        exerciseId={videosFor}
        onOpenChange={(open) => !open && setVideosFor(null)}
      />
    </div>
  )
}

function ExerciseView({
  exercise,
  onManageVideos,
}: {
  exercise: PlanExercise
  onManageVideos: () => void
}) {
  const specs = buildSpecs(exercise)

  return (
    <li className="rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-medium">
          <span className="mr-2 font-mono text-caption text-muted-foreground">
            {exercise.order}
          </span>
          {exercise.name}
        </p>

        <ul className="flex flex-wrap gap-1.5">
          {exercise.muscleGroup && (
            <li>
              <Badge variant="secondary">{exercise.muscleGroup}</Badge>
            </li>
          )}
          {exercise.equipment && (
            <li>
              <Badge variant="outline">{exercise.equipment}</Badge>
            </li>
          )}
        </ul>
      </div>

      {specs.length > 0 && (
        <p className="mt-1.5 text-body text-muted-foreground">{specs.join(" · ")}</p>
      )}

      {exercise.trainerNotes && (
        <p className="mt-2 whitespace-pre-line text-body text-muted-foreground text-pretty">
          {exercise.trainerNotes}
        </p>
      )}

      <div className="mt-2 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onManageVideos}>
          <Film className="size-4" />
          {exercise.mediaUrl ? "Ver y gestionar vídeos" : "Añadir vídeo"}
        </Button>
        {exercise.mediaUrl && (
          <Badge variant="secondary" className="gap-1">
            <Video className="size-3" />
            Con vídeo
          </Badge>
        )}
      </div>
    </li>
  )
}

function buildSpecs(exercise: PlanExercise): string[] {
  const specs: string[] = []

  if (exercise.sets !== null && exercise.reps !== null) {
    specs.push(`${exercise.sets} × ${exercise.reps}`)
  } else if (exercise.sets !== null) {
    specs.push(`${exercise.sets} series`)
  } else if (exercise.reps !== null) {
    specs.push(`${exercise.reps} reps`)
  }

  if (exercise.weightUnit === "BODYWEIGHT") {
    specs.push("Peso corporal")
  } else if (exercise.weightValue !== null) {
    specs.push(`${exercise.weightValue}${exercise.weightUnit === "LB" ? " lb" : " kg"}`)
  }

  if (exercise.durationSeconds !== null) specs.push(`${exercise.durationSeconds}s`)
  if (exercise.restSeconds !== null) specs.push(`descanso ${exercise.restSeconds}s`)

  return specs
}
