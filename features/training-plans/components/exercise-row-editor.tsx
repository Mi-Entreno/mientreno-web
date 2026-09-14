"use client"

import { ChevronDown, ChevronUp, Copy, GripVertical, Link2Off, Trash2, Video } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  EXERCISE_NAME_MAX_LENGTH,
  MAX_REPS_DIGITS,
  MAX_SECONDS_DIGITS,
  MAX_SETS,
  WEIGHT_UNITS,
  resizeSets,
  sanitizeDecimal,
  sanitizeInteger,
  type EditorExercise,
  type WeightUnit,
} from "../model/training-plan.model"

interface ExerciseRowEditorProps {
  exercise: EditorExercise
  index: number
  total: number
  disabled?: boolean
  /** Validation message for this row, anchored here instead of at the top. */
  error?: string
  onChange: (patch: Partial<EditorExercise>) => void
  onRemove: () => void
  onDuplicate: () => void
  onMove: (direction: -1 | 1) => void
}

export function ExerciseRowEditor({
  exercise,
  index,
  total,
  disabled,
  error,
  onChange,
  onRemove,
  onDuplicate,
  onMove,
}: ExerciseRowEditorProps) {
  const isCustom = exercise.catalogExerciseId === null
  const errorId = error ? `${exercise.key}-error` : undefined

  return (
    <li
      className={cn(
        "flex flex-col gap-4 rounded-xl border bg-background p-4",
        // El error vive en la fila, no arriba del formulario: con treinta
        // ejercicios, "cada ejercicio necesita un nombre" no dice cuál.
        error ? "border-error/60 ring-1 ring-error/20" : "border-border",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <GripVertical className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-caption font-mono text-muted-foreground">{index + 1}</span>
        </div>

        <div className="min-w-0 flex-1">
          <Input
            value={exercise.name}
            disabled={disabled}
            maxLength={EXERCISE_NAME_MAX_LENGTH}
            aria-label={`Nombre del ejercicio ${index + 1}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            placeholder="Nombre del ejercicio"
            onChange={(event) => onChange({ name: event.target.value })}
          />

          {error && (
            <p id={errorId} role="alert" className="mt-1.5 text-body text-error-text">
              {error}
            </p>
          )}

          <ul className="mt-2 flex flex-wrap items-center gap-1.5">
            {exercise.muscleGroup && (
              <li>
                <Badge variant="secondary">{exercise.muscleGroup}</Badge>
              </li>
            )}
            {exercise.equipment && (
              <li>
                <Badge variant="outline">{exercise.equipment}</Badge>
              </li>
            )}
            {isCustom && (
              <li>
                {/* Without a catalogue link the student sees no instructions,
                    muscle group or equipment — worth flagging while editing. */}
                <Badge variant="outline" className="gap-1 text-muted-foreground">
                  <Link2Off className="size-3" />
                  Sin catálogo
                </Badge>
              </li>
            )}
            {exercise.mediaUrl && (
              <li>
                <Badge variant="secondary" className="gap-1">
                  <Video className="size-3" />
                  Con video
                </Badge>
              </li>
            )}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <div className="flex">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || index === 0}
              aria-label="Subir ejercicio"
              onClick={() => onMove(-1)}
            >
              <ChevronUp className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || index === total - 1}
              aria-label="Bajar ejercicio"
              onClick={() => onMove(1)}
            >
              <ChevronDown className="size-4" />
            </Button>
          </div>
          <div className="flex">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              aria-label={`Duplicar ejercicio ${index + 1}`}
              title="Duplicar ejercicio"
              onClick={onDuplicate}
            >
              <Copy className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              aria-label="Quitar ejercicio"
              className="text-error-text focus-visible:text-error-text"
              onClick={onRemove}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <NumberField
          id={`${exercise.key}-sets`}
          label="Series"
          value={String(exercise.sets.length)}
          maxDigits={2}
          disabled={disabled}
          onChange={(value) => {
            const count = Number(value)
            // While the field is empty or out of range the rows are left alone:
            // the trainer is still typing.
            if (!value || count < 1 || count > MAX_SETS) return
            onChange({ sets: resizeSets(exercise.sets, count) })
          }}
        />
        <NumberField
          id={`${exercise.key}-rest`}
          label="Descanso (s)"
          value={exercise.restSeconds}
          maxDigits={MAX_SECONDS_DIGITS}
          disabled={disabled}
          onChange={(restSeconds) => onChange({ restSeconds })}
        />
        <NumberField
          id={`${exercise.key}-duration`}
          label="Duración (s)"
          value={exercise.durationSeconds}
          maxDigits={MAX_SECONDS_DIGITS}
          disabled={disabled}
          onChange={(durationSeconds) => onChange({ durationSeconds })}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${exercise.key}-unit`}>Unidad</Label>
          <select
            id={`${exercise.key}-unit`}
            aria-label="Unidad de peso"
            value={exercise.weightUnit}
            disabled={disabled}
            onChange={(event) => {
              const weightUnit = event.target.value as WeightUnit | ""
              onChange({
                weightUnit,
                // BODYWEIGHT has no number to go with it, in any set.
                ...(weightUnit === "BODYWEIGHT"
                  ? { sets: exercise.sets.map((set) => ({ ...set, weightValue: "" })) }
                  : {}),
              })
            }}
            className={cn(
              "h-9 shrink-0 rounded-lg border border-border-dark bg-transparent px-2 text-body",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {/* Only KG, LB and BODYWEIGHT exist upstream; anything else is a
                400 from `WeightUnit.valueOf`. */}
            <option value="">—</option>
            {WEIGHT_UNITS.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Per-set targets. Reps and load can differ between sets, so each one
          gets its own row rather than a single value applied to all. */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Objetivo por serie</Label>
          {exercise.sets.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => {
                const [first] = exercise.sets
                if (!first) return
                onChange({
                  sets: exercise.sets.map((set) => ({ ...set, reps: first.reps, weightValue: first.weightValue })),
                })
              }}
            >
              Copiar la 1.ª a todas
            </Button>
          )}
        </div>

        {exercise.sets.map((set, index) => (
          <div key={set.key} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-body-sm text-muted-foreground">Serie {index + 1}</span>
            <Input
              aria-label={`Repeticiones de la serie ${index + 1}`}
              inputMode="numeric"
              placeholder="Reps"
              value={set.reps}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  sets: exercise.sets.map((current, position) =>
                    position === index
                      ? { ...current, reps: sanitizeInteger(event.target.value, MAX_REPS_DIGITS) }
                      : current,
                  ),
                })
              }
            />
            <Input
              aria-label={`Peso de la serie ${index + 1}`}
              inputMode="decimal"
              placeholder="Peso"
              value={set.weightValue}
              disabled={disabled || exercise.weightUnit === "BODYWEIGHT"}
              onChange={(event) =>
                onChange({
                  sets: exercise.sets.map((current, position) =>
                    position === index
                      ? { ...current, weightValue: sanitizeDecimal(event.target.value) }
                      : current,
                  ),
                })
              }
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${exercise.key}-notes`}>Notas para el alumno</Label>
        <Textarea
          id={`${exercise.key}-notes`}
          rows={2}
          value={exercise.trainerNotes}
          disabled={disabled}
          placeholder="Técnica, tempo, progresión…"
          onChange={(event) => onChange({ trainerNotes: event.target.value })}
        />
      </div>
    </li>
  )
}

/**
 * Un entero sin signo. Sanea en el `onChange` y no sólo al publicar: el mapper
 * manda `null` ante cualquier cosa que `Number()` no entienda, así que una
 * letra de más no daba error, daba silencio.
 */
function NumberField({
  id,
  label,
  value,
  maxDigits,
  disabled,
  onChange,
}: {
  id: string
  label: string
  value: string
  maxDigits: number
  disabled?: boolean
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(sanitizeInteger(event.target.value, maxDigits))}
      />
    </div>
  )
}
