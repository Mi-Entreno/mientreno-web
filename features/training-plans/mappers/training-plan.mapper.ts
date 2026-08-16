import { toMediaUrl } from "@/core/http/media"

import type {
  ExerciseRequestDTO,
  ExerciseResponseDTO,
  TrainerStudentPlanSummaryDTO,
  TrainingDayRequestDTO,
  TrainingDayResponseDTO,
  TrainingPlanResponseDTO,
  UpdateTrainingPlanRequestDTO,
} from "../dto/training-plan.dto"
import {
  emptyDay,
  nextKey,
  type EditorDay,
  type EditorExercise,
  type EditorPlan,
  type PlanDay,
  type PlanExercise,
  type PlannedSet,
  type StudentPlanSummary,
  type TrainingPlan,
} from "../model/training-plan.model"

// ── Response -> model ────────────────────────────────────────────────────────

/**
 * Per-set targets. The backend always sends `plannedSets`, but a response from
 * an older deployment may not: expanding the flat summary into N identical sets
 * is exactly what that plan meant, so callers never see a missing field.
 */
function toPlannedSets(dto: ExerciseResponseDTO): PlannedSet[] {
  if (dto.plannedSets?.length) {
    return [...dto.plannedSets]
      .sort((a, b) => a.setNumber - b.setNumber)
      .map((set, index) => ({
        setNumber: set.setNumber || index + 1,
        reps: set.targetReps,
        weightValue: set.targetWeightValue,
        weightUnit: set.targetWeightUnit,
      }))
  }

  return Array.from({ length: Math.max(dto.sets ?? 0, 0) }, (_, index) => ({
    setNumber: index + 1,
    reps: dto.reps,
    weightValue: dto.weightValue,
    weightUnit: dto.weightUnit,
  }))
}

export function toPlanExercise(dto: ExerciseResponseDTO): PlanExercise {
  return {
    id: dto.id,
    order: dto.order,
    name: dto.name,
    sets: dto.sets,
    reps: dto.reps,
    weightValue: dto.weightValue,
    weightUnit: dto.weightUnit,
    restSeconds: dto.restSeconds,
    durationSeconds: dto.durationSeconds,
    mediaUrl: dto.mediaUrl,
    trainerNotes: dto.trainerNotes,
    catalogExerciseId: dto.catalogExerciseId,
    // Present only when the exercise is linked to a catalogue entry.
    muscleGroup: dto.muscleGroup,
    equipment: dto.equipment,
    plannedSets: toPlannedSets(dto),
  }
}

export function toPlanDay(dto: TrainingDayResponseDTO): PlanDay {
  return {
    id: dto.id,
    dayNumber: dto.dayNumber,
    label: dto.label ?? "",
    restDay: dto.restDay,
    // The backend drops exercises on rest days, but a stale row should not
    // render either.
    exercises: dto.restDay ? [] : [...(dto.exercises ?? [])].sort((a, b) => a.order - b.order).map(toPlanExercise),
  }
}

export function toTrainingPlan(dto: TrainingPlanResponseDTO): TrainingPlan {
  return {
    id: dto.id,
    version: dto.version,
    title: dto.title,
    notes: dto.notes ?? "",
    current: dto.current,
    createdAt: dto.createdAt,
    days: [...(dto.days ?? [])].sort((a, b) => a.dayNumber - b.dayNumber).map(toPlanDay),
  }
}

export function toStudentPlanSummary(dto: TrainerStudentPlanSummaryDTO): StudentPlanSummary {
  const name = dto.studentFullName?.trim()

  return {
    subscriptionId: dto.subscriptionId,
    studentId: dto.studentId,
    studentName: name && name.length > 0 ? name : "Alumno sin nombre",
    studentAvatarUrl: toMediaUrl(dto.studentImageUrl),
    currentPlan: dto.currentPlan ? toTrainingPlan(dto.currentPlan) : null,
  }
}

// ── Model -> editor ──────────────────────────────────────────────────────────

function toEditorExercise(exercise: PlanExercise): EditorExercise {
  return {
    key: nextKey("ex"),
    catalogExerciseId: exercise.catalogExerciseId,
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    equipment: exercise.equipment,
    sets: exercise.plannedSets.map((set) => ({
      key: nextKey("set"),
      reps: set.reps === null ? "" : String(set.reps),
      weightValue: set.weightValue === null ? "" : String(set.weightValue),
    })),
    // The unit is per exercise in the editor: mixing kg and lb across sets of
    // the same movement is not a real use case and would only add a trap.
    weightUnit: exercise.weightUnit ?? exercise.plannedSets[0]?.weightUnit ?? "",
    restSeconds: exercise.restSeconds === null ? "" : String(exercise.restSeconds),
    durationSeconds: exercise.durationSeconds === null ? "" : String(exercise.durationSeconds),
    trainerNotes: exercise.trainerNotes ?? "",
    mediaUrl: exercise.mediaUrl,
  }
}

export function toEditorPlan(plan: TrainingPlan): EditorPlan {
  return {
    title: plan.title,
    notes: plan.notes,
    days:
      plan.days.length > 0
        ? plan.days.map((day) => ({
            key: nextKey("day"),
            label: day.label,
            restDay: day.restDay,
            exercises: day.exercises.map(toEditorExercise),
          }))
        : [emptyDay(0)],
  }
}

// ── Editor -> request ────────────────────────────────────────────────────────

function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = Number(trimmed.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : null
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function toExerciseRequest(exercise: EditorExercise, index: number): ExerciseRequestDTO {
  const weightUnit = exercise.weightUnit === "" ? null : exercise.weightUnit
  const [firstSet] = exercise.sets

  return {
    // Derived from position, so reordering in the UI is what the backend sees.
    order: index + 1,
    name: emptyToNull(exercise.name),
    catalogExerciseId: exercise.catalogExerciseId,
    // Flat summary kept in sync with the sets below: it is what any consumer
    // still on the old contract reads, so it cannot go stale.
    sets: exercise.sets.length,
    reps: firstSet ? toNumberOrNull(firstSet.reps) : null,
    weightValue: firstSet ? toNumberOrNull(firstSet.weightValue) : null,
    weightUnit,
    restSeconds: toNumberOrNull(exercise.restSeconds),
    durationSeconds: toNumberOrNull(exercise.durationSeconds),
    // Round-tripped untouched so an edit never unlinks a video.
    mediaUrl: exercise.mediaUrl,
    trainerNotes: emptyToNull(exercise.trainerNotes),
    plannedSets: exercise.sets.map((set, setIndex) => ({
      setNumber: setIndex + 1,
      targetReps: toNumberOrNull(set.reps),
      targetWeightValue: toNumberOrNull(set.weightValue),
      targetWeightUnit: weightUnit,
      restSeconds: null,
    })),
  }
}

function toDayRequest(day: EditorDay, index: number): TrainingDayRequestDTO {
  return {
    dayNumber: index + 1,
    label: emptyToNull(day.label),
    restDay: day.restDay,
    // `buildDays` ignores exercises on a rest day; sending none makes the
    // request describe what will actually be stored.
    exercises: day.restDay ? [] : day.exercises.map(toExerciseRequest),
  }
}

export function toPlanBody(plan: EditorPlan): UpdateTrainingPlanRequestDTO {
  return {
    title: plan.title.trim(),
    notes: emptyToNull(plan.notes),
    days: plan.days.map(toDayRequest),
  }
}

export function toCreateRequest(plan: EditorPlan, subscriptionId: number) {
  return { subscriptionId, ...toPlanBody(plan) }
}
