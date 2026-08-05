import type {
  SessionFeedbackResponseDTO,
  WorkoutSessionDetailResponseDTO,
  WorkoutSetResponseDTO,
} from "../dto/workout-session.dto"
import type { SessionFeedback, WorkoutSession, WorkoutSet } from "../model/workout-session.model"

export function toWorkoutSet(dto: WorkoutSetResponseDTO): WorkoutSet {
  return {
    id: dto.id,
    exerciseId: dto.exerciseId,
    exerciseName: dto.exerciseName,
    setNumber: dto.setNumber,
    repsCompleted: dto.repsCompleted,
    weightKg: dto.weightKg,
    durationSeconds: dto.durationSeconds,
    difficulty: dto.difficulty,
    notes: dto.notes ?? "",
    createdAt: dto.createdAt,
  }
}

export function toSessionFeedback(dto: SessionFeedbackResponseDTO): SessionFeedback {
  return {
    id: dto.id,
    overallRating: dto.overallRating,
    fatigueLevel: dto.fatigueLevel,
    notes: dto.notes ?? "",
  }
}

export function toWorkoutSession(dto: WorkoutSessionDetailResponseDTO): WorkoutSession {
  return {
    id: dto.id,
    status: dto.status,
    startedAt: dto.startedAt,
    completedAt: dto.completedAt,
    notes: dto.notes ?? "",
    // `trainingDay` is nullable: a session can outlive the plan version it was
    // started from, since deleting a version removes its days.
    dayNumber: dto.trainingDay?.dayNumber ?? null,
    dayLabel: dto.trainingDay?.label ?? "",
    planTitle: dto.trainingDay?.planTitle ?? "",
    sets: (dto.sets ?? []).map(toWorkoutSet),
    feedback: dto.feedback ? toSessionFeedback(dto.feedback) : null,
    createdAt: dto.createdAt,
  }
}
