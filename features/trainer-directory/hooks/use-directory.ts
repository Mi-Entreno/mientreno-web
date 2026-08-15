"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { nextPageParam } from "@/core/http/pagination"
import { qk } from "@/core/http/query-keys"
import { directoryRepository } from "../api/directory.repository"
import type { Review } from "../model/directory.model"

export function usePublicTrainer(trainerId: number | null) {
  return useQuery({
    queryKey: qk.trainers.detail(trainerId ?? 0),
    queryFn: () => directoryRepository.getById(trainerId as number),
    enabled: trainerId !== null,
    staleTime: 60_000,
  })
}

export function useRatingDistribution(trainerId: number | null) {
  return useQuery({
    queryKey: qk.trainers.reviewDistribution(trainerId ?? 0),
    queryFn: () => directoryRepository.getRatingDistribution(trainerId as number),
    enabled: trainerId !== null,
    staleTime: 60_000,
  })
}

export function useTrainerReviews(trainerId: number | null) {
  const query = useInfiniteQuery({
    queryKey: qk.trainers.reviews(trainerId ?? 0),
    queryFn: ({ pageParam }) =>
      directoryRepository.listReviews(trainerId as number, pageParam),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    enabled: trainerId !== null,
    staleTime: 60_000,
  })

  const reviews = useMemo<Review[]>(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  )

  return {
    reviews,
    totalItems: query.data?.pages[0]?.totalItems ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}
