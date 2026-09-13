import type {
  ChallengeRequirementMode,
  ProductApprovalStatus,
  RewardMetricType,
  RewardMetricWindow,
} from "../dto/brand.dto"

/**
 * Domain types and wording for the merchant's reward challenges.
 *
 * The split that matters here: a product **spends** reps, a challenge **mints**
 * them. Everything in this file leans on that — the copy warns about it, and the
 * predicates never recompute a decision the backend already made (whether it is
 * published, whether it can still be edited).
 */

export interface ChallengeRequirement {
  id: number
  metric: RewardMetricType
  /** Comes from the backend enum so both clients say the same word. */
  label: string
  unit: string
  targetValue: number
  window: RewardMetricWindow
  windowDays: number | null
}

export interface BrandChallenge {
  id: number
  name: string
  description: string | null
  prizeReps: number
  requirementMode: ChallengeRequirementMode
  requiredCount: number | null
  active: boolean
  validFrom: string | null
  validTo: string | null
  maxGrants: number | null
  grantedCount: number
  editableRequirements: boolean
  approvalStatus: ProductApprovalStatus
  rejectionReason: string | null
  requirements: ChallengeRequirement[]
}

export const MODE_LABELS: Record<ChallengeRequirementMode, string> = {
  ALL: "Todos los requisitos",
  ANY: "Cualquiera de los requisitos",
  N_OF_M: "Algunos de los requisitos",
}

export const WINDOW_LABELS: Record<RewardMetricWindow, string> = {
  LIFETIME: "Desde siempre",
  LAST_N_DAYS: "Últimos días",
  SINCE_CHALLENGE_START: "Desde que empieza",
}

/**
 * Metrics the merchant can pick, in the order that makes sense to somebody
 * writing a challenge: first the volume of work, then the consistency.
 *
 * The list is duplicated from the backend enum on purpose — a `<select>` needs
 * options at build time — and `RewardMetricEvaluatorCoverageTest` upstream is
 * what guarantees every value here has a real calculation behind it.
 */
export const METRIC_OPTIONS: { value: RewardMetricType; label: string; unit: string }[] = [
  { value: "SETS_COMPLETED", label: "Series realizadas", unit: "series" },
  { value: "REPS_TOTAL", label: "Repeticiones realizadas", unit: "repeticiones" },
  { value: "VOLUME_KG", label: "Peso total levantado", unit: "kg" },
  { value: "WORKOUTS_COMPLETED", label: "Entrenamientos completados", unit: "entrenamientos" },
  { value: "EXERCISES_COMPLETED", label: "Ejercicios completados", unit: "ejercicios" },
  { value: "TRAINING_MINUTES", label: "Minutos entrenando", unit: "minutos" },
  { value: "CURRENT_STREAK_DAYS", label: "Días consecutivos", unit: "días" },
  { value: "BEST_STREAK_DAYS", label: "Mejor racha", unit: "días" },
  { value: "ACTIVE_WEEKS", label: "Semanas activas", unit: "semanas" },
]

/** Whether students can see it and still win it. */
export function isLive(challenge: BrandChallenge): boolean {
  return challenge.approvalStatus === "APPROVED" && challenge.active && hasGrantsLeft(challenge)
}

export function hasGrantsLeft(challenge: BrandChallenge): boolean {
  return challenge.maxGrants === null || challenge.grantedCount < challenge.maxGrants
}

/**
 * Why an approved challenge still is not winnable, or null when it is.
 *
 * Saying "publicado" over a paused or exhausted challenge would have the merchant
 * wondering why nobody unlocks it — the same reason `notLiveReason` exists for
 * products.
 */
export function notLiveReason(challenge: BrandChallenge): string | null {
  if (challenge.approvalStatus !== "APPROVED") return null
  if (!challenge.active) return "Pausada por vos"
  if (!hasGrantsLeft(challenge)) return "Cupo agotado"
  if (challenge.validTo !== null && challenge.validTo < today()) return "Vigencia terminada"
  if (challenge.validFrom !== null && challenge.validFrom > today()) return "Todavía no empieza"
  return null
}

/** How the requirement reads in a row: "100 series (últimos 30 días)". */
export function describeRequirement(requirement: ChallengeRequirement): string {
  const base = `${formatTarget(requirement.targetValue)} ${requirement.unit}`
  if (requirement.window === "LAST_N_DAYS" && requirement.windowDays !== null) {
    return `${base} en los últimos ${requirement.windowDays} días`
  }
  if (requirement.window === "SINCE_CHALLENGE_START") return `${base} desde que empieza`
  return base
}

/** How many requirements the student has to meet, spelled out. */
export function describeMode(challenge: BrandChallenge): string {
  const total = challenge.requirements.length
  if (challenge.requirementMode === "ANY") return `Cualquiera de los ${total}`
  if (challenge.requirementMode === "N_OF_M") {
    return `${challenge.requiredCount ?? total} de ${total}`
  }
  return total === 1 ? "El único requisito" : `Los ${total}`
}

function formatTarget(value: number): string {
  return value.toLocaleString("es-AR")
}

/** ISO date of today, to compare against the plain `DATE` the backend sends. */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}
