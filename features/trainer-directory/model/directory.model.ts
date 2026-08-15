import type { Certification } from "@/features/trainer-profile/model/trainer-profile.model"
import type { SubscriptionPlan } from "@/features/subscription-plans/model/subscription-plan.model"

export interface DirectoryTrainer {
  id: number
  fullName: string
  /** Display URL through the media proxy. */
  avatarUrl: string | null
  bio: string
  basePrice: number | null
  experienceYears: number | null
  location: string
  avgRating: number | null
  totalReviews: number
  activeStudents: number
  specialties: string[]
}

export interface DirectoryTrainerDetail extends DirectoryTrainer {
  plans: SubscriptionPlan[]
  certifications: Certification[]
}

export interface Review {
  id: number
  studentId: number
  studentName: string
  studentAvatarUrl: string | null
  rating: number
  comment: string
  createdAt: string
}

export interface StarBucket {
  stars: number
  count: number
  /** Share of the total, 0–100. Zero when there are no reviews at all. */
  percent: number
}

export interface RatingDistribution {
  avgRating: number | null
  totalReviews: number
  /** Always five buckets, 5★ down to 1★. */
  buckets: StarBucket[]
}

export const REVIEWS_PAGE_SIZE = 10
