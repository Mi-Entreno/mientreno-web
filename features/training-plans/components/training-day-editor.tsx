"use client"

import { ChevronDown, ChevronUp, Copy, Moon, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ExercisePicker, type PickedExercise } from "@/features/catalog-exercises/components/exercise-picker"
import {
  DAY_LABEL_MAX_LENGTH,
  cloneExercise,
  emptyExercise,
  nextKey,
  type EditorDay,
  type EditorExercise,
} from "../model/training-plan.model"
import { ExerciseRowEditor } from "./exercise-row-editor"

interface TrainingDayEditorProps {
  day: EditorDay
  index: number
  total: number
  disabled?: boolean
  /** Validation messages keyed by `EditorExercise.key`. */
  exerciseErrors?: Record<string, string>
  onChange: (patch: Partial<EditorDay>) => void
  onRemove: () => void
  onDuplicate: () => void
  onMove: (direction: -1 | 1) => void
}

export function TrainingDayEditor({
  day,
  index,
  total,
  disabled,
  exerciseErrors,
  onChange,
  onRemove,
  onDuplicate,
  onMove,
}: TrainingDayEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [confirmingRemove, setConfirmingRemove] = useState(false)

  function patchExercise(exerciseIndex: number, patch: Partial<EditorExercise>) {
    onChange({
      exercises: day.exercises.map((exercise, i) =>
        i === exerciseIndex ? { ...exercise, ...patch } : exercise,
      ),
    })
  }

  function removeExercise(exerciseIndex: number) {
    onChange({ exercises: day.exercises.filter((_, i) => i !== exerciseIndex) })
  }

  /** Inserted right below the original, which is where the trainer is looking. */
  function duplicateExercise(exerciseIndex: number) {
    const exercises = [...day.exercises]
    exercises.splice(exerciseIndex + 1, 0, cloneExercise(day.exercises[exerciseIndex]))
    onChange({ exercises })
  }

  function moveExercise(exerciseIndex: number, direction: -1 | 1) {
    const target = exerciseIndex + direction
    if (target < 0 || target >= day.exercises.length) return

    const next = [...day.exercises]
    ;[next[exerciseIndex], next[target]] = [next[target], next[exerciseIndex]]
    onChange({ exercises: next })
  }

  function addFromPicker(picked: PickedExercise) {
    const exercise: EditorExercise = {
      ...emptyExercise(),
      key: nextKey("ex"),
      catalogExerciseId: picked.catalogExerciseId,
      name: picked.name,
      muscleGroup: picked.muscleGroup,
      equipment: picked.equipment,
    }
    onChange({ exercises: [...day.exercises, exercise] })
  }

  /*
   * Un día con ejercicios adentro no se borra de un click.
   *
   * El botón está a dos píxeles de las flechas de orden, no hay deshacer y lo
   * que se lleva puesto no es una fila sino toda la sesión: series, cargas,
   * descansos y notas. Un día vacío sí se va sin preguntar — no hay nada que
   * perder y preguntar sería ruido.
   */
  const removeNeedsConfirmation = day.exercises.length > 0

  function handleRemove() {
    if (removeNeedsConfirmation) {
      setConfirmingRemove(true)
      return
    }
    onRemove()
  }

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Label htmlFor={`${day.key}-label`}>Día {index + 1}</Label>
          <Input
            id={`${day.key}-label`}
            value={day.label}
            disabled={disabled}
            // `TrainingDay.label` es `length = 100`: pasarse no da un 400 sino
            // un 409 "Conflicto con un registro existente".
            maxLength={DAY_LABEL_MAX_LENGTH}
            placeholder="Torso · Empuje"
            onChange={(event) => onChange({ label: event.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 sm:pt-7">
          <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
            <Moon className="size-4 text-muted-foreground" />
            <Label htmlFor={`${day.key}-rest`} className="cursor-pointer">
              Descanso
            </Label>
            <Switch
              id={`${day.key}-rest`}
              checked={day.restDay}
              disabled={disabled}
              onCheckedChange={(restDay: boolean) => onChange({ restDay })}
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || index === 0}
            aria-label="Subir día"
            onClick={() => onMove(-1)}
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || index === total - 1}
            aria-label="Bajar día"
            onClick={() => onMove(1)}
          >
            <ChevronDown className="size-4" />
          </Button>
          {/* Armar la semana 2 retipeando la semana 1 era el gasto de tiempo
              más grande del editor. */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            aria-label={`Duplicar día ${index + 1}`}
            title="Duplicar día"
            onClick={onDuplicate}
          >
            <Copy className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || total === 1}
            aria-label="Quitar día"
            className="text-error-text focus-visible:text-error-text"
            onClick={handleRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {day.restDay ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-body text-muted-foreground text-pretty">
          {/* `buildDays` skips exercises when `restDay` is true, so anything
              added here would be discarded server-side. */}
          Día de descanso. No se guardan ejercicios aunque los agregues.
        </p>
      ) : (
        <>
          {day.exercises.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-4 text-body text-muted-foreground">
              Sin ejercicios todavía.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {day.exercises.map((exercise, exerciseIndex) => (
                <ExerciseRowEditor
                  key={exercise.key}
                  exercise={exercise}
                  index={exerciseIndex}
                  total={day.exercises.length}
                  disabled={disabled}
                  error={exerciseErrors?.[exercise.key]}
                  onChange={(patch) => patchExercise(exerciseIndex, patch)}
                  onRemove={() => removeExercise(exerciseIndex)}
                  onDuplicate={() => duplicateExercise(exerciseIndex)}
                  onMove={(direction) => moveExercise(exerciseIndex, direction)}
                />
              ))}
            </ul>
          )}

          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="self-start"
            onClick={() => setPickerOpen(true)}
          >
            <Plus className="size-4" />
            Agregar ejercicio
          </Button>
        </>
      )}

      <ExercisePicker open={pickerOpen} onOpenChange={setPickerOpen} onPick={addFromPicker} />

      <ConfirmDialog
        open={confirmingRemove}
        onOpenChange={setConfirmingRemove}
        title={`¿Quitar el día ${index + 1}?`}
        description={`Se van con él ${day.exercises.length} ${
          day.exercises.length === 1 ? "ejercicio" : "ejercicios"
        } con sus series, cargas y notas. No se puede deshacer.`}
        confirmLabel="Quitar día"
        destructive
        onConfirm={() => {
          setConfirmingRemove(false)
          onRemove()
        }}
      />
    </li>
  )
}
