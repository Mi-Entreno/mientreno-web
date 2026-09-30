/** Literal mirrors of `plan/dto`. Do not edit without the Java. */

/** `WeightUnit.java`. `buildDays` upper-cases then `valueOf`s — anything else is a 400. */
export type WeightUnit = "KG" | "LB" | "BODYWEIGHT"

/**
 * `ExerciseTrackingMode.java`. `REPS_WEIGHT` is the default when omitted;
 * `DURATION` (cardio) plans every set in seconds instead of reps and load.
 */
export type TrackingMode = "REPS_WEIGHT" | "DURATION"

/**
 * `PlannedSetResponse`. One row of `exercise_sets`: the target for set N.
 *
 * Always populated when the exercise has sets — a plan stored under the old
 * flat model is expanded server-side into N identical entries.
 */
export interface PlannedSetResponseDTO {
  id: number | null
  setNumber: number
  targetReps: number | null
  /** `BigDecimal` upstream, JSON number here. */
  targetWeightValue: number | null
  targetWeightUnit: WeightUnit | null
  restSeconds: number | null
  /** Only on `DURATION` exercises. */
  targetDurationSeconds?: number | null
}

export interface ExerciseResponseDTO {
  id: number
  /** Named `order` in the DTO; the entity column is `exerciseOrder`. */
  order: number
  name: string
  /**
   * Flat summary kept for backwards compatibility: set count plus the first
   * set's values. `plannedSets` is the source of truth — read that unless you
   * only need a headline number.
   */
  sets: number | null
  reps: number | null
  /** `BigDecimal` upstream, JSON number here. */
  weightValue: number | null
  weightUnit: WeightUnit | null
  restSeconds: number | null
  durationSeconds: number | null
  mediaUrl: string | null
  trainerNotes: string | null
  /** Only set when the exercise was linked to the catalogue. */
  catalogExerciseId: number | null
  /** Read from the linked catalogue entry, never stored on the exercise. */
  muscleGroup: string | null
  equipment: string | null
  /** Per-set targets, ordered by `setNumber`. */
  plannedSets: PlannedSetResponseDTO[]
  /** Missing on responses from a backend older than V67: treat as `REPS_WEIGHT`. */
  trackingMode?: TrackingMode
}

export interface TrainingDayResponseDTO {
  id: number
  dayNumber: number
  label: string | null
  restDay: boolean
  exercises: ExerciseResponseDTO[]
}

/** `TrainingPlanResponseDTO`. `createdAt` is a `LocalDateTime` (no offset). */
export interface TrainingPlanResponseDTO {
  id: number
  version: number
  title: string
  notes: string | null
  current: boolean
  createdAt: string
  days: TrainingDayResponseDTO[]
}

/**
 * `ExerciseRequest`.
 *
 *  - `order` is `@NotNull`.
 *  - `name` and `catalogExerciseId` are each optional, but `resolveExerciseName`
 *    throws 400 unless at least one is present. With only the id, the backend
 *    snapshots the catalogue title so historical plans survive a re-import.
 *  - An unknown `catalogExerciseId` is a 404, not a silent null.
 *  - `weightValue` is a `Double` here but a `BigDecimal` in the response.
 */
export interface PlannedSetRequestDTO {
  /** Optional: omitted, the backend numbers by list position. */
  setNumber: number | null
  targetReps: number | null
  targetWeightValue: number | null
  targetWeightUnit: WeightUnit | null
  restSeconds: number | null
  /** Required (> 0) on every set of a `DURATION` exercise; 400 otherwise. */
  targetDurationSeconds: number | null
}

export interface ExerciseRequestDTO {
  order: number
  name: string | null
  catalogExerciseId: number | null
  /**
   * Flat summary. Still sent in sync with `plannedSets`: the backend would
   * recompute it anyway, but sending it keeps the request self-consistent.
   * When `plannedSets` is null or empty the backend falls back to expanding
   * these across all sets, which is how the old contract behaved.
   */
  sets: number | null
  reps: number | null
  weightValue: number | null
  weightUnit: WeightUnit | null
  restSeconds: number | null
  durationSeconds: number | null
  mediaUrl: string | null
  trainerNotes: string | null
  /** Per-set targets; wins over the flat fields when present. */
  plannedSets: PlannedSetRequestDTO[] | null
  trackingMode: TrackingMode
}

/**
 * `TrainingDayRequest`. `dayNumber` is `@NotNull`.
 *
 * When `restDay` is true `buildDays` skips the exercises entirely
 * (`if (!dayReq.restDay() && ...)`), so anything sent for a rest day is
 * discarded server-side.
 */
export interface TrainingDayRequestDTO {
  dayNumber: number
  label: string | null
  restDay: boolean
  exercises: ExerciseRequestDTO[]
}

/** `CreateTrainingPlanRequestDTO` — `subscriptionId`, `title` and `days` required. */
export interface CreateTrainingPlanRequestDTO {
  subscriptionId: number
  title: string
  notes: string | null
  days: TrainingDayRequestDTO[]
}

/** `UpdateTrainingPlanRequestDTO` — same body minus the subscription. */
export interface UpdateTrainingPlanRequestDTO {
  title: string
  notes: string | null
  days: TrainingDayRequestDTO[]
}

/** `TrainerStudentPlanSummaryDTO` — the consolidated trainer view. */
export interface TrainerStudentPlanSummaryDTO {
  subscriptionId: number
  studentId: number
  studentFullName: string | null
  studentImageUrl: string | null
  /** null for a student with no plan yet. */
  currentPlan: TrainingPlanResponseDTO | null
}
