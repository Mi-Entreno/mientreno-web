/** Literal mirrors of `workout/dto/response`. */

/** `WorkoutStatus.java`. */
export type WorkoutStatus = "IN_PROGRESS" | "COMPLETED" | "SKIPPED"

export interface TrainingDayInfoDTO {
  id: number
  dayNumber: number
  label: string | null
  planTitle: string | null
}

export interface WorkoutSetResponseDTO {
  id: number
  exerciseId: number
  exerciseName: string
  setNumber: number
  repsCompleted: number | null
  weightKg: number | null
  durationSeconds: number | null
  /** 1–10 self-reported effort, per set. */
  difficulty: number | null
  notes: string | null
  createdAt: string
}

export interface SessionFeedbackResponseDTO {
  id: number
  overallRating: number
  fatigueLevel: number | null
  notes: string | null
  createdAt: string
}

export interface WorkoutSessionDetailResponseDTO {
  id: number
  status: WorkoutStatus
  startedAt: string | null
  completedAt: string | null
  notes: string | null
  trainingDay: TrainingDayInfoDTO | null
  sets: WorkoutSetResponseDTO[]
  feedback: SessionFeedbackResponseDTO | null
  createdAt: string
}
