import type { CertificationDTO } from "@/features/trainer-profile/dto/trainer-profile.dto"
import type { SubscriptionPlanResponseDTO } from "@/features/subscription-plans/dto/subscription-plan.dto"

/** Literal mirrors of `trainer/dto`. These endpoints are `permitAll` upstream. */

/** `TrainerSummaryResponseDTO` — the row shape of `GET /api/trainers`. */
export interface TrainerSummaryResponseDTO {
  id: number
  fullName: string | null
  profileImageUrl: string | null
  description: string | null
  basePrice: number | null
  experienceYears: number | null
  location: string | null
  avgRating: number | null
  totalReviews: number | null
  currentStudents: number | null
  specialties: string[]
}

/**
 * `TrainerDetailResponseDTO` — the summary plus the trainer's commercial plans
 * and certifications. This is exactly what a student sees on a trainer's page.
 */
export interface TrainerDetailResponseDTO extends TrainerSummaryResponseDTO {
  plans: SubscriptionPlanResponseDTO[]
  certifications: CertificationDTO[]
}

/** `ReviewResponseDTO`. `rating` is a `BigDecimal`, so halves are possible. */
export interface ReviewResponseDTO {
  id: number
  studentId: number
  studentName: string | null
  studentImageUrl: string | null
  rating: number
  comment: string | null
  createdAt: string
}

/**
 * `RatingDistributionDTO`.
 *
 * `distribution` is built by looping over whatever rows the group-by query
 * returns, so **star buckets with no reviews are absent, not zero**. The mapper
 * fills the gaps; without that, a trainer with only 5★ and 3★ reviews would
 * render a two-bar chart that reads as missing data rather than as zeroes.
 */
export interface RatingDistributionDTO {
  avgRating: number | null
  totalReviews: number | null
  distribution: { stars: number; count: number }[]
}

/**
 * Filters for `GET /api/trainers`.
 * Paging is Spring's, defaulting to `size = 10, sort = "fullName"`.
 */
export interface DirectoryQuery {
  location?: string
  specialty?: string
  search?: string
  minRating?: number
  maxPrice?: number
}
