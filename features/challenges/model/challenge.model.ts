import type {
  ChallengeStatus,
  MetricFamily,
  MetricType,
  ParticipationStatus,
  RequirementMode,
} from "../dto/challenge.dto"

/**
 * Domain types and pure predicates for the merchant's challenges.
 *
 * The wording rule for the whole slice: a challenge is a promise — *complete
 * this and take this*. There is no currency, no balance and no catalogue, so no
 * label here should read like a price.
 */

export interface Reward {
  name: string
  description: string | null
  imageUrl: string | null
  terms: string | null
  expiresAt: string
  stock: number
}

export interface ChallengeRequirement {
  id: number
  metric: MetricType
  label: string
  unit: string
  metricFamily: MetricFamily
  targetValue: number
  goalKey: string
}

export interface BrandChallenge {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  terms: string | null
  status: ChallengeStatus
  requirementMode: RequirementMode
  requiredCount: number | null
  startsAt: string
  endsAt: string
  reward: Reward
  requirements: ChallengeRequirement[]
  goalSignature: string
  acceptedCount: number
  completedCount: number
  redeemedCount: number
  stockLeft: number
  editable: boolean
}

export interface ChallengeParticipant {
  id: number
  studentFirstName: string | null
  status: ParticipationStatus
  acceptedAt: string
  completedAt: string | null
  redeemedAt: string | null
  deliveredAt: string | null
  redemptionCode: string | null
}

export interface Redemption {
  id: number
  challengeId: number
  challengeName: string
  rewardName: string
  rewardImageUrl: string | null
  status: ParticipationStatus
  redeemedAt: string | null
  deliveredAt: string | null
  redemptionCode: string | null
  rewardExpiresAt: string
}

// ── Etiquetas ──────────────────────────────────────────────────────────────

export const CHALLENGE_STATUS_LABELS: Record<ChallengeStatus, string> = {
  DRAFT: "Borrador",
  PUBLISHED: "Publicado",
  PAUSED: "Pausado",
  CANCELLED: "Cancelado",
  ENDED: "Terminado",
}

export const CHALLENGE_STATUS_TONES: Record<ChallengeStatus, "neutral" | "warning" | "success" | "error"> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  PAUSED: "warning",
  CANCELLED: "error",
  ENDED: "neutral",
}

export const PARTICIPATION_LABELS: Record<ParticipationStatus, string> = {
  ACCEPTED: "En curso",
  COMPLETED: "Completado",
  REDEEMED: "Para entregar",
  EXPIRED: "Vencido",
  REWARD_EXPIRED: "Premio vencido",
  CANCELLED: "Abandonado",
  REVOKED: "Cancelado por vos",
}

export const PARTICIPATION_TONES: Record<ParticipationStatus, "neutral" | "warning" | "success" | "error"> = {
  ACCEPTED: "neutral",
  COMPLETED: "warning",
  REDEEMED: "success",
  EXPIRED: "neutral",
  REWARD_EXPIRED: "neutral",
  CANCELLED: "neutral",
  REVOKED: "error",
}

export const MODE_LABELS: Record<RequirementMode, string> = {
  ALL: "Todas las condiciones",
  ANY: "Cualquiera de las condiciones",
  N_OF_M: "Algunas de las condiciones",
}

/**
 * Las nueve métricas, agrupadas por familia.
 *
 * La familia no es decorativa: **un alumno no puede tener dos desafíos activos
 * que la compartan**, así que el formulario usa esto para impedir que un mismo
 * desafío mida la misma actividad dos veces, y la lista lo muestra para que el
 * comercio entienda con qué otros desafíos compite el suyo.
 */
