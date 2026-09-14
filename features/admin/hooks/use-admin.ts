"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { qk } from "@/core/http/query-keys"
import { userMessage } from "@/core/http/user-message"
import type { BrandStatus } from "@/features/brand/dto/brand.dto"

import { adminRepository } from "../api/admin.repository"

export function useAdminBrands() {
  return useQuery({
    queryKey: qk.admin.brands,
    queryFn: () => adminRepository.brands(),
  })
}

/**
 * Suspender o reactivar invalida también `challenges`.
 *
 * Un comercio suspendido desaparece del catálogo con todos sus desafíos, así que
 * cualquier lista de desafíos abierta en otra pestaña está mostrando algo que ya
 * no es cierto.
 */
export function useSetBrandStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ brandId, status }: { brandId: number; status: BrandStatus }) =>
      adminRepository.setBrandStatus(brandId, status),
    onSuccess: (brand) => {
      queryClient.invalidateQueries({ queryKey: qk.admin.all })
      queryClient.invalidateQueries({ queryKey: qk.challenges.all })
      toast.success(
        brand.status === "SUSPENDED"
          ? "Comercio suspendido. Sus desafíos ya no aparecen en la app."
          : "Comercio reactivado.",
      )
    },
    onError: (error) => toast.error(userMessage(error, "save")),
  })
}
