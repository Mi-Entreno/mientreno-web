"use client"

import { Loader2, Plus, Save, Upload } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/core/http/errors"
import {
  emptyMeal,
  sumMealMacros,
  type EditorMeal,
  type EditorNutritionPlan,
} from "../model/nutrition-plan.model"
import { MealEditor } from "./meal-editor"
import { PlanTotalsBar } from "./plan-totals-bar"

interface NutritionPlanEditorProps {
  value: EditorNutritionPlan
  onChange: (plan: EditorNutritionPlan) => void
  editingPlanId: number | null
  editingVersion: number | null
  isPending: boolean
  error?: unknown
  onPublish: () => void
  onSaveInPlace: () => void
  onCancel?: () => void
}

/**
 * Nutrition plan editor.
 *
 * Same two save actions as the training editor, for the same reason: `POST`
 * versions and `PUT` edits in place, whatever the Swagger annotations claim.
 * The one difference is that publishing here does **not** notify the student —
 * `NutritionPlanService.create` sends no notification — so the copy does not
 * promise one.
 */
export function NutritionPlanEditor({
  value,
  onChange,
  editingPlanId,
  editingVersion,
  isPending,
  error,
  onPublish,
  onSaveInPlace,
  onCancel,
}: NutritionPlanEditorProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const serverErrors = error instanceof ApiError ? error.fieldErrors : {}
  const allErrors = { ...serverErrors, ...errors }

  const totals = useMemo(
    () =>
      sumMealMacros(
        value.meals.map((meal) => ({
          calories: parseOrNull(meal.calories),
          proteinG: parseOrNull(meal.proteinG),
          carbsG: parseOrNull(meal.carbsG),
          fatG: parseOrNull(meal.fatG),
        })),
      ),
    [value.meals],
  )

  function patchMeal(index: number, patch: Partial<EditorMeal>) {
    onChange({
      ...value,
      meals: value.meals.map((meal, i) => (i === index ? { ...meal, ...patch } : meal)),
    })
  }

  function moveMeal(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= value.meals.length) return

    const meals = [...value.meals]
    ;[meals[index], meals[target]] = [meals[target], meals[index]]
    onChange({ ...value, meals })
  }

  function validate(): boolean {
    const found: Record<string, string> = {}

    if (!value.title.trim()) found.title = "El título es obligatorio"
    if (value.meals.length === 0) found.meals = "El plan necesita al menos una comida"

    // `MealRequest.name` is @NotBlank upstream.
    if (value.meals.some((meal) => !meal.name.trim())) {
      found.mealName = "Cada comida necesita un nombre"
    }

    // `MealFoodRequest.quantity` is @NotNull, so a food with no quantity would
    // be sent as 0 — flag it instead of silently writing a meaningless value.
    const badQuantity = value.meals.some((meal) =>
      meal.foods.some((food) => food.foodName.trim() && parseOrNull(food.quantity) === null),
    )
    if (badQuantity) found.foods = "Cada alimento necesita una cantidad"

    setErrors(found)
    return Object.keys(found).length === 0
  }

  function submit(action: () => void) {
    return (event: { preventDefault: () => void }) => {
      event.preventDefault()
      if (!validate()) return
      action()
    }
  }

  return (
    <form onSubmit={submit(onPublish)} className="flex flex-col gap-6" noValidate>
      <div className="grid gap-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="nutrition-title">
            Título del plan <span className="text-error-text">*</span>
          </Label>
          <Input
            id="nutrition-title"
            value={value.title}
            disabled={isPending}
            placeholder="Definición · 1900 kcal"
            onChange={(event) => onChange({ ...value, title: event.target.value })}
          />
          {allErrors.title && <p className="text-body text-error-text">{allErrors.title}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="nutrition-notes">Notas generales</Label>
          <Textarea
            id="nutrition-notes"
            rows={3}
            value={value.notes}
            disabled={isPending}
            placeholder="Objetivo calórico, hidratación, suplementación…"
            onChange={(event) => onChange({ ...value, notes: event.target.value })}
          />
        </div>
      </div>

      <PlanTotalsBar totals={totals} mealCount={value.meals.length} />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-body text-muted-foreground">
            {value.meals.length} {value.meals.length === 1 ? "comida" : "comidas"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() =>
              onChange({ ...value, meals: [...value.meals, emptyMeal(value.meals.length)] })
            }
          >
            <Plus className="size-4" />
            Añadir comida
          </Button>
        </div>

        {allErrors.meals && <p className="text-body text-error-text">{allErrors.meals}</p>}
        {allErrors.mealName && <p className="text-body text-error-text">{allErrors.mealName}</p>}
        {allErrors.foods && <p className="text-body text-error-text">{allErrors.foods}</p>}

        <ul className="flex flex-col gap-4">
          {value.meals.map((meal, index) => (
            <MealEditor
              key={meal.key}
              meal={meal}
              index={index}
              total={value.meals.length}
              disabled={isPending}
              onChange={(patch) => patchMeal(index, patch)}
              onRemove={() =>
                onChange({ ...value, meals: value.meals.filter((_, i) => i !== index) })
              }
              onMove={(direction) => moveMeal(index, direction)}
            />
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-muted-foreground text-pretty">
          Publicar crea una versión nueva. Guardar cambios reescribe la versión abierta. El alumno
          no recibe notificación en ninguno de los dos casos.
        </p>

        <div className="flex flex-wrap gap-2 sm:shrink-0">
          {onCancel && (
            <Button type="button" variant="ghost" disabled={isPending} onClick={onCancel}>
              Cancelar
            </Button>
          )}

          {editingPlanId !== null && (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={submit(onSaveInPlace)}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              <Save className="size-4" />
              Guardar cambios{editingVersion !== null && ` en v${editingVersion}`}
            </Button>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            <Upload className="size-4" />
            Publicar nueva versión
          </Button>
        </div>
      </div>
    </form>
  )
}

function parseOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = Number(trimmed.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}
