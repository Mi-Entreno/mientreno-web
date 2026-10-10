/** `AdherenceResponseDTO` — `GET /api/trainer/adherence` (Pro). */
export type AdherenceStatusDTO = "FALLING_OFF" | "AT_RISK" | "ON_TRACK" | "NO_PLAN"

export interface StudentAdherenceDTO {
  subscriptionId: number
  studentId: number
  studentName: string
  /** Training days of the current plan; null without a plan. */
  plannedPerWeek: number | null
  sessionsLast7Days: number
  sessionsLast28Days: number
  /** Sessions in 4 weeks over planned, 0..1; null without a plan. */
  ratio: number | null
  lastSessionDate: string | null
  status: AdherenceStatusDTO
}

export interface AdherenceDTO {
  summary: { activeStudents: number; onTrack: number; atRisk: number; fallingOff: number; withoutPlan: number }
  /** Most in need of attention first. */
  students: StudentAdherenceDTO[]
}
