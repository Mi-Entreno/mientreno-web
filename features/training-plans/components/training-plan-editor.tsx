"use client"

import { AlertTriangle, Loader2, Plus, Save, Upload } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/core/http/errors"
import {
  countExercises,
  emptyDay,
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

  const serverErrors = error instanceof ApiError ? error.fieldErrors : {}
  const allErrors = { ...serverErrors, ...errors }

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

  function validate(): boolean {
    const found: Record<string, string> = {}

    if (!value.title.trim()) found.title = "El título es obligatorio"
    if (value.days.length === 0) found.days = "El plan necesita al menos un día"

    // Mirrors `resolveExerciseName`, which throws 400 unless an exercise has a
    // name or a catalogue id.
    const nameless = value.days.some(
      (day) =>
        !day.restDay &&
        day.exercises.some(
          (exercise) => !exercise.name.trim() && exercise.catalogExerciseId === null,
        ),
    )
    if (nameless) found.exercises = "Cada ejercicio necesita un nombre"

    setErrors(found)
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
            Añadir día
          </Button>
        </div>

        {allErrors.days && <p className="text-body text-error-text">{allErrors.days}</p>}
        {allErrors.exercises && <p className="text-body text-error-text">{allErrors.exercises}</p>}

        <ul className="flex flex-col gap-4">
          {value.days.map((day, index) => (
            <TrainingDayEditor
              key={day.key}
              day={day}
              index={index}
              total={value.days.length}
              disabled={isPending}
              onChange={(patch) => patchDay(index, patch)}
              onRemove={() =>
                onChange({ ...value, days: value.days.filter((_, i) => i !== index) })
              }
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
              Márcalos como descanso o añade ejercicios.
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
