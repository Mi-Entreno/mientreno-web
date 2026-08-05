import { describe, expect, it } from "vitest"

import type {
  RatingDistributionDTO,
  ReviewResponseDTO,
  TrainerDetailResponseDTO,
} from "../dto/directory.dto"
import {
  toDirectoryTrainer,
  toDirectoryTrainerDetail,
  toRatingDistribution,
  toReview,
} from "./directory.mapper"

const DETAIL: TrainerDetailResponseDTO = {
  id: 7,
  fullName: "Alex Ruiz",
  profileImageUrl: "http://localhost:8080/api/files/avatars/7/me.png",
  description: "Entrenador de fuerza.",
  basePrice: 45,
  experienceYears: 8,
  location: "Madrid",
  avgRating: 4.6,
  totalReviews: 23,
  currentStudents: 6,
  specialties: ["Fuerza"],
  plans: [
    {
      id: 3,
      name: "Plan Premium",
      description: null,
      price: 49.9,
      billingPeriod: "MONTHLY",
      maxStudents: 20,
      includesNutrition: true,
    },
  ],
  certifications: [
    { id: 1, name: "NSCA-CPT", issuedBy: "NSCA", issuedAt: "2019-06-01", expiresAt: null, certificateUrl: null },
  ],
}

describe("toDirectoryTrainer", () => {
  it("routes the avatar through the media proxy", () => {
    expect(toDirectoryTrainer(DETAIL).avatarUrl).toBe("/api/media/avatars/7/me.png")
  })

  it("defaults the counters rather than leaving them null", () => {
    const trainer = toDirectoryTrainer({
      ...DETAIL,
      totalReviews: null,
      currentStudents: null,
      avgRating: null,
      fullName: null,
    })

    expect(trainer.totalReviews).toBe(0)
    expect(trainer.activeStudents).toBe(0)
    // avgRating stays null: "no ratings" is not the same as a rating of 0.
    expect(trainer.avgRating).toBeNull()
    expect(trainer.fullName).toBe("Entrenador sin nombre")
  })
})

describe("toDirectoryTrainerDetail", () => {
  it("maps the plans a student would subscribe to", () => {
    const detail = toDirectoryTrainerDetail(DETAIL)

    expect(detail.plans).toHaveLength(1)
    expect(detail.plans[0].price).toBe(49.9)
    expect(detail.certifications[0].name).toBe("NSCA-CPT")
  })
})

describe("toRatingDistribution", () => {
  it("fills in the star buckets the backend omits", () => {
    // `getDistribution` loops over the rows of a group-by, so a rating nobody
    // gave is absent. Rendering that as-is would look like missing data.
    const dto: RatingDistributionDTO = {
      avgRating: 4.5,
      totalReviews: 10,
      distribution: [
        { stars: 5, count: 7 },
        { stars: 3, count: 3 },
      ],
    }

    const distribution = toRatingDistribution(dto)

    expect(distribution.buckets.map((bucket) => bucket.stars)).toEqual([5, 4, 3, 2, 1])
    expect(distribution.buckets.map((bucket) => bucket.count)).toEqual([7, 0, 3, 0, 0])
  })

  it("computes each share against the total", () => {
    const distribution = toRatingDistribution({
      avgRating: 4.5,
      totalReviews: 10,
      distribution: [
        { stars: 5, count: 7 },
        { stars: 3, count: 3 },
      ],
    })

    expect(distribution.buckets[0].percent).toBe(70)
    expect(distribution.buckets[2].percent).toBe(30)
    expect(distribution.buckets[1].percent).toBe(0)
  })

  it("does not divide by zero with no reviews", () => {
    const distribution = toRatingDistribution({
      avgRating: null,
      totalReviews: 0,
      distribution: [],
    })

    expect(distribution.buckets).toHaveLength(5)
    expect(distribution.buckets.every((bucket) => bucket.percent === 0)).toBe(true)
    expect(distribution.avgRating).toBeNull()
  })

  it("falls back to summing the buckets when stats are missing", () => {
    // `totalReviews` comes from the trainer's stats row, which may not have
    // been recalculated yet.
    const distribution = toRatingDistribution({
      avgRating: 5,
      totalReviews: null,
      distribution: [{ stars: 5, count: 4 }],
    })

    expect(distribution.totalReviews).toBe(4)
    expect(distribution.buckets[0].percent).toBe(100)
  })
})

describe("toReview", () => {
  const REVIEW: ReviewResponseDTO = {
    id: 12,
    studentId: 42,
    studentName: "  ",
    studentImageUrl: null,
    rating: 4.5,
    comment: null,
    createdAt: "2026-07-20T10:00:00",
  }

  it("falls back for a blank student name", () => {
    expect(toReview(REVIEW).studentName).toBe("Alumno")
  })

  it("keeps a fractional rating, since it is a BigDecimal upstream", () => {
    expect(toReview(REVIEW).rating).toBe(4.5)
  })

  it("turns a null comment into an empty string", () => {
    expect(toReview(REVIEW).comment).toBe("")
  })
})
