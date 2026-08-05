import { toMediaUrl } from "@/core/http/media"
import { toSubscriptionPlan } from "@/features/subscription-plans/mappers/subscription-plan.mapper"
import { toCertification } from "@/features/trainer-profile/mappers/trainer-profile.mapper"

import type {
  RatingDistributionDTO,
  ReviewResponseDTO,
  TrainerDetailResponseDTO,
  TrainerSummaryResponseDTO,
} from "../dto/directory.dto"
import type {
  DirectoryTrainer,
  DirectoryTrainerDetail,
  RatingDistribution,
  Review,
} from "../model/directory.model"

const STAR_VALUES = [5, 4, 3, 2, 1]

export function toDirectoryTrainer(dto: TrainerSummaryResponseDTO): DirectoryTrainer {
  return {
    id: dto.id,
    fullName: dto.fullName?.trim() || "Entrenador sin nombre",
    avatarUrl: toMediaUrl(dto.profileImageUrl),
    bio: dto.description ?? "",
    basePrice: dto.basePrice ?? null,
    experienceYears: dto.experienceYears ?? null,
    location: dto.location ?? "",
    avgRating: dto.avgRating ?? null,
    totalReviews: dto.totalReviews ?? 0,
    activeStudents: dto.currentStudents ?? 0,
    specialties: dto.specialties ?? [],
  }
}

export function toDirectoryTrainerDetail(
  dto: TrainerDetailResponseDTO,
): DirectoryTrainerDetail {
  return {
    ...toDirectoryTrainer(dto),
    plans: (dto.plans ?? []).map(toSubscriptionPlan),
    certifications: (dto.certifications ?? []).map(toCertification),
  }
}

export function toReview(dto: ReviewResponseDTO): Review {
  return {
    id: dto.id,
    studentId: dto.studentId,
    studentName: dto.studentName?.trim() || "Alumno",
    studentAvatarUrl: toMediaUrl(dto.studentImageUrl),
    rating: dto.rating,
    comment: dto.comment ?? "",
    createdAt: dto.createdAt,
  }
}

/**
 * Fills in the star buckets the backend leaves out.
 *
 * `ReviewService.getDistribution` builds the list by looping over the rows of a
 * group-by, so a rating nobody has given simply is not there. Rendering that
 * as-is would draw a chart with missing rows, which reads as "no data" instead
 * of "zero" — a very different message about a trainer.
 *
 * Ratings are `BigDecimal`, so a 4.5 is possible; buckets are keyed by the
 * integer star value the query grouped on.
 */
export function toRatingDistribution(dto: RatingDistributionDTO): RatingDistribution {
  const counts = new Map<number, number>()
  for (const entry of dto.distribution ?? []) {
    counts.set(entry.stars, (counts.get(entry.stars) ?? 0) + entry.count)
  }

  const totalFromBuckets = [...counts.values()].reduce((sum, count) => sum + count, 0)
  // Prefer the aggregate the trainer's stats row carries; fall back to the sum
  // when stats have not been recalculated yet.
  const total = dto.totalReviews ?? totalFromBuckets

  return {
    avgRating: dto.avgRating ?? null,
    totalReviews: total,
    buckets: STAR_VALUES.map((stars) => {
      const count = counts.get(stars) ?? 0
      return {
        stars,
        count,
        percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
      }
    }),
  }
}
