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

// ── Límites e higiene de los campos ──────────────────────────────────────────
//
// El editor es un formulario largo con muchos campos libres, y el backend no
// perdona ninguno de los excesos: pasarse de largo en un texto termina en un
// `DataIntegrityViolationException` que `GlobalExceptionHandler` traduce a un
// 409 "Conflicto con un registro existente", y un número negativo en un
// `@PositiveOrZero` termina en un 400 con la ruta del campo como clave. Ni uno
// ni otro le dicen al entrenador qué escribió mal, así que los límites viven
// acá y se aplican mientras se tipea.

/** `TrainingPlan.title`, `@Column(nullable = false, length = 150)`. */
export const PLAN_TITLE_MAX_LENGTH = 150

/** `TrainingDay.label`, `@Column(length = 100)`. */
export const DAY_LABEL_MAX_LENGTH = 100

/** `Exercise.name`, `@Column(nullable = false, length = 150)`. */
export const EXERCISE_NAME_MAX_LENGTH = 150

/** Más que esto en una serie es un error de tipeo, no un objetivo. */
export const MAX_SETS = 12

/** `ExerciseSet.targetReps` es `@PositiveOrZero Integer`. */
export const MAX_REPS_DIGITS = 3

/** `restSeconds` y `durationSeconds` son `Integer`: 9999 s son casi tres horas. */
export const MAX_SECONDS_DIGITS = 4

/** `ExerciseSet.targetWeightValue` es `@Column(precision = 6, scale = 2)`. */
export const MAX_WEIGHT_INTEGER_DIGITS = 4
export const MAX_WEIGHT_DECIMALS = 2

/**
 * Un entero tecleado a mano: sólo dígitos, sin signo ni separadores.
 *
 * Filtra mientras se escribe en vez de avisar al publicar porque lo que se
 * colaba no daba error sino silencio: `toNumberOrNull` hace `Number("10-12")`,
 * eso es `NaN`, y el mapper lo manda como `null`. El entrenador escribía un
 * rango de repeticiones, publicaba sin ninguna advertencia y el alumno recibía
 * el ejercicio sin objetivo. Un "-3", en cambio, sí es un 400 contra
 * `@PositiveOrZero`.
 */
export function sanitizeInteger(value: string, maxDigits: number): string {
  return value.replace(/\D/g, "").slice(0, maxDigits)
}

/**
 * Un peso: dígitos, un único separador decimal y dos decimales.
 *
 * La coma se normaliza a punto —se teclea en el numpad y es lo natural en
 * castellano— y el entero se corta en cuatro dígitos: la columna es
 * `numeric(6,2)`, así que 10000 kg no es un 400 sino el 409 opaco de arriba.
 */
export function sanitizeDecimal(value: string): string {
  const [whole = "", ...rest] = value
    .replace(/[^\d.,]/g, "")
    .replace(/,/g, ".")
    .split(".")

  const head = whole.slice(0, MAX_WEIGHT_INTEGER_DIGITS)
  if (rest.length === 0) return head

  // El punto se conserva aunque todavía no haya decimales: si no, escribir
  // "80." borraría el separador en el mismo momento de teclearlo.
  return `${head}.${rest.join("").slice(0, MAX_WEIGHT_DECIMALS)}`
}

/**
 * Qué le falta a un ejercicio para poder guardarse, o null si está completo.
 *
 * Espeja lo que rechaza el backend, en el orden en que lo rechaza:
 * `resolveExerciseName` tira 400 si no hay ni nombre ni ejercicio de catálogo.
 * La unidad de peso no es un 400 —se guarda en null— pero deja al alumno un
 * número sin unidad, que es peor que el error.
 */
export function exerciseIssue(exercise: EditorExercise): string | null {
  if (!exercise.name.trim() && exercise.catalogExerciseId === null) {
    return "Este ejercicio necesita un nombre"
  }

  if (exercise.weightUnit === "" && exercise.sets.some((set) => set.weightValue.trim())) {
    return "Elegí la unidad del peso: kg, lb o peso corporal"
  }

  return null
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

/**
 * Copies an exercise with fresh local keys.
 *
 * The keys are React's identity for these rows, so reusing them would make the
 * copy and the original share focus and re-render as one. Everything else is
 * carried over verbatim, `mediaUrl` included: duplicating a row the trainer
 * already attached a video to and silently dropping the video is worse than
 * not offering the copy at all.
 */
export function cloneExercise(exercise: EditorExercise): EditorExercise {
  return {
    ...exercise,
    key: nextKey("ex"),
    sets: exercise.sets.map((set) => ({ ...set, key: nextKey("set") })),
  }
}

/**
 * Copies a whole day, exercises included.
 *
 * The single biggest time cost in this editor is building week two by retyping
 * week one. The label is suffixed rather than left identical so two days never
 * read the same while the trainer is still deciding what the copy is for.
 */
export function cloneDay(day: EditorDay): EditorDay {
  return {
    ...day,
    key: nextKey("day"),
    label: day.label.trim() ? `${day.label} (copia)` : "",
    exercises: day.exercises.map(cloneExercise),
  }
}

export function countExercises(plan: EditorPlan): number {
  return plan.days.reduce((total, day) => total + (day.restDay ? 0 : day.exercises.length), 0)
}

export type { WeightUnit }
