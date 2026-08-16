import type { WeightUnit } from "../dto/training-plan.dto"

/** Target for one set. What the student should do, not what they did. */
export interface PlannedSet {
  setNumber: number
  reps: number | null
  weightValue: number | null
  weightUnit: WeightUnit | null
}

export interface PlanExercise {
  id: number
  order: number
  name: string
  /** Flat summary from the backend; `plannedSets` carries the real targets. */
  sets: number | null
  reps: number | null
  weightValue: number | null
  weightUnit: WeightUnit | null
  restSeconds: number | null
  durationSeconds: number | null
  mediaUrl: string | null
  trainerNotes: string | null
  catalogExerciseId: number | null
  muscleGroup: string | null
  equipment: string | null
  plannedSets: PlannedSet[]
}

export interface PlanDay {
  id: number
  dayNumber: number
  label: string
  restDay: boolean
  exercises: PlanExercise[]
}

export interface TrainingPlan {
  id: number
  version: number
  title: string
  notes: string
  current: boolean
  createdAt: string
  days: PlanDay[]
}

export interface StudentPlanSummary {
  subscriptionId: number
  studentId: number
  studentName: string
  studentAvatarUrl: string | null
  currentPlan: TrainingPlan | null
}

// ── Editor state ─────────────────────────────────────────────────────────────
// Numeric fields are strings so an empty input stays empty rather than
// collapsing to 0 — 0 sets and "unspecified" are different things.

/** One set row in the editor. Strings for the same reason as the fields below. */
export interface EditorSet {
  key: string
  reps: string
  weightValue: string
}

export interface EditorExercise {
  /** Stable local key; exercise ids do not survive a save (days are rebuilt). */
  key: string
  catalogExerciseId: number | null
  name: string
  muscleGroup: string | null
  equipment: string | null
  /**
   * Per-set targets. `sets.length` is the set count — there is no separate
   * numeric field, so the two can never disagree.
   */
  sets: EditorSet[]
  weightUnit: WeightUnit | ""
  restSeconds: string
  durationSeconds: string
  trainerNotes: string
  /**
   * Preserved verbatim across edits. Phase 8 sets this from the video uploader;
   * dropping it here would silently unlink a video on the next save.
   */
  mediaUrl: string | null
}

export interface EditorDay {
  key: string
  label: string
  restDay: boolean
  exercises: EditorExercise[]
}

export interface EditorPlan {
  title: string
  notes: string
  days: EditorDay[]
}

export const WEIGHT_UNITS: { value: WeightUnit; label: string }[] = [
  { value: "KG", label: "kg" },
  { value: "LB", label: "lb" },
  { value: "BODYWEIGHT", label: "Peso corporal" },
]

let keySeed = 0
export function nextKey(prefix: string): string {
  keySeed += 1
  return `${prefix}-${keySeed}`
}

export function emptySet(): EditorSet {
  return { key: nextKey("set"), reps: "", weightValue: "" }
}

/**
 * Resizes the set list to `count`, keeping what is already filled in.
 *
 * Going 4 -> 3 must not wipe the first three, and going back up copies the last
 * row, which is what a trainer usually wants: same load, one more set.
 */
export function resizeSets(sets: EditorSet[], count: number): EditorSet[] {
  if (count <= sets.length) return sets.slice(0, count)

  const template = sets[sets.length - 1]
  return [
    ...sets,
    ...Array.from({ length: count - sets.length }, () =>
      template ? { ...template, key: nextKey("set") } : emptySet(),
    ),
  ]
}

export function emptyExercise(): EditorExercise {
  return {
    key: nextKey("ex"),
    catalogExerciseId: null,
    name: "",
    muscleGroup: null,
    equipment: null,
    sets: [emptySet()],
    weightUnit: "",
    restSeconds: "",
    durationSeconds: "",
    trainerNotes: "",
    mediaUrl: null,
  }
}

export function emptyDay(index: number): EditorDay {
  return {
    key: nextKey("day"),
    label: `Día ${index + 1}`,
    restDay: false,
    exercises: [],
  }
}

export function emptyPlan(): EditorPlan {
  return { title: "", notes: "", days: [emptyDay(0)] }
}

export function countExercises(plan: EditorPlan): number {
  return plan.days.reduce((total, day) => total + (day.restDay ? 0 : day.exercises.length), 0)
}

export type { WeightUnit }
