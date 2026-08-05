"use client"

import { Loader2, Plus } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useFood } from "../hooks/use-foods"
import { scaleMacros, type FoodMacros } from "../model/food.model"
import { MacroSummary } from "./macro-summary"

export interface PickedFood {
  /** `MealFoodRequest.foodName` — the plan stores a name, not a food id. */
  foodName: string
  quantity: number
  unit: string
  /** Scaled macros, or null when the unit is not grams. */
  macros: FoodMacros | null
}

/** `unit` is any non-blank string upstream; these are just the usual ones. */
const UNITS = ["g", "ml", "unidad", "porción", "cucharada"]

interface FoodDetailSheetProps {
  foodId: number | null
  onOpenChange: (open: boolean) => void
  /** When set, the sheet asks for a quantity and offers to add the food. */
  onPick?: (food: PickedFood) => void
}

export function FoodDetailSheet({ foodId, onOpenChange, onPick }: FoodDetailSheetProps) {
  const { data, isLoading, isError } = useFood(foodId)
  const [quantity, setQuantity] = useState("100")
  const [unit, setUnit] = useState("g")

  const grams = unit === "g" ? Number(quantity.replace(",", ".")) : null
  const scaled =
    data && grams !== null && Number.isFinite(grams) ? scaleMacros(data.macros, grams) : null

  function add() {
    if (!data) return

    const parsed = Number(quantity.replace(",", "."))
    if (!Number.isFinite(parsed) || parsed <= 0) return

    onPick?.({
      foodName: data.brand ? `${data.name} (${data.brand})` : data.name,
      quantity: parsed,
      unit: unit.trim() || "g",
      macros: scaled,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={foodId !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{data?.name ?? "Alimento"}</SheetTitle>
          <SheetDescription>
            {data?.brand ?? "Ficha del catálogo de alimentos."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 py-2">
          {isLoading && (
            <p className="flex items-center gap-2 text-body text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Cargando ficha…
            </p>
          )}

          {isError && <p className="text-body text-error-text">No se ha podido cargar el alimento.</p>}

          {data && (
            <>
              <div className="flex flex-wrap gap-2">
                {data.category && <Badge variant="secondary">{data.category}</Badge>}
                {data.servingDescription && (
                  <Badge variant="outline">{data.servingDescription}</Badge>
                )}
              </div>

              <MacroSummary macros={data.macros} caption="Valores por 100 g" />

              {onPick && (
                <>
                  <Separator />

                  <section className="flex flex-col gap-3">
                    <h3 className="font-medium">Cantidad</h3>

                    <div className="flex gap-2">
                      <div className="flex flex-1 flex-col gap-2">
                        <Label htmlFor="food-quantity">Cantidad</Label>
                        <Input
                          id="food-quantity"
                          inputMode="decimal"
                          value={quantity}
                          onChange={(event) => setQuantity(event.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="food-unit">Unidad</Label>
                        <select
                          id="food-unit"
                          value={unit}
                          onChange={(event) => setUnit(event.target.value)}
                          className={cn(
                            "h-9 rounded-lg border border-input bg-transparent px-2 text-body",
                            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                          )}
                        >
                          {UNITS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {scaled ? (
                      <MacroSummary macros={scaled} caption={`Para ${quantity} g`} />
                    ) : (
                      // Macros are stored per 100 g and `servingDescription` is
                      // unparsed free text, so there is no factor to convert
                      // "1 taza" into grams.
                      <p className="text-caption text-muted-foreground text-pretty">
                        Los macros solo se calculan en gramos. Con otras unidades tendrás que
                        introducirlos a mano en el plan.
                      </p>
                    )}
                  </section>
                </>
              )}
            </>
          )}
        </div>

        {onPick && data && (
          <SheetFooter>
            <Button onClick={add}>
              <Plus className="size-4" />
              Añadir a la comida
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