export const METRIC_OPTIONS: {
  value: MetricType
  label: string
  unit: string
  family: MetricFamily
}[] = [
  { value: "WORKOUTS_COMPLETED", label: "Entrenamientos completados", unit: "entrenamientos", family: "FREQUENCY" },
  { value: "CURRENT_STREAK_DAYS", label: "Días seguidos entrenando", unit: "días", family: "FREQUENCY" },
  { value: "BEST_STREAK_DAYS", label: "Mejor racha de días seguidos", unit: "días", family: "FREQUENCY" },
  { value: "ACTIVE_WEEKS", label: "Semanas con entrenamiento", unit: "semanas", family: "FREQUENCY" },
  { value: "SETS_COMPLETED", label: "Series realizadas", unit: "series", family: "SETS" },
  { value: "REPS_TOTAL", label: "Repeticiones realizadas", unit: "repeticiones", family: "REPS" },
  { value: "VOLUME_KG", label: "Peso total levantado", unit: "kg", family: "VOLUME" },
  { value: "EXERCISES_COMPLETED", label: "Ejercicios completados", unit: "ejercicios", family: "EXERCISES" },
  { value: "TRAINING_MINUTES", label: "Minutos entrenando", unit: "minutos", family: "TIME" },
]

export const FAMILY_LABELS: Record<MetricFamily, string> = {
  FREQUENCY: "constancia",
  VOLUME: "volumen",
  SETS: "series",
  REPS: "repeticiones",
  EXERCISES: "ejercicios",
  TIME: "tiempo",
}

export const MODE_OPTIONS: { value: RequirementMode; label: string }[] = [
  { value: "ALL", label: MODE_LABELS.ALL },
  { value: "ANY", label: MODE_LABELS.ANY },
  { value: "N_OF_M", label: MODE_LABELS.N_OF_M },
]

export function metricOption(metric: MetricType) {
  return METRIC_OPTIONS.find((option) => option.value === metric)
}

// ── Predicados ─────────────────────────────────────────────────────────────

/** ¿Lo están viendo los alumnos ahora mismo? */
export function isLive(challenge: BrandChallenge, now = new Date()): boolean {
  if (challenge.status !== "PUBLISHED") return false
  if (challenge.stockLeft <= 0) return false
  const starts = new Date(challenge.startsAt)
  const ends = new Date(challenge.endsAt)
  return starts <= now && now <= ends
}

/**
 * Por qué no se puede aceptar, en una línea.
 *
 * Devuelve `null` cuando está todo bien. El orden es el que le importa al
 * comercio: primero lo que depende de él, después lo que depende del calendario.
 */
export function notLiveReason(challenge: BrandChallenge, now = new Date()): string | null {
  if (challenge.status === "DRAFT") return "Todavía no lo publicaste"
  if (challenge.status === "PAUSED") return "Pausado por vos"
  if (challenge.status === "CANCELLED") return "Cancelado"
  if (challenge.status === "ENDED") return "Terminó su vigencia"
  if (new Date(challenge.startsAt) > now) return "Todavía no empieza"
  if (new Date(challenge.endsAt) < now) return "Terminó su vigencia"
  if (challenge.stockLeft <= 0) return "Sin unidades disponibles"
  return null
}

/** "5 entrenamientos", "5.000 kg". */
export function describeRequirement(requirement: ChallengeRequirement): string {
  return `${requirement.targetValue.toLocaleString("es-AR")} ${requirement.unit}`
}

export function describeMode(challenge: BrandChallenge): string {
  if (challenge.requirementMode === "N_OF_M" && challenge.requiredCount) {
    return `${challenge.requiredCount} de ${challenge.requirements.length} condiciones`
  }
  if (challenge.requirementMode === "ANY") return "Cualquier condición"
  return challenge.requirements.length === 1 ? "Una condición" : `Las ${challenge.requirements.length} condiciones`
}

/** Las familias que ocupa un desafío: con cuáles compite por la atención del alumno. */
export function familiesOf(challenge: BrandChallenge): MetricFamily[] {
  return [...new Set(challenge.requirements.map((requirement) => requirement.metricFamily))]
}

/** Un canje pendiente de entregar. Es lo que el comercio tiene que hacer hoy. */
export function isPendingDelivery(redemption: Redemption): boolean {
  return redemption.status === "REDEEMED" && redemption.deliveredAt === null
}
