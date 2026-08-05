"use client"

import { useQuery } from "@tanstack/react-query"

import { qk } from "@/core/http/query-keys"
import { progressRepository } from "../api/progress.repository"
import type { ProgressEntry } from "../model/progress.model"

export function useProgressHistory(subscriptionId: number | null) {
  return useQuery({
    queryKey: qk.progress.bySubscription(subscriptionId ?? 0),
    queryFn: () => progressRepository.listBySubscription(subscriptionId as number),
    enabled: subscriptionId !== null,
    staleTime: 60_000,
  })
}

/**
 * One progress record.
 *
 * Seeded from the list so the sheet paints immediately, then refetched — the
 * list is the same shape, so `initialData` is real data rather than a guess.
 */
export function useProgressEntry(progressId: number | null, initialData?: ProgressEntry) {
  return useQuery({
    queryKey: qk.progress.detail(progressId ?? 0),
    queryFn: () => progressRepository.getById(progressId as number),
    enabled: progressId !== null,
    initialData,
    staleTime: 60_000,
  })
}
