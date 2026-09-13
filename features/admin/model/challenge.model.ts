import type { RewardMetricType, RewardMetricWindow } from "../dto/admin.dto"
import type { AdminChallenge, ChallengeRequirement } from "./admin.model"

/**
 * Vocabulario y predicados de los desafíos.
 *
 * La distinción que gobierna todo este archivo: un producto **gasta** repes, un
 * desafío las **acuña**. El copy se apoya en eso, y los predicados nunca recalculan
 * una decisión que el backend ya tomó (si está publicado, si todavía se puede
 * editar).
 *
 * Vivía en `features/brand` cuando los desafíos los cargaba el comercio. Se mudó
 * acá con la función; el comercio ya no tiene nada que ver con esta mitad de la
 * economía.
 */

export const MODE_LABELS: Record<AdminChallenge["requirementMode"], string> = {
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
 * Las métricas que se pueden pedir, en el orden que tiene sentido para alguien
 * escribiendo un desafío: primero el volumen de trabajo, después la constancia.
 *
 * La lista está duplicada del enum del backend a propósito —un `<select>` necesita
 * las opciones en tiempo de build— y lo que garantiza que cada valor de acá tenga un
 * cálculo real detrás es `RewardMetricEvaluatorCoverageTest`, arriba.
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

/**
 * Cómo se nombra el estado de un desafío.
 *
 * Dos etiquetas y no cuatro: el tipo `ProductApprovalStatus` se comparte con los
 * productos, que pasan por una revisión de dos partes, pero un desafío que carga el
 * admin sólo puede estar en borrador o publicado. `PENDING_APPROVAL` y `REJECTED`
 * quedan mapeados por si aparece una fila vieja de cuando los cargaba el comercio.
 */
export const CHALLENGE_STATUS_LABELS: Record<AdminChallenge["approvalStatus"], string> = {
  DRAFT: "Borrador",
  APPROVED: "Publicado",
  PENDING_APPROVAL: "En revisión",
  REJECTED: "Rechazado",
}

export const CHALLENGE_STATUS_TONES: Record<
  AdminChallenge["approvalStatus"],
  "neutral" | "warning" | "success" | "error"
> = {
  DRAFT: "neutral",
  APPROVED: "success",
  PENDING_APPROVAL: "warning",
  REJECTED: "error",
}

/** ¿Los alumnos lo ven y todavía lo pueden ganar? */
export function isLive(challenge: AdminChallenge): boolean {
  return challenge.approvalStatus === "APPROVED" && challenge.active && hasGrantsLeft(challenge)
}

export function hasGrantsLeft(challenge: AdminChallenge): boolean {
  return challenge.maxGrants === null || challenge.grantedCount < challenge.maxGrants
}

/**
 * Por qué un desafío publicado igual no se puede ganar, o null cuando sí.
 *
 * Decir "publicado" sobre algo pausado o con el cupo agotado deja a quien lo
 * administra preguntándose por qué nadie lo desbloquea — el mismo motivo por el que
 * existe `notLiveReason` para los productos.
 */
export function notLiveReason(challenge: AdminChallenge): string | null {
  if (challenge.approvalStatus !== "APPROVED") return null
  if (!challenge.active) return "Pausado"
  if (!hasGrantsLeft(challenge)) return "Cupo agotado"
  if (challenge.validTo !== null && challenge.validTo < today()) return "Vigencia terminada"
  if (challenge.validFrom !== null && challenge.validFrom > today()) return "Todavía no empieza"
  return null
}

/** Cómo se lee el requisito en una fila: "100 series (últimos 30 días)". */
export function describeRequirement(requirement: ChallengeRequirement): string {
  const base = `${formatTarget(requirement.targetValue)} ${requirement.unit}`
  if (requirement.window === "LAST_N_DAYS" && requirement.windowDays !== null) {
    return `${base} en los últimos ${requirement.windowDays} días`
  }
  if (requirement.window === "SINCE_CHALLENGE_START") return `${base} desde que empieza`
  return base
}

/** Cuántos requisitos tiene que cumplir el alumno, dicho en palabras. */
export function describeMode(challenge: AdminChallenge): string {
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

/** Fecha ISO de hoy, para comparar contra el `DATE` plano que manda el backend. */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}
