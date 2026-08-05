"use client"

import { PencilLine } from "lucide-react"
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
import { useFoodSearch } from "../hooks/use-foods"
import { EMPTY_FOOD_SEARCH, type FoodSearchParams } from "../model/food.model"
import { FoodDetailSheet, type PickedFood } from "./food-detail-sheet"
import { FoodFilters } from "./food-filters"
import { FoodList } from "./food-list"

interface FoodPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPick: (food: PickedFood) => void
}

/**
 * Picks a food for a nutrition plan — the component phase 7 builds on.
 *
 * Unlike exercises, a plan does **not** link to the catalogue:
 * `MealFoodRequest` is `(foodName, quantity, unit)` with no food id. So picking
 * from the catalogue only fills in a name; its value is the macros, which the
 * meal editor can use to fill `calories`, `proteinG`, `carbsG` and `fatG`
 * instead of making the trainer add them up by hand.
 *
 * That also means free text costs nothing structurally here, which is why it is
 * a first-class option rather than the escape hatch it is for exercises.
 */
export function FoodPicker({ open, onOpenChange, onPick }: FoodPickerProps) {
  const [params, setParams] = useState<FoodSearchParams>(EMPTY_FOOD_SEARCH)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [customName, setCustomName] = useState("")
  const [customQuantity, setCustomQuantity] = useState("100")
  const [customUnit, setCustomUnit] = useState("g")

  const debouncedSearch = useDebouncedValue(params.search, 300)
  const search = useFoodSearch({ ...params, search: debouncedSearch })

  function addCustom() {
    const name = customName.trim()
    const quantity = Number(customQuantity.replace(",", "."))
    if (!name || !Number.isFinite(quantity) || quantity <= 0) return

    onPick({ foodName: name, quantity, unit: customUnit.trim() || "g", macros: null })
    setCustomName("")
    onOpenChange(false)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Añadir alimento</SheetTitle>
            <SheetDescription>
              Elígelo del catálogo para calcular los macros automáticamente, o escríbelo a mano.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2">
            <FoodFilters value={params} categories={search.categories} onChange={setParams} />

            <FoodList
              foods={search.foods}
              totalItems={search.totalItems}
              isLoading={search.isLoading}
              isError={search.isError}
              hasNextPage={search.hasNextPage}
              isFetchingNextPage={search.isFetchingNextPage}
              onLoadMore={() => search.fetchNextPage()}
              onSelect={(food) => setDetailId(food.id)}
              actionLabel="Elegir"
              actionIcon="add"
            />

            <Separator />

            <section className="flex flex-col gap-3">
              <div>
                <h3 className="flex items-center gap-2 font-medium">
                  <PencilLine className="size-4" />
                  Alimento libre
                </h3>
                <p className="mt-1 text-caption text-muted-foreground text-pretty">
                  El plan guarda el nombre tal cual, así que esto es equivalente a elegirlo del
                  catálogo salvo por el cálculo de macros.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex flex-1 flex-col gap-2">
                  <Label htmlFor="custom-food">Nombre</Label>
                  <Input
                    id="custom-food"
                    value={customName}
                    placeholder="Tortilla de claras"
                    onChange={(event) => setCustomName(event.target.value)}
                  />
                </div>
                <div className="flex w-24 flex-col gap-2">
                  <Label htmlFor="custom-quantity">Cantidad</Label>
                  <Input
                    id="custom-quantity"
                    inputMode="decimal"
                    value={customQuantity}
                    onChange={(event) => setCustomQuantity(event.target.value)}
                  />
                </div>
                <div className="flex w-24 flex-col gap-2">
                  <Label htmlFor="custom-unit">Unidad</Label>
                  <Input
                    id="custom-unit"
                    value={customUnit}
                    onChange={(event) => setCustomUnit(event.target.value)}
                  />
                </div>
                <Button type="button" variant="outline" disabled={!customName.trim()} onClick={addCustom}>
                  Añadir
                </Button>
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>

      <FoodDetailSheet
        foodId={detailId}
        onOpenChange={(nextOpen) => !nextOpen && setDetailId(null)}
        onPick={(food) => {
          onPick(food)
          setDetailId(null)
          onOpenChange(false)
        }}
      />
    </>
  )
}
