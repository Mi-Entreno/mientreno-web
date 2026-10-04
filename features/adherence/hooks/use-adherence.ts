"use client"

import { useQuery } from "@tanstack/react-query"

import { qk } from "@/core/http/query-keys"
import { useFeature } from "@/features/membership/hooks/use-membership"
import { FEATURES } from "@/features/membership/model/membership.model"
import { adherenceRepository } from "../api/adherence.repository"

/**
 * Only fetched once the plan is known to include it: asking while
 * entitlements load would answer 402 and toast the paywall at a trainer who
 * just opened the page.
 */
export function useAdherence() {
  const { feature } = useFeature(FEATURES.adherenceDashboard)
  return useQuery({
    queryKey: qk.adherence,
    queryFn: ({ signal }) => adherenceRepository.get(signal),
    enabled: feature?.enabled === true,
    staleTime: 5 * 60_000,
  })
}
