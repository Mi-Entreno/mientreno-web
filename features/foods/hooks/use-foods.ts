"use client"

import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { nextPageParam } from "@/core/http/pagination"
import { qk } from "@/core/http/query-keys"
import { foodsRepository } from "../api/foods.repository"
import { collectCategories } from "../mappers/food.mapper"
import type { Food, FoodSearchParams } from "../model/food.model"

/**
 * Paginated food search, flattened for infinite scrolling.
 *
 * `categories` is derived from the loaded results rather than fetched: there is
 * no `/api/foods/categories` endpoint, and `category` is compared with `=`
 * upstream, so offering anything not seen in real data would filter to nothing.
 */
export function useFoodSearch(params: FoodSearchParams) {
  const query = useInfiniteQuery({
    queryKey: qk.foods.search({ q: params.search.trim(), category: params.category }),
    queryFn: ({ pageParam }) => foodsRepository.search(params, pageParam),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    staleTime: 5 * 60_000,
  })

  const foods = useMemo<Food[]>(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  )

  const categories = useMemo(() => collectCategories(foods), [foods])

  return {
    foods,
    categories,
    totalItems: query.data?.pages[0]?.totalItems ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}

export function useFood(id: number | null) {
  return useQuery({
    queryKey: qk.foods.detail(id ?? 0),
    queryFn: () => foodsRepository.getById(id as number),
    enabled: id !== null,
    // Imported reference data; it only changes when the importer runs.
    staleTime: Infinity,
  })
}
