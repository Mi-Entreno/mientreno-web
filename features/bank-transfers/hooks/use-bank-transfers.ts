"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { qk } from "@/core/http/query-keys"
import { ApiError } from "@/core/http/errors"
import { specificMessage } from "@/core/http/user-message"
import { bankTransfersRepository, type PaymentFilters } from "../api/bank-transfers.repository"

function errorMessage(error: unknown, fallback: string): string {
  return specificMessage(error) ?? fallback
}

/** 404 on the bank details means "not filled in yet", which is not a failure. */
function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404
}

export function useTrainerPayments(filters: PaymentFilters) {
  return useQuery({
    queryKey: qk.payments.list({
      provider: filters.provider ?? null,
      status: filters.status ?? null,
      page: filters.page ?? 0,
      size: filters.size ?? null,
    }),
    queryFn: () => bankTransfersRepository.list(filters),
    // A charge the trainer is waiting on can land at any moment, and this is
    // the screen they sit on while waiting.
    staleTime: 15_000,
  })
}

export function usePendingReviewCount() {
  return useQuery({
    queryKey: qk.payments.pendingReview,
    queryFn: () => bankTransfersRepository.pendingReviewCount(),
    staleTime: 30_000,
    retry: false,
  })
}

/**
 * The trainer's own bank details.
 *
 * A 404 is the normal "not filled in yet" answer, not a failure — the form
 * renders empty for it. `retry: false` keeps that from costing three round
 * trips, and the hook reports it as `isMissing` rather than as an error.
 */
export function useBankTransferInfo() {
  const query = useQuery({
    queryKey: qk.payments.bankInfo,
    queryFn: () => bankTransfersRepository.getInfo(),
    retry: false,
  })

  return { ...query, isMissing: query.isError && isNotFound(query.error) }
}

export function useSaveBankTransferInfo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: bankTransfersRepository.saveInfo,
    onSuccess: (info) => {
      queryClient.setQueryData(qk.payments.bankInfo, info)
      queryClient.invalidateQueries({ queryKey: qk.payments.all })
      toast.success("Datos bancarios guardados")
    },
    onError: (error) => toast.error(errorMessage(error, "No pudimos guardar los datos bancarios")),
  })
}

export function useDeleteBankTransferInfo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => bankTransfersRepository.deleteInfo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.payments.all })
      toast.success("Dejaste de aceptar transferencias")
    },
    onError: (error) => toast.error(errorMessage(error, "No pudimos eliminar los datos bancarios")),
  })
}

/**
 * Approving and rejecting share `onSettled`: both resolve the payment, and both
 * change the student's roster — an approval activates the subscription, so the
 * students list is stale too.
 */
export function useApprovePayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paymentId: number) => bankTransfersRepository.approve(paymentId),
    onSuccess: () => toast.success("Pago aprobado. El plan del alumno quedó activo."),
    onError: (error) => toast.error(errorMessage(error, "No pudimos aprobar el pago")),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.payments.all })
      queryClient.invalidateQueries({ queryKey: qk.students.all })
    },
  })
}

export function useRejectPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: number; reason: string }) =>
      bankTransfersRepository.reject(paymentId, reason),
    onSuccess: () => toast.success("Comprobante rechazado. El alumno puede cargar otro."),
    onError: (error) => toast.error(errorMessage(error, "No pudimos rechazar el comprobante")),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qk.payments.all })
      queryClient.invalidateQueries({ queryKey: qk.students.all })
    },
  })
}
