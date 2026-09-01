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
