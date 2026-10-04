"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRef } from "react"
import { toast } from "sonner"

import { qk } from "@/core/http/query-keys"
import { specificMessage } from "@/core/http/user-message"
import { membershipRepository } from "../api/membership.repository"
import { findFeature, isSettled, type MyMembership } from "../model/membership.model"

/**
 * What the trainer's plan unlocks. Read by every gate on every screen, so it is
 * cached for a minute; anything that changes the membership invalidates
 * `qk.membership.all`. Paint-only: the backend re-checks each action.
 */
export function useEntitlements() {
  return useQuery({
    queryKey: qk.membership.entitlements,
    queryFn: ({ signal }) => membershipRepository.entitlements(signal),
    staleTime: 60_000,
    retry: false,
  })
}

/** One feature, plus whether the answer is known yet — so a gate never flashes the paywall while loading. */
export function useFeature(code: string) {
  const entitlements = useEntitlements()
  return {
    feature: findFeature(entitlements.data, code),
    isLoading: entitlements.isLoading,
    isError: entitlements.isError,
  }
}

/**
 * The membership in progress, if any.
 *
 * `pollUntilSettled` is for the return from Mercado Pago: the webhook that
 * activates the membership can land a few seconds after the trainer does, so
 * the page re-reads every three seconds until it sees ACTIVE or TRIALING.
 */
export function useMyMembership(options: { pollUntilSettled?: boolean } = {}) {
  return useQuery({
    queryKey: qk.membership.me,
    queryFn: ({ signal }) => membershipRepository.me(signal),
    retry: false,
    refetchInterval: options.pollUntilSettled
      ? (query) => (isSettled(query.state.data as MyMembership | undefined) ? false : 3_000)
      : false,
  })
}

export function useMembershipPlans() {
  return useQuery({
    queryKey: qk.membership.plans,
    queryFn: ({ signal }) => membershipRepository.plans(signal),
    staleTime: 5 * 60_000,
    retry: false,
  })
}

export function useMembershipPayments() {
  return useQuery({
    queryKey: qk.membership.payments,
    queryFn: ({ signal }) => membershipRepository.payments(signal),
    retry: false,
  })
}

/**
 * Starts the payment and sends the trainer to Mercado Pago.
 *
 * The idempotency key is per price and lives as long as the screen does: a
 * double click, or a retry after the provider timed out, reuses it, and the
 * backend answers with the same checkout instead of creating a second one.
 */
export function useCheckout() {
  const keys = useRef(new Map<number, string>())

  return useMutation({
    mutationFn: (priceId: number) => {
      let key = keys.current.get(priceId)
      if (!key) {
        key = crypto.randomUUID()
        keys.current.set(priceId, key)
      }
      return membershipRepository.checkout(priceId, key)
    },
    onSuccess: (checkout) => {
      if (checkout.checkoutUrl) {
        // A full navigation: Mercado Pago's checkout refuses to render in an iframe.
        window.location.assign(checkout.checkoutUrl)
      } else {
        toast.error("No pudimos abrir el pago. Volvé a intentarlo en unos minutos.")
      }
    },
    onError: (error) => toast.error(specificMessage(error) ?? "No pudimos iniciar el pago"),
  })
}

export function useCancelMembership() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (reason?: string) => membershipRepository.cancel(reason),
    onSuccess: (me) => {
      queryClient.setQueryData(qk.membership.me, me)
      queryClient.invalidateQueries({ queryKey: qk.membership.all })
      toast.success("Listo, no se va a renovar")
    },
    onError: (error) => toast.error(specificMessage(error) ?? "No pudimos darte de baja"),
  })
}

export function useResumeMembership() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => membershipRepository.resume(),
    onSuccess: (me) => {
      queryClient.setQueryData(qk.membership.me, me)
      queryClient.invalidateQueries({ queryKey: qk.membership.all })
      toast.success("Tu plan se va a renovar normalmente")
    },
    onError: (error) => toast.error(specificMessage(error) ?? "No pudimos reactivar tu plan"),
  })
}
