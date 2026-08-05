import type { WorkoutStatus } from "../dto/workout-session.dto"

export interface WorkoutSet {
  id: number
  exerciseId: number
  exerciseName: string
  setNumber: number
  repsCompleted: number | null
  weightKg: number | null
  durationSeconds: number | null
  difficulty: number | null
  notes: string
  createdAt: string
}

export interface SessionFeedback {
  id: number
  overallRating: number
  fatigueLevel: number | null
  notes: string
}

export interface WorkoutSession {
  id: number
  status: WorkoutStatus
  startedAt: string | null
  completedAt: string | null
  notes: string
  dayNumber: number | null
  dayLabel: string
  planTitle: string
  sets: WorkoutSet[]
  feedback: SessionFeedback | null
  createdAt: string
}

export const WORKOUT_STATUS_LABELS: Record<WorkoutStatus, string> = {
  IN_PROGRESS: "En curso",
  COMPLETED: "Completada",
  SKIPPED: "Omitida",
}

/** Sets belonging to the same exercise, in the order they were logged. */
export interface ExerciseSets {
  exerciseId: number
  exerciseName: string
  sets: WorkoutSet[]
}

export function groupSetsByExercise(sets: WorkoutSet[]): ExerciseSets[] {
  const groups = new Map<number, ExerciseSets>()

  for (const set of [...sets].sort((a, b) => a.setNumber - b.setNumber)) {
    const existing = groups.get(set.exerciseId)
    if (existing) {
      existing.sets.push(set)
    } else {
      groups.set(set.exerciseId, {
        exerciseId: set.exerciseId,
        exerciseName: set.exerciseName,
        sets: [set],
      })
    }
  }

  return [...groups.values()]
}

/** Total volume in kg — the number a trainer actually compares between sessions. */
export function totalVolume(sets: WorkoutSet[]): number | null {
  const usable = sets.filter((set) => set.weightKg !== null && set.repsCompleted !== null)
  if (usable.length === 0) return null

  const volume = usable.reduce(
    (total, set) => total + (set.weightKg as number) * (set.repsCompleted as number),
    0,
  )
  return Math.round(volume * 10) / 10
}

export type { WorkoutStatus }
