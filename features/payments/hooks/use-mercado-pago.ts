"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { ApiError } from "@/core/http/errors"
import { qk } from "@/core/http/query-keys"
import { mercadoPagoRepository } from "../api/mercado-pago.repository"

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

/**
 * The trainer's Mercado Pago status.
 *
 * Read in several places — the payments screen, the plans banner, the
 * invitation wizard — so it is cached for a minute rather than re-fetched per
 * mount. `retry: false` keeps a missing endpoint from costing three round trips
 * before the screen can say so.
 */
export function useMercadoPagoConnection() {
  return useQuery({
    queryKey: qk.payments.mercadoPago,
    queryFn: () => mercadoPagoRepository.getConnection(),
    staleTime: 60_000,
    retry: false,
  })
}

/**
 * Starts the OAuth handshake by navigating to Mercado Pago.
 *
 * A full navigation, not a popup: Mercado Pago's authorisation page refuses to
 * render in an iframe, and a popup would be swallowed by blockers on the very
 * click that matters.
 */
export function useConnectMercadoPago() {
  return useMutation({
    mutationFn: (redirectPath: string) => mercadoPagoRepository.getAuthorizationUrl(redirectPath),
    onSuccess: (authorization) => {
      window.location.assign(authorization.authorizationUrl)
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se ha podido iniciar la vinculación con Mercado Pago")),
  })
}

/** Runs on the callback route with the `code` Mercado Pago handed back. */
export function useCompleteMercadoPagoAuthorization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { code: string; state: string }) =>
      mercadoPagoRepository.completeAuthorization(input),
    onSuccess: (connection) => {
      queryClient.setQueryData(qk.payments.mercadoPago, connection)
      queryClient.invalidateQueries({ queryKey: qk.payments.all })
    },
  })
}

export function useDisconnectMercadoPago() {
  const queryClient = useQueryClient()

  return useMutation({
    // 204.
    mutationFn: () => mercadoPagoRepository.disconnect(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.payments.all })
      toast.success("Cuenta de Mercado Pago desvinculada")
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se ha podido desvincular la cuenta")),
  })
}
