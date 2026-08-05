"use client"

import { Calculator, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FoodPicker } from "@/features/foods/components/food-picker"
import type { PickedFood } from "@/features/foods/components/food-detail-sheet"
import { cn } from "@/lib/utils"
import {
  TIME_OF_DAY_OPTIONS,
  nextKey,
  sumFoodMacros,
  type EditorMeal,
  type EditorMealFood,
  type TimeOfDay,
} from "../model/nutrition-plan.model"

interface MealEditorProps {
  meal: EditorMeal
  index: number
  total: number
  disabled?: boolean
  onChange: (patch: Partial<EditorMeal>) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

export function MealEditor({
  meal,
  index,
  total,
  disabled,
  onChange,
  onRemove,
  onMove,
}: MealEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  const computed = sumFoodMacros(meal.foods)

  function addFood(picked: PickedFood) {
    const food: EditorMealFood = {
      key: nextKey("food"),
      foodName: picked.foodName,
      quantity: String(picked.quantity),
      unit: picked.unit,
      macros: picked.macros,
    }
    onChange({ foods: [...meal.foods, food] })
  }

  function patchFood(foodIndex: number, patch: Partial<EditorMealFood>) {
    onChange({
      foods: meal.foods.map((food, i) => (i === foodIndex ? { ...food, ...patch } : food)),
    })
  }

  function applyComputedMacros() {
    if (!computed) return

    onChange({
      calories: computed.calories === null ? "" : String(computed.calories),
      proteinG: computed.protein === null ? "" : String(computed.protein),
      carbsG: computed.carbs === null ? "" : String(computed.carbs),
      fatG: computed.fat === null ? "" : String(computed.fat),
    })
  }

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`${meal.key}-name`}>
              Nombre <span className="text-error-text">*</span>
            </Label>
            <Input
              id={`${meal.key}-name`}
              value={meal.name}
              disabled={disabled}
              placeholder="Desayuno"
              onChange={(event) => onChange({ name: event.target.value })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`${meal.key}-time`}>
              Momento del día <span className="text-error-text">*</span>
            </Label>
            <select
              id={`${meal.key}-time`}
              value={meal.timeOfDay}
              disabled={disabled}
              onChange={(event) => onChange({ timeOfDay: event.target.value as TimeOfDay })}
              className={cn(
                "h-9 rounded-lg border border-input bg-transparent px-2 text-body",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {TIME_OF_DAY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex shrink-0 gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || index === 0}
            aria-label="Subir comida"
            onClick={() => onMove(-1)}
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || index === total - 1}
            aria-label="Bajar comida"
            onClick={() => onMove(1)}
          >
            <ChevronDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || total === 1}
            aria-label="Quitar comida"
            className="text-error-text focus-visible:text-error-text"
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Label>Alimentos</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => setPickerOpen(true)}
          >
            <Plus className="size-4" />
            Añadir alimento
          </Button>
        </div>

        {meal.foods.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-3 text-body text-muted-foreground">
            Sin alimentos todavía.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {meal.foods.map((food, foodIndex) => (
              <li key={food.key} className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
                <Input
                  value={food.foodName}
                  disabled={disabled}
                  aria-label="Alimento"
                  className="flex-1"
                  onChange={(event) => patchFood(foodIndex, { foodName: event.target.value })}
                />
                <Input
                  value={food.quantity}
                  disabled={disabled}
                  inputMode="decimal"
                  aria-label="Cantidad"
                  className="w-20"
                  onChange={(event) => patchFood(foodIndex, { quantity: event.target.value })}
                />
                <Input
                  value={food.unit}
                  disabled={disabled}
                  aria-label="Unidad"
                  className="w-20"
                  onChange={(event) => patchFood(foodIndex, { unit: event.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  aria-label={`Quitar ${food.foodName || "alimento"}`}
                  className="text-error-text focus-visible:text-error-text"
                  onClick={() =>
                    onChange({ foods: meal.foods.filter((_, i) => i !== foodIndex) })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label>Macros de la comida</Label>
          {computed && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={applyComputedMacros}
            >
              <Calculator className="size-4" />
              Calcular desde los alimentos
            </Button>
          )}
        </div>

        {computed ? (
          <Badge variant="secondary" className="self-start">
            Calculado: {computed.calories} kcal · P {computed.protein}g · C {computed.carbs}g · G{" "}
            {computed.fat}g
          </Badge>
        ) : (
          meal.foods.length > 0 && (
            // Macros are not stored per meal food, so a plan loaded from the API
            // has no basis to compute from until foods are re-picked.
            <p className="text-caption text-muted-foreground text-pretty">
              Para calcular los macros automáticamente, añade los alimentos desde el catálogo en
              gramos. Los alimentos guardados anteriormente no conservan sus valores.
            </p>
          )
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MacroField
            id={`${meal.key}-kcal`}
            label="Calorías"
            value={meal.calories}
            disabled={disabled}
            onChange={(calories) => onChange({ calories })}
          />
          <MacroField
            id={`${meal.key}-protein`}
            label="Proteína (g)"
            value={meal.proteinG}
            disabled={disabled}
            onChange={(proteinG) => onChange({ proteinG })}
          />
          <MacroField
            id={`${meal.key}-carbs`}
            label="Carbos (g)"
            value={meal.carbsG}
            disabled={disabled}
            onChange={(carbsG) => onChange({ carbsG })}
          />
          <MacroField
            id={`${meal.key}-fat`}
            label="Grasas (g)"
            value={meal.fatG}
            disabled={disabled}
            onChange={(fatG) => onChange({ fatG })}
          />
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${meal.key}-notes`}>Notas</Label>
        <Textarea
          id={`${meal.key}-notes`}
          rows={2}
          value={meal.notes}
          disabled={disabled}
          placeholder="Preparación, sustituciones permitidas…"
          onChange={(event) => onChange({ notes: event.target.value })}
        />
      </div>

      <FoodPicker open={pickerOpen} onOpenChange={setPickerOpen} onPick={addFood} />
    </li>
  )
}

function MacroField({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  id: string
  label: string
  value: string
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="decimal"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
