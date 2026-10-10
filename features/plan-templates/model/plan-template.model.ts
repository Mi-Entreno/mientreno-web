import {
  countExercises,
  nextKey,
  type EditorDay,
  type EditorExercise,
  type EditorPlan,
  type EditorSet,
  WEIGHT_UNITS,
} from "@/features/training-plans/model/training-plan.model"

export interface PlanTemplate {
  id: number
  name: string
  description: string | null
  dayCount: number
  exerciseCount: number
  updatedAt: string
}

/**
 * Version of the template content format. The backend stores it next to the
 * content; bump it (and handle the old shape in `fromTemplateContent`) if the
 * editor model changes in a way that breaks reading old templates.
 */
export const TEMPLATE_SCHEMA_VERSION = 1

type StoredSet = Omit<EditorSet, "key">
type StoredExercise = Omit<EditorExercise, "key" | "sets"> & { sets: StoredSet[] }
type StoredDay = Omit<EditorDay, "key" | "exercises"> & { exercises: StoredExercise[] }

/**
 * What a template stores: the editor state minus the local React keys, which
 * mean nothing outside the session that minted them.
 */
export interface TemplateContent {
  title: string
  notes: string
  days: StoredDay[]
}

export function toTemplateContent(plan: EditorPlan): TemplateContent {
  return {
    title: plan.title,
    notes: plan.notes,
    days: plan.days.map((day) => ({
      label: day.label,
      restDay: day.restDay,
      exercises: day.exercises.map((exercise) => ({
        catalogExerciseId: exercise.catalogExerciseId,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        equipment: exercise.equipment,
        trackingMode: exercise.trackingMode,
        sets: exercise.sets.map((set) => ({ reps: set.reps, weightValue: set.weightValue, duration: set.duration })),
        weightUnit: exercise.weightUnit,
        restSeconds: exercise.restSeconds,
        durationSeconds: exercise.durationSeconds,
        trainerNotes: exercise.trainerNotes,
        mediaUrl: exercise.mediaUrl,
      })),
    })),
  }
}

/**
 * Back to editor state, with fresh keys. Defensive: a template is user data
 * stored as opaque JSON, so anything missing gets the editor's empty value
 * instead of crashing the editor. Returns null if it is not a plan at all.
 */
export function fromTemplateContent(content: unknown): EditorPlan | null {
  if (!content || typeof content !== "object") return null
  const raw = content as Partial<TemplateContent>
  if (!Array.isArray(raw.days)) return null

  const str = (v: unknown) => (typeof v === "string" ? v : "")
  return {
    title: str(raw.title),
    notes: str(raw.notes),
    days: raw.days.map((day) => ({
      key: nextKey("day"),
      label: str(day?.label),
      restDay: Boolean(day?.restDay),
      exercises: (Array.isArray(day?.exercises) ? day.exercises : []).map((exercise) => ({
        key: nextKey("exercise"),
        catalogExerciseId: typeof exercise?.catalogExerciseId === "number" ? exercise.catalogExerciseId : null,
        name: str(exercise?.name),
        muscleGroup: typeof exercise?.muscleGroup === "string" ? exercise.muscleGroup : null,
        equipment: typeof exercise?.equipment === "string" ? exercise.equipment : null,
        trackingMode: exercise?.trackingMode === "DURATION" ? "DURATION" : "REPS_WEIGHT",
        sets: (Array.isArray(exercise?.sets) ? exercise.sets : []).map((set) => ({
          key: nextKey("set"),
          reps: str(set?.reps),
          weightValue: str(set?.weightValue),
          duration: str(set?.duration),
        })),
        weightUnit: WEIGHT_UNIT_VALUES.has(exercise?.weightUnit as string) ? (exercise!.weightUnit as EditorExercise["weightUnit"]) : "",
        restSeconds: str(exercise?.restSeconds),
        durationSeconds: str(exercise?.durationSeconds),
        trainerNotes: str(exercise?.trainerNotes),
        mediaUrl: typeof exercise?.mediaUrl === "string" ? exercise.mediaUrl : null,
      })),
    })),
  }
}

const WEIGHT_UNIT_VALUES = new Set<string>(WEIGHT_UNITS.map((unit) => unit.value))

/** Day and exercise counts for the list, so it never has to open the content. */
export function templateCounts(plan: EditorPlan): { dayCount: number; exerciseCount: number } {
  return { dayCount: plan.days.filter((day) => !day.restDay).length, exerciseCount: countExercises(plan) }
}
