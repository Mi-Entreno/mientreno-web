"use client"

import { useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { nextPageParam } from "@/core/http/pagination"
import { qk } from "@/core/http/query-keys"
import { studentSearchRepository } from "../api/student-search.repository"
import { MIN_SEARCH_LENGTH, type StudentCandidate } from "../model/student-search.model"

/**
 * Paginated student lookup, flattened for the picker's "load more".
 *
 * Disabled below `MIN_SEARCH_LENGTH` so an empty field does not list every
 * student on the platform — that is a privacy boundary, not just a performance
 * one. `isIdle` lets the UI say "type a name" instead of showing an empty
 * result that reads like "no matches".
 */
export function useStudentSearch(term: string) {
  const trimmed = term.trim()
  const enabled = trimmed.length >= MIN_SEARCH_LENGTH

  const query = useInfiniteQuery({
    queryKey: qk.studentSearch.query({ q: trimmed }),
    queryFn: ({ pageParam }) => studentSearchRepository.search(trimmed, pageParam),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    enabled,
    staleTime: 30_000,
  })

  const candidates = useMemo<StudentCandidate[]>(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  )

  return {
    candidates,
    totalItems: query.data?.pages[0]?.totalItems ?? 0,
    isIdle: !enabled,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}
