"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { qk } from "@/core/http/query-keys"
import { planInvitationsRepository } from "../api/plan-invitations.repository"

/**
 * The student's half of the flow, driven by the opaque token in the link.
 *
 * Deliberately separate from `use-plan-invitations`: these hooks run on a
 * public page with no session, so they must not pull in anything that assumes
 * one. They also stay quiet — `toast` belongs to the dashboard shell, and this
 * screen renders its own result inline.
 */
export function useInvitationByToken(token: string) {
  return useQuery({
    queryKey: qk.planInvitations.byToken(token),
    queryFn: () => planInvitationsRepository.getByToken(token),
    enabled: token.length > 0,
    // The link is opened once and acted on; re-fetching behind the user's back
    // could swap the offer mid-decision.
    staleTime: Infinity,
    retry: false,
  })
}

export function useAcceptInvitation(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => planInvitationsRepository.acceptByToken(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.planInvitations.byToken(token) })
    },
  })
}

export function useRejectInvitation(token: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reason: string) => planInvitationsRepository.rejectByToken(token, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.planInvitations.byToken(token) })
    },
  })
}
