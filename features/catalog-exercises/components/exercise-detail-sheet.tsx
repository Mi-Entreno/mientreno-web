"use client"

import { Loader2, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useCatalogExercise } from "../hooks/use-catalog-exercises"
import type { CatalogExercise } from "../model/catalog-exercise.model"

interface ExerciseDetailSheetProps {
  exerciseId: number | null
  onOpenChange: (open: boolean) => void
  /** When set, the sheet offers to add the exercise instead of just showing it. */
  onPick?: (exercise: CatalogExercise) => void
}

/**
 * Detail for a catalogue exercise — instructions and secondary muscles, which
 * the paginated summary does not carry.
 */
export function ExerciseDetailSheet({
  exerciseId,
  onOpenChange,
  onPick,
}: ExerciseDetailSheetProps) {
  const { data, isLoading, isError } = useCatalogExercise(exerciseId)

  return (
    <Sheet open={exerciseId !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{data?.title ?? "Ejercicio"}</SheetTitle>
          <SheetDescription>Ficha del catálogo maestro.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2">
          {isLoading && (
            <p className="flex items-center gap-2 text-body text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando ficha…
            </p>
          )}

          {isError && (
            <p className="text-body text-error-text">No se ha podido cargar el ejercicio.</p>
          )}

          {data && (
            <>
              <div className="flex flex-wrap gap-2">
                {data.muscleGroup && <Badge variant="secondary">{data.muscleGroup}</Badge>}
                {data.equipment && <Badge variant="outline">{data.equipment}</Badge>}
              </div>

              {data.secondaryMuscles.length > 0 && (
                <section className="flex flex-col gap-2">
                  <h3 className="font-medium">Músculos secundarios</h3>
                  <ul className="flex flex-wrap gap-1.5">
                    {data.secondaryMuscles.map((muscle) => (
                      <li key={muscle}>
                        <Badge variant="secondary">{muscle}</Badge>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section className="flex flex-col gap-2">
                <h3 className="font-medium">Instrucciones</h3>
                {data.instructions ? (
                  // Imported free text, line breaks and all.
                  <p className="whitespace-pre-line text-body text-muted-foreground text-pretty">
                    {data.instructions}
                  </p>
                ) : (
                  <p className="text-body text-muted-foreground">
                    Este ejercicio no tiene instrucciones en el catálogo.
                  </p>
                )}
              </section>
            </>
          )}
        </div>

        {onPick && data && (
          <SheetFooter>
            <Button
              onClick={() => {
                onPick(data)
                onOpenChange(false)
              }}
            >
              <Plus className="size-4" />
              Añadir al plan
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
