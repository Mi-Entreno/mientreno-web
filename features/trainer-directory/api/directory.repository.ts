import { apiFetch } from "@/core/http/client"
import { mapPage, type PageResponse, type SpringPage } from "@/core/http/pagination"

import type {
  RatingDistributionDTO,
  ReviewResponseDTO,
  TrainerDetailResponseDTO,
  TrainerSummaryResponseDTO,
} from "../dto/directory.dto"
import {
  toDirectoryTrainer,
  toDirectoryTrainerDetail,
  toRatingDistribution,
  toReview,
} from "../mappers/directory.mapper"
import {
  DIRECTORY_PAGE_SIZE,
  REVIEWS_PAGE_SIZE,
  type DirectoryFilters,
  type DirectoryTrainer,
  type DirectoryTrainerDetail,
  type RatingDistribution,
  type Review,
} from "../model/directory.model"

/**
 * The public trainer directory.
 *
 * Every endpoint here is `permitAll` upstream, but they still go through the
 * BFF proxy: the only consumer is a signed-in trainer looking at how they and
 * their competitors appear, so there is no reason for a second network path.
 */
export const directoryRepository = {
  async list(
    filters: DirectoryFilters,
    page: number,
    size: number = DIRECTORY_PAGE_SIZE,
  ): Promise<PageResponse<DirectoryTrainer>> {
    const dto = await apiFetch<SpringPage<TrainerSummaryResponseDTO>>("/api/trainers", {
      query: {
        search: filters.search.trim() || undefined,
        location: filters.location.trim() || undefined,
        specialty: filters.specialty ?? undefined,
        minRating: filters.minRating ?? undefined,
        maxPrice: filters.maxPrice.trim() ? Number(filters.maxPrice.replace(",", ".")) : undefined,
        page,
        size,
      },
    })

    return mapPage(dto, toDirectoryTrainer)
  },

  async getById(trainerId: number): Promise<DirectoryTrainerDetail> {
    return toDirectoryTrainerDetail(
      await apiFetch<TrainerDetailResponseDTO>(`/api/trainers/${trainerId}`),
    )
  },

  /**
   * Reviews, newest first.
   *
   * `sort` is passed explicitly: `@PageableDefault(sort = "createdAt")` has no
   * direction, so Spring defaults to **ascending** and the oldest review would
   * lead the list.
   */
  async listReviews(
    trainerId: number,
    page: number,
    size: number = REVIEWS_PAGE_SIZE,
  ): Promise<PageResponse<Review>> {
    const dto = await apiFetch<SpringPage<ReviewResponseDTO>>(
      `/api/trainers/${trainerId}/reviews`,
      { query: { page, size, sort: "createdAt,desc" } },
    )

    return mapPage(dto, toReview)
  },

  async getRatingDistribution(trainerId: number): Promise<RatingDistribution> {
    return toRatingDistribution(
      await apiFetch<RatingDistributionDTO>(`/api/trainers/${trainerId}/reviews/distribution`),
    )
  },
}
