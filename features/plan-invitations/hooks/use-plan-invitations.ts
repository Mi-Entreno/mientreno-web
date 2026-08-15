"use client"

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { toast } from "sonner"

import { ApiError } from "@/core/http/errors"
import { nextPageParam } from "@/core/http/pagination"
import { qk } from "@/core/http/query-keys"
import { planInvitationsRepository } from "../api/plan-invitations.repository"
import type { InvitationStatus, PlanInvitation } from "../model/plan-invitation.model"

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

/** Invitations this trainer has sent, optionally narrowed to one status. */
export function useSentInvitations(status: InvitationStatus | null) {
  const query = useInfiniteQuery({
    queryKey: qk.planInvitations.sent(status),
    queryFn: ({ pageParam }) => planInvitationsRepository.listSent(status, pageParam),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    staleTime: 30_000,
  })

  const invitations = useMemo<PlanInvitation[]>(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  )

  return {
    invitations,
    totalItems: query.data?.pages[0]?.totalItems ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}

/**
 * Counts for the tab badges.
 *
 * A failure here is silent on purpose: the tabs work without their numbers, and
 * an error toast for a decoration would be noise on a screen that already
 * reports the list's own failure.
 */
export function useInvitationCounts() {
  const query = useQuery({
    queryKey: qk.planInvitations.counts,
    queryFn: () => planInvitationsRepository.counts(),
    staleTime: 30_000,
    retry: false,
  })

  return query.data ?? null
}

export function useSendInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { studentId: number; planId: number; message: string }) =>
      planInvitationsRepository.create(input),

    onSuccess: (invitation) => {
      queryClient.invalidateQueries({ queryKey: qk.planInvitations.all })
      // A fresh invitation changes what the search may offer: that student now
      // has one pending.
      queryClient.invalidateQueries({ queryKey: qk.studentSearch.all })
      toast.success(`Invitación enviada a ${invitation.student.name}`)
    },

    onError: (error) =>
      toast.error(errorMessage(error, "No se ha podido enviar la invitación")),
  })
}

export function useCancelInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    // 204.
    mutationFn: (invitationId: number) => planInvitationsRepository.cancel(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.planInvitations.all })
      queryClient.invalidateQueries({ queryKey: qk.studentSearch.all })
      toast.success("Invitación cancelada")
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se ha podido cancelar la invitación")),
  })
}

export function useResendInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: number) => planInvitationsRepository.resend(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.planInvitations.all })
      toast.success("Invitación reenviada")
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se ha podido reenviar la invitación")),
  })
}
