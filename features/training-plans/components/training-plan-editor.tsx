"use client"

import { AlertTriangle, Plus, Save, Upload } from "lucide-react"
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
  PLAN_TITLE_MAX_LENGTH,
  cloneDay,
  countExercises,
  emptyDay,
  exerciseIssue,
  type EditorDay,
  type EditorPlan,
} from "../model/training-plan.model"
import { TrainingDayEditor } from "./training-day-editor"

interface TrainingPlanEditorProps {
  value: EditorPlan
  onChange: (plan: EditorPlan) => void
  /** Present when an existing version is open, enabling in-place save. */
  editingPlanId: number | null
  editingVersion: number | null
  isPending: boolean
  error?: unknown
  onPublish: () => void
  onSaveInPlace: () => void
  onCancel?: () => void
}

/** The keys this form renders itself; anything else the backend sends is spare. */
const CLAIMED_FIELDS = ["title", "notes", "days", "exercises"] as const

/**
 * The plan editor.
 *
 * Two distinct save actions, because the backend has two distinct operations
 * and conflating them would lose either history or the student's notification:
 *
 *  - **Publicar nueva versión** → `POST`. Demotes the current plan, inserts
 *    `version + 1`, notifies the student.
 *  - **Guardar cambios** → `PUT`. Rewrites the open version in place. No new
 *    version, no notification — for fixing a typo without telling the student
 *    their plan changed.
 *
 * The Swagger annotations describe these the other way round; the code is the
 * authority (see `training-plans.repository.ts`).
 *
 * ## The draft lives only here
 *
 * There is no autosave and no server-side draft: a whole routine sits in React
 * state until one of those two buttons is pressed. So every exit is guarded —
 * `useUnsavedChanges` for the ones the browser owns (reload, closed tab) and a
 * confirmation for the ones this form owns (Cancelar, removing a day that has
 * exercises in it).
 */
