"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { userMessage, type FailureContext } from "@/core/http/user-message"
import { qk } from "@/core/http/query-keys"

import { brandRepository } from "../api/brand.repository"
import type { ProductApprovalStatus, RedemptionStatus, SaveProductInput } from "../dto/brand.dto"

export function useBrandProfile() {
  return useQuery({
    queryKey: qk.brand.profile,
    queryFn: () => brandRepository.profile(),
  })
}

export function useBrandProducts(status?: ProductApprovalStatus) {
  return useQuery({
    queryKey: qk.brand.products(status),
    queryFn: () => brandRepository.products(status),
  })
}

export function useBrandProduct(id: number) {
  return useQuery({
    queryKey: qk.brand.product(id),
    queryFn: () => brandRepository.product(id),
    enabled: Number.isFinite(id),
  })
}

/**
 * Every mutation invalidates the whole `brand` namespace.
 *
 * Finer keys would be wrong more often than they would be fast: submitting a
 * product moves it between two filtered lists, and a status change on a
 * redemption changes both the inbox and its filtered views. The panel holds a
 * handful of rows, so a refetch costs nothing next to showing a stale state.
 */
function useBrandMutation<TArgs, TResult>(
  mutationFn: (args: TArgs) => Promise<TResult>,
  successMessage: (result: TResult) => string,
  context: FailureContext,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: qk.brand.all })
      toast.success(successMessage(result))
    },
    onError: (error) => toast.error(userMessage(error, context)),
  })
}

export function useCreateProduct() {
  return useBrandMutation(
    (input: SaveProductInput) => brandRepository.createProduct(input),
    () => "Producto creado como borrador. Subile una imagen para poder enviarlo a revisión.",
    "save",
  )
}

export function useUpdateProduct() {
  return useBrandMutation(
    ({ id, input }: { id: number; input: SaveProductInput }) =>
      brandRepository.updateProduct(id, input),
    (product) =>
      product.approvalStatus === "PENDING_APPROVAL"
        ? "Guardado. Como cambiaste la oferta, vuelve a revisión."
        : "Producto guardado.",
    "save",
  )
}

export function useSubmitProduct() {
  return useBrandMutation(
    (id: number) => brandRepository.submitProduct(id),
    (product) =>
      product.approvalStatus === "APPROVED"
        ? "Producto publicado."
        : "Enviado a revisión. Te avisamos cuando lo aprobemos.",
    "send",
  )
}

export function useAdjustStock() {
  return useBrandMutation(
    ({ id, delta, reason }: { id: number; delta: number; reason?: string }) =>
      brandRepository.adjustStock(id, delta, reason),
    (product) => `Stock actualizado: ${product.stock} ${product.stock === 1 ? "unidad" : "unidades"}.`,
    "save",
  )
}

export function useSetProductActive() {
  return useBrandMutation(
    ({ id, active }: { id: number; active: boolean }) => brandRepository.setProductActive(id, active),
    (product) => (product.active ? "Producto reanudado." : "Producto pausado."),
    "save",
  )
}

export function useUploadProductImage() {
  return useBrandMutation(
    ({ id, file }: { id: number; file: File }) => brandRepository.uploadProductImage(id, file),
    (product) =>
      product.approvalStatus === "PENDING_APPROVAL"
        ? "Imagen actualizada. Como cambiaste la oferta, vuelve a revisión."
        : "Imagen actualizada.",
    "upload",
  )
}

export function useBrandRedemptions(status?: RedemptionStatus) {
  return useQuery({
    queryKey: qk.brand.redemptions(status),
    queryFn: () => brandRepository.redemptions(status),
  })
}

export function useChangeRedemptionStatus() {
  return useBrandMutation(
    ({ id, status, reason }: { id: number; status: RedemptionStatus; reason?: string }) =>
      brandRepository.changeRedemptionStatus(id, status, reason),
    (redemption) =>
      redemption.status === "CANCELLED"
        ? "Canje cancelado. Le devolvimos las repes al alumno."
        : redemption.status === "READY"
          ? "Marcado como listo. Le avisamos al alumno."
          : "Canje entregado.",
    "save",
  )
}

export function useUpdateBrandProfile() {
  return useBrandMutation(
    (input: Parameters<typeof brandRepository.updateProfile>[0]) =>
      brandRepository.updateProfile(input),
    () => "Perfil actualizado.",
    "save",
  )
}
