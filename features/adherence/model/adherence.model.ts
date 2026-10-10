import type { AdherenceDTO, AdherenceStatusDTO, StudentAdherenceDTO } from "../dto/adherence.dto"

export type AdherenceStatus = AdherenceStatusDTO
export type StudentAdherence = StudentAdherenceDTO
export type Adherence = AdherenceDTO

export const STATUS_LABELS: Record<AdherenceStatus, string> = {
  FALLING_OFF: "Se está cayendo",
  AT_RISK: "En riesgo",
  ON_TRACK: "Al día",
  NO_PLAN: "Sin plan",
}

/** "3 de 4 por semana", or why there is nothing to compare against. */
export function describeRhythm(student: StudentAdherence): string {
  if (student.plannedPerWeek === null) return "Sin plan vigente"
  const perWeek = student.sessionsLast28Days / 4
  const rounded = Number.isInteger(perWeek) ? String(perWeek) : perWeek.toFixed(1).replace(".", ",")
  return `${rounded} de ${student.plannedPerWeek} por semana`
}

/** "hace 3 días", "hoy", or "nunca". */
export function describeLastSession(iso: string | null, today: Date = new Date()): string {
  if (!iso) return "Nunca entrenó"
  const last = new Date(`${iso}T00:00:00`)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const days = Math.round((start.getTime() - last.getTime()) / 86_400_000)
  if (days <= 0) return "Entrenó hoy"
  if (days === 1) return "Entrenó ayer"
  return `Último entrenamiento hace ${days} días`
}
