"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { qk } from "@/core/http/query-keys"
import { userMessage } from "@/core/http/user-message"
import type { BrandStatus, ProductApprovalStatus } from "@/features/brand/dto/brand.dto"

import { adminRepository } from "../api/admin.repository"

export function usePendingProducts(status: ProductApprovalStatus = "PENDING_APPROVAL") {
  return useQuery({
    queryKey: qk.admin.pendingProducts(status),
    queryFn: () => adminRepository.pendingProducts(status),
  })
}

export function useAdminBrands() {
  return useQuery({
    queryKey: qk.admin.brands,
    queryFn: () => adminRepository.brands(),
  })
}

/**
 * Moderating invalidates both namespaces.
 *
 * `admin` because the queue shrank, and `brand` because the merchant's own
 * lists changed — a moderator is often looking at both in the same session
 * while testing.
 */
export function useModerateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      status,
      reason,
    }: {
      productId: number
      status: ProductApprovalStatus
      reason?: string
    }) => adminRepository.moderate(productId, status, reason),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: qk.admin.all })
      queryClient.invalidateQueries({ queryKey: qk.brand.all })
      toast.success(
        product.approvalStatus === "APPROVED"
          ? `${product.name} ya está en el catálogo.`
          : `${product.name} fue rechazado. Le avisamos al comercio.`,
      )
    },
    onError: (error) => toast.error(userMessage(error, "save")),
  })
}

/**
 * Approves several products under one confirmation.
 *
 * Sequential and not `Promise.all`: each call is a separate write against the
 * same brand's rows, and a burst of parallel ones is how a queue of five turns
 * into a partial, unordered mess upstream. A failure does not abort the rest —
 * the moderator asked for all of them — so the result reports both halves and
 * the toast says exactly what got through.
 */
export function useBulkApproveProducts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productIds: number[]) => {
      const approved: string[] = []
      const failed: number[] = []

      for (const productId of productIds) {
        try {
          const product = await adminRepository.moderate(productId, "APPROVED")
          approved.push(product.name)
        } catch {
          failed.push(productId)
        }
      }

      return { approved, failed }
    },

    onSuccess: ({ approved, failed }) => {
      queryClient.invalidateQueries({ queryKey: qk.admin.all })
      queryClient.invalidateQueries({ queryKey: qk.brand.all })

      if (approved.length > 0) {
        toast.success(
          approved.length === 1
            ? `${approved[0]} ya está en el catálogo.`
            : `${approved.length} productos ya están en el catálogo.`,
        )
      }
      if (failed.length > 0) {
        toast.error(
          failed.length === 1
            ? "Un producto no se pudo aprobar. Siguen en la cola."
            : `${failed.length} productos no se pudieron aprobar. Siguen en la cola.`,
        )
      }
    },

    onError: (error) => toast.error(userMessage(error, "save")),
  })
}

export function useSetBrandStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ brandId, status }: { brandId: number; status: BrandStatus }) =>
      adminRepository.setBrandStatus(brandId, status),
    onSuccess: (brand) => {
      queryClient.invalidateQueries({ queryKey: qk.admin.all })
      toast.success(
        brand.status === "SUSPENDED"
          ? `${brand.displayName} quedó suspendido. Sus productos ya no aparecen en el catálogo.`
          : `${brand.displayName} vuelve a estar activo.`,
      )
    },
    onError: (error) => toast.error(userMessage(error, "save")),
  })
}

// ── Reward challenges ──────────────────────────────────────────────────────

export function usePendingChallenges(status: ProductApprovalStatus = "PENDING_APPROVAL") {
  return useQuery({
    queryKey: qk.admin.pendingChallenges(status),
    queryFn: () => adminRepository.pendingChallenges(status),
  })
}

/**
 * Aprobar o rechazar una recompensa.
 *
 * Sin aprobación en lote, a diferencia de los productos: acá cada aprobación
 * habilita moneda nueva, y la relación entre premio y esfuerzo hay que leerla una
 * por una. Un botón de "aprobar todo" sobre eso es un pie de imprenta.
 */
export function useModerateChallenge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      challengeId,
      status,
      reason,
    }: {
      challengeId: number
      status: ProductApprovalStatus
      reason?: string
    }) => adminRepository.moderateChallenge(challengeId, status, reason),
    onSuccess: (challenge) => {
      queryClient.invalidateQueries({ queryKey: qk.admin.all })
      queryClient.invalidateQueries({ queryKey: qk.brand.all })
      toast.success(
        challenge.approvalStatus === "APPROVED"
          ? `${challenge.name} ya está publicada: los alumnos pueden empezar a cumplirla.`
          : `${challenge.name} fue rechazada. Le avisamos al comercio.`,
      )
    },
    onError: (error) => toast.error(userMessage(error, "save")),
  })
}
