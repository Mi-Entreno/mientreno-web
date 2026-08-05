"use client"

import { Dumbbell, Loader2, Plus, SearchX } from "lucide-react"

import { EmptyState } from "@/components/dashboard/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { CatalogExercise } from "../model/catalog-exercise.model"

interface ExerciseListProps {
  exercises: CatalogExercise[]
  totalItems: number
  isLoading: boolean
  isError: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
  onSelect: (exercise: CatalogExercise) => void
  /** Label of the per-row action. "Ver" when browsing, "Añadir" when picking. */
  actionLabel?: string
  actionIcon?: "view" | "add"
}

export function ExerciseList({
  exercises,
  totalItems,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onSelect,
  actionLabel = "Ver detalle",
  actionIcon = "view",
}: ExerciseListProps) {
  if (isLoading) {
    return (
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <li key={index}>
            <Skeleton className="h-24 w-full rounded-xl" />
          </li>
        ))}
      </ul>
    )
  }

  if (isError) {
    return <p className="text-body text-error-text">No se ha podido cargar el catálogo.</p>
  }

  if (exercises.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Ningún ejercicio coincide"
        description="Prueba con otro término o quita alguno de los filtros."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-muted-foreground">
        {totalItems} {totalItems === 1 ? "ejercicio" : "ejercicios"}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {exercises.map((exercise) => (
          <li
            key={exercise.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                <Dumbbell className="size-4" />
              </div>
              <h3 className="min-w-0 font-medium text-balance">{exercise.title}</h3>
            </div>

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

            <Button
              variant="outline"
              size="sm"
              className="mt-auto self-start"
              onClick={() => onSelect(exercise)}
            >
              {actionIcon === "add" && <Plus className="size-4" />}
              {actionLabel}
            </Button>
          </li>
        ))}
      </ul>

      {hasNextPage && (
        <Button
          variant="outline"
          className="self-center"
          disabled={isFetchingNextPage}
          onClick={onLoadMore}
        >
          {isFetchingNextPage && <Loader2 className="size-4 animate-spin" />}
          {isFetchingNextPage ? "Cargando…" : "Cargar más"}
        </Button>
      )}
    </div>
  )
}
