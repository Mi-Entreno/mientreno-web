/**
 * Literal mirrors of the backend DTOs.
 *
 * Sources: `challenge/dto/response/BrandChallengeResponseDTO.java`,
 * `ChallengeParticipantResponseDTO.java`, `StudentChallengeResponseDTO.java`
 * and `challenge/dto/request/SaveChallengeRequestDTO.java`.
 *
 * A challenge now owns its reward: the merchant defines the goal and the prize
 * in one operation, and there is no currency in between. Everything that used
 * to live in `features/admin` (challenges) and in the products half of
 * `features/brand` (rewards) collapsed into this slice.
 */

export type ChallengeStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "CANCELLED" | "ENDED"

export type ParticipationStatus =
  | "ACCEPTED"
  | "COMPLETED"
  | "REDEEMED"
  | "EXPIRED"
  | "REWARD_EXPIRED"
  | "CANCELLED"
  | "REVOKED"

export type RequirementMode = "ALL" | "ANY" | "N_OF_M"

/** Mirrors `challenge/enums/RewardMetricType.java`. Adding one is a backend-only change. */
export type MetricType =
  | "SETS_COMPLETED"
  | "REPS_TOTAL"
  | "VOLUME_KG"
  | "WORKOUTS_COMPLETED"
  | "EXERCISES_COMPLETED"
  | "TRAINING_MINUTES"
  | "CURRENT_STREAK_DAYS"
  | "BEST_STREAK_DAYS"
  | "ACTIVE_WEEKS"

/**
 * Mirrors `challenge/enums/MetricFamily.java`.
 *
 * Two challenges a student holds at the same time cannot share a family: that
 * is the anti-duplicate rule, and the form uses it to stop the merchant from
 * measuring the same activity twice inside one challenge.
 */
export type MetricFamily = "FREQUENCY" | "VOLUME" | "SETS" | "REPS" | "EXERCISES" | "TIME"

export interface RewardDTO {
  name: string
  description: string | null
  imageUrl: string | null
  terms: string | null
  expiresAt: string
  stock: number
}

export interface BrandRequirementDTO {
  id: number
  metric: MetricType
  label: string
  unit: string
  metricFamily: MetricFamily
  targetValue: number
  goalKey: string
  sortOrder: number
}

export interface BrandChallengeDTO {
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
  publishedAt: string | null
  reward: RewardDTO
  requirements: BrandRequirementDTO[]
  goalSignature: string
  acceptedCount: number
  completedCount: number
  redeemedCount: number
  stockLeft: number
  /** Reps it costs a student to unlock it. 0 means free. Added in backend V62. */
  repsCost: number
  editable: boolean
}

export interface ChallengeParticipantDTO {
  id: number
  studentFirstName: string | null
  status: ParticipationStatus
  acceptedAt: string
  completedAt: string | null
  redeemedAt: string | null
  deliveredAt: string | null
  redemptionCode: string | null
}

/** The student-facing shape, which the merchant only sees when validating a code. */
export interface RedemptionDTO {
  id: number
  challengeId: number
  name: string
  status: ParticipationStatus
  acceptedAt: string
  completedAt: string | null
  redeemedAt: string | null
  deliveredAt: string | null
  redemptionCode: string | null
  brandName: string | null
  reward: RewardDTO
}

export interface SaveRequirementInput {
  metric: MetricType
  targetValue: number
  sortOrder?: number
}

export interface SaveChallengeInput {
  name: string
  description?: string
  terms?: string
  /** `yyyy-MM-dd`: the merchant thinks in days; the backend turns them into instants. */
  startDate: string
  endDate: string
  requirementMode: RequirementMode
  requiredCount?: number | null
  /**
   * May be empty when `repsCost > 0`: that is a challenge the student buys with
   * reps instead of training for. The backend dropped `@NotEmpty` here for that
   * reason — see `SaveChallengeRequestDTO.java`.
   */
  requirements: SaveRequirementInput[]
  /**
   * Reps the student pays to unlock it. 0 or omitted means free.
   *
   * The one combination the backend rejects is no requirements AND no cost:
   * that would hand the reward to whoever taps first.
   */
  repsCost?: number
  rewardName: string
  rewardDescription?: string
  rewardTerms?: string
  rewardExpirationDate: string
  rewardStock: number
}
