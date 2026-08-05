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
  type StudentPlanSummary,
  type TrainingPlan,
} from "../model/training-plan.model"

// ── Response -> model ────────────────────────────────────────────────────────

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
    sets: exercise.sets === null ? "" : String(exercise.sets),
    reps: exercise.reps === null ? "" : String(exercise.reps),
    weightValue: exercise.weightValue === null ? "" : String(exercise.weightValue),
    weightUnit: exercise.weightUnit ?? "",
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
  return {
    // Derived from position, so reordering in the UI is what the backend sees.
    order: index + 1,
    name: emptyToNull(exercise.name),
    catalogExerciseId: exercise.catalogExerciseId,
    sets: toNumberOrNull(exercise.sets),
    reps: toNumberOrNull(exercise.reps),
    weightValue: toNumberOrNull(exercise.weightValue),
    weightUnit: exercise.weightUnit === "" ? null : exercise.weightUnit,
    restSeconds: toNumberOrNull(exercise.restSeconds),
    durationSeconds: toNumberOrNull(exercise.durationSeconds),
    // Round-tripped untouched so an edit never unlinks a video.
    mediaUrl: exercise.mediaUrl,
    trainerNotes: emptyToNull(exercise.trainerNotes),
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
