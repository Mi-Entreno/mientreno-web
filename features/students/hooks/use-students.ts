"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useSyncExternalStore } from "react"
import { toast } from "sonner"

import { specificMessage } from "@/core/http/user-message"
import { qk } from "@/core/http/query-keys"
import { studentsRepository } from "../api/students.repository"
import { pausedStore } from "../model/paused-store"
import type { StudentSubscription } from "../model/student.model"

/** Reads the locally-remembered paused ids without an effect. */
function usePausedIds(): readonly number[] {
  return useSyncExternalStore(
    pausedStore.subscribe,
    pausedStore.getSnapshot,
    pausedStore.getServerSnapshot,
  )
}

/**
 * The student roster, with locally-remembered paused subscriptions folded back
 * in — see `paused-store.ts` for why that is necessary.
 */
export function useStudents() {
  const pausedIds = usePausedIds()

  const roster = useQuery({
    queryKey: qk.students.list,
    queryFn: () => studentsRepository.list(),
    staleTime: 30_000,
  })

  const paused = useQuery({
    queryKey: [...qk.students.all, "paused", pausedIds],
    queryFn: async () => {
      const details = await studentsRepository.getManyByIds([...pausedIds])

      // Pruning here rather than in an effect: a query function is not a
      // render, so writing to the store is safe. Ids that turned out to be
      // active again — resumed elsewhere, or returned by a fixed backend —
      // stop being tracked. The store no-ops when nothing changed, so this
      // cannot loop.
      pausedStore.reconcile(
        details.filter((item) => item.status === "PAUSED").map((item) => item.subscriptionId),
      )

      return details
    },
    enabled: pausedIds.length > 0,
    staleTime: 30_000,
  })

  const students = useMemo<StudentSubscription[]>(() => {
    const rows = roster.data ?? []
    const seen = new Set(rows.map((row) => row.subscriptionId))

    const extras = (paused.data ?? []).filter(
      (item) => item.status === "PAUSED" && !seen.has(item.subscriptionId),
    )

    return [...rows, ...extras]
  }, [roster.data, paused.data])

  return {
    students,
    isLoading: roster.isLoading,
    isError: roster.isError,
    error: roster.error,
    refetch: roster.refetch,
    trackPaused: (subscriptionId: number) => pausedStore.remember(subscriptionId),
    untrackPaused: (subscriptionId: number) => pausedStore.forget(subscriptionId),
  }
}

export function useSubscriptionDetail(subscriptionId: number | null) {
  return useQuery({
    queryKey: qk.students.detail(subscriptionId ?? 0),
    queryFn: () => studentsRepository.getById(subscriptionId as number),
    enabled: subscriptionId !== null,
    staleTime: 30_000,
  })
}

/** Prefetch helper for hovering a roster row. */
export function useStudentPrefetch() {
  const queryClient = useQueryClient()

  return (subscriptionId: number) =>
    queryClient.prefetchQuery({
      queryKey: qk.students.detail(subscriptionId),
      queryFn: () => studentsRepository.getById(subscriptionId),
      staleTime: 30_000,
    })
}

interface StatusMutationOptions {
  onPaused?: (subscriptionId: number) => void
  onResumed?: (subscriptionId: number) => void
}

/**
 * Pause and resume. Both answer 204, and 409 when the subscription is not in
 * the required state ("Solo se puede pausar una suscripción activa").
 */
export function useSubscriptionStatus({ onPaused, onResumed }: StatusMutationOptions = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      subscriptionId,
      action,
    }: {
      subscriptionId: number
      action: "pause" | "resume"
    }) =>
      action === "pause"
        ? studentsRepository.pause(subscriptionId)
        : studentsRepository.resume(subscriptionId),

    onSuccess: (_result, { subscriptionId, action }) => {
      if (action === "pause") {
        onPaused?.(subscriptionId)
        toast.success("Suscripción pausada")
      } else {
        onResumed?.(subscriptionId)
        toast.success("Suscripción reanudada")
      }

      queryClient.invalidateQueries({ queryKey: qk.students.all })
    },

    onError: (error) => {
      toast.error(specificMessage(error) ?? "No pudimos cambiar el estado. Volvé a intentarlo.")
    },
  })
}
