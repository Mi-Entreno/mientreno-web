"use client"

import { useQuery } from "@tanstack/react-query"

import { qk } from "@/core/http/query-keys"
import { specialtiesRepository } from "../api/specialties.repository"

/**
 * The full catalogue. Effectively static reference data, so it is cached for
 * the whole session rather than refetched per form.
 */
export function useSpecialties() {
  return useQuery({
    queryKey: qk.specialties.all,
    queryFn: () => specialtiesRepository.list(),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useSpecialtySearch(query: string) {
  const trimmed = query.trim()

  return useQuery({
    queryKey: qk.specialties.search(trimmed),
    queryFn: () => specialtiesRepository.search(trimmed),
    enabled: trimmed.length >= 2,
    staleTime: 5 * 60_000,
  })
}
