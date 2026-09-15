"use client"

import { PencilLine, Search } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useDebouncedValue } from "@/core/hooks/use-debounced-value"
import { useCatalogSearch } from "../hooks/use-catalog-exercises"
import { EMPTY_SEARCH, type CatalogExercise, type CatalogSearchParams } from "../model/catalog-exercise.model"
import { ExerciseList } from "./exercise-list"

/** Mirrors `Exercise.name`, `@Column(length = 150)`. */
const NAME_MAX_LENGTH = 150

export interface PickedExercise {
  /** Set when chosen from the catalogue; null for a custom exercise. */
  catalogExerciseId: number | null
  name: string
  muscleGroup: string | null
  equipment: string | null
}

interface ExercisePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (exercise: PickedExercise) => void
}

/**
 * Picks an exercise for a training plan — the component phase 5 builds on.
 *
 * `CreateTrainingPlanRequestDTO.ExerciseRequest` documents that `name` and
 * `catalogExerciseId` are both optional individually but at least one is
 * required, and that sending `catalogExerciseId` lets the backend link the
 * catalogue entry and reuse its title. So the catalogue is the primary path and
 * free text is the escape hatch, not the default.
 *
 * Búsqueda por nombre y nada más: los filtros por grupo muscular y
 * equipamiento vivían acá arriba y empujaban la lista fuera de la pantalla
 * (ver `CatalogSearchParams`).
 */
export function ExercisePicker({ open, onOpenChange, onPick }: ExercisePickerProps) {
  const [params, setParams] = useState<CatalogSearchParams>(EMPTY_SEARCH)
  const [customName, setCustomName] = useState("")

  // Debounced so typing does not fire a request per keystroke.
  const debouncedSearch = useDebouncedValue(params.search, 300)
  const search = useCatalogSearch({ search: debouncedSearch })

  function pickFromCatalogue(exercise: CatalogExercise) {
    onPick({
      catalogExerciseId: exercise.id,
      name: exercise.title,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
    })
    onOpenChange(false)
  }

  function pickCustom() {
    const name = customName.trim()
    if (!name) return

    onPick({ catalogExerciseId: null, name, muscleGroup: null, equipment: null })
    setCustomName("")
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Agregar ejercicio</SheetTitle>
          <SheetDescription>
            Elegí uno del catálogo para que el plan herede grupo muscular, equipamiento e
            instrucciones.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={params.search}
              placeholder="Buscar por nombre…"
              aria-label="Buscar ejercicio"
              className="pl-9"
              onChange={(event) => setParams({ search: event.target.value })}
            />
          </div>

          <ExerciseList
            exercises={search.exercises}
            totalItems={search.totalItems}
            isLoading={search.isLoading}
            isError={search.isError}
            error={search.error}
            onRetry={() => search.refetch()}
            hasNextPage={search.hasNextPage}
            isFetchingNextPage={search.isFetchingNextPage}
            onLoadMore={() => search.fetchNextPage()}
            onSelect={pickFromCatalogue}
            actionLabel="Agregar"
            actionIcon="add"
          />

          <Separator />

          <section className="flex flex-col gap-3">
            <div>
              <h3 className="flex items-center gap-2 font-medium">
                <PencilLine className="size-4" />
                Ejercicio personalizado
              </h3>
              <p className="mt-1 text-caption text-muted-foreground text-pretty">
                Úsalo solo si no encuentras el ejercicio: al no vincularlo al catálogo, el alumno
                no verá instrucciones ni grupo muscular.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="flex flex-1 flex-col gap-2">
                <Label htmlFor="custom-exercise" className="sr-only">
                  Nombre del ejercicio
                </Label>
                <Input
                  id="custom-exercise"
                  value={customName}
                  maxLength={NAME_MAX_LENGTH}
                  placeholder="Nombre del ejercicio"
                  onChange={(event) => setCustomName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      pickCustom()
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={!customName.trim()}
                onClick={pickCustom}
              >
                Agregar personalizado
              </Button>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
