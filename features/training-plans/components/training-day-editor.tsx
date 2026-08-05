"use client"

import { ChevronDown, ChevronUp, Moon, Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ExercisePicker, type PickedExercise } from "@/features/catalog-exercises/components/exercise-picker"
import {
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
  onChange: (patch: Partial<EditorDay>) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

export function TrainingDayEditor({
  day,
  index,
  total,
  disabled,
  onChange,
  onRemove,
  onMove,
}: TrainingDayEditorProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

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

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Label htmlFor={`${day.key}-label`}>Día {index + 1}</Label>
          <Input
            id={`${day.key}-label`}
            value={day.label}
            disabled={disabled}
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
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || total === 1}
            aria-label="Quitar día"
            className="text-error-text focus-visible:text-error-text"
            onClick={onRemove}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {day.restDay ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-body text-muted-foreground text-pretty">
          {/* `buildDays` skips exercises when `restDay` is true, so anything
              added here would be discarded server-side. */}
          Día de descanso. No se guardan ejercicios aunque los añadas.
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
                  onChange={(patch) => patchExercise(exerciseIndex, patch)}
                  onRemove={() => removeExercise(exerciseIndex)}
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
            Añadir ejercicio
          </Button>
        </>
      )}

      <ExercisePicker open={pickerOpen} onOpenChange={setPickerOpen} onPick={addFromPicker} />
    </li>
  )
}
