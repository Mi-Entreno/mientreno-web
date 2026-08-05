/**
 * Literal mirror of `student/dto/response/ProgressResponseDTO`.
 *
 * Every measurement is a nullable `BigDecimal`: a student logs whatever they
 * measured that day, so gaps are the norm rather than the exception.
 */
export interface ProgressResponseDTO {
  id: number
  subscriptionId: number
  weightKg: number | null
  bodyFatPct: number | null
  chestCm: number | null
  waistCm: number | null
  hipsCm: number | null
  armsCm: number | null
  thighsCm: number | null
  photoUrl: string | null
  notes: string | null
  /** `Instant` — when the student says it was measured. Drives the ordering. */
  recordedAt: string
  /** `LocalDateTime` — when the row was written. */
  createdAt: string
}