export function TrainingPlanEditor({
  value,
  onChange,
  editingPlanId,
  editingVersion,
  isPending,
  error,
  onPublish,
  onSaveInPlace,
  onCancel,
}: TrainingPlanEditorProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  /** Per-exercise messages, keyed by `EditorExercise.key`. */
  const [exerciseErrors, setExerciseErrors] = useState<Record<string, string>>({})
  const [confirmingCancel, setConfirmingCancel] = useState(false)

  const serverErrors = error instanceof ApiError ? error.fieldErrors : {}
  const allErrors = { ...serverErrors, ...errors }

  /*
   * Bean validation keys a nested list by its path — `days[0].exercises[1].name`
   * — so looking up only the four names above threw those messages away and a
   * 400 left the form silent. Whatever no field claimed gets printed verbatim.
   */
  const spareServerErrors = unclaimedFieldErrors(serverErrors, CLAIMED_FIELDS)

  // Snapshot of the draft as it was opened. Lazy initial state rather than a
  // ref: the component is not remounted while editing, so the first render's
  // value is the baseline, and a ref would be read during render.
  const [baseline] = useState(() => JSON.stringify(value))
  const isDirty = useMemo(() => baseline !== JSON.stringify(value), [baseline, value])
  useUnsavedChanges(isDirty && !isPending)

  const totalExercises = countExercises(value)
  const emptyTrainingDays = value.days.filter(
    (day) => !day.restDay && day.exercises.length === 0,
  ).length

  function patchDay(index: number, patch: Partial<EditorDay>) {
    onChange({
      ...value,
      days: value.days.map((day, i) => (i === index ? { ...day, ...patch } : day)),
    })
  }

  function moveDay(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= value.days.length) return

    const days = [...value.days]
    ;[days[index], days[target]] = [days[target], days[index]]
    onChange({ ...value, days })
  }

  /** Inserted right after the original, which is where the trainer is looking. */
  function duplicateDay(index: number) {
    const days = [...value.days]
    days.splice(index + 1, 0, cloneDay(value.days[index]))
    onChange({ ...value, days })
  }

  function validate(): boolean {
    const found: Record<string, string> = {}
    const perExercise: Record<string, string> = {}

    if (!value.title.trim()) found.title = "El título es obligatorio"
    // El input ya corta en 150, pero el título es el único campo que llega
    // hasta acá desde un plan abierto para editar, que pudo guardarse antes de
    // este límite.
    else if (value.title.trim().length > PLAN_TITLE_MAX_LENGTH) {
      found.title = `El título no puede pasar de ${PLAN_TITLE_MAX_LENGTH} caracteres`
    }

    if (value.days.length === 0) found.days = "El plan necesita al menos un día"

    // `exerciseIssue` espeja lo que rechaza el backend. Anclado a la fila para
    // que el entrenador no tenga que adivinar cuál de treinta ejercicios es.
    for (const day of value.days) {
      if (day.restDay) continue
      for (const exercise of day.exercises) {
        const issue = exerciseIssue(exercise)
        if (issue) perExercise[exercise.key] = issue
      }
    }

    const incomplete = Object.keys(perExercise).length
    if (incomplete > 0) {
      found.exercises =
        incomplete === 1
          ? "Hay un ejercicio incompleto, marcado abajo."
          : `Hay ${incomplete} ejercicios incompletos, marcados abajo.`
    }

    setErrors(found)
    setExerciseErrors(perExercise)
    return Object.keys(found).length === 0
  }

  /** Structural event type so the same guard serves onSubmit and onClick. */
  function submit(action: () => void) {
    return (event: { preventDefault: () => void }) => {
      event.preventDefault()
      if (!validate()) return
      action()
    }
  }

  function handleCancel() {
    if (!onCancel) return
    if (isDirty) {
      setConfirmingCancel(true)
      return
    }
    onCancel()
  }

  return (
    <form onSubmit={submit(onPublish)} className="flex flex-col gap-6" noValidate>
      <div className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="plan-title">
            Título del plan <span className="text-error-text">*</span>
          </Label>
          <Input
            id="plan-title"
            value={value.title}
            disabled={isPending}
            // `TrainingPlan.title` es `length = 150`. Ver `PLAN_TITLE_MAX_LENGTH`.
            maxLength={PLAN_TITLE_MAX_LENGTH}
            aria-invalid={allErrors.title ? true : undefined}
            placeholder="Fuerza · Torso-pierna"
            onChange={(event) => onChange({ ...value, title: event.target.value })}
          />
          {allErrors.title && <p className="text-body text-error-text">{allErrors.title}</p>}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="plan-notes">Notas generales</Label>
          <Textarea
            id="plan-notes"
            rows={3}
            value={value.notes}
            disabled={isPending}
            placeholder="Objetivo del bloque, indicaciones de calentamiento…"
            onChange={(event) => onChange({ ...value, notes: event.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-body text-muted-foreground">
            {value.days.length} {value.days.length === 1 ? "día" : "días"} · {totalExercises}{" "}
            {totalExercises === 1 ? "ejercicio" : "ejercicios"}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => onChange({ ...value, days: [...value.days, emptyDay(value.days.length)] })}
          >
            <Plus className="size-4" />
            Agregar día
          </Button>
        </div>

        {allErrors.days && <p className="text-body text-error-text">{allErrors.days}</p>}
        {allErrors.exercises && <p className="text-body text-error-text">{allErrors.exercises}</p>}

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
          {value.days.map((day, index) => (
            <TrainingDayEditor
              key={day.key}
              day={day}
              index={index}
              total={value.days.length}
              disabled={isPending}
              exerciseErrors={exerciseErrors}
              onChange={(patch) => patchDay(index, patch)}
              onRemove={() =>
                onChange({ ...value, days: value.days.filter((_, i) => i !== index) })
              }
              onDuplicate={() => duplicateDay(index)}
              onMove={(direction) => moveDay(index, direction)}
            />
          ))}
        </ul>

        {emptyTrainingDays > 0 && (
          <p className="flex items-start gap-2 rounded-lg border border-warning bg-warning-surface p-3 text-body text-warning-text">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span className="text-pretty">
              {emptyTrainingDays === 1
                ? "Hay un día de entrenamiento sin ejercicios."
                : `Hay ${emptyTrainingDays} días de entrenamiento sin ejercicios.`}{" "}
              Marcalos como descanso o agregá ejercicios.
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption text-muted-foreground text-pretty">
          Publicar crea una versión nueva y avisa al alumno. Guardar cambios reescribe la versión
          abierta sin notificar.
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
