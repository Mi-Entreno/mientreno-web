"use client"

import { ChevronDown, ChevronUp, GripVertical, Link2Off, Trash2, Video } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { WEIGHT_UNITS, type EditorExercise, type WeightUnit } from "../model/training-plan.model"

interface ExerciseRowEditorProps {
  exercise: EditorExercise
  index: number
  total: number
  disabled?: boolean
  onChange: (patch: Partial<EditorExercise>) => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

export function ExerciseRowEditor({
  exercise,
  index,
  total,
  disabled,
  onChange,
  onRemove,
  onMove,
}: ExerciseRowEditorProps) {
  const isCustom = exercise.catalogExerciseId === null

  return (
    <li className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <GripVertical className="size-4 text-muted-foreground" aria-hidden />
          <span className="text-caption font-mono text-muted-foreground">{index + 1}</span>
        </div>

        <div className="min-w-0 flex-1">
          <Input
            value={exercise.name}
            disabled={disabled}
            aria-label={`Nombre del ejercicio ${index + 1}`}
            placeholder="Nombre del ejercicio"
            onChange={(event) => onChange({ name: event.target.value })}
          />

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
                  Con vídeo
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <NumberField
          id={`${exercise.key}-sets`}
          label="Series"
          value={exercise.sets}
          disabled={disabled}
          onChange={(sets) => onChange({ sets })}
        />
        <NumberField
          id={`${exercise.key}-reps`}
          label="Repeticiones"
          value={exercise.reps}
          disabled={disabled}
          onChange={(reps) => onChange({ reps })}
        />
        <NumberField
          id={`${exercise.key}-rest`}
          label="Descanso (s)"
          value={exercise.restSeconds}
          disabled={disabled}
          onChange={(restSeconds) => onChange({ restSeconds })}
        />
        <NumberField
          id={`${exercise.key}-duration`}
          label="Duración (s)"
          value={exercise.durationSeconds}
          disabled={disabled}
          onChange={(durationSeconds) => onChange({ durationSeconds })}
        />

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${exercise.key}-weight`}>Peso</Label>
          <div className="flex gap-1.5">
            <Input
              id={`${exercise.key}-weight`}
              inputMode="decimal"
              value={exercise.weightValue}
              // BODYWEIGHT has no number to go with it.
              disabled={disabled || exercise.weightUnit === "BODYWEIGHT"}
              onChange={(event) => onChange({ weightValue: event.target.value })}
            />
            <select
              aria-label="Unidad de peso"
              value={exercise.weightUnit}
              disabled={disabled}
              onChange={(event) => {
                const weightUnit = event.target.value as WeightUnit | ""
                onChange({
                  weightUnit,
                  ...(weightUnit === "BODYWEIGHT" ? { weightValue: "" } : {}),
                })
              }}
              className={cn(
                "h-9 shrink-0 rounded-lg border border-input bg-transparent px-2 text-body",
                "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
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

function NumberField({
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
        inputMode="numeric"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
