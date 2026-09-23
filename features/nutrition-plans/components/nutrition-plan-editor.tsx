"use client"

import { Plus, Save, Upload } from "lucide-react"
import { useMemo, useState } from "react"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { BarsLoader } from "@/components/ui/bars-loader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useUnsavedChanges } from "@/core/hooks/use-unsaved-changes"
import { ApiError, unclaimedFieldErrors } from "@/core/http/errors"
import {
  cloneMeal,
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
 *
 * The draft lives only in React state, so every exit is guarded the same way
 * the training editor guards its own: `useUnsavedChanges` for the browser's
 * exits, a confirmation for this form's.
 */
/** The keys this form renders itself; anything else the backend sends is spare. */
const CLAIMED_FIELDS = ["title", "notes", "meals", "mealName", "foods"] as const

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
  /** Per-meal messages, keyed by `EditorMeal.key`. */
  const [mealErrors, setMealErrors] = useState<Record<string, string>>({})
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const serverErrors = error instanceof ApiError ? error.fieldErrors : {}
  const allErrors = { ...serverErrors, ...errors }

  /*
   * Bean validation keys a nested list by its path — `meals[0].foods[1].quantity`
   * — so a 400 about a food used to leave this form silent.
   */
  const spareServerErrors = unclaimedFieldErrors(serverErrors, CLAIMED_FIELDS)

  // Snapshot of the draft as it was opened; the component is not remounted
  // while editing. Lazy initial state, not a ref — a ref would be read during
  // render.
  const [baseline] = useState(() => JSON.stringify(value))
  const isDirty = useMemo(() => baseline !== JSON.stringify(value), [baseline, value])
  useUnsavedChanges(isDirty && !isPending)

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
    const perMeal: Record<string, string> = {}

    if (!value.title.trim()) found.title = "El título es obligatorio"
    if (value.meals.length === 0) found.meals = "El plan necesita al menos una comida"

    for (const meal of value.meals) {
      // `MealRequest.name` is @NotBlank upstream.
      if (!meal.name.trim()) {
        perMeal[meal.key] = "Esta comida necesita un nombre"
        continue
      }

      // `MealFoodRequest.quantity` is @NotNull, so a food with no quantity
      // would be sent as 0 — flag it instead of writing a meaningless value.
      const badQuantity = meal.foods.some(
        (food) => food.foodName.trim() && parseOrNull(food.quantity) === null,
      )
      if (badQuantity) perMeal[meal.key] = "Hay un alimento sin cantidad"
    }

    const flagged = Object.keys(perMeal).length
    if (flagged > 0) {
      found.mealName =
        flagged === 1
          ? "Hay una comida incompleta, marcada abajo."
          : `Hay ${flagged} comidas incompletas, marcadas abajo.`
    }

    setErrors(found)
    setMealErrors(perMeal)
    return Object.keys(found).length === 0
  }

  /** Inserted right after the original, which is where the trainer is looking. */
  function duplicateMeal(index: number) {
    const meals = [...value.meals]
    meals.splice(index + 1, 0, cloneMeal(value.meals[index]))
    onChange({ ...value, meals })
  }

  function handleCancel() {
    if (!onCancel) return
    if (isDirty) {
      setConfirmingCancel(true)
      return
    }
    onCancel()
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
            Agregar comida
          </Button>
        </div>

        {allErrors.meals && <p className="text-body text-error-text">{allErrors.meals}</p>}
        {allErrors.mealName && <p className="text-body text-error-text">{allErrors.mealName}</p>}
        {allErrors.foods && <p className="text-body text-error-text">{allErrors.foods}</p>}

        {spareServerErrors.length > 0 && (
          <ul className="flex flex-col gap-1 rounded-lg border border-error/40 bg-error-surface p-3 text-body text-error-text">
            {spareServerErrors.map((message) => (
              <li key={message} className="text-pretty">
                {message}
              </li>
            ))}
          </ul>
        )}

        <ul className="flex flex-col gap-4">
          {value.meals.map((meal, index) => (
            <MealEditor
              key={meal.key}
              meal={meal}
              index={index}
              total={value.meals.length}
              disabled={isPending}
              error={mealErrors[meal.key]}
              onChange={(patch) => patchMeal(index, patch)}
              onRemove={() =>
                onChange({ ...value, meals: value.meals.filter((_, i) => i !== index) })
              }
              onDuplicate={() => duplicateMeal(index)}
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
            <Button type="button" variant="ghost" disabled={isPending} onClick={handleCancel}>
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
              {isPending && <BarsLoader />}
              <Save className="size-4" />
              Guardar cambios{editingVersion !== null && ` en v${editingVersion}`}
            </Button>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending && <BarsLoader />}
            <Upload className="size-4" />
            {/* The first plan is not a "new version" of anything. */}
            {editingPlanId === null ? "Publicar plan" : "Publicar nueva versión"}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingCancel}
        onOpenChange={setConfirmingCancel}
        title="¿Descartar los cambios?"
        description="Lo que editaste en este plan se pierde. No se guarda ningún borrador."
        confirmLabel="Descartar"
        destructive
        onConfirm={() => {
          setConfirmingCancel(false)
          onCancel?.()
        }}
      />
    </form>
  )
}

function parseOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = Number(trimmed.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}
