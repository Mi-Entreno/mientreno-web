"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { nextPageParam } from "@/core/http/pagination"
import { qk } from "@/core/http/query-keys"
import { catalogExercisesRepository } from "../api/catalog-exercises.repository"
import type { CatalogExercise, CatalogSearchParams } from "../model/catalog-exercise.model"

/** Paginated search, flattened for infinite scrolling. */
export function useCatalogSearch(params: CatalogSearchParams) {
  const query = useInfiniteQuery({
    queryKey: qk.catalogExercises.search({ search: params.search.trim() }),
    queryFn: ({ pageParam, signal }) =>
      catalogExercisesRepository.search(params, pageParam, undefined, signal),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    staleTime: 5 * 60_000,
  })

  const exercises = useMemo<CatalogExercise[]>(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  )

  return {
    exercises,
    totalItems: query.data?.pages[0]?.totalItems ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}

export function useCatalogExercise(id: number | null) {
  return useQuery({
    queryKey: qk.catalogExercises.detail(id ?? 0),
    queryFn: () => catalogExercisesRepository.getById(id as number),
    enabled: id !== null,
    staleTime: Infinity,
  })
}
